# Handoff: UI/UX Task Generation for Voice Diary

**Date**: 2026-06-21
**Source**: `/speckit-analyze` findings (12 items)
**Next step**: Run `/speckit-tasks` to generate tasks.md for UI/UX improvements

## Context

All 76 original implementation tasks are complete. The user ran `/speckit-analyze` comparing current UI against spike mockups (`.planning/spikes/`). The analysis found 12 UI/UX gaps. A new tasks.md should be generated to address them.

## Findings Summary (12 items)

### HIGH (3)

| ID | Area | Summary | Files |
|----|------|---------|-------|
| U1 | Entry Cards | Cards lack visual depth — spike 006 uses 12px radius, border, hover transition. Current uses 8px, no border. | `main.css`, `entry-list.js` |
| U2 | Mood Badges | Mood indicator is bare emoji. Spike 006 shows colored pill badge with background. | `entry-list.js`, `main.css` |
| U4 | Voice Recorder | No audio visualization. Spike 004 has real-time canvas waveform during recording. | `voice-recorder.js`, `main.css` |

### MEDIUM (6)

| ID | Area | Summary | Files |
|----|------|---------|-------|
| U3 | Override Badge | No "override" indicator when user_mood differs from ai_mood. | `entry-viewer.js` |
| U5 | Record Button | Spike 004 uses 100px button with dot→square animation. Current is 80px with emoji. | `voice-recorder.js`, `main.css` |
| U6 | Feature Meters | Spike 004 shows pitch/energy/brightness/rate as horizontal bars. | `entry-viewer.js`, `main.css` |
| U8 | Fusion Display | Spike 005 shows fusion card with conflict/agreement indicators. | `entry-viewer.js`, `main.css` |
| U9 | Type Chip | Entry type label could be a colored chip/badge. | `entry-list.js`, `main.css` |
| U11 | Loading States | Spike 001 shows status bar with spinner. Current uses text-only. | `entry-viewer.js` |

### LOW (3)

| ID | Area | Summary | Files |
|----|------|---------|-------|
| U7 | Textarea | Minor dark background alignment. | `main.css` |
| U10 | Stat Cards | Mood chart stat card sizing differs from spike 003. | `main.css` |
| U12 | Duplication | Transcript save flow duplicated in editor and viewer. | `entry-editor.js`, `entry-viewer.js` |

## Spike Mockup References

All in `.planning/spikes/`:

- **001-sentiment-api-comparison/index.html** — status bar with spinner, textarea styling
- **003-mood-chart-visualization/index.html** — stat cards, legend, chart container
- **004-mood-from-voice-tone/index.html** — record button, canvas visualizer, feature meters
- **005-mood-fusion-pipeline/index.html** — fusion card, conflict/agreement boxes
- **006-mood-override-ui/index.html** — entry cards, mood badges, override badge, dropdown

## Existing Spec/Plan/Tasks

- **Spec**: `specs/001-voice-diary-app/spec.md` — FR-016 (responsive), FR-024 (mood badge), FR-025 (override)
- **Plan**: `specs/001-voice-diary-app/plan.md` — vanilla JS, Vite, dark theme
- **Current tasks**: `specs/001-voice-diary-app/tasks.md` — all 76 tasks [x] complete
- **Contracts**: `specs/001-voice-diary-app/contracts/service-interfaces.md`
- **Data model**: `specs/001-voice-diary-app/data-model.md`

## Suggested Phase Structure for New Tasks

```
Phase 1: Entry Card Polish (U1, U2, U9) — main.css + entry-list.js
Phase 2: Voice Recorder Enhancement (U4, U5) — voice-recorder.js + main.css
Phase 3: Entry Viewer Refinements (U3, U6, U8, U11) — entry-viewer.js + main.css
Phase 4: Code Cleanup (U7, U10, U12) — main.css + extract shared helper
```

## Key Files to Read

- `src/styles/main.css` — all current styles (682 lines)
- `src/components/entry-list.js` — entry list rendering (68 lines)
- `src/components/entry-viewer.js` — entry viewer (307 lines)
- `src/components/entry-editor.js` — entry editor with mood analysis (211 lines)
- `src/components/voice-recorder.js` — voice recorder (138 lines)
- `src/components/mood-override.js` — mood selector dropdown (79 lines)
- `src/components/mood-chart.js` — chart component (221 lines)
- `src/main.js` — app bootstrap (98 lines)

## Instruction for Next Session

Run `/speckit-tasks` — it will read this handoff and the existing spec/plan to generate a new tasks.md focused on UI/UX improvements. The existing tasks.md with all 76 completed tasks should be archived or the new tasks should be appended as a new phase (Phase 13+).
