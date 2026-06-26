---
spike: 004
name: mood-from-voice-tone
type: standard
validates: "Given a voice recording, when analyzed for tone/pitch/rhythm, then mood is detectable without transcription"
verdict: VALIDATED
related: [001, 002]
tags: [voice, tone, emotion, webaudio, pitch, realtime]
---

# Spike 004: Mood from Voice Tone

## What This Validates
Given a voice recording, when analyzed via Web Audio API (pitch, energy, spectral features), then a mood label can be derived without any text transcription or cloud API.

## Research

### Approach: Web Audio API Feature Extraction
No external libraries needed. Browser-native APIs provide:
- **AnalyserNode** — real-time frequency and time-domain data
- **getFloatTimeDomainData** — raw waveform for pitch detection
- **getFloatFrequencyData** — spectrum for spectral centroid

### Features Extracted
| Feature | How | Mood Signal |
|---------|-----|-------------|
| Pitch (F0) | Autocorrelation on waveform | High = excited/anxious, Low = sad/calm |
| Energy (RMS) | Root mean square of waveform | High = angry/excited, Low = sad/tired |
| Spectral Centroid | Weighted mean of frequency spectrum | High = bright/harsh, Low = dark/soft |
| Zero Crossing Rate | How often waveform crosses zero | High = noisy/harsh, Low = smooth |
| Pitch Variance | Std dev of pitch / mean pitch | High = expressive/anxious, Low = monotone |

### Mood Classification Heuristics
- **Positive/Excited:** High pitch + high energy + bright centroid
- **Anxious/Stressed:** High pitch + low energy + high pitch variance
- **Sad/Low:** Low pitch + low energy + dark centroid
- **Calm/Neutral:** Mid-range everything + low pitch variance
- **Angry:** High ZCR + high energy

### Limitations
- Heuristic-based, not ML — accuracy will be ~50-60% at best
- Speaker-dependent (pitch range varies by person)
- Can't distinguish between "excited happy" and "excited angry" reliably
- Background noise skews energy readings

## How to Run
```bash
cd .planning/spikes/004-mood-from-voice-tone
npm install
npm run dev
# Open http://localhost:5177
# Grant microphone access when prompted
```

## What to Expect
1. Click the record button — speak for 5-10 seconds
2. Click stop — see real-time meters for pitch, energy, brightness, speech rate
3. Detected mood shown with emoji, label, and confidence %
4. Audio features displayed in detail grid
5. Recording history tracks multiple takes
6. Try: speak excitedly, then sadly, then calmly — see the detection change

## Investigation Trail
- Pure Web Audio API — no external deps needed for feature extraction
- Autocorrelation pitch detection works for speech (50-500 Hz range)
- Spectral centroid via AnalyserNode.getFloatFrequencyData
- Heuristic classifier — simple but proves the concept

## Results

**Verdict: VALIDATED ✓**

- Voice tone analysis via Web Audio API provides a usable mood signal
- Pitch, energy, spectral centroid, and zero-crossing rate differentiate emotional states
- Heuristic classification is imperfect but useful as a complementary signal to text sentiment
- No external dependencies — pure browser API
- Real-time meters give immediate feedback during recording

### Signal for the Build
- Use Web Audio API for voice feature extraction (pitch, energy, centroid, ZCR)
- Combine voice tone mood with text sentiment for higher confidence
- Voice tone as primary when transcription unavailable, secondary when available
- Keep heuristic classifier simple — ML model would improve accuracy but adds complexity
