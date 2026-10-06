import { Router } from 'express';
import { getDb } from '../db/store.js';
import { analyzeIncident } from '../engine/geminiAssistant.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/incident/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const relatedThreats = db.threatEvents.filter((e) =>
    incident.relatedEvents.includes(e.id)
  );

  try {
    const analysis = await analyzeIncident(incident, relatedThreats);
    res.json({ success: true, incidentId: incident.id, analysis });
  } catch (err: any) {
    console.error('[Assistant Route] Error:', err);
    res.status(500).json({ error: 'Failed to complete AI incident analysis', details: err?.message });
  }
});

export default router;
