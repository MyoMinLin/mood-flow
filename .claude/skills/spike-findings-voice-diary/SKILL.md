---
name: spike-findings-voice-diary
description: Implementation blueprint from spike experiments. Requirements, proven patterns, and verified knowledge for building voice-diary. Auto-loaded during implementation work.
---

<context>
## Project: voice-diary

VoiceDiary is evolving into an AI-aware emotional journal. The first major feature is mood & emotion tracking — AI detects mood from voice entries (via text transcription), user can override, and the app shows mood per-entry, as a timeline/chart, and as weekly AI-generated insights. Client-side only Vite app, no backend.

Spike sessions wrapped: 2026-06-20
</context>

<requirements>
## Requirements

- Voice recordings stay on device (privacy-first)
- Only transcribed text is sent to cloud API for mood analysis
- AI suggests mood, user can override (hybrid approach)
- Mood visualization: per-entry labels, trend chart, weekly insights
- Must work from a client-side-only Vite app (no backend)
- Use Transformers.js (DistilBERT) for text sentiment — AFINN is too inaccurate
- Map sentiment output to richer mood labels (happy, sad, angry, anxious, neutral, mixed)
- Load transformer model in Web Worker to keep UI responsive
- Use Chart.js with time axis for mood timeline visualization
- Voice tone (Web Audio API) as complementary mood signal alongside text sentiment
- Text sentiment is primary, voice tone is secondary/confidence booster
- On mood conflict: text wins, confidence reduced, conflict flagged to user
- Inline dropdown selector for mood override (not modal)
- sql.js + localStorage for client-side persistence
- AFINN as instant offline fallback, transformer loads async
</requirements>

<findings_index>
## Feature Areas

| Area | Reference | Key Finding |
|------|-----------|-------------|
| Text Sentiment | references/text-sentiment.md | Transformers.js DistilBERT in Web Worker — AFINN is <50% accurate |
| Visualization | references/visualization.md | Chart.js with time axis, color-coded points, range selector |
| Voice Tone | references/voice-tone.md | Web Audio API pitch/energy/centroid extraction, ~50-60% heuristic accuracy |
| Mood Fusion | references/mood-fusion.md | Text primary, voice secondary, conflict detection with transparency |
| Override UX | references/override-ux.md | Inline dropdown selector, show AI vs user mood side-by-side |
| Persistence | references/persistence.md | sql.js + localStorage, WASM must be served locally |
| Offline-First | references/offline-first.md | AFINN instant fallback, transformer loads async, graceful degradation |

## Source Files

Original spike source files are preserved in `sources/` for complete reference.
</findings_index>

<metadata>
## Processed Spikes

- 001-sentiment-api-comparison
- 002-web-worker-integration
- 003-mood-chart-visualization
- 004-mood-from-voice-tone
- 005-mood-fusion-pipeline
- 006-mood-override-ui
- 007-mood-data-persistence
- 008-offline-first-mood
</metadata>
