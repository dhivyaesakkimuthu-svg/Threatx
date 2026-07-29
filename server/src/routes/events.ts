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

router.post('/ingest', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  const apiKey = authHeader.slice(7);
  const db = getDb();
  const server = db.servers.find((s) => s.apiKey === apiKey);
  if (!server) return res.status(401).json({ error: 'Invalid API key' });

  server.status = 'online';
  server.lastSeen = new Date().toISOString();
  if (req.body.agentVersion) server.agentVersion = req.body.agentVersion;

  const logs: Partial<ActivityLog>[] = Array.isArray(req.body.logs)
    ? req.body.logs
    : [req.body];

  const detectedThreats: any[] = [];
  for (const raw of logs) {
    const log: ActivityLog = {
      id: uuidv4(),
      serverId: server.id,
      userId: raw.userId || uuidv4(),
      username: raw.username || 'unknown',
      eventType: raw.eventType || 'login',
      ipAddress: raw.ipAddress || '0.0.0.0',
      device: raw.device || 'Unknown Device',
      userAgent: raw.userAgent || '',
      location: raw.location,
      filePath: raw.filePath,
      success: raw.success !== false,
      timestamp: raw.timestamp || new Date().toISOString(),
    };
    db.activityLogs.push(log);
    const threats = threatEngine.analyze(log, server);
    detectedThreats.push(...threats);
  }
  persistDb();
  res.json({ processed: logs.length, threats: detectedThreats });
});

export default router;
