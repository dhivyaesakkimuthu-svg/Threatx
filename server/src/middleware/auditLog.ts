import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response, NextFunction } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit.log');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  const mutatingMethods = ['POST', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  res.on('finish', () => {
    try {
      ensureDataDir();
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';

      const entry = {
        timestamp: new Date().toISOString(),
        userId: (req as any).user?.id || (req as any).user?.userId || null,
        action: req.method,
        resource: req.originalUrl || req.url,
        ip,
        status: res.statusCode,
      };

      fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (err) {
      console.error('Failed to write audit log entry:', err);
    }
  });

  next();
}
