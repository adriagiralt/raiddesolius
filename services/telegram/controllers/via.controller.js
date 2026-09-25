const userController = require('../../../controllers/user.controller');
const encadenatController = require('../../../controllers/encadenat.controller');

const handleViesCommand = () => async (ctx) => {
    const user = await userController.addUser(ctx.from.id)
    
    const vies = await encadenatController.getViesByEquip(user.dataValues.team_id)

    console.log(vies)
    const opcions = { hour: '2-digit', minute: '2-digit', hour12: false };
    let response = "<b>Encadenaments:</b>"
    vies.forEach( via => {
      const hora = via.createdAt.toLocaleTimeString('ca-ES', opcions);
      if (via.grau == null && via.encgrau == null) {
        response += (`\n[${via.anom}] - ${hora}`)
      }
      else {
        const grau = via.grau !== null ? via.grau : via.encgrau
        const nova = grau[grau.length - 1] === "*"
        response += (`\n${via.nom || (nova ? "Via nova" : "Via desconeguda")} <b>${grau}</b> [${via.anom}] - ${via.punts} - ${hora}`)
      }
    })

    await ctx.reply(response, { parse_mode: 'html'})
  }


module.exports = { 
    handleViesCommand
};