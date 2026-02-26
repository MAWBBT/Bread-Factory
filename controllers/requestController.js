const { Request, User } = require('../models');

// GET - выдать все строки таблицы заявок
// Обычные пользователи видят только свои заявки, админы - все
async function getAllRequests(req, res) {
  try {
    let requests;
    if (req.user && req.user.isAdmin) {
      // Админ видит все заявки
      requests = await Request.findAll({
        order: [['id', 'DESC']]
      });
    } else if (req.user) {
      // Обычный пользователь видит только свои заявки
      requests = await Request.findAll({
        where: { user_id: req.user.id },
        order: [['id', 'DESC']]
      });
    } else {
      // Неавторизованный пользователь не видит заявки
      requests = [];
    }
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
// Статус автоматически устанавливается в "in_progress", пользователи не могут его выбирать
async function createRequest(req, res) {
  try {
    const { breadType, quantityKg } = req.body;
    
    if (!breadType || !quantityKg) {
      return res.status(400).json({ error: 'Поля breadType и quantityKg обязательны' });
    }

    // Проверяем, что пользователь авторизован
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация для создания заявки' });
    }

    // Статус автоматически устанавливается в "in_progress"
    const request = await Request.create({
      breadType,
      quantityKg,
      status: 'in_progress', // Автоматически "В работе"
      user_id: req.user.id
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
