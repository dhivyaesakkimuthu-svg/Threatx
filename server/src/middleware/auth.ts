import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/store.js';
import type { AuthUser, UserRole } from '../types.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'threatx_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      name?: string;
      username?: string;
    };

    const db = getDb();
    const user = db.users?.find(
      (u) => u.id === payload.userId || u.email.toLowerCase() === payload.email?.toLowerCase()
    );

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } else {
      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.username || payload.email.split('@')[0],
        role: payload.role || 'analyst',
      };
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles: (UserRole | UserRole[])[]) {
  const flattened: UserRole[] = roles.flat();
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }
    if (!flattened.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized. Requires: ${flattened.join(', ')}`,
      });
    }
    next();
  };
}
