const { User, Request } = require('../models');

// GET - получить всех пользователей
async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      include: [{
        model: Request,
        as: 'Requests'
      }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET - получить пользователя по id с зависимыми таблицами
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      include: [{
        model: Request,
        as: 'Requests'
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST - создать нового пользователя
async function createUser(req, res) {
  try {
    const { username, password, isAdmin } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Поля username и password обязательны' });
    }

    const user = await User.create({
      username,
      password,
      isAdmin: isAdmin || false
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE - удалить пользователя по id
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Пользователь успешно удален', deletedUser: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser
};
