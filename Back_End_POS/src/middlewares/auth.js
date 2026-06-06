const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const getAccessSecret = () =>
  process.env.JWT_SECRET || 'pos-mini-cafe-access-secret';

const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Thieu access token',
        errors: [],
      });
    }

    const decoded = jwt.verify(token, getAccessSecret());
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      attributes: ['id', 'role_id', 'name', 'email', 'is_active'],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Tai khoan khong ton tai hoac da bi khoa',
        errors: [],
      });
    }

    req.user = {
      id: user.id,
      role_id: user.role_id,
      name: user.name,
      email: user.email,
      role: user.role?.name,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Access token khong hop le hoac da het han',
      errors: [],
    });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chua xac thuc',
        errors: [],
      });
    }

    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Khong du quyen truy cap',
      errors: [],
    });
  };

module.exports = {
  verifyToken,
  requireRole,
};
