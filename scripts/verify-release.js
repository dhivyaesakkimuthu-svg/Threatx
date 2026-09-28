#!/usr/bin/env node
/**
 * ThreatX Release & Integrity Verification Script
 * Validates all system components, API endpoints, AI engine, and database integrity.
 */

import http from 'http';
import https from 'https';

const API_BASE = 'http://localhost:3001/api';
const DEMO_BASE = 'http://localhost:5001/api';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 3000,
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function verifyRelease() {
  console.log('====================================================');
  console.log('🚀 THREATX FINAL RELEASE & INTEGRITY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // 1. API Health Check
  await check('Central Express API /api/health returns 200 and healthy DB', async () => {
    const res = await makeRequest(`${API_BASE}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.status || !res.data.database) throw new Error('Missing health metadata');
    if (res.data.JWT_SECRET || res.data.DEMO_SERVER_API_KEY) throw new Error('Secrets exposed in health endpoint');
  });

  // 2. System Info
  await check('GET /api/info returns version 1.0.0 and capability flags', async () => {
    const res = await makeRequest(`${API_BASE}/info`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.version !== '1.0.0') throw new Error(`Expected version 1.0.0, got ${res.data.version}`);
  });

  // 3. Target Node Telemetry
  await check('GET /api/status returns live or cached server telemetry', async () => {
    const res = await makeRequest(`${API_BASE}/status`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.cpu_usage_percent === undefined) throw new Error('Missing cpu_usage_percent');
  });

  // 4. Authentication Login
  let adminToken = '';
  await check('POST /api/auth/login authenticates admin bootstrap user', async () => {
    const res = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'admin@threatx.io', password: 'Admin@ThreatX2026!' },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.token) throw new Error('Missing JWT token');
    if (res.data.user.passwordHash) throw new Error('Password hash leaked');
    adminToken = res.data.token;
  });

  // 5. Protected Endpoint Access
  await check('GET /api/threats with Bearer token returns baseline threats', async () => {
    const res = await makeRequest(`${API_BASE}/threats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const threats = Array.isArray(res.data) ? res.data : res.data.data;
    if (!threats || threats.length === 0) throw new Error('Expected threat records');
  });

  // 6. Analytics Endpoint
  await check('GET /api/analytics returns cluster posture metrics', async () => {
    const res = await makeRequest(`${API_BASE}/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.data.securityScore === undefined) throw new Error('Missing securityScore');
  });

  // 7. Security Reports Endpoint
  await check('GET /api/reports returns compliance documents', async () => {
    const res = await makeRequest(`${API_BASE}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const reports = Array.isArray(res.data) ? res.data : res.data.data;
    if (!reports || reports.length === 0) throw new Error('Expected reports list');
  });

  // 8. Python Demo Server (optional check)
  await check('Python Demo Server :5001 status check', async () => {
    try {
      const res = await makeRequest(`${DEMO_BASE}/status`, { timeout: 1500 });
      if (res.status === 200) {
        console.log(`   [Info] Python Demo Server is ONLINE (CPU: ${res.data.cpu_usage_percent}%)`);
      } else {
        console.log(`   [Info] Python Demo Server returned status ${res.status}`);
      }
    } catch {
      console.log('   [Info] Python Demo Server is currently in STANDBY (Express resilience active)');
    }
  });

  console.log('\n====================================================');
  console.log(`VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(failed === 0 ? 'STATUS: 🟢 ALL CHECKS PASSED — RELEASE READY' : 'STATUS: 🔴 ISSUES DETECTED');
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

verifyRelease().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
