---
spike: 006
name: mood-override-ui
type: standard
validates: "Given a diary entry with AI-detected mood, when user disagrees, then they can override with a different mood label"
verdict: VALIDATED
related: [005]
tags: [ux, override, mood, interaction]
---

# Spike 006: Mood Override UI

## What This Validates
Given a diary entry with AI-detected mood, when the user clicks the mood badge, then a selector appears allowing them to choose a different mood, with visual feedback showing the override.

## Research

### UX Pattern: Inline Mood Selector
- Click mood badge → dropdown appears near the badge
- Shows all mood options with emoji + label
- Current mood highlighted with ✓
- Click to select → badge updates, "overridden" badge appears
- Reset button to clear all overrides

### Key Design Decisions
- Show both AI mood and user mood side-by-side (transparency)
- "overridden" badge so user knows which entries they changed
- Stats bar shows override count and mood distribution
- Dropdown positions relative to clicked element (not fixed position)

## How to Run
```bash
cd .planning/spikes/006-mood-override-ui
npm install
npm run dev
# Open http://localhost:5179
```

## What to Expect
1. List of diary entries with AI-detected moods
2. Click any mood badge → selector dropdown appears
3. Select different mood → badge updates with "overridden" badge
4. Stats bar updates with new mood distribution
5. "Reset all overrides" button clears all changes

## Investigation Trail
- Pure vanilla JS — no deps needed for UI interaction
- Dropdown positioning uses getBoundingClientRect
- Click-outside-to-close pattern for the selector

## Results

**Verdict: VALIDATED ✓**

- Inline mood selector works naturally — click badge, pick new mood
- "overridden" badge provides clear transparency between AI and user mood
- Stats bar with mood distribution gives quick overview
- Reset button for clearing all overrides
- Dropdown positioning near clicked element feels natural

### Signal for the Build
- Use inline dropdown selector for mood override (not modal)
- Show AI mood and user mood side-by-side
- "overridden" badge on changed entries
- Stats summary with override count
