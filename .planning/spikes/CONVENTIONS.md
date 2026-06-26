# Spike Conventions

Patterns and stack choices established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- **Frontend:** Vite + vanilla JS (ES modules), no framework
- **Styling:** CSS-in-HTML (style tags), dark theme (#0f0f0f background)
- **Build:** Vite with `type: "module"` in package.json
- **ML:** Transformers.js (runs in browser via WASM)
- **Charts:** Chart.js + chartjs-adapter-date-fns
- **Audio:** Web Audio API (browser-native, no deps)

## Structure

- Each spike lives in `.planning/spikes/NNN-descriptive-name/`
- Spike contains: `package.json`, `index.html`, `main.js`, `README.md`
- Web Workers use `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`
- Port assignments: 5173, 5174, 5175, 5176, 5177... (increment per spike)

## Patterns

- **Dark UI:** `#0f0f0f` background, `#1a1a1a` cards, `#333` borders
- **Status bars:** colored borders for state (blue=loading, green=ready, red=error)
- **FPS counter:** `requestAnimationFrame` loop to prove UI responsiveness
- **Singleton pattern:** for Web Worker model loading (prevent duplicate loads)
- **Sample data:** generate realistic demo data so spikes are self-contained

## Tools & Libraries

| Package | Version | Used In | Notes |
|---------|---------|---------|-------|
| `@huggingface/transformers` | ^3.0.0 | 001, 002 | DistilBERT in browser, q8 quantized |
| `sentiment` | ^5.0.2 | 001 | AFINN fallback only (<50% accuracy) |
| `chart.js` | ^4.4.0 | 003 | Time series with date-fns adapter |
| `chartjs-adapter-date-fns` | ^3.0.0 | 003 | Lighter than Luxon adapter |
| `date-fns` | ^3.0.0 | 003 | Date utilities |
| `vite` | ^6.0.0 | all | Dev server + bundler |
| `sql.js` | ^1.12.0 | 007 | SQLite via WASM, localStorage persistence |
