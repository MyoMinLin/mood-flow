# Mood Override UX

## Requirements

- User can override AI-detected mood with inline dropdown selector
- Show AI mood and user mood side-by-side (transparency)
- "overridden" badge on changed entries
- Stats summary with override count and mood distribution

## How to Build It

### Inline Dropdown Pattern

```javascript
// Click mood badge → dropdown appears near it
function openSelector(entryId, btnEl) {
  const selector = document.getElementById('moodSelector');
  const rect = btnEl.getBoundingClientRect();
  selector.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  selector.style.left = rect.left + 'px';
  selector.classList.add('open');
}

// Select mood → update entry, close dropdown
function selectMood(mood) {
  entry.override = mood;
  selector.classList.remove('open');
  render();
}

// Click outside to close
document.addEventListener('click', (e) => {
  if (!e.target.closest('.mood-display') && !e.target.closest('.mood-selector')) {
    selector.classList.remove('open');
  }
});
```

### Display Pattern

```
AI detected: [😊 positive (92%)]  →  Your mood: [😊 positive ▼]
                                              ↑ click to override
```

After override:

```
AI detected: [😊 positive (92%)]  →  Your mood: [😢 sad ▼]  [overridden]
```

## What to Avoid

- **Don't use a modal** — inline dropdown is faster and keeps context
- **Don't hide the AI mood** — show both so user can compare
- **Don't require override** — most entries should keep the AI suggestion

## Origin

Synthesized from spikes: 006
Source files available in: sources/006-mood-override-ui/
