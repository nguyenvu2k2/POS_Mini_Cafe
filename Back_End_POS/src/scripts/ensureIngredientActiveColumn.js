const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ensureIngredientActiveColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const ingredientsTable = await queryInterface.describeTable('ingredients');

  if (ingredientsTable.is_active) {
    return;
  }

  await queryInterface.addColumn('ingredients', 'is_active', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
};

module.exports = ensureIngredientActiveColumn;
