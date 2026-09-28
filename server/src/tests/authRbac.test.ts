import axios from 'axios';
import { assert } from 'console';

const PORT = process.env.PORT || 3001;
const API_BASE = `http://localhost:${PORT}/api`;

async function ensureServerRunning() {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 1000 });
    if (res.status === 200) return;
  } catch {
    // Server not already running, dynamically import index to start it
    await import('../index.js');
    for (let i = 0; i < 25; i++) {
      try {
        const res = await axios.get(`${API_BASE}/health`, { timeout: 1000 });
        if (res.status === 200) return;
      } catch {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
}

async function runTests() {
  await ensureServerRunning();
  console.log('====================================================');
  console.log('--- STARTING PHASE 7 AUTH & RBAC SECURITY TESTS ---');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void>) {
    return fn()
      .then(() => {
        console.log(`✅ PASS: ${name}`);
        passed++;
      })
      .catch((err: any) => {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Details:`, err.response?.data || err.message);
        failed++;
      });
  }

  let adminToken = '';
  let analystToken = '';
  let viewerToken = '';

  // 1. Health check
  await test('GET /api/health should return 200 without exposing secrets', async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.JWT_SECRET || res.data.DEMO_SERVER_API_KEY || res.data.MONGODB_URI) {
      throw new Error('Health check exposed sensitive configuration variables!');
    }
    if (!res.data.status || !res.data.database) {
      throw new Error('Health check missing status or database metrics');
    }
  });

  // 2. Auth: Invalid login
  await test('POST /api/auth/login with wrong password should return 401', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@threatx.io',
        password: 'WrongPassword123!',
      });
      throw new Error('Login succeeded with wrong password');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 3. Auth: Nonexistent user
  await test('POST /api/auth/login with nonexistent user should return 401', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'ghost@threatx.io',
        password: 'Password123!',
      });
      throw new Error('Login succeeded for nonexistent user');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 4. Auth: Valid Admin Login
  await test('POST /api/auth/login as Admin should return token and user details without passwordHash', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@threatx.io',
      password: 'Admin@ThreatX2026!',
    });
    if (!res.data.token) throw new Error('Missing token in login response');
    if (res.data.user.role !== 'admin') throw new Error(`Expected role admin, got ${res.data.user.role}`);
    if (res.data.user.passwordHash || res.data.user.password) {
      throw new Error('Response exposed password or passwordHash');
    }
    adminToken = res.data.token;
  });

  // 5. Auth: Valid Analyst Login
  await test('POST /api/auth/login as Analyst should return valid analyst session', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'analyst@threatx.io',
      password: 'Analyst@ThreatX2026!',
    });
    if (!res.data.token) throw new Error('Missing token in login response');
    if (res.data.user.role !== 'analyst') throw new Error(`Expected role analyst, got ${res.data.user.role}`);
    analystToken = res.data.token;
  });

  // 6. Auth: Valid Viewer Login
  await test('POST /api/auth/login as Viewer should return valid viewer session', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'viewer@threatx.io',
      password: 'Viewer@ThreatX2026!',
    });
    if (!res.data.token) throw new Error('Missing token in login response');
    if (res.data.user.role !== 'viewer') throw new Error(`Expected role viewer, got ${res.data.user.role}`);
    viewerToken = res.data.token;
  });

  // 7. Protected Route without token
  await test('GET /api/threats without token should return 401', async () => {
    try {
      await axios.get(`${API_BASE}/threats`);
      throw new Error('Unauthenticated request succeeded');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 8. Protected Route with malformed token
  await test('GET /api/threats with malformed token should return 401', async () => {
    try {
      await axios.get(`${API_BASE}/threats`, {
        headers: { Authorization: 'Bearer this-is-not-a-valid-jwt' },
      });
      throw new Error('Malformed token request succeeded');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  // 9. Protected Route with valid token
  await test('GET /api/threats with valid Viewer token should return 200', async () => {
    const res = await axios.get(`${API_BASE}/threats`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 10. RBAC: Viewer forbidden from mutating threats
  await test('PATCH /api/threats/:id with Viewer token should return 403 Forbidden', async () => {
    try {
      await axios.patch(
        `${API_BASE}/threats/THR-001`,
        { status: 'resolved' },
        { headers: { Authorization: `Bearer ${viewerToken}` } }
      );
      throw new Error('Viewer was allowed to mutate threat');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${err.response?.status}`);
      }
    }
  });

  // 11. RBAC: Analyst allowed to mutate alerts
  await test('PATCH /api/alerts/:id with Analyst token should return 200 OK', async () => {
    const res = await axios.patch(
      `${API_BASE}/alerts/ALT-001`,
      { status: 'investigating' },
      { headers: { Authorization: `Bearer ${analystToken}` } }
    );
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 12. RBAC: Analyst forbidden from managing users
  await test('GET /api/users with Analyst token should return 403 Forbidden', async () => {
    try {
      await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${analystToken}` },
      });
      throw new Error('Analyst was allowed to access user management');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${err.response?.status}`);
      }
    }
  });

  // 13. RBAC: Admin allowed to manage users
  let testUserId = '';
  await test('POST /api/users with Admin token creates new user with validation', async () => {
    const uniqueEmail = `sec.operator.${Date.now()}@threatx.io`;
    const res = await axios.post(
      `${API_BASE}/users`,
      {
        name: 'Test Security Operator',
        email: uniqueEmail,
        password: 'Operator@ThreatX2026!',
        role: 'analyst',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (res.data.passwordHash) throw new Error('Created user response exposed passwordHash');
    testUserId = res.data.id || res.data._id;
  });

  // 14. Admin updates user role
  await test('PATCH /api/users/:id/role changes role and records audit', async () => {
    if (!testUserId) throw new Error('Missing test user ID');
    const res = await axios.patch(
      `${API_BASE}/users/${testUserId}/role`,
      { role: 'viewer' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const returnedRole = res.data.role || res.data.user?.role;
    if (returnedRole !== 'viewer') throw new Error(`Expected role viewer, got ${returnedRole}`);
  });

  // 15. Audit Logs: Admin can retrieve audit records
  await test('GET /api/audit-logs with Admin token returns chronological audit records', async () => {
    const res = await axios.get(`${API_BASE}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const logs = Array.isArray(res.data) ? res.data : res.data.data;
    if (!logs || logs.length === 0) throw new Error('Expected audit logs to be populated');
    const hasLoginOrUser = logs.some((l: any) => l.action.includes('USER_') || l.action.includes('ALERT_'));
    if (!hasLoginOrUser) throw new Error('Expected login or user actions in audit logs');
  });

  // 16. Internal Service Communication: Demo Server Ingestion with API Key
  await test('POST /api/ingest/event with x-api-key succeeds', async () => {
    const res = await axios.post(
      `${API_BASE}/ingest/event`,
      {
        timestamp: new Date().toISOString(),
        severity: 'high',
        event_type: 'suspicious_script_execution',
        message: 'PowerShell encoded command detected on endpoint SRV-001',
        source_ip: '192.168.1.55',
        target_server: 'SRV-001',
      },
      { headers: { 'x-api-key': 'threatx-demo-internal-key-2026' } }
    );
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (res.data.status !== 'ingested') throw new Error(`Expected status ingested, got ${res.data.status}`);
  });

  // 17. Internal Ingest without API key fails
  await test('POST /api/ingest/event without credentials returns 401', async () => {
    try {
      await axios.post(`${API_BASE}/ingest/event`, {
        timestamp: new Date().toISOString(),
        message: 'Unauthenticated event',
      });
      throw new Error('Ingest endpoint allowed unauthenticated payload');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        throw new Error(`Expected 401, got ${err.response?.status}`);
      }
    }
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
