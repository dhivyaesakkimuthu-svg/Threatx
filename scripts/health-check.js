#!/usr/bin/env node
/**
 * ThreatX Health & Readiness CLI Utility
 * Checks connectivity across:
 * - Express Central API (http://localhost:3001)
 * - Python Demo Server (http://localhost:5001)
 * - React Frontend (http://localhost:5173)
 * - Deep Cluster Health (/api/health)
 */

import http from 'http';

function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          name,
          url,
          status: res.statusCode === 200 ? 'online' : 'degraded',
          statusCode: res.statusCode,
          latencyMs: latency,
          details: parsed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name,
        url,
        status: 'offline',
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'timeout',
        error: 'Request exceeded 3000ms',
      });
    });
  });
}

async function runHealthChecks() {
  console.log('====================================================');
  console.log('🩺 ThreatX Service Health & Cluster Diagnostics');
  console.log('====================================================\n');

  const results = await Promise.all([
    checkEndpoint('http://localhost:3001/api/health', 'Central Express API (:3001)'),
    checkEndpoint('http://localhost:5001/api/status', 'Python Demo Server (:5001)'),
    checkEndpoint('http://localhost:5173', 'React SOC Frontend (:5173)'),
  ]);

  for (const res of results) {
    const badge =
      res.status === 'online'
        ? '🟢 ONLINE'
        : res.status === 'degraded'
        ? '🟡 DEGRADED'
        : '🔴 OFFLINE';

    console.log(`[${badge}] ${res.name}`);
    if (res.latencyMs !== undefined) {
      console.log(`         Latency: ${res.latencyMs}ms | Status Code: ${res.statusCode}`);
    }
    if (res.details && res.details.database) {
      console.log(`         MongoDB: ${res.details.database.status} | Socket Clients: ${res.details.socket?.clients ?? 0}`);
    }
    if (res.error) {
      console.log(`         Note: ${res.error}`);
    }
    console.log('');
  }

  console.log('====================================================\n');
}

runHealthChecks();
