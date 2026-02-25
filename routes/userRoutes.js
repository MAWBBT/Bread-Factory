const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// Админ-маршруты: список, создание, редактирование, удаление пользователей
router.get('/', authMiddleware, requireAdmin, getAllUsers);
router.get('/:id', authMiddleware, requireAdmin, getUserById);
router.post('/', authMiddleware, requireAdmin, createUser);
router.put('/:id', authMiddleware, requireAdmin, updateUser);
router.delete('/:id', authMiddleware, requireAdmin, deleteUser);

module.exports = router;
