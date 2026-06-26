// Main-thread client for the Whisper transcription Web Worker.

const SAMPLE_RATE = 16000;

let worker = null;
let ready = false;
let loading = false;
let pending = new Map();
let statusListeners = [];
let reqId = 0;

function notifyStatus(status, message) {
  for (const cb of statusListeners) cb(status, message);
}

function ensureWorker() {
  if (worker) return;

  worker = new Worker(
    new URL('../workers/whisper.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.addEventListener('message', (event) => {
    const { type } = event.data;
    if (type === 'status') {
      if (event.data.status === 'ready') {
        ready = true;
        loading = false;
      } else if (event.data.status === 'error') {
        loading = false;
      }
      notifyStatus(event.data.status, event.data.message);
    } else if (type === 'progress') {
      notifyStatus('downloading', `Downloading: ${event.data.file}${event.data.progress != null ? ` (${event.data.progress}%)` : ''}`);
    } else if (type === 'result') {
      const cb = pending.get(event.data.id);
      if (cb) { cb({ text: event.data.text, elapsed: event.data.elapsed }); pending.delete(event.data.id); }
    } else if (type === 'error') {
      const cb = pending.get(event.data.id);
      if (cb) { cb({ error: event.data.message }); pending.delete(event.data.id); }
    }
  });
}

/**
 * Decode raw audio bytes to mono float32 PCM at 16kHz on the main thread.
 * OfflineAudioContext is not available in Web Workers, so decoding happens here.
 * @param {Uint8Array} audioBytes
 * @returns {Promise<Float32Array>}
 */
async function decodeAudio(audioBytes) {
  const offlineCtx = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  const audioBuffer = await offlineCtx.decodeAudioData(audioBytes.buffer);

  const length = Math.ceil(audioBuffer.duration * SAMPLE_RATE);
  const resampler = new OfflineAudioContext(1, length, SAMPLE_RATE);
  const source = resampler.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(resampler.destination);
  source.start();
  const rendered = await resampler.startRendering();

  return rendered.getChannelData(0);
}

/**
 * Transcribe audio data to text using Whisper.
 * Decodes audio on the main thread, then sends PCM samples to the worker.
 * @param {Uint8Array} audioData — raw audio bytes (webm, mp3, wav, etc.)
 * @returns {Promise<{ text: string, elapsed: string } | { error: string }>}
 */
export async function transcribe(audioData) {
  ensureWorker();
  loading = true;

  const samples = await decodeAudio(audioData);

  return new Promise((resolve) => {
    const id = ++reqId;
    pending.set(id, resolve);
    worker.postMessage({ id, samples }, [samples.buffer]);
  });
}

/**
 * Listen for model load status changes.
 * @param {(status: string, message: string) => void} cb
 */
export function onStatus(cb) {
  statusListeners.push(cb);
}

/** Check if Whisper model is loaded and ready. */
export function isReady() {
  return ready;
}
