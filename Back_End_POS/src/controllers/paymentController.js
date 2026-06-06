const { Customer, Order, Payment, sequelize } = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');
const { toNumber } = require('../utils/number');

const getOrderPayments = async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (!order) {
    throw new HttpError(404, 'Khong tim thay don hang');
  }

  const payments = await Payment.findAll({
    where: { order_id: order.id },
    order: [['created_at', 'DESC']],
  });
  const paidTotal = toNumber(
    await Payment.sum('amount', {
      where: { order_id: order.id, status: 'completed' },
    }),
  );

  return sendSuccess(res, {
    payments,
    paid_total: paidTotal,
    remaining: Math.max(toNumber(order.total_amount) - paidTotal, 0),
  });
};

const createPayment = async (req, res) => {
  let createdPaymentId;

  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new HttpError(404, 'Khong tim thay don hang');
    }

    if (order.status === 'cancelled') {
      throw new HttpError(400, 'Khong the thanh toan don da huy');
    }

    const status = req.body.status || 'completed';
    const payment = await Payment.create(
      {
        order_id: order.id,
        method: req.body.method,
        amount: req.body.amount,
        status,
        reference: req.body.reference || null,
        paid_at:
          status === 'completed'
            ? req.body.paid_at || new Date()
            : req.body.paid_at || null,
      },
      { transaction },
    );

    createdPaymentId = payment.id;

    const paidTotal = toNumber(
      await Payment.sum('amount', {
        where: { order_id: order.id, status: 'completed' },
        transaction,
      }),
    );

    const isFullyPaid = paidTotal >= toNumber(order.total_amount);

    if (isFullyPaid && order.status === 'pending') {
      order.status = 'preparing';
      await order.save({ transaction });

      if (order.customer_id) {
        const points = Math.floor(toNumber(order.total_amount) / 10000);
        await Customer.increment(
          { loyalty_points: points },
          { where: { id: order.customer_id }, transaction },
        );
      }
    }
  });

  const payment = await Payment.findByPk(createdPaymentId);
  return sendSuccess(res, payment, undefined, 201);
};

const refundPayment = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);

  if (!payment) {
    throw new HttpError(404, 'Khong tim thay thanh toan');
  }

  if (!['pending', 'completed'].includes(payment.status)) {
    throw new HttpError(400, 'Thanh toan khong the refund');
  }

  payment.status = 'refunded';
  await payment.save();

  return sendSuccess(res, payment);
};

module.exports = {
  getOrderPayments,
  createPayment,
  refundPayment,
};
