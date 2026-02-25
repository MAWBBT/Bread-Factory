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

// GET /requests - получить все заявки
router.get('/', getAllRequests);

// GET /requests/:id - получить заявку по id
router.get('/:id', getRequestById);

// POST /requests - создать новую заявку (если есть токен — user_id подставится автоматически)
router.post('/', optionalAuth, createRequest);

// PATCH /requests/:id - изменить заявку (статус и т.д.) — только админ
router.patch('/:id', authMiddleware, requireAdmin, updateRequest);

// DELETE /requests/:id - удалить заявку (с optionalAuth для проверки прав)
router.delete('/:id', optionalAuth, deleteRequest);

module.exports = router;
