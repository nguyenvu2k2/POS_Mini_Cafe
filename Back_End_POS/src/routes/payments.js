const express = require('express');
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get(
  '/orders/:id/payments',
  verifyToken,
  requireRole('admin', 'cashier'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(paymentController.getOrderPayments),
);

router.post(
  '/orders/:id/payments',
  verifyToken,
  requireRole('admin', 'cashier'),
  [
    param('id').isInt({ min: 1 }),
    body('method').isIn(['cash', 'card', 'transfer', 'momo', 'vnpay']),
    body('amount').isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'completed', 'failed']),
    body('reference').optional({ nullable: true }).isString(),
    body('paid_at').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  asyncHandler(paymentController.createPayment),
);

router.post(
  '/payments/:id/refund',
  verifyToken,
  requireRole('admin'),
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(paymentController.refundPayment),
);

module.exports = router;
