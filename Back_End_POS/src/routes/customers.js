const express = require('express');
const { body, param, query } = require('express-validator');
const customerController = require('../controllers/customerController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/',
  requireRole('admin', 'cashier'),
  [query('q').optional().isString()],
  validate,
  asyncHandler(customerController.listCustomers),
);

router.post(
  '/',
  requireRole('admin', 'cashier'),
  [
    body('name').trim().notEmpty(),
    body('phone').optional({ nullable: true }).isString(),
    body('email').optional({ nullable: true }).isEmail(),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(customerController.createCustomer),
);

router.get(
  '/:id',
  requireRole('admin', 'cashier'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(customerController.getCustomer),
);

router.put(
  '/:id',
  requireRole('admin', 'cashier'),
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('phone').optional({ nullable: true }).isString(),
    body('email').optional({ nullable: true }).isEmail(),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  asyncHandler(customerController.updateCustomer),
);

router.get(
  '/:id/orders',
  requireRole('admin', 'cashier'),
  [
    param('id').isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1 }),
  ],
  validate,
  asyncHandler(customerController.getCustomerOrders),
);

router.put(
  '/:id/points',
  requireRole('admin'),
  [param('id').isInt({ min: 1 }), body('loyalty_points').isInt({ min: 0 })],
  validate,
  asyncHandler(customerController.updatePoints),
);

module.exports = router;
