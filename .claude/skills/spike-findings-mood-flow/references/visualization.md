# Mood Visualization

## Requirements

- Use Chart.js with time axis for mood timeline
- Color-coded points map to mood categories
- Tooltips show mood label + diary text excerpt
- Range selector for week/month view
- Stats summary below chart (positive/negative/neutral counts, average score)

## How to Build It

### 1. Install Dependencies

```json
{
  "chart.js": "^4.4.0",
  "chartjs-adapter-date-fns": "^3.0.0",
  "date-fns": "^3.0.0"
}
```

### 2. Register Chart.js Components

```javascript
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables);
```

### 3. Create Mood Chart

```javascript
const MOOD_COLORS = {
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
  mixed: '#a78bfa'
};

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: data.map(d => new Date(d.date)),
    datasets: [{
      label: 'Mood Score',
      data: data.map(d => d.score),
      pointBackgroundColor: data.map(d => MOOD_COLORS[d.mood]),
      pointRadius: 6,
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d, yyyy h:mm a',
          displayFormats: { day: 'MMM d' }
        }
      },
      y: {
        min: -1.1,
        max: 1.1,
        ticks: {
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
      tooltip: {
        callbacks: {
          title: (items) => { /* mood label */ },
          label: (item) => { /* diary text excerpt */ }
        }
      }
    }
  }
});
```

### 4. Range Filtering

```javascript
function filterByRange(data, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return data.filter(d => new Date(d.date) >= cutoff);
}
```

### 5. Stats Cards

```javascript
function computeStats(data) {
  const positive = data.filter(d => d.mood === 'positive').length;
  const negative = data.filter(d => d.mood === 'negative').length;
  const avg = data.reduce((sum, d) => sum + d.score, 0) / data.length;
  return { positive, negative, avg };
}
```

## What to Avoid

- **Don't use Luxon adapter** — `chartjs-adapter-date-fns` is much lighter (~5KB vs ~70KB)
- **Don't skip `tension: 0.3`** — straight lines between mood points look jarring; slight curves feel natural
- **Don't hardcode colors** — derive from mood category so the chart is self-documenting
- **Don't skip the range selector** — 30 days of data on mobile is unreadable; always offer 7/14/30 day views

## Constraints

- Chart.js adds ~200KB to bundle
- Time axis requires adapter (`chartjs-adapter-date-fns`)
- Per-point colors require array of colors in dataset (not a single color)
- `segment.borderColor` callback enables gradient line coloring between points

## Origin

Synthesized from spikes: 003
Source files available in: sources/003-mood-chart-visualization/
