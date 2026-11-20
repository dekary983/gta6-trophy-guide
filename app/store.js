// store.js — progress persistence for the tracker.
// Earned flags, per-trophy counters and the spoiler setting live in
// localStorage under one key, so the guide works fully offline and a
// player's progress survives closing the browser. Export/import moves
// that same state through a JSON file the player owns.

export const STORAGE_KEY = 'leonida-legend-progress-v1';

export function emptyState() {
  return { earned: {}, counts: {}, spoiler: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      spoiler: parsed.spoiler === true,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota). The tracker keeps
    // working in memory for the session; nothing else to do.
  }
}

export function isEarned(state, name) {
  return state.earned[name] === true;
}

export function earnedCount(state) {
  return Object.values(state.earned).filter(Boolean).length;
}

// The exported file is self-describing so an import can be checked before
// it replaces anything: app name, format version, then the state itself.
export function exportFile(state) {
  return JSON.stringify(
    { app: 'leonida-legend', format: 1, exportedAt: new Date().toISOString(), state },
    null,
    2,
  );
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not a progress file');
  // Accept both this app's wrapped export and a bare state object.
  const state = parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
  if (!state.earned || typeof state.earned !== 'object') throw new Error('no earned list in file');
  const clean = emptyState();
  for (const [name, flag] of Object.entries(state.earned)) {
    if (flag === true) clean.earned[name] = true;
  }
  if (state.counts && typeof state.counts === 'object') {
    for (const [name, n] of Object.entries(state.counts)) {
      const value = Number(n);
      if (Number.isFinite(value) && value >= 0) clean.counts[name] = Math.floor(value);
    }
  }
  clean.spoiler = state.spoiler === true;
  return clean;
}

export function downloadProgress(state) {
  const blob = new Blob([exportFile(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
