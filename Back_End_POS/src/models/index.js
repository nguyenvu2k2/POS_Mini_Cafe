const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = require('./Role')(sequelize, DataTypes);
db.User = require('./User')(sequelize, DataTypes);
db.Customer = require('./Customer')(sequelize, DataTypes);
db.Category = require('./Category')(sequelize, DataTypes);
db.Product = require('./Product')(sequelize, DataTypes);
db.ProductVariant = require('./ProductVariant')(sequelize, DataTypes);
db.ProductImage = require('./ProductImage')(sequelize, DataTypes);
db.Order = require('./Order')(sequelize, DataTypes);
db.OrderItem = require('./OrderItem')(sequelize, DataTypes);
db.Payment = require('./Payment')(sequelize, DataTypes);
db.Ingredient = require('./Ingredient')(sequelize, DataTypes);
db.Recipe = require('./Recipe')(sequelize, DataTypes);
db.InventoryLog = require('./InventoryLog')(sequelize, DataTypes);

db.Role.hasMany(db.User, { foreignKey: 'role_id', as: 'users' });
db.User.belongsTo(db.Role, { foreignKey: 'role_id', as: 'role' });

db.User.hasMany(db.Order, { foreignKey: 'user_id', as: 'orders' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.Customer.hasMany(db.Order, { foreignKey: 'customer_id', as: 'orders' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customer_id', as: 'customer' });

db.Category.hasMany(db.Product, { foreignKey: 'category_id', as: 'products' });
db.Product.belongsTo(db.Category, {
  foreignKey: 'category_id',
  as: 'category',
});

db.Product.hasMany(db.ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants',
});
db.ProductVariant.belongsTo(db.Product, {
  foreignKey: 'product_id',
  as: 'product',
});

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id', as: 'images' });
db.ProductImage.belongsTo(db.Product, {
  foreignKey: 'product_id',
  as: 'product',
});

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', as: 'items' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id', as: 'order' });

db.ProductVariant.hasMany(db.OrderItem, {
  foreignKey: 'variant_id',
  as: 'order_items',
});
db.OrderItem.belongsTo(db.ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
});

db.Order.hasMany(db.Payment, { foreignKey: 'order_id', as: 'payments' });
db.Payment.belongsTo(db.Order, { foreignKey: 'order_id', as: 'order' });

db.ProductVariant.hasMany(db.Recipe, {
  foreignKey: 'variant_id',
  as: 'recipes',
});
db.Recipe.belongsTo(db.ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
});

db.Ingredient.hasMany(db.Recipe, {
  foreignKey: 'ingredient_id',
  as: 'recipes',
});
db.Recipe.belongsTo(db.Ingredient, {
  foreignKey: 'ingredient_id',
  as: 'ingredient',
});

db.ProductVariant.belongsToMany(db.Ingredient, {
  through: db.Recipe,
  foreignKey: 'variant_id',
  otherKey: 'ingredient_id',
  as: 'ingredients',
});
db.Ingredient.belongsToMany(db.ProductVariant, {
  through: db.Recipe,
  foreignKey: 'ingredient_id',
  otherKey: 'variant_id',
  as: 'variants',
});

db.Ingredient.hasMany(db.InventoryLog, {
  foreignKey: 'ingredient_id',
  as: 'logs',
});
db.InventoryLog.belongsTo(db.Ingredient, {
  foreignKey: 'ingredient_id',
  as: 'ingredient',
});

db.User.hasMany(db.InventoryLog, {
  foreignKey: 'user_id',
  as: 'inventory_logs',
});
db.InventoryLog.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.Order.hasMany(db.InventoryLog, {
  foreignKey: 'order_id',
  as: 'inventory_logs',
});
db.InventoryLog.belongsTo(db.Order, { foreignKey: 'order_id', as: 'order' });

module.exports = db;
