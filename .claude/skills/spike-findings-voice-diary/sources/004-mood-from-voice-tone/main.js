// --- Voice Tone Mood Detection via Web Audio API ---

let audioContext = null;
let analyser = null;
let mediaStream = null;
let mediaRecorder = null;
let isRecording = false;
let animationId = null;

// Feature accumulators during recording
let features = {
  pitches: [],
  energies: [],
  centroids: [],
  zeroCrossings: [],
  startTime: 0,
  endTime: 0
};

const history = [];

// --- Audio Setup ---
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

// --- Pitch Detection (Autocorrelation) ---
function detectPitch(buffer, sampleRate) {
  let SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) sumOfSquares += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumOfSquares / SIZE);
  if (rms < 0.01) return 0; // silence

  // Autocorrelation
  let maxCorrelation = 0;
  let bestOffset = -1;
  const minOffset = Math.floor(sampleRate / 500); // 500 Hz max
  const maxOffset = Math.floor(sampleRate / 50);  // 50 Hz min

  for (let offset = minOffset; offset < maxOffset && offset < SIZE / 2; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset === -1) return 0;
  return sampleRate / bestOffset;
}

// --- Energy (RMS) ---
function computeEnergy(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// --- Spectral Centroid ---
function computeSpectralCentroid(analyserNode) {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyserNode.getFloatFrequencyData(dataArray);

  let weightedSum = 0;
  let totalMagnitude = 0;
  const nyquist = audioContext.sampleRate / 2;

  for (let i = 0; i < bufferLength; i++) {
    const freq = (i / bufferLength) * nyquist;
    const magnitude = Math.pow(10, dataArray[i] / 20); // convert dB to linear
    weightedSum += freq * magnitude;
    totalMagnitude += magnitude;
  }

  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

// --- Zero Crossing Rate ---
function computeZeroCrossingRate(buffer) {
  let crossings = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / buffer.length;
}

// --- Mood Classification ---
function classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR) {
  // Normalize features to 0-1 range (approximate)
  const pitchNorm = Math.min(1, avgPitch / 400);     // 0-400 Hz typical speech
  const energyNorm = Math.min(1, avgEnergy / 0.3);    // 0-0.3 RMS
  const centroidNorm = Math.min(1, avgCentroid / 3000); // 0-3000 Hz
  const zcrNorm = Math.min(1, avgZCR / 0.2);          // 0-0.2

  // Scoring heuristics
  let scores = {
    positive: 0,
    anxious: 0,
    negative: 0,
    neutral: 0
  };

  // High pitch + high energy + high centroid = excited/positive
  if (pitchNorm > 0.5 && energyNorm > 0.4) scores.positive += 2;
  if (centroidNorm > 0.5) scores.positive += 1;

  // High pitch + low energy = anxious
  if (pitchNorm > 0.6 && energyNorm < 0.3) scores.anxious += 2;
  if (pitchVar > 0.3) scores.anxious += 1;

  // Low pitch + low energy = sad/negative
  if (pitchNorm < 0.4 && energyNorm < 0.3) scores.negative += 2;
  if (centroidNorm < 0.3) scores.negative += 1;

  // Mid everything = neutral
  if (pitchNorm > 0.3 && pitchNorm < 0.6 && energyNorm > 0.2 && energyNorm < 0.5) scores.neutral += 2;
  if (pitchVar < 0.15) scores.neutral += 1;

  // High ZCR + high energy = angry
  if (zcrNorm > 0.6 && energyNorm > 0.5) scores.negative += 1;

  // Find winner
  const maxScore = Math.max(...Object.values(scores));
  const winner = Object.entries(scores).find(([_, s]) => s === maxScore)[0];

  const confidence = Math.min(100, Math.round((maxScore / 4) * 100));

  const moods = {
    positive: { emoji: '😊', label: 'Positive / Excited', color: '#22c55e' },
    anxious: { emoji: '😰', label: 'Anxious / Stressed', color: '#f97316' },
    negative: { emoji: '😢', label: 'Sad / Low Energy', color: '#ef4444' },
    neutral: { emoji: '😐', label: 'Calm / Neutral', color: '#eab308' }
  };

  return { ...moods[winner], confidence, category: winner };
}

// --- Visualization ---
function drawVisualizer() {
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = isRecording ? '#ef4444' : '#333';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

// --- Real-time Meters ---
function updateMeters() {
  if (!isRecording) return;

  const bufferLength = analyser.fftSize;
  const timeData = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(timeData);

  const pitch = detectPitch(timeData, audioContext.sampleRate);
  const energy = computeEnergy(timeData);
  const centroid = computeSpectralCentroid(analyser);
  const zcr = computeZeroCrossingRate(timeData);

  // Accumulate features
  if (pitch > 0) features.pitches.push(pitch);
  features.energies.push(energy);
  features.centroids.push(centroid);
  features.zeroCrossings.push(zcr);

  // Update meters
  const pitchPct = Math.min(100, (pitch / 500) * 100);
  document.getElementById('pitchFill').style.width = pitchPct + '%';
  document.getElementById('pitchValue').textContent = pitch > 0 ? Math.round(pitch) + ' Hz' : '—';

  const energyPct = Math.min(100, (energy / 0.3) * 100);
  document.getElementById('energyFill').style.width = energyPct + '%';
  document.getElementById('energyValue').textContent = energy.toFixed(3);

  const brightnessPct = Math.min(100, (centroid / 3000) * 100);
  document.getElementById('brightnessFill').style.width = brightnessPct + '%';
  document.getElementById('brightnessValue').textContent = Math.round(centroid) + ' Hz';

  const ratePct = Math.min(100, (zcr / 0.2) * 100);
  document.getElementById('rateFill').style.width = ratePct + '%';
  document.getElementById('rateValue').textContent = zcr.toFixed(3);

  requestAnimationFrame(updateMeters);
}

// --- Recording Control ---
window.toggleRecording = async function () {
  const btn = document.getElementById('recordBtn');
  const label = document.getElementById('recordLabel');

  if (!isRecording) {
    await initAudio();
    isRecording = true;
    btn.classList.add('recording');
    label.textContent = 'Recording... click to stop';

    // Reset features
    features = {
      pitches: [],
      energies: [],
      centroids: [],
      zeroCrossings: [],
      startTime: Date.now()
    };

    if (!animationId) drawVisualizer();
    updateMeters();
  } else {
    isRecording = false;
    btn.classList.remove('recording');
    label.textContent = 'Click to record';
    features.endTime = Date.now();

    // Analyze
    analyzeRecording();
  }
};

function analyzeRecording() {
  const p = features.pitches;
  const e = features.energies;
  const c = features.centroids;
  const z = features.zeroCrossings;

  if (p.length === 0 && e.length === 0) {
    document.getElementById('toneMood').innerHTML = `
      <div class="mood-emoji">🤫</div>
      <div class="mood-label" style="color:#888">Too quiet — try speaking louder</div>
    `;
    return;
  }

  const avgPitch = p.length > 0 ? p.reduce((a, b) => a + b, 0) / p.length : 0;
  const pitchVar = p.length > 1
    ? Math.sqrt(p.reduce((sum, v) => sum + (v - avgPitch) ** 2, 0) / p.length) / avgPitch
    : 0;
  const avgEnergy = e.reduce((a, b) => a + b, 0) / e.length;
  const peakEnergy = Math.max(...e);
  const avgCentroid = c.reduce((a, b) => a + b, 0) / c.length;
  const avgZCR = z.reduce((a, b) => a + b, 0) / z.length;
  const duration = ((features.endTime - features.startTime) / 1000).toFixed(1);

  const mood = classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR);

  // Update mood display
  document.getElementById('toneMood').innerHTML = `
    <div class="mood-emoji">${mood.emoji}</div>
    <div class="mood-label" style="color:${mood.color}">${mood.label}</div>
    <div class="mood-confidence">${mood.confidence}% confidence · ${duration}s recording</div>
  `;

  // Update features
  document.getElementById('features').innerHTML = `
    <div class="feature-item"><div class="feature-label">Avg Pitch</div><div class="feature-value">${Math.round(avgPitch)} Hz</div></div>
    <div class="feature-item"><div class="feature-label">Pitch Variance</div><div class="feature-value">${pitchVar.toFixed(3)}</div></div>
    <div class="feature-item"><div class="feature-label">Avg Energy</div><div class="feature-value">${avgEnergy.toFixed(3)}</div></div>
    <div class="feature-item"><div class="feature-label">Peak Energy</div><div class="feature-value">${peakEnergy.toFixed(3)}</div></div>
    <div class="feature-item"><div class="feature-label">Spectral Centroid</div><div class="feature-value">${Math.round(avgCentroid)} Hz</div></div>
    <div class="feature-item"><div class="feature-label">Zero Cross Rate</div><div class="feature-value">${avgZCR.toFixed(4)}</div></div>
  `;

  // Add to history
  history.unshift({
    time: new Date().toLocaleTimeString(),
    duration: duration + 's',
    ...mood,
    avgPitch: Math.round(avgPitch),
    avgEnergy: avgEnergy.toFixed(3)
  });
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) return;
  document.getElementById('historyList').innerHTML = history.slice(0, 10).map(h => `
    <div class="history-row">
      <span style="color:#666;min-width:70px">${h.time}</span>
      <span style="min-width:40px">${h.emoji}</span>
      <span style="color:${h.color};min-width:120px">${h.label}</span>
      <span style="color:#888">${h.confidence}%</span>
      <span style="color:#666">${h.duration}</span>
      <span style="color:#666">pitch:${h.avgPitch}Hz</span>
    </div>
  `).join('');
}
