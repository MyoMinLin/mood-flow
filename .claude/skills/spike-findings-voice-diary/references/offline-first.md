# Offline-First Mood Analysis

## Requirements

- AFINN as instant offline fallback (no network needed)
- Transformer model loads async when network available
- Don't block UI on transformer availability
- Graceful degradation: AFINN works immediately, transformer adds accuracy later

## How to Build It

### Loading Strategy

```javascript
// 1. AFINN is instant (no download needed)
import Sentiment from 'sentiment';
const sentiment = new Sentiment();  // ready immediately

// 2. Transformer loads in background
let transformerReady = false;
async function loadTransformer() {
  try {
    classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', { dtype: 'q8' });
    transformerReady = true;
  } catch (err) {
    // Offline — AFINN covers us
  }
}
loadTransformer(); // fire and forget

// 3. Analyze with fallback
async function analyze(text) {
  const afinnResult = sentiment.analyze(text);  // always works
  if (transformerReady) {
    return await classifier(text);  // higher accuracy
  }
  return afinnResult;  // fallback
}
```

## What to Avoid

- **Don't wait for transformer** — AFINN provides immediate value
- **Don't show "loading" forever** — if transformer fails, show AFINN result and move on
- **Don't cache transformer in localStorage** — it's ~50MB, let the browser cache handle it

## Constraints

- AFINN accuracy: <50% — acceptable as fallback, not primary
- Transformer download: ~50MB, cached by browser after first load
- Transition between engines can be jarring — consider showing which engine was used

## Origin

Synthesized from spikes: 008
Source files available in: sources/008-offline-first-mood/
