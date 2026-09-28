import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { threatEngine } from '../engine/threatDetection.js';
import type { ActivityLog } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { limit = '50', riskLevel } = req.query;
  let events = [...db.threatEvents];
  if (riskLevel) {
    events = events.filter((e) => e.riskLevel === riskLevel);
  }
  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(events.slice(0, parseInt(limit as string)));
});

router.get('/stats', (_req, res) => {
  const db = getDb();
  const counts: Record<string, number> = {};
  db.threatEvents.forEach((e) => {
    counts[e.threatType] = (counts[e.threatType] || 0) + 1;
  });
  res.json(counts);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const event = db.threatEvents.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.patch('/:id/acknowledge', (req, res) => {
  const db = getDb();
  const event = db.threatEvents.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  event.acknowledged = true;
  persistDb();
  res.json(event);
});

function parseLocation(loc: any): { lat: number; lng: number; city: string; country: string } | undefined {
  if (!loc) return undefined;
  if (typeof loc === 'object' && loc.city) {
    return {
      lat: Number(loc.lat) || 0,
      lng: Number(loc.lng) || 0,
      city: String(loc.city),
      country: String(loc.country || 'US'),
    };
  }
  if (typeof loc === 'string') {
    const parts = loc.split(',').map((s) => s.trim());
    const city = parts[0] || loc;
    const country = parts[1] || 'US';
    const cityCoords: Record<string, [number, number]> = {
      'New York': [40.7128, -74.006],
      Chicago: [41.8781, -87.6298],
      'San Francisco': [37.7749, -122.4194],
      Seattle: [47.6062, -122.3321],
      Austin: [30.2672, -97.7431],
      Singapore: [1.3521, 103.8198],
      London: [51.5074, -0.1278],
      Tokyo: [35.6762, 139.6503],
    };
    const coords = cityCoords[city] || [0, 0];
    return { lat: coords[0], lng: coords[1], city, country };
  }
  return undefined;
}

function extractFilePath(raw: any): string | undefined {
  if (raw.filePath) return raw.filePath;
  if (typeof raw.details === 'string') {
    const match = raw.details.match(/(?:(?:\/[\w.-]+)+)/);
    if (match) return match[0];
  }
  return undefined;
}

function normalizeEventType(rawType: string, status?: string): ActivityLog['eventType'] {
  const t = (rawType || '').toLowerCase();
  if (t === 'failed_login' || status === 'failed') return 'failed_login';
  if (t === 'sensitive_download' || t === 'mass_download' || t === 'file_download') return 'file_download';
  if (t === 'file_access' || t === 'confidential_file_access' || t === 'credential_dump' || t === 'restricted_folder_access') return 'file_access';
  if (t === 'user_blocked' || t === 'logout') return 'logout';
  return 'login';
}

router.post('/ingest', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  const apiKey = authHeader.slice(7).trim();
  const db = getDb();
  const server = db.servers.find((s) => s.apiKey === apiKey);
  if (!server) return res.status(401).json({ error: 'Invalid API key' });

  server.status = 'online';
  server.lastSeen = new Date().toISOString();
  if (req.body.server?.agent_name) {
    server.agentVersion = req.body.server.agent_name;
  } else if (req.body.agentVersion) {
    server.agentVersion = req.body.agentVersion;
  }

  // Handle agent heartbeat
  if (req.body.event_type === 'agent_heartbeat') {
    persistDb();
    return res.json({
      status: 'accepted',
      message: 'Agent heartbeat acknowledged.',
      server: server.name,
      timestamp: new Date().toISOString(),
    });
  }

  // Extract raw log list from either .events (agent), .logs, or body array/single
  let rawList: any[] = [];
  if (Array.isArray(req.body.events)) {
    rawList = req.body.events;
  } else if (Array.isArray(req.body.logs)) {
    rawList = req.body.logs;
  } else if (Array.isArray(req.body)) {
    rawList = req.body;
  } else if (req.body && typeof req.body === 'object') {
    rawList = [req.body];
  }

  const detectedThreats: any[] = [];
  let userToMitigate: string | null = null;

  for (const raw of rawList) {
    const rawType = raw.event_type || raw.eventType || 'login';
    const status = raw.status;
    const eventType = normalizeEventType(rawType, status);
    const username = raw.username || raw.user || 'anonymous';
    const ipAddress = raw.source_ip || raw.ip_address || raw.ipAddress || '127.0.0.1';
    const filePath = extractFilePath(raw);
    const location = parseLocation(raw.location);

    const log: ActivityLog = {
      id: uuidv4(),
      serverId: server.id,
      userId: raw.userId || `user-${username.replace(/\W+/g, '-').toLowerCase()}`,
      username,
      eventType,
      ipAddress,
      device: raw.device || 'Workstation Terminal',
      userAgent: raw.userAgent || raw.device || '',
      location,
      filePath,
      success: raw.success !== false && status !== 'failed' && raw.severity !== 'critical',
      timestamp: raw.timestamp || new Date().toISOString(),
    };

    db.activityLogs.push(log);
    const threats = threatEngine.analyze(log, server);
    detectedThreats.push(...threats);

    for (const t of threats) {
      if (t.riskLevel === 'High' && !userToMitigate) {
        userToMitigate = t.username;
      }
    }
  }

  persistDb();

  const responsePayload: Record<string, any> = {
    status: 'accepted',
    processed: rawList.length,
    threats: detectedThreats,
    timestamp: new Date().toISOString(),
  };

  // If high-risk threat detected, provide active mitigation command back to agent
  if (userToMitigate && userToMitigate !== 'unknown') {
    responsePayload.mitigation_command = {
      action: 'block_user',
      target: userToMitigate,
    };
  }

  res.json(responsePayload);
});

export default router;
