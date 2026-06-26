export function isRecordingSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export async function startRecording({ withTranscription = false } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const startTime = Date.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Live transcription via SpeechRecognition (microphone input)
  let recognition = null;
  let liveTranscript = '';
  let onTranscriptUpdate = null;

  if (withTranscription && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        }
      }
      if (finalText) {
        liveTranscript += finalText;
        if (onTranscriptUpdate) onTranscriptUpdate(liveTranscript);
      }
    };

    recognition.onerror = () => {}; // silently ignore errors
    recognition.start();
  }

  recorder.start();

  return {
    stop() {
      return new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (recognition) recognition.stop();
          const blob = new Blob(chunks, { type: mimeType });
          const durationSecs = Math.round((Date.now() - startTime) / 1000);
          blob.arrayBuffer().then(buffer => {
            resolve({
              audioData: new Uint8Array(buffer),
              mimeType,
              durationSecs,
              transcript: liveTranscript.trim() || null
            });
          });
        };
        recorder.stop();
      });
    },
    cancel() {
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());
      if (recognition) recognition.stop();
    },
    isActive() {
      return recorder.state === 'recording';
    },
    getStream() {
      return stream;
    },
    onTranscriptUpdate(cb) {
      onTranscriptUpdate = cb;
    },
    getTranscript() {
      return liveTranscript.trim();
    }
  };
}

export function playAudio(audioData, mimeType) {
  const blob = new Blob([audioData], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  return {
    stop() {
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(url);
    },
    audio
  };
}
