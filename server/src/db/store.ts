import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'threatx.json');

const defaultDb: Database = {
  users: [],
  servers: [],
  threats: [],
  alerts: [],
  sessions: [],
  activities: [],
  reports: [],
  // Legacy / internal compatibility aliases
  activityLogs: [],
  behaviorProfiles: [],
  threatEvents: [],
  incidents: [],
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
    const parsed = JSON.parse(raw);
    return {
      ...defaultDb,
      ...parsed,
      users: parsed.users || defaultDb.users,
      servers: parsed.servers || defaultDb.servers,
      threats: parsed.threats || parsed.threatEvents || defaultDb.threats,
      alerts: parsed.alerts || defaultDb.alerts,
      sessions: parsed.sessions || defaultDb.sessions,
      activities: parsed.activities || parsed.activityLogs || defaultDb.activities,
      reports: parsed.reports || defaultDb.reports,
      activityLogs: parsed.activityLogs || parsed.activities || defaultDb.activityLogs,
      threatEvents: parsed.threatEvents || parsed.threats || defaultDb.threatEvents,
    };
  } catch {
    return structuredClone(defaultDb);
  }
}

export function saveDb(db: Database): void {
  ensureDataDir();
  // Keep bidirectional sync between threats <-> threatEvents and activities <-> activityLogs
  db.threats = db.threats || db.threatEvents || [];
  db.threatEvents = db.threatEvents || db.threats || [];
  db.activities = db.activities || db.activityLogs || [];
  db.activityLogs = db.activityLogs || db.activities || [];
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
