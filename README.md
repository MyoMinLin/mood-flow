# Moodflow

A privacy-first, offline voice diary with AI-powered mood tracking. All data stays on your device — no server, no account, no tracking.

## Features

- **Text & voice entries** — write or record diary entries with a single toggle
- **Voice-to-text** — transcribe voice recordings via Web Speech API with editable review
- **AI mood detection** — analyzes both text sentiment (DistilBERT) and voice tone (pitch, energy, spectral features), fused into a single mood classification
- **Mood override** — manually adjust AI-detected mood when it doesn't match how you feel
- **Mood timeline** — Chart.js visualization with 7/14/30-day views and distribution stats
- **Calendar home** — month grid showing which dates have entries, tap to browse
- **Dark theme** — responsive design for mobile, tablet, and desktop
- **Fully offline** — all AI runs client-side in a Web Worker; data stored in SQLite (WASM) persisted to localStorage. Nothing leaves your device

## Tech Stack

| Layer | Technology |
|---|---|
| Build | Vite (ES2022 target) |
| Runtime | Vanilla JS (no framework) |
| Storage | sql.js (SQLite WASM) + localStorage |
| AI/NLP | @huggingface/transformers (DistilBERT) + sentiment (AFINN fallback) |
| Charts | Chart.js + date-fns adapter |
| Voice | Web Speech API, MediaRecorder API, AudioContext |
| Testing | Vitest |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 6001)
npm run dev

# Run tests
npm test

# Production build
npm run build
```

## How to Use

### Writing a Text Entry

1. Open the app in your browser at `http://localhost:6001`
2. The home page shows a **calendar view** — tap any date to see existing entries or create a new one
3. Tap the **+** button (or the selected date) to open the entry editor
4. Type your diary entry in the text area
5. Toggle the input mode to **text** (default) using the toggle button
6. Hit **Save** — the AI automatically analyzes your text and assigns a mood (positive, content, neutral, anxious, negative, or mixed)

### Recording a Voice Entry

1. Open the entry editor and toggle the input mode to **voice**
2. Tap the **record** button and start speaking — the Web Speech API transcribes your words in real-time
3. Tap **stop** when done — you'll see the transcription where you can review and edit any mistakes
4. Hit **Save** — the AI analyzes both your text sentiment and voice tone (pitch, energy) to classify your mood

### Overriding the AI Mood

- After saving, the detected mood appears as a badge on the entry (e.g., 😊 positive)
- If it doesn't match how you feel, tap the mood badge to open the **override selector** and pick a different mood manually

### Viewing Your Mood Timeline

1. Navigate to the **mood chart** from the menu
2. Choose a time range: **7**, **14**, or **30 days**
3. See your mood trend plotted over time, plus a distribution breakdown showing how often each mood appears

### Browsing Past Entries

- On the **calendar view**, dates with entries are highlighted — tap a date to see its entries
- Each entry in the list shows a mood indicator, a text preview, and the timestamp
- Tap an entry to open the full viewer where you can read, edit, or delete it

### Key Things to Know

- **Everything is offline** — no account needed, no data leaves your device
- **Voice transcription** requires a browser with Web Speech API support (Chrome works best)
- The **DistilBERT** AI model (~50MB) downloads from HuggingFace on first use and is cached by your browser
- All data is stored in your browser's localStorage — clearing browser data will erase your diary

## Project Structure

```
src/
  main.js                    # App bootstrap, router, mood chart init
  db/database.js             # SQLite schema, migrations, query helper
  components/                # UI components (calendar, editor, recorder, chart)
  services/                  # Business logic (diary CRUD, sentiment, mood fusion, speech)
  workers/sentiment.worker.js # DistilBERT inference in Web Worker
  utils/                     # DOM helpers, date formatting, event bus
  styles/main.css            # Global styles, dark theme, mood colors
public/
  sql-wasm.wasm              # sql.js WASM binary
tests/
  unit/                      # Database, services, utils tests
  integration/               # Entry lifecycle (create → list → view → edit → delete)
```

## How Mood Analysis Works

1. **Text sentiment** — AFINN gives instant score; DistilBERT refines in a Web Worker. Text signal is primary.
2. **Voice tone** — Audio features (pitch, energy, spectral centroid, zero-crossing rate) classify mood from recording characteristics.
3. **Fusion** — Both signals merge with conflict detection and confidence scoring into one of: positive, content, neutral, anxious, negative, mixed.
4. **Override** — User can always override with a manual mood selector.

All analysis runs locally. No data is sent to any server.

## Browser Support

Chrome, Firefox, Safari, Edge (modern versions). Requires Web Speech API and MediaRecorder API for voice features.

## License

Private
