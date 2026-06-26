import Sentiment from 'sentiment';
import { pipeline, env } from '@huggingface/transformers';

const sentiment = new Sentiment();
env.allowLocalModels = false;

let transformerReady = false;
let transformerLoading = false;
let classifier = null;
let useTransformer = true;

// --- AFINN (instant, always works) ---
function analyzeAFINN(text) {
  const r = sentiment.analyze(text);
  let mood = 'neutral';
  if (r.score > 2) mood = 'positive';
  else if (r.score > 0) mood = 'slightly positive';
  else if (r.score < -2) mood = 'negative';
  else if (r.score < 0) mood = 'slightly negative';
  return { mood, score: r.score, engine: 'AFINN', confidence: Math.min(100, Math.abs(r.score) * 20) };
}

// --- Transformer (loads async) ---
async function loadTransformer() {
  if (transformerReady || transformerLoading) return;
  transformerLoading = true;
  updateStatus('loading', 'Downloading transformer model...');

  try {
    classifier = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { dtype: 'q8' }
    );
    transformerReady = true;
    updateStatus('ready', '✓ Transformer loaded — using high-accuracy engine', 'DistilBERT', 'transformer');
  } catch (err) {
    updateStatus('offline', '⚠ Transformer unavailable — using AFINN fallback', 'AFINN (fallback)', 'afinn');
  }
  transformerLoading = false;
}

async function analyzeTransformer(text) {
  if (!transformerReady) return null;
  const r = await classifier(text);
  const mood = r[0].label === 'POSITIVE' ? 'positive' : 'negative';
  return { mood, score: r[0].label === 'POSITIVE' ? r[0].score : -r[0].score, engine: 'DistilBERT', confidence: Math.round(r[0].score * 100) };
}

function updateStatus(state, msg, engineText, engineClass) {
  const el = document.getElementById('status');
  const tag = engineText ? `<span class="engine-tag ${engineClass || 'afinn'}">${engineText}</span>` : '';
  el.innerHTML = (state === 'loading' ? '<span class="loader"></span> ' : '') + msg + ' ' + tag;
  el.className = 'status-bar ' + state;
}

// --- Analyze ---
window.analyze = async () => {
  const text = document.getElementById('input').value.trim();
  if (!text) return;

  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<p style="color:#888">Analyzing...</p>';

  // Always run AFINN first (instant)
  const afinnResult = analyzeAFINN(text);

  // Try transformer if available
  let finalResult = afinnResult;
  if (useTransformer && transformerReady) {
    const tResult = await analyzeTransformer(text);
    if (tResult) finalResult = tResult;
  }

  renderResult(finalResult, afinnResult);
};

function renderResult(result, afinnResult) {
  const emojis = { positive: '😊', 'slightly positive': '🙂', neutral: '😐', 'slightly negative': '😕', negative: '😢' };
  const colors = { positive: '#22c55e', 'slightly positive': '#4ade80', neutral: '#eab308', 'slightly negative': '#f97316', negative: '#ef4444' };

  const showBoth = result.engine !== 'AFINN' && afinnResult.mood !== result.mood;

  document.getElementById('result').innerHTML = `
    <div class="result-main">
      <div class="mood-emoji">${emojis[result.mood] || '❓'}</div>
      <div class="mood-label" style="color:${colors[result.mood]}">${result.mood}</div>
      <div class="mood-engine">via ${result.engine} · ${result.confidence}% confidence</div>
    </div>
    ${showBoth ? `
      <div class="result-compare">
        <span class="compare-label">AFINN said:</span>
        <span class="compare-value">${emojis[afinnResult.mood]} ${afinnResult.mood}</span>
      </div>
    ` : ''}
  `;
}

// --- Simulate offline ---
window.toggleTransformer = () => {
  useTransformer = !useTransformer;
  const btn = document.getElementById('toggleBtn');
  if (useTransformer) {
    btn.textContent = '🚫 Simulate Offline';
    if (transformerReady) {
      updateStatus('ready', '✓ Transformer active', 'DistilBERT', 'transformer');
    }
  } else {
    btn.textContent = '🌐 Go Online';
    updateStatus('offline', '⚠ Simulated offline — AFINN fallback active', 'AFINN (fallback)', 'afinn');
  }
};

// --- Init ---
updateStatus('loading', 'Loading transformer model in background...');
loadTransformer();
