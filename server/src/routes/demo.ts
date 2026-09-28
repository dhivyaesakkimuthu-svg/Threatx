import { Router, Request, Response } from 'express';
import { ingestSecurityEvent } from '../services/demoServerService.js';
import { io } from '../index.js';
import { isDbConnected } from '../config/db.js';
import {
  ThreatModel,
  AlertModel,
  ActivityModel,
  SessionModel,
  ServerModel,
  IntelligenceDecisionModel,
  ReportModel,
} from '../models/index.js';
import { seedDemoData } from '../seed.js';
import { getDb, persistDb } from '../db/store.js';

const router = Router();

export interface DemoScenarioInfo {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  description: string;
  simulatedEvent: string;
  expectedOutcome: string;
}

export const DEMO_SCENARIOS: DemoScenarioInfo[] = [
  {
    id: 'normal-operations',
    name: 'Scenario 1: Normal Operations',
    category: 'Baseline Activity',
    severity: 'info',
    description: 'Simulates routine SSH authentication and regular system log reviews.',
    simulatedEvent: 'Standard user login from internal subnet with 2FA verification.',
    expectedOutcome: 'Activity log recorded with low risk score (<20); baseline server telemetry maintained.',
  },
  {
    id: 'suspicious-login',
    name: 'Scenario 2: Suspicious Login Burst',
    category: 'Authentication Anomaly',
    severity: 'high',
    description: 'Simulates multiple rapid failed authentication attempts against administrative accounts.',
    simulatedEvent: 'Sequential failed logins for user root from suspicious IP 192.168.1.200.',
    expectedOutcome: 'AI anomaly flag raised, risk score 88+, high-severity Threat and Alert generated.',
  },
  {
    id: 'resource-anomaly',
    name: 'Scenario 3: Server Resource Anomaly',
    category: 'Infrastructure Health',
    severity: 'medium',
    description: 'Simulates an anomalous CPU and memory spike on target server node SRV-001.',
    simulatedEvent: 'CPU usage spikes to 94.8%, memory usage at 89.2% with concurrent process surge.',
    expectedOutcome: 'Server health status switches to warning, telemetry broadcast via Socket.IO.',
  },
  {
    id: 'high-risk-event',
    name: 'Scenario 4: High-Risk Privilege Escalation',
    category: 'Access Violation',
    severity: 'high',
    description: 'Simulates unauthorized sudo invocation and sensitive credential file inspection.',
    simulatedEvent: 'User alice.johnson attempts restricted file access on /srv/app/.env.',
    expectedOutcome: 'High-severity Threat created, AI calculates risk score 85+, activity timeline updated.',
  },
  {
    id: 'critical-threat',
    name: 'Scenario 5: Critical Multi-Vector Threat + Alert',
    category: 'Automated Intrusion',
    severity: 'critical',
    description: 'Simulates a coordinated external SSH credential dump and geo-impossible travel.',
    simulatedEvent: 'Brute-force credential stuffing from 203.0.113.199 followed by credential dump probe.',
    expectedOutcome: 'Critical Threat and Alert created, risk score 96+, instant real-time Socket.IO notification.',
  },
];

// GET /api/demo/scenarios - List available demonstration scenarios
router.get('/scenarios', (_req: Request, res: Response) => {
  const isDemoEnabled = process.env.DEMO_MODE !== 'false';
  res.json({
    demoMode: isDemoEnabled,
    count: DEMO_SCENARIOS.length,
    scenarios: DEMO_SCENARIOS,
  });
});

// POST /api/demo/scenario - Trigger a controlled security event simulation scenario
router.post('/scenario', async (req: Request, res: Response) => {
  // Safety check: only allow demo scenario trigger when DEMO_MODE is true or dev environment
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'false') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Demo scenario engine is disabled in strict production mode.',
    });
  }

  const { scenario } = req.body || {};
  if (!scenario || typeof scenario !== 'string') {
    return res.status(400).json({
      error: 'Invalid Request',
      message: "A 'scenario' string identifier is required (e.g., 'critical-threat', 'suspicious-login').",
      availableScenarios: DEMO_SCENARIOS.map((s) => s.id),
    });
  }

  const selectedScenario = DEMO_SCENARIOS.find((s) => s.id === scenario.toLowerCase());
  if (!selectedScenario) {
    return res.status(404).json({
      error: 'Scenario Not Found',
      message: `Scenario '${scenario}' does not exist.`,
      availableScenarios: DEMO_SCENARIOS.map((s) => s.id),
    });
  }

  const now = new Date();
  let generatedEvents: any[] = [];
  let resultSummary: any = {};

  try {
    switch (selectedScenario.id) {
      case 'normal-operations': {
        const event = {
          timestamp: now.toISOString(),
          event_type: 'ssh_login',
          username: 'alice.johnson',
          source_ip: '10.0.1.15',
          severity: 'info',
          details: '[SIMULATION] Routine SSH authentication verified with 2FA token.',
          target: 'SRV-001',
          metadata: { simulated: true, scenario: selectedScenario.id },
        };
        const ingestRes = await ingestSecurityEvent(event, io);
        generatedEvents.push(event);
        resultSummary = {
          scenario: selectedScenario.id,
          name: selectedScenario.name,
          riskLevel: 'Low',
          riskScore: 12,
          activityCreated: Boolean(ingestRes.activity),
          threatCreated: Boolean(ingestRes.threat),
          alertCreated: Boolean(ingestRes.alert),
        };
        break;
      }

      case 'suspicious-login': {
        const ip = '192.168.1.200';
        const usernames = ['admin', 'root', 'security'];
        for (const u of usernames) {
          const evt = {
            timestamp: new Date(Date.now() - Math.random() * 5000).toISOString(),
            event_type: 'failed_login',
            username: u,
            source_ip: ip,
            severity: 'high',
            details: `[SIMULATION] Authentication failure detected for user '${u}' from unauthenticated subnet.`,
            target: 'SRV-001',
            metadata: { simulated: true, scenario: selectedScenario.id, burstCount: 3 },
          };
          await ingestSecurityEvent(evt, io);
          generatedEvents.push(evt);
        }
        resultSummary = {
          scenario: selectedScenario.id,
          name: selectedScenario.name,
          riskLevel: 'High',
          riskScore: 88,
          eventsIngested: generatedEvents.length,
          threatGenerated: true,
          alertGenerated: true,
        };
        break;
      }

      case 'resource-anomaly': {
        // Emit server telemetry spike
        if (io) {
          io.emit('server:telemetry', {
            serverId: 'SRV-001',
            cpuUsage: 94.8,
            memoryUsage: 89.2,
            activeSessions: 8,
            connectionStatus: 'connected',
            health: 'warning',
            timestamp: now.toISOString(),
          });
        }
        const event = {
          timestamp: now.toISOString(),
          event_type: 'resource_anomaly',
          username: 'system_daemon',
          source_ip: '127.0.0.1',
          severity: 'medium',
          details: '[SIMULATION] Target node SRV-001 exceeded 90% CPU threshold (Current: 94.8%).',
          target: 'SRV-001',
          metadata: { simulated: true, scenario: selectedScenario.id, cpu: 94.8, memory: 89.2 },
        };
        const ingestRes = await ingestSecurityEvent(event, io);
        generatedEvents.push(event);
        resultSummary = {
          scenario: selectedScenario.id,
          name: selectedScenario.name,
          riskLevel: 'Medium',
          riskScore: 65,
          telemetryEmitted: true,
          activityCreated: Boolean(ingestRes.activity),
        };
        break;
      }

      case 'high-risk-event': {
        const event = {
          timestamp: now.toISOString(),
          event_type: 'sensitive_download',
          username: 'alice.johnson',
          source_ip: '10.0.0.15',
          severity: 'high',
          details: '[SIMULATION] Unauthorized inspection and download attempt of /srv/app/.env secrets.',
          target: 'SRV-002',
          metadata: { simulated: true, scenario: selectedScenario.id, targetFile: '/srv/app/.env' },
        };
        const ingestRes = await ingestSecurityEvent(event, io);
        generatedEvents.push(event);
        resultSummary = {
          scenario: selectedScenario.id,
          name: selectedScenario.name,
          riskLevel: 'High',
          riskScore: 85,
          threatCreated: Boolean(ingestRes.threat),
          alertCreated: Boolean(ingestRes.alert),
        };
        break;
      }

      case 'critical-threat': {
        const event = {
          timestamp: now.toISOString(),
          event_type: 'credential_dump',
          username: 'root',
          source_ip: '203.0.113.199',
          severity: 'critical',
          details: '[SIMULATION] Multi-vector SSH credential stuffing attack and shadow memory extraction probe intercepted.',
          target: 'SRV-001',
          metadata: { simulated: true, scenario: selectedScenario.id, vector: 'MITRE-T1003' },
        };
        const ingestRes = await ingestSecurityEvent(event, io);
        generatedEvents.push(event);
        resultSummary = {
          scenario: selectedScenario.id,
          name: selectedScenario.name,
          riskLevel: 'Critical',
          riskScore: 98,
          threatCreated: Boolean(ingestRes.threat),
          alertCreated: Boolean(ingestRes.alert),
          activityCreated: Boolean(ingestRes.activity),
        };
        break;
      }
    }

    console.log(`[Demo] Executed simulated scenario '${selectedScenario.name}'`);

    return res.json({
      status: 'success',
      message: `Scenario '${selectedScenario.name}' executed successfully. Real-time telemetry broadcast to connected SOC clients.`,
      scenario: selectedScenario,
      summary: resultSummary,
      events: generatedEvents,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error(`[Demo Error] Failed executing scenario '${scenario}':`, err.message);
    return res.status(500).json({
      error: 'Simulation Error',
      message: err.message || 'Failed to generate demo scenario events.',
    });
  }
});

// POST /api/demo/reset - Safely reset and restore baseline demo data (non-destructive to system/users)
router.post('/reset', async (req: Request, res: Response) => {
  const { confirm } = req.body || {};

  // Require explicit confirmation token to prevent accidental invocation
  if (confirm !== 'RESET_DEMO_DATA') {
    return res.status(400).json({
      error: 'Confirmation Required',
      message: "To reset demo data, you must provide { confirm: 'RESET_DEMO_DATA' } in the JSON payload.",
    });
  }

  try {
    if (isDbConnected()) {
      // Clear dynamic demo events safely (preserves database schemas & user accounts)
      await ThreatModel.deleteMany({});
      await AlertModel.deleteMany({});
      await ActivityModel.deleteMany({});
      await IntelligenceDecisionModel.deleteMany({});
      await ServerModel.deleteMany({});
      await SessionModel.deleteMany({});
      await ReportModel.deleteMany({});
      
      // Re-seed deterministic baseline data
      await seedDemoData();
    } else {
      const db = getDb();
      db.threats = [];
      db.alerts = [];
      db.activities = [];
      db.servers = [];
      db.sessions = [];
      db.reports = [];
      persistDb();
      await seedDemoData();
    }

    if (io) {
      io.emit('system:reset', { timestamp: new Date().toISOString() });
    }

    console.log('[Demo] Development & demo telemetry reset to baseline state.');

    return res.json({
      status: 'success',
      message: 'Demo database safely reset and restored to initial clean baseline state.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Demo Reset Error]', err.message);
    return res.status(500).json({
      error: 'Reset Failed',
      message: err.message,
    });
  }
});

export default router;
