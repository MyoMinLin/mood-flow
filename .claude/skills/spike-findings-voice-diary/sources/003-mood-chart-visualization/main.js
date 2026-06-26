import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

// --- Sample diary data (30 days) ---
const MOODS = ['positive', 'neutral', 'negative', 'mixed'];
const MOOD_SCORES = { positive: 1, neutral: 0, negative: -1, mixed: 0.3 };
const MOOD_EMOJIS = { positive: '😊', neutral: '😐', negative: '😢', mixed: '🤔' };
const MOOD_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
  mixed: '#a78bfa'
};

function generateSampleData(days) {
  const data = [];
  const now = new Date();
  const entries = [
    "Had a wonderful morning walk. Felt energized and grateful.",
    "Work was okay. Nothing exciting, nothing bad.",
    "Argument with friend. Feeling hurt and misunderstood.",
    "Got a promotion! Best day in months.",
    "Rainy day, stayed in. Quiet but content.",
    "Deadline stress. Couldn't sleep well.",
    "Cooked a new recipe. Small wins matter.",
    "Missing home. The nostalgia is strong.",
    "Great workout session. Endorphins are real.",
    "Presentation went well but I'm drained.",
    "Woke up anxious for no clear reason.",
    "Lunch with old friends. Laughter heals.",
    "Traffic jam ruined my morning mood.",
    "Finished a book. Satisfied and thoughtful.",
    "Bad news from family. Heavy heart today.",
    "Sunny day, ice cream, simple pleasures.",
    "Bored and unmotivated. Scrolled phone all day.",
    "Surprise gift from colleague. Touched!",
    "Couldn't focus. Mind kept wandering.",
    "Deep conversation with sister. Feeling connected.",
    "Burnt dinner. Laughed it off instead of getting upset.",
    "加班 late. Exhausted but accomplished.",
    "Rain + cancelled plans. Disappointed.",
    "Morning meditation helped. Calm start.",
    "Received criticism. Stung but fair.",
    "Danced in the kitchen. No reason needed.",
    "Feeling indifferent. Just going through motions.",
    "Good news about health checkup. Relief!",
    "Project completed. Mixed feelings — proud but empty.",
    "Beautiful sunset. Grateful to be alive."
  ];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
    // Add some variance to the score
    const baseScore = MOOD_SCORES[mood];
    const variance = (Math.random() - 0.5) * 0.4;
    const score = Math.max(-1, Math.min(1, baseScore + variance));

    data.push({
      date: date.toISOString(),
      mood,
      score,
      text: entries[i % entries.length],
      emoji: MOOD_EMOJIS[mood]
    });
  }
  return data;
}

let allData = generateSampleData(30);
let currentRange = 30;
let chart = null;

function getFilteredData() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - currentRange);
  return allData.filter(d => new Date(d.date) >= cutoff);
}

function getColor(score) {
  if (score > 0.3) return MOOD_COLORS.positive;
  if (score > -0.3) return MOOD_COLORS.neutral;
  if (score > -0.7) return MOOD_COLORS.mixed;
  return MOOD_COLORS.negative;
}

function createChart() {
  const ctx = document.getElementById('moodChart').getContext('2d');
  const data = getFilteredData();

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => new Date(d.date)),
      datasets: [{
        label: 'Mood Score',
        data: data.map(d => d.score),
        borderColor: data.map(d => getColor(d.score)),
        backgroundColor: data.map(d => getColor(d.score) + '33'),
        pointBackgroundColor: data.map(d => getColor(d.score)),
        pointBorderColor: data.map(d => getColor(d.score)),
        pointRadius: 6,
        pointHoverRadius: 9,
        fill: true,
        tension: 0.3,
        segment: {
          borderColor: ctx2 => {
            const score = ctx2.p0.parsed.y;
            return getColor(score);
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy h:mm a',
            displayFormats: {
              day: 'MMM d'
            }
          },
          grid: { color: '#222' },
          ticks: { color: '#666' }
        },
        y: {
          min: -1.1,
          max: 1.1,
          grid: { color: '#222' },
          ticks: {
            color: '#666',
            callback: (val) => {
              if (val === 1) return '😊 Positive';
              if (val === 0) return '😐 Neutral';
              if (val === -1) return '😢 Negative';
              return '';
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          borderColor: '#333',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#aaa',
          padding: 12,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              const d = data[idx];
              return `${d.emoji} ${d.mood.charAt(0).toUpperCase() + d.mood.slice(1)}`;
            },
            label: (item) => {
              const idx = item.dataIndex;
              const d = data[idx];
              return d.text;
            },
            afterLabel: (item) => {
              const idx = item.dataIndex;
              const d = data[idx];
              return `Score: ${d.score.toFixed(2)}`;
            }
          }
        }
      }
    }
  });

  renderStats(data);
  renderEntries(data);
}

function renderStats(data) {
  const positive = data.filter(d => d.mood === 'positive').length;
  const negative = data.filter(d => d.mood === 'negative').length;
  const neutral = data.filter(d => d.mood === 'neutral').length;
  const mixed = data.filter(d => d.mood === 'mixed').length;
  const avg = data.reduce((sum, d) => sum + d.score, 0) / data.length;

  document.getElementById('stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-value positive">${positive}</div>
      <div class="stat-label">Positive Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value neutral">${neutral}</div>
      <div class="stat-label">Neutral Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value negative">${negative}</div>
      <div class="stat-label">Negative Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value mixed">${mixed}</div>
      <div class="stat-label">Mixed Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${avg > 0 ? '#22c55e' : avg < 0 ? '#ef4444' : '#eab308'}">${avg.toFixed(2)}</div>
      <div class="stat-label">Average Score</div>
    </div>
  `;
}

function renderEntries(data) {
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('entries').innerHTML = sorted.slice(0, 10).map(d => `
    <div class="entry-row">
      <span class="entry-date">${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      <span class="entry-mood ${d.mood}">${d.emoji} ${d.mood}</span>
      <span class="entry-text">${d.text}</span>
    </div>
  `).join('');
}

// --- Global functions for onclick ---
window.setRange = (days, btn) => {
  currentRange = days;
  document.querySelectorAll('.controls .btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  createChart();
};

window.addEntry = () => {
  const moods = ['positive', 'neutral', 'negative', 'mixed'];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const texts = [
    "Just added this entry now. Feeling okay.",
    "Testing the chart update. Pretty smooth!",
    "Another day, another entry.",
    "The chart is looking good today."
  ];
  allData.push({
    date: new Date().toISOString(),
    mood,
    score: MOOD_SCORES[mood] + (Math.random() - 0.5) * 0.3,
    text: texts[Math.floor(Math.random() * texts.length)],
    emoji: MOOD_EMOJIS[mood]
  });
  createChart();
};

// --- Init ---
createChart();
