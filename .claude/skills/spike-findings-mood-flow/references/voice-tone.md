# Voice Tone Mood Detection

## Requirements

- Voice tone (Web Audio API) as complementary mood signal alongside text sentiment
- Voice recordings stay on device (privacy-first)
- Combine voice tone mood with text sentiment for higher confidence
- Voice tone as primary when transcription unavailable, secondary when available

## How to Build It

### 1. No Dependencies Needed

Pure Web Audio API — browser-native.

### 2. Audio Setup

```javascript
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8;

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);
```

### 3. Feature Extraction

**Pitch Detection (Autocorrelation):**
```javascript
function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0; // silence

  let maxCorr = 0, bestOffset = -1;
  const minOff = Math.floor(sampleRate / 500); // 500 Hz max
  const maxOff = Math.floor(sampleRate / 50);  // 50 Hz min

  for (let offset = minOff; offset < maxOff; offset++) {
    let corr = 0;
    for (let i = 0; i < SIZE - offset; i++) corr += buffer[i] * buffer[i + offset];
    if (corr > maxCorr) { maxCorr = corr; bestOffset = offset; }
  }
  return bestOffset > 0 ? sampleRate / bestOffset : 0;
}
```

**Energy (RMS):**
```javascript
function computeEnergy(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}
```

**Spectral Centroid:**
```javascript
function computeSpectralCentroid(analyserNode, sampleRate) {
  const data = new Float32Array(analyserNode.frequencyBinCount);
  analyserNode.getFloatFrequencyData(data);
  let weighted = 0, total = 0;
  const nyquist = sampleRate / 2;
  for (let i = 0; i < data.length; i++) {
    const freq = (i / data.length) * nyquist;
    const mag = Math.pow(10, data[i] / 20);
    weighted += freq * mag;
    total += mag;
  }
  return total > 0 ? weighted / total : 0;
}
```

**Zero Crossing Rate:**
```javascript
function computeZCR(buffer) {
  let crossings = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i-1] < 0) || (buffer[i] < 0 && buffer[i-1] >= 0)) crossings++;
  }
  return crossings / buffer.length;
}
```

### 4. Mood Classification

```javascript
function classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR) {
  const pn = Math.min(1, avgPitch / 400);
  const en = Math.min(1, avgEnergy / 0.3);
  const cn = Math.min(1, avgCentroid / 3000);

  if (pn > 0.5 && en > 0.4) return 'positive';    // high pitch + high energy
  if (pn > 0.6 && en < 0.3) return 'anxious';      // high pitch + low energy
  if (pn < 0.4 && en < 0.3) return 'negative';     // low pitch + low energy
  return 'neutral';
}
```

## What to Avoid

- **Don't use as sole mood signal** — heuristic accuracy is ~50-60%. Always combine with text sentiment.
- **Don't ignore silence** — check RMS > 0.01 before analyzing pitch, otherwise you get garbage readings.
- **Don't assume speaker-independent** — pitch range varies hugely between people. Consider calibrating per-user.
- **Don't skip real-time meters** — users need visual feedback that their voice is being analyzed (builds trust).

## Constraints

- Requires microphone permission (getUserMedia)
- Accuracy ~50-60% with heuristics (ML model would improve but adds complexity)
- Speaker-dependent — pitch range varies by person
- Background noise skews energy readings
- Can't reliably distinguish "excited happy" from "excited angry"
- Pitch detection range: 50-500 Hz (covers most speech)

## Origin

Synthesized from spikes: 004
Source files available in: sources/004-mood-from-voice-tone/
