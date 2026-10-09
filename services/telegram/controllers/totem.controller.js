const teamController = require("../../../controllers/team.controller");
const userController = require("../../../controllers/user.controller");
const encadenatController = require("../../../controllers/encadenat.controller");
const { Markup } = require('telegraf');

const handleTotemAction = () => async (ctx) => {
    const selectedOption = ctx.callbackQuery.data; // Obtenim el text del botó premut
    const selectedOptionSplited = selectedOption.split("_");
    const totem_id = Number(selectedOptionSplited[1]);
    const options = selectedOptionSplited.length;
    const user = await userController.addUser(ctx.from.id)

    const totemsEspecials = new Set([3003, 3004, 3005, 3006, 3007]);

    const messages = {
        3003: "Trieu a quin equip regalareu <b>5 punts</b>.",
        3004: "Trieu a quin equip restareu <b>5 punts</b>.",
        3005: "Trieu a quin equip restareu <b>10 punts</b>.\n(i a vosaltres se us en restaran 5)",
        3006: "Trieu a quin equip regalareu <b>5 punts</b>.",
        3007: "Trieu a quin equip restareu <b>10 punts</b>.\n(i a vosaltres se us en restaran 5)"
    }
    const punts = {
        3003: {"ells": 5, "nosaltres": 0},
        3004: {"ells": -5, "nosaltres": 0},
        3005: {"ells": -10, "nosaltres": -5},
        3006: {"ells": 5, "nosaltres": 0},
        3007: {"ells": -10, "nosaltres": -5}
    }

    if (totemsEspecials.has(totem_id) && options == 2){
        const equips = await teamController.getTeams();
        // Filtrador: es queda amb tots els equips EXCEPTE el que té la ID indicada
        const equipsFiltrats = equips.filter(equip => equip.id !== user.team_id);
        const teclat = equipsFiltrats.map(equip => [Markup.button.callback(equip.nom, `totem_${totem_id}_${equip.id}`)]);
                
        await ctx.editMessageText(messages[totem_id], {
                parse_mode: 'html', ...Markup.inlineKeyboard(teclat)})
    } else if (totemsEspecials.has(totem_id) && options == 3) {
        const team_id = selectedOptionSplited[2];
        const equip = await teamController.getTeam(team_id);
        let text = `Li regalareu <b>5 punts</b> a l'equip <b>${equip.nom}</b>`;
        if (totem_id == 3004) text = `Li restareu <b>5 punts</b> a l'equip <b>${equip.nom}</b>`;
        if (totem_id == 3005 || totem_id == 3007) text = `Li restareu <b>10 punts</b> a l'equip <b>${equip.nom}</b> i vosaltres en perdreu 5</b>`;
        await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: [
            [Markup.button.callback("Confirmar", `totem_${totem_id}_${equip.id}_OK`)],
            [Markup.button.callback("Cancel·lar", `totem_${totem_id}`)]] },
        parse_mode: 'html'
      }).catch(error => console.error('Error edit cancel:', error));
    } else if (totemsEspecials.has(totem_id) && options == 4) {

        const encadenat = await encadenatController.getEncadenatByViaId(totem_id)
        
        if (encadenat == null) {
            const team_id = selectedOptionSplited[2];
            const equip = await teamController.getTeam(team_id);
            const teu_equip = await teamController.getTeam(user.team_id);
            await encadenatController.setEncadenat(team_id, 300, totem_id, null, punts[totem_id].ells, null)
            await encadenatController.setEncadenat(user.team_id, 300, totem_id, null, punts[totem_id].nosaltres, null)
            let text = `Li heu donat <b>5 punts</b> a l'equip <b>${equip.nom}</b>`;
            if (totem_id == 3004) text = `Li heu restat <b>5 punts</b> a l'equip <b>${equip.nom}</b>`;
            if (totem_id == 3005 || totem_id == 3007) text = `Li heu restat <b>10 punts</b> a l'equip <b>${equip.nom}</b> i vosaltres n'heu perdut 5</b>`;
            await ctx.editMessageText(text, {
                reply_markup: { inline_keyboard: [] },
                parse_mode: 'html'
            }).catch(error => console.error('Error edit cancel:', error));

            console.log(equip.Users)

            for (const usuari of equip.Users) {
                // Assegura't de fer servir la propietat correcta on guardes la Telegram ID
                const telegramId = usuari.telegram_id; // o usuari.telegramId, usuari.id, etc.

                if (!telegramId) continue; // Salta si l'usuari no té ID de Telegram

                const message_send = {
                    3003: `⚠️ L'equip <b>${teu_equip.nom}</b> us ha regalat <b>5 punts</b>!`,
                    3004: `⚠️ L'equip <b>${teu_equip.nom}</b> us ha restat <b>5 punts</b>!`,
                    3005: `⚠️ L'equip <b>${teu_equip.nom}</b> ha gastat 5 punts per restar-vos <b>10 punts</b>!`,
                    3006: `⚠️ L'equip <b>${teu_equip.nom}</b> us ha regalat <b>5 punts</b>!`,
                    3007: `⚠️ L'equip <b>${teu_equip.nom}</b> ha gastat 5 punts per restar-vos <b>10 punts</b>!`
                }

                try {
                    await ctx.telegram.sendMessage(
                        telegramId,
                        message_send,
                        { parse_mode: 'html' }
                    );
                } catch (error) {
                    // Gestió d'errors si l'usuari ha bloquejat el bot o l'ID no és vàlida
                    console.error(`No s'ha pogut notificar a l'usuari ${telegramId}:`, error.response?.description || error.message);
                }
            }
        } else {
            await ctx.editMessageText(`Aquest poder ja ha estat utilitzat.`, {
                reply_markup: { inline_keyboard: [] },
                parse_mode: 'html'
            }).catch(error => console.error('Error edit cancel:', error));
        }
    }
}

module.exports = { 
    handleTotemAction  
};