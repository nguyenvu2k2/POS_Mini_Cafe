const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { ProductImage, sequelize } = require('../models');

const imageBase64Pattern = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i;
const imageMimeExtensions = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const createFilename = (imageId, extension) =>
  `${Date.now()}-${imageId}-${crypto.randomUUID()}${extension}`;

const migrateProductImagesToFiles = async () => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'products');
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const images = await ProductImage.findAll({ order: [['id', 'ASC']] });
  let migrated = 0;
  let skipped = 0;

  for (const image of images) {
    if (typeof image.url !== 'string' || !image.url.startsWith('data:image/')) {
      skipped += 1;
      continue;
    }

    const match = imageBase64Pattern.exec(image.url);
    if (!match) {
      throw new Error(`Anh ${image.id} khong phai data URL hop le.`);
    }

    const extension = imageMimeExtensions[match[1].toLowerCase()];
    const filename = createFilename(image.id, extension);
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, Buffer.from(match[2], 'base64'));
    await image.update({ url: `/uploads/products/${filename}` });
    migrated += 1;
    console.log(`Migrated product_image ${image.id} -> /uploads/products/${filename}`);
  }

  return { migrated, skipped };
};

if (require.main === module) {
  migrateProductImagesToFiles()
    .then((result) => {
      console.log(`Done. migrated=${result.migrated}, skipped=${result.skipped}`);
    })
    .catch((error) => {
      console.error('Khong the migrate anh san pham:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}

module.exports = migrateProductImagesToFiles;
