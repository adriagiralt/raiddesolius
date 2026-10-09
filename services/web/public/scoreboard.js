'use strict';

const REFRESH_MS = 20000;
const LIMITS = { ranking: 8, activity: 5, pinnacles: 5, active: 6 };
const numberFormat = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });
const timeFormat = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const clockFormat = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const dayFormat = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
const el = id => document.getElementById(id);
let refreshing = false;
let lastUpdated = null;
let lastSnapshot = '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
const named = row => typeof row?.nom === 'string';
const endpoints = [
  { key: 'ranking', path: '/api/ranking', valid: row => named(row) && numeric(row.punts) && numeric(row.agulles) },
  { key: 'activity', path: '/api/ultims', valid: row => row && numeric(row.punts) && typeof row.createdAt === 'string' && Number.isFinite(Date.parse(row.createdAt)) && [row.equipNom, row.agullaNom, row.viaNom].every(name => name === null || typeof name === 'string') },
  { key: 'pinnacles', path: '/api/agulles', valid: row => named(row) && numeric(row.total) && Number(row.total) >= 0 },
  { key: 'teams', path: '/api/equips', valid: named },
  { key: 'active', path: '/api/equips/actius', valid: named },
];

function empty(message) {
  return `<li class="empty-state">${message}</li>`;
}

function renderRanking(rows) {
  let position = 1;
  el('ranking').innerHTML = rows.slice(0, LIMITS.ranking).map((row, index) => {
    if (index > 0 && Number(row.punts) !== Number(rows[index - 1].punts)) position = index + 1;
    return `<li class="ranking-row">
      <span class="place" aria-label="Posició ${position}">${String(position).padStart(2, '0')}</span>
      <div class="team">${index === 0 ? '<span class="leader-label">Al capdavant</span>' : ''}<span class="team-name" title="${escapeHtml(row.nom)}">${escapeHtml(row.nom)}</span></div>
      <span class="climb-count" aria-label="${Number(row.agulles)} agulles">${numberFormat.format(row.agulles)}</span>
      <span class="score${numberFormat.format(row.punts).length > 5 ? ' compact-score' : ''}" aria-label="${Number(row.punts)} punts">${numberFormat.format(row.punts)}</span>
    </li>`;
  }).join('') || empty('El raid és a punt de començar. Qui farà el primer pas?');
  el('ranking-count').textContent = `TOP ${Math.min(rows.length, LIMITS.ranking)} / ${rows.length}`;
  el('ranking-summary').textContent = `${rows.length} equips amb registres`;
}

function renderActivity(rows) {
  const today = dayFormat.format(new Date());
  el('activity').innerHTML = rows.slice(0, LIMITS.activity).map(row => {
    const date = new Date(row.createdAt);
    const day = dayFormat.format(date);
    const points = Number(row.punts);
    const route = [row.agullaNom || 'Agulla desconeguda', row.viaNom].filter(Boolean).join(' · ');
    return `<li class="activity-row">
      <time class="activity-time" datetime="${date.toISOString()}">${timeFormat.format(date)}${day !== today ? `<small>${day}</small>` : ''}</time>
      <div class="activity-content"><p class="activity-team" title="${escapeHtml(row.equipNom)}">${escapeHtml(row.equipNom || 'Equip desconegut')}</p><p class="activity-route" title="${escapeHtml(route)}">${escapeHtml(route)}</p></div>
      <span class="activity-points">${points > 0 ? '+' : ''}${numberFormat.format(points)}<small>punts</small></span>
    </li>`;
  }).join('') || empty('Encara no hi ha cap registre.');
}

function renderPinnacles(rows) {
  const top = rows.slice(0, LIMITS.pinnacles);
  const max = Math.max(1, ...top.map(row => Number(row.total)));
  el('pinnacles').innerHTML = top.map(row => `<li class="pinnacle-row">
    <span class="pinnacle-name" title="${escapeHtml(row.nom)}">${escapeHtml(row.nom)}</span>
    <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width: ${Number(row.total) / max * 100}%"></div></div>
    <span class="pinnacle-total" aria-label="${Number(row.total)} registres">${numberFormat.format(row.total)}</span>
  </li>`).join('') || empty('Les agulles esperen els primers equips.');
}

function renderSnapshot(data) {
  renderRanking(data.ranking);
  renderActivity(data.activity);
  renderPinnacles(data.pinnacles);
  el('total-teams').textContent = numberFormat.format(data.teams.length);
  el('active-total').textContent = numberFormat.format(data.active.length);
  el('finished-total').textContent = numberFormat.format(Math.max(0, data.teams.length - data.active.length));
  el('active-caption').textContent = `${data.active.length} ${data.active.length === 1 ? 'equip actiu' : 'equips actius'}`;
  el('active-teams').innerHTML = data.active.slice(0, LIMITS.active).map(team => `<li title="${escapeHtml(team.nom)}">${escapeHtml(team.nom)}</li>`).join('') || '<li class="active-empty">Cap equip en ruta</li>';
  el('active-overflow').textContent = data.active.length > LIMITS.active ? `+${data.active.length - LIMITS.active} més` : '';
}

function setConnection(state, label) {
  el('connection').dataset.state = state;
  el('connection-label').textContent = label;
}

async function carregarDades() {
  if (refreshing) return;
  refreshing = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const entries = await Promise.all(endpoints.map(async endpoint => {
      const response = await fetch(endpoint.path, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`${endpoint.path}: HTTP ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.every(endpoint.valid)) throw new Error(`${endpoint.path}: dades no vàlides`);
      return [endpoint.key, rows];
    }));
    const data = Object.fromEntries(entries);
    const snapshot = JSON.stringify([dayFormat.format(new Date()), data]);
    if (snapshot !== lastSnapshot) {
      renderSnapshot(data);
      lastSnapshot = snapshot;
    }
    lastUpdated = new Date();
    el('updated-at').textContent = `Darrera actualització ${clockFormat.format(lastUpdated)}`;
    setConnection('live', 'En directe');
  } catch (error) {
    console.error('Error actualitzant el marcador:', error);
    setConnection('error', 'Dades sense actualitzar · Reintentant');
    if (!lastUpdated) {
      for (const id of ['ranking', 'activity', 'pinnacles']) el(id).innerHTML = empty('Esperant connexió. Tornarem a provar-ho automàticament.');
      el('active-teams').innerHTML = '<li class="active-empty">Esperant dades dels equips</li>';
    }
  } finally {
    clearTimeout(timeout);
    controller.abort();
    refreshing = false;
  }
}

function updateClock() {
  const now = new Date();
  el('clock').textContent = clockFormat.format(now);
  el('clock').dateTime = now.toISOString();
  el('today').textContent = dateFormat.format(now);
}

el('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    el('fullscreen').title = 'Fes servir l’opció de pantalla completa del navegador';
  }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Surt de pantalla completa' : 'Pantalla completa';
  el('fullscreen').querySelector('span').textContent = label;
  el('fullscreen').setAttribute('aria-label', label);
});
window.addEventListener('online', carregarDades);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) carregarDades();
});
updateClock();
carregarDades();
setInterval(updateClock, 1000);
setInterval(carregarDades, REFRESH_MS);
