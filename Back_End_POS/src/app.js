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
const ensureIngredientActiveColumn = require('./scripts/ensureIngredientActiveColumn');
const { sendError } = require('./utils/response');

const app = express();
const uploadDir = path.join(process.cwd(), 'uploads', 'products');

fs.mkdirSync(uploadDir, { recursive: true });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: ['http://localhost:4200', 'https://frontend-pos.up.railway.app'],
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

  await sequelize.authenticate();
  await ensureIngredientActiveColumn();
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
