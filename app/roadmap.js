// roadmap.js — the platinum roadmap view, the missables view and the
// about/sources view. The roadmap's stages live in data/trophies.json
// alongside the trophies, so the order a player follows is data, and
// each stage's trophy chips jump straight to that trophy in the tracker.

import { el, gradePill, missableFlag } from './render.js';

function sourceNames(ids, catalog) {
  return ids.map((id) => catalog[id]?.name).filter(Boolean).join('; ');
}

function trophyChip(trophy, state, onJump) {
  const chip = el('button', 'mini-chip');
  chip.type = 'button';
  if (state.earned[trophy.name]) chip.classList.add('is-earned');
  const dot = el('span', `dot dot-${trophy.grade}`);
  chip.append(dot, document.createTextNode(
    `${state.earned[trophy.name] ? '✓ ' : ''}${trophy.name}`));
  chip.addEventListener('click', () => onJump(trophy.name));
  return chip;
}

export function renderRoadmap(container, data, byName, state, catalog, onJump) {
  container.replaceChildren();
  for (const stage of data.roadmap) {
    const card = el('section', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-num', String(stage.stage)));
    head.append(el('h3', null, stage.title));
    if (stage.hours) head.append(el('span', 'stage-hours', stage.hours));
    card.append(head);
    card.append(el('p', null, stage.text));
    const chips = el('div', 'stage-trophies');
    for (const id of stage.trophies) {
      const trophy = data.trophies.find((t) => t.id === id);
      if (trophy) chips.append(trophyChip(trophy, state, onJump));
    }
    card.append(chips);
    if (stage.sources?.length) {
      card.append(el('p', 'src-line', `Stage sources: ${sourceNames(stage.sources, catalog)}.`));
    }
    container.append(card);
  }
}

export function renderMissables(container, data, state, onJump) {
  container.replaceChildren();
  const flagged = data.trophies.filter((t) => t.missable === true || t.missable === 'watch');
  // Confirmed risk first, then the watch list.
  flagged.sort((a, b) => (a.missable === true ? 0 : 1) - (b.missable === true ? 0 : 1));
  for (const trophy of flagged) {
    const card = el('section', 'stage');
    const head = el('div', 'stage-head');
    head.append(gradePill(trophy.grade));
    head.append(el('h3', null, trophy.name));
    const flag = missableFlag(trophy);
    if (flag) head.append(flag);
    if (state.earned[trophy.name]) head.append(el('span', 'stage-hours', '✓ earned'));
    card.append(head);
    card.append(el('p', null, `Official description: “${trophy.description}”`));
    card.append(el('p', null, trophy.guide));
    const chips = el('div', 'stage-trophies');
    chips.append(trophyChip(trophy, state, onJump));
    card.append(chips);
    container.append(card);
  }
}

export function renderAbout(container, data, catalog) {
  container.replaceChildren();
  const intro = el('p', null, data.about);
  container.append(intro);

  container.append(el('h3', null, 'How the guide is organised'));
  container.append(el('p', null,
    'Every trophy carries a kind, derived from its official description: story (chapters and named story missions), ' +
    'collectibles (sets, scans, discoveries and exploration), and activities (everything else you do in the world — ' +
    'races, ranges, strands, robberies and feats). The official list has no online trophies, so the Online filter ' +
    'explains that instead of listing any. Missable flags come from the descriptions too: one trophy is flagged by ' +
    'every published guide we cite, and five more describe one-off moments, marked “watch”.'));

  container.append(el('h3', null, 'Sources'));
  container.append(el('p', null,
    'The official names, descriptions and grades are PlayStation’s, as the two tracking sites that published the ' +
    'list before this guide was written agree on them. Guide facts — counts, chapter structure, the missable ' +
    'warning, the roughly 200-hour estimate — come from the published guides below. Each trophy’s panel names the ' +
    'sources for its own guide. Sources are cited, never copied: every guide here is written for this app.'));
  const list = el('ul', 'source-list');
  for (const src of Object.values(catalog)) {
    const li = el('li');
    const a = el('a', null, src.name);
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.append(a);
    if (src.note) li.append(el('span', 'source-note', ` — ${src.note}`));
    list.append(li);
  }
  container.append(list);

  container.append(el('h3', null, 'Your progress'));
  container.append(el('p', null,
    'Progress is stored only in this browser, in localStorage — nothing is sent anywhere, and the app makes no ' +
    'network requests at all. Use Export in the tracker to download your progress as a JSON file and Import to ' +
    'restore it in another browser. Counters on counted trophies (250 stunts, 42 range golds and the rest) are ' +
    'stored the same way, and reaching a target marks its trophy earned.'));
}
