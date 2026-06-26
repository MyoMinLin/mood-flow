# Text Sentiment Analysis

## Requirements

- Use Transformers.js (DistilBERT) for text sentiment — AFINN is <50% accurate
- Map sentiment output (POSITIVE/NEGATIVE) to richer mood labels: happy, sad, angry, anxious, neutral, mixed
- Load transformer model in Web Worker to keep UI at 60 FPS during download
- AFINN (`sentiment` npm) as instant fallback while transformer loads

## How to Build It

### 1. Install Dependencies

```json
{
  "@huggingface/transformers": "^3.0.0",
  "sentiment": "^5.0.2"
}
```

### 2. Create Web Worker (`worker.js`)

```javascript
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let classifier = null;

async function ensureModel() {
  if (classifier) return classifier;
  classifier = await pipeline(
    'text-classification',
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    { dtype: 'q8' }
  );
  return classifier;
}

self.addEventListener('message', async (event) => {
  const { id, text } = event.data;
  const pipe = await ensureModel();
  const result = await pipe(text);
  self.postMessage({
    type: 'result',
    id,
    label: result[0].label,
    score: result[0].score
  });
});
```

### 3. Main Thread Integration

```javascript
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

function analyze(text) {
  return new Promise((resolve) => {
    const id = Date.now();
    const handler = (event) => {
      if (event.data.id === id) {
        worker.removeEventListener('message', handler);
        resolve(event.data);
      }
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ id, text });
  });
}
```

### 4. AFINN Fallback (instant, while transformer loads)

```javascript
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

function analyzeAFINN(text) {
  const result = sentiment.analyze(text);
  // result.score: -5 to +5
  // result.positive, result.negative: word arrays
  return result;
}
```

### 5. Mood Label Mapping

```javascript
function mapMood(label, score) {
  // Transformer gives POSITIVE/NEGATIVE with confidence
  if (label === 'POSITIVE' && score > 0.8) return { mood: 'happy', emoji: '😊' };
  if (label === 'POSITIVE') return { mood: 'content', emoji: '🙂' };
  if (label === 'NEGATIVE' && score > 0.8) return { mood: 'sad', emoji: '😢' };
  return { mood: 'unhappy', emoji: '😕' };
}
```

## What to Avoid

- **Don't use AFINN as primary engine** — accuracy <50% on diary text. "Not bad" = neutral (should be positive). Only use as fallback.
- **Don't load transformer on main thread** — 50MB download blocks UI for 1-5 seconds. Always use Web Worker.
- **Don't expect POSITIVE/NEGATIVE to be enough** — diary users want nuanced moods (anxious, angry, grateful). Map to richer labels.
- **Don't skip quantization** — `dtype: 'q8'` reduces model from ~250MB to ~50MB with negligible accuracy loss.

## Constraints

- First model download: ~50MB, cached by browser after first load
- Inference time: ~50-200ms per entry
- Output: POSITIVE or NEGATIVE with confidence 0-1
- Browser must support Web Workers and WebAssembly
- Model cache is per-origin (shared between tabs)

## Origin

Synthesized from spikes: 001, 002
Source files available in: sources/001-sentiment-api-comparison/, sources/002-web-worker-integration/
