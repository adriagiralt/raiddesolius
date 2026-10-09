const encadenatController = require("../../../controllers/encadenat.controller");

const { Markup } = require('telegraf');
//Aquest arxiu aplica els bonus/malus dels totems
//Està tot hardcoded

const totem_handler = async (team_id, agulla_id, totem_id, ctx) => {
    console.log("TOTEM! " + totem_id);


    switch (totem_id) {
        case 3001: // guanyes 5 punts
        case 3021:
        case 3022:
        case 3023:
            await ctx.reply(`Aquest tòtem t'atorga <b>5 punts</b>! 🙂`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 5, null)
            break;
        case 3002: // perds 5 punts
        case 3024:
            await ctx.reply(`Aquest tòtem et resta <b>5 punts</b>! 🙁`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, -5, null)
            break;
        case 3003: // pots afegir 5 punts a un altre equip
        case 3004: // pots restar 5 punts a l’equip que vulguis
        case 3005: // pots restar (10) punts a l’equip que vulguis però a tu se te’n resten (5)
        case 3006: //igual 3003
        case 3007: //igual 3005
            let teclat = [];
            teclat.push([Markup.button.callback('Veure els equips', 'totem_'+totem_id)]);
            let text = `Aquest tòtem regala <b>5 punts</b> a un altre equip! 🤯`;
            if (totem_id == 3004) text = `Aquest tòtem resta <b>5 punts</b> a un altre equip! 😈`
            if (totem_id == 3005) text = `Aquest tòtem resta <b>10 punts</b> a un altre equip però us en resta <b>5</b> a vosaltres! 😨`
            await ctx.reply(text, {
             parse_mode: 'html', ...Markup.inlineKeyboard(teclat),
            })
            break;
        //case 3006: // has de repartir 8 punts per el teu equip i el d’algú altre
            
        //    break;
        //case 3007: // pots donar fins a 10 punts teus a un altre equip
            
        //    break;
        case 3008: // birra gratis
        case 3009: // birra gratis
        case 3010: // birra gratis
        case 3011: // birra gratis
            await ctx.reply(`Aquest tòtem et regala una birra! 🍺`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3012: // acabes de guanyar un regal: cinta exprés
            await ctx.reply(`Aquest tòtem et regala una cinta exprés! 🎁`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3013: // acabes de guanyar un regal: mosquetó
            await ctx.reply(`Aquest tòtem et regala un mosquetó! 🎁`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3014: // acabes de guanyar un regal: magnesera
            await ctx.reply(`Aquest tòtem et regala una magnesera! 🎁`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3015: // tu tries: 10 punts o regal sorpresa
            await ctx.reply(`Al final de l'esdeveniment podràs triar entre guanyar 10 punts, o un REGAL SORPRESA 🎁!`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3016: // un glop de ratafia
        case 3025:
            await ctx.reply(`Aquest tòtem et regala un glop de ratafia! 🥃`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3017: // bossa de patates
        case 3026:
            await ctx.reply(`Aquest tòtem et regala una bossa de patates! 🥔`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3018: // Samarreta de les 24hores
        case 3027:
            await ctx.reply(`Aquest tòtem et regala una samarreta de les 24h! 👕`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3019: // Samarreta del raid
        case 3028:
            await ctx.reply(`Aquest tòtem et regala una samarreta del raid! 👕`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        case 3020: // totem inútil
        case 3029:
        case 3030:
            await ctx.reply(`Aquest tòtem no té cap poder! \n Gaudeix de l'adderència!`, { parse_mode: 'html'})
            await encadenatController.setEncadenat(team_id, agulla_id, totem_id, null, 0, null)
            break;
        default:
            console.log("Tòtem desconegut: " + totem_id);
            break;
    }

}

module.exports = { 
    totem_handler
};