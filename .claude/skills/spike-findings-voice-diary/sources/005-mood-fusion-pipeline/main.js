// --- Spike 005: Mood Fusion Pipeline ---
// Combines text sentiment (DistilBERT) + voice tone (Web Audio API)

// === TEXT SENTIMENT (from worker) ===
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let textReady = false;
let pendingText = new Map();
let textReqId = 0;

worker.addEventListener('message', (event) => {
  const { type } = event.data;
  if (type === 'status' && event.data.status === 'ready') {
    textReady = true;
    document.getElementById('textStatus').textContent = '✓ Ready';
    document.getElementById('textStatus').className = 'status-dot ready';
  } else if (type === 'result') {
    const cb = pendingText.get(event.data.id);
    if (cb) { cb(event.data); pendingText.delete(event.data.id); }
  }
});

function analyzeText(text) {
  return new Promise((resolve) => {
    const id = ++textReqId;
    pendingText.set(id, resolve);
    worker.postMessage({ id, text });
  });
}

// === VOICE TONE (Web Audio API) ===
let audioContext = null;
let analyser = null;
let mediaStream = null;
let isRecording = false;
let voiceFeatures = { pitches: [], energies: [], centroids: [], zcrs: [] };

async function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);
}

function detectPitch(buffer, sr) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0;
  let maxCorr = 0, bestOff = -1;
  const minOff = Math.floor(sr / 500), maxOff = Math.floor(sr / 50);
  for (let off = minOff; off < maxOff && off < SIZE / 2; off++) {
    let corr = 0;
    for (let i = 0; i < SIZE - off; i++) corr += buffer[i] * buffer[i + off];
    if (corr > maxCorr) { maxCorr = corr; bestOff = off; }
  }
  return bestOff > 0 ? sr / bestOff : 0;
}

function computeEnergy(buf) {
  let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

function computeCentroid() {
  const data = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(data);
  const nyq = audioContext.sampleRate / 2;
  let w = 0, t = 0;
  for (let i = 0; i < data.length; i++) {
    const f = (i / data.length) * nyq;
    const m = Math.pow(10, data[i] / 20);
    w += f * m; t += m;
  }
  return t > 0 ? w / t : 0;
}

function computeZCR(buf) {
  let c = 0;
  for (let i = 1; i < buf.length; i++) {
    if ((buf[i] >= 0 && buf[i - 1] < 0) || (buf[i] < 0 && buf[i - 1] >= 0)) c++;
  }
  return c / buf.length;
}

function classifyVoice(pitch, pitchVar, energy, centroid, zcr) {
  const pn = Math.min(1, pitch / 400);
  const en = Math.min(1, energy / 0.3);
  const cn = Math.min(1, centroid / 3000);
  let scores = { positive: 0, anxious: 0, negative: 0, neutral: 0 };
  if (pn > 0.5 && en > 0.4) scores.positive += 2;
  if (cn > 0.5) scores.positive += 1;
  if (pn > 0.6 && en < 0.3) scores.anxious += 2;
  if (pitchVar > 0.3) scores.anxious += 1;
  if (pn < 0.4 && en < 0.3) scores.negative += 2;
  if (cn < 0.3) scores.negative += 1;
  if (pn > 0.3 && pn < 0.6 && en > 0.2 && en < 0.5) scores.neutral += 2;
  if (pitchVar < 0.15) scores.neutral += 1;
  const max = Math.max(...Object.values(scores));
  const winner = Object.entries(scores).find(([_, s]) => s === max)[0];
  const conf = Math.min(100, Math.round((max / 3) * 100));
  return { mood: winner, confidence: conf };
}

function updateMeters() {
  if (!isRecording) return;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const pitch = detectPitch(buf, audioContext.sampleRate);
  const energy = computeEnergy(buf);
  const centroid = computeCentroid();
  const zcr = computeZCR(buf);
  if (pitch > 0) voiceFeatures.pitches.push(pitch);
  voiceFeatures.energies.push(energy);
  voiceFeatures.centroids.push(centroid);
  voiceFeatures.zcrs.push(zcr);
  document.getElementById('pitchVal').textContent = pitch > 0 ? Math.round(pitch) + ' Hz' : '—';
  document.getElementById('energyVal').textContent = energy.toFixed(3);
  requestAnimationFrame(updateMeters);
}

// === FUSION LOGIC ===
function fuseMood(textResult, voiceResult) {
  // Text sentiment: POSITIVE/NEGATIVE + confidence
  // Voice: positive/anxious/negative/neutral + confidence

  const textMood = textResult.label === 'POSITIVE' ? 'positive' : 'negative';
  const textConf = Math.round(textResult.score * 100);

  if (!voiceResult) {
    // No voice data — text only
    return {
      mood: textMood,
      confidence: textConf,
      source: 'text-only',
      agreement: null,
      conflict: false
    };
  }

  const voiceConf = voiceResult.confidence;
  const voiceMood = voiceResult.mood;

  // Check agreement
  const agrees = textMood === voiceMood ||
    (textMood === 'positive' && voiceMood === 'neutral') ||
    (textMood === 'negative' && voiceMood === 'anxious');

  if (agrees) {
    // Signals agree — boost confidence
    const combined = Math.min(100, Math.round((textConf * 0.7 + voiceConf * 0.3) + 10));
    return {
      mood: textMood === 'positive' && voiceMood === 'neutral' ? 'content' : textMood,
      confidence: combined,
      source: 'fusion',
      agreement: true,
      conflict: false
    };
  }

  // Signals disagree — text wins, but flag conflict
  return {
    mood: textMood,
    confidence: Math.round(textConf * 0.6), // reduce confidence on conflict
    source: 'text-override',
    agreement: false,
    conflict: true,
    textMood,
    voiceMood,
    textConf,
    voiceConf
  };
}

// === UI ===
const SAMPLES = [
  "I had an amazing day! Everything went perfectly and I feel grateful.",
  "I'm so frustrated with work. Nothing I do seems to matter.",
  "Just another ordinary day. Nothing special happened.",
  "My heart is racing and I can't stop worrying about tomorrow."
];

window.setSample = (idx) => {
  document.getElementById('textInput').value = SAMPLES[idx];
};

window.toggleRecord = async () => {
  const btn = document.getElementById('recordBtn');
  if (!isRecording) {
    await initAudio();
    isRecording = true;
    btn.classList.add('recording');
    btn.querySelector('.btn-label').textContent = 'Stop Recording';
    voiceFeatures = { pitches: [], energies: [], centroids: [], zcrs: [] };
    document.getElementById('voiceStatus').textContent = '● Recording...';
    document.getElementById('voiceStatus').className = 'status-dot recording';
    updateMeters();
  } else {
    isRecording = false;
    btn.classList.remove('recording');
    btn.querySelector('.btn-label').textContent = 'Start Recording';
    document.getElementById('voiceStatus').textContent = '✓ Captured';
    document.getElementById('voiceStatus').className = 'status-dot ready';
    analyzeVoiceResult();
  }
};

let lastVoiceResult = null;

function analyzeVoiceResult() {
  const p = voiceFeatures.pitches;
  const e = voiceFeatures.energies;
  const c = voiceFeatures.centroids;
  const z = voiceFeatures.zcrs;
  if (p.length === 0 && e.length === 0) return;

  const avgPitch = p.length ? p.reduce((a, b) => a + b) / p.length : 0;
  const pitchVar = p.length > 1 ? Math.sqrt(p.reduce((s, v) => s + (v - avgPitch) ** 2, 0) / p.length) / avgPitch : 0;
  const avgEnergy = e.reduce((a, b) => a + b) / e.length;
  const avgCentroid = c.reduce((a, b) => a + b) / c.length;
  const avgZCR = z.reduce((a, b) => a + b) / z.length;

  lastVoiceResult = classifyVoice(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR);
  renderVoiceResult(lastVoiceResult);
}

function renderVoiceResult(r) {
  const el = document.getElementById('voiceResult');
  const emojis = { positive: '😊', anxious: '😰', negative: '😢', neutral: '😐' };
  const colors = { positive: '#22c55e', anxious: '#f97316', negative: '#ef4444', neutral: '#eab308' };
  el.innerHTML = `
    <div class="mood-big">${emojis[r.mood] || '❓'}</div>
    <div class="mood-name" style="color:${colors[r.mood]}">${r.mood}</div>
    <div class="mood-conf">${r.confidence}% confidence</div>
  `;
}

window.runFusion = async () => {
  const text = document.getElementById('textInput').value.trim();
  if (!text) return;

  const btn = document.getElementById('fusionBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  // Get text sentiment
  const textResult = await analyzeText(text);
  renderTextResult(textResult);

  // Fuse
  const fusion = fuseMood(textResult, lastVoiceResult);
  renderFusion(fusion);

  btn.disabled = false;
  btn.textContent = '🔀 Fuse Moods';
};

function renderTextResult(r) {
  const el = document.getElementById('textResult');
  const mood = r.label === 'POSITIVE' ? 'positive' : 'negative';
  const emojis = { positive: '😊', negative: '😢' };
  const colors = { positive: '#22c55e', negative: '#ef4444' };
  el.innerHTML = `
    <div class="mood-big">${emojis[mood]}</div>
    <div class="mood-name" style="color:${colors[mood]}">${mood}</div>
    <div class="mood-conf">${Math.round(r.score * 100)}% confidence</div>
  `;
}

function renderFusion(f) {
  const el = document.getElementById('fusionResult');
  const emojis = { positive: '😊', negative: '😢', content: '🙂', anxious: '😰' };
  const colors = { positive: '#22c55e', negative: '#ef4444', content: '#22c55e', anxious: '#f97316' };

  let conflictHtml = '';
  if (f.conflict) {
    conflictHtml = `
      <div class="conflict-box">
        ⚠️ Conflict detected: text says ${f.textMood} (${f.textConf}%), voice says ${f.voiceMood} (${f.voiceConf}%)
        <br>Text wins (higher reliability)
      </div>
    `;
  } else if (f.agreement) {
    conflictHtml = `<div class="agree-box">✓ Signals agree — confidence boosted</div>`;
  }

  el.innerHTML = `
    <div class="mood-big">${emojis[f.mood] || '❓'}</div>
    <div class="mood-name" style="color:${colors[f.mood]}">${f.mood}</div>
    <div class="mood-conf">${f.confidence}% confidence · ${f.source}</div>
    ${conflictHtml}
  `;
}

// Wire up
document.getElementById('fusionBtn').addEventListener('click', runFusion);
document.getElementById('recordBtn').addEventListener('click', toggleRecord);

// Text input change → clear previous fusion
document.getElementById('textInput').addEventListener('input', () => {
  document.getElementById('textResult').innerHTML = '<p style="color:#666">Click "Fuse Moods" to analyze</p>';
  document.getElementById('fusionResult').innerHTML = '<p style="color:#666">Results appear here</p>';
});
