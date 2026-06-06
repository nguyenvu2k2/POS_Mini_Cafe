const { QueryTypes, col, literal, where } = require('sequelize');
const { Ingredient, sequelize } = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');

const buildDateWhere = (alias, replacements, from, to) => {
  const clauses = [];

  if (from) {
    clauses.push(`${alias}.created_at >= :from`);
    replacements.from = from;
  }

  if (to) {
    clauses.push(`${alias}.created_at < DATE_ADD(:to, INTERVAL 1 DAY)`);
    replacements.to = to;
  }

  return clauses.length ? `AND ${clauses.join(' AND ')}` : '';
};

const revenue = async (req, res) => {
  const groupBy = req.query.group_by || 'day';
  const periodSql = {
    day: 'DATE(o.created_at)',
    week: 'YEARWEEK(o.created_at, 1)',
    month: "DATE_FORMAT(o.created_at, '%Y-%m')",
  }[groupBy];

  if (!periodSql) {
    throw new HttpError(400, 'group_by chi nhan day|week|month');
  }

  const replacements = {};
  const dateWhere = buildDateWhere(
    'o',
    replacements,
    req.query.from,
    req.query.to,
  );
  const rows = await sequelize.query(
    `
      SELECT
        ${periodSql} AS period,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(p.amount), 0) AS revenue
      FROM orders o
      JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
      WHERE o.status = 'completed'
      ${dateWhere}
      GROUP BY period
      ORDER BY period ASC
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return sendSuccess(res, rows);
};

const topProducts = async (req, res) => {
  const replacements = { limit: Number(req.query.limit || 10) };
  const dateWhere = buildDateWhere(
    'o',
    replacements,
    req.query.from,
    req.query.to,
  );
  const rows = await sequelize.query(
    `
      SELECT
        pr.name AS product_name,
        pv.name AS variant_name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products pr ON pr.id = pv.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'completed'
      ${dateWhere}
      GROUP BY pr.id, pr.name, pv.id, pv.name
      ORDER BY total_sold DESC
      LIMIT :limit
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return sendSuccess(res, rows);
};

const inventory = async (req, res) => {
  const replacements = {
    from: req.query.from || null,
    to: req.query.to || null,
  };
  const rows = await sequelize.query(
    `
      SELECT
        i.id AS ingredient_id,
        i.name,
        i.unit,
        COALESCE(
          SUM(CASE WHEN il.action_type = 'import' THEN il.quantity_change ELSE 0 END),
          0
        ) AS imported,
        ABS(COALESCE(
          SUM(CASE WHEN il.action_type = 'export_sale' THEN il.quantity_change ELSE 0 END),
          0
        )) AS exported_sale,
        ABS(COALESCE(
          SUM(CASE WHEN il.action_type = 'export_waste' THEN il.quantity_change ELSE 0 END),
          0
        )) AS wasted,
        COALESCE(
          SUM(CASE WHEN il.action_type = 'adjustment' THEN il.quantity_change ELSE 0 END),
          0
        ) AS adjusted,
        (
          i.stock_quantity
          - CASE
              WHEN :to IS NULL THEN 0
              ELSE COALESCE((
                SELECT SUM(after_il.quantity_change)
                FROM inventory_logs after_il
                WHERE after_il.ingredient_id = i.id
                  AND after_il.created_at >= DATE_ADD(:to, INTERVAL 1 DAY)
              ), 0)
            END
          - COALESCE(SUM(il.quantity_change), 0)
        ) AS opening_stock,
        (
          i.stock_quantity
          - CASE
              WHEN :to IS NULL THEN 0
              ELSE COALESCE((
                SELECT SUM(after_il.quantity_change)
                FROM inventory_logs after_il
                WHERE after_il.ingredient_id = i.id
                  AND after_il.created_at >= DATE_ADD(:to, INTERVAL 1 DAY)
              ), 0)
            END
        ) AS closing_stock
      FROM ingredients i
      LEFT JOIN inventory_logs il
        ON il.ingredient_id = i.id
        AND (:from IS NULL OR il.created_at >= :from)
        AND (:to IS NULL OR il.created_at < DATE_ADD(:to, INTERVAL 1 DAY))
      GROUP BY i.id, i.name, i.unit, i.stock_quantity
      ORDER BY i.name ASC
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return sendSuccess(res, rows);
};

const staff = async (req, res) => {
  const replacements = {};
  const dateWhere = buildDateWhere(
    'o',
    replacements,
    req.query.from,
    req.query.to,
  );
  const rows = await sequelize.query(
    `
      SELECT
        u.id AS user_id,
        u.name,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE o.status = 'completed'
      ${dateWhere}
      GROUP BY u.id, u.name
      ORDER BY revenue DESC
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return sendSuccess(res, rows);
};

const lowStock = async (req, res) => {
  const ingredients = await Ingredient.findAll({
    where: where(col('stock_quantity'), '<=', literal('min_stock * 1.2')),
    order: [['name', 'ASC']],
  });

  return sendSuccess(res, ingredients);
};

module.exports = {
  revenue,
  topProducts,
  inventory,
  staff,
  lowStock,
};
