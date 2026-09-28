import { Router, Response } from 'express';
import { AuditLogModel } from '../models/AuditLog.js';
import {
  authenticateToken,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';

const router = Router();

// Admin-only access to audit trail
router.use(authenticateToken, requireRole('admin'));

/**
 * GET /api/audit-logs
 * Retrieves paginated audit log entries with comprehensive search and filtering
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '25'), 10)));
    const action = req.query.action ? String(req.query.action).trim() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : null;
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : null;

    const filter: any = {};

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate && !isNaN(startDate.getTime())) {
        filter.timestamp.$gte = startDate;
      }
      if (endDate && !isNaN(endDate.getTime())) {
        filter.timestamp.$lte = endDate;
      }
    }

    if (search) {
      filter.$or = [
        { logId: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resourceType: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    if (isDbConnected()) {
      const total = await AuditLogModel.countDocuments(filter);
      const logs = await AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return res.json({
        data: logs,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    return res.json({ data: [], page: 1, limit: 25, total: 0, totalPages: 1 });
  } catch (err: any) {
    console.error('[Audit Logs Error]', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
