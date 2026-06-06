const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

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

const getConfig = () => ({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME || 'pos_mini_cafe',
});

const splitSqlStatements = (sql) => {
  const statements = [];
  let current = '';
  let quote = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (!quote && char === '-' && next === '-') {
      while (index < sql.length && sql[index] !== '\n') {
        index += 1;
      }
      current += '\n';
      continue;
    }

    if (!quote && char === '/' && next === '*') {
      index += 2;
      while (
        index < sql.length &&
        !(sql[index] === '*' && sql[index + 1] === '/')
      ) {
        index += 1;
      }
      index += 1;
      continue;
    }

    if (
      (char === "'" || char === '"' || char === '`') &&
      sql[index - 1] !== '\\'
    ) {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
    }

    if (char === ';' && !quote) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) {
    statements.push(tail);
  }

  return statements;
};

const getExistingTables = async (connection, database) => {
  const [rows] = await connection.query(
    `
      SELECT TABLE_NAME AS table_name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN (${requiredTables.map(() => '?').join(',')})
    `,
    [database, ...requiredTables],
  );

  return rows.map((row) => row.table_name);
};

const initDatabase = async () => {
  const config = getConfig();
  const serverConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  await serverConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await serverConnection.end();

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: false,
  });

  try {
    const existingTables = await getExistingTables(connection, config.database);

    if (existingTables.length === requiredTables.length) {
      return {
        initialized: false,
        message: 'Schema da ton tai, bo qua import.',
      };
    }

    if (existingTables.length > 0) {
      const missingTables = requiredTables.filter(
        (table) => !existingTables.includes(table),
      );
      throw new Error(
        `Database dang thieu bang: ${missingTables.join(
          ', ',
        )}. Hay backup/drop database roi chay lai init-db de tranh mat du lieu.`,
      );
    }

    const schemaPath = path.join(process.cwd(), 'pos_mini_cafe_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = splitSqlStatements(schemaSql);

    for (const statement of statements) {
      await connection.query(statement);
    }

    return { initialized: true, message: 'Da import schema pos_mini_cafe.' };
  } finally {
    await connection.end();
  }
};

if (require.main === module) {
  initDatabase()
    .then((result) => {
      console.log(result.message);
    })
    .catch((error) => {
      console.error('Khong the khoi tao database:', error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  initDatabase,
};
