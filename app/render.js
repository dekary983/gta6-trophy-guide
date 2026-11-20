// render.js — draws the tracker: the checklist rows and the detail pane
// for the selected trophy. All text goes through textContent or is built
// as DOM nodes, so trophy names (one contains asterisks) and guides are
// shown exactly as written, never parsed as markup.

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function gradePill(grade) {
  return el('span', `grade grade-${grade}`, grade);
}

export function kindLabel(trophy) {
  if (trophy.kind === 'platinum') return 'Platinum';
  return trophy.kind;
}

// Spoiler mode: a story trophy the player has not earned yet is masked —
// neither its name nor its official description is shown anywhere.
export function isMasked(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned[trophy.name];
}

export function missableFlag(trophy) {
  if (trophy.missable === true) return el('span', 'flag flag-missable', '⚠ MISSABLE');
  if (trophy.missable === 'watch') return el('span', 'flag flag-watch', 'Watch: one-off moment');
  return null;
}

export function formatCount(n) {
  return n.toLocaleString('en-US');
}

export function renderRow(trophy, state, selectedName, onSelect, onToggle) {
  const row = el('button', 'trophy-row');
  row.type = 'button';
  const earned = state.earned[trophy.name] === true;
  if (earned) row.classList.add('is-earned');
  if (trophy.name === selectedName) row.classList.add('is-selected');
  row.dataset.name = trophy.name;

  const tick = el('span', 'tick', '✓');
  tick.setAttribute('aria-hidden', 'true');
  tick.title = earned ? 'Earned — activate the row, then unmark in the panel' : 'Not earned yet';
  row.append(tick);

  const main = el('span', 'row-main');
  const masked = isMasked(trophy, state);
  const nameLine = el('span', 'row-name');
  if (masked) {
    nameLine.append(el('span', 'spoiler-mask', '▒▒ Hidden story trophy ▒▒'));
  } else {
    nameLine.append(document.createTextNode(trophy.name));
    const flag = missableFlag(trophy);
    if (flag) nameLine.append(flag);
  }
  main.append(nameLine);
  main.append(el('span', 'row-desc',
    masked ? 'Earn this story trophy to reveal what it is.' : trophy.description));
  if (!masked && trophy.count) {
    const done = Math.min(state.counts[trophy.name] ?? 0, trophy.count);
    main.append(el('span', 'count-pill',
      `Progress: ${formatCount(done)} / ${formatCount(trophy.count)}${trophy.countLabel ? ` ${trophy.countLabel}` : ''}`));
  }
  row.append(main);

  const flags = el('span', 'row-flags');
  flags.append(gradePill(trophy.grade), el('span', 'kind-tag', kindLabel(trophy)));
  row.append(flags);

  row.addEventListener('click', () => onSelect(trophy.name));
  row.addEventListener('dblclick', () => onToggle(trophy.name));
  return row;
}

function sourceList(trophy, catalog) {
  const wrap = el('div');
  wrap.append(el('h3', null, 'Sources for this guide'));
  const list = el('ul', 'source-list');
  for (const id of trophy.sources ?? []) {
    const src = catalog[id];
    if (!src) continue;
    const li = el('li');
    const a = el('a', null, src.name);
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.append(a);
    li.append(el('span', 'source-note', ' — cited, not copied. The app itself loads nothing; a link opens only if you follow it.'));
    list.append(li);
  }
  wrap.append(list);
  return wrap;
}

function missableBox(trophy) {
  if (trophy.missable === true) {
    const box = el('div', 'missable-box is-missable');
    box.append(el('strong', null, '⚠ Missable. '));
    box.append(document.createTextNode(
      'Published guides flag this as the list’s one potentially missable trophy. Read the guide before you play past the point it names, and keep a manual save.'));
    return box;
  }
  if (trophy.missable === 'watch') {
    const box = el('div', 'missable-box is-watch');
    box.append(el('strong', null, 'Watch — one-off moment. '));
    box.append(document.createTextNode(
      'The official description points at a single moment rather than a repeatable system. This app flags it so you take the moment when it comes; it is not confirmed missable.'));
    return box;
  }
  const box = el('div', 'missable-box is-safe');
  box.append(document.createTextNode(
    'Not missable: nothing in the official description is one-off, and published roadmaps report that side content stays available after the story.'));
  return box;
}

export function renderDetail(pane, trophy, state, catalog, handlers) {
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'detail-hint',
      'Pick a trophy on the left to read its guide: what to do, where and how, when it can be missed, and the sources each fact comes from. Tick trophies off as you earn them — progress saves automatically.'));
    return;
  }
  const earned = state.earned[trophy.name] === true;

  if (isMasked(trophy, state)) {
    pane.append(el('h2', null, 'Hidden story trophy'));
    pane.append(el('p', 'detail-guide',
      'Spoiler mode is on and this story trophy is not earned yet, so its name, description and guide stay hidden. Earn it in game, then mark it earned here — or switch spoiler mode off in the toolbar if you would rather read ahead.'));
    const btn = el('button', 'btn btn-primary', 'I earned it — reveal');
    btn.type = 'button';
    btn.addEventListener('click', () => handlers.onToggle(trophy.name));
    pane.append(btn);
    return;
  }

  const kicker = el('div', 'detail-kicker');
  kicker.append(gradePill(trophy.grade), el('span', 'kind-tag', `${kindLabel(trophy)} trophy`));
  const flag = missableFlag(trophy);
  if (flag) kicker.append(flag);
  pane.append(kicker);

  pane.append(el('h2', null, trophy.name));
  pane.append(el('p', 'detail-official', `“${trophy.description}” — official description`));
  pane.append(missableBox(trophy));
  pane.append(el('p', 'detail-guide', trophy.guide));

  if (Array.isArray(trophy.steps) && trophy.steps.length) {
    pane.append(el('h3', null, 'Steps'));
    const list = el('ol', 'step-list');
    for (const step of trophy.steps) list.append(el('li', null, step));
    pane.append(list);
  }

  const earnRow = el('div', 'earn-row');
  const earnBtn = el('button', 'btn btn-primary', earned ? '✓ Earned — tap to unmark' : 'Mark as earned');
  earnBtn.type = 'button';
  earnBtn.addEventListener('click', () => handlers.onToggle(trophy.name));
  earnRow.append(earnBtn);
  pane.append(earnRow);

  if (trophy.count) {
    pane.append(el('h3', null, 'Track your count'));
    const row = el('div', 'counter-row');
    const minus = el('button', null, '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'Decrease count');
    const out = el('output', null,
      `${formatCount(Math.min(state.counts[trophy.name] ?? 0, trophy.count))} / ${formatCount(trophy.count)}`);
    const plus = el('button', null, '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'Increase count');
    minus.addEventListener('click', () => handlers.onCount(trophy.name, -1));
    plus.addEventListener('click', () => handlers.onCount(trophy.name, 1));
    row.append(minus, out, plus);
    pane.append(row);
    pane.append(el('p', 'source-note',
      `Counting toward: ${trophy.countLabel ?? 'total'}. Reaching the target marks the trophy earned.`));
  }

  pane.append(sourceList(trophy, catalog));
}
