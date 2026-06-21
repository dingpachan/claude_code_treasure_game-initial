import initSqlJs, { Database } from 'sql.js';

export interface User {
  id: number;
  username: string;
}

export interface ScoreRow {
  id: number;
  score: number;
  played_at: number;
}

const DB_KEY = 'treasure_game_db';
let db: Database | null = null;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function persist() {
  if (!db) return;
  const data = db.export();
  localStorage.setItem(DB_KEY, JSON.stringify(Array.from(data)));
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm` });
  const saved = localStorage.getItem(DB_KEY);
  db = saved
    ? new SQL.Database(new Uint8Array(JSON.parse(saved)))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_scores (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL,
      score     INTEGER NOT NULL,
      played_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
  persist();
}

export async function registerUser(username: string, password: string): Promise<User> {
  if (!db) throw new Error('DB not initialised');
  const existing = db.exec('SELECT id FROM users WHERE username = ?', [username]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    throw new Error('此帳號已存在');
  }
  const hash = await hashPassword(password);
  db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
  persist();
  const result = db.exec('SELECT id FROM users WHERE username = ?', [username]);
  return { id: result[0].values[0][0] as number, username };
}

export async function loginUser(username: string, password: string): Promise<User | null> {
  if (!db) throw new Error('DB not initialised');
  const result = db.exec('SELECT id, password_hash FROM users WHERE username = ?', [username]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const [id, storedHash] = result[0].values[0] as [number, string];
  const hash = await hashPassword(password);
  if (hash !== storedHash) return null;
  return { id, username };
}

export function saveScore(userId: number, score: number): void {
  if (!db) return;
  db.run('INSERT INTO game_scores (user_id, score) VALUES (?, ?)', [userId, score]);
  persist();
}

export function getUserScores(userId: number): ScoreRow[] {
  if (!db) return [];
  const result = db.exec(
    'SELECT id, score, played_at FROM game_scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 5',
    [userId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0] as number,
    score: row[1] as number,
    played_at: row[2] as number,
  }));
}
