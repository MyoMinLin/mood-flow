import { el } from '../utils/dom.js';
import { getEntryById, getAudioData, updateTextEntry, deleteEntry, createTextEntry } from '../services/diary.js';
import { playAudio } from '../services/audio.js';
import { transcribe as whisperTranscribe } from '../services/transcription.js';
import { formatTime, formatDuration } from '../utils/date.js';
import { emit } from '../utils/events.js';
import { showToast } from '../utils/dom.js';
import { MoodSelector, getDisplayMood } from './mood-override.js';
import { getMoodEmoji, getMoodLabel } from '../services/moods.js';

// T085: Derive approximate voice feature bars from mood category + confidence
function getVoiceFeatureBars(voiceMood, voiceConfidence) {
  const conf = (voiceConfidence || 0.5) * 100;
  // Approximate feature positions by mood category
  const presets = {
    positive: { pitch: 75, energy: 80, brightness: 70, zcr: 60 },
    anxious:  { pitch: 80, energy: 35, brightness: 55, zcr: 70 },
    negative: { pitch: 30, energy: 25, brightness: 25, zcr: 35 },
    neutral:  { pitch: 50, energy: 45, brightness: 45, zcr: 45 },
    content:  { pitch: 55, energy: 55, brightness: 50, zcr: 45 },
    mixed:    { pitch: 60, energy: 50, brightness: 55, zcr: 55 },
  };
  const p = presets[voiceMood] || presets.neutral;
  return [
    { label: 'Pitch', value: Math.round(p.pitch * conf / 100), color: '#60a5fa' },
    { label: 'Energy', value: Math.round(p.energy * conf / 100), color: '#22c55e' },
    { label: 'Brightness', value: Math.round(p.brightness * conf / 100), color: '#f97316' },
    { label: 'ZCR', value: Math.round(p.zcr * conf / 100), color: '#a78bfa' },
  ];
}

// T087: Build fusion summary card
function buildFusionCard(entry) {
  if (!entry.ai_mood || !entry.voice_mood) return null;

  const textMood = entry.ai_mood;
  const voiceMood = entry.voice_mood;
  // Valence proximity check — same logic as mood-fusion.js
  const VALENCE = { positive: 2, content: 1, neutral: 0, anxious: -1, negative: -2 };
  const diff = Math.abs((VALENCE[textMood] ?? 0) - (VALENCE[voiceMood] ?? 0));
  const agrees = diff <= 1;

  const card = el('div', { className: 'fusion-card' }, [
    el('h4', { textContent: '🧠 Mood Fusion' }),
  ]);

  const sources = el('div', { className: 'fusion-sources' });
  sources.appendChild(el('div', { className: 'fusion-source' }, [
    el('div', { className: 'fusion-source-label', textContent: 'Text' }),
    el('div', { textContent: `${getMoodEmoji(textMood)} ${getMoodLabel(textMood)}` }),
    el('div', { style: { fontSize: '0.75rem', color: '#888' }, textContent: `${Math.round((entry.ai_confidence || 0) * 100)}%` }),
  ]));
  sources.appendChild(el('div', { className: 'fusion-source' }, [
    el('div', { className: 'fusion-source-label', textContent: 'Voice' }),
    el('div', { textContent: `${getMoodEmoji(voiceMood)} ${getMoodLabel(voiceMood)}` }),
    el('div', { style: { fontSize: '0.75rem', color: '#888' }, textContent: `${Math.round((entry.voice_confidence || 0) * 100)}%` }),
  ]));
  card.appendChild(sources);

  if (agrees) {
    card.appendChild(el('div', { className: 'agree-box', textContent: '✓ Signals agree — confidence boosted' }));
  } else {
    card.appendChild(el('div', { className: 'conflict-box', textContent: '⚠ Signals conflict — text takes priority' }));
  }

  return card;
}

export function EntryViewer({ entry: initialEntry, onClose }) {
  let entry = initialEntry;
  let isEditing = false;
  let currentAudio = null;
  let transcribeState = null; // { statusEl } when transcribing

  const panel = el('div', { className: 'editor-panel' });
  const cleanup = () => { stopAll(); onClose(); };

  function stopAll() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (transcribeState) {
      transcribeState = null;
    }
  }

  function render() {
    panel.innerHTML = '';
    stopAll();
    const isVoice = entry.content_type === 'voice';

    // Header
    const header = el('div', { className: 'editor-header' }, [
      el('h2', { textContent: isVoice ? '🎙 Voice Entry' : '✏️ Text Entry' }),
      el('button', { className: 'btn btn-ghost', textContent: '✕', onClick: () => { cleanup(); } }),
    ]);
    panel.appendChild(header);

    // Body
    const body = el('div', { className: 'editor-body' });
    panel.appendChild(body);

    // Meta
    body.appendChild(el('div', { className: 'view-meta', textContent: `${entry.entry_date} at ${formatTime(entry.created_at)}` }));

    // Mood display with override selector
    if (entry.ai_mood) {
      const moodSection = el('div', { className: 'mood-section', style: { margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } });
      const displayMood = getDisplayMood(entry);
      const moodBadge = el('span', {
        className: `mood-badge mood-${displayMood}`,
        innerHTML: `${getMoodEmoji(displayMood)} ${getMoodLabel(displayMood)}`,
      });
      moodSection.appendChild(moodBadge);

      if (entry.ai_confidence) {
        moodSection.appendChild(el('span', {
          className: 'mood-confidence',
          textContent: `${Math.round(entry.ai_confidence * 100)}% confidence`,
          style: { color: '#94a3b8', fontSize: '0.85rem' },
        }));
      }

      // T084: Override badge when user_mood differs from ai_mood
      if (entry.user_mood && entry.user_mood !== entry.ai_mood) {
        moodSection.appendChild(el('span', {
          className: 'override-badge',
          textContent: 'overridden',
        }));
      }

      // Override selector
      const selector = MoodSelector({
        entryId: entry.id,
        currentMood: displayMood,
        onSelect: (mood) => {
          entry = getEntryById(entry.id);
          render();
        },
      });
      moodSection.appendChild(selector.element);

      body.appendChild(moodSection);
    }

    if (isVoice) {
      // Audio playback
      const audioData = getAudioData(entry.id);
      if (audioData) {
        const { audio } = playAudio(audioData.audioData, audioData.mimeType);
        audio.pause();
        audio.controls = true;
        currentAudio = audio;
        body.appendChild(audio);
        if (entry.duration_secs) {
          body.appendChild(el('div', { className: 'view-meta', textContent: `Duration: ${formatDuration(entry.duration_secs)}` }));
        }
      }

      // T085: Voice feature meters
      if (entry.voice_mood && entry.voice_confidence) {
        const meterContainer = el('div', { className: 'meter-container' });
        const bars = getVoiceFeatureBars(entry.voice_mood, entry.voice_confidence);
        for (const bar of bars) {
          const row = el('div', { className: 'meter-row' }, [
            el('span', { className: 'meter-label', textContent: bar.label }),
            el('div', { className: 'meter-bar' }, [
              el('div', { className: 'meter-fill', style: { width: `${bar.value}%`, background: bar.color } }),
            ]),
            el('span', { className: 'meter-value', textContent: `${bar.value}%` }),
          ]);
          meterContainer.appendChild(row);
        }
        body.appendChild(meterContainer);
      }

      // T087: Fusion result display
      const fusionCard = buildFusionCard(entry);
      if (fusionCard) {
        body.appendChild(fusionCard);
      }

      // Show transcript if available (T050: editable textarea)
      if (entry.transcript) {
        body.appendChild(el('div', { className: 'view-meta', textContent: 'Transcript:', style: { marginTop: '16px', fontWeight: '600' } }));
        const textarea = el('textarea', {
          value: entry.transcript,
          style: { width: '100%', minHeight: '100px', marginTop: '8px' }
        });
        textarea.value = entry.transcript;
        body.appendChild(textarea);

        // T051: Cancel button + Save as text entry
        const actionRow = el('div', { className: 'editor-footer', style: { marginTop: '12px' } });

        const saveTextBtn = el('button', {
          className: 'btn btn-primary',
          textContent: 'Save as Text Entry',
        });
        saveTextBtn.addEventListener('click', () => {
          const text = textarea.value.trim();
          if (!text) {
            showToast('Transcript cannot be empty.', 'error');
            return;
          }
          createTextEntry({ date: entry.entry_date, text });
          emit('entries:changed', { date: entry.entry_date });
          showToast('Text entry created from transcript!', 'success');
          cleanup();
        });

        const cancelBtn = el('button', {
          className: 'btn btn-ghost',
          textContent: 'Cancel',
          onClick: () => { cleanup(); }
        });

        actionRow.appendChild(cancelBtn);
        actionRow.appendChild(saveTextBtn);
        body.appendChild(actionRow);
      }

      // T049: Convert to text button for entries without transcript
      if (!entry.transcript && audioData) {
        body.appendChild(el('div', {
          className: 'view-meta',
          textContent: 'No transcript available. This voice entry was recorded without live transcription.',
          style: { marginTop: '16px' }
        }));

        const transcribeBtn = el('button', {
          className: 'btn btn-primary',
          textContent: '🔊 Convert to Text',
          style: { marginTop: '12px' }
        });

        const statusEl = el('div', {
          className: 'status-bar',
          textContent: '',
          style: { marginTop: '8px', display: 'none' }
        });

        transcribeBtn.addEventListener('click', async () => {
          transcribeBtn.disabled = true;
          transcribeBtn.textContent = 'Transcribing...';
          statusEl.style.display = '';
          statusEl.className = 'status-bar loading';
          statusEl.innerHTML = '<span class="loader"></span> Transcribing audio with Whisper — first time may download model...';

          transcribeState = { statusEl };

          const result = await whisperTranscribe(audioData.audioData);

          transcribeState = null;

          if (result.error) {
            statusEl.className = 'status-bar';
            statusEl.innerHTML = 'Transcription error: ' + result.error;
            transcribeBtn.disabled = false;
            transcribeBtn.textContent = '🔊 Convert to Text';
            showToast('Transcription failed: ' + result.error, 'error');
            return;
          }

          const finalText = result.text.trim();
          if (finalText) {
            statusEl.className = 'status-bar ready';
            statusEl.innerHTML = `✓ Transcription complete (${result.elapsed}ms). Edit below and save:`;
            const textarea = el('textarea', {
              value: finalText,
              style: { width: '100%', minHeight: '100px', marginTop: '8px' }
            });
            textarea.value = finalText;
            body.appendChild(textarea);

            const actionRow = el('div', { className: 'editor-footer', style: { marginTop: '12px' } });

            const saveBtn = el('button', {
              className: 'btn btn-primary',
              textContent: 'Save as Text Entry',
            });
            saveBtn.addEventListener('click', () => {
              const text = textarea.value.trim();
              if (!text) {
                showToast('Transcript cannot be empty.', 'error');
                return;
              }
              createTextEntry({ date: entry.entry_date, text });
              emit('entries:changed', { date: entry.entry_date });
              showToast('Text entry created from transcript!', 'success');
              cleanup();
            });

            const cancelBtn = el('button', {
              className: 'btn btn-ghost',
              textContent: 'Cancel',
              onClick: () => { cleanup(); }
            });

            actionRow.appendChild(cancelBtn);
            actionRow.appendChild(saveBtn);
            body.appendChild(actionRow);

            transcribeBtn.style.display = 'none';
          } else {
            statusEl.className = 'status-bar';
            statusEl.innerHTML = 'No speech detected. Try again or type manually.';
            transcribeBtn.disabled = false;
            transcribeBtn.textContent = '🔊 Convert to Text';
          }
        });

        body.appendChild(transcribeBtn);
        body.appendChild(statusEl);
      }
    } else {
      // Text content
      if (isEditing) {
        const textarea = el('textarea', { value: entry.text_content || '' });
        textarea.value = entry.text_content || '';
        body.appendChild(textarea);

        const saveBtn = el('button', {
          className: 'btn btn-primary',
          textContent: 'Save Changes',
          style: { marginTop: '12px' }
        });
        saveBtn.addEventListener('click', () => {
          const newText = textarea.value.trim();
          if (!newText) {
            showToast('Entry cannot be empty.', 'error');
            return;
          }
          updateTextEntry(entry.id, newText);
          entry = getEntryById(entry.id);
          isEditing = false;
          emit('entries:changed', { date: entry.entry_date });
          showToast('Entry updated!', 'success');
          render();
        });
        body.appendChild(saveBtn);
      } else {
        body.appendChild(el('div', { className: 'view-content', textContent: entry.text_content || '' }));
      }
    }

    // Footer
    const footer = el('div', { className: 'editor-footer' });

    if (!isVoice && !isEditing) {
      footer.appendChild(el('button', {
        className: 'btn btn-ghost',
        textContent: 'Edit',
        onClick: () => { isEditing = true; render(); }
      }));
    }

    footer.appendChild(el('button', {
      className: 'btn btn-danger',
      textContent: 'Delete',
      onClick: () => {
        if (confirm('Delete this entry? This cannot be undone.')) {
          const date = entry.entry_date;
          deleteEntry(entry.id);
          emit('entries:changed', { date });
          showToast('Entry deleted.', 'info');
          cleanup();
        }
      }
    }));

    panel.appendChild(footer);
  }

  render();

  // Overlay
  const overlay = el('div', { className: 'editor-overlay', onClick: (e) => { if (e.target === overlay) cleanup(); } }, [panel]);

  return { element: overlay };
}
