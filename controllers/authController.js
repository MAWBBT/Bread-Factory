const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'bread-factory-secret-key';
const SALT_ROUNDS = 10;

// Регистрация: хешируем пароль и создаём пользователя
async function register(req, res) {
  try {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Пароль не менее 4 символов' });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false,
    });
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, isAdmin: !!user.isAdmin },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Вход: проверка пароля (поддержка старого plain и bcrypt) и выдача JWT
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    let match = false;
    if (user.password.startsWith('$2')) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = password === user.password;
    }
    if (!match) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, isAdmin: !!user.isAdmin },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Текущий пользователь по JWT (для фронта)
async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'isAdmin'],
    });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    // Явно возвращаем объект в нужном формате
    res.json({
      id: user.id,
      username: user.username,
      isAdmin: !!user.isAdmin, // Убеждаемся, что это boolean
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { register, login, me, JWT_SECRET };
