import initSqlJs from 'sql.js';

let db = null;

async function initDB() {
  const SQL = await initSqlJs({
    locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm'
  });

  // Try to load from localStorage
  const saved = localStorage.getItem('mood-db');
  if (saved) {
    const buf = new Uint8Array(JSON.parse(saved));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        text TEXT NOT NULL,
        ai_mood TEXT NOT NULL,
        ai_confidence REAL NOT NULL,
        user_mood TEXT,
        voice_mood TEXT,
        voice_confidence REAL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    // Seed with sample data
    const samples = [
      ['2026-06-20', 'Had a wonderful morning walk. Felt energized.', 'positive', 0.92],
      ['2026-06-19', 'Work was draining. Felt empty afterwards.', 'negative', 0.78],
      ['2026-06-18', 'Can\'t stop worrying about tomorrow.', 'negative', 0.85],
      ['2026-06-17', 'Got a promotion! Best day in months.', 'positive', 0.95],
      ['2026-06-16', 'Rainy day, stayed in. Quiet but content.', 'neutral', 0.65],
    ];
    for (const [date, text, mood, conf] of samples) {
      db.run('INSERT INTO entries (date, text, ai_mood, ai_confidence) VALUES (?, ?, ?, ?)', [date, text, mood, conf]);
    }
    saveDB();
  }
  document.getElementById('dbStatus').textContent = '✓ DB ready';
  document.getElementById('dbStatus').className = 'status ready';
}

function saveDB() {
  const data = db.export();
  const arr = Array.from(data);
  localStorage.setItem('mood-db', JSON.stringify(arr));
}

function query(sql, params = []) {
  const results = [];
  db.each(sql, params, (row) => results.push(row));
  return results;
}

// --- UI ---
window.addEntry = () => {
  const text = document.getElementById('entryText').value.trim();
  const mood = document.getElementById('entryMood').value;
  if (!text) return;
  const today = new Date().toISOString().split('T')[0];
  db.run('INSERT INTO entries (date, text, ai_mood, ai_confidence) VALUES (?, ?, ?, ?)', [today, text, mood, 0.8 + Math.random() * 0.15]);
  saveDB();
  document.getElementById('entryText').value = '';
  render();
};

window.overrideMood = (id, mood) => {
  db.run('UPDATE entries SET user_mood = ? WHERE id = ?', [mood, id]);
  saveDB();
  render();
};

window.deleteEntry = (id) => {
  db.run('DELETE FROM entries WHERE id = ?', [id]);
  saveDB();
  render();
};

window.clearDB = () => {
  localStorage.removeItem('mood-db');
  location.reload();
};

function render() {
  const rows = query('SELECT * FROM entries ORDER BY date DESC');
  const el = document.getElementById('entries');
  el.innerHTML = rows.map(r => `
    <div class="entry-row">
      <span class="date">${r.date}</span>
      <span class="text">${r.text}</span>
      <span class="mood ${r.user_mood || r.ai_mood}">${r.user_mood || r.ai_mood} ${r.user_mood ? '(override)' : `(${Math.round(r.ai_confidence * 100)}%)`}</span>
      <button class="btn-sm" onclick="deleteEntry(${r.id})">✕</button>
    </div>
  `).join('');

  // Stats
  const stats = query('SELECT ai_mood, COUNT(*) as cnt FROM entries GROUP BY ai_mood');
  document.getElementById('stats').innerHTML = stats.map(s =>
    `<span class="stat">${s.ai_mood}: ${s.cnt}</span>`
  ).join(' ');

  // Verify persistence
  document.getElementById('persistInfo').textContent = `${rows.length} entries stored in localStorage (${Math.round(JSON.stringify(localStorage.getItem('mood-db')).length / 1024)}KB)`;
}

// Init
initDB().then(render);
