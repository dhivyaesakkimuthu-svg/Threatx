import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { SessionModel } from '../models/Session.js';
import { ActivityModel } from '../models/Activity.js';
import { isDbConnected } from '../config/db.js';
import { io } from '../index.js';
import { authenticateToken, requireRole, recordAuditLog } from '../middleware/auth.js';

const router = Router();

// GET /api/sessions - List active and recent user/SSH sessions
router.get('/', authenticateToken, async (req, res) => {
  const { status, username, serverId, search, page, limit } = req.query;
  const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : null;
  const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 50;

  if (isDbConnected()) {
    try {
      const filter: Record<string, any> = {};

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (username) {
        filter.username = username;
      }
      if (serverId) {
        filter.serverId = serverId;
      }
      if (search) {
        const regex = new RegExp(String(search), 'i');
        filter.$or = [
          { sessionId: regex },
          { username: regex },
          { sourceIp: regex },
          { device: regex },
          { location: regex },
        ];
      }

      const total = await SessionModel.countDocuments(filter);

      let query = SessionModel.find(filter).sort({ startedAt: -1, createdAt: -1 });
      if (pageNum) {
        query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
      } else if (limit) {
        query = query.limit(limitNum);
      }

      const sessions = await query.exec();

      if (pageNum) {
        return res.json({
          data: sessions,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      }

      return res.json(sessions);
    } catch (e: any) {
      console.warn('[Sessions Route] MongoDB error, fallback to store:', e.message);
    }
  }

  const db = getDb();
  let sessions = [...(db.sessions || [])];

  if (status && status !== 'all') {
    sessions = sessions.filter((s) => s.status === status);
  }

  if (username) {
    sessions = sessions.filter((s) => s.username === username);
  }

  if (search) {
    const q = String(search).toLowerCase();
    sessions = sessions.filter(
      (s) =>
        (s.sessionId || s.id || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (s.sourceIp || s.ipAddress || '').toLowerCase().includes(q) ||
        (s.device || '').toLowerCase().includes(q)
    );
  }

  if (pageNum) {
    const total = sessions.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paged = sessions.slice(startIndex, startIndex + limitNum);
    return res.json({
      data: paged,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  }

  res.json(sessions.slice(0, limitNum));
});

// GET /api/sessions/:id - Get session details
router.get('/:id', authenticateToken, async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isDbConnected()) {
    try {
      const session = await SessionModel.findOne({
        $or: [{ sessionId: id }, { _id: isMongoId ? id : null }],
      });
      if (session) return res.json(session);
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const session = (db.sessions || []).find((s) => s.id === id || s.sessionId === id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// POST /api/sessions - Create/register new session
router.post('/', authenticateToken, requireRole('admin', 'analyst'), async (req, res) => {
  const { username, sourceIp, ipAddress, serverId, device, location, riskScore } = req.body;
  const sessionId = `SES-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  if (isDbConnected()) {
    try {
      const session = await SessionModel.create({
        sessionId,
        username: username || 'analyst',
        sourceIp: sourceIp || ipAddress || '127.0.0.1',
        ipAddress: ipAddress || sourceIp || '127.0.0.1',
        serverId: serverId || 'SRV-001',
        status: 'active',
        device: device || 'Web Console / Firefox',
        location: location || 'Localhost',
        riskScore: riskScore ?? 5,
        startedAt: now,
        lastActive: now,
      });

      if (io) {
        io.emit('session:updated', session);
      }

      await recordAuditLog({
        userId: (req as any).user?.id,
        action: 'SESSION_CREATED',
        resourceType: 'session',
        resourceId: session.sessionId,
        metadata: { serverId: session.serverId, username: session.username },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json(session);
    } catch (e: any) {
      console.warn('[Sessions Route] MongoDB create error:', e.message);
    }
  }

  const db = getDb();
  const newSession = {
    id: uuidv4(),
    sessionId,
    username: username || 'analyst',
    sourceIp: sourceIp || ipAddress || '127.0.0.1',
    ipAddress: ipAddress || sourceIp || '127.0.0.1',
    serverId: serverId || 'SRV-001',
    status: 'active' as const,
    device: device || 'Web Console / Firefox',
    location: location || 'Localhost',
    riskScore: riskScore ?? 5,
    startedAt: now.toISOString(),
    lastActive: now.toISOString(),
  };

  if (!db.sessions) db.sessions = [];
  db.sessions.unshift(newSession as any);
  persistDb();

  if (io) {
    io.emit('session:updated', newSession);
  }

  await recordAuditLog({
    userId: (req as any).user?.id,
    action: 'SESSION_CREATED',
    resourceType: 'session',
    resourceId: sessionId,
    metadata: { serverId: newSession.serverId, username: newSession.username },
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(newSession);
});

// POST /api/sessions/:id/terminate - Revoke / terminate session
router.post('/:id/terminate', authenticateToken, requireRole('admin', 'analyst'), async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const now = new Date();

  if (isDbConnected()) {
    try {
      const session = await SessionModel.findOne({
        $or: [{ sessionId: id }, { _id: isMongoId ? id : null }],
      });

      if (session) {
        session.status = 'terminated';
        session.endedAt = now;
        const updated = await session.save();

        const activityDoc = await ActivityModel.create({
          activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'session_terminated',
          message: `Session ${session.sessionId} for user ${session.username} revoked by SOC Lead`,
          severity: 'medium',
          source: 'Auth Gateway',
          timestamp: now,
        });

        if (io) {
          io.emit('session:updated', updated);
          io.emit('activity:new', activityDoc);
        }

        await recordAuditLog({
          userId: (req as any).user?.id,
          action: 'SESSION_TERMINATED',
          resourceType: 'session',
          resourceId: session.sessionId,
          metadata: { username: session.username },
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'],
        });

        return res.json({ success: true, sessionId: id, status: 'terminated' });
      }
    } catch (e: any) {
      console.warn('[Sessions Route] MongoDB terminate error:', e.message);
    }
  }

  const db = getDb();
  const session = (db.sessions || []).find((s) => s.id === id || s.sessionId === id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.status = 'terminated';
  persistDb();

  if (io) {
    io.emit('session:updated', session);
  }

  await recordAuditLog({
    userId: (req as any).user?.id,
    action: 'SESSION_TERMINATED',
    resourceType: 'session',
    resourceId: session.sessionId || session.id,
    metadata: { username: session.username },
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
  });

  res.json({ success: true, sessionId: id, status: 'terminated' });
});

// DELETE /api/sessions/:id - Terminate session
router.delete('/:id', authenticateToken, requireRole('admin', 'analyst'), async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const now = new Date();

  if (isDbConnected()) {
    try {
      const session = await SessionModel.findOne({
        $or: [{ sessionId: id }, { _id: isMongoId ? id : null }],
      });

      if (session) {
        session.status = 'terminated';
        session.endedAt = now;
        const updated = await session.save();

        const activityDoc = await ActivityModel.create({
          activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'session_terminated',
          message: `Session ${session.sessionId} terminated`,
          severity: 'info',
          source: 'Auth Gateway',
          timestamp: now,
        });

        if (io) {
          io.emit('session:updated', updated);
          io.emit('activity:new', activityDoc);
        }

        await recordAuditLog({
          userId: (req as any).user?.id,
          action: 'SESSION_TERMINATED',
          resourceType: 'session',
          resourceId: session.sessionId,
          metadata: { username: session.username },
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'],
        });

        return res.json({ success: true, sessionId: id, status: 'terminated' });
      }
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const session = (db.sessions || []).find((s) => s.id === id || s.sessionId === id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.status = 'terminated';
  persistDb();

  if (io) {
    io.emit('session:updated', session);
  }

  await recordAuditLog({
    userId: (req as any).user?.id,
    action: 'SESSION_TERMINATED',
    resourceType: 'session',
    resourceId: session.sessionId || session.id,
    metadata: { username: session.username },
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
  });

  res.json({ success: true, sessionId: id, status: 'terminated' });
});

export default router;
