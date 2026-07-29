import { Router } from 'express';
import { getDb, persistDb } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let incidents = [...db.incidents];
  if (status) {
    incidents = incidents.filter((i) => i.status === status);
  }
  res.json(incidents);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const relatedThreats = db.threatEvents.filter((e) =>
    incident.relatedEvents.includes(e.id)
  );
  res.json({ ...incident, threats: relatedThreats });
});

router.patch('/:id', (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  if (req.body.status) incident.status = req.body.status;
  if (req.body.assignedTo) incident.assignedTo = req.body.assignedTo;
  incident.updatedAt = new Date().toISOString();
  persistDb();
  res.json(incident);
});

router.post('/:id/notes', (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action: req.body.action || 'Note added',
    analyst: req.body.analyst || 'Analyst',
    notes: req.body.notes || '',
  };
  incident.investigationHistory.push(entry);
  incident.updatedAt = entry.timestamp;
  if (req.body.status) incident.status = req.body.status;
  persistDb();
  res.json(incident);
});

export default router;
