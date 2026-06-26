// Whisper speech-to-text Web Worker.
// Uses @huggingface/transformers for fully offline transcription.

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let transcriber = null;
let loading = false;

async function ensureModel() {
  if (transcriber) return transcriber;
  if (loading) {
    while (!transcriber) await new Promise(r => setTimeout(r, 200));
    return transcriber;
  }
  loading = true;

  self.postMessage({ type: 'status', status: 'loading', message: 'Downloading Whisper model...' });

  try {
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny.en',
      {
        dtype: 'fp32',
        progress_callback: (progress) => {
          if (progress.status === 'download' && progress.file) {
            self.postMessage({
              type: 'progress',
              file: progress.file.split('/').pop(),
              progress: progress.progress ? Math.round(progress.progress) : null,
            });
          }
        },
      }
    );
  } catch (err) {
    loading = false;
    self.postMessage({ type: 'status', status: 'error', message: 'Failed to load Whisper model: ' + err.message });
    throw err;
  }

  self.postMessage({ type: 'status', status: 'ready', message: 'Whisper model loaded' });
  return transcriber;
}

self.addEventListener('message', async (event) => {
  const { id, samples } = event.data;

  try {
    const pipe = await ensureModel();
    const start = performance.now();

    const result = await pipe(samples);

    const elapsed = performance.now() - start;

    self.postMessage({
      type: 'result',
      id,
      text: result.text.trim(),
      elapsed: elapsed.toFixed(1),
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      message: err.message,
    });
  }
});
