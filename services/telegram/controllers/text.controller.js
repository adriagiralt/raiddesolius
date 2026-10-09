const agullaController = require('../../../controllers/agulla.controller');
const viaController = require('../../../controllers/via.controller');
const userController = require('../../../controllers/user.controller');
const encadenatController = require('../../../controllers/encadenat.controller');
const totem_handler = require('../utils/totem_handler');

const { check_arees } = require('../utils/check_arees');

const { Markup } = require('telegraf');

const handleText = () => async (ctx) => {
    const message = ctx.message.text;
  
    // Comprova si el missatge és un número de 6 xifres
    const isSixDigitNumber = /^\d{6}$/.test(message);
  
    if (isSixDigitNumber) {
      // Aquí pots fer el que vulguis amb el número de 6 xifres
      //await ctx.reply(`Has enviat un número de 6 xifres: ${message}`);

      const user = await userController.addUser(ctx.from.id) //FALTA COMPROVAR NO PUJAR 2 VEGADES

      if (user.dataValues.Equip == null) {
        await ctx.reply(`No tens equip, contacta amb l'administració`);
        return;
      }

      console.log("ENTRAT CODI " + message)

       const agulla = await agullaController.getAgulla(message);

       const tipus_equip = user.dataValues.Equip.dataValues.tipus;
       
       if (tipus_equip == "Descoberta"){
        console.log(agulla)
        if (agulla == null){
          await ctx.reply(`Aquest codi és incorrecte`);
          return;
        }
         await encadenatController.replaceEncadenat(user.dataValues.team_id, agulla.id, null, null, 0, null)

         await ctx.reply(`Enhorabona! Heu pujat a l'Agulla <b>${agulla.nom}</b>`, {
            parse_mode: 'html'
            });
        return;
       }

       //hardcoded molt lleig si puges el cim del Montclar
       if (agulla && agulla.nom === "Montclar") {
            console.log("QUÈ PASSA? 50")
            const user = await userController.addUser(ctx.from.id)

            const montclar = await encadenatController.awardOnce(user.dataValues.team_id, agulla.id, 1742, 15)

            if (montclar) {
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

              await ctx.reply(`Enhorabona! Heu pujat a al <b>Cim del Montclar</b>\nHeu fet 15 Punts!\nEn teniu ${punts_totals}!\nAneu en ${pos}a posició!`, {
              parse_mode: 'html'
              });

              await check_arees(user.dataValues.team_id, ctx)
            }
            else {
              await ctx.reply(`Ja heu pujat al Montclar! Tramposos D:`);
            }
            return
       } else if (agulla && agulla.nom === "Briefing") {

          //const user = await userController.addUser(ctx.from.id) //FALTA COMPROVAR NO INICIAR 2 VEGADES

          //const briefing = await encadenatController.getEncadenatByEquipIViaId(user.dataValues.team_id, 1743)

          let teclat = []
          agulla.Via.forEach(via => {
            teclat.push([Markup.button.callback(via.nom + " " + via.grau, "via_" + via.id)]);
          });

          teclat.push([Markup.button.callback("Cancel·lar", "cancel")])

          await ctx.reply(`Estàs preparat per començar el raid?`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } )
          
       } else if (agulla && agulla.nom === "Esquella") {
              const user = await userController.addUser(ctx.from.id) //FALTA COMPROVAR NO PUJAR 2 VEGADES
          
              await encadenatController.awardOnce(user.dataValues.team_id, agulla.id, 1744, 0)
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

              await ctx.reply(`Enhorabona! Heu acabat d'escalar!\nHeu fet ${punts_totals} punts!\nDe moment aneu en ${pos}a posició!`, {
              parse_mode: 'html'
              });

              await check_arees(user.dataValues.team_id, ctx)
            
            return
       }
       else if (agulla != null) {
         let teclat = []
         agulla.Via.forEach(via => {
           teclat.push([Markup.button.callback(via.nom + " " + via.grau, "via_" + via.id)]);
         });

         teclat.push([Markup.button.callback("No ho sé", "agulla_nose_" + agulla.id)])
         teclat.push([Markup.button.callback("Via nova", "agulla_nova_" + agulla.id)])

         teclat.push([Markup.button.callback("Cancel·lar", "cancel")])

         await ctx.reply(`Enhorabona! Heu pujat a <b>${agulla.nom}</b>`, { parse_mode: 'html', reply_markup: Markup.inlineKeyboard(teclat).reply_markup } )
       }
       else {
        //si no hem trobat agulles cerquem totems
        const totem = await viaController.getViaByCode(message)

        if (totem != null) {
          const user = await userController.addUser(ctx.from.id)

          //comprovar que ningú hagi puntuat aquest token encara
          console.log(totem.dataValues.id)
          const encadenat = await encadenatController.getEncadenatByViaId(totem.dataValues.id)

          if (encadenat == null) { //LOGICA DELS TOTEMS!!!!
            await ctx.reply(`Enhorabona! Heu trobat el tòtem ${totem.dataValues.nom}!`)
            await totem_handler.totem_handler(user.dataValues.team_id, totem.dataValues.Agulla.id, totem.dataValues.id, ctx)
          }
          else {
            await ctx.reply(`Algú ja ha trobat aquest tòtem abans`);
          }
        } else {
          await ctx.reply(`Aquest codi és incorrecte`);
        }
       }
  
      // Aquí pots afegir més lògica, com per exemple, buscar aquest número a la base de dades,
      // o fer alguna acció específica
    } else {
      await ctx.reply('Això no és un número de 6 xifres.');
    }
  }

  module.exports = { 
    handleText
};