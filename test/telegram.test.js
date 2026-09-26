const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Telegraf } = require('telegraf');
const { registerCommands } = require('../services/telegram/bot');
const scores = require('../controllers/encadenat.controller');
const teams = require('../controllers/team.controller');
const users = require('../controllers/user.controller');
const vias = require('../controllers/via.controller');
const agulles = require('../controllers/agulla.controller');
const { calcula_punts } = require('../utils/utils');
afterEach(() => mock.restoreAll());

function botFor(userId) {
  const bot = new Telegraf('test');
  bot.botInfo = { id: 1, is_bot: true, username: 'test_bot' };
  const messages = [];
  bot.context.reply = bot.context.editMessageText = async text => { messages.push(text); };
  bot.context.answerCbQuery = async () => {};
  registerCommands(bot);
  bot.catch(error => { throw error; });
  return {
    messages,
    callback: data => bot.handleUpdate({ update_id: 1, callback_query: {
      id: 'callback', from: { id: userId, is_bot: false, first_name: 'User' },
      chat_instance: 'chat', data,
      message: { message_id: 1, date: 1, chat: { id: userId, type: 'private' } },
    } }),
  };
}

test('admin bonuses use configured points and reject forged amounts', async () => {
  const bot = botFor(179640788);
  mock.method(teams, 'getTeam', async () => ({ nom: 'Team' }));
  const award = mock.method(scores, 'awardOnce', async () => ({}));
  await bot.callback('bonus_1_4001_999');
  await bot.callback('bonus_1_9999_20');
  assert.equal(award.mock.callCount(), 0);
  await bot.callback('bonus_1_4001_20');
  assert.deepEqual(award.mock.calls[0].arguments, ['1', 200, '4001', 20]);
  assert.match(bot.messages.at(-1), /atorgat/);
});

test('malformed score callbacks never write scores', async () => {
  const bot = botFor(123);
  const via = mock.method(vias, 'getVia', async () => { throw new Error('Unexpected query'); });
  const agulla = mock.method(agulles, 'getAgullaById', async () => { throw new Error('Unexpected query'); });
  for (const data of ['encadenat_99_1', 'prefix_encadenat_2_1', 'encadenat_2_1_5junk', 'encadenat_2_1_7z', 'encadenat_2_1_5**']) await bot.callback(data);
  assert.equal(via.mock.callCount(), 0);
  assert.equal(agulla.mock.callCount(), 0);
});

test('stale route buttons and users without teams cannot write scores', async () => {
  const bot = botFor(123);
  const replace = mock.method(scores, 'replaceEncadenat', async () => { throw new Error('Unexpected write'); });
  const via = mock.method(vias, 'getVia', async () => null);
  await bot.callback('via_1');
  await bot.callback('encadenat_2_1');
  via.mock.mockImplementation(async () => ({ id: 1, agulla_id: 1, grau: '5', Agulla: { punts: 5 } }));
  mock.method(users, 'addUser', async () => ({ team_id: null, dataValues: { team_id: null } }));
  await bot.callback('encadenat_2_1');
  assert.equal(replace.mock.callCount(), 0);
  assert.match(bot.messages.at(-1), /No tens equip/);
});

test('new-route callbacks preserve the doubled grade score', async () => {
  const bot = botFor(123);
  mock.method(agulles, 'getAgullaById', async () => ({ id: 1, punts: 5 }));
  mock.method(users, 'addUser', async () => ({ team_id: 1, dataValues: { team_id: 1 } }));
  mock.method(scores, 'getArees', async () => 0);
  mock.method(scores, 'getRanking', async () => [{ id: 1, punts: 9 }]);
  const replace = mock.method(scores, 'replaceEncadenat', async () => ({}));
  await bot.callback('encadenat_2_1_5*');
  assert.deepEqual(replace.mock.calls[0].arguments, [1, '1', null, '2', 9, '5*']);
  assert.equal(calcula_punts('3'), 0);
  assert.equal(calcula_punts('7c+*'), 17);
  assert.throws(() => calcula_punts('unknown'), /Grau desconegut/);
});
