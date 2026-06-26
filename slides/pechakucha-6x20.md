---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: 'Arial', sans-serif;
  }
  h1 {
    font-size: 2.5em;
    color: #2d3748;
  }
  h2 {
    font-size: 2em;
    color: #4a5568;
  }
  ul {
    font-size: 1.4em;
    line-height: 1.6;
  }
  .lead h1 {
    font-size: 3em;
  }
---

<!-- _class: lead -->

# Mood Flow

**AI-Powered Diary with Mood Tracking**

Personal journaling with voice input and emotional insights

---

## Why Mood Flow?

- Traditional diaries lack emotional awareness
- Voice input enables hands-free journaling
- AI detects mood automatically from text and voice
- Track emotional patterns over time
- Privacy-first: all analysis runs client-side

---

## Key Features

- **Dual Input Modes**: Write or speak your diary entries
- **Voice-to-Text**: Convert voice recordings to text
- **Calendar View**: Browse entries by date
- **AI Mood Detection**: Automatic sentiment analysis
- **Mood Timeline**: Visualize emotional trends
- **Mood Override**: Manually adjust AI-detected moods

---

## Technology Stack

- **Frontend**: Vite + Vanilla JS (ES2022+)
- **Storage**: sql.js (SQLite via WASM) → localStorage
- **Speech**: Web Speech API for voice-to-text
- **AI/ML**:
  - AFINN (instant, offline sentiment)
  - DistilBERT (high-accuracy, async Web Worker)
  - Voice tone analysis (pitch, energy, spectral)
- **Visualization**: Chart.js for mood timeline

---

## AI/ML Implementation Challenges

**Dual-Engine Text Sentiment**:
- AFINN: instant but ~50% accuracy
- DistilBERT: ~95% accuracy, ~50MB model download
- Challenge: async loading without blocking UI
- Solution: Web Worker + AFINN fallback

**Voice Tone Analysis**:
- Extract pitch, energy, spectral features
- Challenge: heuristic classifier accuracy (~50-60%)
- Solution: combine with text sentiment

**Fusion Pipeline**:
- Challenge: conflicting signals between text and voice
- Solution: weighted fusion (70% text, 30% voice)
- Agreement boosts confidence, conflict reduces it

---

<!-- _class: lead -->

# Demo & Questions

**Try it**: https://myominlin.github.io/mood-flow/

github.com/myominlin/mood-flow
