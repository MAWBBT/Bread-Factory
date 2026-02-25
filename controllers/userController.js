const bcrypt = require('bcrypt');
const { User, Request } = require('../models');

const SALT_ROUNDS = 10;
const userAttributes = ['id', 'username', 'isAdmin', 'createdAt', 'updatedAt'];

// GET - выдать всех пользователей (без паролей)
async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: userAttributes,
      include: [{ model: Request, as: 'Requests', attributes: ['id', 'breadType', 'quantityKg', 'status'] }],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET - получить пользователя по id с зависимыми таблицами (без пароля)
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      attributes: userAttributes,
      include: [{ model: Request, as: 'Requests' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST - создать нового пользователя (админ; пароль хешируется)
async function createUser(req, res) {
  try {
    const { username, password, isAdmin } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Поля username и password обязательны' });
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

    res.status(201).json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PUT - редактировать пользователя (админ)
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password, isAdmin } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (username !== undefined) user.username = username;
    if (isAdmin !== undefined) user.isAdmin = !!isAdmin;
    if (password !== undefined && password !== '') {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }
    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE - удалить пользователя по id (админ)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await user.destroy();
    res.status(200).json({
      message: 'Пользователь успешно удален',
      deletedUser: { id: user.id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
