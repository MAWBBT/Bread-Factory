const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getRequestById,
  createRequest,
  deleteRequest
} = require('../controllers/requestController');

// GET /requests - получить все заявки
router.get('/', getAllRequests);

// GET /requests/:id - получить заявку по id
router.get('/:id', getRequestById);

// POST /requests - создать новую заявку
router.post('/', createRequest);

// DELETE /requests/:id - удалить заявку по id
router.delete('/:id', deleteRequest);

module.exports = router;
