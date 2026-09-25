const handleStartCommand = (userController) => async (ctx) => {
    const user = await userController.addUser(ctx.from.id, ctx.from.username);
    let message = `Benvingut, ${ctx.from.username || 'escalador'}!`;
  
    if (!user.dataValues.equip) {
      message += ` El teu id és ${ctx.from.id} \nNo tens equip, dona el teu id a l'organització`;
    } else {
      message += `\nEl teu equip és <b>${user.dataValues.Equip.nom}</b>`;
    }
    
    await ctx.reply(message, { parse_mode: 'html' });
  };
  
module.exports = { 
    handleStartCommand 
};