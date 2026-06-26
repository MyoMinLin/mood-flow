import { describe, it, expect } from 'vitest';
import { fuseMood } from '../../../src/services/mood-fusion.js';

describe('mood-fusion', () => {
  describe('fuseMood', () => {
    it('returns text-only result when no voice data', () => {
      const result = fuseMood({ mood: 'positive', confidence: 0.9 }, null);
      expect(result.mood).toBe('positive');
      expect(result.source).toBe('text-only');
      expect(result.agreement).toBeNull();
      expect(result.conflict).toBe(false);
    });

    it('boosts confidence when text and voice agree', () => {
      const result = fuseMood(
        { mood: 'positive', confidence: 0.8 },
        { mood: 'positive', confidence: 70 }
      );
      expect(result.mood).toBe('positive');
      expect(result.source).toBe('fusion');
      expect(result.agreement).toBe(true);
      expect(result.conflict).toBe(false);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('returns positive when text positive + voice neutral (diff=2 conflict)', () => {
      const result = fuseMood(
        { mood: 'positive', confidence: 0.8 },
        { mood: 'neutral', confidence: 60 }
      );
      expect(result.mood).toBe('positive'); // text wins on conflict
      expect(result.conflict).toBe(true);
    });

    it('reduces confidence on conflict', () => {
      const result = fuseMood(
        { mood: 'positive', confidence: 0.9 },
        { mood: 'negative', confidence: 80 }
      );
      expect(result.mood).toBe('positive'); // text wins
      expect(result.source).toBe('text-override');
      expect(result.agreement).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.confidence).toBeLessThan(90);
    });

    it('includes conflict details', () => {
      const result = fuseMood(
        { mood: 'negative', confidence: 0.7 },
        { mood: 'positive', confidence: 65 }
      );
      expect(result.textMood).toBe('negative');
      expect(result.voiceMood).toBe('positive');
      expect(result.textConf).toBe(70);
      expect(result.voiceConf).toBe(65);
    });

    it('handles negative + anxious as adjacent (higher-valence wins)', () => {
      const result = fuseMood(
        { mood: 'negative', confidence: 0.8 },
        { mood: 'anxious', confidence: 70 }
      );
      expect(result.agreement).toBe(true);
      expect(result.mood).toBe('anxious'); // higher valence (-1 > -2)
    });
  });
});
