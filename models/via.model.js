const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const Agulla = require('./agulla.model');

const Via = sequelize.define('Via', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  grau: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codi: {
    type: DataTypes.INTEGER
  },
  agulla_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Agulla, // Relacionem amb el model Equip
      key: 'id',
    },
  },
  visible: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 1
  },
}, {
    timestamps: false, // Desactiva els camps createdAt i updatedAt
    tableName: 'vies'
  },
);

Via.belongsTo(Agulla, { foreignKey: 'agulla_id' , constraints: false});
Agulla.hasMany(Via, { foreignKey: 'agulla_id' , constraints: false});

module.exports = Via;