---
spike: 003
name: mood-chart-visualization
type: standard
validates: "Given mood data over time, when rendered in a chart, then trends are visible and interactive in browser"
verdict: VALIDATED
related: [001]
tags: [chart, visualization, mood, chartjs, time-series]
---

# Spike 003: Mood Chart Visualization

## What This Validates
Given mood data over time, when rendered in a Chart.js line chart with time axis, then trends are visible, interactive, and performant in a vanilla JS app.

## Research

### Approach: Chart.js
- Most popular JS charting library, ~200KB
- Built-in time scale with `chartjs-adapter-date-fns`
- Tooltips, zoom, responsive out of the box
- Works with vanilla JS — no framework needed

### Alternatives Considered
| Library | Size | Pros | Cons |
|---------|------|------|------|
| Chart.js | ~200KB | Full-featured, great docs, time scale | Heavier |
| uPlot | ~30KB | Fast, lightweight | Less interactive, steeper API |
| Canvas API | 0KB | No deps | Must build everything manually |

**Chosen:** Chart.js — interactivity matters for a diary app (tooltips, range selection).

## How to Run
```bash
cd .planning/spikes/003-mood-chart-visualization
npm install
npm run dev
# Open http://localhost:5176
```

## What to Expect
1. Line chart showing 30 days of mood data
2. Color-coded points: green (positive), yellow (neutral), red (negative), purple (mixed)
3. Hover tooltips showing mood label + diary text excerpt
4. Range buttons: 30 days, 14 days, 7 days
5. "+ Add Entry" button to test live chart updates
6. Stats cards: mood distribution + average score
7. Recent entries list below chart

## Investigation Trail
- Chart.js time scale needs adapter — `chartjs-adapter-date-fns` (lighter than Luxon)
- Color per-point requires array of colors in dataset
- `segment.borderColor` callback enables gradient line coloring

## Results

**Verdict: VALIDATED ✓**

- Chart.js with time scale renders mood trends clearly
- Color-coded points (green/yellow/red/purple) make mood patterns scannable at a glance
- Tooltips with diary text excerpts provide context without leaving the chart
- Range filtering (7/14/30 days) works for zooming into recent vs long-term trends
- Live updates ("+ Add Entry") confirm chart re-renders smoothly
- Stats cards give quick mood distribution summary

### Signal for the Build
- Use Chart.js with `chartjs-adapter-date-fns` for mood timeline
- Point colors map to mood categories
- Tooltip shows mood label + diary excerpt
- Range selector for week/month view
- Stats summary below chart (positive/negative/neutral counts, average)
