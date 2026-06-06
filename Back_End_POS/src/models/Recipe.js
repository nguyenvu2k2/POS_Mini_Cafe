module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define(
    'Recipe',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      variant_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      ingredient_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity_required: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
    },
    {
      tableName: 'recipes',
      timestamps: false,
    },
  );

  return Recipe;
};
