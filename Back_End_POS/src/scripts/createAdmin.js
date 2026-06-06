const bcrypt = require('bcryptjs');
require('dotenv').config();

const { Role, User, sequelize } = require('../models');
const { initDatabase } = require('./initDatabase');

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@pos.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.env.ADMIN_NAME || 'POS Admin';

  const initResult = await initDatabase();
  console.log(initResult.message);

  await sequelize.authenticate();

  const [role] = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: { description: 'Quan tri vien toan quyen' },
  });

  const password_hash = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      role_id: role.id,
      name,
      email,
      password_hash,
      is_active: true,
    },
  });

  if (!created) {
    await user.update({
      role_id: role.id,
      name,
      password_hash,
      is_active: true,
    });
  }

  console.log(created ? 'Created admin user' : 'Updated admin user');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
};

createAdmin()
  .catch((error) => {
    console.error('Khong the tao admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
