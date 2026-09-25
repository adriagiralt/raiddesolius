const Agulla = require('../models/agulla.model');
const Via = require('../models/via.model');
const sequelize = require('../utils/db');

const getAgulla = async (codi) => {
    try {
      const agulla = await Agulla.findOne({
        where: { codi: codi },
        include: [{ model: Via,
          where: { visible: 1 }}],
          order: [
              [Via, 'grau', 'ASC'],
              [Via, 'nom', 'ASC']
          ]
      });
      return agulla
    } catch (error) {
      console.error('Error trobant agulles:', error);
    }
};

const getAgullaById = async (id) => {
  try {
    const agulla = await Agulla.findOne({
      where: { id: id },
      include: [{ model: Via,
        where: { visible: 1 }}],
        order: [
            [Via, 'grau', 'ASC'],
            [Via, 'nom', 'ASC']
        ]
    });
    return agulla
  } catch (error) {
    console.error('Error trobant agulles:', error);
  }
};

const getAgullaGraus = async (id) => {
  try {
    const [results, metadata] = await sequelize.query(`SELECT agulles.id, GROUP_CONCAT(DISTINCT vies.grau ORDER BY vies.grau ASC SEPARATOR ',') AS graus FROM agulles JOIN vies ON vies.agulla_id = agulles.id WHERE agulles.id = ${id} GROUP BY agulles.id`);

    return results;
  }
  catch (error) {
    console.error('Error al trobar els graus de les agulles', error);
    throw error;
  }
}

const getAgullaRanking = async () => {
  try {
    const [results, metadata] = await sequelize.query(`SELECT a.nom, Count(enc.id) as total FROM agulles a, encadenats enc WHERE enc.agulla_id = a.id AND a.id < 100 GROUP BY a.nom ORDER BY total DESC`);

    return results;
  }
  catch (error) {
    console.error('Error al trobar els graus de les agulles', error);
    throw error;
  }
}
  
  
module.exports = {
    getAgulla,
    getAgullaById,
    getAgullaGraus,
    getAgullaRanking
};