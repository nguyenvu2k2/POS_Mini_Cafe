const express = require('express');
const authRoutes = require('./auth');
const categoryRoutes = require('./categories');
const customerRoutes = require('./customers');
const ingredientRoutes = require('./ingredients');
const orderRoutes = require('./orders');
const paymentRoutes = require('./payments');
const productRoutes = require('./products');
const reportRoutes = require('./reports');
const userRoutes = require('./users');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'POS API is running', version: '1.0.0' } });
});

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
