# Spike Manifest

## Idea
VoiceDiary is evolving into an AI-aware emotional journal. The first major feature is mood & emotion tracking — AI detects mood from voice entries (via text transcription), user can override, and the app shows mood per-entry, as a timeline/chart, and as weekly AI-generated insights.

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

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | sentiment-api-comparison | comparison | Given a diary text entry, when sent to a sentiment API, then mood label + confidence returned in <2s | ✓ VALIDATED | sentiment, api, mood, afinn, transformers |
| 002 | web-worker-integration | standard | Given a Vite app, when loading a Transformers.js model in a Web Worker, then UI stays responsive during model load and inference | ✓ VALIDATED | worker, vite, transformers, ux |
| 003 | mood-chart-visualization | standard | Given mood data over time, when rendered in a chart, then trends are visible and interactive in browser | ✓ VALIDATED | chart, visualization, mood, chartjs |
| 004 | mood-from-voice-tone | standard | Given a voice recording, when analyzed for tone/pitch/rhythm, then mood is detectable without transcription | ✓ VALIDATED | voice, tone, emotion, webaudio, pitch |
| 005 | mood-fusion-pipeline | standard | Given conflicting mood signals (text vs voice), when combined, then a single mood is derived with clear priority rules | ✓ VALIDATED | fusion, integration, mood |
| 006 | mood-override-ui | standard | Given a diary entry with AI-detected mood, when user disagrees, then they can override with a different mood label | ✓ VALIDATED | ux, override, mood |
| 007 | mood-data-persistence | standard | Given mood data, when persisted to sql.js, then mood survives page reload and is queryable for charts | ✓ VALIDATED | storage, sql.js, persistence |
| 008 | offline-first-mood | standard | Given no network on first visit, when app loads, then AFINN fallback works immediately and transformer loads later | ✓ VALIDATED | offline, fallback, resilience |
