// Fictional event snapshot. All API responses come from these same records.
const teams = [
  { id: 1, nom: 'Els Gats de Solius', tipus: 'Normal' },
  { id: 2, nom: 'Granítics', tipus: 'Normal' },
  { id: 3, nom: "L'Última Presa", tipus: 'Normal' },
  { id: 4, nom: 'Peus de Gat & Companyia', tipus: 'Normal' },
  { id: 5, nom: 'Les Formigues', tipus: 'Descoberta' },
  { id: 6, nom: 'Corda Llarga', tipus: 'Normal' },
  { id: 7, nom: 'Camins de Roca', tipus: 'Trail' },
  { id: 8, nom: 'Sense Pressa, Però Sense Pausa', tipus: 'Descoberta' },
];

const pinnacles = [
  { id: 1, nom: 'Agulla del Pi', via: 'Aresta del sol' },
  { id: 2, nom: 'Roca del Vent', via: 'La fissura' },
  { id: 3, nom: 'Agulla Petita', via: 'Via dels amics' },
  { id: 4, nom: 'La Talaia', via: 'Esperó de llevant' },
  { id: 5, nom: 'Roca Llarga', via: 'Pas de gegant' },
  { id: 6, nom: 'Agulla del Bosc', via: 'Línia verda' },
  { id: 28, nom: 'Arribada', via: null },
  { id: 200, nom: 'Bonus', via: null },
];

// [team, pinnacle, points]. IDs 28 and 200 follow the existing event rules.
const records = [
  [1, 1, 12], [2, 1, 12], [3, 2, 15], [4, 1, 10], [5, 3, 8], [6, 2, 15], [7, 1, 5],
  [1, 2, 15], [2, 3, 8], [3, 1, 12], [4, 3, 8], [5, 1, 10], [6, 4, 20], [7, 3, 5],
  [1, 3, 8], [2, 4, 20], [3, 4, 20], [4, 2, 15], [5, 5, 12], [6, 5, 12], [7, 5, 5],
  [1, 4, 20], [2, 5, 12], [3, 5, 12], [4, 6, 14], [1, 5, 12], [2, 6, 14],
  [1, 200, 20], [2, 28, 0], [7, 28, 0], [1, 6, 14],
].map(([teamId, pinnacleId, punts], index) => ({
  teamId, pinnacleId, punts,
  createdAt: new Date(Date.UTC(2026, 8, 27, 7, index * 7)).toISOString(),
}));

function ranking() {
  // The live query omits teams with no records, including fixture team 8.
  return teams.flatMap(team => {
    const climbs = records.filter(record => record.teamId === team.id);
    return climbs.length ? [{
      id: team.id,
      nom: team.nom,
      punts: climbs.reduce((sum, record) => sum + record.punts, 0).toFixed(2),
      agulles: climbs.filter(record => record.pinnacleId <= 25).length,
    }] : [];
  });
}

function latest(teamId) {
  return records.filter(record => teamId === undefined || record.teamId === teamId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(record => {
      const pinnacle = pinnacles.find(item => item.id === record.pinnacleId);
      return {
        equipNom: teams.find(team => team.id === record.teamId).nom,
        agullaNom: pinnacle.nom,
        viaNom: pinnacle.via,
        punts: record.punts.toFixed(2),
        createdAt: record.createdAt,
      };
    });
}

function pinnacleCounts() {
  return pinnacles.map(pinnacle => ({
    ...pinnacle,
    total: records.filter(record => record.pinnacleId === pinnacle.id).length,
  })).filter(pinnacle => pinnacle.total > 0).sort((a, b) => b.total - a.total);
}

module.exports = {
  getRanking: () => ranking().sort((a, b) => Number(b.punts) - Number(a.punts)),
  getRankingByAgulla: () => ranking().sort((a, b) => b.agulles - a.agulles || Number(b.punts) - Number(a.punts)),
  getLastEncadenats: () => latest(),
  getLastEncadenatsByTeam: id => latest(id),
  getTeams: () => teams,
  getTeamsNoAcabat: () => teams
    .filter(team => !records.some(record => record.teamId === team.id && record.pinnacleId === 28))
    .map(({ nom }) => ({ nom })),
  getAgullaRanking: () => pinnacleCounts().filter(pinnacle => pinnacle.id < 100)
    .map(({ nom, total }) => ({ nom, total })),
  getTopAgulla: () => {
    const top = pinnacleCounts()[0];
    return top ? { agulla_id: top.id, total: top.total, Agulla: { nom: top.nom } } : null;
  },
};
