import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = process.env.ICAN_DATA_DIR || path.join(process.cwd(), 'data')
fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'ican.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vision (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS stages (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id         TEXT PRIMARY KEY,
    stage_id   TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    position   INTEGER NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS steps (
    id       TEXT PRIMARY KEY,
    goal_id  TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    text     TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    id       TEXT PRIMARY KEY,
    stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    why      TEXT NOT NULL DEFAULT '',
    url      TEXT
  );

  CREATE TABLE IF NOT EXISTS companies (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    website     TEXT,
    location    TEXT,
    contact     TEXT,
    description TEXT,
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_goals_stage ON goals(stage_id, position);
  CREATE INDEX IF NOT EXISTS idx_steps_goal ON steps(goal_id, position);
  CREATE INDEX IF NOT EXISTS idx_resources_stage ON resources(stage_id);
`)

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row ? row.value : null
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value)
}
