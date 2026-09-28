import axios from 'axios';
import { Server as SocketIOServer } from 'socket.io';
import { ServerModel } from '../models/Server.js';
import { SessionModel } from '../models/Session.js';
import { ThreatModel } from '../models/Threat.js';
import { AlertModel } from '../models/Alert.js';
import { ActivityModel } from '../models/Activity.js';
import { TelemetryModel } from '../models/Telemetry.js';
import { IntelligenceDecisionModel } from '../models/IntelligenceDecision.js';
import { threatIntelligenceService } from './threatIntelligenceService.js';
import { isDbConnected } from '../config/db.js';
import { getDb, persistDb } from '../db/store.js';

const DEMO_SERVER_URL = process.env.DEMO_SERVER_URL || 'http://localhost:5001';
const SYNC_INTERVAL_MS = 4000;

export interface DemoServerStatus {
  server_health: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  active_session_count: number;
  connection_status: string;
  timestamp: string;
  source?: string;
}

let syncTimer: NodeJS.Timeout | null = null;
let lastKnownHealth: 'connected' | 'degraded' | 'offline' = 'offline';
let lastKnownLatency: number = 15;
let lastKnownStatus: DemoServerStatus | null = null;
const processedEventIds = new Set<string>();

/**
 * Communicates with the Python Demo Server at http://localhost:5001/api/status
 */
export async function fetchDemoServerStatus(): Promise<DemoServerStatus | null> {
  const startTime = Date.now();
  try {
    const response = await axios.get(`${DEMO_SERVER_URL}/api/status`, {
      timeout: 2500,
    });

    lastKnownLatency = Date.now() - startTime;

    if (response.data) {
      const data = response.data;
      lastKnownHealth = data.connection_status === 'degraded' ? 'degraded' : 'connected';
      return {
        server_health: data.server_health || 'healthy',
        cpu_usage_percent: typeof data.cpu_usage_percent === 'number' ? data.cpu_usage_percent : (data.cpu_usage ?? 48.0),
        memory_usage_percent: typeof data.memory_usage_percent === 'number' ? data.memory_usage_percent : (data.memory_usage ?? 62.0),
        active_session_count: typeof data.active_session_count === 'number' ? data.active_session_count : (Array.isArray(data.ssh_sessions) ? data.ssh_sessions.length : 4),
        connection_status: data.connection_status || 'connected',
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'demo_server_live',
      };
    }
  } catch (err: any) {
    lastKnownHealth = 'offline';
  }
  return null;
}

export function getDemoServerHealthStatus(): 'connected' | 'degraded' | 'offline' {
  return lastKnownHealth;
}

export function getDemoServerLatency(): number {
  return lastKnownLatency;
}

/**
 * Ingests a raw security event from Demo Server or monitoring agent into MongoDB & broadcasts via Socket.IO
 */
export async function ingestSecurityEvent(rawEvent: any, io?: SocketIOServer): Promise<{
  activity?: any;
  threat?: any;
  alert?: any;
}> {
  if (!rawEvent || typeof rawEvent !== 'object') {
    throw new Error('Invalid security event payload');
  }

  const timestamp = rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date();
  const eventType = String(rawEvent.event_type || rawEvent.eventType || rawEvent.type || 'system_event').toLowerCase();
  const username = String(rawEvent.username || rawEvent.user || 'system');
  const sourceIp = String(rawEvent.source_ip || rawEvent.ip_address || rawEvent.source || rawEvent.ip || '127.0.0.1');
  const severity = String(rawEvent.severity || rawEvent.riskLevel || 'info').toLowerCase();
  const details = String(rawEvent.details || rawEvent.message || rawEvent.description || 'Security telemetry recorded');
  const target = String(rawEvent.target || rawEvent.serverId || 'SRV-001');

  // Deterministic deduplication key
  const dedupeKey = `${timestamp.toISOString()}_${eventType}_${username}_${sourceIp}_${details.substring(0, 30)}`;
  if (processedEventIds.has(dedupeKey)) {
    return {};
  }
  processedEventIds.add(dedupeKey);
  if (processedEventIds.size > 2000) {
    const firstKey = processedEventIds.values().next().value;
    if (firstKey) processedEventIds.delete(firstKey);
  }

  // 0. Perform AI Threat Intelligence & Anomaly Analysis
  const aiAnalysis = threatIntelligenceService.analyze({
    event: rawEvent,
    telemetry: lastKnownStatus || undefined,
  });

  let activityDoc: any = null;
  let threatDoc: any = null;
  let alertDoc: any = null;

  const validSeverity = ['info', 'low', 'medium', 'high', 'critical'].includes(severity) ? severity : 'info';
  const activityId = `ACT-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;

  if (isDbConnected()) {
    try {
      // 1. Create Activity record
      activityDoc = await ActivityModel.create({
        activityId,
        type: eventType,
        message: details,
        severity: validSeverity,
        source: `Demo Server (${sourceIp})`,
        username,
        sourceIp,
        timestamp,
        metadata: {
          ...(rawEvent.metadata || {}),
          aiRiskScore: aiAnalysis.riskScore,
          aiRiskLevel: aiAnalysis.riskLevel,
          aiConfidence: aiAnalysis.confidence,
          aiAnomalies: aiAnalysis.anomalies,
        },
      });

      if (io) {
        io.emit('activity:new', activityDoc);
      }

      // 2. Check if event is a threat vector or flagged by AI
      const isThreat =
        ['failed_login', 'impossible_travel', 'sensitive_download', 'credential_dump', 'restricted_folder_access', 'unauthorized_access', 'port_scan'].includes(eventType) ||
        severity === 'high' ||
        severity === 'critical' ||
        aiAnalysis.riskLevel === 'high' ||
        aiAnalysis.riskLevel === 'critical' ||
        aiAnalysis.anomalies.length > 0;

      if (isThreat) {
        const threatId = `THR-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
        threatDoc = await ThreatModel.create({
          threatId,
          type: eventType.replace(/_/g, ' ').toUpperCase(),
          severity: aiAnalysis.riskLevel === 'critical' || severity === 'critical' ? 'critical' : 'high',
          source: sourceIp,
          target,
          status: 'new',
          description: details,
          detectedAt: timestamp,
          username,
          riskScore: aiAnalysis.riskScore,
          ipAddress: sourceIp,
          threatType: eventType.replace(/_/g, ' ').toUpperCase(),
          explanation: details,
          recommendedActions: [aiAnalysis.recommendedAction],
          aiAnalysis,
        });

        if (io) {
          io.emit('threat:new', threatDoc);
        }

        // 3. Check if event qualifies for an Alert
        if (aiAnalysis.riskLevel === 'critical' || aiAnalysis.riskLevel === 'high' || severity === 'critical' || severity === 'high') {
          const alertId = `ALT-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
          alertDoc = await AlertModel.create({
            alertId,
            title: `${eventType.replace(/_/g, ' ').toUpperCase()} Intercepted`,
            severity: aiAnalysis.riskLevel === 'critical' || severity === 'critical' ? 'critical' : 'high',
            source: sourceIp,
            target,
            status: 'open',
            description: details,
            createdAt: timestamp,
            read: false,
            aiAnalysis,
          });

          if (io) {
            io.emit('alert:new', alertDoc);
          }
        }
      }

      // 4. If AI identified high/critical risk or anomalies, emit intelligence:new & persist decision
      if (aiAnalysis.riskLevel === 'high' || aiAnalysis.riskLevel === 'critical' || aiAnalysis.anomalies.length > 0) {
        if (io) {
          io.emit('intelligence:new', {
            analysis: aiAnalysis,
            threat: threatDoc,
            alert: alertDoc,
            event: rawEvent,
            timestamp: new Date().toISOString(),
          });
        }
        await threatIntelligenceService.persistDecision(
          aiAnalysis,
          rawEvent,
          lastKnownStatus,
          threatDoc?.threatId,
          alertDoc?.alertId
        );
      }
    } catch (dbErr: any) {
      console.warn('[DemoSync Warning] Could not persist event to MongoDB:', dbErr.message);
    }
  } else {
    // Fallback store
    const db = getDb();
    activityDoc = {
      activityId,
      type: eventType,
      message: details,
      severity: validSeverity,
      source: `Demo Server (${sourceIp})`,
      username,
      sourceIp,
      timestamp: timestamp.toISOString(),
      metadata: rawEvent.metadata || {},
    };
    if (!db.activities) db.activities = [];
    db.activities.unshift(activityDoc);

    const isThreat =
      ['failed_login', 'impossible_travel', 'sensitive_download', 'credential_dump', 'restricted_folder_access', 'unauthorized_access', 'port_scan'].includes(eventType) ||
      severity === 'high' ||
      severity === 'critical';

    if (isThreat) {
      const threatId = `THR-${Math.floor(10000 + Math.random() * 90000)}`;
      threatDoc = {
        id: threatId,
        threatId,
        type: eventType.replace(/_/g, ' ').toUpperCase(),
        threatType: eventType.replace(/_/g, ' ').toUpperCase(),
        severity: severity === 'critical' ? 'critical' : 'high',
        riskLevel: severity === 'critical' ? 'Critical' : 'High',
        source: sourceIp,
        ipAddress: sourceIp,
        target,
        status: 'new',
        description: details,
        explanation: details,
        detectedAt: timestamp.toISOString(),
        timestamp: timestamp.toISOString(),
        username,
        riskScore: severity === 'critical' ? 95 : 80,
        recommendedActions: ['Inspect Threat Vectors', 'Block Subnet'],
      };
      if (!db.threats) db.threats = [];
      db.threats.unshift(threatDoc);

      if (severity === 'critical' || severity === 'high') {
        const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
        alertDoc = {
          id: alertId,
          alertId,
          title: `${eventType.replace(/_/g, ' ').toUpperCase()} Intercepted`,
          severity: severity === 'critical' ? 'critical' : 'high',
          source: sourceIp,
          target,
          status: 'open',
          description: details,
          message: details,
          createdAt: timestamp.toISOString(),
          read: false,
        };
        if (!db.alerts) db.alerts = [];
        db.alerts.unshift(alertDoc);
      }
    }
    persistDb();

    if (io) {
      if (activityDoc) io.emit('activity:new', activityDoc);
      if (threatDoc) io.emit('threat:new', threatDoc);
      if (alertDoc) io.emit('alert:new', alertDoc);
    }
  }

  return { activity: activityDoc, threat: threatDoc, alert: alertDoc };
}

/**
 * Synchronizes real-time telemetry, server document, telemetry history, and SSH sessions with MongoDB & Socket.IO
 */
export async function syncDemoServer(io?: SocketIOServer): Promise<void> {
  try {
    // 1. Query Demo Server /api/status
    const status = await fetchDemoServerStatus();
    if (!status) return;
    lastKnownStatus = status;

    const now = new Date();

    if (isDbConnected()) {
      // 2. Upsert Server document in MongoDB for SRV-001 (ThreatX Demo Server)
      await ServerModel.findOneAndUpdate(
        { serverId: 'SRV-001' },
        {
          $set: {
            name: 'ThreatX Demo Server',
            ipAddress: '127.0.0.1',
            status: status.connection_status === 'degraded' ? 'warning' : 'online',
            health: status.server_health || 'healthy',
            cpuUsage: status.cpu_usage_percent,
            memoryUsage: status.memory_usage_percent,
            connectionStatus: status.connection_status || 'connected',
            activeSessions: status.active_session_count,
            lastHeartbeat: now,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      // 3. Record historical telemetry snapshot in MongoDB
      try {
        await TelemetryModel.create({
          serverId: 'SRV-001',
          cpuUsage: status.cpu_usage_percent,
          memoryUsage: status.memory_usage_percent,
          activeSessions: status.active_session_count,
          health: status.server_health || 'healthy',
          connectionStatus: status.connection_status || 'connected',
          timestamp: now,
        });

        // Retention policy: keep last 120 records for SRV-001 to avoid unbounded growth
        const count = await TelemetryModel.countDocuments({ serverId: 'SRV-001' });
        if (count > 120) {
          const oldestDocs = await TelemetryModel.find({ serverId: 'SRV-001' })
            .sort({ timestamp: 1 })
            .limit(count - 100)
            .select('_id');
          await TelemetryModel.deleteMany({ _id: { $in: oldestDocs.map((d) => d._id) } });
        }
      } catch (telErr: any) {
        // Telemetry save note
      }

      // 4. Emit real-time telemetry to connected Socket.IO clients
      if (io) {
        io.emit('server:telemetry', {
          serverId: 'SRV-001',
          cpuUsage: status.cpu_usage_percent,
          memoryUsage: status.memory_usage_percent,
          activeSessions: status.active_session_count,
          connectionStatus: status.connection_status,
          health: status.server_health,
          timestamp: status.timestamp,
        });
      }

      // 5. Ingest recent logs from Demo Server /api/logs if available
      try {
        const logsRes = await axios.get(`${DEMO_SERVER_URL}/api/logs`, { timeout: 2000 });
        if (logsRes.data && Array.isArray(logsRes.data.logs)) {
          const recentLogs = logsRes.data.logs.slice(-3);
          for (const rawLog of recentLogs) {
            await ingestSecurityEvent(rawLog, io);
          }
        }
      } catch {
        // Logs endpoint momentarily busy or offline
      }
    }
  } catch (err: any) {
    console.warn('[DemoSync Warning] Synchronization iteration note:', err.message);
  }
}

/**
 * Starts the central background synchronization loop once
 */
export function startDemoSync(io?: SocketIOServer): void {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  console.log(`[DemoSync] Initializing Demo Server synchronization with interval ${SYNC_INTERVAL_MS}ms`);
  syncDemoServer(io);

  syncTimer = setInterval(() => {
    syncDemoServer(io);
  }, SYNC_INTERVAL_MS);
}

/**
 * Stops the background synchronization loop cleanly
 */
export function stopDemoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[DemoSync] Background synchronization stopped.');
  }
}

export default {
  fetchDemoServerStatus,
  getDemoServerHealthStatus,
  getDemoServerLatency,
  ingestSecurityEvent,
  syncDemoServer,
  startDemoSync,
  stopDemoSync,
};
