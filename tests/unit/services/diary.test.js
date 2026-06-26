import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../src/db/database.js', () => {
  let autoId = 0;
  const rows = [];

  // Must match SELECT column order in diary.js:
  // id, entry_date, content_type, text_content, audio_mime, duration_secs, created_at, updated_at, transcript, ai_mood, ai_confidence, user_mood, voice_mood, voice_confidence
  function rowToValues(row) {
    return [
      row.id, row.entry_date, row.content_type, row.text_content,
      row.audio_mime, row.duration_secs, row.created_at, row.updated_at,
      row.transcript, row.ai_mood, row.ai_confidence, row.user_mood,
      row.voice_mood, row.voice_confidence,
    ];
  }

  function makeRow(entryDate, contentType, params) {
    const now = new Date().toISOString();
    if (contentType === 'text') {
      return {
        id: ++autoId, entry_date: entryDate, content_type: 'text',
        text_content: params[1], audio_data: null, audio_mime: null, duration_secs: null,
        created_at: now, updated_at: now, transcript: null,
        ai_mood: params[2] || null, ai_confidence: params[3] || null, user_mood: null,
        voice_mood: params[4] || null, voice_confidence: params[5] || null,
      };
    }
    return {
      id: ++autoId, entry_date: entryDate, content_type: 'voice',
      text_content: null, audio_data: params[1], audio_mime: params[2], duration_secs: params[3],
      created_at: now, updated_at: now, transcript: params[4] || null,
      ai_mood: params[5] || null, ai_confidence: params[6] || null, user_mood: null,
      voice_mood: params[7] || null, voice_confidence: params[8] || null,
    };
  }

  const mockDb = {
    run: vi.fn((sql, params) => {
      if (sql.includes('INSERT INTO diary_entries') && sql.includes("'text'")) {
        rows.push(makeRow(params[0], 'text', params));
      } else if (sql.includes('INSERT INTO diary_entries') && sql.includes("'voice'")) {
        rows.push(makeRow(params[0], 'voice', params));
      } else if (sql.includes('DELETE FROM')) {
        const idx = rows.findIndex(r => r.id === params[0]);
        if (idx >= 0) rows.splice(idx, 1);
      } else if (sql.includes('UPDATE') && sql.includes('text_content')) {
        const row = rows.find(r => r.id === params[1]);
        if (row) { row.text_content = params[0]; row.updated_at = new Date().toISOString(); }
      } else if (sql.includes('UPDATE') && sql.includes('user_mood')) {
        const row = rows.find(r => r.id === params[1]);
        if (row) { row.user_mood = params[0]; row.updated_at = new Date().toISOString(); }
      }
    }),
    exec: vi.fn((sql, params) => {
      if (sql.includes('last_insert_rowid')) return [{ values: [[autoId]] }];
      if (sql.includes('WHERE id =')) {
        const row = rows.find(r => r.id === params[0]);
        return row ? [{ values: [rowToValues(row)] }] : [];
      }
      if (sql.includes('WHERE entry_date')) {
        const matching = rows.filter(r => r.entry_date === params[0]);
        return matching.length ? [{ values: matching.map(r => rowToValues(r)) }] : [];
      }
      return [];
    }),
  };

  return {
    getDb: () => mockDb,
    save: vi.fn(),
    query: vi.fn(() => []),
    _reset: () => { rows.length = 0; autoId = 0; },
    _rows: rows,
  };
});

import {
  createTextEntry, createVoiceEntry, getEntriesByDate,
  getEntryById, updateTextEntry, deleteEntry, overrideMood,
} from '../../../src/services/diary.js';
import { _reset } from '../../../src/db/database.js';

describe('diary service', () => {
  beforeEach(() => { _reset(); });

  describe('createTextEntry', () => {
    it('creates a text entry and returns it', () => {
      const entry = createTextEntry({ date: '2026-06-15', text: 'Hello world' });
      expect(entry).toBeTruthy();
      expect(entry.entry_date).toBe('2026-06-15');
      expect(entry.text_content).toBe('Hello world');
      expect(entry.content_type).toBe('text');
    });

    it('stores mood data', () => {
      const entry = createTextEntry({ date: '2026-06-15', text: 'Happy day', aiMood: 'positive', aiConfidence: 0.85 });
      expect(entry.ai_mood).toBe('positive');
    });
  });

  describe('createVoiceEntry', () => {
    it('creates a voice entry with mood data', () => {
      const entry = createVoiceEntry({
        date: '2026-06-15', audioData: new Uint8Array([1, 2, 3]),
        mimeType: 'audio/webm', durationSecs: 30, transcript: 'Hello',
        aiMood: 'positive', aiConfidence: 0.7, voiceMood: 'positive', voiceConfidence: 0.6,
      });
      expect(entry).toBeTruthy();
      expect(entry.content_type).toBe('voice');
    });
  });

  describe('getEntriesByDate', () => {
    it('returns entries for a given date', () => {
      createTextEntry({ date: '2026-06-15', text: 'Entry 1' });
      createTextEntry({ date: '2026-06-15', text: 'Entry 2' });
      createTextEntry({ date: '2026-06-16', text: 'Other' });
      expect(getEntriesByDate('2026-06-15').length).toBe(2);
    });

    it('returns empty array for date with no entries', () => {
      expect(getEntriesByDate('2026-01-01')).toEqual([]);
    });
  });

  describe('getEntryById', () => {
    it('returns entry by id', () => {
      const created = createTextEntry({ date: '2026-06-15', text: 'Find me' });
      const found = getEntryById(created.id);
      expect(found).toBeTruthy();
      expect(found.text_content).toBe('Find me');
    });

    it('returns null for non-existent id', () => {
      expect(getEntryById(999)).toBeNull();
    });
  });

  describe('updateTextEntry', () => {
    it('updates text content', () => {
      const entry = createTextEntry({ date: '2026-06-15', text: 'Original' });
      const updated = updateTextEntry(entry.id, 'Updated');
      expect(updated.text_content).toBe('Updated');
    });
  });

  describe('deleteEntry', () => {
    it('deletes an entry', () => {
      const entry = createTextEntry({ date: '2026-06-15', text: 'Delete me' });
      deleteEntry(entry.id);
      expect(getEntriesByDate('2026-06-15').length).toBe(0);
    });
  });

  describe('overrideMood', () => {
    it('sets user_mood on an entry', () => {
      const entry = createTextEntry({ date: '2026-06-15', text: 'Mood test', aiMood: 'neutral' });
      const overridden = overrideMood(entry.id, 'positive');
      expect(overridden.user_mood).toBe('positive');
    });
  });
});
