import Sentiment from 'sentiment';
import { pipeline, env } from '@huggingface/transformers';

// --- Sample diary entries ---
const SAMPLES = [
  "Today was absolutely wonderful! I went for a long walk in the park, the sun was shining, and I felt truly alive. Everything just clicked.",
  "I can't stop thinking about what happened. The loneliness is overwhelming. I sat alone all day and couldn't find motivation to do anything.",
  "I am so furious right now. They completely ignored my input and took credit for my work. This is unacceptable and I won't let it slide.",
  "Woke up, had coffee, went to work. Came home, made dinner, watched some TV. Nothing special happened today.",
  "My heart won't stop racing. The deadline is tomorrow and I'm nowhere near done. What if I fail? What if everyone sees I'm not good enough?",
  "The presentation went well, but I'm exhausted. Happy the team pulled through, yet I can't shake this feeling that something will go wrong."
];

// --- AFINN engine (instant, no loading) ---
const sentiment = new Sentiment();

function analyzeAFINN(text) {
  const start = performance.now();
  const result = sentiment.analyze(text);
  const elapsed = performance.now() - start;

  // Map score to mood label
  let mood, emoji;
  if (result.score > 2) { mood = 'Positive'; emoji = '😊'; }
  else if (result.score > 0) { mood = 'Slightly Positive'; emoji = '🙂'; }
  else if (result.score === 0) { mood = 'Neutral'; emoji = '😐'; }
  else if (result.score > -2) { mood = 'Slightly Negative'; emoji = '😕'; }
  else { mood = 'Negative'; emoji = '😢'; }

  return {
    score: result.score,
    comparative: result.comparative.toFixed(4),
    mood,
    emoji,
    tokens: result.tokens.length,
    positive: result.positive,
    negative: result.negative,
    elapsed: elapsed.toFixed(1)
  };
}

// --- Transformer engine ---
let transformerReady = false;
let classifier = null;

async function initTransformer() {
  const status = document.getElementById('status');
  try {
    env.allowLocalModels = false;
    classifier = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      {
        dtype: 'q8',
        progress_callback: (progress) => {
          if (progress.status === 'download' && progress.file) {
            const pct = progress.progress
              ? `${Math.round(progress.progress)}%`
              : 'downloading...';
            status.innerHTML = `<span class="loader"></span> Loading model: ${pct} — ${progress.file.split('/').pop()}`;
          }
        }
      }
    );
    transformerReady = true;
    status.className = 'status-bar ready';
    status.textContent = '✓ Both engines ready — type a diary entry and click Analyze';
    document.getElementById('analyzeBtn').disabled = false;
  } catch (err) {
    status.className = 'status-bar error';
    status.textContent = `✗ Transformer failed to load: ${err.message}. AFINN still works.`;
    document.getElementById('analyzeBtn').disabled = false;
  }
}

async function analyzeTransformer(text) {
  if (!transformerReady || !classifier) {
    return { mood: 'N/A', emoji: '❓', confidence: 0, elapsed: 0, error: 'Model not loaded' };
  }
  const start = performance.now();
  const result = await classifier(text);
  const elapsed = performance.now() - start;

  const label = result[0].label; // POSITIVE or NEGATIVE
  const score = result[0].score;
  let mood, emoji;
  if (label === 'POSITIVE' && score > 0.8) { mood = 'Positive'; emoji = '😊'; }
  else if (label === 'POSITIVE') { mood = 'Slightly Positive'; emoji = '🙂'; }
  else if (label === 'NEGATIVE' && score > 0.8) { mood = 'Negative'; emoji = '😢'; }
  else { mood = 'Slightly Negative'; emoji = '😕'; }

  return {
    mood,
    emoji,
    label,
    confidence: (score * 100).toFixed(1),
    elapsed: elapsed.toFixed(1)
  };
}

// --- UI wiring ---
function setSample(idx) {
  document.getElementById('input').value = SAMPLES[idx];
}

async function runAnalysis() {
  const text = document.getElementById('input').value.trim();
  if (!text) return;

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  // Run both in parallel
  const [afinnResult, transformerResult] = await Promise.all([
    Promise.resolve(analyzeAFINN(text)),
    analyzeTransformer(text)
  ]);

  // Render AFINN
  document.getElementById('afinn-result').innerHTML = `
    <div class="result-row">
      <span class="result-label">Mood</span>
      <span class="result-value"><span class="mood-emoji">${afinnResult.emoji}</span> ${afinnResult.mood}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Score</span>
      <span class="result-value ${afinnResult.score > 0 ? 'positive' : afinnResult.score < 0 ? 'negative' : 'neutral'}">${afinnResult.score}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Normalized</span>
      <span class="result-value">${afinnResult.comparative}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Positive words</span>
      <span class="result-value positive">${afinnResult.positive.join(', ') || '—'}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Negative words</span>
      <span class="result-value negative">${afinnResult.negative.join(', ') || '—'}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Tokens</span>
      <span class="result-value">${afinnResult.tokens}</span>
    </div>
    <div class="timing">⏱ ${afinnResult.elapsed}ms — zero download, instant</div>
  `;

  // Render Transformer
  if (transformerResult.error) {
    document.getElementById('transformer-result').innerHTML = `
      <p style="color:#f87171">${transformerResult.error}</p>
    `;
  } else {
    document.getElementById('transformer-result').innerHTML = `
      <div class="result-row">
        <span class="result-label">Mood</span>
        <span class="result-value"><span class="mood-emoji">${transformerResult.emoji}</span> ${transformerResult.mood}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Label</span>
        <span class="result-value">${transformerResult.label}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Confidence</span>
        <span class="result-value">${transformerResult.confidence}%</span>
      </div>
      <div class="timing">⏱ ${transformerResult.elapsed}ms inference (model cached in browser)</div>
    `;
  }

  btn.disabled = false;
  btn.textContent = 'Analyze Mood';
}

// Expose samples to global scope for onclick
window.setSample = setSample;

// Wire up analyze button
document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);

// Allow Ctrl+Enter
document.getElementById('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    runAnalysis();
  }
});

// Start loading transformer
initTransformer();
