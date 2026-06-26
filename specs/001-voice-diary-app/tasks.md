# Tasks: Voice Diary App

**Input**: Design documents from `/specs/001-voice-diary-app/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Vite, dependencies, and basic structure

- [x] T001 Initialize Vite project with vanilla JS template: `npm create vite@latest voice-diary -- --template vanilla`
- [x] T002 Install dependencies: sql.js (`npm install sql.js`) and Vitest (`npm install -D vitest`)
- [x] T003 Create directory structure per plan: `src/db/`, `src/components/`, `src/services/`, `src/utils/`, `src/styles/`, `public/`, `tests/`
- [x] T004 [P] Configure Vite to copy sql-wasm.wasm to public/ in `vite.config.js`
- [x] T005 [P] Create entry point HTML with responsive meta viewport in `src/index.html`
- [x] T006 [P] Create global CSS reset and responsive grid layout in `src/styles/main.css`
- [x] T007 [P] Create event bus utility in `src/utils/events.js` (on/emit pattern)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database layer and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create database init, schema creation, and localStorage persistence in `src/db/database.js`
- [x] T009 Create diary service with all CRUD operations per contracts in `src/services/diary.js`
- [x] T010 [P] Create date utility functions (formatting, parsing, today) in `src/utils/date.js`
- [x] T011 [P] Create DOM utility functions (createElement helpers) in `src/utils/dom.js`
- [x] T012 Create app bootstrap, router, and main layout in `src/main.js`

**Checkpoint**: Foundation ready — database works, services are callable, app boots

---

## Phase 3: User Story 1 — Create Written Diary Entry (Priority: P1) 🎯 MVP

**Goal**: User can create text diary entries that persist and appear on the calendar

**Independent Test**: Open app → tap "New Entry" → type text → save → entry appears on calendar for today

### Implementation for User Story 1

- [x] T013 [US1] Create entry editor component with text area and save/cancel buttons in `src/components/entry-editor.js`
- [x] T014 [US1] Create "New Entry" button and mode toggle (write/voice) shell in `src/main.js` or a header component
- [x] T015 [US1] Wire entry editor to diary service: save calls `createTextEntry()`, display success/error feedback
- [x] T016 [US1] Add entry date validation and created_at timestamp display in entry editor

**Checkpoint**: Text entries can be created, saved to SQLite, and persist across refresh

---

## Phase 4: User Story 2 — Create Voice Diary Entry (Priority: P1)

**Goal**: User can record audio and save it as a voice diary entry

**Independent Test**: Open app → switch to voice mode → record audio → stop → entry saved with playback

### Implementation for User Story 2

- [x] T017 [US2] Create audio service with MediaRecorder recording and playback per contracts in `src/services/audio.js`
- [x] T018 [US2] Create voice recorder component with record/stop/cancel controls in `src/components/voice-recorder.js`
- [x] T019 [US2] Wire voice recorder to diary service: save calls `createVoiceEntry()` with audio BLOB
- [x] T020 [US2] Add microphone permission handling with clear error messages when denied
- [x] T021 [US2] Add audio playback UI in voice recorder for preview before saving
- [x] T022 [US2] Integrate voice recorder into entry editor as a mode toggle (write ↔ voice)

**Checkpoint**: Both text and voice entries can be created; mode toggle works

---

## Phase 5: User Story 4 — Browse Diary Entries on Calendar (Priority: P2)

**Goal**: Calendar is the default home page showing which dates have entries

**Independent Test**: Create entries on different dates → calendar highlights those dates → tap date → entry list appears

### Implementation for User Story 4

- [x] T023 [US4] Create calendar component with month grid, navigation arrows, and date highlighting in `src/components/calendar.js`
- [x] T024 [US4] Wire calendar to diary service: `getEntryDatesForMonth()` marks dates with entries
- [x] T025 [US4] Create entry list component that shows entries for a selected date in `src/components/entry-list.js`
- [x] T026 [US4] Wire entry list to diary service: `getEntriesByDate()` populates the list
- [x] T027 [US4] Add month navigation (prev/next) that refreshes entry indicators
- [x] T028 [US4] Handle empty state when selected date has no entries

**Checkpoint**: Calendar is the home page, entries show on correct dates, navigation works

---

## Phase 6: User Story 3 — Convert Voice Entry to Text (Priority: P2)

**Goal**: User can transcribe a voice entry to text using Web Speech API

**Independent Test**: Open voice entry → click "Convert to Text" → review transcription → save as text entry

### Implementation for User Story 3

- [x] T029 [US3] Create speech service with Web Speech API recognition per contracts in `src/services/speech.js`
- [x] T030 [US3] Create entry viewer component for viewing/playing existing entries in `src/components/entry-viewer.js`
- [x] T031 [US3] Add "Convert to Text" action in entry viewer for voice entries
- [x] T032 [US3] Implement transcription flow: play audio → capture speech → display editable text
- [x] T033 [US3] Add "Save as Text" button that creates a new text entry via `createTextEntry()`
- [x] T034 [US3] Handle unsupported browsers (no Web Speech API) with fallback message

**Checkpoint**: Voice entries can be transcribed and saved as text entries

---

## Phase 7: User Story 5 — View and Edit Diary Entry (Priority: P3)

**Goal**: User can open existing entries, edit text, and save changes

**Independent Test**: Open text entry → edit content → save → refresh → changes persist

### Implementation for User Story 5

- [x] T035 [US5] Add edit mode to entry viewer: toggle between view and edit states
- [x] T036 [US5] Wire edit save to diary service: `updateTextEntry()` persists changes
- [x] T037 [US5] Add entry list item click handler to open entry viewer from calendar
- [x] T038 [US5] Add voice entry playback in entry viewer (reuse audio service)

**Checkpoint**: Text entries editable, voice entries playable, all changes persist

---

## Phase 8: User Story 6 — Delete Diary Entry (Priority: P3)

**Goal**: User can delete entries with confirmation

**Independent Test**: Open entry → click delete → confirm → entry removed from calendar

### Implementation for User Story 6

- [x] T039 [US6] Add delete button to entry viewer with confirmation dialog
- [x] T040 [US6] Wire delete to diary service: `deleteEntry()` removes the entry
- [x] T041 [US6] Emit `entries:changed` event after delete to refresh calendar
- [x] T042 [US6] Handle delete of last entry for a date: calendar indicator removed

**Checkpoint**: All 6 user stories complete and independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, error handling, and UX improvements

- [x] T043 [P] Add responsive CSS media queries for mobile (< 375px), tablet (768px), desktop in `src/styles/main.css`
- [x] T044 [P] Add loading states and error toasts for async operations (DB init, save, delete)
- [x] T045 [P] Add empty state illustrations/messages for no-entries scenarios
- [x] T046 Wire all event bus events: `entries:changed` refreshes calendar, `date:selected` opens list, `navigate:view` switches views
- [x] T047 Run quickstart.md validation scenarios (V1-V6) to verify end-to-end flows
- [x] T048 [P] Add favicon and app title in `src/index.html`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; integrates with US1 mode toggle
- **US4 (Phase 5)**: Depends on Foundational; needs entries from US1/US2 to display
- **US3 (Phase 6)**: Depends on Foundational + US2 (voice entries to transcribe)
- **US5 (Phase 7)**: Depends on Foundational + US4 (calendar to open entries from)
- **US6 (Phase 8)**: Depends on Foundational + US5 (entry viewer to delete from)
- **Polish (Phase 9)**: Depends on all user stories

### User Story Dependencies

```
Foundational (Phase 2)
    ├── US1 (P1) — written entries ──────────────────┐
    ├── US2 (P1) — voice entries ────────────────────┤
    │                                                ├── US4 (P2) — calendar
    │                                                │       ├── US5 (P3) — edit
    │                                                │       └── US6 (P3) — delete
    └── US3 (P2) — voice-to-text (needs US2) ───────┘
```

### Parallel Opportunities

- T004, T005, T006, T007 in Setup can run in parallel
- T010, T011 in Foundational can run in parallel
- US1 and US2 can run in parallel after Foundational
- US3 and US4 can run in parallel after US1+US2
- US5 and US6 can run in parallel after US4
- T043, T044, T045, T048 in Polish can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (written entries)
4. Complete Phase 5: US4 (calendar)
5. **STOP and VALIDATE**: Create written entries, see them on calendar, navigate months
6. Deployable demo with basic diary functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US4 → MVP: text diary with calendar 🎯
3. Add US2 → Voice recording works
4. Add US3 → Voice-to-text conversion
5. Add US5 + US6 → Full CRUD
6. Polish → Production quality

---

## Notes

- All tasks include exact file paths for implementation
- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to user story for traceability
- Each phase checkpoint can be validated independently
- Audio BLOBs stored directly in SQLite — may hit localStorage limits for very long recordings; document this as a known constraint

---

## Phase 10: Convergence

**Purpose**: Close gaps between spec requirements and current implementation

- [x] T049 [US3] Add post-recording transcription for existing voice entries without transcripts in `src/components/entry-viewer.js` — play audio via speakers and capture via SpeechRecognition as fallback, with clear "transcribing..." status (FR-006, US3/AC1, partial)
- [x] T050 [US3] Make transcript editable before saving as text entry in `src/components/entry-viewer.js` — show textarea instead of read-only div so user can review/edit before saving (FR-007, US3/AC3, partial)
- [x] T051 [US3] Add cancel button to transcript review flow in `src/components/entry-viewer.js` — allow user to dismiss transcript without creating a text entry (US3/AC4, partial)
- [x] T052 Add audio size guard in `src/components/voice-recorder.js` — warn user when recording exceeds safe localStorage threshold (~3MB), suggest shorter recording or show size indicator (SC-008, partial)

---

## Phase 11: Mood Tracking (from Spikes)

**Purpose**: Implement AI mood detection, voice tone analysis, fusion, visualization, and override — extracted from validated spike prototypes 001-008

**User Stories**: US7 (AI Mood Detection), US8 (Voice Tone Mood Detection)

### Foundation

- [x] T053 [US7] Install mood dependencies: `npm install sentiment @huggingface/transformers chart.js chartjs-adapter-date-fns` (FR-020)
- [x] T054 [US7] Add mood column migrations (ai_mood, ai_confidence, user_mood, voice_mood, voice_confidence) and `query()` helper to `src/db/database.js` (FR-023)
- [x] T055 [US7] Create canonical mood constants (MOODS, getDisplayMood, getMoodEmoji, getMoodLabel) in `src/services/moods.js` (FR-024, FR-025)

### Text Sentiment (from spikes 001, 002, 008)

- [x] T056 [US7] Create AFINN sentiment analysis + unified analyze() with fallback chain in `src/services/sentiment.js` (FR-020, FR-027)
- [x] T057 [US7] Create DistilBERT Web Worker in `src/workers/sentiment.worker.js` (FR-020, SC-010)
- [x] T058 [US7] Create worker message client (initWorker, analyzeText, isReady) in `src/services/sentiment-worker-client.js` (FR-020)

### Voice Tone (from spikes 004, 005)

- [x] T059 [US8] Create audio feature extraction (detectPitch, computeEnergy, computeSpectralCentroid, computeZeroCrossingRate) in `src/services/voice-tone.js` (FR-021)
- [x] T060 [US8] Create voice mood classifiers (classifyMood full + classifyVoice simplified) in `src/services/voice-tone.js` (FR-021)

### Fusion (from spike 005)

- [x] T061 [US8] Create mood fusion pipeline (text primary, voice secondary, conflict detection) in `src/services/mood-fusion.js` (FR-022)

### Persistence & CRUD

- [x] T062 [US7] Update diary service: add mood params to create functions, add overrideMood(), getMoodEntries(), getMoodStats() in `src/services/diary.js` (FR-023, FR-025)

### UI Components

- [x] T063 [US7] Create mood override dropdown selector in `src/components/mood-override.js` (FR-025)
- [x] T064 [US7] Create mood timeline chart with Chart.js, legend, stat cards, range selector in `src/components/mood-chart.js` (FR-026, FR-028, SC-011)
- [x] T065 [US7] Add mood badge display + override selector to entry viewer in `src/components/entry-viewer.js` (FR-024, FR-025)
- [x] T066 [US7] Add mood analysis to text entry save flow in `src/components/entry-editor.js` (FR-020)
- [x] T067 [US7] Add mood indicators to entry list items in `src/components/entry-list.js` (FR-024)

### Integration

- [x] T068 [US7] Initialize sentiment worker at app boot in `src/main.js` (SC-010)
- [x] T069 [US7] Add mood chart component to main app view in `src/main.js` (FR-026)
- [x] T070 [US7] Add mood-related CSS (dark theme, colored mood badges, chart styles) in `src/styles/main.css` (FR-024)

**Checkpoint**: All 6 user stories complete. Mood tracking fully functional with text sentiment, voice tone, fusion, override, chart, and offline fallback.

---

## Phase 12: Convergence

**Purpose**: Close gaps between spec requirements and current implementation

- [x] T071 [US8] Add voice tone mood analysis to voice entry save flow in `src/components/entry-editor.js` — extract audio features from recorded audio, run classifyVoice(), pass mood params (voiceMood, voiceConfidence) to createVoiceEntry() per FR-021, US8/AC1 (partial)
- [x] T072 [US8] Add text sentiment analysis for voice entries with transcripts in `src/components/entry-editor.js` — when voice entry has transcript, run analyze() on text, fuse with voice tone via fuseMood(), pass combined mood to createVoiceEntry() per FR-020, FR-022, US8/AC1 (partial)
- [x] T073 [US8] Implement voice-tone-only mood fallback for voice entries without transcripts in `src/components/entry-editor.js` — when transcript is null/empty, use voice mood as ai_mood directly per spec edge case "Mood detection falls back to voice tone only" (missing)
- [x] T074 [US8] Integrate mood fusion pipeline into entry save flow in `src/components/entry-editor.js` — import and call fuseMood() from mood-fusion.js when both text and voice signals are available per FR-022 (partial)
- [x] T075 [P] Create unit test files per plan in `tests/` — database.test.js, diary.test.js, speech.test.js, date.test.js, dom.test.js for core service/utility coverage per plan test section (missing)
- [x] T076 [P] Create integration test for entry flow in `tests/integration/entry-flow.test.js` — test create → list → view → edit → delete cycle per plan test section (missing)

---

## Phase 13: UI/UX Polish — Spike Mockup Alignment

**Purpose**: Bring UI/UX up to spike mockup quality (from `/speckit-analyze` findings U1–U6, U8, U9, U11)

**Reference**: `.planning/spikes/006-mood-override-ui/index.html` (cards, badges), `.planning/spikes/004-mood-from-voice-tone/index.html` (recorder, visualization)

### Entry Card & Mood Badge Polish (U1, U2)

- [x] T077 Update `.entry-item` CSS in `src/styles/main.css` — change border-radius to 12px, add `border: 1px solid #333`, add hover `border-color: #555` transition, increase padding to 1.25rem to match spike 006 card style (U1)
- [x] T078 Update entry list mood indicator in `src/components/entry-list.js` — wrap mood emoji in a `.mood-badge.mood-{mood}` colored pill element instead of bare emoji text, using existing `.mood-badge` and `.mood-*` classes from main.css (U2)
- [x] T079 Add `.entry-item-type` chip styling in `src/styles/main.css` — convert entry type label to a small pill/badge with rounded background (e.g., `background: #1e293b; color: #60a5fa; border-radius: 12px; padding: 2px 8px; font-size: 0.7rem`) (U9)

### Voice Recorder Enhancement (U4, U5)

- [x] T080 Add audio visualization canvas to voice recorder in `src/components/voice-recorder.js` — add `<canvas>` element above record button, wire up `AnalyserNode` from `MediaStream` for real-time waveform rendering during recording, clear canvas when stopped (U4)
- [x] T081 Add canvas waveform drawing loop in `src/components/voice-recorder.js` — use `requestAnimationFrame` to draw time-domain data from `AnalyserNode` as a waveform on the canvas, styled with `#22c55e` stroke color on `#111` background matching spike 004 (U4)
- [x] T082 Redesign record button in `src/components/voice-recorder.js` and `src/styles/main.css` — increase to 100px, replace mic emoji with inner dot element that transforms to a rounded square when recording, add `border: 4px solid #ef4444` and `background: #1a1a1a` matching spike 004 (U5)
- [x] T083 Add `.voice-recorder canvas` CSS in `src/styles/main.css` — set `width: 100%; height: 80px; background: #111; border-radius: 6px; margin-bottom: 1rem` matching spike 004 visualizer style (U4)

### Entry Viewer Refinements (U3, U6, U8, U11)

- [x] T084 [P] Add override badge to mood section in `src/components/entry-viewer.js` — when `entry.user_mood` is set and differs from `entry.ai_mood`, show a small `.override-badge` span with text "overridden" styled `color: #f97316; background: #451a03; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.65rem` matching spike 006 (U3)
- [x] T085 [P] Add voice feature meters to voice entry viewer in `src/components/entry-viewer.js` — after audio playback element, show a `.meter-container` with horizontal bars for pitch, energy, brightness (spectral centroid), and zero-crossing rate using `entry.voice_mood`/`entry.voice_confidence` data, styled with `.meter-row`, `.meter-bar`, `.meter-fill` classes matching spike 004 (U6)
- [x] T086 [P] Add meter CSS in `src/styles/main.css` — `.meter-container` (background #1a1a1a, border 1px solid #333, border-radius 8px, padding 1rem), `.meter-row` (flex, align-items center, gap 0.75rem), `.meter-label` (0.8rem, #888, min-width 80px), `.meter-bar` (flex 1, height 8px, background #222, border-radius 4px), `.meter-fill` (height 100%, border-radius 4px, transition width 0.1s), `.meter-value` (0.8rem, #aaa, min-width 50px) matching spike 004 (U6)
- [x] T087 [P] Add fusion result display in `src/components/entry-viewer.js` — when entry has both `ai_mood` and `voice_mood`, show a fusion summary card with text mood vs voice mood side-by-side, agreement/conflict indicator (green `.agree-box` or orange `.conflict-box`), and fused confidence — import `fuseMood` from mood-fusion.js matching spike 005 (U8)
- [x] T088 [P] Add fusion card CSS in `src/styles/main.css` — `.fusion-card` (background #1a1a1a, border 2px solid #7c3aed, border-radius 12px, padding 1.5rem), `.conflict-box` (background #451a03, border 1px solid #f97316, border-radius 6px, padding 0.75rem, color #fb923c), `.agree-box` (background #052e16, border 1px solid #22c55e, border-radius 6px, padding 0.75rem, color #4ade80) matching spike 005 (U8)
- [x] T089 [P] Add loading spinner for transcription in `src/components/entry-viewer.js` — replace text-only "Transcribing..." status with a `.status-bar.loading` element containing a `.loader` spinner (12px circle with rotating border), styled with `border-color: #2563eb; color: #60a5fa` matching spike 001 (U11)
- [x] T090 [P] Add loader CSS in `src/styles/main.css` — `.loader` (inline-block, 12px, border 2px solid #333, border-top-color #60a5fa, border-radius 50%, animation spin 0.8s linear infinite), `.status-bar` (background #1a1a1a, border 1px solid #333, border-radius 8px, padding 0.75rem 1rem, font-size 0.85rem), `.status-bar.loading` (border-color #2563eb, color #60a5fa), `.status-bar.ready` (border-color #22c55e, color #4ade80) matching spike 001 (U11)
