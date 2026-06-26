import './styles/main.css';
import { init } from './db/database.js';
import { Calendar } from './components/calendar.js';
import { EntryList } from './components/entry-list.js';
import { EntryEditor } from './components/entry-editor.js';
import { EntryViewer } from './components/entry-viewer.js';
import { MoodChart } from './components/mood-chart.js';
import { SettingsPanel } from './components/settings-panel.js';
import { el, clear, showToast } from './utils/dom.js';
import { on, emit } from './utils/events.js';
import { today } from './utils/date.js';
import { initSentiment } from './services/sentiment.js';

let currentOverlay = null;

function closeOverlay() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
}

function openEditor(date, mode = null) {
  closeOverlay();
  const editor = EntryEditor({
    date,
    mode,
    onClose: closeOverlay
  });
  currentOverlay = editor.element;
  document.body.appendChild(currentOverlay);
}

function openViewer(entry) {
  closeOverlay();
  const viewer = EntryViewer({
    entry,
    onClose: closeOverlay
  });
  currentOverlay = viewer.element;
  document.body.appendChild(currentOverlay);
}

async function boot() {
  try {
    await init();
  } catch (err) {
    showToast('Failed to initialize database: ' + err.message, 'error');
    return;
  }

  // Start loading the sentiment transformer model in background
  initSentiment();

  const app = document.getElementById('app');
  clear(app);

  // Settings panel
  const settings = SettingsPanel();

  // Header with two distinct entry-point buttons
  const header = el('div', { className: 'header', style: { position: 'relative' } }, [
    el('h1', { textContent: '📔 Moodflow' }),
    el('div', { className: 'header-actions' }, [
      settings.button,
      el('button', {
        className: 'btn btn-primary',
        textContent: '✏️ Write',
        onClick: () => openEditor(calendar.getSelectedDate(), 'write')
      }),
      el('button', {
        className: 'btn btn-voice',
        textContent: '🎙 Record',
        onClick: () => openEditor(calendar.getSelectedDate(), 'voice')
      }),
    ]),
    settings.panel,
  ]);
  app.appendChild(header);

  // Calendar
  const calendar = Calendar();
  app.appendChild(calendar.element);

  // Mood chart
  const moodChart = MoodChart({ days: 30, onEntryClick: (entry) => openViewer(entry) });
  app.appendChild(moodChart.element);

  // Entry list
  let entryList = EntryList({
    date: today(),
    onEntryClick: (entry) => openViewer(entry)
  });
  app.appendChild(entryList.element);

  // When a date is selected, refresh the entry list
  on('date:selected', ({ date }) => {
    entryList.destroy();
    entryList.element.remove();
    entryList = EntryList({
      date,
      onEntryClick: (entry) => openViewer(entry)
    });
    app.appendChild(entryList.element);
  });

  // When entries change, refresh calendar
  on('entries:changed', () => {
    calendar.refresh();
  });
}

boot();
