const { Sequelize } = require('sequelize');

const DB_NAME = 'bread_factory';     // имя базы данных
const DB_USER = 'postgres';          // пользователь БД
const DB_PASSWORD = '4x24oqwpH'; // пароль пользователя
const DB_HOST = 'localhost';         // хост
const DB_PORT = 5432;                // порт PostgreSQL по умолчанию

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false, // можно включить при отладке
});

module.exports = {
  sequelize,
  Sequelize,
};

