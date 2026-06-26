// Main-thread client for the sentiment Web Worker.
// From spike 002 + 005 patterns: message protocol with pending promise map.

let worker = null;
let ready = false;
let pending = new Map();
let reqId = 0;

/**
 * Initialize the sentiment worker. Call once at app startup.
 * The worker loads the DistilBERT model in the background.
 */
export function initWorker() {
  if (worker) return;

  worker = new Worker(
    new URL('../workers/sentiment.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.addEventListener('message', (event) => {
    const { type } = event.data;
    if (type === 'status' && event.data.status === 'ready') {
      ready = true;
    } else if (type === 'result') {
      const cb = pending.get(event.data.id);
      if (cb) { cb(event.data); pending.delete(event.data.id); }
    } else if (type === 'error') {
      const cb = pending.get(event.data.id);
      if (cb) { cb({ error: event.data.message }); pending.delete(event.data.id); }
    }
  });
}

/**
 * Send text to the worker for sentiment analysis.
 * @param {string} text
 * @returns {Promise<{ label: string, score: number, elapsed: string } | { error: string }>}
 */
export function analyzeText(text) {
  return new Promise((resolve) => {
    if (!worker) {
      resolve({ error: 'Worker not initialized' });
      return;
    }
    const id = ++reqId;
    pending.set(id, resolve);
    worker.postMessage({ id, text });
  });
}

/**
 * Check if the transformer model is loaded and ready.
 * @returns {boolean}
 */
export function isReady() {
  return ready;
}
