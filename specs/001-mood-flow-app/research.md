# Research: Voice Diary App

**Date**: 2026-06-20
**Feature**: Voice Diary App

## R1: Voice-to-Text — Web Speech API vs Alternatives

**Decision**: Use the browser's built-in Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)

**Rationale**:
- Free — no API keys, no usage limits, no backend required
- Built into Chrome, Edge, Safari (partial in Firefox)
- Works offline on Chrome (uses on-device model)
- Sufficient accuracy (85-95% for clear speech) per SC-003
- Zero additional dependencies

**Alternatives considered**:
- **Whisper (OpenAI)**: Requires API key and internet; not free. Overkill for a local demo.
- **Whisper.cpp / Whisper WASM**: Compiles to ~40MB WASM; too heavy for a lightweight Vite app. Excellent accuracy but impractical for browser-only.
- **Vosk**: Offline speech recognition, but requires downloading ~50MB language models. Better suited for desktop apps.
- **Deepgram / AssemblyAI**: Cloud APIs with free tiers, but require API keys and internet connectivity.

**Fallback**: When Web Speech API is unavailable (e.g., Firefox with limited support), the app will display a message suggesting Chrome/Edge and still allow written entries.

## R2: SQLite in Browser — sql.js

**Decision**: Use sql.js (SQLite compiled to WebAssembly)

**Rationale**:
- Runs SQLite entirely in the browser — no backend needed
- Full SQL support for querying entries by date, filtering, etc.
- WASM file is ~1MB — acceptable for a Vite app
- Supports `db.export()` for persistence to localStorage
- Mature library with good documentation

**Alternatives considered**:
- **IndexedDB**: Native browser API, but no SQL support. Would require a wrapper (Dexie.js) and loses the "local SQLite" requirement.
- **OPFS (Origin Private File System)**: Modern API for file-like storage. Could store a real SQLite file, but browser support is still limited (no Safari full support). sql.js with localStorage is more compatible.
- **better-sqlite3**: Node.js only — not suitable for browser.
- **absurd-sql**: Uses OPFS as backend for sql.js. Adds complexity; localStorage is simpler for a demo app.

**Persistence strategy**: After each write operation, call `db.export()` and store the binary data as a base64-encoded string in localStorage. On app load, read from localStorage and reconstruct the database. For audio BLOBs, store directly in SQLite as BLOB columns.

## R3: Audio Recording — MediaRecorder API

**Decision**: Use the browser's built-in MediaRecorder API

**Rationale**:
- Free, no dependencies
- Built into all modern browsers
- Records to WebM/Opus (Chrome) or MP4/AAC (Safari) — both supported
- Can capture audio chunks and concatenate for long recordings (30+ min per SC-008)
- Audio can be converted to Uint8Array and stored in SQLite as BLOB

**Alternatives considered**:
- **RecordRTC**: Adds a dependency for marginal benefit. MediaRecorder is sufficient.
- **Web Audio API + ScriptProcessorNode**: Lower level, more complex, no recording benefit over MediaRecorder.

## R4: Vite Project Setup

**Decision**: Use `npm create vite@latest` with `vanilla` template (JavaScript)

**Rationale**:
- Minimal setup — no framework boilerplate
- Fast dev server with HMR
- Built-in support for WASM (sql.js)
- Small build output

**Configuration notes**:
- Copy `sql-wasm.wasm` from `node_modules/sql.js/dist/` to `public/` via a Vite plugin or postinstall script
- No additional Vite plugins needed for vanilla JS

## R5: UI Architecture — Vanilla DOM

**Decision**: Component-based vanilla JS with ES modules

**Rationale**:
- Each "component" is an ES module exporting a `render()` function that returns a DOM element
- State is managed via a simple event bus (pub/sub pattern) for reactivity
- No virtual DOM, no JSX — direct DOM manipulation
- CSS is organized by component with a shared responsive grid

**Pattern**:
```
// component example
export function Calendar({ onDateSelect }) {
  const el = document.createElement('div');
  el.className = 'calendar';
  // ... render logic
  return el;
}
```

**Responsive strategy**: CSS Grid + Flexbox with media queries. Mobile-first design. Calendar adapts from full grid (desktop) to compact list (mobile).
