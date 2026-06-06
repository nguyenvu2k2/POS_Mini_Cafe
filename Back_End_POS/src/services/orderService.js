const { Op } = require('sequelize');
const {
  Customer,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  Ingredient,
  Recipe,
  User,
  sequelize,
} = require('../models');
const inventoryService = require('./inventoryService');
const HttpError = require('../utils/httpError');
const { toNumber } = require('../utils/number');

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Don hang phai co it nhat 1 san pham');
  }

  return items.map((item) => ({
    variant_id: Number(item.variant_id),
    quantity: Number(item.quantity),
    note: item.note || null,
  }));
};

const getOrderIncludes = () => [
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
  { model: Payment, as: 'payments' },
  { model: Customer, as: 'customer' },
  { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
];

const getOrderById = async (id, transaction = undefined) => {
  const order = await Order.findByPk(id, {
    include: getOrderIncludes(),
    transaction,
  });

  if (!order) {
    throw new HttpError(404, 'Khong tim thay don hang');
  }

  return order;
};

const loadAvailableVariants = async (items, transaction) => {
  const variantIds = [...new Set(items.map((item) => item.variant_id))];
  const variants = await ProductVariant.findAll({
    where: { id: { [Op.in]: variantIds } },
    include: [
      { model: Product, as: 'product' },
      {
        model: Recipe,
        as: 'recipes',
        include: [{ model: Ingredient, as: 'ingredient' }],
      },
    ],
    transaction,
  });

  const variantById = new Map(
    variants.map((variant) => [Number(variant.id), variant]),
  );
  const invalidItems = variantIds.filter(
    (variantId) => !variantById.has(variantId),
  );

  if (invalidItems.length > 0) {
    throw new HttpError(
      422,
      'Variant khong ton tai',
      invalidItems.map((id) => ({ variant_id: id })),
    );
  }

  const unavailableItems = variants
    .filter((variant) => !variant.is_available)
    .map((variant) => ({ variant_id: variant.id, name: variant.name }));

  if (unavailableItems.length > 0) {
    throw new HttpError(422, 'Variant dang tam ngung ban', unavailableItems);
  }

  const missingRecipeItems = variants
    .filter((variant) => !variant.recipes || variant.recipes.length === 0)
    .map((variant) => ({
      variant_id: variant.id,
      variant_name: variant.name,
      product_name: variant.product?.name || null,
    }));

  if (missingRecipeItems.length > 0) {
    throw new HttpError(
      422,
      'San pham chua cau hinh cong thuc nguyen lieu, khong the them vao don hang',
      missingRecipeItems,
    );
  }

  const hiddenIngredientItems = variants.flatMap((variant) =>
    (variant.recipes || [])
      .filter((recipe) => recipe.ingredient && !recipe.ingredient.is_active)
      .map((recipe) => ({
        variant_id: variant.id,
        variant_name: variant.name,
        product_name: variant.product?.name || null,
        ingredient_id: recipe.ingredient.id,
        ingredient_name: recipe.ingredient.name,
      })),
  );

  if (hiddenIngredientItems.length > 0) {
    throw new HttpError(
      422,
      'San pham co nguyen lieu da an, khong the them vao don hang',
      hiddenIngredientItems,
    );
  }

  return variantById;
};

const buildOrderItemRows = (items, variantById, orderId = undefined) => {
  return items.map((item) => {
    const variant = variantById.get(item.variant_id);
    const unitPrice = toNumber(variant.price);

    return {
      order_id: orderId,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      note: item.note,
    };
  });
};

const calculateTotalAmount = (orderItemRows) => {
  return orderItemRows.reduce(
    (total, item) => total + Number(item.quantity) * toNumber(item.unit_price),
    0,
  );
};

const createOrder = async (payload, actor) => {
  const items = normalizeOrderItems(payload.items);
  let createdOrderId;

  await sequelize.transaction(async (transaction) => {
    if (payload.customer_id) {
      const customer = await Customer.findByPk(payload.customer_id, {
        transaction,
      });
      if (!customer) {
        throw new HttpError(404, 'Khong tim thay khach hang');
      }
    }

    const variantById = await loadAvailableVariants(items, transaction);
    const itemRows = buildOrderItemRows(items, variantById);
    const totalAmount = calculateTotalAmount(itemRows);

    const order = await Order.create(
      {
        user_id: actor.id,
        customer_id: payload.customer_id || null,
        status: 'pending',
        total_amount: totalAmount,
        discount: payload.discount || 0,
        note: payload.note || null,
        table_no: payload.table_no || null,
      },
      { transaction },
    );

    createdOrderId = order.id;

    await OrderItem.bulkCreate(
      itemRows.map((row) => ({ ...row, order_id: order.id })),
      { transaction },
    );
  });

  return getOrderById(createdOrderId);
};

const listOrders = async (query) => {
  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.user_id) {
    where.user_id = query.user_id;
  }

  if (query.date) {
    const from = new Date(`${query.date}T00:00:00`);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    where.created_at = { [Op.gte]: from, [Op.lt]: to };
  }

  return Order.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit: query.limit,
    offset: query.offset,
  });
};

const updateStatus = async (orderId, nextStatus, actor) => {
  const allowedTransitions = {
    pending: [],
    preparing: ['completed'],
    ready: ['completed'],
    completed: [],
    cancelled: [],
  };

  if (
    actor.role === 'barista' &&
    !['completed'].includes(nextStatus)
  ) {
    throw new HttpError(403, 'Barista chi duoc cap nhat completed');
  }

  if (nextStatus === 'cancelled') {
    throw new HttpError(400, 'Vui long dung API huy don hang');
  }

  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new HttpError(404, 'Khong tim thay don hang');
    }

    if (order.status === nextStatus) {
      return;
    }

    const allowedNextStatuses = allowedTransitions[order.status] || [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new HttpError(
        400,
        `Khong the chuyen trang thai tu ${order.status} sang ${nextStatus}`,
      );
    }

    if (
      nextStatus === 'completed' &&
      !(await inventoryService.hasActiveStockDeduction(order.id, transaction))
    ) {
      await inventoryService.deductStock(order.items, {
        transaction,
        userId: actor.id,
        orderId: order.id,
      });
    }

    order.status = nextStatus;
    await order.save({ transaction });
  });

  return getOrderById(orderId);
};

const replaceOrderItems = async (orderId, payload, actor) => {
  const items = normalizeOrderItems(payload.items);

  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new HttpError(404, 'Khong tim thay don hang');
    }

    if (order.status !== 'pending') {
      throw new HttpError(400, 'Chi duoc sua item khi don hang dang pending');
    }

    if (await inventoryService.hasActiveStockDeduction(order.id, transaction)) {
      await inventoryService.restoreStock(order.items, {
        transaction,
        userId: actor.id,
        orderId: order.id,
        note: `Hoan kho truoc khi sua order #${order.id}`,
      });
    }

    await OrderItem.destroy({
      where: { order_id: order.id },
      transaction,
    });

    const variantById = await loadAvailableVariants(items, transaction);
    const itemRows = buildOrderItemRows(items, variantById, order.id);
    const totalAmount = calculateTotalAmount(itemRows);

    await OrderItem.bulkCreate(itemRows, { transaction });

    order.total_amount = totalAmount;
    if (payload.discount !== undefined) {
      order.discount = payload.discount;
    }
    await order.save({ transaction });

  });

  return getOrderById(orderId);
};

const cancelOrder = async (orderId, actor) => {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new HttpError(404, 'Khong tim thay don hang');
    }

    if (!['pending', 'preparing'].includes(order.status)) {
      throw new HttpError(400, 'Chi duoc huy don pending hoac preparing');
    }

    if (await inventoryService.hasActiveStockDeduction(order.id, transaction)) {
      await inventoryService.restoreStock(order.items, {
        transaction,
        userId: actor.id,
        orderId: order.id,
        note: `Hoan kho do huy order #${order.id}`,
      });
    }

    order.status = 'cancelled';
    await order.save({ transaction });
  });

  return getOrderById(orderId);
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateStatus,
  replaceOrderItems,
  cancelOrder,
};
