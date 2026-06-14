const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ensureProductImageUrlColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const productImagesTable = await queryInterface.describeTable('product_images');
  const urlColumn = productImagesTable.url;

  if (!urlColumn || String(urlColumn.type).toUpperCase().includes('VARCHAR')) {
    return;
  }

  const [rows] = await sequelize.query(
    'SELECT COUNT(*) AS count FROM product_images WHERE CHAR_LENGTH(url) > 500',
  );
  const oversizedUrlCount = Number(rows?.[0]?.count || 0);

  if (oversizedUrlCount > 0) {
    console.warn(
      `Bo qua thu nho product_images.url vi con ${oversizedUrlCount} URL dai hon 500 ky tu.`,
    );
    return;
  }

  await queryInterface.changeColumn('product_images', 'url', {
    type: DataTypes.STRING(500),
    allowNull: false,
  });
};

module.exports = ensureProductImageUrlColumn;
