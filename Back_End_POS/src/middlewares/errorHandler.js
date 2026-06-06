const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? 'Loi he thong' : err.message;
  let errors = err.errors || [];

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 422;
    message = 'Du lieu da ton tai';
    errors = err.errors.map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 422;
    message = 'Du lieu lien ket khong ton tai';
  }

  if (err.name === 'MulterError' || err.message === 'File upload phai la anh') {
    statusCode = 400;
    message = err.message;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorHandler;
