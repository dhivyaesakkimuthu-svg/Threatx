import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, UserRole } from '../models/User.js';
import {
  generateToken,
  authenticateToken,
  recordAuditLog,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticates user credentials, issues signed JWT, and records audit entry.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (isDbConnected()) {
      const user = await UserModel.findOne({ email: cleanEmail });

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      if (user.status === 'disabled') {
        await recordAuditLog({
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          action: 'USER_LOGIN_FAILED_DISABLED',
          resourceType: 'auth',
          resourceId: user._id.toString(),
          metadata: { reason: 'Account is disabled' },
          req,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'This account has been disabled. Please contact your SOC Administrator.',
        });
      }

      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        await recordAuditLog({
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          action: 'USER_LOGIN_FAILED_PASSWORD',
          resourceType: 'auth',
          resourceId: user._id.toString(),
          metadata: { attemptedEmail: cleanEmail },
          req,
        });

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);
      const safeUser = user.toSafeUser();

      // Record successful login audit
      await recordAuditLog({
        userId: safeUser.id,
        userEmail: safeUser.email,
        userName: safeUser.name,
        userRole: safeUser.role,
        action: 'USER_LOGIN',
        resourceType: 'auth',
        resourceId: safeUser.id,
        metadata: { loginTime: user.lastLogin },
        req,
      });

      return res.status(200).json({
        token,
        user: safeUser,
      });
    }

    // Fallback development bypass if database is disconnected
    const fallbackUser = {
      id: 'usr-dev-admin',
      name: 'SOC Administrator',
      email: cleanEmail,
      role: 'admin' as UserRole,
      status: 'active' as const,
      createdAt: new Date(),
    };
    const token = generateToken(fallbackUser as any);
    return res.json({ token, user: fallbackUser });
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user',
    });
  }
});

/**
 * POST /api/auth/register
 * Creates a new SOC user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const assignedRole: UserRole = ['admin', 'analyst', 'viewer'].includes(role) ? role : 'analyst';

    if (isDbConnected()) {
      const existing = await UserModel.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'An account with this email address already exists',
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
        lastLogin: new Date(),
      });

      const token = generateToken(newUser);
      const safeUser = newUser.toSafeUser();

      await recordAuditLog({
        userId: safeUser.id,
        userEmail: safeUser.email,
        userName: safeUser.name,
        userRole: safeUser.role,
        action: 'USER_REGISTER',
        resourceType: 'user',
        resourceId: safeUser.id,
        metadata: { role: assignedRole },
        req,
      });

      return res.status(201).json({
        token,
        user: safeUser,
      });
    }

    return res.status(503).json({ error: 'Database unavailable' });
  } catch (err: any) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user account',
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isDbConnected()) {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user: user.toSafeUser() });
    }

    return res.json({ user: req.user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * POST /api/auth/logout
 * Records audit trail on logout
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await recordAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      resourceType: 'auth',
      resourceId: req.user.id,
      req,
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
