import { getDb, save, query } from '../db/database.js';
import { format } from '../utils/date.js';

export function createTextEntry({ date, text, aiMood, aiConfidence, voiceMood, voiceConfidence }) {
  const db = getDb();
  db.run(
    `INSERT INTO diary_entries (entry_date, content_type, text_content, ai_mood, ai_confidence, voice_mood, voice_confidence) VALUES (?, 'text', ?, ?, ?, ?, ?)`,
    [date, text, aiMood || null, aiConfidence || null, voiceMood || null, voiceConfidence || null]
  );
  const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  save();
  return getEntryById(id);
}

export function createVoiceEntry({ date, audioData, mimeType, durationSecs, transcript, aiMood, aiConfidence, voiceMood, voiceConfidence, avgPitch, pitchVar, avgEnergy, avgCentroid, avgZCR }) {
  const db = getDb();
  db.run(
    `INSERT INTO diary_entries (entry_date, content_type, audio_data, audio_mime, duration_secs, transcript, ai_mood, ai_confidence, voice_mood, voice_confidence, avg_pitch, pitch_var, avg_energy, avg_centroid, avg_zcr) VALUES (?, 'voice', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, audioData, mimeType, durationSecs, transcript || null, aiMood || null, aiConfidence || null, voiceMood || null, voiceConfidence || null, avgPitch || null, pitchVar || null, avgEnergy || null, avgCentroid || null, avgZCR || null]
  );
  const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  save();
  return getEntryById(id);
}

export function getEntriesByDate(date) {
  const db = getDb();
  const results = db.exec(
    `SELECT id, entry_date, content_type, text_content, audio_mime, duration_secs, created_at, updated_at, transcript, ai_mood, ai_confidence, user_mood, voice_mood, voice_confidence, avg_pitch, pitch_var, avg_energy, avg_centroid, avg_zcr
     FROM diary_entries WHERE entry_date = ? ORDER BY created_at DESC`,
    [date]
  );
  if (!results.length) return [];
  return results[0].values.map(rowToEntry);
}

export function getEntryDatesForMonth(year, month) {
  const db = getDb();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const results = db.exec(
    `SELECT DISTINCT entry_date FROM diary_entries WHERE entry_date >= ? AND entry_date <= ?`,
    [startDate, endDate]
  );
  if (!results.length) return [];
  return results[0].values.map(r => r[0]);
}

export function getEntryById(id) {
  const db = getDb();
  const results = db.exec(
    `SELECT id, entry_date, content_type, text_content, audio_mime, duration_secs, created_at, updated_at, transcript, ai_mood, ai_confidence, user_mood, voice_mood, voice_confidence, avg_pitch, pitch_var, avg_energy, avg_centroid, avg_zcr
     FROM diary_entries WHERE id = ?`,
    [id]
  );
  if (!results.length || !results[0].values.length) return null;
  return rowToEntry(results[0].values[0]);
}

export function updateTextEntry(id, text) {
  const db = getDb();
  db.run(
    `UPDATE diary_entries SET text_content = ?, updated_at = datetime('now') WHERE id = ?`,
    [text, id]
  );
  save();
  return getEntryById(id);
}

export function deleteEntry(id) {
  const db = getDb();
  db.run('DELETE FROM diary_entries WHERE id = ?', [id]);
  save();
}

export function getAudioData(id) {
  const db = getDb();
  const results = db.exec(
    `SELECT audio_data, audio_mime FROM diary_entries WHERE id = ?`,
    [id]
  );
  if (!results.length || !results[0].values.length) return null;
  const [audioData, mimeType] = results[0].values[0];
  if (!audioData) return null;
  return { audioData: new Uint8Array(audioData), mimeType };
}

function rowToEntry(row) {
  return {
    id: row[0],
    entry_date: row[1],
    content_type: row[2],
    text_content: row[3],
    audio_mime: row[4],
    duration_secs: row[5],
    created_at: row[6],
    updated_at: row[7],
    transcript: row[8] || null,
    ai_mood: row[9] || null,
    ai_confidence: row[10] || null,
    user_mood: row[11] || null,
    voice_mood: row[12] || null,
    voice_confidence: row[13] || null,
    avg_pitch: row[14] || null,
    pitch_var: row[15] || null,
    avg_energy: row[16] || null,
    avg_centroid: row[17] || null,
    avg_zcr: row[18] || null,
  };
}

/**
 * Override the AI-detected mood with user's choice.
 * From spike 007: overrideMood(id, mood).
 */
export function overrideMood(id, mood) {
  const db = getDb();
  db.run('UPDATE diary_entries SET user_mood = ?, updated_at = datetime(\'now\') WHERE id = ?', [mood, id]);
  save();
  return getEntryById(id);
}

/**
 * Get speaker profile from stored audio features.
 * Computes mean and stddev of each feature across recent voice entries.
 * Returns null if fewer than minEntries voice entries exist.
 * @param {number} lookback - Number of entries to consider
 * @param {number} minEntries - Minimum entries required to build profile
 * @returns {{ pitchMean, pitchStddev, energyMean, energyStddev, centroidMean, centroidStddev, zcrMean, zcrStddev } | null}
 */
export function getSpeakerProfile(lookback = 30, minEntries = 10) {
  const rows = query(
    `SELECT avg_pitch, avg_energy, avg_centroid, avg_zcr
     FROM diary_entries
     WHERE content_type = 'voice' AND avg_pitch IS NOT NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [lookback]
  );
  if (rows.length < minEntries) return null;

  const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const stddev = (arr, m) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);

  const pitches = rows.map(r => r.avg_pitch);
  const energies = rows.map(r => r.avg_energy);
  const centroids = rows.map(r => r.avg_centroid);
  const zcrs = rows.map(r => r.avg_zcr);

  const pitchMean = mean(pitches);
  const energyMean = mean(energies);
  const centroidMean = mean(centroids);
  const zcrMean = mean(zcrs);

  return {
    pitchMean,
    pitchStddev: stddev(pitches, pitchMean) || 1,
    energyMean,
    energyStddev: stddev(energies, energyMean) || 1,
    centroidMean,
    centroidStddev: stddev(centroids, centroidMean) || 1,
    zcrMean,
    zcrStddev: stddev(zcrs, zcrMean) || 1,
  };
}

/**
 * Get entries with mood data for chart visualization.
 * Returns entries from the last N days that have mood data.
 * @param {number} days - Number of days to look back
 */
export function getMoodEntries(days = 30, anchorDate) {
  const anchor = anchorDate || format(new Date());
  return query(
    `SELECT id, entry_date, text_content, ai_mood, ai_confidence, user_mood, voice_mood, voice_confidence
     FROM diary_entries
     WHERE ai_mood IS NOT NULL
     AND entry_date >= date(?, '-' || ? || ' days')
     AND entry_date <= ?
     ORDER BY entry_date ASC`,
    [anchor, days, anchor]
  );
}

/**
 * Get mood distribution stats for a time range.
 * @param {number} days
 */
export function getMoodStats(days = 30) {
  const rows = query(
    `SELECT
       COALESCE(user_mood, ai_mood) as mood,
       COUNT(*) as count
     FROM diary_entries
     WHERE ai_mood IS NOT NULL
     AND entry_date >= date('now', '-' || ? || ' days')
     GROUP BY mood`,
    [days]
  );
  const stats = { positive: 0, content: 0, neutral: 0, anxious: 0, negative: 0, mixed: 0 };
  for (const row of rows) {
    if (stats.hasOwnProperty(row.mood)) {
      stats[row.mood] = row.count;
    }
  }
  return stats;
}
