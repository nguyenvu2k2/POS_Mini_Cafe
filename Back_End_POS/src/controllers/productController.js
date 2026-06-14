const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const {
  Category,
  Ingredient,
  Product,
  ProductImage,
  ProductVariant,
  Recipe,
  sequelize,
} = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');

const getProductIncludes = (includeQuery) => {
  const requested = String(includeQuery || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const includes = [{ model: Category, as: 'category' }];

  if (requested.includes('variants') || requested.includes('recipes')) {
    const variantInclude = { model: ProductVariant, as: 'variants' };

    if (requested.includes('recipes')) {
      variantInclude.include = [
        {
          model: Recipe,
          as: 'recipes',
          include: [{ model: Ingredient, as: 'ingredient' }],
        },
      ];
    }

    includes.push(variantInclude);
  }

  if (requested.includes('images')) {
    includes.push({
      model: ProductImage,
      as: 'images',
      required: false,
      where: { is_primary: true },
    });
  }

  return includes;
};

const getRecipeItems = (payload) => payload.ingredients || payload.recipes || [];
const maxProductImageBytes = 3 * 1024 * 1024;
const imageMimeExtensions = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const imageBase64Pattern = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i;

const normalizeImageBase64 = (payload) => {
  const imageBase64 = payload.image_base64;

  if (typeof imageBase64 !== 'string') {
    return '';
  }

  return imageBase64.trim();
};

const createProductImageFilename = (extension) =>
  `${Date.now()}-${crypto.randomUUID()}${extension}`;

const resolveUploadDir = () => path.join(process.cwd(), 'uploads', 'products');

const saveBase64ProductImage = async (imageBase64) => {
  const match = imageBase64Pattern.exec(imageBase64);

  if (!match) {
    throw new HttpError(400, 'Anh san pham phai la base64 data URL hop le');
  }

  const mimeType = match[1].toLowerCase();
  const extension = imageMimeExtensions[mimeType];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length > maxProductImageBytes) {
    throw new HttpError(400, 'Anh san pham khong duoc vuot qua 3MB');
  }

  const filename = createProductImageFilename(extension);
  const uploadDir = resolveUploadDir();
  await fs.promises.mkdir(uploadDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/products/${filename}`;
};

const resolveProductImageUrl = async (req) => {
  if (req.file) {
    return `/uploads/products/${req.file.filename}`;
  }

  const imageBase64 = normalizeImageBase64(req.body);

  if (!imageBase64) {
    return '';
  }

  return saveBase64ProductImage(imageBase64);
};

const deleteLocalProductImageFiles = async (urls) => {
  const uploadDir = resolveUploadDir();

  await Promise.all(
    urls
      .filter((url) => typeof url === 'string' && url.startsWith('/uploads/products/'))
      .map(async (url) => {
        const filePath = path.resolve(uploadDir, path.basename(url));

        if (!filePath.startsWith(path.resolve(uploadDir))) {
          return;
        }

        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`Khong the xoa anh cu ${url}: ${error.message}`);
          }
        }
      }),
  );
};

const normalizeRecipeItems = (payload) => {
  const recipes = getRecipeItems(payload);

  if (!Array.isArray(recipes)) {
    throw new HttpError(400, 'recipes phai la mang');
  }

  return recipes.map((item) => ({
    ingredient_id: Number(item.ingredient_id),
    quantity_required: Number(item.quantity_required),
  }));
};

const assertIngredientsAvailable = async (recipes, transaction) => {
  const ingredientIds = [...new Set(recipes.map((item) => item.ingredient_id))];

  if (ingredientIds.length === 0) {
    return;
  }

  const ingredients = await Ingredient.findAll({
    where: { id: { [Op.in]: ingredientIds } },
    transaction,
  });

  if (ingredients.length !== ingredientIds.length) {
    throw new HttpError(422, 'Co nguyen lieu khong ton tai');
  }

  const inactiveIngredients = ingredients.filter((ingredient) => !ingredient.is_active);

  if (inactiveIngredients.length > 0) {
    throw new HttpError(
      422,
      'Nguyen lieu da an khong the them vao cong thuc san pham',
      inactiveIngredients.map((ingredient) => ({
        ingredient_id: ingredient.id,
        name: ingredient.name,
      })),
    );
  }
};

const replaceVariantRecipes = async (variantId, recipes, transaction) => {
  await assertIngredientsAvailable(recipes, transaction);

  await Recipe.destroy({
    where: { variant_id: variantId },
    transaction,
  });

  if (recipes.length === 0) {
    return;
  }

  await Recipe.bulkCreate(
    recipes.map((item) => ({
      variant_id: variantId,
      ingredient_id: item.ingredient_id,
      quantity_required: item.quantity_required,
    })),
    { transaction },
  );
};

const listProducts = async (req, res) => {
  const where = {};

  if (req.query.category_id) {
    where.category_id = req.query.category_id;
  }

  if (req.query.is_active !== undefined) {
    where.is_active = req.query.is_active === 'true';
  }

  const products = await Product.findAll({
    where,
    include: getProductIncludes(req.query.include),
    order: [['id', 'DESC']],
  });

  return sendSuccess(res, products);
};

const getProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      { model: Category, as: 'category' },
      { model: ProductVariant, as: 'variants' },
      { model: ProductImage, as: 'images' },
    ],
  });

  if (!product) {
    throw new HttpError(404, 'Khong tim thay san pham');
  }

  return sendSuccess(res, product);
};

const createProduct = async (req, res) => {
  const createdProduct = await sequelize.transaction(async (transaction) => {
    const category = await Category.findByPk(req.body.category_id, {
      transaction,
    });

    if (!category) {
      throw new HttpError(422, 'Category khong ton tai');
    }

    const product = await Product.create(
      {
        category_id: req.body.category_id,
        name: req.body.name,
        description: req.body.description || null,
        is_active: req.body.is_active === undefined ? true : req.body.is_active,
      },
      { transaction },
    );

    if (Array.isArray(req.body.variants) && req.body.variants.length > 0) {
      for (const item of req.body.variants) {
        const variant = await ProductVariant.create(
          {
            product_id: product.id,
            name: item.name,
            price: item.price,
            is_available:
              item.is_available === undefined ? true : item.is_available,
          },
          { transaction },
        );
        const recipes = normalizeRecipeItems(item);
        await replaceVariantRecipes(variant.id, recipes, transaction);
      }
    }

    return product;
  });

  const product = await Product.findByPk(createdProduct.id, {
    include: [
      { model: Category, as: 'category' },
      { model: ProductVariant, as: 'variants' },
    ],
  });

  return sendSuccess(res, product, undefined, 201);
};

const updateProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new HttpError(404, 'Khong tim thay san pham');
  }

  const fields = ['category_id', 'name', 'description', 'is_active'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  await product.save();

  return sendSuccess(res, product);
};

const addProductImage = async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    throw new HttpError(404, 'Khong tim thay san pham');
  }

  const imageUrl = await resolveProductImageUrl(req);

  if (!imageUrl) {
    throw new HttpError(400, 'Vui long gui anh san pham');
  }

  const isPrimary =
    req.body.is_primary === 'true' || req.body.is_primary === true;

  const oldImageUrls = [];
  const image = await sequelize.transaction(async (transaction) => {
    if (isPrimary) {
      const oldImages = await ProductImage.findAll({
        where: { product_id: product.id },
        transaction,
      });
      oldImageUrls.push(...oldImages.map((item) => item.url));

      await ProductImage.destroy({
        where: { product_id: product.id },
        transaction,
      });
    }

    return ProductImage.create(
      {
        product_id: product.id,
        url: imageUrl,
        is_primary: isPrimary,
        sort_order: Number(req.body.sort_order || 0),
      },
      { transaction },
    );
  });

  await deleteLocalProductImageFiles(oldImageUrls);

  return sendSuccess(res, image, undefined, 201);
};

const createVariant = async (req, res) => {
  const createdVariant = await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(req.params.id, { transaction });

    if (!product) {
      throw new HttpError(404, 'Khong tim thay san pham');
    }

    const variant = await ProductVariant.create(
      {
        product_id: product.id,
        name: req.body.name,
        price: req.body.price,
        is_available:
          req.body.is_available === undefined ? true : req.body.is_available,
      },
      { transaction },
    );
    const recipes = normalizeRecipeItems(req.body);
    await replaceVariantRecipes(variant.id, recipes, transaction);

    return variant;
  });

  return sendSuccess(res, createdVariant, undefined, 201);
};

const updateVariant = async (req, res) => {
  const variant = await ProductVariant.findOne({
    where: { id: req.params.vid, product_id: req.params.id },
  });

  if (!variant) {
    throw new HttpError(404, 'Khong tim thay variant');
  }

  const fields = ['name', 'price', 'is_available'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      variant[field] = req.body[field];
    }
  }

  await variant.save();

  return sendSuccess(res, variant);
};

const assertVariantBelongsToProduct = async (
  productId,
  variantId,
  transaction = undefined,
) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, product_id: productId },
    transaction,
  });

  if (!variant) {
    throw new HttpError(404, 'Khong tim thay variant cua san pham');
  }

  return variant;
};

const getVariantRecipe = async (req, res) => {
  await assertVariantBelongsToProduct(req.params.id, req.params.vid);

  const recipes = await Recipe.findAll({
    where: { variant_id: req.params.vid },
    include: [{ model: Ingredient, as: 'ingredient' }],
    order: [['ingredient_id', 'ASC']],
  });

  return sendSuccess(res, recipes);
};

const updateVariantRecipe = async (req, res) => {
  const recipes = normalizeRecipeItems(req.body);

  await sequelize.transaction(async (transaction) => {
    await assertVariantBelongsToProduct(
      req.params.id,
      req.params.vid,
      transaction,
    );

    await replaceVariantRecipes(req.params.vid, recipes, transaction);
  });

  const updatedRecipes = await Recipe.findAll({
    where: { variant_id: req.params.vid },
    include: [{ model: Ingredient, as: 'ingredient' }],
  });

  return sendSuccess(res, updatedRecipes);
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  addProductImage,
  createVariant,
  updateVariant,
  getVariantRecipe,
  updateVariantRecipe,
};
