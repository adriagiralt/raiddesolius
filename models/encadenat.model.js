const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Encadenat = sequelize.define('Encadenat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  equip_id: {
    type: DataTypes.INTEGER,
  },
  agulla_id: {
    type: DataTypes.INTEGER
  },
  via_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  exit: {
    type: DataTypes.INTEGER
  },
  punts: {
    type: DataTypes.DECIMAL(10, 2)
  },
  grau: {
    type: DataTypes.STRING
  }
},{
  tableName: 'encadenats'
}
);

const Agulla = require('./agulla.model');
Encadenat.belongsTo(Agulla, { foreignKey: 'agulla_id', constraints: false });

module.exports = Encadenat;