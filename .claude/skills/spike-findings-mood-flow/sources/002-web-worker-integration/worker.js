import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let classifier = null;
let loading = false;

async function ensureModel() {
  if (classifier) return classifier;
  if (loading) {
    // Wait for existing load
    while (!classifier) await new Promise(r => setTimeout(r, 100));
    return classifier;
  }
  loading = true;

  self.postMessage({ type: 'status', status: 'loading', message: 'Downloading model...' });

  classifier = await pipeline(
    'text-classification',
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    {
      dtype: 'q8',
      progress_callback: (progress) => {
        if (progress.status === 'download' && progress.file) {
          self.postMessage({
            type: 'progress',
            file: progress.file.split('/').pop(),
            progress: progress.progress ? Math.round(progress.progress) : null
          });
        }
      }
    }
  );

  self.postMessage({ type: 'status', status: 'ready', message: 'Model loaded' });
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
      type: 'result',
      id,
      label: result[0].label,
      score: result[0].score,
      elapsed: elapsed.toFixed(1)
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      message: err.message
    });
  }
});
