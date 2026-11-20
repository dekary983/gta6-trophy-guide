// app.js — Leonida Legend: the GTA VI trophy guide & tracker.
// Loads the official trophy data from data/trophies.json (a file of this
// app, fetched once from its own server — the app works with the network
// off), then wires the tracker, filters, spoiler mode, roadmap and
// missables views, and progress export/import together.

import { loadState, saveState, isEarned, earnedCount, downloadProgress, parseImport, emptyState } from './store.js';
import { renderRow, renderDetail } from './render.js';
import { renderRoadmap, renderMissables, renderAbout } from './roadmap.js';

const data = await (await fetch('data/trophies.json')).json();
const catalog = Object.fromEntries((data.sources ?? []).map((s) => [s.id, s]));
const byName = new Map(data.trophies.map((t) => [t.name, t]));
const total = data.trophies.length;

let state = loadState();
let view = 'tracker';
let kindFilter = 'all';
let gradeFilter = 'all';
let query = '';
let selectedName = data.trophies[0]?.name ?? null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');

function persist() {
  saveState(state);
}

function toggleEarned(name) {
  if (isEarned(state, name)) delete state.earned[name];
  else state.earned[name] = true;
  persist();
  refresh();
}

function changeCount(name, delta) {
  const trophy = byName.get(name);
  if (!trophy?.count) return;
  const next = Math.max(0, Math.min(trophy.count, (state.counts[name] ?? 0) + delta));
  state.counts[name] = next;
  if (next >= trophy.count) state.earned[name] = true;
  persist();
  refresh();
}

const detailHandlers = { onToggle: toggleEarned, onCount: changeCount };

function matchesFilters(trophy) {
  if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
  if (kindFilter === 'missable') {
    if (!(trophy.missable === true || trophy.missable === 'watch')) return false;
  } else if (kindFilter === 'online') {
    return false; // the official list has no online trophies; the note explains
  } else if (kindFilter !== 'all') {
    if (!(trophy.kinds ?? [trophy.kind]).includes(kindFilter)) return false;
  }
  if ($('hide-earned-toggle').checked && isEarned(state, trophy.name)) return false;
  if (query) {
    // A masked story trophy cannot be found by what spoiler mode hides.
    const masked = state.spoiler && trophy.kind === 'story' && !isEarned(state, trophy.name);
    if (masked) return false;
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderHeader() {
  const n = earnedCount(state);
  $('progress-count').textContent = `${n} of ${total} earned`;
  $('progress-pct').textContent = `${Math.round((n / total) * 100)}%`;
  $('progress-fill').style.width = `${(n / total) * 100}%`;
  const byGrade = (g) => data.trophies.filter((t) => t.grade === g);
  const part = (g, label) => `${byGrade(g).filter((t) => isEarned(state, t.name)).length}/${byGrade(g).length} ${label}`;
  $('progress-grades').textContent =
    `${part('platinum', 'platinum')} · ${part('gold', 'gold')} · ${part('silver', 'silver')} · ${part('bronze', 'bronze')}`;
  const flagged = data.trophies.filter((t) => t.missable === true || t.missable === 'watch').length;
  $('missable-badge').textContent = String(flagged);
}

function renderList() {
  const shown = data.trophies.filter(matchesFilters);
  listEl.replaceChildren();
  for (const trophy of shown) {
    listEl.append(renderRow(trophy, state, selectedName, selectTrophy, toggleEarned));
  }
  $('empty-note').hidden = shown.length > 0;
  $('list-meta').textContent = kindFilter === 'online'
    ? 'Showing 0 of 55 — see the note above.'
    : `Showing ${shown.length} of ${total} trophies`;
  $('online-note').hidden = kindFilter !== 'online';
}

function renderDetailPane() {
  renderDetail($('detail'), byName.get(selectedName) ?? null, state, catalog, detailHandlers);
}

function renderViews() {
  for (const name of ['tracker', 'roadmap', 'missables', 'about']) {
    $(`view-${name}`).hidden = name !== view;
  }
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  });
  if (view === 'roadmap') renderRoadmap($('roadmap-list'), data, byName, state, catalog, jumpToTrophy);
  if (view === 'missables') renderMissables($('missable-list'), data, state, jumpToTrophy);
  if (view === 'about') renderAbout($('about-body'), data, catalog);
}

function refresh() {
  renderHeader();
  renderList();
  renderDetailPane();
  renderViews();
}

function selectTrophy(name) {
  selectedName = name;
  renderList();
  renderDetailPane();
  $('detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function jumpToTrophy(name) {
  view = 'tracker';
  kindFilter = 'all';
  gradeFilter = 'all';
  query = '';
  $('search').value = '';
  $('grade-filter').value = 'all';
  document.querySelectorAll('#kind-chips .chip').forEach((c) =>
    c.classList.toggle('is-active', c.dataset.kind === 'all'));
  selectedName = name;
  refresh();
  document.querySelector(`.trophy-row[data-name="${CSS.escape(name)}"]`)
    ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function setView(name) {
  view = name;
  renderViews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Deep links: #view=roadmap opens a view, #trophy=<name> opens a trophy.
// Handy for sharing a link to one trophy's guide.
function applyHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const v = params.get('view');
  if (v && ['tracker', 'roadmap', 'missables', 'about'].includes(v)) view = v;
  const t = params.get('trophy');
  if (t && byName.has(t)) {
    selectedName = t;
    view = 'tracker';
  }
}

document.querySelectorAll('.tab').forEach((tab) =>
  tab.addEventListener('click', () => setView(tab.dataset.view)));
document.querySelectorAll('#kind-chips .chip').forEach((chip) =>
  chip.addEventListener('click', () => {
    kindFilter = chip.dataset.kind;
    document.querySelectorAll('#kind-chips .chip').forEach((c) =>
      c.classList.toggle('is-active', c === chip));
    renderList();
  }));
$('grade-filter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderList(); });
$('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderList(); });
$('hide-earned-toggle').addEventListener('change', renderList);
$('spoiler-toggle').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  persist();
  $('spoiler-note').hidden = !state.spoiler;
  renderList();
  renderDetailPane();
});

$('export-btn').addEventListener('click', () => {
  downloadProgress(state);
  $('io-note').textContent = 'Progress exported as gta6-trophy-progress.json. Keep the file somewhere safe — importing it restores this exact progress.';
});
$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    state = parseImport(await file.text());
    persist();
    $('spoiler-toggle').checked = state.spoiler;
    $('spoiler-note').hidden = !state.spoiler;
    refresh();
    $('io-note').textContent = `Progress imported: ${earnedCount(state)} of ${total} trophies earned.`;
  } catch {
    $('io-note').textContent = 'That file could not be read as Leonida Legend progress. Import a file this app exported.';
  }
});
$('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset all progress? Every earned mark and counter will be cleared.')) return;
  const keepSpoiler = state.spoiler;
  state = emptyState();
  state.spoiler = keepSpoiler;
  persist();
  refresh();
});

window.addEventListener('hashchange', () => { applyHash(); refresh(); });

$('spoiler-toggle').checked = state.spoiler;
$('spoiler-note').hidden = !state.spoiler;
applyHash();
refresh();
