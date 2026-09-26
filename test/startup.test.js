const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Telegraf, Telegram } = require('telegraf');
const db = require('../utils/db');
const web = require('../services/web');
const { main } = require('../index');
const originalEnv = { ...process.env };
const originalSignals = new Map(['SIGINT', 'SIGTERM'].map(signal => [signal, process.listeners(signal)]));
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
  for (const [signal, listeners] of originalSignals) {
    for (const listener of process.listeners(signal)) {
      if (!listeners.includes(listener)) process.removeListener(signal, listener);
    }
  }
});

function config() {
  Object.assign(process.env, { TELEGRAM_TOKEN: 'test', DB_HOST: '127.0.0.1', DB_USER: 'test', DB_NAME: 'test', DB_PORT: '3306', PORT: '3000' });
  mock.method(console, 'log', () => {});
}

test('missing credentials fail before opening services', async () => {
  delete process.env.TELEGRAM_TOKEN;
  const authenticate = mock.method(db, 'authenticate', async () => {});
  await assert.rejects(main(), /TELEGRAM_TOKEN/);
  assert.equal(authenticate.mock.callCount(), 0);
});

test('failed database authentication closes the pool without starting HTTP or Telegram', async () => {
  config();
  mock.method(db, 'authenticate', async () => { throw new Error('connection refused'); });
  const close = mock.method(db, 'close', async () => {});
  const http = mock.method(web, 'initWebServer', async () => {});
  const telegram = mock.method(Telegram.prototype, 'getMe', async () => {});
  await assert.rejects(main(), /connection refused/);
  assert.equal(close.mock.callCount(), 1);
  assert.equal(http.mock.callCount(), 0);
  assert.equal(telegram.mock.callCount(), 0);
});

test('shutdown drains polling before closing HTTP and database resources', async () => {
  config();
  const events = [];
  mock.method(db, 'authenticate', async () => { events.push('database ready'); });
  mock.method(db, 'close', async () => { events.push('database closed'); });
  mock.method(Telegram.prototype, 'getMe', async () => ({ id: 1, is_bot: true, username: 'test_bot' }));
  mock.method(web, 'initWebServer', async () => {
    events.push('http ready');
    return { close(callback) { events.push('http closed'); callback(); } };
  });
  let finishPolling;
  mock.method(Telegraf.prototype, 'launch', () => new Promise(resolve => { finishPolling = resolve; }));
  mock.method(Telegraf.prototype, 'stop', () => { events.push('polling stopped'); finishPolling(); });
  const app = await main();
  await app.shutdown('test');
  await app.shutdown('test again');
  assert.deepEqual(events, ['database ready', 'http ready', 'polling stopped', 'http closed', 'database closed']);
});
