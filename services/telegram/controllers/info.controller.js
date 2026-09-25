const userController = require('../../../controllers/user.controller');
const teamController = require('../../../controllers/team.controller');

const handleInfoCommand = () => async (ctx) => {
    const user = await userController.addUser(ctx.from.id, ctx.from.username);
    let message = ""
    if (user.dataValues.Equip === undefined || user.dataValues.Equip === null) {
        message += ` El teu id és ${ctx.from.id} \nNo tens equip, dona el teu id a l'organització`;
    } 
    else {
        message += `El teu equip és <b>${user.dataValues.Equip.nom}</b>\nEls components del teu equip són:`;
        const team = await teamController.getTeam(user.dataValues.Equip.id)
        console.log(team)
        team.Users.forEach(user => {
          //console.log(`Usuari de l'equip: ${user.nom}`);
          message += `\n - ${user.nom}`
        });
    }

    await ctx.reply(message, { parse_mode: 'html' });
  }

module.exports = { 
    handleInfoCommand  
};