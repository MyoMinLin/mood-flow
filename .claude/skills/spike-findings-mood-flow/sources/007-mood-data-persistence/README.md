---
spike: 007
name: mood-data-persistence
type: standard
validates: "Given mood data, when persisted to sql.js, then mood survives page reload and is queryable for charts"
verdict: VALIDATED
related: [003, 006]
tags: [storage, sql.js, persistence, localstorage]
---

# Spike 007: Mood Data Persistence

## What This Validates
Given diary entries with mood data, when stored in sql.js and persisted to localStorage, then data survives page reload and is queryable for chart display.

## How to Run
```bash
cd .planning/spikes/007-mood-data-persistence
npm install
npm run dev
# Open http://localhost:5180
```

## What to Expect
1. sql.js loads from CDN, DB initializes with sample entries
2. Add entries with mood labels — stored in sql.js
3. Refresh page — data persists via localStorage
4. Stats bar shows mood distribution
5. "Clear DB & Reload" resets everything

## Results

**Verdict: VALIDATED ✓**

- sql.js with localStorage persistence works — data survives page reload
- `locateFile` must point to exact WASM filename (`sql-wasm.wasm`, not auto-detected)
- DB export/import via `db.export()` → `Array.from()` → `JSON.stringify` → localStorage
- Mood data is queryable with standard SQL (GROUP BY, ORDER BY, etc.)

### Signal for the Build
- Use sql.js for client-side storage
- Persist to localStorage via `db.export()` on every write
- WASM file must be served locally (copy from node_modules to public/)
- Query mood data with SQL for chart aggregation
