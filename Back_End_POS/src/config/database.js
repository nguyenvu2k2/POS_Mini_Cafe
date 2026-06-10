/* eslint-disable */
// @ts-nocheck
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const getEnv = (name, fallbackName, defaultValue) =>
  process.env[name] ?? process.env[fallbackName] ?? defaultValue;

const commonOptions = {
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
};

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, commonOptions)
  : new Sequelize(
      getEnv('DB_NAME', 'MYSQLDATABASE', 'pos_mini_cafe'),
      getEnv('DB_USER', 'MYSQLUSER', 'root'),
      process.env.DB_PASS ?? process.env.MYSQLPASSWORD ?? '',
      {
        ...commonOptions,
        host: getEnv('DB_HOST', 'MYSQLHOST', '127.0.0.1'),
        port: Number(getEnv('DB_PORT', 'MYSQLPORT', 3307)),
      },
    );

module.exports = sequelize;
