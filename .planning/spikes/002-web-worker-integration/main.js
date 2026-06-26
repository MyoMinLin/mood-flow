// --- Web Worker setup ---
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

let modelReady = false;
let pendingRequests = new Map();
let requestId = 0;

worker.addEventListener('message', (event) => {
  const { type } = event.data;

  if (type === 'status') {
    if (event.data.status === 'ready') {
      modelReady = true;
      document.getElementById('status').className = 'status-bar ready';
      document.getElementById('status').textContent = '✓ Model loaded in worker — UI was never blocked';
    }
  } else if (type === 'progress') {
    const pct = event.data.progress ? `${event.data.progress}%` : 'downloading...';
    document.getElementById('status').innerHTML =
      `<span class="loader"></span> Worker loading model: ${pct} — ${event.data.file}`;
  } else if (type === 'result') {
    const cb = pendingRequests.get(event.data.id);
    if (cb) {
      cb(event.data);
      pendingRequests.delete(event.data.id);
    }
  } else if (type === 'error') {
    const cb = pendingRequests.get(event.data.id);
    if (cb) {
      cb({ error: event.data.message });
      pendingRequests.delete(event.data.id);
    }
  }
});

function analyze(text) {
  return new Promise((resolve) => {
    const id = ++requestId;
    pendingRequests.set(id, resolve);
    worker.postMessage({ id, text });
  });
}

// --- UI Responsiveness Proof ---
let frameCount = 0;
let lastFrameTime = performance.now();
let fps = 0;

function countFrames() {
  frameCount++;
  const now = performance.now();
  if (now - lastFrameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = now;
    document.getElementById('fps').textContent = fps;
  }
  requestAnimationFrame(countFrames);
}
requestAnimationFrame(countFrames);

// --- Interaction counter (proves UI isn't blocked) ---
let clickCount = 0;
document.addEventListener('click', () => {
  clickCount++;
  document.getElementById('clicks').textContent = clickCount;
});

let keystrokeCount = 0;
document.addEventListener('keydown', () => {
  keystrokeCount++;
  document.getElementById('keystrokes').textContent = keystrokeCount;
});

// --- Analyze button ---
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const text = document.getElementById('input').value.trim();
  if (!text) return;

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<p style="color:#888">Sending to worker...</p>';

  const result = await analyze(text);

  if (result.error) {
    resultDiv.innerHTML = `<p style="color:#f87171">Error: ${result.error}</p>`;
  } else {
    const mood = result.label === 'POSITIVE' ? '😊 Positive' : '😢 Negative';
    const conf = (result.score * 100).toFixed(1);
    resultDiv.innerHTML = `
      <div class="result-row">
        <span class="result-label">Mood</span>
        <span class="result-value">${mood}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Confidence</span>
        <span class="result-value">${conf}%</span>
      </div>
      <div class="result-row">
        <span class="result-label">Inference time</span>
        <span class="result-value">${result.elapsed}ms</span>
      </div>
    `;
  }

  btn.disabled = false;
  btn.textContent = 'Analyze Mood';
});

// Allow Ctrl+Enter
document.getElementById('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    document.getElementById('analyzeBtn').click();
  }
});
