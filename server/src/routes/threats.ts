import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { ThreatModel } from '../models/Threat.js';
import { ActivityModel } from '../models/Activity.js';
import { isDbConnected } from '../config/db.js';
import { io } from '../index.js';
import {
  authenticateToken,
  requireRole,
  recordAuditLog,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import type { ThreatEvent } from '../types.js';

const router = Router();

// GET /api/threats - List all threats with optional filtering, search & pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { severity, status, limit, page, source, target, search, q } = req.query;
  const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : null;
  const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 50;
  const searchTerm = search || q;

  if (isDbConnected()) {
    try {
      const filter: Record<string, any> = {};

      if (severity && severity !== 'all') {
        filter.severity = String(severity).toLowerCase();
      }

      if (status && status !== 'all') {
        const s = String(status).toLowerCase();
        if (s === 'active') {
          filter.status = { $in: ['new', 'active', 'open'] };
        } else {
          filter.status = s;
        }
      }

      if (source) {
        filter.$or = [{ source }, { ipAddress: source }];
      }

      if (target) {
        filter.target = target;
      }

      if (searchTerm) {
        const regex = new RegExp(String(searchTerm), 'i');
        filter.$or = [
          { threatId: regex },
          { type: regex },
          { threatType: regex },
          { source: regex },
          { username: regex },
          { description: regex },
          { explanation: regex },
        ];
      }

      const total = await ThreatModel.countDocuments(filter);

      let query = ThreatModel.find(filter).sort({ detectedAt: -1, createdAt: -1 });
      if (pageNum) {
        query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
      } else if (limit) {
        query = query.limit(limitNum);
      }

      const threats = await query.exec();

      if (pageNum) {
        return res.json({
          data: threats,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      }

      return res.json(threats);
    } catch (e: any) {
      console.warn('[Threats Route] MongoDB error, using fallback:', e.message);
    }
  }

  // Fallback store
  const db = getDb();
  let threats = [...(db.threats || db.threatEvents || [])];

  if (severity && severity !== 'all') {
    threats = threats.filter(
      (t) => (t.severity || t.riskLevel || '').toLowerCase() === String(severity).toLowerCase()
    );
  }

  if (status && status !== 'all') {
    const s = String(status).toLowerCase();
    threats = threats.filter((t) => {
      const curStatus = (t.status || (t.acknowledged ? 'mitigated' : 'active')).toLowerCase();
      if (s === 'active') return curStatus === 'new' || curStatus === 'active' || curStatus === 'open';
      return curStatus === s;
    });
  }

  if (source) {
    threats = threats.filter((t) => t.source === source || t.ipAddress === source);
  }

  if (target) {
    threats = threats.filter((t) => t.target === target || t.serverId === target);
  }

  if (searchTerm) {
    const qStr = String(searchTerm).toLowerCase();
    threats = threats.filter(
      (t) =>
        (t.id || t.threatId || '').toLowerCase().includes(qStr) ||
        (t.type || t.threatType || '').toLowerCase().includes(qStr) ||
        (t.source || t.ipAddress || '').toLowerCase().includes(qStr) ||
        (t.username || '').toLowerCase().includes(qStr) ||
        (t.description || t.explanation || '').toLowerCase().includes(qStr)
    );
  }

  threats.sort(
    (a, b) =>
      new Date(b.detectedAt || b.timestamp || 0).getTime() -
      new Date(a.detectedAt || a.timestamp || 0).getTime()
  );

  if (pageNum) {
    const total = threats.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paged = threats.slice(startIndex, startIndex + limitNum);
    return res.json({
      data: paged,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  }

  if (limit) {
    threats = threats.slice(0, limitNum);
  }

  res.json(threats);
});

// GET /api/threats/:id - Retrieve threat by ID or threatId
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isDbConnected()) {
    try {
      const threat = await ThreatModel.findOne({
        $or: [{ threatId: id }, { _id: isMongoId ? id : null }],
      });
      if (threat) return res.json(threat);
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const threat = (db.threats || db.threatEvents || []).find(
    (t) => t.id === id || t.threatId === id
  );

  if (!threat) {
    return res.status(404).json({ error: 'Threat not found' });
  }

  res.json(threat);
});

// POST /api/threats - Ingest or create a new threat
router.post('/', authenticateToken, requireRole('admin', 'analyst'), async (req: AuthenticatedRequest, res) => {
  const { type, severity, source, target, description, threatType, riskLevel, ipAddress, username, riskScore } = req.body;

  if (!description && !type && !threatType) {
    return res.status(400).json({ error: 'Missing required threat parameters: type/description' });
  }

  const threatId = `THR-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();
  const validSeverity = (severity?.toLowerCase() || riskLevel?.toLowerCase() || 'high') as any;

  let createdThreat: any = null;

  if (isDbConnected()) {
    try {
      createdThreat = await ThreatModel.create({
        threatId,
        type: type || threatType || 'Suspicious Anomaly',
        threatType: threatType || type || 'Suspicious Anomaly',
        severity: ['low', 'medium', 'high', 'critical'].includes(validSeverity) ? validSeverity : 'high',
        riskLevel: riskLevel || 'High',
        riskScore: riskScore || 85,
        source: source || ipAddress || '192.168.1.20',
        ipAddress: ipAddress || source || '192.168.1.20',
        target: target || req.body.serverId || 'SRV-001',
        status: req.body.status || 'new',
        description: description || req.body.explanation || 'Threat anomaly detected',
        explanation: req.body.explanation || description || 'Threat anomaly detected',
        detectedAt: now,
        timestamp: now,
        username: username || 'unknown_user',
        recommendedActions: req.body.recommendedActions || ['Inspect IOCs', 'Quarantine IP subnet'],
        acknowledged: false,
      });

      const activityDoc = await ActivityModel.create({
        activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'threat_detected',
        message: `Threat intercepted: ${createdThreat.type} (${threatId}) on ${createdThreat.target}`,
        severity: validSeverity,
        source: `Threat Sensor (${createdThreat.source})`,
        timestamp: now,
      });

      if (io) {
        io.emit('threat:new', createdThreat);
        io.emit('activity:new', activityDoc);
      }

      return res.status(201).json(createdThreat);
    } catch (e: any) {
      console.warn('[Threats Route] MongoDB create error:', e.message);
    }
  }

  const db = getDb();
  const idVal = uuidv4();
  const newThreat: ThreatEvent = {
    id: idVal,
    threatId,
    type: type || threatType || 'Suspicious Anomaly',
    threatType: threatType || type || 'Suspicious Anomaly',
    severity: validSeverity,
    riskLevel: riskLevel || 'High',
    riskScore: riskScore || 85,
    source: source || ipAddress || '192.168.1.20',
    ipAddress: ipAddress || source || '192.168.1.20',
    target: target || req.body.serverId || 'SRV-001',
    status: req.body.status || 'new',
    description: description || req.body.explanation || 'Threat anomaly detected',
    explanation: req.body.explanation || description || 'Threat anomaly detected',
    detectedAt: now.toISOString(),
    timestamp: now.toISOString(),
    username: username || 'unknown_user',
    recommendedActions: req.body.recommendedActions || ['Inspect IOCs', 'Quarantine IP subnet'],
    acknowledged: false,
  };

  if (!db.threats) db.threats = [];
  db.threats.unshift(newThreat);
  if (!db.threatEvents) db.threatEvents = [];
  db.threatEvents.unshift(newThreat);
  persistDb();

  if (io) {
    io.emit('threat:new', newThreat);
  }

  res.status(201).json(newThreat);
});

// PATCH /api/threats/:id - Update threat status, mitigation, or analyst triage
router.patch('/:id', authenticateToken, requireRole('admin', 'analyst'), async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const { status, acknowledged, assignedTo, notes } = req.body;

  let updatedThreat: any = null;
  const now = new Date();

  if (isDbConnected()) {
    try {
      const threat = await ThreatModel.findOne({
        $or: [{ threatId: id }, { _id: isMongoId ? id : null }],
      });

      if (threat) {
        const oldStatus = threat.status;
        if (status !== undefined) threat.status = status;
        if (acknowledged !== undefined) {
          threat.acknowledged = Boolean(acknowledged);
          if (acknowledged && !status) threat.status = 'mitigated';
        }

        updatedThreat = await threat.save();

        // Record Activity for threat triage/mitigation
        const action = status || (acknowledged ? 'mitigated' : 'updated');
        const activityDoc = await ActivityModel.create({
          activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'threat_status_changed',
          message: `Threat ${threat.threatId} (${threat.type}) status updated to ${action.toUpperCase()} by Analyst`,
          severity: threat.severity === 'critical' ? 'critical' : 'info',
          source: 'SOC Analyst Console',
          timestamp: now,
          metadata: { threatId: threat.threatId, oldStatus, newStatus: threat.status, assignedTo, notes },
        });

        // Record Audit Log for compliance
        await recordAuditLog({
          action: threat.acknowledged ? 'THREAT_MITIGATED' : 'THREAT_UPDATED',
          resourceType: 'threat',
          resourceId: threat.threatId,
          metadata: { oldStatus, newStatus: threat.status, assignedTo, notes },
          req,
        });

        if (io) {
          io.emit('threat:updated', updatedThreat);
          io.emit('activity:new', activityDoc);
        }

        return res.json(updatedThreat);
      }
    } catch (e: any) {
      console.warn('[Threats Route] MongoDB update error:', e.message);
    }
  }

  const db = getDb();
  const threat = (db.threats || db.threatEvents || []).find(
    (t) => t.id === id || t.threatId === id
  );

  if (!threat) {
    return res.status(404).json({ error: 'Threat not found' });
  }

  if (status !== undefined) threat.status = status;
  if (acknowledged !== undefined) {
    threat.acknowledged = Boolean(acknowledged);
    if (acknowledged && !status) threat.status = 'mitigated';
  }

  const activityDoc = {
    activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'threat_status_changed',
    message: `Threat ${threat.threatId || id} marked as ${threat.status}`,
    severity: (threat.severity || 'info') as any,
    source: 'SOC Analyst Console',
    timestamp: now.toISOString(),
  };

  if (!db.activities) db.activities = [];
  db.activities.unshift(activityDoc as any);

  persistDb();

  if (io) {
    io.emit('threat:updated', threat);
    io.emit('activity:new', activityDoc);
  }

  res.json(threat);
});

export default router;
