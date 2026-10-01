import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { threatEngine } from '../engine/threatDetection.js';
import { behaviorManager } from '../engine/behaviorProfile.js';
import type { ActivityLog, Server, ThreatEvent } from '../types.js';

const router = Router();

const DEMO_SERVER_API_KEY = 'tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b';
const DEMO_TARGET_URL = 'http://localhost:5001';

// Known coordinates for common cities used in telemetry
const CITY_COORDINATES: Record<string, { lat: number; lng: number; city: string; country: string }> = {
  'new york': { lat: 40.7128, lng: -74.006, city: 'New York', country: 'US' },
  'chicago': { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'US' },
  'san francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'US' },
  'singapore': { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'SG' },
  'london': { lat: 51.5074, lng: -0.1278, city: 'London', country: 'GB' },
  'tokyo': { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'JP' },
  'moscow': { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'RU' },
  'sydney': { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'AU' },
};

function resolveLocation(locStr?: string | any): { lat: number; lng: number; city: string; country: string } | undefined {
  if (!locStr) return undefined;
  if (typeof locStr === 'object' && locStr.lat && locStr.lng) return locStr;
  if (typeof locStr === 'string') {
    const lower = locStr.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (lower.includes(key)) {
        return coords;
      }
    }
    return { lat: 40.7128, lng: -74.006, city: locStr, country: 'Unknown' };
  }
  return undefined;
}

function extractFilePath(details?: string, explicitPath?: string): string | undefined {
  if (explicitPath) return explicitPath;
  if (!details) return undefined;
  const match = details.match(/(\/[\w.-]+(\/[\w.-]+)+)/);
  if (match) return match[1];
  if (details.includes('.env')) return '/srv/app/.env';
  if (details.includes('passwd')) return '/etc/passwd';
  if (details.includes('ledger.csv')) return '/home/admin/finance/ledger.csv';
  if (details.includes('credentials')) return '/admin/secrets/credentials.key';
  return undefined;
}

function findOrCreateServer(apiKey: string): Server | null {
  const db = getDb();
  let server = db.servers.find((s) => s.apiKey === apiKey);
  if (!server && apiKey === DEMO_SERVER_API_KEY) {
    server = {
      id: uuidv4(),
      name: 'OmniCorp Demo Target Server',
      hostname: 'omnicorp-target-01.demo.local',
      apiKey: DEMO_SERVER_API_KEY,
      status: 'online',
      os: 'Linux (Ubuntu 22.04 LTS)',
      ipAddress: '127.0.0.1:5001',
      agentVersion: 'theartx-agent-v1.0',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.servers.push(server);
    persistDb();
  }
  return server || null;
}

/**
 * Ingestion endpoint for the python theartx_agent.py
 * Handles both heartbeat and telemetry log batches.
 */
router.post('/ingest', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const apiKey = authHeader.slice(7).trim();
  const server = findOrCreateServer(apiKey);
  if (!server) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  server.status = 'online';
  server.lastSeen = new Date().toISOString();

  const db = getDb();
  const payload = req.body || {};

  // Case 1: Agent Heartbeat
  if (payload.event_type === 'agent_heartbeat') {
    if (payload.server?.agent_name) {
      server.agentVersion = payload.server.agent_name;
    }
    persistDb();
    return res.json({
      status: 'accepted',
      message: 'Agent heartbeat acknowledged.',
      server: server.name,
      timestamp: new Date().toISOString(),
    });
  }

  // Case 2: Agent Log Batch / telemetry
  const rawEvents: any[] = Array.isArray(payload.events)
    ? payload.events
    : Array.isArray(payload.logs)
    ? payload.logs
    : Array.isArray(payload)
    ? payload
    : [payload];

  const detectedThreats: ThreatEvent[] = [];
  let userToMitigate: string | null = null;

  for (const raw of rawEvents) {
    const username = raw.username || raw.user || 'anonymous';
    const userId = raw.userId || `u_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const rawType = (raw.event_type || raw.eventType || 'login').toLowerCase();
    const isFailed = raw.status === 'failed' || rawType.includes('failed');
    const details = raw.details || '';

    let eventType: ActivityLog['eventType'] = 'login';
    let filePath = extractFilePath(details, raw.filePath || raw.file_path);

    if (isFailed || rawType === 'failed_login') {
      eventType = 'failed_login';
    } else if (rawType.includes('download') || rawType === 'sensitive_download') {
      eventType = 'file_download';
    } else if (rawType.includes('file') || rawType === 'credential_dump') {
      eventType = 'file_access';
      if (!filePath && rawType === 'credential_dump') {
        filePath = '/admin/secrets/credentials.key';
      }
    } else if (rawType.includes('login') || rawType === 'ssh_login' || rawType === 'impossible_travel') {
      eventType = 'login';
    }

    const ipAddress = raw.source_ip || raw.ip_address || raw.ipAddress || '127.0.0.1';
    const device = raw.device || (rawType === 'ssh_login' ? 'SSH Terminal' : 'Linux Workstation');
    const location = resolveLocation(raw.location || (rawType === 'impossible_travel' ? 'Singapore' : undefined));

    // Handle impossible travel explicitly if signaled
    if (rawType === 'impossible_travel') {
      const profile = behaviorManager.getOrCreate(userId, username);
      profile.lastLogin = {
        ip: '45.33.32.156',
        device: 'MacBook Pro',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        location: { lat: 40.7128, lng: -74.006 }, // New York
      };
    }

    const log: ActivityLog = {
      id: uuidv4(),
      serverId: server.id,
      userId,
      username,
      eventType,
      ipAddress,
      device,
      userAgent: raw.userAgent || 'theartx-agent/1.0',
      location,
      filePath,
      success: !isFailed,
      timestamp: raw.timestamp || new Date().toISOString(),
    };

    db.activityLogs.push(log);
    const threats = threatEngine.analyze(log, server);
    detectedThreats.push(...threats);

    // If a high-risk anomaly occurs, flag user for automated mitigation back to the demo server
    const highRisk = threats.find((t) => t.riskLevel === 'High');
    if (highRisk || raw.severity === 'critical' || rawType === 'credential_dump' || rawType === 'impossible_travel') {
      userToMitigate = username;
    }
  }

  persistDb();

  const responsePayload: Record<string, any> = {
    status: 'accepted',
    processed: rawEvents.length,
    threats: detectedThreats,
    timestamp: new Date().toISOString(),
  };

  // If high threat detected, dispatch mitigation command to Python agent
  if (userToMitigate && userToMitigate !== 'anonymous') {
    responsePayload.mitigation_command = {
      action: 'block_user',
      target: userToMitigate,
    };
  }

  res.json(responsePayload);
});

/**
 * Health and status probe for the demo target server
 */
router.get('/status', async (_req, res) => {
  const db = getDb();
  const demoServer = db.servers.find(
    (s) => s.apiKey === DEMO_SERVER_API_KEY || s.name.includes('OmniCorp') || s.hostname.includes('omnicorp')
  );

  let targetReachable = false;
  let targetMetrics: any = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const targetRes = await fetch(`${DEMO_TARGET_URL}/api/status`, { signal: controller.signal });
    clearTimeout(timeout);
    if (targetRes.ok) {
      targetMetrics = await targetRes.json();
      targetReachable = true;
    }
  } catch {
    targetReachable = false;
  }

  const isAgentRecentlySeen = demoServer?.lastSeen
    ? Date.now() - new Date(demoServer.lastSeen).getTime() < 30000
    : false;

  res.json({
    demoServerRunning: targetReachable,
    agentConnected: isAgentRecentlySeen,
    server: demoServer || null,
    targetUrl: DEMO_TARGET_URL,
    targetMetrics,
  });
});

/**
 * Forward remote mitigation action from ThreatX UI directly to Demo Target Server
 */
router.post('/block-user', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const targetRes = await fetch(`${DEMO_TARGET_URL}/api/action/block-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const data = await targetRes.json();
    return res.json({ success: true, targetResponse: data });
  } catch (err) {
    return res.status(502).json({
      error: `Could not reach target server at ${DEMO_TARGET_URL}. Ensure demo_server.py is running.`,
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
