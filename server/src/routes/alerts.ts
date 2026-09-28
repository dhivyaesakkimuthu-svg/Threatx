import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { AlertModel } from '../models/Alert.js';
import { ActivityModel } from '../models/Activity.js';
import { isDbConnected } from '../config/db.js';
import { io } from '../index.js';
import {
  authenticateToken,
  requireRole,
  recordAuditLog,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import type { Alert } from '../types.js';

const router = Router();

// GET /api/alerts - List all alerts with optional filtering & pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { read, severity, status, search, page, limit } = req.query;
  const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : null;
  const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 50;

  if (isDbConnected()) {
    try {
      const filter: Record<string, any> = {};
      if (read !== undefined) {
        filter.read = read === 'true';
      }
      if (severity && severity !== 'all') {
        filter.severity = String(severity).toLowerCase();
      }
      if (status && status !== 'all') {
        filter.status = String(status).toLowerCase();
      }
      if (search) {
        const regex = new RegExp(String(search), 'i');
        filter.$or = [
          { alertId: regex },
          { title: regex },
          { source: regex },
          { description: regex },
        ];
      }

      const total = await AlertModel.countDocuments(filter);

      let query = AlertModel.find(filter).sort({ createdAt: -1 });
      if (pageNum) {
        query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
      } else if (limit) {
        query = query.limit(limitNum);
      }

      const alerts = await query.exec();

      if (pageNum) {
        return res.json({
          data: alerts,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        });
      }

      return res.json(alerts);
    } catch (dbErr: any) {
      console.warn('[Alerts Route] MongoDB error, falling back:', dbErr.message);
    }
  }

  // Memory store fallback
  const db = getDb();
  let alerts = [...(db.alerts || [])];

  if (read !== undefined) {
    const isRead = read === 'true';
    alerts = alerts.filter((a) => Boolean(a.read) === isRead);
  }

  if (severity && severity !== 'all') {
    alerts = alerts.filter(
      (a) => (a.severity || a.riskLevel || '').toLowerCase() === String(severity).toLowerCase()
    );
  }

  if (status && status !== 'all') {
    alerts = alerts.filter(
      (a) => (a.status || 'open').toLowerCase() === String(status).toLowerCase()
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    alerts = alerts.filter(
      (a) =>
        (a.alertId || a.id || '').toLowerCase().includes(q) ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q)
    );
  }

  alerts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (pageNum) {
    const total = alerts.length;
    const startIndex = (pageNum - 1) * limitNum;
    const pagedAlerts = alerts.slice(startIndex, startIndex + limitNum);
    return res.json({
      data: pagedAlerts,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  }

  res.json(alerts.slice(0, limitNum));
});

// GET /api/alerts/:id - Get alert by ID or alertId
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isDbConnected()) {
    try {
      const alert = await AlertModel.findOne({ $or: [{ alertId: id }, { _id: isMongoId ? id : null }] });
      if (alert) return res.json(alert);
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const alert = (db.alerts || []).find((a) => a.id === id || a.alertId === id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

// POST /api/alerts - Create alert
router.post('/', authenticateToken, requireRole('admin', 'analyst'), async (req: AuthenticatedRequest, res) => {
  const { title, message, description, severity, riskLevel, source, target } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
  const validSeverity = (severity?.toLowerCase() || riskLevel?.toLowerCase() || 'high') as any;
  const now = new Date();

  let createdAlert: any = null;

  if (isDbConnected()) {
    try {
      createdAlert = await AlertModel.create({
        alertId,
        title,
        severity: ['low', 'medium', 'high', 'critical'].includes(validSeverity) ? validSeverity : 'high',
        source: source || '192.168.1.20',
        target: target || 'SRV-001',
        status: 'open',
        description: description || message || title,
        read: false,
        createdAt: now,
      });

      // Also create activity
      const activityDoc = await ActivityModel.create({
        activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'alert_created',
        message: `Alert generated: ${title}`,
        severity: validSeverity,
        source: `ThreatX Engine (${source || '192.168.1.20'})`,
        timestamp: now,
      });

      if (io) {
        io.emit('alert:new', createdAlert);
        io.emit('activity:new', activityDoc);
      }

      return res.status(201).json(createdAlert);
    } catch (e: any) {
      console.warn('[Alerts Route] MongoDB create error:', e.message);
    }
  }

  const db = getDb();
  const id = uuidv4();
  const alert: Alert = {
    id,
    alertId,
    title,
    message: message || description || title,
    description: description || message || title,
    severity: validSeverity,
    riskLevel: riskLevel || 'High',
    source: source || '192.168.1.20',
    target: target || 'SRV-001',
    status: 'open',
    read: false,
    createdAt: now.toISOString(),
  };

  if (!db.alerts) db.alerts = [];
  db.alerts.unshift(alert);
  persistDb();

  if (io) {
    io.emit('alert:new', alert);
  }

  res.status(201).json(alert);
});

// PATCH /api/alerts/:id - Triage alert status (open, investigating, resolved, dismissed)
router.patch('/:id', authenticateToken, requireRole('admin', 'analyst'), async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const { status, read, notes } = req.body;

  let updatedAlert: any = null;
  const now = new Date();

  if (isDbConnected()) {
    try {
      const alert = await AlertModel.findOne({
        $or: [{ alertId: id }, { _id: isMongoId ? id : null }],
      });

      if (alert) {
        const oldStatus = alert.status;
        if (status) alert.status = status;
        if (read !== undefined) alert.read = Boolean(read);
        if (status === 'investigating' || status === 'resolved' || status === 'dismissed') {
          alert.read = true;
        }

        updatedAlert = await alert.save();

        // Create Activity Record for Alert Triage action
        const actionLabel = status ? status.toUpperCase() : 'UPDATED';
        const activityDoc = await ActivityModel.create({
          activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'alert_triage',
          message: `Alert ${alert.alertId} (${alert.title}) marked as ${actionLabel} by Analyst`,
          severity: alert.severity === 'critical' ? 'critical' : 'info',
          source: 'SOC Analyst Console',
          timestamp: now,
          metadata: { alertId: alert.alertId, oldStatus, newStatus: status, notes },
        });

        // Record Audit Log
        const auditAction =
          status === 'resolved'
            ? 'ALERT_RESOLVED'
            : status === 'investigating'
            ? 'ALERT_INVESTIGATED'
            : status === 'dismissed'
            ? 'ALERT_DISMISSED'
            : 'ALERT_UPDATED';

        await recordAuditLog({
          action: auditAction,
          resourceType: 'alert',
          resourceId: alert.alertId,
          metadata: { oldStatus, newStatus: status, notes },
          req,
        });

        if (io) {
          io.emit('alert:updated', updatedAlert);
          io.emit('activity:new', activityDoc);
        }

        return res.json(updatedAlert);
      }
    } catch (e: any) {
      console.warn('[Alerts Route] MongoDB update error:', e.message);
    }
  }

  const db = getDb();
  const alert = (db.alerts || []).find((a) => a.id === id || a.alertId === id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  if (read !== undefined) alert.read = Boolean(read);
  if (status) {
    alert.status = status;
    if (status !== 'open') alert.read = true;
  }

  // Add activity log to fallback store
  const activityDoc = {
    activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'alert_triage',
    message: `Alert ${alert.alertId || id} updated to ${status || 'read'}`,
    severity: (alert.severity || 'info') as any,
    source: 'SOC Analyst Console',
    timestamp: now.toISOString(),
  };
  if (!db.activities) db.activities = [];
  db.activities.unshift(activityDoc as any);

  persistDb();

  if (io) {
    io.emit('alert:updated', alert);
    io.emit('activity:new', activityDoc);
  }

  res.json(alert);
});

// POST /api/alerts/read-all - Mark all alerts as read / acknowledged
router.post('/read-all', authenticateToken, requireRole('admin', 'analyst'), async (req: AuthenticatedRequest, res) => {
  if (isDbConnected()) {
    try {
      await AlertModel.updateMany({ read: false }, { $set: { read: true } });
      const activityDoc = await ActivityModel.create({
        activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'alert_bulk_acknowledge',
        message: 'All pending security alerts marked as read in SOC Buffer',
        severity: 'info',
        source: 'SOC Analyst Console',
        timestamp: new Date(),
      });

      if (io) {
        io.emit('activity:new', activityDoc);
      }

      return res.json({ success: true });
    } catch (e: any) {
      console.warn('[Alerts Route] MongoDB read-all error:', e.message);
    }
  }

  const db = getDb();
  (db.alerts || []).forEach((a) => {
    a.read = true;
  });
  persistDb();
  res.json({ success: true, count: db.alerts.length });
});

export default router;
