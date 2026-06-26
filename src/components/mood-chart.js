// Mood timeline chart using Chart.js.
// From spike 003: mood-chart-visualization.

import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { el } from '../utils/dom.js';
import { getMoodEntries, getEntryById } from '../services/diary.js';
import { MOODS, getDisplayMood, getMoodEmoji } from '../services/moods.js';
import { on } from '../utils/events.js';
import { format } from '../utils/date.js';

Chart.register(...registerables);

// Score-to-color mapping from spike 003: getColor(score).
const COLOR_MAP = [
  { min: -1,   max: -0.6, color: '#ef4444' }, // red
  { min: -0.6, max: -0.2, color: '#f97316' }, // orange
  { min: -0.2, max:  0.2, color: '#eab308' }, // yellow
  { min:  0.2, max:  0.6, color: '#84cc16' }, // lime
  { min:  0.6, max:  1,   color: '#22c55e' }, // green
];

/**
 * Map a mood score (-1 to 1) to a hex color.
 * From spike 003: getColor(score).
 */
export function getColor(score) {
  for (const range of COLOR_MAP) {
    if (score >= range.min && score < range.max) return range.color;
  }
  return '#22c55e'; // default green for score === 1
}

/**
 * Map mood label to a numeric score for charting.
 */
function moodToScore(mood) {
  const scores = { positive: 1, content: 0.5, neutral: 0, anxious: -0.5, negative: -1, mixed: 0 };
  return scores[mood] ?? 0;
}

/**
 * Filter entries by time range, optionally anchored to a specific date.
 * Uses local time to match entry_date format (YYYY-MM-DD in local time).
 * From spike 003: filterByRange(data, days).
 */
export function filterByRange(data, days, anchorDate) {
  if (!days) return data;
  const anchor = anchorDate ? new Date(anchorDate + 'T00:00:00') : new Date();
  const cutoff = new Date(anchor);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = format(cutoff);
  const anchorStr = anchorDate || format(anchor);
  return data.filter(d => d.entry_date >= cutoffStr && d.entry_date <= anchorStr);
}

/**
 * Compute mood distribution stats.
 * From spike 003: renderStats(data).
 */
export function computeStats(data) {
  const stats = { positive: 0, content: 0, neutral: 0, anxious: 0, negative: 0, mixed: 0 };
  let totalScore = 0;
  for (const entry of data) {
    const mood = getDisplayMood(entry);
    if (stats.hasOwnProperty(mood)) stats[mood]++;
    totalScore += moodToScore(mood);
  }
  return { ...stats, avg: data.length ? totalScore / data.length : 0 };
}

/**
 * MoodChart component — renders a Chart.js line chart with mood timeline.
 * @param {{ days?: number }} opts
 * @returns {{ element: HTMLElement, refresh: () => void }}
 */
export function MoodChart({ days = 30, onEntryClick } = {}) {
  const container = el('div', { className: 'mood-chart-container' });

  // Controls
  const controls = el('div', { className: 'mood-chart-controls' });
  const ranges = [7, 14, 30, 90];
  let selectedDays = days;
  let anchorDate = null; // null = today, string = YYYY-MM-DD

  for (const range of ranges) {
    const btn = el('button', {
      className: `btn-sm ${range === selectedDays ? 'active' : ''}`,
      textContent: `${range} Days`,
    });
    btn.addEventListener('click', () => {
      selectedDays = range;
      controls.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      refresh();
    });
    controls.appendChild(btn);
  }
  container.appendChild(controls);

  // Subtitle — explains what the chart shows
  const subtitle = el('p', {
    className: 'mood-chart-subtitle',
    textContent: 'Each point is a diary entry, colored by mood. Click a point to read it.',
  });
  container.appendChild(subtitle);

  // Legend (from spike 003)
  const legend = el('div', { className: 'mood-legend' });
  const legendItems = [
    { color: '#22c55e', label: 'Positive' },
    { color: '#4ade80', label: 'Content' },
    { color: '#eab308', label: 'Neutral' },
    { color: '#f97316', label: 'Anxious' },
    { color: '#ef4444', label: 'Negative' },
    { color: '#a78bfa', label: 'Mixed' },
  ];
  for (const { color, label } of legendItems) {
    legend.appendChild(el('div', { className: 'mood-legend-item' }, [
      el('div', { className: 'mood-legend-dot', style: { background: color } }),
      document.createTextNode(label),
    ]));
  }
  container.appendChild(legend);

  // Stats bar — grid of stat cards (from spike 003)
  const statsBar = el('div', { className: 'mood-stats-bar' });
  container.appendChild(statsBar);

  // Chart canvas — wrapped for Chart.js responsive sizing
  const chartWrapper = el('div', { className: 'mood-chart-wrapper' });
  const canvas = el('canvas');
  chartWrapper.appendChild(canvas);
  container.appendChild(chartWrapper);

  let chart = null;

  function refresh() {
    const entries = getMoodEntries(selectedDays, anchorDate);
    const data = filterByRange(entries, selectedDays, anchorDate);

    // Update stats — stat cards (spike 003 style)
    const stats = computeStats(data);
    statsBar.innerHTML = '';
    const totalEntries = data.length;
    for (const [mood, count] of Object.entries(stats)) {
      if (mood === 'avg') continue;
      if (count > 0) {
        statsBar.appendChild(el('div', {
          className: `mood-stat-chip mood-${mood}`,
          innerHTML: `<div style="font-size:1.2rem;font-weight:700">${getMoodEmoji(mood)} ${count}</div><div style="font-size:0.75rem;color:#888;margin-top:2px">${mood}</div>`,
        }));
      }
    }
    // Total card
    if (totalEntries > 0) {
      statsBar.appendChild(el('div', {
        className: 'mood-stat-chip',
        innerHTML: `<div style="font-size:1.2rem;font-weight:700">${totalEntries}</div><div style="font-size:0.75rem;color:#888;margin-top:2px">total</div>`,
      }));
    }

    // Build chart data
    const chartData = data.map(entry => ({
      x: new Date(entry.entry_date),
      y: moodToScore(getDisplayMood(entry)),
      mood: getDisplayMood(entry),
      text: entry.text_content?.substring(0, 100) || '',
      entryId: entry.id,
    }));

    if (chart) chart.destroy();

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Mood',
          data: chartData,
          borderColor: '#6366f1',
          backgroundColor: chartData.map(d => getColor(d.y)),
          pointBackgroundColor: chartData.map(d => getColor(d.y)),
          pointRadius: 8,
          pointHoverRadius: 12,
          tension: 0.3,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', displayFormats: { day: 'MMM d' } },
            title: { display: true, text: 'Date' },
          },
          y: {
            min: -1.1,
            max: 1.1,
            ticks: {
              callback: (val) => {
                if (val === 1) return '😊 Positive';
                if (val === 0.5) return '🙂 Content';
                if (val === 0) return '😐 Neutral';
                if (val === -0.5) return '😰 Anxious';
                if (val === -1) return '😢 Negative';
                return '';
              },
            },
            title: { display: true, text: 'Mood' },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items.length) return '';
                const d = chartData[items[0].dataIndex];
                return d.x.toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                });
              },
              label: (ctx) => {
                const d = chartData[ctx.dataIndex];
                return `${getMoodEmoji(d.mood)} ${d.mood}: "${d.text}${d.text.length >= 100 ? '...' : ''}"`;
              },
            },
          },
          legend: { display: false },
        },
        onClick: (_event, elements) => {
          if (!elements.length || !onEntryClick) return;
          const idx = elements[0].index;
          const entryId = chartData[idx].entryId;
          const entry = getEntryById(entryId);
          if (entry) onEntryClick(entry);
        },
      },
    });
  }

  // Refresh on entry changes
  on('entries:changed', () => refresh());

  // Anchor chart range to calendar date selection
  on('date:selected', ({ date }) => {
    anchorDate = date;
    refresh();
  });

  // Initial render
  refresh();

  return { element: container, refresh };
}
