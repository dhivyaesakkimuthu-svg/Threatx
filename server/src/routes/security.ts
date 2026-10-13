import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = Router();
const WINDOW_MS = 2 * 60 * 1000;
const MAX_EVENTS = 500;

const eventSchema = z.object({
  sourceIp: z.string().min(1).max(80),
  username: z.string().max(120).default('unknown'),
  eventType: z.enum(['failed_login', 'login_success', 'suspicious_request', 'http_error', 'server_exception']),
  timestamp: z.string().datetime().optional(),
  details: z.string().max(1000).default(''),
  path: z.string().max(500).optional(),
  statusCode: z.number().int().min(400).max(599).optional(),
  flags: z.array(z.enum(['new_ip', 'odd_hour', 'injection', 'path_traversal', 'route_scan'])).default([]),
});

export type SecurityAlert = {
  id: string;
  sourceIp: string;
  username: string;
  eventType: z.infer<typeof eventSchema>['eventType'];
  timestamp: string;
  details: string;
  path?: string;
  statusCode?: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  recommendedAction: string;
  aiAssessed: boolean;
};

const recentEvents: SecurityAlert[] = [];
const knownLoginIps = new Map<string, Set<string>>();

function matchesInWindow(event: SecurityAlert, current: SecurityAlert, since: number): boolean {
  return event.sourceIp === current.sourceIp && event.username === current.username &&
    Date.parse(event.timestamp) >= since;
}

function assess(event: SecurityAlert, flags: string[], related: SecurityAlert[]): void {
  const failures = related.filter((item) => item.eventType === 'failed_login');
  const failedCount = failures.length;
  const successAfterFailures = event.eventType === 'login_success' && failedCount >= 5 &&
    Math.max(...failures.map((item) => Date.parse(item.timestamp))) < Date.parse(event.timestamp);
  const criticalSignal = flags.includes('injection') || flags.includes('path_traversal') || successAfterFailures;
  const recentErrors = related.filter((item) => item.eventType === 'http_error');

  if (criticalSignal) {
    event.threatLevel = 'CRITICAL';
    event.explanation = successAfterFailures
      ? `${failedCount} failed logins were followed by a successful login from ${event.sourceIp}.`
      : 'A SQL injection or path traversal pattern was detected in the request.';
    event.recommendedAction = 'Block the source IP and immediately review or revoke the affected account session.';
  } else if (event.eventType === 'server_exception') {
    event.threatLevel = 'HIGH';
    event.explanation = 'The monitored server reported an unhandled exception.';
    event.recommendedAction = 'Inspect the server traceback and isolate the affected route if errors continue.';
  } else if (failedCount >= 5) {
    event.threatLevel = 'HIGH';
    event.explanation = `${failedCount} failed logins from this IP and account occurred within two minutes.`;
    event.recommendedAction = 'Temporarily lock the account and block the source IP.';
  } else if (failedCount >= 3 || recentErrors.length >= 5 || flags.includes('route_scan') || flags.includes('new_ip') || flags.includes('odd_hour')) {
    event.threatLevel = 'MEDIUM';
    event.explanation = flags.includes('new_ip') ? 'Successful login from a previously unseen source IP.'
      : flags.includes('odd_hour') ? 'Login occurred outside the account’s usual working hours.'
      : flags.includes('route_scan') ? 'Repeated missing-route requests indicate route scanning.'
      : 'Repeated login failures or HTTP errors crossed the monitoring threshold.';
    event.recommendedAction = 'Verify the activity with the account owner and monitor the source.';
  } else if (event.eventType === 'failed_login') {
    event.threatLevel = 'LOW';
    event.explanation = 'A single failed login was recorded; no burst threshold has been crossed.';
    event.recommendedAction = 'Continue monitoring for additional attempts.';
  } else {
    event.threatLevel = 'LOW';
    event.explanation = 'No high-risk pattern was found in the recent events from this source.';
    event.recommendedAction = 'Continue monitoring.';
  }
}

async function addAiAssessment(event: SecurityAlert, related: SecurityAlert[]): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return;

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(
      `Assess this security event for a SOC operator. Return JSON only: {"explanation":"one short sentence","recommendedAction":"one concise action"}. Keep the assigned level ${event.threatLevel}; do not lower it.\nEvents: ${JSON.stringify(related.slice(-8).map(({ eventType, sourceIp, username, timestamp, details, path }) => ({ eventType, sourceIp, username, timestamp, details, path })))}`
    );
    const text = response.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text) as { explanation?: string; recommendedAction?: string };
    if (parsed.explanation && parsed.recommendedAction) {
      event.explanation = parsed.explanation.slice(0, 500);
      event.recommendedAction = parsed.recommendedAction.slice(0, 300);
      event.aiAssessed = true;
    }
  } catch (error) {
    console.warn('[Security AI] Gemini assessment unavailable; keeping rule-based result:', (error as Error).message);
  }
}

router.get('/events', requireAuth, (_req, res) => {
  res.json([...recentEvents].reverse());
});

router.post('/events', async (req, res) => {
  const expected = process.env.SECURITY_INGEST_TOKEN;
  const supplied = req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected) return res.status(503).json({ error: 'Security event ingestion is not configured.' });
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return res.status(401).json({ error: 'Invalid ingestion token.' });
  }

  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid security event.', details: parsed.error.issues });

  const input = parsed.data;
  const timestamp = input.timestamp ?? new Date().toISOString();
  const key = `${input.sourceIp}:${input.username}`;
  const seenIps = knownLoginIps.get(input.username) ?? new Set<string>();
  const flags = [...input.flags];
  if (input.eventType === 'login_success') {
    if (seenIps.size > 0 && !seenIps.has(input.sourceIp) && !flags.includes('new_ip')) flags.push('new_ip');
    seenIps.add(input.sourceIp);
    knownLoginIps.set(input.username, seenIps);
  }

  const alert: SecurityAlert = {
    id: crypto.randomUUID(),
    sourceIp: input.sourceIp,
    username: input.username,
    eventType: input.eventType,
    timestamp,
    details: input.details,
    path: input.path,
    statusCode: input.statusCode,
    threatLevel: 'LOW',
    explanation: '',
    recommendedAction: '',
    aiAssessed: false,
  };
  recentEvents.push(alert);
  if (recentEvents.length > MAX_EVENTS) recentEvents.splice(0, recentEvents.length - MAX_EVENTS);

  const since = Date.parse(timestamp) - WINDOW_MS;
  const related = recentEvents.filter((item) => matchesInWindow(item, alert, since));
  assess(alert, flags, related);
  getIO()?.to('monitoring').emit('security:alert', alert);
  res.status(201).json(alert);
  void addAiAssessment(alert, related).then(() => {
    if (alert.aiAssessed) getIO()?.to('monitoring').emit('security:alert', alert);
  });
});

export default router;