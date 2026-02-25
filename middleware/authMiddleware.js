const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../controllers/authController');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    let isAdmin = payload.isAdmin;
    if (isAdmin === undefined) {
      const user = await User.findByPk(payload.id, { attributes: ['isAdmin'] });
      isAdmin = user ? !!user.isAdmin : false;
    }
    req.user = { id: payload.id, username: payload.username, isAdmin: !!isAdmin };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

/** Только для администраторов. Вызывать после authMiddleware. */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

/** Если в заголовке есть Bearer-токен — заполняет req.user, иначе просто next (не ошибка). */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    let isAdmin = payload.isAdmin;
    if (isAdmin === undefined) {
      const user = await User.findByPk(payload.id, { attributes: ['isAdmin'] });
      isAdmin = user ? !!user.isAdmin : false;
    }
    req.user = { id: payload.id, username: payload.username, isAdmin: !!isAdmin };
  } catch (e) {}
  next();
}

module.exports = { authMiddleware, optionalAuth, requireAdmin };
