# Data Model: Voice Diary App

**Date**: 2026-06-20
**Feature**: Voice Diary App

## Entities

### diary_entries

The core entity representing a single diary record.

| Column        | Type    | Constraints                  | Description                                    |
|---------------|---------|------------------------------|------------------------------------------------|
| id            | INTEGER | PRIMARY KEY AUTOINCREMENT    | Unique identifier                              |
| entry_date    | TEXT    | NOT NULL                     | Date of entry in YYYY-MM-DD format             |
| content_type  | TEXT    | NOT NULL, CHECK IN ('text', 'voice') | Whether entry is written text or voice recording |
| text_content  | TEXT    | NULLABLE                     | Written text or transcribed text (for text type) |
| audio_data    | BLOB    | NULLABLE                     | Raw audio bytes (for voice type)               |
| audio_mime    | TEXT    | NULLABLE                     | MIME type of audio (e.g., audio/webm)          |
| duration_secs | INTEGER | NULLABLE                     | Audio duration in seconds (for voice type)     |
| created_at    | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 creation timestamp              |
| updated_at    | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 last-modified timestamp         |
| transcript    | TEXT    | NULLABLE                     | Live transcription text (for voice type) |
| ai_mood       | TEXT    | NULLABLE                     | AI-detected mood label (positive, content, neutral, anxious, negative, mixed) |
| ai_confidence | REAL    | NULLABLE                     | AI mood confidence (0.0–1.0)             |
| user_mood     | TEXT    | NULLABLE                     | User override mood label (takes precedence over ai_mood) |
| voice_mood    | TEXT    | NULLABLE                     | Mood detected from voice tone analysis   |
| voice_confidence | REAL | NULLABLE                     | Voice mood confidence (0.0–1.0)          |

**Indexes**:
- `idx_entry_date` on `entry_date` — fast calendar lookups
- `idx_content_type` on `content_type` — filter by type

**Constraints**:
- If `content_type = 'text'`, then `text_content` MUST NOT be NULL
- If `content_type = 'voice'`, then `audio_data` MUST NOT be NULL

## Schema DDL

```sql
CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'voice')),
    text_content TEXT,
    audio_data BLOB,
    audio_mime TEXT,
    duration_secs INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    transcript TEXT,
    ai_mood TEXT,
    ai_confidence REAL,
    user_mood TEXT,
    voice_mood TEXT,
    voice_confidence REAL
);

CREATE INDEX IF NOT EXISTS idx_entry_date ON diary_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_content_type ON diary_entries(content_type);
```

**Migrations** (for existing databases): Columns `transcript`, `ai_mood`, `ai_confidence`, `user_mood`, `voice_mood`, `voice_confidence` are added via `ALTER TABLE ADD COLUMN` on init. Migrations are idempotent — column-already-exists errors are silently caught.

## State Transitions

### Entry Lifecycle

```
[Created] → [Saved]
   ↓
[Viewed] → [Edited] → [Saved]
   ↓
[Deleted]
```

### Voice Entry with Transcription

```
[Voice Recorded] → [Voice Saved]
                       ↓
              [Convert to Text Requested]
                       ↓
              [Transcription In Progress]
                    ↓         ↓
              [Cancelled]  [Text Preview]
                              ↓         ↓
                         [Edited]   [Saved as Text Entry]
                              ↓
                         [Saved as Text Entry]
```

## Relationships

- **One-to-Many**: One calendar date (`entry_date`) can have multiple `diary_entries`
- **Derived**: A voice entry can be converted to a text entry (new row, same `entry_date`, different `content_type`)
- No foreign keys needed — single-user app, no relational complexity

## Validation Rules

| Rule                                           | Enforced At    |
|------------------------------------------------|----------------|
| `entry_date` must be valid YYYY-MM-DD          | Application    |
| `text_content` required when type is 'text'    | Database CHECK + Application |
| `audio_data` required when type is 'voice'     | Application    |
| `duration_secs` must be positive               | Application    |
| `audio_mime` must be a valid audio MIME type    | Application    |
| `ai_mood` must be one of: positive, content, neutral, anxious, negative, mixed | Application |
| `ai_confidence` must be 0.0–1.0               | Application    |
| `user_mood` (when set) must be a valid mood label | Application  |
| Display mood priority: `user_mood` > `ai_mood` | Application    |

## Mood Detection Pipeline

```
[Text Entry Created]
       ↓
[AFINN Sentiment] ─── instant ──→ mood, score
       ↓
[DistilBERT Worker] ── async ──→ label, score (overrides AFINN if available)
       ↓
[ai_mood, ai_confidence] stored

[Voice Entry Created]
       ↓
[Audio Features] ── pitch, energy, centroid, ZCR ──→ [Voice Mood Classifier]
       ↓
[voice_mood, voice_confidence] stored

[Both Available]
       ↓
[Fusion Pipeline] ── text primary, voice secondary ──→ [fused mood]
       ↓
[ai_mood, ai_confidence] updated (text wins on conflict)
```
