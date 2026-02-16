const { Request, User } = require('../models');

// GET - получить все заявки
async function getAllRequests(req, res) {
  try {
    const requests = await Request.findAll({
      include: [{
        model: User,
        as: 'User'
      }]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET - получить заявку по id с зависимыми таблицами
async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const request = await Request.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'User'
      }]
    });

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST - создать новую заявку
async function createRequest(req, res) {
  try {
    const { breadType, quantityKg, status, user_id } = req.body;
    
    if (!breadType || !quantityKg) {
      return res.status(400).json({ error: 'Поля breadType и quantityKg обязательны' });
    }

    const request = await Request.create({
      breadType,
      quantityKg,
      status: status || 'new',
      user_id: user_id || null
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE - удалить заявку по id
async function deleteRequest(req, res) {
  try {
    const { id } = req.params;
    
    const request = await Request.findByPk(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    await request.destroy();
    res.status(200).json({ message: 'Заявка успешно удалена', deletedRequest: request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  deleteRequest
};
