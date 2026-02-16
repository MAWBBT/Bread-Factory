const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db');

// Заявка на производство/отгрузку хлеба
class Request extends Model {}

Request.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    breadType: {
      // тип хлеба, который требуется произвести/отгрузить
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantityKg: {
      // объем заказа в килограммах
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      // например: 'new', 'in_progress', 'done', 'rejected'
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'new',
    },
  },
  {
    sequelize,
    modelName: 'Request',
    tableName: 'requests',
    underscored: true,
  }
);

// Связи определены в models/index.js для избежания циклических зависимостей
module.exports = Request;
