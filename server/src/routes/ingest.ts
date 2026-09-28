import { Router } from 'express';
import { ingestSecurityEvent } from '../services/demoServerService.js';
import { io } from '../index.js';
import { verifyInternalApiKey } from '../middleware/auth.js';

const router = Router();

// POST /api/ingest/event - Ingest normalized security event from Demo Server or agent (protected via API key)
router.post('/event', verifyInternalApiKey, async (req, res) => {
  try {
    const rawEvent = req.body;
    if (!rawEvent || typeof rawEvent !== 'object') {
      return res.status(400).json({ error: 'Invalid payload: JSON object required' });
    }

    const result = await ingestSecurityEvent(rawEvent, io);
    res.status(201).json({
      status: 'ingested',
      created: {
        activity: Boolean(result.activity),
        threat: Boolean(result.threat),
        alert: Boolean(result.alert),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Ingest Error]', err.message);
    res.status(500).json({ error: 'Failed to process security event', message: err.message });
  }
});

export default router;
