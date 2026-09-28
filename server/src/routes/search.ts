import { Router } from 'express';
import { ThreatModel } from '../models/Threat.js';
import { AlertModel } from '../models/Alert.js';
import { ServerModel } from '../models/Server.js';
import { SessionModel } from '../models/Session.js';
import { isDbConnected } from '../config/db.js';
import { getDb } from '../db/store.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=query - Unified global SOC entity search
router.get('/', authenticateToken, async (req, res) => {
  const queryStr = String(req.query.q || req.query.query || '').trim();

  if (!queryStr || queryStr.length < 1) {
    return res.json({
      threats: [],
      alerts: [],
      servers: [],
      sessions: [],
      total: 0,
    });
  }

  const regex = new RegExp(queryStr, 'i');

  if (isDbConnected()) {
    try {
      const [threats, alerts, servers, sessions] = await Promise.all([
        ThreatModel.find({
          $or: [
            { threatId: regex },
            { type: regex },
            { source: regex },
            { ipAddress: regex },
            { username: regex },
            { description: regex },
          ],
        }).limit(6),
        AlertModel.find({
          $or: [
            { alertId: regex },
            { title: regex },
            { source: regex },
            { description: regex },
          ],
        }).limit(6),
        ServerModel.find({
          $or: [
            { serverId: regex },
            { name: regex },
            { ipAddress: regex },
            { hostname: regex },
          ],
        }).limit(6),
        SessionModel.find({
          $or: [
            { sessionId: regex },
            { username: regex },
            { sourceIp: regex },
            { ipAddress: regex },
            { device: regex },
          ],
        }).limit(6),
      ]);

      return res.json({
        threats,
        alerts,
        servers,
        sessions,
        total: threats.length + alerts.length + servers.length + sessions.length,
      });
    } catch (e: any) {
      console.warn('[Search Route] MongoDB search error:', e.message);
    }
  }

  // Fallback store
  const db = getDb();
  const q = queryStr.toLowerCase();

  const threats = (db.threats || db.threatEvents || [])
    .filter(
      (t) =>
        (t.threatId || t.id || '').toLowerCase().includes(q) ||
        (t.type || t.threatType || '').toLowerCase().includes(q) ||
        (t.source || t.ipAddress || '').toLowerCase().includes(q) ||
        (t.username || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    )
    .slice(0, 6);

  const alerts = (db.alerts || [])
    .filter(
      (a) =>
        (a.alertId || a.id || '').toLowerCase().includes(q) ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q)
    )
    .slice(0, 6);

  const servers = (db.servers || [])
    .filter(
      (s) =>
        (s.serverId || s.id || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.ipAddress || '').toLowerCase().includes(q) ||
        (s.hostname || '').toLowerCase().includes(q)
    )
    .slice(0, 6);

  const sessions = (db.sessions || [])
    .filter(
      (s) =>
        (s.sessionId || s.id || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (s.sourceIp || s.ipAddress || '').toLowerCase().includes(q)
    )
    .slice(0, 6);

  res.json({
    threats,
    alerts,
    servers,
    sessions,
    total: threats.length + alerts.length + servers.length + sessions.length,
  });
});

export default router;
