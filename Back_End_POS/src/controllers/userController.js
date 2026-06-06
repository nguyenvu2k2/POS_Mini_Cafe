const bcrypt = require('bcryptjs');
const { Role, User } = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');

const userAttributes = [
  'id',
  'role_id',
  'name',
  'email',
  'phone',
  'is_active',
  'created_at',
];

const listUsers = async (req, res) => {
  console.log('listUsers called', res);
  const users = await User.findAll({
    attributes: userAttributes,
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    order: [['id', 'ASC']],
  });
  console.log('listUsers called', users);
  return sendSuccess(res, users);
};

const createUser = async (req, res) => {
  const { name, email, password, phone, is_active } = req.body;
  const role_id = req.body.role_id || 2;
  const role = await Role.findByPk(role_id);

  if (!role) {
    throw new HttpError(422, 'Role khong ton tai');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    role_id,
    name,
    email: email || null,
    password_hash: passwordHash,
    phone: phone || null,
    is_active: is_active === undefined ? true : is_active,
  });

  const createdUser = await User.findByPk(user.id, {
    attributes: userAttributes,
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

  return sendSuccess(res, createdUser, undefined, 201);
};

const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new HttpError(404, 'Khong tim thay user');
  }

  const fields = ['role_id', 'name', 'email', 'phone', 'is_active'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      user[field] =
        field === 'email' ? req.body[field] || null : req.body[field];
    }
  }

  if (req.body.password) {
    user.password_hash = await bcrypt.hash(req.body.password, 10);
  }

  await user.save();

  const updatedUser = await User.findByPk(user.id, {
    attributes: userAttributes,
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

  return sendSuccess(res, updatedUser);
};

const deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new HttpError(404, 'Khong tim thay user');
  }

  user.is_active = false;
  await user.save();

  return sendSuccess(res, { id: user.id, is_active: user.is_active });
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
