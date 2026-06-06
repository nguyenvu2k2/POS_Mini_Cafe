const express = require('express');
const { body, param, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/',
  requireRole('admin', 'cashier', 'barista'),
  [
    query('status').optional().isString(),
    query('date').optional().isISO8601(),
    query('user_id').optional().isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1 }),
  ],
  validate,
  asyncHandler(orderController.listOrders),
);

router.post(
  '/',
  requireRole('admin', 'cashier'),
  [
    body('customer_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('note').optional({ nullable: true }).isString(),
    body('table_no').optional({ nullable: true }).isString(),
    body('items').isArray({ min: 1 }),
    body('items.*.variant_id').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.note').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(orderController.createOrder),
);

router.get(
  '/:id',
  requireRole('admin', 'cashier', 'barista'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(orderController.getOrder),
);

router.put(
  '/:id/status',
  requireRole('admin', 'cashier', 'barista'),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn([
      'pending',
      'preparing',
      'ready',
      'completed',
      'cancelled',
    ]),
  ],
  validate,
  asyncHandler(orderController.updateStatus),
);

router.put(
  '/:id/items',
  requireRole('admin', 'cashier'),
  [
    param('id').isInt({ min: 1 }),
    body('items').isArray({ min: 1 }),
    body('items.*.variant_id').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.note').optional({ nullable: true }).isString(),
    body('discount').optional().isFloat({ min: 0 }),
  ],
  validate,
  asyncHandler(orderController.updateItems),
);

router.post(
  '/:id/cancel',
  requireRole('admin', 'cashier'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(orderController.cancelOrder),
);

module.exports = router;
