import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser, UserRole } from '../models/User.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { isDbConnected } from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'threatx-soc-secret-development-key-2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
export const DEMO_SERVER_API_KEY = process.env.DEMO_SERVER_API_KEY || 'threatx-demo-internal-key-2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Generates a signed JWT for an authenticated user
 */
export function generateToken(user: IUser | any): string {
  const payload: AuthUserPayload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Middleware: Authenticates JWT token from Authorization header
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required for this resource',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    if (isDbConnected()) {
      const user = await UserModel.findById(decoded.id).select('status role email name');
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User account not found or revoked',
        });
      }
      if (user.status === 'disabled') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User account has been disabled. Please contact your SOC Administrator.',
        });
      }
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid authorization token',
    });
  }
}

/**
 * Middleware: Role-Based Access Control
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`,
      });
    }

    next();
  };
}

/**
 * Middleware: Verifies internal service communication key or valid admin/analyst token
 */
export function verifyInternalApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any {
  const apiKey = req.headers['x-api-key'] || req.headers['x-service-key'];
  const authHeader = req.headers['authorization'];

  if (apiKey === DEMO_SERVER_API_KEY) {
    req.user = {
      id: 'svc-demo-server',
      email: 'demo-server@internal.threatx.io',
      name: 'Demo Server Internal Agent',
      role: 'admin',
    };
    return next();
  }

  // Also accept valid JWT if present
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === DEMO_SERVER_API_KEY) {
      req.user = {
        id: 'svc-demo-server',
        email: 'demo-server@internal.threatx.io',
        name: 'Demo Server Internal Agent',
        role: 'admin',
      };
      return next();
    }
    return authenticateToken(req, res, next);
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Internal service authentication required',
  });
}

/**
 * Helper: Records an immutable audit log entry in MongoDB
 */
export async function recordAuditLog(data: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  req?: Request;
}): Promise<any> {
  if (!isDbConnected()) return null;
  try {
    const logId = `AUD-${Math.floor(100000 + Math.random() * 900000)}`;
    const ipAddress =
      data.ipAddress ||
      data.req?.ip ||
      (data.req?.headers['x-forwarded-for'] as string) ||
      data.req?.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = data.userAgent || (data.req?.headers['user-agent'] as string) || 'ThreatX SOC';

    const doc = await AuditLogModel.create({
      logId,
      userId: data.userId || (data.req as AuthenticatedRequest)?.user?.id || 'system',
      userEmail: data.userEmail || (data.req as AuthenticatedRequest)?.user?.email || 'system@threatx.io',
      userName: data.userName || (data.req as AuthenticatedRequest)?.user?.name || 'System',
      userRole: data.userRole || (data.req as AuthenticatedRequest)?.user?.role || 'system',
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: data.metadata || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
    return doc;
  } catch (err: any) {
    console.warn('[AuditLog Warning] Could not persist audit log to DB:', err.message);
    return null;
  }
}
