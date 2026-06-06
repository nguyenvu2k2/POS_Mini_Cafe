const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Role, User } = require('../models');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/response');

const refreshTokenBlacklist = new Set();

const getAccessSecret = () =>
  process.env.JWT_SECRET || 'pos-mini-cafe-access-secret';
const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || 'pos-mini-cafe-refresh-secret';

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role?.name,
});

const signTokens = (user) => ({
  access_token: jwt.sign(buildTokenPayload(user), getAccessSecret(), {
    expiresIn: '15m',
  }),
  refresh_token: jwt.sign(buildTokenPayload(user), getRefreshSecret(), {
    expiresIn: '7d',
  }),
  token_type: 'Bearer',
  expires_in: 15 * 60,
});

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

  if (!user || !user.is_active) {
    throw new HttpError(401, 'Email hoac mat khau khong dung');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new HttpError(401, 'Email hoac mat khau khong dung');
  }

  return sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
    },
    ...signTokens(user),
  });
};

const refresh = async (req, res) => {
  const refreshToken = req.body.refresh_token || req.body.refreshToken;

  if (!refreshToken || refreshTokenBlacklist.has(refreshToken)) {
    throw new HttpError(401, 'Refresh token khong hop le');
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, getRefreshSecret());
  } catch (_error) {
    throw new HttpError(401, 'Refresh token khong hop le hoac da het han');
  }
  const user = await User.findByPk(decoded.id, {
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

  if (!user || !user.is_active) {
    throw new HttpError(401, 'Tai khoan khong ton tai hoac da bi khoa');
  }

  return sendSuccess(res, signTokens(user));
};

const logout = async (req, res) => {
  const refreshToken = req.body.refresh_token || req.body.refreshToken;

  if (refreshToken) {
    refreshTokenBlacklist.add(refreshToken);
  }

  return sendSuccess(res, { logged_out: true });
};

module.exports = {
  login,
  refresh,
  logout,
};
