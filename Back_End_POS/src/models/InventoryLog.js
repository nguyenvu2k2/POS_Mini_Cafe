module.exports = (sequelize, DataTypes) => {
  const InventoryLog = sequelize.define(
    'InventoryLog',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      ingredient_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      action_type: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      quantity_change: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
      },
      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'inventory_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return InventoryLog;
};
