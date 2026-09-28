import { INTELLIGENCE_CONFIG } from '../config/intelligenceConfig.js';
import { IntelligenceDecisionModel } from '../models/IntelligenceDecision.js';
import { isDbConnected } from '../config/db.js';

export interface AnalysisInput {
  event?: any;
  telemetry?: {
    cpuUsage?: number;
    cpu_usage_percent?: number;
    memoryUsage?: number;
    memory_usage_percent?: number;
    activeSessions?: number;
    active_session_count?: number;
    health?: string;
    server_health?: string;
  };
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: string[];
  anomalies: string[];
  recommendedAction: string;
  analyzedAt: string;
}

interface HistoricalEventRecord {
  timestamp: number;
  sourceIp: string;
  eventType: string;
  username: string;
}

/**
 * Stateful Threat Intelligence & Anomaly Detection Engine
 */
class ThreatIntelligenceEngine {
  private recentHistory: HistoricalEventRecord[] = [];
  private readonly windowMs = INTELLIGENCE_CONFIG.AI_CORRELATION_WINDOW_MS;

  /**
   * Cleans up stale events outside the correlation window
   */
  private pruneHistory(now: number): void {
    const cutoff = now - this.windowMs;
    this.recentHistory = this.recentHistory.filter((item) => item.timestamp >= cutoff);
  }

  /**
   * Records an event in the in-memory rolling window for real-time frequency analysis
   */
  public recordEvent(sourceIp: string, eventType: string, username: string, timestamp = Date.now()): void {
    this.pruneHistory(timestamp);
    this.recentHistory.push({
      timestamp,
      sourceIp: sourceIp || '127.0.0.1',
      eventType: (eventType || 'system_event').toLowerCase(),
      username: username || 'system',
    });
  }

  /**
   * Determines risk level string based on 0-100 score
   */
  public getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= INTELLIGENCE_CONFIG.RISK_LEVELS.CRITICAL.min) return 'critical';
    if (score >= INTELLIGENCE_CONFIG.RISK_LEVELS.HIGH.min) return 'high';
    if (score >= INTELLIGENCE_CONFIG.RISK_LEVELS.MEDIUM.min) return 'medium';
    return 'low';
  }

  /**
   * Core Analysis Method: Evaluates events and telemetry to calculate deterministic risk score,
   * detect anomalies, and generate explainable human-readable rationales.
   */
  public analyze(input: AnalysisInput): AnalysisResult {
    const now = Date.now();
    this.pruneHistory(now);

    const reasons: string[] = [];
    const anomalies: string[] = [];
    let calculatedScore = 0;
    let confidence = 65; // Base confidence

    const rawEvent = input?.event || {};
    const rawTelemetry = input?.telemetry || {};

    // 1. Normalize Event Properties
    const eventType = String(
      rawEvent.event_type || rawEvent.eventType || rawEvent.type || 'nominal_system_check'
    ).toLowerCase();
    const sourceIp = String(rawEvent.source_ip || rawEvent.ip_address || rawEvent.source || rawEvent.ip || '127.0.0.1');
    const username = String(rawEvent.username || rawEvent.user || 'system');
    const severity = String(rawEvent.severity || rawEvent.riskLevel || 'info').toLowerCase();
    const details = String(rawEvent.details || rawEvent.message || rawEvent.description || '');

    // 2. Normalize Telemetry Properties
    const cpuUsage =
      typeof rawTelemetry.cpuUsage === 'number'
        ? rawTelemetry.cpuUsage
        : typeof rawTelemetry.cpu_usage_percent === 'number'
        ? rawTelemetry.cpu_usage_percent
        : null;

    const memoryUsage =
      typeof rawTelemetry.memoryUsage === 'number'
        ? rawTelemetry.memoryUsage
        : typeof rawTelemetry.memory_usage_percent === 'number'
        ? rawTelemetry.memory_usage_percent
        : null;

    const activeSessions =
      typeof rawTelemetry.activeSessions === 'number'
        ? rawTelemetry.activeSessions
        : typeof rawTelemetry.active_session_count === 'number'
        ? rawTelemetry.active_session_count
        : null;

    // --- STEP A: Base Event Signature Evaluation ---
    const baseWeight = INTELLIGENCE_CONFIG.EVENT_BASE_WEIGHTS[eventType];
    if (baseWeight !== undefined) {
      calculatedScore += baseWeight;
      reasons.push(`Event signature matched '${eventType.replace(/_/g, ' ')}' (base risk weight: ${baseWeight})`);
    } else if (severity === 'critical') {
      calculatedScore += 75;
      reasons.push('High-impact critical security severity declared in event telemetry');
    } else if (severity === 'high') {
      calculatedScore += 55;
      reasons.push('Elevated threat severity indicator flagged by detection pipeline');
    } else if (severity === 'medium') {
      calculatedScore += 30;
      reasons.push('Moderate security event severity recorded');
    } else {
      calculatedScore += 10;
      reasons.push('Nominal system event telemetry analyzed');
    }

    // --- STEP B: Telemetry Anomaly Detection ---
    let telemetryAnomalyCount = 0;

    // B1: CPU Utilization Spike
    if (cpuUsage !== null) {
      if (cpuUsage >= INTELLIGENCE_CONFIG.AI_CPU_THRESHOLD) {
        anomalies.push('CPU_SPIKE_ANOMALY');
        calculatedScore += 20;
        telemetryAnomalyCount++;
        reasons.push(
          `Abnormal CPU spike detected at ${cpuUsage.toFixed(1)}% (exceeds threshold of ${
            INTELLIGENCE_CONFIG.AI_CPU_THRESHOLD
          }%)`
        );
      } else if (cpuUsage > 70) {
        calculatedScore += 8;
        reasons.push(`Elevated CPU load observed (${cpuUsage.toFixed(1)}%)`);
      }
    }

    // B2: Memory Saturation Anomaly
    if (memoryUsage !== null) {
      if (memoryUsage >= INTELLIGENCE_CONFIG.AI_MEMORY_THRESHOLD) {
        anomalies.push('MEMORY_SPIKE_ANOMALY');
        calculatedScore += 18;
        telemetryAnomalyCount++;
        reasons.push(
          `Memory saturation anomaly detected at ${memoryUsage.toFixed(1)}% (exceeds threshold of ${
            INTELLIGENCE_CONFIG.AI_MEMORY_THRESHOLD
          }%)`
        );
      }
    }

    // B3: Session Surge Anomaly
    if (activeSessions !== null) {
      if (activeSessions >= INTELLIGENCE_CONFIG.AI_SESSION_SPIKE_THRESHOLD) {
        anomalies.push('SESSION_SPIKE_ANOMALY');
        calculatedScore += 18;
        telemetryAnomalyCount++;
        reasons.push(
          `Sudden surge in active concurrent sessions (${activeSessions} active sessions vs threshold of ${
            INTELLIGENCE_CONFIG.AI_SESSION_SPIKE_THRESHOLD
          })`
        );
      }
    }

    // --- STEP C: Frequency & Repetition Analysis (Rolling Window) ---
    const sourceIpEvents = this.recentHistory.filter((e) => e.sourceIp === sourceIp);
    const failedLogins = sourceIpEvents.filter((e) => e.eventType === 'failed_login');

    if (failedLogins.length >= INTELLIGENCE_CONFIG.AI_AUTH_FAILURE_THRESHOLD) {
      anomalies.push('AUTH_BRUTE_FORCE');
      calculatedScore += 25;
      confidence = Math.max(confidence, 88);
      reasons.push(
        `Repeated authentication failures detected (${failedLogins.length} failed attempts from IP ${sourceIp} in past 5m)`
      );
    }

    if (sourceIpEvents.length >= INTELLIGENCE_CONFIG.AI_EVENT_REPEAT_THRESHOLD) {
      anomalies.push('REPEATED_SOURCE_ACTIVITY');
      calculatedScore += 15;
      confidence = Math.max(confidence, 85);
      reasons.push(
        `High event repetition frequency (${sourceIpEvents.length} events recorded from single source ${sourceIp})`
      );
    }

    // --- STEP D: Correlated Threat Multipliers ---
    if (telemetryAnomalyCount > 0 && (severity === 'high' || severity === 'critical' || baseWeight >= 60)) {
      anomalies.push('CORRELATED_MULTI_VECTOR');
      calculatedScore += 15;
      confidence = Math.max(confidence, 94);
      reasons.push('Multi-vector correlation: Severe security event aligned with host hardware resource saturation');
    }

    // Specific attack type context additions
    if (details.toLowerCase().includes('sql') || details.toLowerCase().includes('injection')) {
      calculatedScore += 15;
      anomalies.push('SQL_INJECTION_PATTERN');
      reasons.push('SQL injection payload patterns identified in payload telemetry');
    }

    // Clamp risk score to 0 - 100
    const finalScore = Math.min(100, Math.max(0, Math.round(calculatedScore)));
    const riskLevel = this.getRiskLevel(finalScore);

    // Adjust confidence based on corroborating data points
    if (reasons.length >= 4) {
      confidence = Math.min(98, confidence + 10);
    } else if (reasons.length <= 1) {
      confidence = Math.min(confidence, 70);
    }

    // --- STEP E: Generate Actionable Response Recommendation ---
    let recommendedAction = 'Continue routine telemetry monitoring; no immediate isolation required.';
    if (riskLevel === 'critical') {
      if (anomalies.includes('AUTH_BRUTE_FORCE') || anomalies.includes('REPEATED_SOURCE_ACTIVITY')) {
        recommendedAction = `Immediately blacklist source IP ${sourceIp}, terminate active sessions for user '${username}', and enforce MFA reset.`;
      } else if (anomalies.includes('CPU_SPIKE_ANOMALY') || anomalies.includes('MEMORY_SPIKE_ANOMALY')) {
        recommendedAction = 'Quarantine target server, dump suspicious process memory for forensic analysis, and isolate network interface.';
      } else {
        recommendedAction = 'Execute emergency containment protocol: Block source IP, revoke active session tokens, and alert incident commander.';
      }
    } else if (riskLevel === 'high') {
      if (anomalies.includes('AUTH_BRUTE_FORCE')) {
        recommendedAction = `Rate limit IP ${sourceIp}, lock user account '${username}' temporarily, and inspect recent authentication logs.`;
      } else {
        recommendedAction = 'Escalate to Tier 2 SOC Analyst for immediate investigation and monitor related host traffic.';
      }
    } else if (riskLevel === 'medium') {
      recommendedAction = 'Flag session for audit review and verify access authorization with resource owner.';
    }

    // Record this event for future correlation if it has an IP
    if (sourceIp && eventType !== 'nominal_system_check') {
      this.recordEvent(sourceIp, eventType, username, now);
    }

    return {
      riskScore: finalScore,
      riskLevel,
      confidence,
      reasons,
      anomalies,
      recommendedAction,
      analyzedAt: new Date(now).toISOString(),
    };
  }

  /**
   * Persists an AI Decision record to MongoDB if connected
   */
  public async persistDecision(
    analysis: AnalysisResult,
    eventPayload: any,
    telemetry?: any,
    threatId?: string,
    alertId?: string
  ): Promise<any> {
    if (!isDbConnected()) return null;
    try {
      const decisionId = `DEC-${Math.floor(10000 + Math.random() * 90000)}`;
      const sourceIp = String(eventPayload?.source_ip || eventPayload?.source || eventPayload?.ip || '127.0.0.1');
      const eventType = String(eventPayload?.event_type || eventPayload?.type || 'security_event');

      const doc = await IntelligenceDecisionModel.create({
        decisionId,
        source: 'threat_intelligence_engine',
        sourceIp,
        eventType,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
        reasons: analysis.reasons,
        anomalies: analysis.anomalies,
        recommendedAction: analysis.recommendedAction,
        telemetrySnapshot: {
          cpuUsage: telemetry?.cpuUsage ?? telemetry?.cpu_usage_percent,
          memoryUsage: telemetry?.memoryUsage ?? telemetry?.memory_usage_percent,
          activeSessions: telemetry?.activeSessions ?? telemetry?.active_session_count,
          health: telemetry?.health ?? telemetry?.server_health,
        },
        eventPayload,
        threatId,
        alertId,
        analyzedAt: new Date(analysis.analyzedAt),
      });
      return doc;
    } catch (err: any) {
      console.warn('[IntelligenceService Warning] Could not persist decision to DB:', err.message);
      return null;
    }
  }
}

export const threatIntelligenceService = new ThreatIntelligenceEngine();
export default threatIntelligenceService;
