import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'questboard.db' });

db.execute(`
  CREATE TABLE IF NOT EXISTS state_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`).catch(() => {});

async function upsert(key: string, value: any): Promise<void> {
  await db.execute(
    'INSERT OR REPLACE INTO state_cache (key, value, updated_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(value), Date.now()],
  );
}

async function load(key: string): Promise<any | null> {
  const result = await db.execute('SELECT value FROM state_cache WHERE key = ?', [key]);
  const rows = result.rows as any;
  const row = rows?._array?.[0] ?? rows?.item?.(0) ?? result.rows?.[0];
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export async function saveState(data: any): Promise<void> {
  await upsert('game_state', data);
}

export async function loadState(): Promise<any | null> {
  return load('game_state');
}

export async function saveConfig(data: any): Promise<void> {
  await upsert('game_config', data);
}

export async function loadConfig(): Promise<any | null> {
  return load('game_config');
}
