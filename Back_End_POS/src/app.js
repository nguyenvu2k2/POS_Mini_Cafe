const cors = require('cors');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const sequelize = require('./config/database');
const apiRoutes = require('./routes');
const openapiSpec = require('./docs/openapi');
const errorHandler = require('./middlewares/errorHandler');
const { initDatabase } = require('./scripts/initDatabase');
const ensureIngredientActiveColumn = require('./scripts/ensureIngredientActiveColumn');
const ensureProductImageUrlColumn = require('./scripts/ensureProductImageUrlColumn');
const { sendError } = require('./utils/response');

const app = express();
const uploadDir = path.join(process.cwd(), 'uploads', 'products');

fs.mkdirSync(uploadDir, { recursive: true });

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:5173',
  'https://frontend-pos.up.railway.app',
  'https://pos-mini.up.railway.app',
  'https://pos-mini-cafe.up.railway.app',
];

const parseCorsOrigins = () => {
  const configuredOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;

  if (!configuredOrigins) {
    return defaultCorsOrigins;
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const corsOrigins = parseCorsOrigins();

const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      ['http:', 'https:'].includes(protocol) &&
      ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
    );
  } catch {
    return false;
  }
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOrigins.includes('*') ||
        corsOrigins.includes(origin) ||
        isLocalDevelopmentOrigin(origin)
      ) {
        return callback(null, true);
      }

      const error = new Error('Not allowed by CORS');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    immutable: true,
    maxAge: '30d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }),
);

app.get('/', (req, res) => {
  res.redirect('/docs');
});
app.get('/openapi.json', (req, res) => {
  res.json(openapiSpec);
});
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, { explorer: true }),
);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, { explorer: true }),
);
app.use('/api', apiRoutes);

app.use((req, res) => {
  return sendError(res, 404, 'Khong tim thay API');
});

app.use(errorHandler);

const start = async () => {
  const port = Number(process.env.PORT || 3000);

  const initResult = await initDatabase();
  console.log(initResult.message);
  await sequelize.authenticate();
  await ensureIngredientActiveColumn();
  await ensureProductImageUrlColumn();
  app.listen(port, () => {
    console.log(`POS Mini Cafe API running at http://localhost:${port}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error('Khong the khoi dong server:', error);
    process.exit(1);
  });
}

module.exports = app;
