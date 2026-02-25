const http = require('http');
const path = require('path');
const cors = require('cors');
const express = require('express');
const { sequelize } = require('./db');

// Импорт моделей для инициализации связей
require('./models');

// Импорт роутеров
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Статика фронтенда
app.use(express.static('public'));

// API
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/requests', requestRoutes);

// SPA: для GET-запросов не к API отдаём index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/auth') || req.path.startsWith('/users') || req.path.startsWith('/requests')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) next();
  });
});

// Инициализация базы данных
async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('Подключение к БД установлено.');

    // Синхронизация моделей с БД
    await sequelize.sync({ alter: true });
    console.log('Модели синхронизированы с БД.');

    // Создадим тестовых пользователей, если их ещё нет
    const { User } = require('./models');
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: { password: 'adminpass', isAdmin: true },
    });

    const [worker] = await User.findOrCreate({
      where: { username: 'worker' },
      defaults: { password: 'workerpass', isAdmin: false },
    });

    console.log('Тестовые пользователи созданы.');
    console.log('Admin id:', admin.id, 'isAdmin:', admin.isAdmin);
    console.log('Worker id:', worker.id, 'isAdmin:', worker.isAdmin);
  } catch (error) {
    console.error('Ошибка при инициализации БД:', error);
    throw error;
  }
}

// Запуск сервера
const server = async () => {
  await initDB();
  http.createServer(app).listen(
    port,
    () => console.info(`Server running on port ${port}`)
  );
};

server().catch(console.error);
