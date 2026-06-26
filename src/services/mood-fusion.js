// Mood fusion pipeline — combines text sentiment + voice tone signals.
// Refactored to accept full 5-mood input instead of binary POSITIVE/NEGATIVE.
// Text is primary, voice is secondary/confidence booster.
// On conflict: text wins, confidence reduced, conflict flagged.

// Valence ordering for proximity checks (positive=2 ... negative=-2)
const VALENCE = { positive: 2, content: 1, neutral: 0, anxious: -1, negative: -2 };

/**
 * Fuse text sentiment and voice tone into a single mood result.
 * Accepts full 5-mood granularity from both signals.
 *
 * @param {{ mood: string, confidence: number }} textResult - From analyze() — one of 5 canonical moods
 * @param {{ mood: string, confidence: number }} voiceResult - From classifyVoice() — one of 4 voice moods
 * @returns {{
 *   mood: string, confidence: number, source: string,
 *   agreement: boolean|null, conflict: boolean,
 *   textMood?: string, voiceMood?: string, textConf?: number, voiceConf?: number
 * }}
 */
export function fuseMood(textResult, voiceResult) {
  const textMood = textResult.mood;
  const textConf = Math.round(textResult.confidence * 100);

  if (!voiceResult) {
    // No voice data — text only
    return {
      mood: textMood,
      confidence: textConf,
      source: 'text-only',
      agreement: null,
      conflict: false,
    };
  }

  const voiceConf = voiceResult.confidence;
  const voiceMood = voiceResult.mood;

  // Check agreement via valence proximity
  const textV = VALENCE[textMood] ?? 0;
  const voiceV = VALENCE[voiceMood] ?? 0;
  const diff = Math.abs(textV - voiceV);

  if (diff === 0) {
    // Exact match — boost confidence
    const combined = Math.min(100, Math.round((textConf * 0.7 + voiceConf * 0.3) + 10));
    return {
      mood: textMood,
      confidence: combined,
      source: 'fusion',
      agreement: true,
      conflict: false,
    };
  }

  if (diff === 1) {
    // Adjacent moods — weighted blend, slight confidence reduction
    // Use the higher-valence mood (more positive) but cap confidence
    const blendedMood = textV > voiceV ? textMood : voiceMood;
    const combined = Math.round(textConf * 0.7 + voiceConf * 0.3);
    return {
      mood: blendedMood,
      confidence: Math.min(100, combined),
      source: 'fusion',
      agreement: true,
      conflict: false,
    };
  }

  // diff >= 2: conflict — text wins, confidence reduced
  const confidenceMultiplier = diff >= 3 ? 0.5 : 0.65;
  return {
    mood: textMood,
    confidence: Math.round(textConf * confidenceMultiplier),
    source: 'text-override',
    agreement: false,
    conflict: true,
    textMood,
    voiceMood,
    textConf,
    voiceConf,
  };
}
