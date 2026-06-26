import { el, clear } from '../utils/dom.js';
import { getEntriesByDate } from '../services/diary.js';
import { formatTime, formatDuration } from '../utils/date.js';
import { emit, on } from '../utils/events.js';
import { getDisplayMood, getMoodEmoji } from '../services/moods.js';

export function EntryList({ date, onEntryClick }) {
  const container = el('div', { className: 'entry-list' });

  async function load() {
    clear(container);
    const entries = await getEntriesByDate(date);

    const header = el('div', { className: 'entry-list-header' }, [
      el('h3', { textContent: `Entries for ${date}` }),
    ]);
    container.appendChild(header);

    if (entries.length === 0) {
      container.appendChild(el('div', { className: 'empty-state' }, [
        el('div', { className: 'empty-state-icon', textContent: '📝' }),
        el('div', { textContent: 'No entries for this date' }),
      ]));
      return;
    }

    for (const entry of entries) {
      const isVoice = entry.content_type === 'voice';
      const preview = isVoice
        ? `🎙 Voice • ${formatDuration(entry.duration_secs || 0)}`
        : (entry.text_content || '').substring(0, 80);
      const icon = isVoice ? '🎙' : '✏️';
      const mood = entry.ai_mood ? getDisplayMood(entry) : null;

      const children = [
        el('div', { className: 'entry-item-content' }, [
          el('div', { className: 'entry-item-type', textContent: isVoice ? 'Voice' : 'Text' }),
          el('div', { className: 'entry-item-preview', textContent: preview }),
        ]),
        el('div', { className: 'entry-item-time', textContent: formatTime(entry.created_at) }),
      ];

      if (mood) {
        children.push(el('div', { className: 'entry-item-mood' }, [
          el('span', { className: `mood-badge mood-${mood}`, textContent: `${getMoodEmoji(mood)}` }),
        ]));
      }
      children.push(el('div', { className: 'entry-item-icon', textContent: icon }));

      const item = el('div', { className: 'entry-item', onClick: () => onEntryClick(entry) }, children);
      container.appendChild(item);
    }
  }

  const unsub = on('entries:changed', ({ date: changedDate }) => {
    if (changedDate === date) load();
  });

  load();

  return {
    element: container,
    refresh: load,
    setDate(newDate) {
      date = newDate;
      load();
    },
    destroy() { unsub(); }
  };
}
