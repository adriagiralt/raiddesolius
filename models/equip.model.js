const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Equip = sequelize.define('Equip', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipus: {
    type: DataTypes.ENUM('Normal', 'Descoberta', 'Trail'),
    allowNull: false,
    defaultValue: 'Normal'
  }
}, {
    timestamps: false, // Desactiva els camps createdAt i updatedAt
    tableName: 'equips'
  });

module.exports = Equip;