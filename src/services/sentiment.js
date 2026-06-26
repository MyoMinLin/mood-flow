// Text sentiment analysis — AFINN (instant) → Claude API → DistilBERT (fallback).
// Derived from spikes 001, 002, 008.

import Sentiment from 'sentiment';
import { analyzeText as workerAnalyze, isReady as transformerReady, initWorker } from './sentiment-worker-client.js';
import { classifyMood } from './claude-mood.js';

const sentiment = new Sentiment();

// Canonical mood mapping — shared across AFINN and transformer paths.
// From spike 008: simpler 5-label set that maps cleanly to MOODS.
const MOOD_MAP = {
  positive:         { mood: 'positive',  emoji: '😊' },
  slightly_positive:{ mood: 'content',   emoji: '🙂' },
  neutral:          { mood: 'neutral',   emoji: '😐' },
  slightly_negative:{ mood: 'anxious',   emoji: '😰' },
  negative:         { mood: 'negative',  emoji: '😢' },
};

/**
 * Instant AFINN-based sentiment analysis.
 * From spike 001: analyzeAFINN(text).
 * @param {string} text
 * @returns {{ mood: string, score: number, engine: string, confidence: number }}
 */
export function analyzeAFINN(text) {
  const r = sentiment.analyze(text);
  let label;
  if (r.score > 2) label = 'positive';
  else if (r.score > 0) label = 'slightly_positive';
  else if (r.score === 0) label = 'neutral';
  else if (r.score > -2) label = 'slightly_negative';
  else label = 'negative';

  const mapped = MOOD_MAP[label];
  return {
    mood: mapped.mood,
    score: r.score,
    engine: 'AFINN',
    confidence: Math.min(100, Math.abs(r.score) * 20),
  };
}

/**
 * Map DistilBERT POSITIVE/NEGATIVE label + score to canonical mood.
 * From spike 001: mapMood(label, score).
 * @param {string} label - 'POSITIVE' or 'NEGATIVE'
 * @param {number} score - 0-1 confidence
 * @returns {{ mood: string, emoji: string }}
 */
export function mapMood(label, score) {
  if (label === 'POSITIVE' && score > 0.8) return { mood: 'positive', emoji: '😊' };
  if (label === 'POSITIVE') return { mood: 'content', emoji: '🙂' };
  if (label === 'NEGATIVE' && score > 0.8) return { mood: 'negative', emoji: '😢' };
  return { mood: 'anxious', emoji: '😰' };
}

/**
 * Unified analyze — AFINN instant, then Claude API, then DistilBERT fallback.
 * From spike 008: analyze(text).
 * @param {string} text
 * @returns {Promise<{ mood: string, score: number, engine: string, confidence: number }>}
 */
export async function analyze(text) {
  // Always run AFINN first (instant, works offline)
  const afinnResult = analyzeAFINN(text);

  // Try Claude API if key configured
  try {
    const claudeResult = await classifyMood(text);
    if (claudeResult) {
      return {
        mood: claudeResult.mood,
        score: 0, // Claude doesn't produce numeric score; mood is authoritative
        engine: 'Claude',
        confidence: Math.round(claudeResult.confidence * 100),
      };
    }
  } catch {
    // Claude failed — fall through
  }

  // Try transformer if available
  if (transformerReady()) {
    try {
      const tResult = await workerAnalyze(text);
      if (tResult && !tResult.error) {
        const mapped = mapMood(tResult.label, tResult.score);
        return {
          mood: mapped.mood,
          score: tResult.label === 'POSITIVE' ? tResult.score : -tResult.score,
          engine: 'DistilBERT',
          confidence: Math.round(tResult.score * 100),
        };
      }
    } catch {
      // Transformer failed — fall back to AFINN
    }
  }

  return afinnResult;
}

/**
 * Initialize the transformer worker in background.
 * Call once at app startup.
 */
export function initSentiment() {
  initWorker();
}
