import initSqlJs from 'sql.js';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'voice')),
    text_content TEXT,
    audio_data BLOB,
    audio_mime TEXT,
    duration_secs INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_entry_date ON diary_entries(entry_date);
`;

export async function init() {
  const wasmBinary = await fetch('/sql-wasm.wasm').then(r => r.arrayBuffer());
  const SQL = await initSqlJs({ wasmBinary: new Uint8Array(wasmBinary) });

  const stored = localStorage.getItem('voice-diary-db');
  if (stored) {
    const binStr = atob(stored);
    const data = Uint8Array.from(binStr, c => c.charCodeAt(0));
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  db.run(SCHEMA);

  // Migration: add transcript column if missing (for existing databases)
  try {
    db.run('ALTER TABLE diary_entries ADD COLUMN transcript TEXT');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: add mood columns (from spike 007 schema)
  const moodColumns = [
    ['ai_mood', 'TEXT'],
    ['ai_confidence', 'REAL'],
    ['user_mood', 'TEXT'],
    ['voice_mood', 'TEXT'],
    ['voice_confidence', 'REAL'],
  ];
  for (const [col, type] of moodColumns) {
    try {
      db.run(`ALTER TABLE diary_entries ADD COLUMN ${col} ${type}`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  // Migration: add raw audio feature columns for voice tone analysis
  const featureColumns = [
    ['avg_pitch', 'REAL'],
    ['pitch_var', 'REAL'],
    ['avg_energy', 'REAL'],
    ['avg_centroid', 'REAL'],
    ['avg_zcr', 'REAL'],
  ];
  for (const [col, type] of featureColumns) {
    try {
      db.run(`ALTER TABLE diary_entries ADD COLUMN ${col} ${type}`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  save();
}

export function getDb() {
  return db;
}

export function save() {
  if (!db) return;
  const data = db.export();
  const binStr = Array.from(data, b => String.fromCharCode(b)).join('');
  localStorage.setItem('voice-diary-db', btoa(binStr));
}

export function close() {
  if (db) {
    save();
    db.close();
    db = null;
  }
}

export function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const columns = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}
