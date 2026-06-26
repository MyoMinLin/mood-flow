# Feature Specification: Voice Diary App

**Feature Branch**: `001-voice-diary-app`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: "Build a web and responsive application that can create Diary by writing or voice modes. Then voice mode can covert to text whenever wanted and save as Text also. The list of diary shows in Calendar mode in default home page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Written Diary Entry (Priority: P1)

A user opens the app and wants to write a diary entry for today. They tap "New Entry," type their thoughts in a text editor, and save the entry. The entry appears on the calendar for today's date.

**Why this priority**: Written diary is the foundational capability — without it, there is no product. It is the simplest mode and establishes the core data model (diary entry with date and content).

**Independent Test**: Can be fully tested by opening the app, creating a written entry, and verifying it appears on the calendar. Delivers immediate value as a basic diary tool.

**Acceptance Scenarios**:

1. **Given** the user is on the home page, **When** they tap "New Entry" and type text content, **Then** a new diary entry is created and saved with today's date
2. **Given** the user has created an entry, **When** they return to the home page, **Then** the entry appears on the calendar at its saved date
3. **Given** the user is creating an entry, **When** they leave the editor without saving, **Then** the entry is not persisted

---

### User Story 2 - Create a Voice Diary Entry (Priority: P1)

A user wants to record their thoughts by speaking. They tap "New Entry," switch to voice mode, and speak into their microphone. The app records the audio and saves it as a diary entry associated with today's date.

**Why this priority**: Voice input is a core differentiator of this product. Users who prefer speaking over typing (or are unable to type comfortably) need this to use the app at all.

**Independent Test**: Can be fully tested by creating a voice entry, verifying the audio is saved, and confirming it appears on the calendar. Delivers the primary unique value of the product.

**Acceptance Scenarios**:

1. **Given** the user is on the new entry screen, **When** they switch to voice mode and tap the record button, **Then** the app begins capturing audio from the microphone
2. **Given** the user is recording, **When** they tap the stop button, **Then** the recording is saved as a diary entry with today's date
3. **Given** the user is recording, **When** they tap cancel, **Then** the recording is discarded and no entry is created
4. **Given** the user has recorded a voice entry, **When** they play it back from the diary view, **Then** the audio plays clearly

---

### User Story 3 - Convert Voice Entry to Text (Priority: P2)

A user has a voice diary entry and wants to see it as text. They open the voice entry, tap "Convert to Text," and the app transcribes the audio. The user reviews the transcription and can save it as a text entry (either replacing the voice entry or as a new text entry alongside it).

**Why this priority**: This bridges voice and written modes, making voice entries searchable and readable. It is not required for the MVP voice-recording flow but adds significant value.

**Independent Test**: Can be tested by creating a voice entry, converting it to text, and verifying the text is saved and accurate. Delivers value by making voice entries accessible in text form.

**Acceptance Scenarios**:

1. **Given** the user has a voice diary entry, **When** they open it and tap "Convert to Text," **Then** the app transcribes the audio and displays the text
2. **Given** the transcription is displayed, **When** the user taps "Save as Text," **Then** a new text diary entry is created with the transcribed content
3. **Given** the transcription is displayed, **When** the user edits the text before saving, **Then** the saved entry reflects the edited version
4. **Given** the transcription is in progress, **When** the user cancels, **Then** no text entry is created and the original voice entry remains unchanged

---

### User Story 4 - Browse Diary Entries on Calendar (Priority: P2)

A user opens the app and sees a calendar view as the default home page. Days with diary entries are visually highlighted. The user taps a day to see the list of entries for that date.

**Why this priority**: The calendar view is the primary navigation paradigm. Without it, users cannot browse or find past entries. It depends on at least one entry type (written or voice) existing.

**Independent Test**: Can be tested by creating several entries on different dates, then navigating the calendar to verify entries appear on correct days and can be opened.

**Acceptance Scenarios**:

1. **Given** the user has diary entries on multiple dates, **When** they open the app, **Then** a calendar is displayed with those dates visually marked
2. **Given** the user is viewing the calendar, **When** they tap a date with entries, **Then** a list of entries for that date is shown
3. **Given** the user is viewing the calendar, **When** they tap a date with no entries, **Then** the app indicates no entries exist for that date
4. **Given** the user is viewing the calendar, **When** they navigate to a different month, **Then** entries for that month are displayed correctly

---

### User Story 5 - View and Edit a Diary Entry (Priority: P3)

A user opens an existing text entry from the calendar and wants to make changes. They edit the content and save. For voice entries, they can replay the audio.

**Why this priority**: Editing existing entries is important for long-term use but is not required for the initial creation flow. The app is functional without edit capability.

**Independent Test**: Can be tested by creating an entry, opening it, editing content, saving, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** the user has a text diary entry, **When** they open it from the calendar, **Then** the content is displayed and editable
2. **Given** the user has edited a text entry, **When** they save, **Then** the updated content is persisted
3. **Given** the user has a voice entry, **When** they open it, **Then** they can play back the audio

---

### User Story 6 - Delete a Diary Entry (Priority: P3)

A user wants to remove a diary entry. They open the entry and tap delete. The entry is removed and no longer appears on the calendar.

**Why this priority**: Deletion is a standard data management feature but not critical for initial use. Users can still create and browse entries without it.

**Independent Test**: Can be tested by creating an entry, deleting it, and verifying it no longer appears on the calendar.

**Acceptance Scenarios**:

1. **Given** the user has a diary entry, **When** they open it and tap delete, **Then** the entry is removed from the system
2. **Given** the user has deleted an entry, **When** they view the calendar, **Then** the deleted entry no longer appears

---

### User Story 7 - AI Mood Detection (Priority: P2)

A user writes a diary entry and the app automatically detects the mood/sentiment. The mood appears as a colored badge on the entry. The user can view mood trends over time on a chart and override the AI-detected mood if it doesn't match how they feel.

**Why this priority**: Mood tracking is the primary differentiator beyond a basic diary. It adds emotional awareness and self-reflection capability. Depends on text entries (US1) existing.

**Independent Test**: Create a text entry → mood badge appears → view mood chart → override mood → verify override persists.

**Acceptance Scenarios**:

1. **Given** the user creates a text diary entry, **When** the entry is saved, **Then** the app automatically detects and displays the mood as a colored badge
2. **Given** an entry has an AI-detected mood, **When** the user clicks the mood badge, **Then** a dropdown appears allowing them to select a different mood
3. **Given** the user has overridden the mood, **When** they reload the page, **Then** the override persists and displays instead of the AI mood
4. **Given** the user has multiple entries with mood data, **When** they view the mood chart, **Then** a timeline shows mood trends with color-coded points
5. **Given** the mood chart is displayed, **When** the user selects a different time range (7d/14d/30d), **Then** the chart updates to show the selected range

---

### User Story 8 - Voice Tone Mood Detection (Priority: P3)

A user records a voice entry and the app analyzes the voice tone to detect mood. The voice mood is combined with text sentiment (if available) into a fused result.

**Why this priority**: Voice tone adds a second mood signal that improves accuracy. Depends on voice recording (US2) and mood detection (US7).

**Independent Test**: Record a voice entry with transcript → mood badge shows fused result → voice tone contributes to confidence.

**Acceptance Scenarios**:

1. **Given** the user records a voice entry with a transcript, **When** the entry is saved, **Then** the app analyzes both text sentiment and voice tone
2. **Given** text and voice moods agree, **When** the fused mood is computed, **Then** confidence is boosted
3. **Given** text and voice moods disagree, **When** the fused mood is computed, **Then** text wins, confidence is reduced, and the conflict is flagged

---

### Edge Cases

- What happens when the user tries to record a voice entry but denies microphone permission? The app must display a clear message explaining that microphone access is required and provide instructions to enable it.
- What happens when the user tries to convert a very long voice entry (e.g., 30+ minutes) to text? The app must handle long audio gracefully, showing progress and not timing out.
- What happens when the user has poor or no internet connectivity? The app must function offline for creating and viewing entries; voice-to-text conversion may require connectivity.
- What happens when two entries are created for the same date? Both entries must appear in the list for that date.
- What happens when the browser does not support audio recording? The app must detect unsupported browsers and inform the user, while still allowing written entries.
- What happens when the AI sentiment model fails to load? The app must fall back to the instant AFINN engine and still detect mood (with reduced accuracy).
- What happens when voice tone analysis is ambiguous? The fused mood must show reduced confidence and flag the conflict to the user.
- What happens when the user overrides the AI mood? The override must persist across page reloads and take precedence over the AI-detected mood in all displays.
- What happens when an entry has no text content (voice-only without transcript)? Mood detection falls back to voice tone only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create diary entries using a text editor (writing mode)
- **FR-002**: System MUST allow users to create diary entries by recording audio (voice mode)
- **FR-003**: System MUST allow users to switch between writing mode and voice mode when creating a new entry
- **FR-004**: System MUST save voice recordings as diary entries with a timestamp and date
- **FR-005**: System MUST allow users to play back voice diary entries
- **FR-006**: System MUST provide a "Convert to Text" action on voice entries that transcribes the audio
- **FR-007**: System MUST allow users to review and edit transcribed text before saving
- **FR-008**: System MUST allow users to save transcribed text as a new text diary entry
- **FR-009**: System MUST display a calendar view as the default home page
- **FR-010**: System MUST visually indicate which calendar dates have diary entries
- **FR-011**: System MUST allow users to tap a calendar date to view entries for that date
- **FR-012**: System MUST display entries in a list grouped by date
- **FR-013**: System MUST allow users to view the full content of an existing entry
- **FR-014**: System MUST allow users to edit existing text diary entries
- **FR-015**: System MUST allow users to delete diary entries
- **FR-016**: System MUST work responsively across desktop, tablet, and mobile screen sizes
- **FR-017**: System MUST persist diary entries so they survive page refresh and browser restart
- **FR-018**: System MUST request and handle microphone permissions for voice recording
- **FR-019**: System MUST display meaningful error messages when operations fail (e.g., microphone denied, save failed)

### Mood Tracking Requirements

- **FR-020**: System MUST automatically detect the mood/sentiment of text diary entries using AI (text sentiment analysis)
- **FR-021**: System MUST detect mood from voice recordings using audio feature analysis (pitch, energy, spectral characteristics)
- **FR-022**: System MUST combine text sentiment and voice tone signals into a single fused mood, with text as primary and voice as secondary
- **FR-023**: System MUST persist mood data (AI-detected mood, confidence, voice mood) with each diary entry
- **FR-024**: System MUST display the detected mood as a colored badge on each diary entry
- **FR-025**: System MUST allow users to override the AI-detected mood with a manual mood selection (positive, content, neutral, anxious, negative, mixed)
- **FR-026**: System MUST display a mood timeline chart showing mood trends over time with configurable date ranges
- **FR-027**: System MUST provide an instant offline fallback (AFINN) for text sentiment when the AI model is unavailable, with the higher-accuracy model loading asynchronously in the background
- **FR-028**: System MUST show mood distribution statistics (count per mood category) for the selected time range

### Key Entities

- **Diary Entry**: Represents a single diary record. Key attributes: unique identifier, date, creation timestamp, content type (text or voice), text content (for written or transcribed entries), audio data (for voice entries), last modified timestamp, AI-detected mood, mood confidence, user mood override, voice mood, voice mood confidence.
- **Calendar Date**: A date that may have zero or more diary entries associated with it. Used for navigation and display grouping.
- **Mood**: A sentiment label associated with an entry. Values: positive, content, neutral, anxious, negative, mixed. Sources: AI text sentiment, AI voice tone, fused (text+voice), or user override.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a written diary entry in under 30 seconds from opening the app
- **SC-002**: Users can create a voice diary entry in under 1 minute from opening the app
- **SC-003**: Voice-to-text transcription produces text that is at least 85% accurate for clear speech in a quiet environment
- **SC-004**: The calendar view loads and displays entry indicators in under 2 seconds
- **SC-005**: 90% of users can successfully create their first diary entry (written or voice) without external help
- **SC-006**: The app works correctly on all modern browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile
- **SC-007**: Users can browse entries from the previous month within 3 taps/clicks
- **SC-008**: Voice entries up to 30 minutes in length can be recorded and saved without errors
- **SC-009**: Text sentiment analysis completes in under 2 seconds for entries up to 5000 words
- **SC-010**: The AI mood model loads asynchronously in the background without blocking UI interaction; the instant AFINN fallback is available immediately
- **SC-011**: The mood timeline chart renders in under 1 second for up to 365 entries

## Assumptions

- Users access the app via a modern web browser with JavaScript enabled
- Users have a device with a microphone for voice recording (not required for written entries)
- Voice-to-text conversion uses the browser's built-in Web Speech API (no cloud service required)
- Entries are stored locally via sql.js (SQLite WASM) persisted to localStorage
- The app is single-user (no multi-user authentication required for v1)
- The calendar displays entries in the user's local timezone
- Audio recordings are stored in a browser-compatible format (e.g., WebM, MP3)
- No rich text formatting is required for v1 — plain text entries are sufficient
- Mood analysis runs entirely client-side (no data leaves the device) — privacy-first
- The DistilBERT text sentiment model is downloaded on first use (~50MB quantized) and cached by the browser
