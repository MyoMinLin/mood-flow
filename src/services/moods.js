// Canonical mood labels — used across fusion, override, chart, and persistence.
// Derived from spike 006 mood-override-ui.

export const MOODS = {
  positive:  { emoji: '😊', label: 'Positive' },
  content:   { emoji: '🙂', label: 'Content' },
  neutral:   { emoji: '😐', label: 'Neutral' },
  anxious:   { emoji: '😰', label: 'Anxious' },
  negative:  { emoji: '😢', label: 'Negative' },
  mixed:     { emoji: '😕', label: 'Mixed' },
};

/**
 * Get display mood for an entry — user override takes priority over AI mood.
 * From spike 006: getDisplayMood(entry).
 */
export function getDisplayMood(entry) {
  if (entry.user_mood) return entry.user_mood;
  if (entry.ai_mood) return entry.ai_mood;
  return 'neutral';
}

/**
 * Get emoji for a mood label.
 */
export function getMoodEmoji(mood) {
  return MOODS[mood]?.emoji || '❓';
}

/**
 * Get display label for a mood label.
 */
export function getMoodLabel(mood) {
  return MOODS[mood]?.label || mood;
}
