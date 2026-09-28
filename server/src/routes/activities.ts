import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { ActivityModel } from '../models/Activity.js';
import { isDbConnected } from '../config/db.js';
import { io } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/activities - List chronological security activities with filtering & pagination
router.get('/', authenticateToken, async (req, res) => {
  const { limit, page, severity, category, type, search } = req.query;
  const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : null;
  const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 50;

  if (isDbConnected()) {
    try {
      const filter: Record<string, any> = {};

      if (severity && severity !== 'all') {
        filter.severity = severity;
      }

      if (category && category !== 'all') {
        const cat = String(category).toLowerCase();
        if (cat === 'threats') {
          filter.$or = [
            { type: { $regex: /threat|attack|anomaly|exploit|injection|brute/i } },
            { severity: { $in: ['critical', 'high'] } },
          ];
        } else if (cat === 'alerts') {
          filter.type = { $regex: /alert/i };
        } else if (cat === 'sessions') {
          filter.type = { $regex: /login|auth|session|2fa|user/i };
        } else if (cat === 'system') {
          filter.type = { $regex: /system|server|heartbeat|telemetry|backup|firewall/i };
        }
      } else if (type && type !== 'all') {
        filter.type = type;
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        filter.$or = [
          { message: regex },
          { source: regex },
          { username: regex },
          { activityId: regex },
        ];
      }

      const total = await ActivityModel.countDocuments(filter);

      let query = ActivityModel.find(filter).sort({ timestamp: -1, createdAt: -1 });
      if (pageNum) {
        query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
      } else {
        query = query.limit(limitNum);
      }

      const activities = await query.exec();

      if (pageNum) {
        return res.json({
          data: activities,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      }

      return res.json(activities);
    } catch (e: any) {
      console.warn('[Activities Route] MongoDB error, fallback to store:', e.message);
    }
  }

  const db = getDb();
  let activities = [...(db.activities || db.activityLogs || [])];

  if (severity && severity !== 'all') {
    activities = activities.filter((a) => (a.severity || '').toLowerCase() === String(severity).toLowerCase());
  }

  if (category && category !== 'all') {
    const cat = String(category).toLowerCase();
    if (cat === 'threats') {
      activities = activities.filter((a) => (a.severity === 'critical' || a.severity === 'high' || /threat|attack|anomaly/i.test(a.type || '')));
    } else if (cat === 'alerts') {
      activities = activities.filter((a) => /alert/i.test(a.type || ''));
    } else if (cat === 'sessions') {
      activities = activities.filter((a) => /login|auth|session|user/i.test(a.type || ''));
    } else if (cat === 'system') {
      activities = activities.filter((a) => /system|server|heartbeat|telemetry|backup/i.test(a.type || ''));
    }
  }

  if (search) {
    const q = String(search).toLowerCase();
    activities = activities.filter(
      (a) =>
        (a.message || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q)
    );
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (pageNum) {
    const total = activities.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paged = activities.slice(startIndex, startIndex + limitNum);
    return res.json({
      data: paged,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  }

  res.json(activities.slice(0, limitNum));
});

// POST /api/activities - Record new activity
router.post('/', authenticateToken, requireRole('admin', 'analyst'), async (req, res) => {
  const { type, message, severity, source, metadata, userId, username, sourceIp } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Activity message is required' });
  }

  const activityId = `ACT-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  if (isDbConnected()) {
    try {
      const created = await ActivityModel.create({
        activityId,
        type: type || 'system_log',
        message,
        severity: severity || 'info',
        source: source || 'ThreatX Sensor',
        metadata: metadata || {},
        userId,
        username: username || 'system',
        sourceIp: sourceIp || '127.0.0.1',
        timestamp: now,
      });

      if (io) {
        io.emit('activity:new', created);
      }

      return res.status(201).json(created);
    } catch (e: any) {
      console.warn('[Activities Route] MongoDB create error:', e.message);
    }
  }

  const db = getDb();
  const newActivity = {
    id: uuidv4(),
    activityId,
    type: type || 'system_log',
    message,
    severity: severity || 'info',
    source: source || 'ThreatX Sensor',
    metadata: metadata || {},
    userId,
    username: username || 'system',
    sourceIp: sourceIp || '127.0.0.1',
    timestamp: now.toISOString(),
  };

  if (!db.activities) db.activities = [];
  db.activities.unshift(newActivity as any);
  persistDb();

  if (io) {
    io.emit('activity:new', newActivity);
  }

  res.status(201).json(newActivity);
});

export default router;
