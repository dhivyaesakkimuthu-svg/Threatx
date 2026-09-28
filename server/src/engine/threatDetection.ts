import { v4 as uuidv4 } from 'uuid';
import type {
  ActivityLog,
  Alert,
  Incident,
  RiskLevel,
  Server,
  ThreatEvent,
  ThreatType,
  UserBehaviorProfile,
} from '../types.js';
import { getDb, persistDb } from '../db/store.js';
import { behaviorManager } from './behaviorProfile.js';

const RESTRICTED_FOLDERS = ['/confidential', '/finance', '/hr/private', '/admin/secrets', '/etc', '/var/www/secrets', '/srv/app', '/db'];
const SENSITIVE_FILES = [
  '/confidential/',
  '/finance/reports/',
  '/hr/private/',
  'passwd',
  '.env',
  'ledger.csv',
  'config.yaml',
  'finance_backup.sql',
  'customer_export.csv',
  'credential_dump',
];

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyRisk(score: number): RiskLevel {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

interface DetectionResult {
  threatType: ThreatType;
  riskScore: number;
  explanation: string;
  recommendedActions: string[];
}

export class ThreatDetectionEngine {
  analyze(log: ActivityLog, server: Server): ThreatEvent[] {
    behaviorManager.updateFromActivity(log);
    const profile = behaviorManager.getProfile(log.userId);
    if (!profile) return [];

    const detections: DetectionResult[] = [];

    if (log.eventType === 'login' || log.eventType === 'failed_login') {
      detections.push(...this.analyzeLogin(log, profile));
    }
    if (log.eventType === 'file_access' || log.eventType === 'file_download') {
      detections.push(...this.analyzeFileAccess(log, profile));
    }

    const events: ThreatEvent[] = [];
    for (const d of detections) {
      const event = this.createThreatEvent(log, server, d);
      events.push(event);
      this.persistThreat(event);
    }
    return events;
  }

  private analyzeLogin(log: ActivityLog, profile: UserBehaviorProfile): DetectionResult[] {
    const results: DetectionResult[] = [];
    const hour = new Date(log.timestamp).getHours();

    if (log.eventType === 'failed_login') {
      if (profile.failedLoginCount >= 3) {
        results.push({
          threatType: 'failed_login_attempts',
          riskScore: Math.min(95, 50 + profile.failedLoginCount * 10),
          explanation: `${profile.failedLoginCount} consecutive failed login attempts detected for user "${log.username}" from IP ${log.ipAddress}. This may indicate a brute-force attack.`,
          recommendedActions: [
            'Temporarily lock the user account',
            'Block the source IP address',
            'Require password reset',
            'Enable MFA for this account',
          ],
        });
      }
      return results;
    }

    if (!profile.knownIps.includes(log.ipAddress) && profile.knownIps.length > 0) {
      results.push({
        threatType: 'unknown_ip',
        riskScore: 55,
        explanation: `User "${log.username}" logged in from an unrecognized IP address (${log.ipAddress}). Known IPs: ${profile.knownIps.join(', ')}.`,
        recommendedActions: [
          'Verify identity via MFA',
          'Send login notification to user',
          'Monitor subsequent activity closely',
        ],
      });
    }

    if (!profile.knownDevices.includes(log.device) && profile.knownDevices.length > 0) {
      results.push({
        threatType: 'new_device',
        riskScore: 45,
        explanation: `New device detected for user "${log.username}": ${log.device}. This device has not been seen before.`,
        recommendedActions: [
          'Require device registration',
          'Send verification email to user',
          'Review device fingerprint details',
        ],
      });
    }

    if (profile.typicalLoginHours.length >= 5) {
      const isUnusualHour = !profile.typicalLoginHours.some(
        (h) => Math.abs(h - hour) <= 2
      );
      if (isUnusualHour && (hour < 6 || hour > 22)) {
        results.push({
          threatType: 'unusual_login_time',
          riskScore: 40,
          explanation: `Login at ${hour}:00 is outside normal hours for "${log.username}". Typical login hours: ${profile.typicalLoginHours.sort((a, b) => a - b).join(', ')}.`,
          recommendedActions: [
            'Verify login with user',
            'Check for automated/scripted access',
            'Review session activity',
          ],
        });
      }
    }

    if (profile.lastLogin?.location && log.location) {
      const distance = haversineDistance(
        profile.lastLogin.location.lat,
        profile.lastLogin.location.lng,
        log.location.lat,
        log.location.lng
      );
      const timeDiff =
        (new Date(log.timestamp).getTime() -
          new Date(profile.lastLogin.timestamp).getTime()) /
        (1000 * 60 * 60);
      const maxSpeed = 900;
      if (timeDiff > 0 && timeDiff < 24 && distance / timeDiff > maxSpeed) {
        results.push({
          threatType: 'impossible_travel',
          riskScore: 90,
          explanation: `Impossible travel detected for "${log.username}". Login from ${log.location.city} (${Math.round(distance)}km away) only ${timeDiff.toFixed(1)} hours after previous login. Physical travel is impossible at this speed.`,
          recommendedActions: [
            'Immediately block the active session',
            'Force identity verification',
            'Revoke all active tokens',
            'Create high-priority incident',
          ],
        });
      }
    }

    return results;
  }

  private analyzeFileAccess(log: ActivityLog, profile: UserBehaviorProfile): DetectionResult[] {
    const results: DetectionResult[] = [];
    if (!log.filePath) return results;

    const isRestricted = RESTRICTED_FOLDERS.some((f) =>
      log.filePath!.toLowerCase().startsWith(f)
    );
    const isSensitive = SENSITIVE_FILES.some((f) =>
      log.filePath!.toLowerCase().includes(f)
    );

    if (isRestricted) {
      profile.restrictedAccessCount += 1;
      const score = profile.restrictedAccessCount >= 3 ? 75 : 50;
      results.push({
        threatType: 'restricted_folder_access',
        riskScore: score,
        explanation: `User "${log.username}" accessed restricted folder: ${log.filePath}. ${profile.restrictedAccessCount} restricted access attempts recorded.`,
        recommendedActions: [
          'Review access permissions',
          'Audit user role assignments',
          'Enable file access logging alerts',
          profile.restrictedAccessCount >= 3 ? 'Suspend file access privileges' : 'Monitor continued access',
        ],
      });
    }

    if (isSensitive && !profile.accessedFiles.includes(log.filePath)) {
      results.push({
        threatType: 'unauthorized_file_access',
        riskScore: 60,
        explanation: `First-time access to sensitive file "${log.filePath}" by user "${log.username}". This file is classified as confidential.`,
        recommendedActions: [
          'Verify business justification for access',
          'Notify data owner',
          'Review DLP policies',
        ],
      });
    }

    if (log.eventType === 'file_download') {
      const recentDownloads = getDb().activityLogs.filter(
        (l) =>
          l.userId === log.userId &&
          l.eventType === 'file_download' &&
          new Date(log.timestamp).getTime() - new Date(l.timestamp).getTime() < 3600000
      );
      if (recentDownloads.length >= 5) {
        results.push({
          threatType: 'mass_download',
          riskScore: 85,
          explanation: `Mass download detected: user "${log.username}" downloaded ${recentDownloads.length + 1} files within the last hour. Latest: ${log.filePath}.`,
          recommendedActions: [
            'Block further downloads immediately',
            'Quarantine downloaded files',
            'Investigate potential data exfiltration',
            'Create high-priority incident',
          ],
        });
      }
    }

    return results;
  }

  private createThreatEvent(
    log: ActivityLog,
    server: Server,
    detection: DetectionResult
  ): ThreatEvent {
    const id = uuidv4();
    const threatId = `THR-${id.substring(0, 6).toUpperCase()}`;
    const riskLevel = classifyRisk(detection.riskScore);
    const severity = (riskLevel.toLowerCase() as 'low' | 'medium' | 'high' | 'critical');
    const timestamp = log.timestamp || new Date().toISOString();

    return {
      id,
      threatId,
      type: detection.threatType || 'Suspicious Activity',
      threatType: detection.threatType || 'Suspicious Activity',
      severity,
      riskLevel,
      riskScore: detection.riskScore,
      source: log.ipAddress || log.sourceIp || '127.0.0.1',
      ipAddress: log.ipAddress || log.sourceIp || '127.0.0.1',
      target: server.serverId || server.name || 'SRV-001',
      serverId: server.serverId || server.id,
      serverName: server.name,
      userId: log.userId,
      username: log.username,
      device: log.device,
      status: 'investigating',
      description: detection.explanation,
      explanation: detection.explanation,
      detectedAt: timestamp,
      timestamp,
      recommendedActions: detection.recommendedActions || [],
      location: log.location ? `${log.location.city}, ${log.location.country}` : undefined,
      filePath: log.filePath,
      acknowledged: false,
    };
  }

  private persistThreat(event: ThreatEvent): void {
    const db = getDb();
    db.threats.unshift(event);
    db.threatEvents.unshift(event);

    if (event.riskLevel === 'High' || event.severity === 'high' || event.severity === 'critical') {
      const alertId = `ALT-${uuidv4().substring(0, 6).toUpperCase()}`;
      const alert: Alert = {
        id: uuidv4(),
        alertId,
        threatEventId: event.id || event.threatId,
        threatId: event.threatId,
        title: `High Risk: ${(event.threatType || event.type || 'Threat').replace(/_/g, ' ')}`,
        message: event.description || event.explanation || 'Threat detected',
        severity: 'critical',
        riskLevel: 'High',
        source: event.source || event.ipAddress || '192.168.1.20',
        target: event.target || 'SRV-001',
        status: 'open',
        read: false,
        createdAt: event.timestamp || event.detectedAt || new Date().toISOString(),
      };
      db.alerts.unshift(alert);

      const incident: Incident = {
        id: uuidv4(),
        threatEventId: event.id || event.threatId,
        title: `Incident: ${(event.threatType || event.type || 'Threat').replace(/_/g, ' ')} - ${event.username}`,
        description: event.explanation || event.description,
        riskLevel: 'High',
        status: 'open',
        assignedTo: 'Security Team',
        createdAt: event.timestamp || new Date().toISOString(),
        updatedAt: event.timestamp || new Date().toISOString(),
        investigationHistory: [
          {
            id: uuidv4(),
            timestamp: event.timestamp || new Date().toISOString(),
            action: 'Incident auto-created',
            analyst: 'ThreatX AI Engine',
            notes: `Automatically created from high-risk threat detection. Risk score: ${event.riskScore}/100.`,
          },
        ],
        relatedEvents: [event.id || event.threatId],
      };
      db.incidents.unshift(incident);
    }

    persistDb();
  }
}

export const threatEngine = new ThreatDetectionEngine();
