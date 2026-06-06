const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Du lieu khong hop le',
    errors: result.array(),
  });
};

module.exports = validate;
