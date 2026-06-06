module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      variant_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unit_price: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(14, 0),
      },
      note: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'order_items',
      timestamps: false,
    },
  );

  return OrderItem;
};
