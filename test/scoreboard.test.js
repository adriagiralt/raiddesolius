const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const fixtures = require('../services/web/fixtures');

const script = fs.readFileSync(require.resolve('../services/web/public/scoreboard.js'), 'utf8');
const snapshot = () => structuredClone({
  '/api/ranking': fixtures.getRanking(),
  '/api/ultims': fixtures.getLastEncadenats(),
  '/api/agulles': fixtures.getAgullaRanking(),
  '/api/equips': fixtures.getTeams(),
  '/api/equips/actius': fixtures.getTeamsNoAcabat(),
});

async function display(data = snapshot()) {
  const elements = new Map();
  const intervals = [];
  const timeouts = new Map();
  const calls = [];
  const state = { data, failure: null, fetchOverride: null };
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', dataset: {}, addEventListener() {},
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element, addEventListener() {} },
    window: { addEventListener() {} },
    AbortController, Intl, Date,
    fetch: async (path, options) => {
      calls.push({ path, options });
      if (state.fetchOverride) return state.fetchOverride(path, options);
      return { ok: path !== state.failure, status: path === state.failure ? 503 : 200, json: async () => state.data[path] };
    },
    setInterval(fn, delay) { intervals.push({ fn, delay }); },
    setTimeout(fn, delay) { const id = Symbol(); timeouts.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    console: { error() {} },
  });
  vm.runInContext(script, context);
  await new Promise(setImmediate);
  return { element, state, calls, intervals, timeouts, refresh: () => vm.runInContext('carregarDades()', context) };
}

const rowCount = (html, className) => (html.match(new RegExp(`class="${className}"`, 'g')) || []).length;

test('scoreboard loads every view together, totals teams, and displays equal points as ties', async () => {
  const app = await display();
  assert.equal(app.calls.length, 5);
  assert.equal(app.element('total-teams').textContent, '8');
  assert.equal(app.element('active-total').textContent, '6');
  assert.equal(app.element('finished-total').textContent, '2');
  assert.equal(rowCount(app.element('ranking').innerHTML, 'ranking-row'), 7);
  assert.equal((app.element('ranking').innerHTML.match(/Posició 4/g) || []).length, 2);
  assert.match(app.element('activity').innerHTML, /Línia verda/);
  assert.match(app.element('pinnacles').innerHTML, /Agulla del Pi/);
  assert.match(app.element('active-teams').innerHTML, /Sense Pressa/);
  assert.equal(app.element('connection').dataset.state, 'live');
});

test('large datasets stay within the TV display limits', async () => {
  const data = snapshot();
  for (const path of Object.keys(data)) data[path] = Array.from({ length: 40 }, (_, i) => ({ ...data[path][i % data[path].length] }));
  const app = await display(data);
  assert.equal(rowCount(app.element('ranking').innerHTML, 'ranking-row'), 8);
  assert.equal(rowCount(app.element('activity').innerHTML, 'activity-row'), 5);
  assert.equal(rowCount(app.element('pinnacles').innerHTML, 'pinnacle-row'), 5);
  assert.equal((app.element('active-teams').innerHTML.match(/<li /g) || []).length, 6);
  assert.equal(app.element('active-overflow').textContent, '+34 més');
  assert.equal(app.element('total-teams').textContent, '40');
});

test('database names are escaped in every display, including title attributes', async () => {
  const data = snapshot();
  const attack = '\"><img src=x onerror=alert(1)>';
  for (const rows of Object.values(data)) {
    for (const row of rows) {
      for (const field of ['nom', 'equipNom', 'agullaNom', 'viaNom']) {
        if (field in row) row[field] = attack;
      }
    }
  }
  const app = await display(data);
  for (const id of ['ranking', 'activity', 'pinnacles', 'active-teams']) {
    assert.ok(!app.element(id).innerHTML.includes('<img'), id);
    assert.match(app.element(id).innerHTML, /&quot;&gt;&lt;img/, id);
  }
});

test('empty competition has useful messages and zero totals', async () => {
  const data = Object.fromEntries(Object.keys(snapshot()).map(path => [path, []]));
  const app = await display(data);
  assert.equal(app.element('total-teams').textContent, '0');
  assert.match(app.element('ranking').innerHTML, /primer pas/);
  assert.match(app.element('activity').innerHTML, /Encara no hi ha/);
  assert.match(app.element('pinnacles').innerHTML, /primers equips/);
  assert.match(app.element('active-teams').innerHTML, /Cap equip/);
});

test('failed or malformed feeds retain the complete last snapshot and recover on the next poll', async () => {
  const app = await display();
  const oldRanking = app.element('ranking').innerHTML;
  const lastTime = app.element('updated-at').textContent;
  app.state.data['/api/ranking'][0].nom = 'Updated team';
  app.state.failure = '/api/ultims';
  await app.refresh();
  assert.equal(app.element('ranking').innerHTML, oldRanking);
  assert.equal(app.element('updated-at').textContent, lastTime);
  assert.equal(app.element('connection').dataset.state, 'error');
  app.state.failure = null;
  const activity = app.state.data['/api/ultims'];
  app.state.data['/api/ultims'] = { error: 'invalid payload' };
  await app.refresh();
  assert.equal(app.element('ranking').innerHTML, oldRanking);
  app.state.data['/api/ultims'] = activity;
  await app.refresh();
  assert.match(app.element('ranking').innerHTML, /Updated team/);
  assert.equal(app.element('connection').dataset.state, 'live');
});

test('first-load failures show an explicit retry state instead of loading forever', async () => {
  const app = await display({});
  assert.equal(app.element('connection').dataset.state, 'error');
  assert.match(app.element('ranking').innerHTML, /Tornarem a provar/);
  app.state.data = snapshot();
  await app.refresh();
  assert.equal(app.element('connection').dataset.state, 'live');
  assert.match(app.element('ranking').innerHTML, /Els Gats de Solius/);
});

test('20-second polling bypasses cache, prevents overlapping requests, and times out stalled feeds', async () => {
  const app = await display();
  const poll = app.intervals.find(interval => interval.delay === 20000);
  assert.ok(poll);
  assert.ok(app.calls.every(call => call.options.cache === 'no-store'));
  app.state.fetchOverride = (path, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const pending = poll.fn();
  await app.refresh();
  assert.equal(app.calls.length, 10, 'second refresh must not start more requests');
  const timeout = [...app.timeouts.values()].find(timer => timer.delay === 10000);
  assert.ok(timeout);
  timeout.fn();
  await pending;
  assert.equal(app.element('connection').dataset.state, 'error');
  assert.match(app.element('ranking').innerHTML, /Els Gats de Solius/);
  app.state.fetchOverride = null;
  await poll.fn();
  assert.equal(app.element('connection').dataset.state, 'live');
});
