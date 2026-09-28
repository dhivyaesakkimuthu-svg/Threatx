import { Router, Request, Response } from 'express';
import os from 'os';
import { isDbConnected } from '../config/db.js';
import {
  getDemoServerHealthStatus,
  getDemoServerLatency,
} from '../services/demoServerService.js';
import { io } from '../index.js';

const router = Router();
const APP_VERSION = process.env.THREATX_VERSION || '1.0.0';
const START_TIME = Date.now();

// GET /api/health - Deep health check
router.get('/', (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  const dbStatus = dbConnected ? 'connected' : 'disconnected';
  const demoStatus = getDemoServerHealthStatus();
  const latencyMs = getDemoServerLatency();
  const socketClients = io?.engine?.clientsCount || 0;

  // Distinguish healthy, degraded, offline
  let overallStatus: 'healthy' | 'degraded' | 'offline' = 'healthy';
  if (!dbConnected && demoStatus === 'offline') {
    overallStatus = 'degraded';
  } else if (!dbConnected || demoStatus === 'offline' || demoStatus === 'degraded') {
    overallStatus = 'degraded';
  }

  const memUsage = process.memoryUsage();

  res.json({
    status: overallStatus,
    version: APP_VERSION,
    database: {
      status: dbStatus,
      type: 'MongoDB',
    },
    demoServer: {
      status: demoStatus,
      port: 5001,
      latencyMs,
    },
    socket: {
      status: 'active',
      clients: socketClients,
    },
    system: {
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      memoryMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      platform: os.platform(),
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/info - Lightweight public system & version metadata (safe for SOC UI settings/about)
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    name: 'ThreatX AI Cybersecurity Platform',
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
    demoMode: process.env.DEMO_MODE !== 'false',
    features: [
      'Real-time SOC Monitoring',
      'AI Threat Intelligence & Anomaly Engine',
      'Automated Telemetry Sync',
      'Role-Based Access Control (RBAC)',
      'Security Audit Logging',
      'Simulated Attack Scenario Engine',
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
