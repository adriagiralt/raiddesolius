const { Markup } = require('telegraf');

const teamController = require('../../../controllers/team.controller')
const encadenatController = require('../../../controllers/encadenat.controller');


const handleBonusCommand = () => async (ctx) => {
    const equips = await teamController.getTeams()

    console.log(equips)

    let teclat = []
    equips.forEach(equip => {
    teclat.push([Markup.button.callback(equip.dataValues.nom, "equip_" + equip.dataValues.id)]);
    });

    teclat.push([Markup.button.callback("Cancel·lar", "cancel")])

    ctx.reply(`A qui vols posar un <b>Bonus</b>?`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } )
}

const handleBonusTeamAction = () => async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    const selectedOptionSplited = selectedOption.split("_");

    const equip_id = selectedOptionSplited[1]

    //HARDCODED BONUSES MOLT MALAMENT!
    const bonuses = [["Equipament", 4001, 20], ["Logotip", 4002, 10], ["Bossa d'escombraries", 4003, 10], ["Disfressats", 4004, 5] ]

    let teclat = []
    bonuses.forEach(bonus => {
        teclat.push([Markup.button.callback(bonus[0], "bonus_" + equip_id + "_" + bonus[1] + "_" + bonus[2])])
    })

    teclat.push([Markup.button.callback("Cancel·lar", "cancel")])

    ctx.editMessageText(`Quin <b>bonus</b> vols atorgar?`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } ).catch(error => console.error('Error edit bonus 39:', error));
}

const handleGiveBonusAction = () => async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut

    const selectedOptionSplited = selectedOption.split("_");

    const equip_id = selectedOptionSplited[1]
    const bonus_id = selectedOptionSplited[2]
    const points = selectedOptionSplited[3]

    const equip = await teamController.getTeam(equip_id)

    const ja_te_bonus = await encadenatController.getEncadenatByEquipIViaId(equip_id, bonus_id)

    //HARDCODED BONUSES
    bonus = {4001: "Equipament", 4002: "Logotip", 4003: "Bossa d'escombaries", 4004: "Arribada"}

    if (ja_te_bonus) {
        ctx.editMessageText(`L'equip <b>${equip.dataValues.nom}</b> ja tenia el bonus <b>${bonus[bonus_id]}</b>!`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard([]).reply_markup } ).catch(error => console.error('Error edit bonus 59:', error));
        return
    }
    try {
        await encadenatController.setEncadenat(equip_id, 200, bonus_id, null, points, null)
    }
    catch (err) {
        console.log ("oopsie bonus handler 54")
    }

    
    
    ctx.editMessageText(`Bonus <b>${bonus[bonus_id]}</b> atorgat a l'equip <b>${equip.dataValues.nom}</b>!`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard([]).reply_markup } ).catch(error => console.error('Error edit bonus 71:', error));
}

module.exports = { 
    handleBonusCommand,
    handleBonusTeamAction,
    handleGiveBonusAction
};