# Leonida Trophy Atlas

An offline guide and tracker for all **55 PlayStation 5 trophies in Grand Theft Auto VI** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze — with step-by-step guides, progress tracking, and a missable-first planner.

![cover](screenshots/1-cover.jpg)

## What it does

- **All 55 trophies** with concrete, sourced steps — not just descriptions.
- **Progress tracker** — check trophies off by category, see how far along you are.
- **"Up next" planner** — the one missable trophy first, so you don't lock yourself out of 100%.
- **Spoiler toggle** and a **"Before you start"** checklist of 6 habits.
- **Honesty box** — 3 trophies were still unconfirmed at data time, with the best reported leads and their sources, instead of made-up steps.

Trophy data verified against multiple independent sources. Data date: 21 Nov 2026.

## Run it

No build step, no dependencies, nothing fetched over the network. Node 22+:

```bash
node serve.ts
```

Then open http://localhost:8080 (use `--port <n>` for another port).

Or just open `app/index.html` directly in a browser — the app is plain static files.

## Layout

- `app/` — the whole app: `index.html`, `app.js`, `style.css`, `data/trophies.json`
- `serve.ts` — tiny static server for local use (Node standard library only)
- `screenshots/` — screenshots of the app
- `shots.json` — screenshot definitions

## Note

Unofficial fan-made guide. Not affiliated with Rockstar Games or Take-Two Interactive.

## License

MIT — see [LICENSE](LICENSE).
