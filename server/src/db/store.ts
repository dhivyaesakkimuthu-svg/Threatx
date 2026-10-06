import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../types.js';
import { isMongoConnected } from './mongo.js';
import {
  ServerModel,
  ActivityLogModel,
  ThreatEventModel,
  IncidentModel,
  AlertModel,
  UserBehaviorProfileModel,
  UserModel,
} from './models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'threatx.json');

const defaultDb: Database = {
  users: [],
  servers: [],
  activityLogs: [],
  behaviorProfiles: [],
  threatEvents: [],
  incidents: [],
  alerts: [],
};

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJSON<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading JSON from ${filePath}:`, err);
    return null;
  }
}

export function writeJSON<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing JSON to ${filePath}:`, err);
  }
}

export function loadDbFromJSON(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaultDb, ...parsed, users: parsed.users || [] };
  } catch {
    return structuredClone(defaultDb);
  }
}

export async function loadDbFromMongo(): Promise<Database | null> {
  if (!isMongoConnected()) return null;
  try {
    const [servers, activityLogs, behaviorProfiles, threatEvents, incidents, alerts, users] =
      await Promise.all([
        ServerModel.find().lean(),
        ActivityLogModel.find().lean(),
        UserBehaviorProfileModel.find().lean(),
        ThreatEventModel.find().lean(),
        IncidentModel.find().lean(),
        AlertModel.find().lean(),
        UserModel.find().lean(),
      ]);

    return {
      servers: servers.map(({ _id, __v, ...rest }: any) => rest),
      activityLogs: activityLogs.map(({ _id, __v, ...rest }: any) => rest),
      behaviorProfiles: behaviorProfiles.map(({ _id, __v, ...rest }: any) => rest),
      threatEvents: threatEvents.map(({ _id, __v, ...rest }: any) => rest),
      incidents: incidents.map(({ _id, __v, ...rest }: any) => rest),
      alerts: alerts.map(({ _id, __v, ...rest }: any) => rest),
      users: users.map(({ _id, __v, ...rest }: any) => rest),
    };
  } catch (err) {
    console.error('[MongoDB] Error loading data from Mongo:', err);
    return null;
  }
}

export function loadDb(): Database {
  return loadDbFromJSON();
}

export function saveDb(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let cache: Database | null = null;

export async function initDb(): Promise<Database> {
  if (isMongoConnected()) {
    const mongoData = await loadDbFromMongo();
    if (mongoData && (mongoData.servers.length > 0 || (mongoData.users && mongoData.users.length > 0))) {
      cache = mongoData;
      console.log('[Store] Populated in-memory database from MongoDB');
      return cache;
    }
  }

  cache = loadDbFromJSON();
  console.log('[Store] Populated in-memory database from JSON store');

  if (isMongoConnected() && cache) {
    // Sync initial JSON data to MongoDB if Mongo was empty
    syncMongoFromMemory(cache).catch(console.error);
  }

  return cache;
}

export function getDb(): Database {
  if (!cache) {
    cache = loadDbFromJSON();
  }
  return cache;
}

export function persistDb(): void {
  if (cache) {
    saveDb(cache);
    if (isMongoConnected()) {
      syncMongoFromMemory(cache).catch((err) =>
        console.error('[Store] Async Mongo sync failed:', err)
      );
    }
  }
}

export async function syncMongoFromMemory(db: Database): Promise<void> {
  if (!isMongoConnected()) return;
  try {
    const bulkOps = [
      ...db.servers.map((s) => ({
        updateOne: { filter: { id: s.id }, update: { $set: s }, upsert: true },
      })),
    ];
    if (bulkOps.length > 0) await ServerModel.bulkWrite(bulkOps as any);

    if (db.users && db.users.length > 0) {
      const userOps = db.users.map((u) => ({
        updateOne: { filter: { id: u.id }, update: { $set: u }, upsert: true },
      }));
      await UserModel.bulkWrite(userOps as any);
    }

    if (db.threatEvents.length > 0) {
      const threatOps = db.threatEvents.map((t) => ({
        updateOne: { filter: { id: t.id }, update: { $set: t }, upsert: true },
      }));
      await ThreatEventModel.bulkWrite(threatOps as any);
    }

    if (db.incidents.length > 0) {
      const incOps = db.incidents.map((i) => ({
        updateOne: { filter: { id: i.id }, update: { $set: i }, upsert: true },
      }));
      await IncidentModel.bulkWrite(incOps as any);
    }

    if (db.alerts.length > 0) {
      const alertOps = db.alerts.map((a) => ({
        updateOne: { filter: { id: a.id }, update: { $set: a }, upsert: true },
      }));
      await AlertModel.bulkWrite(alertOps as any);
    }

    if (db.behaviorProfiles.length > 0) {
      const profOps = db.behaviorProfiles.map((p) => ({
        updateOne: { filter: { userId: p.userId }, update: { $set: p }, upsert: true },
      }));
      await UserBehaviorProfileModel.bulkWrite(profOps as any);
    }
  } catch (err: any) {
    console.error('[Store] Error in syncMongoFromMemory:', err.message);
  }
}

export function resetCache(): void {
  cache = loadDbFromJSON();
}
