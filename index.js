require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./utils/db');
const telegramService = require('./services/telegram/bot');
const { initWebServer } = require("./services/web/index");

//Importar Models
const Equip = require('./models/equip.model'); 
const Agulla = require('./models/agulla.model'); 
const Via = require('./models/via.model'); 
const Encadenats = require('./models/encadenat.model'); 
const Area = require('./models/area.model'); 

// Crea una nova instància del bot de Telegram
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Connexió a la base de dades
db.authenticate()
  .then(() => {
    console.log('Connexió a la base de dades establerta correctament.');

    // Sincronitzar els models i crear les taules si no existeixen
    //return db.sync({force: false}); // Això crearà la taula d'usuaris automàticament si no existeix
  })
  .then(() => {
    console.log('Connexió a la base de dades establerta correctament.');
  })
  .catch(err => {
    console.error('Error al connectar-se a la base de dades:', err);
  });

// Registra els comandaments del bot
telegramService.registerCommands(bot);

// Inicia el bot
bot.launch();
console.log("Bot de Telegram en funcionament...");

// --------------------
// Engegar web
// --------------------

initWebServer();

// --------------------
// Tancament net
// --------------------


// Gràcia controlada quan es tanca el procés
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));