const { Op, col, literal, where } = require('sequelize');
const { Ingredient, InventoryLog, sequelize } = require('../models');
const HttpError = require('../utils/httpError');
const { getPagination, getPagingMeta } = require('../utils/pagination');
const { sendSuccess } = require('../utils/response');
const { toDecimalString, toNumber } = require('../utils/number');

const listIngredients = async (req, res) => {
  const filters = {};

  if (req.query.low_stock === 'true') {
    filters[Op.and] = [
      where(col('stock_quantity'), Op.lte, literal('min_stock * 1.2')),
    ];
  }

  if (req.query.is_active !== undefined) {
    filters.is_active = req.query.is_active === 'true';
  }

  const ingredients = await Ingredient.findAll({
    where: filters,
    order: [['name', 'ASC']],
  });

  return sendSuccess(res, ingredients);
};

const createIngredient = async (req, res) => {
  const ingredient = await Ingredient.create(req.body);
  return sendSuccess(res, ingredient, undefined, 201);
};

const updateIngredient = async (req, res) => {
  const ingredient = await Ingredient.findByPk(req.params.id);

  if (!ingredient) {
    throw new HttpError(404, 'Khong tim thay nguyen lieu');
  }

  await ingredient.update(req.body);

  return sendSuccess(res, ingredient);
};

const assertIngredientActive = (ingredient) => {
  if (!ingredient.is_active) {
    throw new HttpError(422, 'Nguyen lieu da an, khong the nhap kho hoac dieu chinh');
  }
};

const importIngredient = async (req, res) => {
  let updatedIngredient;

  await sequelize.transaction(async (transaction) => {
    const ingredient = await Ingredient.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!ingredient) {
      throw new HttpError(404, 'Khong tim thay nguyen lieu');
    }

    assertIngredientActive(ingredient);

    const quantity = toNumber(req.body.quantity);
    ingredient.stock_quantity = toDecimalString(
      toNumber(ingredient.stock_quantity) + quantity,
    );
    await ingredient.save({ transaction });

    await InventoryLog.create(
      {
        ingredient_id: ingredient.id,
        action_type: 'import',
        quantity_change: toDecimalString(quantity),
        note: req.body.note || 'Nhap kho',
        user_id: req.user.id,
      },
      { transaction },
    );

    updatedIngredient = ingredient;
  });

  return sendSuccess(res, updatedIngredient);
};

const adjustIngredient = async (req, res) => {
  let updatedIngredient;

  await sequelize.transaction(async (transaction) => {
    const ingredient = await Ingredient.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!ingredient) {
      throw new HttpError(404, 'Khong tim thay nguyen lieu');
    }

    assertIngredientActive(ingredient);

    const actualQuantity = toNumber(req.body.actual_quantity);
    const delta = actualQuantity - toNumber(ingredient.stock_quantity);
    const unit = req.body.unit?.trim();

    ingredient.stock_quantity = toDecimalString(actualQuantity);
    if (unit) {
      ingredient.unit = unit;
    }
    await ingredient.save({ transaction });

    await InventoryLog.create(
      {
        ingredient_id: ingredient.id,
        action_type: 'adjustment',
        quantity_change: toDecimalString(delta),
        note: req.body.note || 'Dieu chinh kiem ke',
        user_id: req.user.id,
      },
      { transaction },
    );

    updatedIngredient = ingredient;
  });

  return sendSuccess(res, updatedIngredient);
};

const getIngredientLogs = async (req, res) => {
  const ingredient = await Ingredient.findByPk(req.params.id);

  if (!ingredient) {
    throw new HttpError(404, 'Khong tim thay nguyen lieu');
  }

  const pagination = getPagination(req.query);
  const filters = { ingredient_id: ingredient.id };

  if (req.query.action_type) {
    filters.action_type = req.query.action_type;
  }

  const result = await InventoryLog.findAndCountAll({
    where: filters,
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

module.exports = {
  listIngredients,
  createIngredient,
  updateIngredient,
  importIngredient,
  adjustIngredient,
  getIngredientLogs,
};
