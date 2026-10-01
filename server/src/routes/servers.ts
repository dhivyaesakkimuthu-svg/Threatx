import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb, persistDb } from '../db/store.js';

const router = Router();

function generateApiKey(): string {
  return `tx_${crypto.randomBytes(24).toString('hex')}`;
}

router.get('/', (_req, res) => {
  const db = getDb();
  const servers = db.servers.map(({ apiKey: _, ...rest }) => rest);
  res.json(servers);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const server = db.servers.find((s) => s.id === req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const { apiKey: _, ...rest } = server;
  res.json(rest);
});

router.post('/', (req, res) => {
  const { name, hostname, os, ipAddress } = req.body;
  if (!name || !hostname) {
    return res.status(400).json({ error: 'Name and hostname are required' });
  }
  const db = getDb();
  const apiKey = generateApiKey();
  const server = {
    id: uuidv4(),
    name,
    hostname,
    apiKey,
    status: 'pending' as const,
    os: os || 'Unknown',
    ipAddress: ipAddress || '',
    agentVersion: '',
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.servers.push(server);
  persistDb();
  res.status(201).json(server);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const idx = db.servers.findIndex((s) => s.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Server not found' });
  db.servers.splice(idx, 1);
  persistDb();
  res.json({ success: true });
});

router.post('/:id/regenerate-key', (req, res) => {
  const db = getDb();
  const server = db.servers.find((s) => s.id === req.params.id);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  server.apiKey = generateApiKey();
  persistDb();
  res.json({ apiKey: server.apiKey });
});

export default router;
