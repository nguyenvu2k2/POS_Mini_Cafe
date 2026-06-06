const express = require('express');
const { query } = require('express-validator');
const reportController = require('../controllers/reportController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get(
  '/revenue',
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('group_by').optional().isIn(['day', 'week', 'month']),
  ],
  validate,
  asyncHandler(reportController.revenue),
);

router.get(
  '/top-products',
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(reportController.topProducts),
);

router.get(
  '/inventory',
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  asyncHandler(reportController.inventory),
);

router.get(
  '/staff',
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  asyncHandler(reportController.staff),
);

router.get('/low-stock', asyncHandler(reportController.lowStock));

module.exports = router;
