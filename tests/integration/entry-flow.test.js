import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/db/database.js', () => {
  let autoId = 0;
  const rows = [];

  // Must match SELECT column order in diary.js
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
      if (sql.includes('DISTINCT entry_date')) {
        const startDate = params[0];
        const endDate = params[1];
        const matching = rows.filter(r => r.entry_date >= startDate && r.entry_date <= endDate);
        if (!matching.length) return [];
        const uniqueDates = [...new Set(matching.map(r => r.entry_date))];
        return [{ values: uniqueDates.map(d => [d]) }];
      }
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
  };
});

import {
  createTextEntry, createVoiceEntry, getEntriesByDate, getEntryDatesForMonth,
  getEntryById, updateTextEntry, deleteEntry,
} from '../../src/services/diary.js';
import { _reset } from '../../src/db/database.js';

describe('Integration: Entry Flow', () => {
  beforeEach(() => { _reset(); });

  it('full lifecycle: create → list → view → edit → delete', () => {
    const entry = createTextEntry({ date: '2026-06-15', text: 'Integration test entry', aiMood: 'positive', aiConfidence: 0.8 });
    expect(entry).toBeTruthy();
    expect(entry.id).toBeGreaterThan(0);
    expect(entry.text_content).toBe('Integration test entry');

    const entries = getEntriesByDate('2026-06-15');
    expect(entries.length).toBe(1);
    expect(entries[0].text_content).toBe('Integration test entry');

    const viewed = getEntryById(entry.id);
    expect(viewed).toBeTruthy();
    expect(viewed.text_content).toBe('Integration test entry');
    expect(viewed.ai_mood).toBe('positive');

    const updated = updateTextEntry(entry.id, 'Updated integration test');
    expect(updated.text_content).toBe('Updated integration test');

    const reViewed = getEntryById(entry.id);
    expect(reViewed.text_content).toBe('Updated integration test');

    deleteEntry(entry.id);
    expect(getEntriesByDate('2026-06-15').length).toBe(0);
  });

  it('multiple entries on same date', () => {
    createTextEntry({ date: '2026-06-15', text: 'First' });
    createTextEntry({ date: '2026-06-15', text: 'Second' });
    createTextEntry({ date: '2026-06-15', text: 'Third' });
    expect(getEntriesByDate('2026-06-15').length).toBe(3);
  });

  it('entries on different dates', () => {
    createTextEntry({ date: '2026-06-14', text: 'Yesterday' });
    createTextEntry({ date: '2026-06-15', text: 'Today' });
    createTextEntry({ date: '2026-06-16', text: 'Tomorrow' });
    expect(getEntriesByDate('2026-06-14').length).toBe(1);
    expect(getEntriesByDate('2026-06-15').length).toBe(1);
    expect(getEntriesByDate('2026-06-16').length).toBe(1);
    expect(getEntriesByDate('2026-06-17').length).toBe(0);
  });

  it('voice entries with mood data', () => {
    const entry = createVoiceEntry({
      date: '2026-06-15', audioData: new Uint8Array([1, 2, 3, 4, 5]),
      mimeType: 'audio/webm', durationSecs: 30, transcript: 'Hello world',
      aiMood: 'positive', aiConfidence: 0.7, voiceMood: 'positive', voiceConfidence: 0.6,
    });
    expect(entry.content_type).toBe('voice');
    expect(entry.ai_mood).toBe('positive');
    expect(entry.voice_mood).toBe('positive');
  });

  it('calendar date tracking', () => {
    createTextEntry({ date: '2026-06-01', text: 'Start' });
    createTextEntry({ date: '2026-06-15', text: 'Mid' });
    createTextEntry({ date: '2026-06-30', text: 'End' });

    // Verify entries were created
    expect(getEntriesByDate('2026-06-01').length).toBe(1);
    expect(getEntriesByDate('2026-06-15').length).toBe(1);
    expect(getEntriesByDate('2026-06-30').length).toBe(1);

    const dates = getEntryDatesForMonth(2026, 5);
    expect(dates.length).toBe(3);
    expect(dates).toContain('2026-06-01');
    expect(dates).toContain('2026-06-15');
    expect(dates).toContain('2026-06-30');
  });
});
