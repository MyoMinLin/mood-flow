/**
 * Claude API mood classifier.
 * Calls Anthropic Messages API directly via fetch (no SDK).
 * Returns { mood, confidence } or null on failure.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';
const TIMEOUT_MS = 10_000;

const MOODS = ['positive', 'content', 'neutral', 'anxious', 'negative'];

const SYSTEM_PROMPT = `You are a mood classifier for diary entries. Classify the emotional tone of the diary entry into exactly one of these moods: positive, content, neutral, anxious, negative.

Rules:
- "positive" = joyful, excited, grateful, proud, enthusiastic
- "content" = calm, peaceful, satisfied, okay, fine
- "neutral" = flat, factual, no clear emotion, ambivalent
- "anxious" = worried, stressed, uncertain, nervous, overwhelmed
- "negative" = sad, angry, frustrated, disappointed, hopeless

Return ONLY valid JSON, no other text:
{"mood":"<mood>","confidence":<0.0-1.0>}`;

/**
 * Classify mood of a diary entry via Claude API.
 * @param {string} text - The diary entry text
 * @returns {Promise<{ mood: string, confidence: number } | null>}
 */
export async function classifyMood(text) {
  const apiKey = localStorage.getItem('claude-api-key');
  if (!apiKey || !text?.trim()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 64,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Diary entry: "${text}"` }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!MOODS.includes(parsed.mood)) return null;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence)));
    return { mood: parsed.mood, confidence };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
