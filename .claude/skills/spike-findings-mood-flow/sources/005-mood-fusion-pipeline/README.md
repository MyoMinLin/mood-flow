---
spike: 005
name: mood-fusion-pipeline
type: standard
validates: "Given conflicting mood signals (text vs voice), when combined, then a single mood is derived with clear priority rules"
verdict: VALIDATED
related: [001, 002, 004]
tags: [fusion, integration, mood, text, voice]
---

# Spike 005: Mood Fusion Pipeline

## What This Validates
Given mood signals from text sentiment and voice tone, when they disagree, then a single mood is derived with clear priority rules and visible conflict reporting.

## Research

### Fusion Strategy
- **Text sentiment (DistilBERT)**: ~90% accurate → primary signal
- **Voice tone (Web Audio heuristics)**: ~50-60% accurate → secondary/confidence booster
- **Agreement**: Both signals match → boost confidence (+10%)
- **Disagree**: Text wins, but confidence is reduced (×0.6) and conflict is flagged
- **No voice**: Text-only mode, no penalty

### Mood Mapping
| Text | Voice | Fused Result |
|------|-------|-------------|
| positive | positive | positive (boosted) |
| positive | neutral | content (boosted) |
| negative | negative | negative (boosted) |
| negative | anxious | negative (boosted) |
| positive | negative | positive (reduced conf, conflict flagged) |
| negative | positive | negative (reduced conf, conflict flagged) |

## How to Run
```bash
cd .planning/spikes/005-mood-fusion-pipeline
npm install
npm run dev
# Open http://localhost:5178
```

## What to Expect
1. Type a diary entry (text sentiment)
2. Optionally record voice (voice tone)
3. Click "Fuse Moods" — see both signals + fused result
4. Conflict cases show orange warning box explaining the disagreement
5. Agreement cases show green confirmation box

## Investigation Trail
- Built: End-to-end fusion pipeline combining spikes 001+002+004
- Text wins on conflict because DistilBERT is more reliable
- Confidence reduction on conflict prevents overconfident wrong labels

## Results

**Verdict: VALIDATED ✓**

- Fusion logic works: text is primary, voice is secondary/confidence booster
- Agreement boosts confidence, disagreement reduces it and flags the conflict
- Text wins on conflict — correct given DistilBERT's higher accuracy
- No-voice mode works (text-only, no penalty)
- Conflict visualization (orange box) makes the decision transparent

### Signal for the Build
- Text sentiment = primary mood signal
- Voice tone = secondary signal for confidence boosting
- On conflict: text wins, reduce confidence, show conflict to user
- On agreement: boost confidence, blend the signals
