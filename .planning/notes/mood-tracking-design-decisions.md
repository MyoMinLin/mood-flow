---
title: "Mood Tracking Design Decisions"
date: 2026-06-20
context: "Exploration session on expanding VoiceDiary beyond basic capture"
---

# Mood Tracking Design Decisions

## Product Direction

VoiceDiary is evolving from a capture tool into an **AI-aware emotional journal**. The core differentiator remains speed & ease of capture (voice-first), but the AI layer makes entries *useful* beyond just being a record.

## Decisions

### 1. Hybrid Mood Detection
- AI detects mood from voice entries automatically (no extra user effort)
- User can override/correct the AI's assessment
- Both AI-detected and user-confirmed mood are stored
- Rationale: respects user agency, improves accuracy over time

### 2. Hybrid Processing Architecture
- Voice recordings stay on device (privacy-first)
- Web Speech API transcribes locally (already implemented)
- Only transcribed text is sent to a cloud API for mood/sentiment analysis
- Rationale: voice data never leaves the device; text analysis is cheaper and faster

### 3. Full Mood Visualization
Three layers of mood experience:
- **Per-entry mood label** — each entry shows its mood tag (emoji + descriptor)
- **Mood timeline/chart** — visual trend of emotional patterns over weeks/months
- **Weekly mood insights** — AI-generated summaries ("you've been stressed 3 days in a row, here's why")

### 4. Target Audience
Building for **public users**, not just personal use. This means:
- Onboarding must explain mood tracking value
- Privacy messaging is critical (voice stays local)
- Insights must feel valuable enough to retain users

## Technical Implications
- Data model needs new fields: mood_label, mood_confidence, mood_source (ai/user), mood_timestamp
- Cloud API dependency introduced (sentiment analysis)
- New UI components: mood badge, mood chart, insights panel
- Potential dependency: chart library (Chart.js, D3, or lightweight alternative)

## Out of Scope (for now)
- Mood-based search ("show entries when I was happy") — planted as a seed
- Multi-user / social features
- Rich text formatting
