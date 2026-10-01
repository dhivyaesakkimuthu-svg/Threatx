import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'threatx.json');

const defaultDb: Database = {
  servers: [],
  activityLogs: [],
  behaviorProfiles: [],
  threatEvents: [],
  incidents: [],
  alerts: [],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return { ...defaultDb, ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultDb);
  }
}

export function saveDb(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let cache: Database | null = null;

export function getDb(): Database {
  if (!cache) cache = loadDb();
  return cache;
}

export function persistDb(): void {
  if (cache) saveDb(cache);
}

export function resetCache(): void {
  cache = loadDb();
}
