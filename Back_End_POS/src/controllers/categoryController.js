const { Category } = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');

const listCategories = async (req, res) => {
  const where = {};

  if (req.query.is_active !== undefined) {
    where.is_active = req.query.is_active === 'true';
  }

  const categories = await Category.findAll({
    where,
    order: [
      ['sort_order', 'ASC'],
      ['name', 'ASC'],
    ],
  });

  return sendSuccess(res, categories);
};

const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  return sendSuccess(res, category, undefined, 201);
};

const updateCategory = async (req, res) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    throw new HttpError(404, 'Khong tim thay category');
  }

  await category.update(req.body);

  return sendSuccess(res, category);
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
};
