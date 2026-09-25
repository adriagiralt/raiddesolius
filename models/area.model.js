const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Area = sequelize.define('Area', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
    timestamps: false, // Desactiva els camps createdAt i updatedAt
    tableName: 'arees'
  },
);

module.exports = Area;