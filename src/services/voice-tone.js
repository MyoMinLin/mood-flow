// Voice tone mood detection via Web Audio API.
// From spike 004 + 005: audio feature extraction and heuristic mood classification.

/**
 * Autocorrelation-based pitch detection.
 * From spike 004: detectPitch(buffer, sampleRate).
 * @param {Float32Array} buffer - Time-domain audio data
 * @param {number} sampleRate
 * @returns {number} Frequency in Hz, or 0 if silence
 */
export function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) sumOfSquares += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumOfSquares / SIZE);
  if (rms < 0.01) return 0; // silence

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

/**
 * RMS energy computation.
 * From spike 004: computeEnergy(buffer).
 * @param {Float32Array} buffer
 * @returns {number} RMS value
 */
export function computeEnergy(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/**
 * Spectral centroid — brightness of sound.
 * From spike 004: computeSpectralCentroid(analyserNode).
 * @param {AnalyserNode} analyserNode
 * @returns {number} Centroid frequency in Hz
 */
export function computeSpectralCentroid(analyserNode) {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyserNode.getFloatFrequencyData(dataArray);

  let weightedSum = 0;
  let totalMagnitude = 0;
  const sampleRate = analyserNode.context.sampleRate;
  const nyquist = sampleRate / 2;

  for (let i = 0; i < bufferLength; i++) {
    const freq = (i / bufferLength) * nyquist;
    const magnitude = Math.pow(10, dataArray[i] / 20); // dB to linear
    weightedSum += freq * magnitude;
    totalMagnitude += magnitude;
  }

  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

/**
 * Zero crossing rate — how often the signal changes sign.
 * From spike 004: computeZeroCrossingRate(buffer).
 * @param {Float32Array} buffer
 * @returns {number} Rate 0-1
 */
export function computeZeroCrossingRate(buffer) {
  let crossings = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / buffer.length;
}

/**
 * Full heuristic mood classification from voice features.
 * From spike 004: classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR).
 * @returns {{ emoji: string, label: string, color: string, confidence: number, category: string }}
 */
export function classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR) {
  // Normalize features to 0-1 range (approximate)
  const pitchNorm = Math.min(1, avgPitch / 400);
  const energyNorm = Math.min(1, avgEnergy / 0.3);
  const centroidNorm = Math.min(1, avgCentroid / 3000);
  const zcrNorm = Math.min(1, avgZCR / 0.2);

  let scores = { positive: 0, anxious: 0, negative: 0, neutral: 0 };

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

  // High ZCR + high energy = angry (negative)
  if (zcrNorm > 0.6 && energyNorm > 0.5) scores.negative += 1;

  const maxScore = Math.max(...Object.values(scores));
  const winner = Object.entries(scores).find(([_, s]) => s === maxScore)[0];
  const confidence = Math.min(100, Math.round((maxScore / 4) * 100));

  const moods = {
    positive: { emoji: '😊', label: 'Positive / Excited', color: '#22c55e' },
    anxious:  { emoji: '😰', label: 'Anxious / Stressed', color: '#f97316' },
    negative: { emoji: '😢', label: 'Sad / Low Energy',   color: '#ef4444' },
    neutral:  { emoji: '😐', label: 'Calm / Neutral',     color: '#eab308' },
  };

  return { ...moods[winner], confidence, category: winner };
}

/**
 * Simplified voice mood classifier for fusion pipeline.
 * Supports adaptive normalization via optional speaker profile (z-score based).
 * From spike 005: classifyVoice(pitch, pitchVar, energy, centroid, zcr).
 * @param {number} pitch
 * @param {number} pitchVar - Coefficient of variation (unitless)
 * @param {number} energy
 * @param {number} centroid
 * @param {number} zcr
 * @param {{ pitchMean, pitchStddev, energyMean, energyStddev, centroidMean, centroidStddev } | null} profile
 * @returns {{ mood: string, confidence: number }}
 */
export function classifyVoice(pitch, pitchVar, energy, centroid, zcr, profile = null) {
  let pn, en, cn;

  if (profile) {
    // Adaptive: z-score normalization relative to speaker's own baseline
    // Map z-scores to 0-1 range using sigmoid-like mapping
    const pitchZ = (pitch - profile.pitchMean) / (profile.pitchStddev || 1);
    const energyZ = (energy - profile.energyMean) / (profile.energyStddev || 1);
    const centroidZ = (centroid - profile.centroidMean) / (profile.centroidStddev || 1);
    // z-score of 0 = 0.5 (neutral), +1 = ~0.73, -1 = ~0.27, +2 = ~0.88, -2 = ~0.12
    const zToNorm = z => 1 / (1 + Math.exp(-z));
    pn = zToNorm(pitchZ);
    en = zToNorm(energyZ);
    cn = zToNorm(centroidZ);
  } else {
    // Fallback: absolute thresholds
    pn = Math.min(1, pitch / 400);
    en = Math.min(1, energy / 0.3);
    cn = Math.min(1, centroid / 3000);
  }

  let scores = { positive: 0, anxious: 0, negative: 0, neutral: 0 };
  if (pn > 0.6 && en > 0.6) scores.positive += 2;
  if (cn > 0.6) scores.positive += 1;
  if (pn > 0.65 && en < 0.4) scores.anxious += 2;
  if (pitchVar > 0.3) scores.anxious += 1;
  if (pn < 0.4 && en < 0.4) scores.negative += 2;
  if (cn < 0.4) scores.negative += 1;
  if (pn > 0.4 && pn < 0.6 && en > 0.35 && en < 0.65) scores.neutral += 2;
  if (pitchVar < 0.15) scores.neutral += 1;

  const max = Math.max(...Object.values(scores));
  const winner = Object.entries(scores).find(([_, s]) => s === max)[0];
  const conf = Math.min(100, Math.round((max / 3) * 100));
  return { mood: winner, confidence: conf };
}
