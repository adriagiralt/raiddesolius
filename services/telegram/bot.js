const { Markup } = require('telegraf');

const userController = require('../../controllers/user.controller');
const { handleText } = require('./controllers/text.controller');
const { handleInfoCommand } = require('./controllers/info.controller');
const { handleRankingComand, handleMyPositionCommands } = require('./controllers/ranking.controller');
const { handleViesCommand } = require('./controllers/via.controller');
const { handleBonusCommand, handleBonusTeamAction, handleGiveBonusAction } = require('./controllers/bonus.controller');
const { handleCancelAction } = require('./controllers/cancel.controller')

const teamController = require('../../controllers/team.controller');
const agullaController = require('../../controllers/agulla.controller');
const viaController = require('../../controllers/via.controller');
const encadenatController = require('../../controllers/encadenat.controller');

const { checkAdminPolicy } = require('./utils/policies')

const { check_arees } = require('./utils/check_arees');

const utils = require('../../utils/utils');

const registerCommands = (bot) => {
  // Comanda d'inici /start
  //bot.start(handleStartCommand(userController));
  bot.start(handleInfoCommand());

  // Altres comandes poden ser afegides aquí
  bot.command('info', handleInfoCommand());

  bot.command('ranking', handleRankingComand())

  bot.command('posicio', handleMyPositionCommands())

  bot.command('vies', handleViesCommand())

  bot.command('bonus', checkAdminPolicy, handleBonusCommand())

  bot.on('text', handleText());

  bot.action('cancel', handleCancelAction());

  bot.action(/equip_(\d+)/, handleBonusTeamAction());

  bot.action(/bonus_(\d+)_(\d+)_(\d+)/, handleGiveBonusAction());

  bot.action(/via_(\d+)/, async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    const id = selectedOption.split('_')[1]
    const via = await viaController.getVia(id)

    let teclat = [
      [Markup.button.callback("Tots", "encadenat_2_" + via.id)],
      [Markup.button.callback("Alguns", "encadenat_1_" + via.id)],
      [Markup.button.callback("Cap", "encadenat_0_" + via.id)],
    ]
    
    teclat.push([Markup.button.callback("Cancel·lar", "cancel")])

    ctx.editMessageText(`Heu seleccionat la Via <b>${via.nom}</b>\nQuants heu encadenat?`, {
      reply_markup: { inline_keyboard: teclat },
      parse_mode: 'html'
    }).catch(error => console.error('Error edit 63:', error));
  });

  bot.action(/agulla_nose_(\d+)/, async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    console.log(selectedOption)

    const id = selectedOption.split('_')[2]
    const agulla = await agullaController.getAgullaById(id)
    const mec = await agullaController.getAgullaGraus(id)

    console.log(mec)

    if (agulla != null) {
      const graus = (mec.length > 0 ? mec[0]["graus"].split(","): "4,4+,5,5+,6a,6a+,6b,6b+,6c,6c+,7a".split(','))
      let teclat = []
      graus.forEach(grau => {
       teclat.push([Markup.button.callback(grau, "agulla_" + id + "_" + grau)]);
     });
     
     teclat.push([Markup.button.callback("Cancel·lar", "cancel")])
     ctx.editMessageText(`Quin grau heu fet?`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } ).catch(error => console.error('Error edit 85:', error));
    }
    else {
      ctx.editMessageText(`Aquest codi no és de cap agulla.`).catch(error => console.error('Error edit 88:', error));;
    }
  })

  bot.action(/agulla_nova_(\d+)/, async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    console.log(selectedOption)

    const id = selectedOption.split('_')[2]
    const agulla = await agullaController.getAgullaById(id)

    if (agulla != null) {
      const graus = "4,4+,5,5+,6a,6a+,6b,6b+,6c,6c+,7a".split(',')
      let teclat = []
      graus.forEach(grau => {
       teclat.push([Markup.button.callback(grau, "agulla_" + id + "_" + grau + "*")]);
     });
     
     teclat.push([Markup.button.callback("Cancel·lar", "cancel")])
     ctx.editMessageText(`Quin grau heu fet?`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } ).catch(error => console.error('Error edit 108:', error));
    }
    else {
      ctx.editMessageText(`Aquest codi no és de cap agulla.`).catch(error => console.error('Error edit 111:', error));;
    }
  })



  bot.action(/encadenat_(\d+)_(\d+)$/, async (ctx) => {

    console.log("ENCADENAT! 119")
    
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    const selectedOptionSplited = selectedOption.split("_");
    const id = selectedOptionSplited[2]
    const encadenats = selectedOptionSplited[1]

    const via = (id != 0 ? await viaController.getVia(id) : null)

    console.log(via)
    console.log(via.Agulla)

    const punts_via = utils.calcula_punts(via.grau)

    const punts = via.Agulla.punts + punts_via * encadenats / 2

    console.log(ctx.from.id)
    const user = await userController.addUser(ctx.from.id)
    console.log(user)

    await encadenatController.deleteEncadenatByAgullaTeam(via.agulla_id, user.dataValues.team_id)

    await encadenatController.setEncadenat(user.dataValues.team_id, via.agulla_id, via.id, encadenats, punts)

    await check_arees(user.dataValues.team_id, ctx)

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
    
    ctx.editMessageText(`Heu fet ${punts || 0} Punts!\nEn teniu ${punts_totals}!\nAneu en ${pos}a posició!`, {
      reply_markup: { inline_keyboard: [] },
      parse_mode: 'html'
    }).catch(error => console.error('Error edit 162:', error));;
  });

  bot.action(/encadenat_(\d+)_(\d+)_([a-zA-Z0-9\+]+)/, async (ctx) => {

    console.log("NO HO SE! 198")
    
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    const selectedOptionSplited = selectedOption.split("_");
    const id = selectedOptionSplited[2]
    const encadenats = selectedOptionSplited[1]
    const grau = selectedOptionSplited[3]

    const agulla = await agullaController.getAgullaById(id)

    const punts_via = utils.calcula_punts(grau)

    const punts = agulla.punts + punts_via * encadenats / 2

    const user = await userController.addUser(ctx.from.id)

    await encadenatController.deleteEncadenatByAgullaTeam(id, user.dataValues.team_id)

    await encadenatController.setEncadenat(user.dataValues.team_id, id, null, encadenats, punts, grau)

    await check_arees(user.dataValues.team_id, ctx)

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

    ctx.editMessageText(`Heu fet ${punts} Punts!\nEn teniu ${punts_totals}!\nAneu en ${pos}a posició!`, {
      reply_markup: { inline_keyboard: [] },
      parse_mode: 'html'
    }).catch(error => console.error('Error edit 206:', error));;
  });

  bot.action(/agulla_(\d+)_([a-zA-Z0-9\+]+)/, async(ctx) => {

    console.log("NO HO SE!!!! 242")
    
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut
  
    const selectedOptionSplited = selectedOption.split("_");
    const id = selectedOptionSplited[1]
    const grau = selectedOptionSplited[2]
  
    let teclat = [
      [Markup.button.callback("Tots", "encadenat_2_" + id + "_" + grau)],
      [Markup.button.callback("Alguns", "encadenat_1_" + id + "_" + grau)],
      [Markup.button.callback("Cap", "encadenat_0_" + id + "_" + grau)],
    ]

    teclat.push([Markup.button.callback("Cancel·lar", "cancel")])
  
    const tipus_via = (grau[grau.length - 1] === "*" ? "nova" : "desconeguda")
    ctx.editMessageText(`Heu seleccionat una Via ${tipus_via} de grau <b>${grau}</b>.\nQuants heu encadenat?`, {
      reply_markup: { inline_keyboard: teclat },
      parse_mode: 'html'
    }).catch(error => console.error('Error edit 231:', error));;
    
    
  });
};


module.exports = {
  registerCommands,
};