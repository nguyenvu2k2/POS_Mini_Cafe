/* eslint-disable */
// @ts-nocheck
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'pos_mini_cafe',
  process.env.DB_USER || 'root',
  process.env.DB_PASS ?? '123456',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    dialect: 'mysql',
    timezone: process.env.DB_TIMEZONE || '+07:00',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = sequelize;
