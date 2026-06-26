import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the worker client module
vi.mock('../../../src/services/sentiment-worker-client.js', () => ({
  initWorker: vi.fn(),
  analyzeText: vi.fn(),
  isReady: vi.fn(() => false),
}));

import { analyzeAFINN, mapMood, analyze } from '../../../src/services/sentiment.js';

describe('sentiment', () => {
  describe('analyzeAFINN', () => {
    it('returns positive mood for positive text', () => {
      const result = analyzeAFINN('I love this amazing wonderful day');
      expect(result.mood).toBe('positive');
      expect(result.engine).toBe('AFINN');
      expect(result.score).toBeGreaterThan(0);
    });

    it('returns negative mood for negative text', () => {
      const result = analyzeAFINN('This is terrible horrible awful');
      expect(result.mood).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });

    it('returns neutral for neutral text', () => {
      const result = analyzeAFINN('The table is made of wood');
      expect(result.mood).toBe('neutral');
    });

    it('returns confidence as number', () => {
      const result = analyzeAFINN('happy');
      expect(typeof result.confidence).toBe('number');
    });
  });

  describe('mapMood', () => {
    it('maps POSITIVE with high score to positive', () => {
      const result = mapMood('POSITIVE', 0.9);
      expect(result.mood).toBe('positive');
    });

    it('maps POSITIVE with lower score to content', () => {
      const result = mapMood('POSITIVE', 0.6);
      expect(result.mood).toBe('content');
    });

    it('maps NEGATIVE with high score to negative', () => {
      const result = mapMood('NEGATIVE', 0.9);
      expect(result.mood).toBe('negative');
    });

    it('maps NEGATIVE with lower score to anxious', () => {
      const result = mapMood('NEGATIVE', 0.5);
      expect(result.mood).toBe('anxious');
    });
  });

  describe('analyze', () => {
    it('uses AFINN when transformer not ready', async () => {
      const result = await analyze('happy day');
      expect(result.engine).toBe('AFINN');
      expect(result.mood).toBeTruthy();
    });
  });
});
