const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../utils/db');
const Equip = require('../../models/equip.model');
const Agulla = require('../../models/agulla.model');
const Via = require('../../models/via.model');
const Encadenat = require('../../models/encadenat.model');
const controller = require('../../controllers/encadenat.controller');
const agulles = require('../../controllers/agulla.controller');
const users = require('../../controllers/user.controller');
const { createWebApp } = require('../../services/web');
let server;
let url;

before(async () => {
  // Només recrea la base de dades si s'ha seleccionat explícitament la base de dades temporal de proves.
  assert.equal(process.env.DB_NAME, 'raid_test');
  db.options.logging = false;
  await db.sync({ force: true });
  await Equip.bulkCreate([{ id: 1, nom: 'One' }, { id: 2, nom: 'Two' }]);
  await Agulla.bulkCreate([{ id: 1, nom: 'Rock', codi: 123456, punts: 5, area_id: 1 }, { id: 2, nom: 'Empty rock', codi: 654321, punts: 5 }, { id: 200, nom: 'Bonus' }]);
  await Via.bulkCreate([{ id: 1, nom: 'Route', grau: '5', agulla_id: 1 }, { id: 3001, nom: 'Totem', grau: '3', agulla_id: 1 }]);
  server = await new Promise(resolve => { const s = createWebApp().listen(0, '127.0.0.1', () => resolve(s)); });
  url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await db.close();
});

test('MySQL scoring, rollback, concurrent awards, and public endpoints', async () => {
  const user = await users.addUser(123, 'Climber');
  assert.equal(user.nom, 'Climber');
  assert.equal((await agulles.getAgulla(654321)).nom, 'Empty rock');
  assert.equal((await agulles.getAgullaGraus(1))[0].graus, '3,5');

  await controller.replaceEncadenat(1, 1, 1, 2, 7, '5');
  await assert.rejects(controller.replaceEncadenat(1, 1, 1, 2, 'invalid decimal', '5'));
  assert.equal((await Encadenat.findOne({ where: { equip_id: 1, agulla_id: 1 } })).punts, '7.00');
  await Promise.all([controller.replaceEncadenat(1, 1, 1, 1, 6), controller.replaceEncadenat(1, 1, 1, 2, 7)]);
  assert.equal(await Encadenat.count({ where: { equip_id: 1, agulla_id: 1 } }), 1);

  const bonuses = await Promise.all(Array.from({ length: 3 }, () => controller.awardOnce(1, 200, 4001, 20)));
  assert.equal(bonuses.filter(Boolean).length, 1);
  const totems = await Promise.all([controller.awardOnce(1, 1, 3001, 5, true), controller.awardOnce(2, 1, 3001, 5, true)]);
  assert.equal(totems.filter(Boolean).length, 1);

  // Un segon equip permet detectar l'efecte d'una clàusula OR injectada.
  await controller.replaceEncadenat(2, 2, null, 0, 1);
  const filtered = await controller.getLastEncadenatsByTeam('1 OR 1=1');
  assert.ok(filtered.every(row => row.equipNom === 'One'));
  assert.ok((await controller.getViesByEquip(1)).length > 0);
  assert.equal(await controller.getArees(1), 1);

  for (const path of ['/api/ranking', '/api/ranking/agulles', '/api/top-agulla', '/api/ultims', '/api/ultims/1', '/api/equips', '/api/equips/actius', '/api/agulles']) {
    const response = await fetch(url + path);
    assert.equal(response.status, 200, path + ': ' + await response.text());
  }
  for (const id of ['1%20OR%201=1', '0', '-1', '1.2', '99999999999999999999']) {
    assert.equal((await fetch(url + '/api/ultims/' + id)).status, 400, id);
  }
  assert.equal((await fetch(url + '/')).status, 200);
  const ranking = await controller.getRankingByAgulla();
  assert.ok(Number(ranking[0].agulles) >= Number(ranking[1].agulles));
  assert.equal((await controller.getRanking())[0].id, 1);
});
