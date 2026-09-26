require('dotenv').config({ quiet: true });

async function main() {
  const required = ['TELEGRAM_TOKEN', 'DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Falten variables d'entorn: ${missing.join(', ')}`);
  for (const name of ['PORT', 'DB_PORT']) {
    if (process.env[name] !== undefined && (!/^\d+$/.test(process.env[name]) || Number(process.env[name]) < 1 || Number(process.env[name]) > 65535)) {
      throw new Error(`${name} ha de ser un port entre 1 i 65535`);
    }
  }

  const { Telegraf } = require('telegraf');
  const db = require('./utils/db');
  const { registerCommands } = require('./services/telegram/bot');
  const { initWebServer } = require('./services/web');
  const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
  let server;
  let polling;
  let stopping;
  const shutdown = reason => {
    if (stopping) return stopping;
    stopping = (async () => {
      let stopped = false;
      try { bot.stop(reason); stopped = true; } catch { /* Polling may not have started yet. */ }
      if (stopped && polling) await polling.catch(() => {});
      // Close idle HTTP connections before draining the database pool.
      if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await db.close();
    })();
    return stopping;
  };
  const fail = async error => {
    console.error('Error del servei:', error);
    process.exitCode = 1;
    await shutdown('error');
  };

  try {
    await db.authenticate();
    console.log('Connexió a la base de dades establerta correctament.');
    registerCommands(bot);
    // Authenticate the bot before opening the HTTP port.
    bot.botInfo = await bot.telegram.getMe();
    server = await initWebServer();
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => shutdown(signal).then(() => process.exit(0)).catch(error => {
        console.error('Error tancant el servei:', error);
        process.exitCode = 1;
      }));
    }
    // launch runs until polling stops; handle startup and polling failures.
    polling = bot.launch();
    polling.catch(fail).catch(error => {
      console.error('Error tancant el servei:', error);
      process.exitCode = 1;
    });
    return { shutdown };
  } catch (error) {
    await shutdown('startup error');
    throw error;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('No s’ha pogut iniciar el servei:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { main };
