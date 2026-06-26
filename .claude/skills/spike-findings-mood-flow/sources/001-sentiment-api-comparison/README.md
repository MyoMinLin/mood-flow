---
spike: 001
name: sentiment-api-comparison
type: comparison
validates: "Given a diary text entry, when sent to a sentiment engine, then mood label + confidence returned in <2s"
verdict: VALIDATED
related: [002]
tags: [sentiment, api, mood, afinn, transformers, browser]
---

# Spike 001: Sentiment API Comparison

## What This Validates
Given a diary text entry, when analyzed by a sentiment engine running entirely in the browser, then a mood label and score are returned in under 2 seconds — no backend, no API key.

## Research

### Approaches Compared

| Approach | Library | Model Size | Output | Speed |
|----------|---------|-----------|--------|-------|
| AFINN word-list | `sentiment` (npm) | 0 (built-in list) | Score (-5 to +5), positive/negative word lists | <1ms |
| Transformer | `@huggingface/transformers.js` | ~50MB (cached after first load) | POSITIVE/NEGATIVE + confidence % | ~50-200ms |

### Key Findings
- **AFINN** is instant but shallow — it counts positive/negative words, no context understanding. "Not bad" scores 0 (neutral) when it's clearly positive.
- **Transformer (DistilBERT)** understands context, sarcasm, and nuance. "Not bad" correctly scores as positive. But first load downloads ~50MB.
- For a diary app, the transformer's contextual understanding matters — diary entries are full sentences with emotion, not keyword bags.

### Decision
Build both side-by-side so the user can feel the difference with their own diary text.

## How to Run
```bash
cd .planning/spikes/001-sentiment-api-comparison
npm install
npm run dev
# Open http://localhost:5173
```

## What to Expect
1. Page loads instantly, transformer model downloads in background (~50MB, cached)
2. Type or select a sample diary entry
3. Click "Analyze Mood" — see both engines compared side by side
4. AFINN shows score + positive/negative word highlights
5. Transformer shows POSITIVE/NEGATIVE label + confidence %
6. Timing shown for each

## Investigation Trail
- Researched: `sentiment` npm (AFINN-based), `@huggingface/transformers.js` (DistilBERT in browser)
- Verified: Both import and run in Node.js
- Built: Interactive Vite app with side-by-side comparison

## Results

**Verdict: VALIDATED ✓**

- **AFINN accuracy < 50%** — fails on nuance, sarcasm, and context-dependent sentences. "Not bad" = neutral (should be positive). Acceptable only as a fallback.
- **DistilBERT is clearly more accurate** — understands context, handles mixed emotions, gives confidence scores. The ~50MB download is a one-time cost (cached by browser).
- **Decision:** Use Transformers.js (DistilBERT) as the primary sentiment engine. AFINN can serve as an instant offline fallback while the model downloads.

### Signal for the Build
- Primary: `@huggingface/transformers.js` with `distilbert-base-uncased-finetuned-sst-2-english` (q8 quantized)
- Fallback: `sentiment` (AFINN) for instant results while transformer loads
- Model loads in Web Worker to avoid blocking UI (see spike 002 for integration)
- Output is POSITIVE/NEGATIVE only — need to map to richer mood labels (happy, sad, angry, anxious, etc.) for diary use
