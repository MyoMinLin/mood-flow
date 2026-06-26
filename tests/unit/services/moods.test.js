import { describe, it, expect } from 'vitest';
import { MOODS, getDisplayMood, getMoodEmoji, getMoodLabel } from '../../../src/services/moods.js';

describe('moods constants', () => {
  describe('MOODS', () => {
    it('defines all 6 mood categories', () => {
      expect(Object.keys(MOODS)).toEqual(
        expect.arrayContaining(['positive', 'content', 'neutral', 'anxious', 'negative', 'mixed'])
      );
    });

    it('each mood has emoji and label', () => {
      for (const mood of Object.values(MOODS)) {
        expect(mood).toHaveProperty('emoji');
        expect(mood).toHaveProperty('label');
      }
    });
  });

  describe('getDisplayMood', () => {
    it('returns user_mood when set', () => {
      expect(getDisplayMood({ user_mood: 'positive', ai_mood: 'neutral' })).toBe('positive');
    });

    it('returns ai_mood when no user_mood', () => {
      expect(getDisplayMood({ user_mood: null, ai_mood: 'anxious' })).toBe('anxious');
    });

    it('returns neutral as default', () => {
      expect(getDisplayMood({ user_mood: null, ai_mood: null })).toBe('neutral');
    });
  });

  describe('getMoodEmoji', () => {
    it('returns emoji for known mood', () => {
      expect(getMoodEmoji('positive')).toBe('😊');
      expect(getMoodEmoji('neutral')).toBe('😐');
    });

    it('returns fallback emoji for unknown mood', () => {
      expect(getMoodEmoji('unknown')).toBe('❓');
    });
  });

  describe('getMoodLabel', () => {
    it('returns label for known mood', () => {
      expect(getMoodLabel('positive')).toBe('Positive');
      expect(getMoodLabel('neutral')).toBe('Neutral');
    });

    it('returns the input string for unknown mood', () => {
      expect(getMoodLabel('unknown')).toBe('unknown');
    });
  });
});
