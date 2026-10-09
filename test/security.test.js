const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Telegraf } = require('telegraf');
const db = require('../utils/db');
const encadenats = require('../controllers/encadenat.controller');
const teams = require('../controllers/team.controller');
const Encadenat = require('../models/encadenat.model');
const { registerCommands } = require('../services/telegram/bot');
afterEach(() => mock.restoreAll());

test('team filter never interpolates user input into SQL', async () => {
  const attack = '1 OR 1=1';
  let query;
  mock.method(db, 'query', async (sql, options) => { query = { sql, options }; return [[], {}]; });
  await encadenats.getLastEncadenatsByTeam(attack);
  assert.ok(!query.sql.includes(attack));
  assert.equal(query.options.replacements.id, attack);
});

test('failed score writes propagate instead of reporting success', async () => {
  mock.method(Encadenat, 'create', async () => { throw new Error('database unavailable'); });
  mock.method(console, 'error', () => {});
  await assert.rejects(encadenats.setEncadenat(1, 2, 3, 2, 10, '5'), /database unavailable/);
});

test('bonus callbacks require admin privileges', async () => {
  let reads = 0;
  let edits = 0;
  mock.method(teams, 'getTeam', async () => { reads++; return { dataValues: { nom: 'Team' } }; });
  mock.method(encadenats, 'getEncadenatByEquipIViaId', async () => null);
  mock.method(encadenats, 'setEncadenat', async () => {});
  const bot = new Telegraf('test');
  bot.botInfo = { id: 1, is_bot: true, username: 'test_bot' };
  bot.context.reply = async () => {};
  bot.context.editMessageText = async () => { edits++; };
  bot.context.answerCbQuery = async () => {};
  registerCommands(bot);
  for (const data of ['equip_1', 'bonus_1_4001_20']) {
    await bot.handleUpdate({ update_id: 1, callback_query: {
      id: 'callback', from: { id: 123, is_bot: false, first_name: 'User' },
      chat_instance: 'chat', data,
      message: { message_id: 1, date: 1, chat: { id: 123, type: 'private' } },
    } });
  }
  assert.equal(reads, 0);
  assert.equal(edits, 0);
});
