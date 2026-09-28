import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, UserRole } from '../models/User.js';
import {
  authenticateToken,
  requireRole,
  recordAuditLog,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';

const router = Router();

// Apply authentication and ADMIN role requirement to all user management routes
router.use(authenticateToken, requireRole('admin'));

/**
 * GET /api/users
 * Lists users with pagination and search
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const search = req.query.search ? String(req.query.search).trim() : null;
    const role = req.query.role ? String(req.query.role).toLowerCase() : null;

    const filter: any = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (isDbConnected()) {
      const total = await UserModel.countDocuments(filter);
      const users = await UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-passwordHash');

      const safeUsers = users.map((u) => u.toSafeUser());

      return res.json({
        data: safeUsers,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    return res.json({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
  } catch (err: any) {
    console.error('[Users List Error]', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/users
 * Admin creates a new user
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and password are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const assignedRole: UserRole = ['admin', 'analyst', 'viewer'].includes(role) ? role : 'analyst';

    if (isDbConnected()) {
      const existing = await UserModel.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A user with this email address already exists',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await UserModel.create({
        name: String(name).trim(),
        username: cleanEmail.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900),
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        status: 'active',
      });

      const safeUser = newUser.toSafeUser();

      await recordAuditLog({
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: safeUser.id,
        metadata: { createdEmail: cleanEmail, role: assignedRole },
        req,
      });

      return res.status(201).json(safeUser);
    }

    return res.status(503).json({ error: 'Database unavailable' });
  } catch (err: any) {
    console.error('[User Create Error]', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/users/:id/role
 * Admin updates user role
 */
router.patch('/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!['admin', 'analyst', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    if (isDbConnected()) {
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Safeguard: Do not allow demoting the current logged-in admin if they are the only admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await UserModel.countDocuments({ role: 'admin', status: 'active' });
        if (adminCount <= 1) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot demote the sole active administrator account',
          });
        }
      }

      const previousRole = user.role;
      user.role = role;
      await user.save();

      await recordAuditLog({
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: user._id.toString(),
        metadata: { userEmail: user.email, previousRole, newRole: role },
        req,
      });

      return res.json(user.toSafeUser());
    }

    return res.status(503).json({ error: 'Database unavailable' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * PATCH /api/users/:id/status
 * Admin toggles user status (active/disabled)
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status specified' });
    }

    if (isDbConnected()) {
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Safeguard: Prevent admin from disabling themselves or the only active admin
      if (status === 'disabled' && user.role === 'admin') {
        const adminCount = await UserModel.countDocuments({ role: 'admin', status: 'active' });
        if (adminCount <= 1) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot disable the sole active administrator account',
          });
        }
      }

      user.status = status;
      await user.save();

      await recordAuditLog({
        action: status === 'disabled' ? 'USER_DISABLED' : 'USER_ENABLED',
        resourceType: 'user',
        resourceId: user._id.toString(),
        metadata: { userEmail: user.email, status },
        req,
      });

      return res.json(user.toSafeUser());
    }

    return res.status(503).json({ error: 'Database unavailable' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;
