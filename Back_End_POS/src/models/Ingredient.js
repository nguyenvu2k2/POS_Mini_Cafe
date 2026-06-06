module.exports = (sequelize, DataTypes) => {
  const Ingredient = sequelize.define(
    'Ingredient',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      stock_quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      min_stock: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 0),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'ingredients',
      timestamps: true,
      createdAt: false,
      updatedAt: 'updated_at',
    },
  );

  return Ingredient;
};
