import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { isDbConnected } from '../config/db.js';
import { ReportModel } from '../models/Report.js';
import type { Report } from '../types.js';
import { authenticateToken, requireRole, recordAuditLog } from '../middleware/auth.js';

const router = Router();

// GET /api/reports - List all compliance & incident reports
router.get('/', authenticateToken, async (_req, res) => {
  if (isDbConnected()) {
    try {
      const reports = await ReportModel.find().sort({ generatedAt: -1, createdAt: -1 });
      return res.json(reports);
    } catch {
      // Fallback
    }
  }
  const db = getDb();
  res.json(db.reports || []);
});

// GET /api/reports/:id - Get single report
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (isDbConnected()) {
    try {
      const report = await ReportModel.findOne({ $or: [{ reportId: id }, { _id: id }] });
      if (report) return res.json(report);
    } catch {
      // Fallback
    }
  }
  const db = getDb();
  const report = (db.reports || []).find((r) => r.id === id || r.reportId === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

// POST /api/reports - Generate a new security summary report
router.post('/', authenticateToken, requireRole('admin', 'analyst'), async (req, res) => {
  const { title, type, summary, severity, period, metrics } = req.body;
  if (!title || !summary) {
    return res.status(400).json({ error: 'title and summary are required' });
  }

  const id = uuidv4();
  const reportId = `RPT-${new Date().getFullYear()}-${id.substring(0, 4).toUpperCase()}`;
  const now = new Date();

  let createdReport: any = null;

  if (isDbConnected()) {
    try {
      createdReport = await ReportModel.create({
        reportId,
        title,
        type: type || 'security_summary',
        summary,
        author: req.body.author || (req as any).user?.name || 'ThreatX SOC Lead',
        createdBy: req.body.author || (req as any).user?.name || 'ThreatX SOC Lead',
        severity: severity || 'medium',
        period: period || 'Last 24 Hours',
        metrics: metrics || { totalThreats: 8, resolvedAlerts: 6 },
        status: 'generated',
        generatedAt: now,
      });
    } catch (dbErr: any) {
      console.warn('[Reports Warning] Failed to persist report in MongoDB:', dbErr.message);
    }
  }

  const db = getDb();
  const report: Report = {
    id,
    reportId,
    title,
    type: type || 'security_summary',
    summary,
    author: req.body.author || (req as any).user?.name || 'ThreatX SOC Lead',
    severity: severity || 'medium',
    period: period || 'Last 24 Hours',
    metrics: metrics || { totalThreats: (db.threats || []).length },
    status: 'generated',
    createdAt: now.toISOString(),
  };

  if (!db.reports) db.reports = [];
  db.reports.unshift(report);
  persistDb();

  await recordAuditLog({
    userId: (req as any).user?.id,
    action: 'REPORT_GENERATED',
    resourceType: 'report',
    resourceId: report.reportId,
    metadata: { title: report.title, type: report.type },
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(createdReport || report);
});

export default router;
