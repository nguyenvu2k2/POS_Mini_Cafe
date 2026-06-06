const orderService = require('../services/orderService');
const { getPagination, getPagingMeta } = require('../utils/pagination');
const { sendSuccess } = require('../utils/response');

const listOrders = async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await orderService.listOrders({ ...req.query, ...pagination });

  return sendSuccess(
    res,
    result.rows,
    getPagingMeta(pagination.page, pagination.limit, result.count),
  );
};

const createOrder = async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user);
  return sendSuccess(res, order, undefined, 201);
};

const getOrder = async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return sendSuccess(res, order);
};

const updateStatus = async (req, res) => {
  const order = await orderService.updateStatus(
    req.params.id,
    req.body.status,
    req.user,
  );
  return sendSuccess(res, order);
};

const updateItems = async (req, res) => {
  const order = await orderService.replaceOrderItems(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, order);
};

const cancelOrder = async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user);
  return sendSuccess(res, order);
};

module.exports = {
  listOrders,
  createOrder,
  getOrder,
  updateStatus,
  updateItems,
  cancelOrder,
};
