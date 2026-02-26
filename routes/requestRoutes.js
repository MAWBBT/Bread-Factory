const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} = require('../controllers/requestController');
const { optionalAuth, authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// GET /requests - получить все заявки (требуется авторизация)
router.get('/', authMiddleware, getAllRequests);

// GET /requests/:id - получить заявку по id
router.get('/:id', getRequestById);

// POST /requests - создать новую заявку (требуется авторизация)
router.post('/', authMiddleware, createRequest);

// PATCH /requests/:id - изменить заявку (статус и т.д.) — только админ
router.patch('/:id', authMiddleware, requireAdmin, updateRequest);

// DELETE /requests/:id - удалить заявку (с optionalAuth для проверки прав)
router.delete('/:id', optionalAuth, deleteRequest);

module.exports = router;
