const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const Area = require('./area.model');

const Agulla = sequelize.define('Agulla', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codi: {
    type: DataTypes.INTEGER,
  },
  punts: {
    type: DataTypes.INTEGER
  },
  graus: {
    type: DataTypes.STRING
  },
}, {
    timestamps: false, // Desactiva els camps createdAt i updatedAt
    tableName: 'agulles'
  },
);

Agulla.belongsTo(Area, { foreignKey: 'area_id' , constraints: false});
Area.hasMany(Agulla, { foreignKey: 'area_id' , constraints: false});

module.exports = Agulla;