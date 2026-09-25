const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const Equip = require('./equip.model');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  telegram_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Equip, // Relacionem amb el model Equip
      key: 'id',
    },
  },
}, {
    timestamps: false, // Desactiva els camps createdAt i updatedAt
    tableName: 'users'
  });

User.belongsTo(Equip, { foreignKey: 'team_id' , constraints: false});
Equip.hasMany(User, { foreignKey: 'team_id' , constraints: false});

module.exports = User;