module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.INTEGER.UNSIGNED,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pending',
      },
      total_amount: {
        type: DataTypes.DECIMAL(14, 0),
        allowNull: false,
        defaultValue: 0,
      },
      discount: {
        type: DataTypes.DECIMAL(14, 0),
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: DataTypes.TEXT,
      },
      table_no: {
        type: DataTypes.STRING(20),
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Order;
};
