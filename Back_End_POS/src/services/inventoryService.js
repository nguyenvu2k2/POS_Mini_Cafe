const { Op } = require('sequelize');
const {
  Ingredient,
  InventoryLog,
  Product,
  ProductVariant,
  Recipe,
} = require('../models');
const HttpError = require('../utils/httpError');
const { toDecimalString, toNumber } = require('../utils/number');

const normalizeItems = (items) =>
  items.map((item) => ({
    variant_id: Number(item.variant_id),
    quantity: Number(item.quantity),
  }));

const buildRequiredIngredients = async (items, transaction) => {
  const normalizedItems = normalizeItems(items);
  const variantIds = [
    ...new Set(normalizedItems.map((item) => item.variant_id)),
  ];

  if (variantIds.length === 0) {
    return [];
  }

  const recipes = await Recipe.findAll({
    where: { variant_id: { [Op.in]: variantIds } },
    transaction,
  });
  const recipeVariantIds = new Set(
    recipes.map((recipe) => Number(recipe.variant_id)),
  );
  const missingRecipeVariantIds = variantIds.filter(
    (variantId) => !recipeVariantIds.has(variantId),
  );

  if (missingRecipeVariantIds.length > 0) {
    const variants = await ProductVariant.findAll({
      where: { id: { [Op.in]: missingRecipeVariantIds } },
      include: [{ model: Product, as: 'product' }],
      transaction,
    });

    throw new HttpError(
      422,
      'San pham chua cau hinh cong thuc nguyen lieu',
      variants.map((variant) => ({
        variant_id: variant.id,
        product_name: variant.product?.name || null,
        variant_name: variant.name,
      })),
    );
  }

  const quantityByVariant = normalizedItems.reduce((acc, item) => {
    acc.set(item.variant_id, (acc.get(item.variant_id) || 0) + item.quantity);
    return acc;
  }, new Map());

  const requiredByIngredient = new Map();

  for (const recipe of recipes) {
    const orderQuantity = quantityByVariant.get(Number(recipe.variant_id)) || 0;
    const requiredQuantity = toNumber(recipe.quantity_required) * orderQuantity;

    if (requiredQuantity <= 0) {
      continue;
    }
    const currentQuantity =
      requiredByIngredient.get(Number(recipe.ingredient_id)) || 0;

    requiredByIngredient.set(
      Number(recipe.ingredient_id),
      currentQuantity + requiredQuantity,
    );
  }

  return [...requiredByIngredient.entries()].map(
    ([ingredient_id, required_quantity]) => ({
      ingredient_id,
      required_quantity,
    }),
  );
};

const loadIngredientsForUpdate = async (requiredIngredients, transaction) => {
  const ingredientIds = requiredIngredients.map((item) => item.ingredient_id);

  if (ingredientIds.length === 0) {
    return new Map();
  }

  const ingredients = await Ingredient.findAll({
    where: { id: { [Op.in]: ingredientIds } },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  return new Map(
    ingredients.map((ingredient) => [Number(ingredient.id), ingredient]),
  );
};

const assertEnoughStock = (requiredIngredients, ingredientMap) => {
  const inactiveItems = [];
  const shortages = [];

  for (const item of requiredIngredients) {
    const ingredient = ingredientMap.get(item.ingredient_id);
    const stockQuantity = toNumber(ingredient?.stock_quantity);

    if (ingredient && !ingredient.is_active) {
      inactiveItems.push({
        ingredient_id: item.ingredient_id,
        name: ingredient.name,
      });
      continue;
    }

    if (!ingredient || stockQuantity < item.required_quantity) {
      shortages.push({
        ingredient_id: item.ingredient_id,
        name: ingredient?.name || null,
        stock_quantity: stockQuantity,
        required_quantity: item.required_quantity,
        missing_quantity: Math.max(item.required_quantity - stockQuantity, 0),
      });
    }
  }

  if (inactiveItems.length > 0) {
    throw new HttpError(
      422,
      'Don hang co nguyen lieu da an, khong the hoan thanh',
      inactiveItems,
    );
  }

  if (shortages.length > 0) {
    throw new HttpError(422, 'Khong du ton kho nguyen lieu', shortages);
  }
};

const deductStock = async (items, { transaction, userId, orderId }) => {
  const requiredIngredients = await buildRequiredIngredients(
    items,
    transaction,
  );

  if (requiredIngredients.length === 0) {
    return [];
  }

  const ingredientMap = await loadIngredientsForUpdate(
    requiredIngredients,
    transaction,
  );
  assertEnoughStock(requiredIngredients, ingredientMap);

  const logs = [];

  // Tru kho theo recipe cua tung variant, gom chung theo nguyen lieu de tranh tru lap.
  for (const item of requiredIngredients) {
    const ingredient = ingredientMap.get(item.ingredient_id);
    const nextQuantity =
      toNumber(ingredient.stock_quantity) - item.required_quantity;

    ingredient.stock_quantity = toDecimalString(nextQuantity);
    await ingredient.save({ transaction });

    logs.push({
      ingredient_id: item.ingredient_id,
      action_type: 'export_sale',
      quantity_change: toDecimalString(-item.required_quantity),
      note: `Ban hang order #${orderId}`,
      user_id: userId,
      order_id: orderId,
    });
  }

  await InventoryLog.bulkCreate(logs, { transaction });

  return logs;
};

const hasActiveStockDeduction = async (orderId, transaction) => {
  const netQuantityChange = toNumber(
    await InventoryLog.sum('quantity_change', {
      where: { order_id: orderId },
      transaction,
    }),
  );

  return netQuantityChange < 0;
};

const restoreStock = async (
  items,
  { transaction, userId, orderId, note = 'Hoan kho don hang' },
) => {
  const requiredIngredients = await buildRequiredIngredients(
    items,
    transaction,
  );

  if (requiredIngredients.length === 0) {
    return [];
  }

  const ingredientMap = await loadIngredientsForUpdate(
    requiredIngredients,
    transaction,
  );
  const logs = [];

  // Hoan kho khi huy/sua don: quantity_change duong de doi soat ton kho.
  for (const item of requiredIngredients) {
    const ingredient = ingredientMap.get(item.ingredient_id);

    if (!ingredient) {
      throw new HttpError(422, 'Cong thuc co nguyen lieu khong ton tai', [
        { ingredient_id: item.ingredient_id },
      ]);
    }

    const nextQuantity =
      toNumber(ingredient.stock_quantity) + item.required_quantity;

    ingredient.stock_quantity = toDecimalString(nextQuantity);
    await ingredient.save({ transaction });

    logs.push({
      ingredient_id: item.ingredient_id,
      action_type: 'adjustment',
      quantity_change: toDecimalString(item.required_quantity),
      note,
      user_id: userId,
      order_id: orderId,
    });
  }

  await InventoryLog.bulkCreate(logs, { transaction });

  return logs;
};

module.exports = {
  buildRequiredIngredients,
  deductStock,
  hasActiveStockDeduction,
  restoreStock,
};
