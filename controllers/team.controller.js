const Equip = require('../models/equip.model');
const User = require('../models/user.model');
const sequelize = require('../utils/db');

const getTeam = async (team_id) => {
    try {
      const team = await Equip.findOne({
        where: { id: team_id },
        include: [{ model: User }]
      });
      return team
    } catch (error) {
      console.error('Error afegint usuari:', error);
    }
};

const getTeams = async () => {
  try {
    const teams = await Equip.findAll();
    return teams
  } catch (error) {
    console.error('Error cercant equips:', error);
  }
}

const getTeamsNoAcabat = async (id) => {
  try {
    

    const [results, metadata] = await sequelize.query(`SELECT e.nom FROM equips e WHERE e.id  NOT IN (SELECT equip_id FROM encadenats WHERE agulla_id = 28)`);

    return results;
  }
  catch (error) {
    console.error('Error al trobar els graus de les agulles', error);
    throw error;
  }
}
  
  
module.exports = {
    getTeam,
    getTeams,
    getTeamsNoAcabat
};