// Mood override UI — inline dropdown selector for changing AI-detected mood.
// From spike 006: mood-override-ui.

import { el } from '../utils/dom.js';
import { MOODS, getDisplayMood, getMoodEmoji } from '../services/moods.js';
import { overrideMood } from '../services/diary.js';
import { emit } from '../utils/events.js';

/**
 * Inline mood selector dropdown.
 * From spike 006: openSelector / selectMood pattern.
 *
 * @param {{ entryId: number, currentMood: string, onSelect: (mood: string) => void }} opts
 * @returns {{ element: HTMLElement, refresh: (mood: string) => void }}
 */
export function MoodSelector({ entryId, currentMood, onSelect }) {
  let selectedMood = currentMood;

  const container = el('div', { className: 'mood-selector' });

  const btn = el('button', {
    className: `mood-selector-btn mood-${selectedMood}`,
    innerHTML: `${getMoodEmoji(selectedMood)} ${MOODS[selectedMood]?.label || selectedMood} ▾`,
  });
  container.appendChild(btn);

  const dropdown = el('div', { className: 'mood-dropdown', style: { display: 'none' } });

  for (const [key, { emoji, label }] of Object.entries(MOODS)) {
    const option = el('button', {
      className: `mood-option ${key === selectedMood ? 'active' : ''}`,
      innerHTML: `${emoji} ${label}`,
    });
    option.addEventListener('click', () => {
      selectedMood = key;
      btn.innerHTML = `${emoji} ${label} ▾`;
      dropdown.style.display = 'none';

      // Persist to DB
      overrideMood(entryId, key);
      emit('entries:changed', {});

      if (onSelect) onSelect(key);
    });
    dropdown.appendChild(option);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
  });

  // Close on outside click
  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });

  container.appendChild(dropdown);

  return {
    element: container,
    refresh(mood) {
      selectedMood = mood;
      btn.className = `mood-selector-btn mood-${mood}`;
      btn.innerHTML = `${getMoodEmoji(mood)} ${MOODS[mood]?.label || mood} ▾`;
      // Update active state
      dropdown.querySelectorAll('.mood-option').forEach((opt, i) => {
        const keys = Object.keys(MOODS);
        opt.classList.toggle('active', keys[i] === mood);
      });
    },
  };
}

/**
 * Get the display mood for an entry (user override or AI).
 * Re-exported from moods.js for component convenience.
 */
export { getDisplayMood };
