const User = require('./user');
const Request = require('./request');

// Инициализация связей между моделями
// Связь: один пользователь может создавать много заявок
User.hasMany(Request, { foreignKey: 'user_id', as: 'Requests' });
Request.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

module.exports = {
  User,
  Request
};
