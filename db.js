const { Sequelize } = require('sequelize');

const DB_NAME = 'bread_factory';
const DB_USER = 'postgres';
const DB_PASSWORD = '12345678';
const DB_HOST = 'localhost';
const DB_PORT = 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
});

module.exports = {
  sequelize,
  Sequelize,
};

