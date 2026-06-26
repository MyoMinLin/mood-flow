# Implementation Plan: Voice Diary App

**Branch**: `001-voice-diary-app` | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-voice-diary-app/spec.md`

## Summary

Build a responsive web diary application with two input modes (text and voice), voice-to-text conversion, and a calendar-based home page for browsing entries. The app uses Vite as the build tool with vanilla HTML/CSS/JS, sql.js for local SQLite storage in the browser, and the Web Speech API for free voice-to-text transcription.

## Technical Context

**Language/Version**: JavaScript (ES2022+), HTML5, CSS3

**Primary Dependencies**: Vite (build tool), sql.js (SQLite via WASM), sentiment (AFINN), @huggingface/transformers (DistilBERT), chart.js + chartjs-adapter-date-fns (mood visualization)

**Storage**: SQLite in-browser via sql.js, persisted to localStorage (database) and SQLite BLOBs (audio)

**Testing**: Vitest (unit), manual browser testing (integration/E2E)

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) — desktop and mobile

**Project Type**: Web application (single-page, client-side only)

**Performance Goals**: Calendar view loads in <2s, entry creation in <30s (text) / <60s (voice)

**Constraints**: Offline-capable for viewing/creating entries; voice-to-text requires browser support for Web Speech API; no backend server required

**Scale/Scope**: Single-user, personal diary; ~100s of entries typical; audio files up to 30 min

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution found (`.specify/memory/constitution.md` is a template). No governance constraints to check against. Proceeding with industry-standard practices.

## Project Structure

### Documentation (this feature)

```text
specs/001-voice-diary-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── index.html           # Entry point HTML
├── main.js              # App bootstrap, router, mood chart init
├── styles/
│   └── main.css         # Global styles, dark theme, mood colors
├── db/
│   ├── database.js      # sql.js init, schema, mood column migrations, query helper
│   └── migrations.js    # Table creation/migration logic
├── components/
│   ├── calendar.js      # Calendar view component
│   ├── entry-list.js    # Entry list for a selected date (with mood indicators)
│   ├── entry-editor.js  # Text editor + voice recorder (mood analysis on save)
│   ├── voice-recorder.js # Audio recording with size guard
│   ├── entry-viewer.js  # View/edit entry (mood badge + override selector)
│   ├── mood-chart.js    # Chart.js mood timeline with legend and stats
│   └── mood-override.js # Inline mood dropdown selector
├── services/
│   ├── speech.js        # Web Speech API integration
│   ├── audio.js         # Audio recording/playback service
│   ├── diary.js         # CRUD + mood queries (overrideMood, getMoodEntries, getMoodStats)
│   ├── sentiment.js     # AFINN + unified analyze (delegates to worker)
│   ├── sentiment-worker-client.js # Main-thread worker message client
│   ├── voice-tone.js    # Audio feature extraction + mood classification
│   ├── mood-fusion.js   # Text + voice mood fusion pipeline
│   └── moods.js         # Canonical mood labels, emoji, display helpers
├── workers/
│   └── sentiment.worker.js # DistilBERT Web Worker
└── utils/
    ├── date.js          # Date formatting helpers
    ├── dom.js           # DOM utility functions
    └── events.js        # Event bus (on/emit)

public/
└── sql-wasm.wasm        # sql.js WASM file (copied from node_modules)

tests/
├── unit/
│   ├── db/
│   │   └── database.test.js
│   ├── services/
│   │   ├── diary.test.js
│   │   └── speech.test.js
│   └── utils/
│       ├── date.test.js
│       └── dom.test.js
└── integration/
    └── entry-flow.test.js
```

**Structure Decision**: Single-project vanilla JS structure. No framework — all UI is built with vanilla DOM manipulation. Components are ES modules that export render functions returning DOM elements. State management is minimal (event-driven updates). Mood analysis runs in a Web Worker to keep the UI responsive during model loading and inference.

### Mood Architecture

**Dual-engine text sentiment**: AFINN (instant, offline, ~50% accuracy) runs synchronously on every text entry. DistilBERT (high accuracy, ~95%) loads asynchronously in a Web Worker and overrides AFINN once ready. This ensures mood detection works immediately even on first visit or offline.

**Voice tone analysis**: Web Audio API extracts pitch (autocorrelation), energy (RMS), spectral centroid, and zero-crossing rate during recording. A heuristic classifier maps these features to mood categories (~50-60% accuracy).

**Fusion pipeline**: Text sentiment is primary (70% weight), voice tone is secondary (30%). On agreement, confidence is boosted. On conflict, text wins, confidence is reduced to 60%, and the conflict is flagged.

**Privacy**: All analysis runs client-side. No data leaves the browser. The DistilBERT model is downloaded from HuggingFace CDN on first use (~50MB quantized) and cached by the browser.
