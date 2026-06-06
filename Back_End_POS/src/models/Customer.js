module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        unique: true,
      },
      email: {
        type: DataTypes.STRING(150),
        unique: true,
      },
      loyalty_points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return Customer;
};
