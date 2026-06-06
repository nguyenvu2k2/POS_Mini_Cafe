const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  [
    body('refresh_token').optional().isString(),
    body('refreshToken').optional().isString(),
  ],
  validate,
  asyncHandler(authController.refresh),
);

router.post('/logout', asyncHandler(authController.logout));

module.exports = router;
