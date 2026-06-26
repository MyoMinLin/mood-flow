---
spike: 002
name: web-worker-integration
type: standard
validates: "Given a Vite app, when loading a Transformers.js model in a Web Worker, then UI stays responsive during model load and inference"
verdict: VALIDATED
related: [001]
tags: [worker, vite, transformers, ux, performance]
---

# Spike 002: Web Worker Integration

## What This Validates
Given a Vite app, when loading a ~50MB Transformers.js model in a Web Worker, then the main thread stays at 60 FPS and user interactions (clicks, keystrokes) are never blocked.

## Research

### Why a Web Worker?
- Transformers.js model download + initialization takes 1-5 seconds on first load
- Without a worker, this blocks the main thread → frozen UI, dropped frames
- Web Workers run JS in a separate thread → main thread stays free
- Vite natively supports `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`

### Key Gotcha
Transformers.js uses `fetch()` internally to download models. In a Web Worker, this works fine — but the model cache is per-origin, shared between main thread and worker. So if spike 001 already cached the model, this spike should load instantly.

## How to Run
```bash
cd .planning/spikes/002-web-worker-integration
npm install
npm run dev
# Open http://localhost:5175
```

## What to Expect
1. Page loads with FPS counter, click counter, keystroke counter
2. Model downloads in background worker — notice FPS stays at ~60
3. Click and type while model loads — counters increment normally
4. Once model is ready, type text and click Analyze
5. Result comes back from worker without blocking UI

## Investigation Trail
- Built: Web Worker with Transformers.js singleton pattern
- Vite handles `new Worker(new URL(...))` natively — no plugins needed
- FPS counter proves main thread responsiveness

## Results

**Verdict: VALIDATED ✓**

- UI stays responsive during model download — FPS holds at ~60
- Clicks and keystrokes register normally while worker loads model
- Vite handles `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })` natively — no plugins needed
- Worker singleton pattern prevents duplicate model loads
- Inference runs in worker, results come back via postMessage without blocking

### Signal for the Build
- Use Web Worker for Transformers.js model loading and inference
- FPS stays at display refresh rate (60) — no perceptible UI freeze
- Vite's native worker support is sufficient, no extra config needed
