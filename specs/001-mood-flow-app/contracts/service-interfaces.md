# Service Contracts: Voice Diary App

**Date**: 2026-06-20

## Overview

This app is client-side only with no external API. These contracts define the internal module interfaces that components depend on.

## Database Service (`src/db/database.js`)

```javascript
// Initialize the database (creates tables if needed)
// Returns: void
init()

// Close the database connection
// Returns: void
close()

// Get the raw sql.js Database instance
// Returns: Database
getDb()
```

## Diary Service (`src/services/diary.js`)

```javascript
// Create a new text entry
// Params: { date: string (YYYY-MM-DD), text: string }
// Returns: { id: number, entry_date: string, content_type: 'text', text_content: string, created_at: string }
createTextEntry({ date, text })

// Create a new voice entry
// Params: { date: string (YYYY-MM-DD), audioData: Uint8Array, mimeType: string, durationSecs: number }
// Returns: { id: number, entry_date: string, content_type: 'voice', audio_mime: string, duration_secs: number, created_at: string }
createVoiceEntry({ date, audioData, mimeType, durationSecs })

// Get all entries for a specific date
// Params: date (YYYY-MM-DD string)
// Returns: Array<Entry>
getEntriesByDate(date)

// Get all dates that have entries (for calendar highlighting)
// Params: year (number), month (number, 0-indexed)
// Returns: Array<string> (YYYY-MM-DD dates)
getEntryDatesForMonth(year, month)

// Get a single entry by ID
// Params: id (number)
// Returns: Entry | null
getEntryById(id)

// Update text content of an entry
// Params: id (number), text (string)
// Returns: Entry (updated)
updateTextEntry(id, text)

// Delete an entry
// Params: id (number)
// Returns: void
deleteEntry(id)

// Get audio data for a voice entry (for playback)
// Params: id (number)
// Returns: { audioData: Uint8Array, mimeType: string } | null
getAudioData(id)
```

### Entry Shape

```javascript
{
  id: number,
  entry_date: string,        // YYYY-MM-DD
  content_type: 'text' | 'voice',
  text_content: string | null,
  audio_data: Uint8Array | null,  // only populated via getAudioData()
  audio_mime: string | null,
  duration_secs: number | null,
  created_at: string,        // ISO 8601
  updated_at: string,        // ISO 8601
  transcript: string | null, // live transcription text
  ai_mood: string | null,    // 'positive' | 'content' | 'neutral' | 'anxious' | 'negative' | 'mixed'
  ai_confidence: number | null, // 0.0–1.0
  user_mood: string | null,  // override label (same values as ai_mood)
  voice_mood: string | null, // mood from voice tone analysis
  voice_confidence: number | null // 0.0–1.0
}
```

### Mood Display Priority

The display mood is resolved as: `user_mood` (if set) → `ai_mood` (if set) → `'neutral'` (default).

## Speech Service (`src/services/speech.js`)

```javascript
// Check if Web Speech API is available
// Returns: boolean
isSupported()

// Start speech recognition
// Params: { onResult: (transcript: string, isFinal: boolean) => void, onError: (error: string) => void }
// Returns: { stop: () => void }
startRecognition({ onResult, onError })

// Stop speech recognition
// Params: recognition instance from startRecognition
// Returns: void
stopRecognition(recognition)
```

## Audio Service (`src/services/audio.js`)

```javascript
// Start recording audio
// Returns: Promise<{ stop: () => Promise<{ audioData: Uint8Array, mimeType: string, durationSecs: number }> }>
startRecording()

// Play audio from Uint8Array
// Params: audioData (Uint8Array), mimeType (string)
// Returns: { stop: () => void }
playAudio(audioData, mimeType)

// Check if audio recording is supported
// Returns: boolean
isRecordingSupported()
```

## Sentiment Service (`src/services/sentiment.js`)

```javascript
// Instant AFINN-based sentiment analysis (offline fallback)
// Params: text (string)
// Returns: { mood: string, score: number, engine: 'AFINN', confidence: number }
analyzeAFINN(text)

// Map DistilBERT label + score to canonical mood
// Params: label ('POSITIVE'|'NEGATIVE'), score (0-1)
// Returns: { mood: string, emoji: string }
mapMood(label, score)

// Unified analyze — AFINN instant, then override with transformer if ready
// Params: text (string)
// Returns: Promise<{ mood: string, score: number, engine: string, confidence: number }>
analyze(text)

// Initialize the transformer worker (call once at app startup)
// Returns: void
initSentiment()
```

## Sentiment Worker Client (`src/services/sentiment-worker-client.js`)

```javascript
// Initialize the sentiment Web Worker
// Returns: void
initWorker()

// Send text to worker for analysis
// Params: text (string)
// Returns: Promise<{ label: string, score: number, elapsed: string } | { error: string }>
analyzeText(text)

// Check if transformer model is loaded
// Returns: boolean
isReady()
```

## Voice Tone Service (`src/services/voice-tone.js`)

```javascript
// Autocorrelation-based pitch detection
// Params: buffer (Float32Array), sampleRate (number)
// Returns: number (Hz, 0 if silence)
detectPitch(buffer, sampleRate)

// RMS energy
// Params: buffer (Float32Array)
// Returns: number
computeEnergy(buffer)

// Spectral centroid (brightness)
// Params: analyserNode (AnalyserNode)
// Returns: number (Hz)
computeSpectralCentroid(analyserNode)

// Zero crossing rate
// Params: buffer (Float32Array)
// Returns: number (0-1)
computeZeroCrossingRate(buffer)

// Full heuristic mood classification (5 params)
// Returns: { emoji, label, color, confidence, category }
classifyMood(avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR)

// Simplified voice mood classifier for fusion
// Returns: { mood: string, confidence: number }
classifyVoice(pitch, pitchVar, energy, centroid, zcr)
```

## Mood Fusion Service (`src/services/mood-fusion.js`)

```javascript
// Fuse text sentiment + voice tone into single mood
// Params: textResult ({ label, score }), voiceResult ({ mood, confidence } | null)
// Returns: { mood, confidence, source, agreement, conflict, textMood?, voiceMood?, textConf?, voiceConf? }
fuseMood(textResult, voiceResult)
```

## Moods Constants (`src/services/moods.js`)

```javascript
// Canonical mood labels: positive, content, neutral, anxious, negative, mixed
MOODS // { [key]: { emoji: string, label: string } }

// Get display mood (user_mood > ai_mood > 'neutral')
getDisplayMood(entry) // returns string

// Get emoji for mood label
getMoodEmoji(mood) // returns string

// Get display label for mood label
getMoodLabel(mood) // returns string
```

## Event Bus (`src/utils/events.js`)

```javascript
// Subscribe to an event
// Params: event (string), callback (function)
// Returns: unsubscribe function
on(event, callback)

// Emit an event
// Params: event (string), data (any)
// Returns: void
emit(event, data)
```

### Events

| Event              | Payload                           | Description                        |
|--------------------|-----------------------------------|------------------------------------|
| `entries:changed`  | `{ date: string }`               | Entries modified for a date        |
| `date:selected`    | `{ date: string }`               | User selected a calendar date      |
| `navigate:view`    | `{ view: string, data?: any }`   | Navigate between app views         |
| `month:changed`    | `{ year: number, month: number }`| Calendar month navigated           |
