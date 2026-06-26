# Data Persistence (sql.js)

## Requirements

- sql.js + localStorage for client-side persistence
- Mood data survives page reload
- Queryable with standard SQL for chart aggregation

## How to Build It

### Init with Fallback

```javascript
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
  locateFile: () => '/sql-wasm.wasm'  // must be exact filename
});

const saved = localStorage.getItem('mood-db');
if (saved) {
  const buf = new Uint8Array(JSON.parse(saved));
  db = new SQL.Database(buf);
} else {
  db = new SQL.Database();
  db.run(`CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    ai_mood TEXT NOT NULL,
    ai_confidence REAL,
    user_mood TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
}
```

### Save on Every Write

```javascript
function saveDB() {
  const data = db.export();
  localStorage.setItem('mood-db', JSON.stringify(Array.from(data)));
}
```

### Query for Charts

```javascript
// Mood distribution
db.each('SELECT ai_mood, COUNT(*) as cnt FROM entries GROUP BY ai_mood');

// Timeline data
db.each('SELECT date, ai_mood, user_mood FROM entries ORDER BY date');
```

## What to Avoid

- **Don't rely on CDN for WASM** — copy `sql-wasm.wasm` from `node_modules/sql.js/dist/` to `public/`
- **Don't use `locateFile: file => ...`** — the auto-detected filename may be wrong. Use exact path.
- **Don't forget to save after every write** — `db.run()` only modifies in-memory, `saveDB()` persists

## Constraints

- localStorage limit: ~5-10MB (enough for thousands of diary entries)
- WASM file: ~1MB, must be served locally
- Export/import is JSON-based (Array of bytes)

## Origin

Synthesized from spikes: 007
Source files available in: sources/007-mood-data-persistence/
