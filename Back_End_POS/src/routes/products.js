const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
const maxProductImageBase64Length = Math.ceil((3 * 1024 * 1024 * 4) / 3) + 128;
const productImageBase64Pattern = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i;
const allowedImageMimeTypes = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/webp']);

const isProductImageBase64 = (value) =>
  typeof value === 'string' && productImageBase64Pattern.test(value.trim());

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(process.cwd(), 'uploads', 'products')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      return cb(new Error('File upload phai la anh'));
    }
    return cb(null, true);
  },
});

router.get(
  '/',
  verifyToken,
  requireRole('admin', 'cashier', 'barista'),
  [
    query('category_id').optional().isInt({ min: 1 }),
    query('is_active').optional().isBoolean(),
    query('include').optional().isString(),
  ],
  validate,
  asyncHandler(productController.listProducts),
);

router.get(
  '/:id',
  verifyToken,
  requireRole('admin', 'cashier', 'barista'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(productController.getProduct),
);

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('category_id').isInt({ min: 1 }),
    body('name').trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('is_active').optional().isBoolean().toBoolean(),
    body('variants').optional().isArray(),
    body('variants.*.name').optional().trim().notEmpty(),
    body('variants.*.price').optional().isFloat({ min: 0 }),
    body('variants.*.is_available').optional().isBoolean().toBoolean(),
    body('variants.*.recipes').optional().isArray(),
    body('variants.*.ingredients').optional().isArray(),
    body('variants.*.recipes.*.ingredient_id').optional().isInt({ min: 1 }),
    body('variants.*.recipes.*.quantity_required')
      .optional()
      .isFloat({ min: 0.001 }),
    body('variants.*.ingredients.*.ingredient_id')
      .optional()
      .isInt({ min: 1 }),
    body('variants.*.ingredients.*.quantity_required')
      .optional()
      .isFloat({ min: 0.001 }),
  ],
  validate,
  asyncHandler(productController.createProduct),
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(productController.updateProduct),
);

router.post(
  '/:id/images',
  verifyToken,
  requireRole('admin'),
  upload.single('image'),
  [
    param('id').isInt({ min: 1 }),
    body('image_base64')
      .optional()
      .isLength({ max: maxProductImageBase64Length })
      .withMessage('Anh san pham khong duoc vuot qua 3MB')
      .custom((value) => {
        if (!isProductImageBase64(value)) {
          throw new Error('Anh san pham phai la base64 data URL hop le');
        }

        return true;
      }),
    body('is_primary').optional().isBoolean().toBoolean(),
    body('sort_order').optional().isInt(),
  ],
  validate,
  asyncHandler(productController.addProductImage),
);

router.post(
  '/:id/variants',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('is_available').optional().isBoolean().toBoolean(),
    body('recipes').optional().isArray(),
    body('ingredients').optional().isArray(),
    body('recipes.*.ingredient_id').optional().isInt({ min: 1 }),
    body('recipes.*.quantity_required').optional().isFloat({ min: 0.001 }),
    body('ingredients.*.ingredient_id').optional().isInt({ min: 1 }),
    body('ingredients.*.quantity_required')
      .optional()
      .isFloat({ min: 0.001 }),
  ],
  validate,
  asyncHandler(productController.createVariant),
);

router.put(
  '/:id/variants/:vid',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    param('vid').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('is_available').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(productController.updateVariant),
);

router.get(
  '/:id/variants/:vid/recipe',
  verifyToken,
  requireRole('admin', 'cashier', 'barista'),
  [param('id').isInt({ min: 1 }), param('vid').isInt({ min: 1 })],
  validate,
  asyncHandler(productController.getVariantRecipe),
);

router.put(
  '/:id/variants/:vid/recipe',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    param('vid').isInt({ min: 1 }),
    body('ingredients').optional().isArray(),
    body('recipes').optional().isArray(),
    body('ingredients.*.ingredient_id').optional().isInt({ min: 1 }),
    body('ingredients.*.quantity_required')
      .optional()
      .isFloat({ min: 0.001 }),
    body('recipes.*.ingredient_id').optional().isInt({ min: 1 }),
    body('recipes.*.quantity_required').optional().isFloat({ min: 0.001 }),
  ],
  validate,
  asyncHandler(productController.updateVariantRecipe),
);

module.exports = router;
