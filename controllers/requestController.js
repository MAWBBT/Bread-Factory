const { Request, User } = require('../models');

// GET - выдать все строки таблицы заявок
async function getAllRequests(req, res) {
  try {
    const requests = await Request.findAll();
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

// POST - создать новую заявку (user_id из токена, если авторизован)
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
      user_id: req.user ? req.user.id : (user_id || null)
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH - обновить заявку (статус, тип, объём) — только админ
async function updateRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, breadType, quantityKg } = req.body;

    const request = await Request.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    if (status !== undefined) request.status = status;
    if (breadType !== undefined) request.breadType = breadType;
    if (quantityKg !== undefined) request.quantityKg = quantityKg;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE - удалить заявку (админ — любую; пользователь — только свою)
async function deleteRequest(req, res) {
  try {
    const { id } = req.params;
    const request = await Request.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    if (req.user) {
      const canDelete = req.user.isAdmin || request.user_id === req.user.id;
      if (!canDelete) {
        return res.status(403).json({ error: 'Можно удалять только свои заявки' });
      }
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
  updateRequest,
  deleteRequest,
};
