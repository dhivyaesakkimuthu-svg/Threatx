/**
 * Centralized Configuration and Thresholds for AI Threat Intelligence & Anomaly Detection
 */

export const INTELLIGENCE_CONFIG = {
  // Telemetry anomaly thresholds
  AI_CPU_THRESHOLD: Number(process.env.AI_CPU_THRESHOLD) || 85.0, // %
  AI_MEMORY_THRESHOLD: Number(process.env.AI_MEMORY_THRESHOLD) || 85.0, // %
  AI_SESSION_SPIKE_THRESHOLD: Number(process.env.AI_SESSION_SPIKE_THRESHOLD) || 8, // active sessions
  AI_CPU_RATE_SPIKE: Number(process.env.AI_CPU_RATE_SPIKE) || 30.0, // % change jump

  // Event frequency & repetition thresholds
  AI_AUTH_FAILURE_THRESHOLD: Number(process.env.AI_AUTH_FAILURE_THRESHOLD) || 3, // attempts in window
  AI_EVENT_REPEAT_THRESHOLD: Number(process.env.AI_EVENT_REPEAT_THRESHOLD) || 4, // events from same IP in window
  AI_CORRELATION_WINDOW_MS: Number(process.env.AI_CORRELATION_WINDOW_MS) || 5 * 60 * 1000, // 5 min rolling window

  // Risk Score Band Definitions (0 - 100)
  RISK_LEVELS: {
    LOW: { min: 0, max: 24, label: 'low' as const },
    MEDIUM: { min: 25, max: 49, label: 'medium' as const },
    HIGH: { min: 50, max: 74, label: 'high' as const },
    CRITICAL: { min: 75, max: 100, label: 'critical' as const },
  },

  // Base Risk Weights for Event Types
  EVENT_BASE_WEIGHTS: {
    credential_dump: 85,
    ransomware_indicator: 95,
    unauthorized_access: 70,
    impossible_travel: 65,
    sensitive_download: 55,
    port_scan: 50,
    failed_login: 40,
    ssh_session_opened: 15,
    file_modified: 20,
    service_started: 10,
    system_event: 5,
  } as Record<string, number>,

  // Default confidence factors
  CONFIDENCE_WEIGHTS: {
    single_indicator: 60,
    telemetry_corroboration: 80,
    historical_frequency_corroboration: 90,
    multi_vector_correlation: 95,
  },
};

export default INTELLIGENCE_CONFIG;
