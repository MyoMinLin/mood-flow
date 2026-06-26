import { describe, it, expect } from 'vitest';
import {
  detectPitch,
  computeEnergy,
  computeZeroCrossingRate,
  classifyMood,
  classifyVoice,
} from '../../../src/services/voice-tone.js';

describe('voice-tone', () => {
  describe('detectPitch', () => {
    it('returns 0 for silence', () => {
      const buffer = new Float32Array(2048); // all zeros
      expect(detectPitch(buffer, 44100)).toBe(0);
    });

    it('detects a basic pitch from a sine wave', () => {
      const sampleRate = 44100;
      const freq = 440; // A4
      const buffer = new Float32Array(4096);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
      }
      const detected = detectPitch(buffer, sampleRate);
      // Should be roughly 440 Hz (within tolerance)
      expect(detected).toBeGreaterThan(400);
      expect(detected).toBeLessThan(480);
    });
  });

  describe('computeEnergy', () => {
    it('returns 0 for silent buffer', () => {
      const buffer = new Float32Array(1024);
      expect(computeEnergy(buffer)).toBe(0);
    });

    it('returns positive energy for signal', () => {
      const buffer = new Float32Array(1024);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(i * 0.1);
      }
      expect(computeEnergy(buffer)).toBeGreaterThan(0);
    });
  });

  describe('computeZeroCrossingRate', () => {
    it('returns 0 for constant signal', () => {
      const buffer = new Float32Array(1024).fill(1);
      expect(computeZeroCrossingRate(buffer)).toBe(0);
    });

    it('returns high rate for alternating signal', () => {
      const buffer = new Float32Array(1024);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = i % 2 === 0 ? 1 : -1;
      }
      const rate = computeZeroCrossingRate(buffer);
      expect(rate).toBeGreaterThan(0.5);
    });
  });

  describe('classifyMood', () => {
    it('classifies positive mood for high pitch + energy', () => {
      const result = classifyMood(300, 0.1, 0.25, 2000, 0.1);
      expect(result.category).toBe('positive');
      expect(result.emoji).toBe('😊');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('classifies neutral for mid-range features', () => {
      const result = classifyMood(200, 0.1, 0.15, 1500, 0.08);
      expect(result.category).toBe('neutral');
    });

    it('classifies negative for low pitch + energy', () => {
      const result = classifyMood(100, 0.1, 0.05, 500, 0.05);
      expect(result.category).toBe('negative');
    });

    it('returns a result with all required fields', () => {
      const result = classifyMood(200, 0.2, 0.15, 1000, 0.1);
      expect(result).toHaveProperty('emoji');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('category');
    });
  });

  describe('classifyVoice', () => {
    it('returns mood and confidence', () => {
      const result = classifyVoice(200, 0.1, 0.15, 1500, 0.1);
      expect(result).toHaveProperty('mood');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.mood).toBe('string');
      expect(typeof result.confidence).toBe('number');
    });

    it('classifies positive for energetic voice', () => {
      const result = classifyVoice(300, 0.1, 0.25, 2000, 0.1);
      expect(result.mood).toBe('positive');
    });
  });
});
