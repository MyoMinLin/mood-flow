// --- Spike 006: Mood Override UI ---

const MOODS = {
  positive: { emoji: '😊', label: 'Positive' },
  content:  { emoji: '🙂', label: 'Content' },
  neutral:  { emoji: '😐', label: 'Neutral' },
  anxious:  { emoji: '😰', label: 'Anxious' },
  negative: { emoji: '😢', label: 'Sad' },
  mixed:    { emoji: '🤔', label: 'Mixed' }
};

// Sample diary entries with AI-detected moods
const entries = [
  { id: 1, date: 'Jun 20', text: 'Had a wonderful morning walk. Felt energized and grateful for the sunshine.', aiMood: 'positive', override: null },
  { id: 2, date: 'Jun 19', text: 'Work was draining. The meeting went fine but I felt empty afterwards.', aiMood: 'neutral', override: null },
  { id: 3, date: 'Jun 18', text: 'Can\'t stop thinking about what she said. It keeps replaying in my head.', aiMood: 'anxious', override: null },
  { id: 4, date: 'Jun 17', text: 'Got a promotion! Best day in months. Celebrated with dinner.', aiMood: 'positive', override: null },
  { id: 5, date: 'Jun 16', text: 'Rainy day, stayed in. Watched movies. Quiet but I felt lonely.', aiMood: 'negative', override: null },
  { id: 6, date: 'Jun 15', text: 'The presentation went well, but I\'m not sure if I\'m proud or just relieved.', aiMood: 'positive', override: null },
  { id: 7, date: 'Jun 14', text: 'Cooked a new recipe. Small wins matter, I guess.', aiMood: 'content', override: null },
  { id: 8, date: 'Jun 13', text: 'Argument with mom. We both said things we didn\'t mean.', aiMood: 'negative', override: null },
];

let activeEntryId = null;

function getDisplayMood(entry) {
  return entry.override || entry.aiMood;
}

function renderStats() {
  const overrides = entries.filter(e => e.override !== null).length;
  const moods = {};
  entries.forEach(e => {
    const m = getDisplayMood(e);
    moods[m] = (moods[m] || 0) + 1;
  });

  document.getElementById('stats').innerHTML = `
    <div class="stat"><div class="val">${entries.length}</div><div class="lbl">Entries</div></div>
    <div class="stat"><div class="val">${overrides}</div><div class="lbl">Overrides</div></div>
    ${Object.entries(moods).map(([m, c]) => `
      <div class="stat"><div class="val">${MOODS[m]?.emoji || '?'}</div><div class="lbl">${MOODS[m]?.label || m}: ${c}</div></div>
    `).join('')}
  `;
}

function renderEntries() {
  const list = document.getElementById('entryList');
  list.innerHTML = entries.map(entry => {
    const mood = getDisplayMood(entry);
    const m = MOODS[mood] || { emoji: '❓', label: mood };
    const isOverridden = entry.override !== null;

    return `
      <div class="entry-card" id="entry-${entry.id}">
        <div class="entry-header">
          <span class="entry-date">${entry.date}</span>
          ${isOverridden ? '<span class="override-badge">overridden</span>' : ''}
        </div>
        <div class="entry-text">${entry.text}</div>
        <div class="mood-section">
          <span class="mood-label">AI detected:</span>
          <div class="mood-display ${entry.aiMood}" style="opacity:0.5">
            <span class="emoji">${MOODS[entry.aiMood]?.emoji}</span>
            <span>${MOODS[entry.aiMood]?.label}</span>
          </div>
          ${isOverridden ? `
            <span class="mood-label" style="margin-left:0.5rem">→</span>
            <span class="mood-label" style="margin-left:0.5rem">Your mood:</span>
            <div class="mood-display ${mood}" onclick="openSelector(${entry.id}, this)" style="position:relative">
              <span class="emoji">${m.emoji}</span>
              <span>${m.label}</span>
            </div>
          ` : `
            <span class="mood-label" style="margin-left:0.5rem">→</span>
            <span class="mood-label" style="margin-left:0.5rem">Your mood:</span>
            <div class="mood-display ${mood}" onclick="openSelector(${entry.id}, this)" style="position:relative">
              <span class="emoji">${m.emoji}</span>
              <span>${m.label}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// --- Override Logic ---
window.openSelector = (entryId, btnEl) => {
  const selector = document.getElementById('moodSelector');
  activeEntryId = entryId;

  // Position near the button
  const rect = btnEl.getBoundingClientRect();
  selector.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  selector.style.left = rect.left + 'px';
  selector.classList.add('open');

  // Highlight current mood
  const entry = entries.find(e => e.id === entryId);
  const current = getDisplayMood(entry);
  selector.querySelectorAll('.mood-option').forEach(opt => {
    const check = opt.querySelector('.check');
    if (check) check.remove();
    if (opt.dataset.mood === current) {
      opt.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
    }
  });
};

window.selectMood = (mood) => {
  const entry = entries.find(e => e.id === activeEntryId);
  if (entry) {
    entry.override = mood;
  }
  document.getElementById('moodSelector').classList.remove('open');
  activeEntryId = null;
  render();
};

window.resetAll = () => {
  entries.forEach(e => e.override = null);
  render();
};

// Close selector on outside click
document.addEventListener('click', (e) => {
  const selector = document.getElementById('moodSelector');
  if (!e.target.closest('.mood-display') && !e.target.closest('.mood-selector')) {
    selector.classList.remove('open');
  }
});

function render() {
  renderEntries();
  renderStats();
}

render();
