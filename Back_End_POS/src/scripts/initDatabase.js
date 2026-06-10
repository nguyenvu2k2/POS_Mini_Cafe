const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const { Role, User, sequelize } = require('../models');

const requiredTables = [
  'roles',
  'users',
  'customers',
  'categories',
  'products',
  'product_variants',
  'product_images',
  'orders',
  'order_items',
  'payments',
  'ingredients',
  'recipes',
  'inventory_logs',
];

const defaultRoles = [
  { name: 'admin', description: 'Quan tri vien toan quyen' },
  { name: 'cashier', description: 'Nhan vien thu ngan' },
  { name: 'barista', description: 'Nhan vien pha che' },
];

const getEnv = (name, fallbackName, defaultValue) =>
  process.env[name] ?? process.env[fallbackName] ?? defaultValue;

const getDatabaseName = () =>
  process.env.DB_DATABASE ??
  process.env.DB_NAME ??
  process.env.MYSQLDATABASE ??
  'pos_mini_cafe';

const getDatabaseUser = () =>
  process.env.DB_USERNAME ??
  process.env.DB_USER ??
  process.env.MYSQLUSER ??
  'root';

const getDatabasePassword = () =>
  process.env.DB_PASSWORD ??
  process.env.DB_PASS ??
  process.env.MYSQLPASSWORD ??
  '';

const getConfig = () => ({
  host: getEnv('DB_HOST', 'MYSQLHOST', '127.0.0.1'),
  port: Number(getEnv('DB_PORT', 'MYSQLPORT', 3307)),
  user: getDatabaseUser(),
  password: getDatabasePassword(),
  database: getDatabaseName(),
});

const shouldCreateDatabase = () =>
  !process.env.DATABASE_URL &&
  !process.env.MYSQL_URL &&
  process.env.DB_CREATE_DATABASE !== 'false';

const ensureDatabaseExists = async () => {
  if (!shouldCreateDatabase()) {
    return;
  }

  const config = getConfig();

  let connection;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } catch (error) {
    if (
      error.code === 'ER_DBACCESS_DENIED_ERROR' ||
      error.code === 'ER_ACCESS_DENIED_ERROR'
    ) {
      console.warn(
        'Khong co quyen tao database, tiep tuc ket noi database hien co.',
      );
      return;
    }

    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const normalizeTableName = (table) => {
  if (typeof table === 'string') {
    return table;
  }

  return table.tableName || table.table_name || table.name;
};

const getExistingTables = async () => {
  const tables = await sequelize.getQueryInterface().showAllTables();
  return tables.map(normalizeTableName).filter(Boolean);
};

const seedRoles = async () => {
  for (const role of defaultRoles) {
    await Role.findOrCreate({
      where: { name: role.name },
      defaults: role,
    });
  }
};

const seedAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return { created: false, skipped: true };
  }

  const [role] = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: defaultRoles[0],
  });

  const password_hash = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      role_id: role.id,
      name: process.env.ADMIN_NAME || 'POS Admin',
      email,
      password_hash,
      is_active: true,
    },
  });

  if (!created && !user.is_active) {
    await user.update({ is_active: true });
  }

  return { created, skipped: false };
};

const initDatabase = async () => {
  await ensureDatabaseExists();
  await sequelize.authenticate();

  const existingTables = await getExistingTables();
  const missingTables = requiredTables.filter(
    (table) => !existingTables.includes(table),
  );

  if (missingTables.length > 0) {
    await sequelize.sync();
  }

  await seedRoles();
  const admin = await seedAdminUser();

  return {
    initialized: missingTables.length > 0,
    message:
      missingTables.length > 0
        ? `Da tao schema, thieu ${missingTables.length} bang.`
        : 'Schema da san sang.',
    admin,
  };
};

if (require.main === module) {
  initDatabase()
    .then((result) => {
      console.log(result.message);
    })
    .catch((error) => {
      console.error('Khong the khoi tao database:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}

module.exports = {
  initDatabase,
};
