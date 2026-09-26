const { Markup } = require('telegraf');
const teamController = require('../../../controllers/team.controller');
const encadenatController = require('../../../controllers/encadenat.controller');

const escapeHtml = text => text.replace(/[&<>]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
})[char]);

const bonuses = new Map([
  ['4001', { name: 'Equipament', points: 20 }],
  ['4002', { name: 'Logotip', points: 10 }],
  ['4003', { name: "Bossa d'escombraries", points: 10 }],
  ['4004', { name: 'Disfressats', points: 5 }],
]);

const handleBonusCommand = () => async ctx => {
  const equips = await teamController.getTeams();
  const teclat = equips.map(equip => [Markup.button.callback(equip.nom, `equip_${equip.id}`)]);
  teclat.push([Markup.button.callback('Cancel·lar', 'cancel')]);
  return ctx.reply('A qui vols posar un <b>Bonus</b>?', {
    parse_mode: 'html', ...Markup.inlineKeyboard(teclat),
  });
};

const handleBonusTeamAction = () => async ctx => {
  const equipId = ctx.match[1];
  const teclat = [...bonuses].map(([id, bonus]) => [
    Markup.button.callback(bonus.name, `bonus_${equipId}_${id}_${bonus.points}`),
  ]);
  teclat.push([Markup.button.callback('Cancel·lar', 'cancel')]);
  return ctx.editMessageText('Quin <b>bonus</b> vols atorgar?', {
    parse_mode: 'html', ...Markup.inlineKeyboard(teclat),
  });
};

const handleGiveBonusAction = () => async ctx => {
  const [, equipId, bonusId, points] = ctx.match;
  const bonus = bonuses.get(bonusId);
  if (!bonus || Number(points) !== bonus.points) return ctx.reply('Aquest bonus no és vàlid.');
  const equip = await teamController.getTeam(equipId);
  if (!equip) return ctx.reply('Aquest equip no existeix.');
  const awarded = await encadenatController.awardOnce(equipId, 200, bonusId, bonus.points);
  const message = awarded
    ? `Bonus <b>${escapeHtml(bonus.name)}</b> atorgat a l'equip <b>${escapeHtml(equip.nom)}</b>!`
    : `L'equip <b>${escapeHtml(equip.nom)}</b> ja tenia el bonus <b>${escapeHtml(bonus.name)}</b>!`;
  return ctx.editMessageText(message, {
    parse_mode: 'html', ...Markup.inlineKeyboard([]),
  });
};

module.exports = { handleBonusCommand, handleBonusTeamAction, handleGiveBonusAction };
