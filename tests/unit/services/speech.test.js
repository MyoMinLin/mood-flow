import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('speech service', () => {
  let speech;

  beforeEach(async () => {
    // Reset window mocks
    global.window = global.window || {};
    speech = await import('../../../src/services/speech.js');
  });

  describe('isSupported', () => {
    it('returns false when no SpeechRecognition', () => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
      expect(speech.isSupported()).toBe(false);
    });

    it('returns true when SpeechRecognition exists', () => {
      window.SpeechRecognition = class {};
      expect(speech.isSupported()).toBe(true);
      delete window.SpeechRecognition;
    });

    it('returns true when webkitSpeechRecognition exists', () => {
      window.webkitSpeechRecognition = class {};
      expect(speech.isSupported()).toBe(true);
      delete window.webkitSpeechRecognition;
    });
  });

  describe('startRecognition', () => {
    it('creates recognition and calls start', () => {
      const mockStart = vi.fn();
      const mockStop = vi.fn();
      class MockRecognition {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = '';
          this.onresult = null;
          this.onerror = null;
        }
        start() { mockStart(); }
        stop() { mockStop(); }
      }
      window.SpeechRecognition = MockRecognition;

      const onResult = vi.fn();
      const onError = vi.fn();
      const result = speech.startRecognition({ onResult, onError });

      expect(mockStart).toHaveBeenCalled();
      expect(result).toHaveProperty('stop');
      expect(typeof result.stop).toBe('function');

      delete window.SpeechRecognition;
    });
  });
});
