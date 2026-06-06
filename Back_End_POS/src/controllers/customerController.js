const { Op } = require('sequelize');
const {
  Customer,
  Order,
  OrderItem,
  Product,
  ProductVariant,
} = require('../models');
const HttpError = require('../utils/httpError');
const { getPagination, getPagingMeta } = require('../utils/pagination');
const { sendSuccess } = require('../utils/response');

const listCustomers = async (req, res) => {
  const where = {};

  if (req.query.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.q}%` } },
      { phone: { [Op.like]: `%${req.query.q}%` } },
    ];
  }

  const customers = await Customer.findAll({
    where,
    order: [['created_at', 'DESC']],
  });

  return sendSuccess(res, customers);
};

const createCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  return sendSuccess(res, customer, undefined, 201);
};

const getCustomer = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    throw new HttpError(404, 'Khong tim thay khach hang');
  }

  return sendSuccess(res, customer);
};

const updateCustomer = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    throw new HttpError(404, 'Khong tim thay khach hang');
  }

  await customer.update(req.body);

  return sendSuccess(res, customer);
};

const getCustomerOrders = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    throw new HttpError(404, 'Khong tim thay khach hang');
  }

  const pagination = getPagination(req.query);
  const result = await Order.findAndCountAll({
    where: { customer_id: customer.id },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: ProductVariant,
            as: 'variant',
            include: [{ model: Product, as: 'product' }],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return sendSuccess(
    res,
    result.rows,
    getPagingMeta(pagination.page, pagination.limit, result.count),
  );
};

const updatePoints = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);

  if (!customer) {
    throw new HttpError(404, 'Khong tim thay khach hang');
  }

  customer.loyalty_points = req.body.loyalty_points;
  await customer.save();

  return sendSuccess(res, customer);
};

module.exports = {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  getCustomerOrders,
  updatePoints,
};
