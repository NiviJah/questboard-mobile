import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'questboard.db' });

db.execute(`
  CREATE TABLE IF NOT EXISTS state_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

function upsert(key: string, value: any): void {
  db.execute(
    'INSERT OR REPLACE INTO state_cache (key, value, updated_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(value), Date.now()],
  );
}

function load(key: string): any | null {
  const result = db.execute('SELECT value FROM state_cache WHERE key = ?', [key]);
  const row = result.rows?._array?.[0] ?? result.rows?.item?.(0);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export function saveState(data: any): void {
  upsert('game_state', data);
}

export function loadState(): any | null {
  return load('game_state');
}

export function saveConfig(data: any): void {
  upsert('game_config', data);
}

export function loadConfig(): any | null {
  return load('game_config');
}
