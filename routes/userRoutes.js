const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser
} = require('../controllers/userController');

// GET /users - получить всех пользователей
router.get('/', getAllUsers);

// GET /users/:id - получить пользователя по id
router.get('/:id', getUserById);

// POST /users - создать нового пользователя
router.post('/', createUser);

// DELETE /users/:id - удалить пользователя по id
router.delete('/:id', deleteUser);

module.exports = router;
