import { el } from '../utils/dom.js';
import { today } from '../utils/date.js';
import { createTextEntry, createVoiceEntry, getSpeakerProfile } from '../services/diary.js';
import { VoiceRecorder } from './voice-recorder.js';
import { emit } from '../utils/events.js';
import { showToast } from '../utils/dom.js';
import { analyze } from '../services/sentiment.js';
import { classifyVoice, detectPitch, computeEnergy, computeZeroCrossingRate } from '../services/voice-tone.js';
import { fuseMood } from '../services/mood-fusion.js';

/**
 * Extract audio features from a recorded audio blob for voice tone analysis.
 * Decodes the audio buffer and computes pitch, energy, spectral centroid (via FFT), and ZCR.
 * Applies noise gating to filter out background noise windows.
 * @param {Uint8Array} audioData
 * @param {string} mimeType
 * @returns {Promise<{ avgPitch: number, pitchVar: number, avgEnergy: number, avgCentroid: number, avgZCR: number }>}
 */
async function extractAudioFeatures(audioData, mimeType) {
  const blob = new Blob([audioData], { type: mimeType });
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Compute spectral centroid via FFT using OfflineAudioContext + AnalyserNode
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(offlineCtx.destination);
    source.start(0);
    await offlineCtx.startRendering();

    const freqData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqData);
    const nyquist = sampleRate / 2;
    let weightedSum = 0;
    let totalMag = 0;
    for (let k = 0; k < freqData.length; k++) {
      const freq = (k / freqData.length) * nyquist;
      const mag = Math.pow(10, freqData[k] / 20); // dB to linear
      weightedSum += freq * mag;
      totalMag += mag;
    }
    const spectralCentroid = totalMag > 0 ? weightedSum / totalMag : 0;

    // Per-window time-domain features (pitch, energy, ZCR)
    const windowSize = 2048;
    const hopSize = 1024;
    const windows = [];

    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const win = channelData.slice(i, i + windowSize);
      const energy = computeEnergy(win);
      const pitch = detectPitch(win, sampleRate);
      const zcr = computeZeroCrossingRate(win);
      windows.push({ pitch, energy, zcr });
    }

    // Noise gating: filter out windows with energy below 20% of median
    const sortedEnergies = windows.map(w => w.energy).sort((a, b) => a - b);
    const medianEnergy = sortedEnergies[Math.floor(sortedEnergies.length / 2)] || 0;
    const noiseThreshold = medianEnergy * 0.2;
    const voiced = windows.filter(w => w.energy > noiseThreshold);

    // Use voiced windows for averages; fall back to all windows if too few
    const source2 = voiced.length >= 3 ? voiced : windows;
    const pitches = source2.filter(w => w.pitch > 0).map(w => w.pitch);
    const energies = source2.map(w => w.energy);
    const zcrs = source2.map(w => w.zcr);

    const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const avgPitch = avg(pitches);
    const avgEnergy = avg(energies);
    const avgZCR = avg(zcrs);
    const pitchVar = pitches.length > 1
      ? Math.sqrt(pitches.reduce((s, p) => s + (p - avgPitch) ** 2, 0) / pitches.length) / avgPitch
      : 0;

    return { avgPitch, pitchVar, avgEnergy, avgCentroid: spectralCentroid, avgZCR };
  } finally {
    await audioCtx.close();
  }
}

export function EntryEditor({ date, mode: initialMode, onClose }) {
  let mode = initialMode || 'write'; // 'write' | 'voice'
  const modeLocked = !!initialMode; // skip toggle when mode is pre-selected

  const panel = el('div', { className: 'editor-panel' });
  const cleanup = () => { recorder.stop(); onClose(); };

  // Header
  const headerLabel = mode === 'voice' ? '🎙 Record Entry' : '✏️ Write Entry';
  const header = el('div', { className: 'editor-header' }, [
    el('h2', { textContent: `${headerLabel} — ${date || today()}` }),
    el('button', { className: 'btn btn-ghost', textContent: '✕', onClick: cleanup }),
  ]);
  panel.appendChild(header);

  // Body
  const body = el('div', { className: 'editor-body' });
  panel.appendChild(body);

  // Mode toggle — only show when no pre-selected mode
  let writeBtn, voiceBtn;
  if (!modeLocked) {
    const toggle = el('div', { className: 'mode-toggle' });
    writeBtn = el('button', { className: mode === 'write' ? 'active' : '', textContent: '✏️ Write' });
    voiceBtn = el('button', { className: mode === 'voice' ? 'active' : '', textContent: '🎤 Voice' });
    toggle.appendChild(writeBtn);
    toggle.appendChild(voiceBtn);
    body.appendChild(toggle);
  }

  // Write mode
  const writeSection = el('div', { style: { display: mode === 'write' ? '' : 'none' } });
  const textarea = el('textarea', { placeholder: 'Write your diary entry...' });
  writeSection.appendChild(textarea);
  body.appendChild(writeSection);

  // Voice mode
  const voiceSection = el('div', { style: { display: mode === 'voice' ? '' : 'none' } });
  const recorder = VoiceRecorder();
  voiceSection.appendChild(recorder.element);
  body.appendChild(voiceSection);

  // Mode switching — only wire when toggle exists
  if (writeBtn && voiceBtn) {
    writeBtn.addEventListener('click', () => {
      mode = 'write';
      writeBtn.classList.add('active');
      voiceBtn.classList.remove('active');
      writeSection.style.display = '';
      voiceSection.style.display = 'none';
    });

    voiceBtn.addEventListener('click', () => {
      mode = 'voice';
      voiceBtn.classList.add('active');
      writeBtn.classList.remove('active');
      voiceSection.style.display = '';
      writeSection.style.display = 'none';
    });
  }

  // Footer with save for write mode
  const footer = el('div', { className: 'editor-footer' }, [
    el('button', { className: 'btn btn-ghost', textContent: 'Cancel', onClick: cleanup }),
    el('button', {
      className: 'btn btn-primary',
      textContent: 'Save',
      onClick: async () => {
        const entryDate = date || today();
        try {
          if (mode === 'write') {
            const text = textarea.value.trim();
            if (!text) {
              showToast('Please write something before saving.', 'error');
              return;
            }
            const sentimentResult = await analyze(text);
            createTextEntry({
              date: entryDate,
              text,
              aiMood: sentimentResult.mood,
              aiConfidence: sentimentResult.confidence / 100,
            });
            emit('entries:changed', { date: entryDate });
            showToast('Entry saved!', 'success');
            cleanup();
          } else if (mode === 'voice') {
            const audioData = recorder.getAudio();
            if (!audioData) {
              showToast('Record something before saving.', 'error');
              return;
            }
            // T071: Extract audio features for voice tone mood analysis
            const features = await extractAudioFeatures(audioData.audioData, audioData.mimeType);
            const profile = getSpeakerProfile();
            const voiceResult = classifyVoice(
              features.avgPitch, features.pitchVar, features.avgEnergy,
              features.avgCentroid, features.avgZCR, profile
            );
            let aiMood = null;
            let aiConfidence = null;
            if (audioData.transcript) {
              const textResult = await analyze(audioData.transcript);
              const fusionResult = fuseMood(
                { mood: textResult.mood, confidence: textResult.confidence / 100 },
                { mood: voiceResult.mood, confidence: voiceResult.confidence }
              );
              aiMood = fusionResult.mood;
              aiConfidence = fusionResult.confidence / 100;
            } else {
              aiMood = voiceResult.mood;
              aiConfidence = voiceResult.confidence / 100;
            }
            createVoiceEntry({
              date: entryDate,
              audioData: audioData.audioData,
              mimeType: audioData.mimeType,
              durationSecs: audioData.durationSecs,
              transcript: audioData.transcript,
              aiMood,
              aiConfidence,
              voiceMood: voiceResult.mood,
              voiceConfidence: voiceResult.confidence / 100,
              avgPitch: features.avgPitch,
              pitchVar: features.pitchVar,
              avgEnergy: features.avgEnergy,
              avgCentroid: features.avgCentroid,
              avgZCR: features.avgZCR,
            });
            emit('entries:changed', { date: entryDate });
            showToast('Voice entry saved!', 'success');
            cleanup();
          }
        } catch (err) {
          showToast('Failed to save: ' + err.message, 'error');
        }
      }
    }),
  ]);
  panel.appendChild(footer);

  // Overlay
  const overlay = el('div', { className: 'editor-overlay', onClick: (e) => { if (e.target === overlay) cleanup(); } }, [panel]);

  return {
    element: overlay
  };
}
