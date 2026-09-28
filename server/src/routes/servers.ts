import { Router } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/store.js';
import { ServerModel } from '../models/Server.js';
import { TelemetryModel } from '../models/Telemetry.js';
import { ActivityModel } from '../models/Activity.js';
import { isDbConnected } from '../config/db.js';
import { io } from '../index.js';
import {
  authenticateToken,
  requireRole,
  recordAuditLog,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import type { Server } from '../types.js';

const router = Router();

function generateApiKey(): string {
  return 'tx_' + crypto.randomBytes(24).toString('hex');
}

// GET /api/servers - List all registered server nodes
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res) => {
  if (isDbConnected()) {
    try {
      const servers = await ServerModel.find().sort({ createdAt: 1 });
      return res.json(servers);
    } catch (e: any) {
      console.warn('[Servers Route] MongoDB error, using fallback:', e.message);
    }
  }

  const db = getDb();
  res.json(db.servers || []);
});

// GET /api/servers/:id/telemetry - Fetch recent telemetry history for server performance charts
router.get('/:id/telemetry', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const limit = Math.min(60, parseInt(req.query.limit as string, 10) || 30);

  if (isDbConnected()) {
    try {
      // Find telemetry records by serverId (e.g. SRV-001)
      const records = await TelemetryModel.find({ serverId: id })
        .sort({ timestamp: -1 })
        .limit(limit);

      // Return ascending for time-series charts
      return res.json(records.reverse());
    } catch (e: any) {
      console.warn('[Servers Route] Telemetry history query note:', e.message);
    }
  }

  // Fallback synthetic telemetry history based on current time
  const now = Date.now();
  const fallbackHistory = Array.from({ length: 15 }, (_, i) => {
    const t = new Date(now - (14 - i) * 60000);
    return {
      serverId: id,
      cpuUsage: 40 + Math.sin(i) * 15,
      memoryUsage: 55 + Math.cos(i) * 10,
      activeSessions: 3 + (i % 2),
      health: 'healthy',
      connectionStatus: 'connected',
      timestamp: t.toISOString(),
    };
  });

  res.json(fallbackHistory);
});

// GET /api/servers/:id - Get server details by ID or serverId
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isDbConnected()) {
    try {
      const server = await ServerModel.findOne({
        $or: [{ serverId: id }, { _id: isMongoId ? id : null }],
      });
      if (server) return res.json(server);
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const server = (db.servers || []).find((s) => s.id === id || s.serverId === id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  res.json(server);
});

// POST /api/servers - Register new infrastructure server node (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const { name, hostname, os, ipAddress } = req.body;
  if (!name || !hostname) {
    return res.status(400).json({ error: 'name and hostname are required' });
  }

  const apiKey = generateApiKey();
  const now = new Date();

  if (isDbConnected()) {
    try {
      const serverCount = await ServerModel.countDocuments();
      const serverId = `SRV-${(serverCount + 1).toString().padStart(3, '0')}`;

      const createdServer = await ServerModel.create({
        serverId,
        name,
        hostname,
        apiKey,
        status: 'online',
        health: 'healthy',
        cpuUsage: 35,
        memoryUsage: 50,
        connectionStatus: 'connected',
        lastHeartbeat: now,
        os: os || 'Linux / Ubuntu 24.04',
        ipAddress: ipAddress || '10.0.1.50',
        agentVersion: 'v2.4.1',
      });

      const activityDoc = await ActivityModel.create({
        activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'server_registered',
        message: `New server node ${name} (${serverId}) onboarded to monitoring cluster`,
        severity: 'info',
        source: 'Cluster Manager',
        timestamp: now,
      });

      if (io) {
        io.emit('activity:new', activityDoc);
      }

      return res.status(201).json(createdServer);
    } catch (e: any) {
      console.warn('[Servers Route] MongoDB create error:', e.message);
    }
  }

  const db = getDb();
  const id = uuidv4();
  const serverId = `SRV-${((db.servers?.length || 0) + 1).toString().padStart(3, '0')}`;

  const server: Server = {
    id,
    serverId,
    name,
    hostname,
    apiKey,
    status: 'online',
    health: 'healthy',
    cpuUsage: 35,
    memoryUsage: 50,
    connectionStatus: 'connected',
    lastHeartbeat: now.toISOString(),
    os: os || 'Linux / Ubuntu 24.04',
    ipAddress: ipAddress || '10.0.1.50',
    agentVersion: 'v2.4.1',
    lastSeen: now.toISOString(),
    createdAt: now.toISOString(),
  };

  if (!db.servers) db.servers = [];
  db.servers.push(server);
  persistDb();

  res.status(201).json(server);
});

// PATCH /api/servers/:id - Update server status/health
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const { status, health, cpuUsage, memoryUsage, connectionStatus, name } = req.body;
  const now = new Date();

  if (isDbConnected()) {
    try {
      const server = await ServerModel.findOne({
        $or: [{ serverId: id }, { _id: isMongoId ? id : null }],
      });

      if (server) {
        if (status !== undefined) server.status = status;
        if (health !== undefined) server.health = health;
        if (cpuUsage !== undefined) server.cpuUsage = cpuUsage;
        if (memoryUsage !== undefined) server.memoryUsage = memoryUsage;
        if (connectionStatus !== undefined) server.connectionStatus = connectionStatus;
        if (name !== undefined) server.name = name;
        server.lastHeartbeat = now;

        const updated = await server.save();

        if (io) {
          io.emit('server:telemetry', {
            serverId: server.serverId,
            cpuUsage: server.cpuUsage,
            memoryUsage: server.memoryUsage,
            activeSessions: server.activeSessions,
            connectionStatus: server.connectionStatus,
            health: server.health,
            timestamp: now.toISOString(),
          });
        }

        return res.json(updated);
      }
    } catch (e: any) {
      console.warn('[Servers Route] MongoDB update error:', e.message);
    }
  }

  const db = getDb();
  const server = (db.servers || []).find((s) => s.id === id || s.serverId === id);
  if (!server) return res.status(404).json({ error: 'Server not found' });

  if (status !== undefined) server.status = status;
  if (health !== undefined) server.health = health;
  if (cpuUsage !== undefined) server.cpuUsage = cpuUsage;
  if (memoryUsage !== undefined) server.memoryUsage = memoryUsage;
  if (connectionStatus !== undefined) server.connectionStatus = connectionStatus;
  if (name !== undefined) server.name = name;
  server.lastHeartbeat = now.toISOString();

  persistDb();
  res.json(server);
});

// DELETE /api/servers/:id - Delete a server node
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isDbConnected()) {
    try {
      const deleted = await ServerModel.findOneAndDelete({
        $or: [{ serverId: id }, { _id: isMongoId ? id : null }],
      });

      if (deleted) {
        const activityDoc = await ActivityModel.create({
          activityId: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'server_removed',
          message: `Server node ${deleted.name} (${deleted.serverId}) removed from cluster`,
          severity: 'medium',
          source: 'Cluster Manager',
          timestamp: new Date(),
        });

        if (io) {
          io.emit('activity:new', activityDoc);
        }

        return res.json({ success: true, removedId: id });
      }
    } catch (e: any) {
      console.warn('[Servers Route] MongoDB delete error:', e.message);
    }
  }

  const db = getDb();
  const idx = (db.servers || []).findIndex((s) => s.id === id || s.serverId === id);
  if (idx < 0) return res.status(404).json({ error: 'Server not found' });
  db.servers.splice(idx, 1);
  persistDb();
  res.json({ success: true, removedId: id });
});

// POST /api/servers/:id/regenerate-key - Regenerate API key
router.post('/:id/regenerate-key', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const newApiKey = generateApiKey();

  if (isDbConnected()) {
    try {
      const server = await ServerModel.findOne({
        $or: [{ serverId: id }, { _id: isMongoId ? id : null }],
      });
      if (server) {
        server.apiKey = newApiKey;
        await server.save();
        return res.json({ apiKey: newApiKey });
      }
    } catch (e) {
      // Fallback
    }
  }

  const db = getDb();
  const server = (db.servers || []).find((s) => s.id === id || s.serverId === id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  server.apiKey = newApiKey;
  persistDb();
  res.json({ apiKey: server.apiKey });
});

export default router;
