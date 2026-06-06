const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole, verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', asyncHandler(userController.listUsers));

router.post(
  '/',
  [
    body('role_id').optional().isInt({ min: 1 }),
    body('name').trim().notEmpty(),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').trim().notEmpty(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(userController.createUser),
);

router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('role_id').optional().isInt({ min: 1 }),
    body('name').optional().trim().notEmpty(),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('phone').optional({ nullable: true }).isString(),
    body('is_active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(userController.updateUser),
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  asyncHandler(userController.deleteUser),
);

module.exports = router;
