import { Router } from 'express';
import { getDb, persistDb } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';
import { validate, updateIncidentSchema, addIncidentNoteSchema } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { analyzeIncidentWithGemini } from '../services/gemini.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let incidents = [...db.incidents];
  if (status) {
    incidents = incidents.filter((i) => i.status === status);
  }
  res.json(incidents);
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const relatedThreats = db.threatEvents.filter((e) =>
    incident.relatedEvents.includes(e.id)
  );
  res.json({ ...incident, threats: relatedThreats });
});

router.patch('/:id', requireAuth, requireRole('admin', 'analyst'), validate(updateIncidentSchema), (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  if (req.body.status) incident.status = req.body.status;
  if (req.body.assignedTo) incident.assignedTo = req.body.assignedTo;
  incident.updatedAt = new Date().toISOString();
  persistDb();
  res.json(incident);
});

router.post('/:id/notes', requireAuth, requireRole('admin', 'analyst'), validate(addIncidentNoteSchema), (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action: req.body.action || 'Note added',
    analyst: req.body.analyst || (req as any).user?.name || 'Analyst',
    notes: req.body.notes || '',
  };
  incident.investigationHistory.push(entry);
  incident.updatedAt = entry.timestamp;
  if (req.body.status) incident.status = req.body.status;
  persistDb();
  res.json(incident);
});

router.post('/:id/ai-investigate', requireAuth, async (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const relatedThreats = db.threatEvents.filter((e) =>
    incident.relatedEvents.includes(e.id)
  );

  const report = await analyzeIncidentWithGemini(incident, relatedThreats);
  res.json({ success: true, report });
});

export default router;

