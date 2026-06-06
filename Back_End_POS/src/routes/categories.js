const express = require('express');
const { body, param, query } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get(
  '/',
  verifyToken,
  requireRole('admin', 'cashier', 'barista'),
  [query('is_active').optional().isBoolean()],
  validate,
  asyncHandler(categoryController.listCategories),
);

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('name').trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('sort_order').optional().isInt(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(categoryController.createCategory),
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('description').optional({ nullable: true }).isString(),
    body('sort_order').optional().isInt(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(categoryController.updateCategory),
);

module.exports = router;
