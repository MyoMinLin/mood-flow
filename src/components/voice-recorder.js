import { el } from '../utils/dom.js';
import { startRecording, playAudio, isRecordingSupported } from '../services/audio.js';
import { formatDuration } from '../utils/date.js';
import { showToast } from '../utils/dom.js';

export function VoiceRecorder() {
  let recorder = null;
  let timerInterval = null;
  let seconds = 0;
  let savedAudio = null;
  let previewAudio = null;
  let animFrameId = null;
  let audioCtx = null;
  let analyser = null;

  const container = el('div', { className: 'voice-recorder' });

  if (!isRecordingSupported()) {
    container.appendChild(el('div', { className: 'empty-state' }, [
      el('div', { className: 'empty-state-icon', textContent: '🚫' }),
      el('div', { textContent: 'Audio recording is not supported in this browser. Please use Chrome or Edge.' }),
    ]));
    return { element: container };
  }

  // T080: Audio visualization canvas
  const canvas = el('canvas', { width: 600, height: 80 });
  const ctx = canvas.getContext('2d');

  const timeDisplay = el('div', { className: 'recording-time', textContent: '0:00' });
  const statusText = el('div', { className: 'recording-status', textContent: 'Tap to start recording' });
  const transcriptDisplay = el('div', { className: 'transcript-live', style: { display: 'none', marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem', color: '#475569', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' } });

  // T082: Redesigned record button with inner dot
  const recordDot = el('span', { className: 'record-dot' });
  const recordBtn = el('button', { className: 'record-btn' }, [recordDot]);
  const audioPreview = el('div', { className: 'audio-preview' });

  // T081: Waveform drawing loop
  function drawWaveform() {
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();

    const sliceWidth = w / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    animFrameId = requestAnimationFrame(drawWaveform);
  }

  function clearCanvas() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw idle state on load
  clearCanvas();

  function updateTimer() {
    seconds++;
    timeDisplay.textContent = formatDuration(seconds);
  }

  recordBtn.addEventListener('click', async () => {
    if (recorder && recorder.isActive()) {
      // Stop recording
      clearInterval(timerInterval);
      recordBtn.classList.remove('recording');
      clearCanvas();
      statusText.textContent = 'Processing...';
      recordBtn.disabled = true;

      const result = await recorder.stop();
      savedAudio = result;
      recorder = null;

      // Clean up audio context
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
        analyser = null;
      }

      timeDisplay.textContent = formatDuration(result.durationSecs);
      recordBtn.disabled = false;

      // T052: Audio size guard
      const audioSizeKB = result.audioData.length / 1024;
      const audioSizeMB = audioSizeKB / 1024;
      const SAFE_THRESHOLD_MB = 3;
      if (audioSizeMB > SAFE_THRESHOLD_MB) {
        showToast(
          `Recording is ${audioSizeMB.toFixed(1)}MB — may exceed browser storage limits. Consider a shorter recording.`,
          'error',
          6000
        );
      } else if (audioSizeMB > SAFE_THRESHOLD_MB * 0.7) {
        showToast(
          `Recording is ${audioSizeMB.toFixed(1)}MB — approaching storage limit (~3MB).`,
          'info',
          4000
        );
      }

      // Show final transcript
      if (result.transcript) {
        statusText.textContent = 'Recording saved with transcript. Preview below:';
        transcriptDisplay.textContent = result.transcript;
      } else {
        statusText.textContent = 'Recording saved. No speech detected.';
        transcriptDisplay.textContent = '(No speech detected during recording)';
      }

      // Show audio preview
      audioPreview.innerHTML = '';
      const { audio } = playAudio(result.audioData, result.mimeType);
      audio.pause();
      audio.controls = true;
      previewAudio = audio;
      audioPreview.appendChild(audio);

    } else {
      // Start recording
      try {
        seconds = 0;
        timeDisplay.textContent = '0:00';
        savedAudio = null;
        audioPreview.innerHTML = '';

        recorder = await startRecording({ withTranscription: true });

        // T080: Set up AnalyserNode for visualization
        const stream = recorder.getStream();
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        recordBtn.classList.add('recording');
        statusText.textContent = 'Recording... Tap to stop';
        transcriptDisplay.style.display = '';
        transcriptDisplay.textContent = '(Listening for speech...)';
        recorder.onTranscriptUpdate((text) => {
          transcriptDisplay.textContent = text;
          transcriptDisplay.scrollTop = transcriptDisplay.scrollHeight;
        });
        timerInterval = setInterval(updateTimer, 1000);
        drawWaveform();
      } catch (err) {
        showToast('Microphone access denied. Please allow microphone permissions.', 'error');
        statusText.textContent = 'Microphone access required';
      }
    }
  });

  container.appendChild(canvas);
  container.appendChild(timeDisplay);
  container.appendChild(recordBtn);
  container.appendChild(statusText);
  container.appendChild(transcriptDisplay);
  container.appendChild(audioPreview);

  return {
    element: container,
    getAudio() {
      return savedAudio;
    },
    stop() {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        previewAudio = null;
      }
    },
    reset() {
      if (recorder && recorder.isActive()) {
        recorder.cancel();
        clearInterval(timerInterval);
      }
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
        analyser = null;
      }
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        previewAudio = null;
      }
      clearCanvas();
      recorder = null;
      savedAudio = null;
      seconds = 0;
      timeDisplay.textContent = '0:00';
      statusText.textContent = 'Tap to start recording';
      recordBtn.classList.remove('recording');
      recordBtn.disabled = false;
      audioPreview.innerHTML = '';
      transcriptDisplay.style.display = 'none';
      transcriptDisplay.textContent = '';
    }
  };
}
