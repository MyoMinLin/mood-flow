# Mood Fusion Pipeline

## Requirements

- Text sentiment is primary mood signal (DistilBERT, ~90% accurate)
- Voice tone is secondary signal for confidence boosting (~50-60% accurate)
- On conflict: text wins, confidence reduced (×0.6), conflict flagged to user
- On agreement: confidence boosted (+10%), signals blended
- No-voice mode: text-only, no penalty

## How to Build It

### Fusion Function

```javascript
function fuseMood(textResult, voiceResult) {
  const textMood = textResult.label === 'POSITIVE' ? 'positive' : 'negative';
  const textConf = Math.round(textResult.score * 100);

  if (!voiceResult) {
    return { mood: textMood, confidence: textConf, source: 'text-only', conflict: false };
  }

  const voiceMood = voiceResult.mood;
  const voiceConf = voiceResult.confidence;

  // Check agreement (including near-matches)
  const agrees = textMood === voiceMood ||
    (textMood === 'positive' && voiceMood === 'neutral') ||
    (textMood === 'negative' && voiceMood === 'anxious');

  if (agrees) {
    const combined = Math.min(100, Math.round((textConf * 0.7 + voiceConf * 0.3) + 10));
    return { mood: textMood, confidence: combined, source: 'fusion', agreement: true, conflict: false };
  }

  // Conflict: text wins, reduce confidence
  return {
    mood: textMood,
    confidence: Math.round(textConf * 0.6),
    source: 'text-override',
    agreement: false,
    conflict: true,
    textMood, voiceMood, textConf, voiceConf
  };
}
```

### Agreement Matrix

| Text | Voice | Fused | Notes |
|------|-------|-------|-------|
| positive | positive | positive | boosted |
| positive | neutral | content | near-match, boosted |
| negative | negative | negative | boosted |
| negative | anxious | negative | near-match, boosted |
| positive | negative | positive | CONFLICT — text wins |
| negative | positive | negative | CONFLICT — text wins |

## What to Avoid

- **Don't let voice override text** — DistilBERT is more reliable than heuristic voice analysis
- **Don't hide conflicts** — show the user when signals disagree (transparency builds trust)
- **Don't skip the no-voice path** — many entries will be text-only, must work without penalty

## Constraints

- Voice tone requires microphone permission
- Voice analysis is heuristic (~50-60% accuracy) — never primary signal
- Fusion runs synchronously (fast) — no async needed after both signals are captured

## Origin

Synthesized from spikes: 005
Source files available in: sources/005-mood-fusion-pipeline/
