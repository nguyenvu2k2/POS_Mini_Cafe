const express = require('express');
const { body, param, query } = require('express-validator');
const ingredientController = require('../controllers/ingredientController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/',
  requireRole('admin', 'barista'),
  [
    query('low_stock').optional().isBoolean(),
    query('is_active').optional().isBoolean(),
  ],
  validate,
  asyncHandler(ingredientController.listIngredients),
);

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty(),
    body('unit').trim().notEmpty(),
    body('stock_quantity').optional().isFloat({ min: 0 }),
    body('min_stock').optional().isFloat({ min: 0 }),
    body('cost_per_unit').optional({ nullable: true }).isFloat({ min: 0 }),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(ingredientController.createIngredient),
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('unit').optional().trim().notEmpty(),
    body('stock_quantity').optional().isFloat({ min: 0 }),
    body('min_stock').optional().isFloat({ min: 0 }),
    body('cost_per_unit').optional({ nullable: true }).isFloat({ min: 0 }),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(ingredientController.updateIngredient),
);

router.post(
  '/:id/import',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('quantity').isFloat({ min: 0.001 }),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(ingredientController.importIngredient),
);

router.post(
  '/:id/adjust',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('actual_quantity').isFloat({ min: 0 }),
    body('unit').optional().trim().notEmpty(),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(ingredientController.adjustIngredient),
);

router.get(
  '/:id/logs',
  requireRole('admin', 'barista'),
  [
    param('id').isInt({ min: 1 }),
    query('action_type')
      .optional()
      .isIn(['import', 'export_sale', 'export_waste', 'adjustment']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1 }),
  ],
  validate,
  asyncHandler(ingredientController.getIngredientLogs),
);

module.exports = router;
