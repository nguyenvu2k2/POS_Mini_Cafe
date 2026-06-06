const sendSuccess = (res, data = null, meta = undefined, statusCode = 200) => {
  const payload = { success: true, data };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
