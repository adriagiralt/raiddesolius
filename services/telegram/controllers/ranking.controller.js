const userController = require('../../../controllers/user.controller');
const encadenatController = require('../../../controllers/encadenat.controller');

const handleRankingComand = () => async (ctx) => {
    const ranking = await encadenatController.getRanking()

    let message = "RANKING:\nPosició NOM (Nombre d'agulles) Punts"

    let counter = 1

    ranking.forEach(equip => {
      message += `\n<b>${counter++}</b> - ${equip.nom} (${equip.agulles}) ${equip.punts}`
    });

    await ctx.reply(message, { parse_mode: 'html' });
  }

const handleMyPositionCommands = () => async (ctx) => {
    const user = await userController.addUser(ctx.from.id)
    const ranking = await encadenatController.getRanking()

    let pos = 0
    let i = 0
    let punts_totals = 0
    ranking.forEach(team => {
      i++
      if (team.id === user.dataValues.team_id) {
        pos = i
        punts_totals = team.punts
      }
    })

    await ctx.reply(`Esteu en ${pos}a posició!\nTeniu ${punts_totals} punts!`);
  
}

module.exports = { 
    handleRankingComand,
    handleMyPositionCommands
};