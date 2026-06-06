module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
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
      method: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(14, 0),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
      },
      reference: {
        type: DataTypes.STRING(100),
      },
      paid_at: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return Payment;
};
