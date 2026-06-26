# Quickstart: Voice Diary App

**Date**: 2026-06-20
**Feature**: Voice Diary App

## Prerequisites

- Node.js >= 18
- npm >= 9
- Modern browser (Chrome/Edge recommended for full voice support)

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app opens at `http://localhost:5173` by default.

## Validation Scenarios

### V1: Create a Written Entry

1. Open the app in browser
2. Click "New Entry" button
3. Ensure "Write" mode is selected
4. Type a diary entry (e.g., "Today was a good day")
5. Click "Save"
6. **Expected**: Entry appears on the calendar for today's date; entry count badge shows on today

### V2: Create a Voice Entry

1. Click "New Entry"
2. Switch to "Voice" mode
3. Click the record button (microphone icon)
4. Speak for 10-30 seconds
5. Click stop
6. **Expected**: Audio waveform/visual feedback during recording; entry saved with play button

### V3: Convert Voice to Text

1. Open a voice entry from the calendar
2. Click "Convert to Text"
3. **Expected**: Transcription appears in an editable text area
4. Edit the text if needed
5. Click "Save as Text"
6. **Expected**: New text entry created for the same date; original voice entry preserved

### V4: Calendar Navigation

1. Create entries on 3 different dates
2. Navigate to previous month using arrow buttons
3. Navigate back to current month
4. Click a date with entries
5. **Expected**: Entry list appears below calendar; dates with entries are visually marked (dot/badge)

### V5: Edit and Delete

1. Open a text entry
2. Modify the content
3. Click "Save"
4. **Expected**: Changes persist after page refresh
5. Open the same entry and click "Delete"
6. **Expected**: Entry removed from calendar

### V6: Responsive Layout

1. Resize browser window to mobile width (< 375px)
2. **Expected**: Calendar adapts to compact layout; buttons are touch-friendly
3. Resize to tablet width (768px)
4. **Expected**: Calendar shows full grid with comfortable spacing

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Output is in `dist/` — can be deployed to any static host (Netlify, Vercel, GitHub Pages).
