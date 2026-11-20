# Leonida Legend — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all **55 official PlayStation 5 trophies** of Grand Theft Auto VI, built for the make.fun bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/dekary983/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/dekary983/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

Entered on [make.fun](https://make.fun) — bounty page: https://make.fun/bounty/gta6-trophy-guide-01

## What it does

- **Tracker** — every trophy with its official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze). Tick trophies off as you earn them; progress is saved in the browser (localStorage), with per-trophy counters for the counted trophies (250 stunts, 42 Shooting Range golds, 100 WAiNK scans and more), a progress summary, and **export/import** of progress as a JSON file.
- **Filters** — by kind: story, missable, collectibles, activities and online (the official list has no online trophies, and the app says so), plus a grade filter, a text search and a hide-earned toggle.
- **Spoiler mode** — when on, story trophies stay hidden (name and description masked) until you earn them.
- **Platinum roadmap** — six ordered stages from the opening mission to the platinum, built from the official descriptions and the cited published roadmaps, with stage sources named.
- **Missables** — Positive Mental Attitude is flagged as the list's one potentially missable trophy (a Chapter 1 meditation), and five hidden trophies that describe one-off moments carry a “watch” flag, so nobody locks themselves out.
- **Cited guidance** — every trophy has a guide written for this app in its own words, and every guide names its sources (the official list as published by Exophase, and the PowerPyx, Push Square, KeenGamer and GTA Base guides). Sources are cited, never copied. No Rockstar Games logo or artwork anywhere — the look is the app's own.

## Run it

The app is plain static files under `app/` with no build step. Serve it with any static file server, for example:

```
node serve.ts          # then open http://localhost:8080
```

It works fully offline: every script, style and data file is its own, and it makes no network requests.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `buildDossier` from `vendor/makefun-frontend.ts`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html` — the page: masthead, view tabs, tracker toolbar, roadmap, missables and about views
- `app/style.css` — the app's own dusk-over-Leonida theme
- `app/app.js` — bootstrap, filters, views, export/import wiring
- `app/render.js` — checklist rows and the trophy detail pane
- `app/roadmap.js` — roadmap, missables and about views
- `app/store.js` — localStorage progress store and the export file format
- `app/data/trophies.json` — the official 55 trophies with kinds, missable flags, counts, own-words guides, steps, sources and the roadmap stages
- `screenshots/` — four screenshots of the running app (the first is the cover)

MIT licensed — see `LICENSE`.
