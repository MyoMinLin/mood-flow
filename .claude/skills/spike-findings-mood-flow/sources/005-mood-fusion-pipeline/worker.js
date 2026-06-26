import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let classifier = null;

async function ensureModel() {
  if (classifier) return classifier;
  self.postMessage({ type: 'status', status: 'loading' });
  classifier = await pipeline(
    'text-classification',
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    { dtype: 'q8' }
  );
  self.postMessage({ type: 'status', status: 'ready' });
  return classifier;
}

self.addEventListener('message', async (event) => {
  const { id, text } = event.data;
  try {
    const pipe = await ensureModel();
    const start = performance.now();
    const result = await pipe(text);
    const elapsed = performance.now() - start;
    self.postMessage({
      type: 'result', id,
      label: result[0].label,
      score: result[0].score,
      elapsed: elapsed.toFixed(1)
    });
  } catch (err) {
    self.postMessage({ type: 'error', id, message: err.message });
  }
});
