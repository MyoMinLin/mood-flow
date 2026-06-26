---
spike: 008
name: offline-first-mood
type: standard
validates: "Given no network on first visit, when app loads, then AFINN fallback works immediately and transformer loads later when online"
verdict: VALIDATED
related: [001, 002]
tags: [offline, fallback, resilience, afinn, transformers]
---

# Spike 008: Offline-First Mood

## What This Validates
Given no network on first visit, when the app loads, then AFINN provides instant sentiment analysis while the transformer model downloads in the background. When the model arrives, it takes over seamlessly.

## How to Run
```bash
cd .planning/spikes/008-offline-first-mood
npm install
npm run dev
# Open http://localhost:5181
```

## What to Expect
1. AFINN is ready instantly — type and analyze immediately
2. Transformer downloads in background (~50MB)
3. Status bar shows loading state, then switches to "ready"
4. "Simulate Offline" button toggles transformer availability
5. When offline: AFINN results only
6. When online: transformer results (with AFINN comparison if they differ)

## Results

**Verdict: VALIDATED ✓**

- AFINN works instantly with no network — zero latency fallback
- Transformer loads in background when network is available
- Transition isn't always smooth but is functional
- "Simulate Offline" toggle confirms AFINN-only mode works
- Acceptable for offline-first use case — AFINN provides immediate value

### Signal for the Build
- AFINN as instant fallback on page load
- Transformer loads async in Web Worker
- Don't block UI on transformer availability
- Transition between engines can be jarring — consider blending results during switch-over
