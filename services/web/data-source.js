const db = require('../../utils/db');
const Agulla = require('../../models/agulla.model');
const Encadenat = require('../../models/encadenat.model');
const encadenats = require('../../controllers/encadenat.controller');
const teams = require('../../controllers/team.controller');
const agulles = require('../../controllers/agulla.controller');

module.exports = {
  getRanking: () => encadenats.getRanking(),
  getRankingByAgulla: () => encadenats.getRankingByAgulla(),
  getLastEncadenats: () => encadenats.getLastEncadenats(),
  getLastEncadenatsByTeam: id => encadenats.getLastEncadenatsByTeam(id),
  getTeams: () => teams.getTeams(),
  getTeamsNoAcabat: () => teams.getTeamsNoAcabat(),
  getAgullaRanking: () => agulles.getAgullaRanking(),
  async getTopAgulla() {
    const top = await Encadenat.findAll({
      attributes: [
        'agulla_id',
        [db.fn('COUNT', db.col('agulla_id')), 'total'],
      ],
      group: ['Encadenat.agulla_id', 'Agulla.id', 'Agulla.nom'],
      order: [[db.literal('total'), 'DESC']],
      limit: 1,
      include: [{ model: Agulla, attributes: ['nom'] }],
    });
    return top[0] || null;
  },
};
