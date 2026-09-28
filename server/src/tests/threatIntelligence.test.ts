import { threatIntelligenceService } from '../services/threatIntelligenceService.js';
import { INTELLIGENCE_CONFIG } from '../config/intelligenceConfig.js';

/**
 * Automated Test Suite for AI Threat Intelligence & Anomaly Detection
 */
async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 THREATX AI THREAT INTELLIGENCE & ANOMALY TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Normal Event Test
  console.log('1. Testing Nominal / Normal Event...');
  const normalResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'service_started',
      source_ip: '10.0.0.15',
      user: 'daemon',
      severity: 'info',
      details: 'Systemd service cron started normally',
    },
    telemetry: {
      cpuUsage: 25.0,
      memoryUsage: 40.0,
      activeSessions: 2,
    },
  });
  assert(normalResult.riskScore < 25, 'Normal event should have low risk score (<25)', `Got ${normalResult.riskScore}`);
  assert(normalResult.riskLevel === 'low', 'Normal event risk level should be "low"', `Got ${normalResult.riskLevel}`);
  assert(normalResult.reasons.length > 0, 'Normal event must provide explainable reasons');
  assert(normalResult.anomalies.length === 0, 'Normal event should produce 0 anomalies');

  // 2. Low-Risk Event Test
  console.log('\n2. Testing Low-Risk Event...');
  const lowRiskResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'ssh_session_opened',
      source_ip: '192.168.1.100',
      user: 'admin',
      severity: 'low',
      details: 'Authorized SSH session initiated',
    },
    telemetry: {
      cpuUsage: 35.0,
      memoryUsage: 45.0,
      activeSessions: 3,
    },
  });
  assert(lowRiskResult.riskLevel === 'low', 'Authorized SSH should be classified as low risk', `Got ${lowRiskResult.riskLevel}`);
  assert(lowRiskResult.riskScore <= 24, 'Low risk score <= 24', `Got ${lowRiskResult.riskScore}`);

  // 3. CPU Anomaly Test
  console.log('\n3. Testing CPU Anomaly Detection...');
  const cpuAnomalyResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'system_event',
      source_ip: '127.0.0.1',
      severity: 'info',
    },
    telemetry: {
      cpuUsage: 94.5, // Exceeds AI_CPU_THRESHOLD of 85%
      memoryUsage: 40.0,
      activeSessions: 2,
    },
  });
  assert(
    cpuAnomalyResult.anomalies.includes('CPU_SPIKE_ANOMALY'),
    'CPU >= 85% should flag CPU_SPIKE_ANOMALY',
    `Got anomalies: ${JSON.stringify(cpuAnomalyResult.anomalies)}`
  );
  assert(
    cpuAnomalyResult.reasons.some((r) => r.includes('CPU spike')),
    'Explainable reason for CPU spike must be generated'
  );

  // 4. Memory Anomaly Test
  console.log('\n4. Testing Memory Anomaly Detection...');
  const memoryAnomalyResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'system_event',
      source_ip: '127.0.0.1',
      severity: 'info',
    },
    telemetry: {
      cpuUsage: 30.0,
      memoryUsage: 91.2, // Exceeds AI_MEMORY_THRESHOLD of 85%
      activeSessions: 2,
    },
  });
  assert(
    memoryAnomalyResult.anomalies.includes('MEMORY_SPIKE_ANOMALY'),
    'Memory >= 85% should flag MEMORY_SPIKE_ANOMALY',
    `Got anomalies: ${JSON.stringify(memoryAnomalyResult.anomalies)}`
  );
  assert(
    memoryAnomalyResult.reasons.some((r) => r.includes('Memory saturation anomaly')),
    'Explainable reason for Memory saturation must be generated'
  );

  // 5. Session Surge Anomaly Test
  console.log('\n5. Testing Session Surge Anomaly...');
  const sessionSpikeResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'system_event',
      source_ip: '127.0.0.1',
      severity: 'info',
    },
    telemetry: {
      cpuUsage: 45.0,
      memoryUsage: 50.0,
      activeSessions: 14, // Exceeds AI_SESSION_SPIKE_THRESHOLD of 8
    },
  });
  assert(
    sessionSpikeResult.anomalies.includes('SESSION_SPIKE_ANOMALY'),
    'Sessions >= 8 should flag SESSION_SPIKE_ANOMALY',
    `Got anomalies: ${JSON.stringify(sessionSpikeResult.anomalies)}`
  );

  // 6. Repeated Suspicious Event / Brute Force Test
  console.log('\n6. Testing Repeated Suspicious Events / Brute-Force Detection...');
  const bruteForceIp = '198.51.100.44';
  // Simulate 4 rapid failed logins from same IP
  for (let i = 0; i < 4; i++) {
    threatIntelligenceService.recordEvent(bruteForceIp, 'failed_login', 'root', Date.now());
  }
  const bruteForceResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'failed_login',
      source_ip: bruteForceIp,
      user: 'root',
      severity: 'high',
      details: 'SSH Authentication failed for root',
    },
    telemetry: {
      cpuUsage: 50.0,
      memoryUsage: 55.0,
      activeSessions: 3,
    },
  });
  assert(
    bruteForceResult.anomalies.includes('AUTH_BRUTE_FORCE'),
    'Repeated failed logins must trigger AUTH_BRUTE_FORCE anomaly',
    `Got: ${JSON.stringify(bruteForceResult.anomalies)}`
  );
  assert(
    bruteForceResult.riskScore >= INTELLIGENCE_CONFIG.RISK_LEVELS.HIGH.min,
    'Brute force must elevate risk score to high/critical (>=50)',
    `Got risk score ${bruteForceResult.riskScore}`
  );
  assert(
    bruteForceResult.confidence >= 85,
    'Corroborated frequency should have high confidence (>=85%)',
    `Got confidence ${bruteForceResult.confidence}%`
  );

  // 7. Critical Threat Event Test
  console.log('\n7. Testing Critical Security Event (Credential Dump)...');
  const criticalResult = threatIntelligenceService.analyze({
    event: {
      event_type: 'credential_dump',
      source_ip: '203.0.113.89',
      user: 'compromised_svc',
      severity: 'critical',
      details: 'Memory extraction of LSASS process detected',
    },
    telemetry: {
      cpuUsage: 88.0,
      memoryUsage: 86.0,
      activeSessions: 4,
    },
  });
  assert(
    criticalResult.riskScore >= INTELLIGENCE_CONFIG.RISK_LEVELS.CRITICAL.min,
    'Credential dump with high CPU must be classified as CRITICAL (>=75)',
    `Got risk score ${criticalResult.riskScore}`
  );
  assert(
    criticalResult.riskLevel === 'critical',
    'Critical event risk level should be "critical"',
    `Got ${criticalResult.riskLevel}`
  );
  assert(
    criticalResult.recommendedAction.toLowerCase().includes('quarantine') ||
      criticalResult.recommendedAction.toLowerCase().includes('block'),
    'Critical event must produce urgent containment recommendation'
  );

  // 8. Duplicate Event Handling / Consistency
  console.log('\n8. Testing Duplicate Event Analysis Consistency...');
  const testPayload = {
    event: {
      event_type: 'impossible_travel',
      source_ip: '198.51.100.99',
      user: 'sarah.connor',
      severity: 'high',
      details: 'User logged in from Tokyo and London within 10 minutes',
    },
    telemetry: { cpuUsage: 45, memoryUsage: 50 },
  };
  const run1 = threatIntelligenceService.analyze(testPayload);
  const run2 = threatIntelligenceService.analyze(testPayload);
  assert(
    run1.riskLevel === run2.riskLevel,
    'Repeated identical input should yield consistent risk levels'
  );
  assert(
    run1.anomalies.length === run2.anomalies.length,
    'Repeated identical input should detect consistent anomaly counts'
  );

  // 9. Malformed / Empty Input Handling
  console.log('\n9. Testing Malformed / Null Input Handling...');
  try {
    const malformedResult1 = threatIntelligenceService.analyze(null as any);
    const malformedResult2 = threatIntelligenceService.analyze({ event: undefined, telemetry: undefined });
    assert(
      typeof malformedResult1.riskScore === 'number' && malformedResult1.riskScore >= 0,
      'Null input must gracefully return a valid AnalysisResult object without crashing'
    );
    assert(
      typeof malformedResult2.riskLevel === 'string',
      'Empty object input must return valid riskLevel'
    );
  } catch (err: any) {
    assert(false, 'Malformed input test threw unhandled exception', err.message);
  }

  // Summary
  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal error running tests:', e);
  process.exit(1);
});
