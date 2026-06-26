---
name: mood-flow-dev
description: Development workflow and conventions for the mood-flow voice diary app. Covers commands, code patterns, architecture decisions, and troubleshooting.
---

<context>
mood-flow is a client-side-only voice diary app built with Vite + vanilla JS + sql.js.
No framework — all UI is vanilla DOM manipulation with ES modules.
Mood analysis uses dual-engine sentiment (AFINN instant + DistilBERT async in Web Worker).
</context>

<commands>
## Development Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Run tests | `npm run test` |
| Copy sql.js WASM | `npm run postinstall` (auto-runs after `npm install`) |
</commands>

<architecture>
## Code Patterns

- **Components** export a `render()` function that returns a DOM element
- **Services** are plain ES modules with exported functions (no classes)
- **State** flows via event bus (`src/utils/events.js` — `on`/`emit`)
- **Database** access goes through `src/db/database.js` — use `query()` helper
- **Mood pipeline**: text sentiment (primary, 70%) → voice tone (secondary, 30%) → fusion → override

## File Responsibilities

| File | Role |
|------|------|
| `src/main.js` | Bootstrap, router, chart init |
| `src/db/database.js` | sql.js init, schema, migrations |
| `src/services/diary.js` | CRUD + mood queries |
| `src/services/sentiment.js` | AFINN + DistilBERT delegation |
| `src/services/mood-fusion.js` | Text + voice mood fusion |
| `src/components/entry-editor.js` | Text editor + voice recorder |
| `src/components/mood-chart.js` | Chart.js mood timeline |
</architecture>

<gotchas>
## Known Gotchas

- sql.js WASM must be in `public/` — the `postinstall` script copies it from `node_modules`
- DistilBERT model (~50MB) downloads from HuggingFace CDN on first use, then caches
- Web Speech API not available in all browsers — graceful fallback to text-only
- Voice tone analysis runs on recorded audio blobs, not live stream
- localStorage has a ~5MB limit — large audio recordings stored as BLOBs in sql.js
- Chart.js date adapter required: `chartjs-adapter-date-fns`
</gotchas>
