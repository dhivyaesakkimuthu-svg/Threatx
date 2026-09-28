import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getDb, persistDb } from './db/store.js';
import {
  UserModel,
  ServerModel,
  ThreatModel,
  AlertModel,
  SessionModel,
  ActivityModel,
  ReportModel,
} from './models/index.js';
import { isDbConnected } from './config/db.js';

export const SEED_SERVERS = [
  {
    serverId: 'SRV-001',
    name: 'ThreatX Demo Server',
    ipAddress: '127.0.0.1',
    status: 'online',
    health: 'healthy',
    cpuUsage: 48,
    memoryUsage: 62,
    connectionStatus: 'connected',
    activeSessions: 4,
    lastHeartbeat: new Date('2026-09-27T12:00:00Z'),
    hostname: 'omnicorp-target.local',
    apiKey: 'tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b',
    os: 'Ubuntu 22.04 LTS (Simulated)',
    agentVersion: 'theartx-agent-1.0',
  },
  {
    serverId: 'SRV-002',
    name: 'Production Edge Gateway',
    ipAddress: '10.0.1.12',
    status: 'online',
    health: 'healthy',
    cpuUsage: 36,
    memoryUsage: 54,
    connectionStatus: 'connected',
    activeSessions: 2,
    lastHeartbeat: new Date(),
    hostname: 'edge-01.threatx.net',
    apiKey: 'tx_edge_gateway_key',
    os: 'Debian 12 Bookworm',
    agentVersion: '1.2.0',
  },
  {
    serverId: 'SRV-003',
    name: 'Database Primary Node',
    ipAddress: '10.0.2.20',
    status: 'warning',
    health: 'warning',
    cpuUsage: 78,
    memoryUsage: 84,
    connectionStatus: 'connected',
    activeSessions: 3,
    lastHeartbeat: new Date(),
    hostname: 'db-primary.threatx.internal',
    apiKey: 'tx_db_primary_key',
    os: 'Red Hat Enterprise Linux 9',
    agentVersion: '1.1.8',
  },
];

export const SEED_THREATS = [
  {
    threatId: 'THR-001',
    type: 'Suspicious Login',
    severity: 'high',
    source: '192.168.1.20',
    target: 'SRV-001',
    status: 'investigating',
    description: 'Multiple failed authentication attempts detected on administrative port',
    detectedAt: new Date('2026-09-27T12:05:00Z'),
    username: 'charlie.williams',
    riskScore: 88,
    explanation: 'Unusual login velocity from internal workstation subnet during off-hours.',
    recommendedActions: ['Force 2FA re-authentication', 'Temporarily isolate IP subnet'],
  },
  {
    threatId: 'THR-002',
    type: 'Brute Force SSH Attack',
    severity: 'critical',
    source: '203.0.113.45',
    target: 'SRV-001',
    status: 'blocked',
    description: 'High frequency SSH credential stuffing attack originating from external IP',
    detectedAt: new Date('2026-09-27T11:42:00Z'),
    username: 'root',
    riskScore: 96,
    explanation: 'Over 120 failed SSH handshakes intercepted within 60 seconds.',
    recommendedActions: ['Add source IP to perimeter drop list', 'Disable root password auth'],
  },
  {
    threatId: 'THR-003',
    type: 'Unauthorized Privilege Escalation',
    severity: 'high',
    source: '10.0.0.15',
    target: 'SRV-002',
    status: 'investigating',
    description: 'Suspicious sudo execution of restricted /etc/shadow binary',
    detectedAt: new Date('2026-09-27T10:15:00Z'),
    username: 'alice.johnson',
    riskScore: 82,
    explanation: 'User attempted to execute administrative bin without ticket approval.',
    recommendedActions: ['Revoke active sudo token', 'Verify user workstation integrity'],
  },
  {
    threatId: 'THR-004',
    type: 'Sensitive Data Exfiltration Probe',
    severity: 'medium',
    source: '198.51.100.22',
    target: 'SRV-003',
    status: 'mitigated',
    description: 'Anomalous bulk query pattern targeting customer financial export tables',
    detectedAt: new Date('2026-09-27T09:30:00Z'),
    username: 'db_sync_user',
    riskScore: 68,
    explanation: 'High outbound bandwidth query exceeding historical baseline by 400%.',
    recommendedActions: ['Throttle database egress rate', 'Rotate database application keys'],
  },
  {
    threatId: 'THR-005',
    type: 'Port Scan & Reconnaissance',
    severity: 'low',
    source: '192.168.1.105',
    target: 'SRV-001',
    status: 'open',
    description: 'Sequential TCP SYN scanning detected across port ranges 20-1024',
    detectedAt: new Date('2026-09-27T08:50:00Z'),
    username: 'unknown',
    riskScore: 42,
    explanation: 'Internal network mapping tool detected scanning exposed server ports.',
    recommendedActions: ['Inspect host 192.168.1.105 for unauthorized discovery software'],
  },
  {
    threatId: 'THR-006',
    type: 'Anomalous C2 Reverse Beacon',
    severity: 'critical',
    source: '185.220.101.5',
    target: 'SRV-001',
    status: 'blocked',
    description: 'Periodic outbound HTTPS jitter traffic matching known Cobalt Strike profile',
    detectedAt: new Date('2026-09-27T07:15:00Z'),
    username: 'system_daemon',
    riskScore: 94,
    explanation: 'Heartbeat callbacks every 45 seconds with encrypted payload headers.',
    recommendedActions: ['Quarantine target process', 'Drop outbound traffic to 185.220.101.0/24'],
  },
  {
    threatId: 'THR-007',
    type: 'Lateral Movement SMB Probe',
    severity: 'high',
    source: '10.0.1.44',
    target: 'SRV-002',
    status: 'investigating',
    description: 'Repeated SMB session setups targeting ADMIN$ and IPC$ administrative shares',
    detectedAt: new Date('2026-09-27T06:40:00Z'),
    username: 'svc_deploy',
    riskScore: 79,
    explanation: 'Unauthorized traversal between internal subnets detected by ThreatX sensor.',
    recommendedActions: ['Enforce SMB signing', 'Restrict administrative share access'],
  },
  {
    threatId: 'THR-008',
    type: 'Unauthorized Crypto-Mining Daemon',
    severity: 'medium',
    source: '10.0.2.20',
    target: 'SRV-003',
    status: 'mitigated',
    description: 'Anomalous multi-threaded CPU saturation executing from hidden /tmp directory',
    detectedAt: new Date('2026-09-27T05:20:00Z'),
    username: 'nobody',
    riskScore: 64,
    explanation: 'Process spawned from /tmp/xmr_miner utilizing 95% CPU cores.',
    recommendedActions: ['Mount /tmp with noexec flag', 'Terminate PID 4092'],
  },
];

export const SEED_ALERTS = [
  {
    alertId: 'ALT-001',
    severity: 'critical',
    title: 'Unauthorized Access Attempt',
    source: '192.168.1.20',
    status: 'open',
    description: 'Multiple failed authentication attempts detected from unauthorized subnet',
    createdAt: new Date('2026-09-27T12:10:00Z'),
    target: 'SRV-001',
  },
  {
    alertId: 'ALT-002',
    severity: 'critical',
    title: 'Multi-Node SSH Brute Force Intercepted',
    source: '203.0.113.45',
    status: 'investigating',
    description: 'Automated brute-force pattern blocked by ThreatX edge firewall',
    createdAt: new Date('2026-09-27T11:45:00Z'),
    target: 'SRV-001',
  },
  {
    alertId: 'ALT-003',
    severity: 'high',
    title: 'Elevated Sudo Privilege Anomaly',
    source: '10.0.0.15',
    status: 'open',
    description: 'Non-standard administrative privilege escalation detected on Edge Node',
    createdAt: new Date('2026-09-27T10:20:00Z'),
    target: 'SRV-002',
  },
  {
    alertId: 'ALT-004',
    severity: 'medium',
    title: 'Bulk Export Data Flow Detected',
    source: '198.51.100.22',
    status: 'resolved',
    description: 'Database query egress volume exceeded standard operational threshold',
    createdAt: new Date('2026-09-27T09:35:00Z'),
    target: 'SRV-003',
  },
  {
    alertId: 'ALT-005',
    severity: 'low',
    title: 'Rapid Port Scan Signature',
    source: '192.168.1.105',
    status: 'dismissed',
    description: 'Internal subnet scan neutralized by intrusion prevention rule',
    createdAt: new Date('2026-09-27T08:55:00Z'),
    target: 'SRV-001',
  },
  {
    alertId: 'ALT-006',
    severity: 'critical',
    title: 'C2 Reverse Beacon Intercepted',
    source: '185.220.101.5',
    status: 'open',
    description: 'Suspicious periodic outbound beacon matched known APT C2 infrastructure',
    createdAt: new Date('2026-09-27T07:20:00Z'),
    target: 'SRV-001',
  },
  {
    alertId: 'ALT-007',
    severity: 'high',
    title: 'Lateral Movement SMB Probe Detected',
    source: '10.0.1.44',
    status: 'investigating',
    description: 'Unauthorized lateral reconnaissance detected between production edge and database',
    createdAt: new Date('2026-09-27T06:45:00Z'),
    target: 'SRV-002',
  },
  {
    alertId: 'ALT-008',
    severity: 'medium',
    title: 'Crypto-Mining Process Resource Surge',
    source: '10.0.2.20',
    status: 'resolved',
    description: 'CPU threshold exceeded on database node; process terminated and quarantined',
    createdAt: new Date('2026-09-27T05:25:00Z'),
    target: 'SRV-003',
  },
];

export const SEED_SESSIONS = [
  {
    sessionId: 'SES-001',
    serverId: 'SRV-001',
    username: 'alice.johnson',
    sourceIp: '192.168.1.10',
    status: 'active',
    startedAt: new Date(Date.now() - 3600000),
    device: 'MacBook Pro / macOS 14.2',
    location: 'Austin, TX (HQ)',
    riskScore: 12,
  },
  {
    sessionId: 'SES-002',
    serverId: 'SRV-001',
    username: 'bob.smith',
    sourceIp: '10.0.0.45',
    status: 'active',
    startedAt: new Date(Date.now() - 7200000),
    device: 'Lenovo ThinkPad / Linux',
    location: 'Internal VPN',
    riskScore: 18,
  },
  {
    sessionId: 'SES-003',
    serverId: 'SRV-001',
    username: 'charlie.williams',
    sourceIp: '172.16.0.22',
    status: 'flagged',
    startedAt: new Date(Date.now() - 1800000),
    device: 'Unknown Client / Tor Exit',
    location: 'Zurich, Switzerland',
    riskScore: 88,
  },
  {
    sessionId: 'SES-004',
    serverId: 'SRV-002',
    username: 'security.auditor',
    sourceIp: '10.0.1.99',
    status: 'active',
    startedAt: new Date(Date.now() - 5400000),
    device: 'Workstation 04 / Windows 11',
    location: 'Security Operations Center',
    riskScore: 5,
  },
  {
    sessionId: 'SES-005',
    serverId: 'SRV-003',
    username: 'backup.daemon',
    sourceIp: '127.0.0.1',
    status: 'idle',
    startedAt: new Date(Date.now() - 14400000),
    device: 'Automated Cron Service',
    location: 'Localhost',
    riskScore: 0,
  },
  {
    sessionId: 'SES-006',
    serverId: 'SRV-002',
    username: 'david.clark',
    sourceIp: '10.0.1.55',
    status: 'active',
    startedAt: new Date(Date.now() - 2700000),
    device: 'Dell XPS 15 / Ubuntu 22.04',
    location: 'DevOps Pod 2',
    riskScore: 8,
  },
  {
    sessionId: 'SES-007',
    serverId: 'SRV-001',
    username: 'emma.watson',
    sourceIp: '192.168.1.88',
    status: 'idle',
    startedAt: new Date(Date.now() - 10800000),
    device: 'HP EliteBook / Windows 11',
    location: 'Remote Office East',
    riskScore: 14,
  },
  {
    sessionId: 'SES-008',
    serverId: 'SRV-003',
    username: 'automated.scanner',
    sourceIp: '203.0.113.199',
    status: 'flagged',
    startedAt: new Date(Date.now() - 900000),
    device: 'Kali Linux / Automated Tool',
    location: 'Frankfurt, Germany',
    riskScore: 92,
  },
];

export const SEED_ACTIVITIES = [
  {
    activityId: 'ACT-001',
    type: 'failed_login',
    message: 'Failed SSH login attempt for user root from 203.0.113.45',
    severity: 'critical',
    source: 'ThreatX Sensor SRV-001',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    activityId: 'ACT-002',
    type: 'firewall_block',
    message: 'Automated IP drop rule engaged for subnet 203.0.113.0/24',
    severity: 'high',
    source: 'ThreatX Firewall Engine',
    timestamp: new Date(Date.now() - 240000),
  },
  {
    activityId: 'ACT-003',
    type: 'sudo_escalation',
    message: 'User alice.johnson invoked sudo apt-get update on SRV-002',
    severity: 'info',
    source: 'Auditd Agent',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    activityId: 'ACT-004',
    type: 'session_auth',
    message: 'Session verified with 2FA token for bob.smith (10.0.0.45)',
    severity: 'info',
    source: 'Auth Gateway',
    timestamp: new Date(Date.now() - 900000),
  },
  {
    activityId: 'ACT-005',
    type: 'telemetry_heartbeat',
    message: 'Server SRV-001 reported optimal telemetry (CPU: 48%, Mem: 62%)',
    severity: 'info',
    source: 'Python Demo Server Agent',
    timestamp: new Date(Date.now() - 1200000),
  },
  {
    activityId: 'ACT-006',
    type: 'anomaly_flag',
    message: 'Geographical impossible travel flag raised for charlie.williams',
    severity: 'high',
    source: 'AI Behavioral Analyzer',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    activityId: 'ACT-007',
    type: 'file_integrity',
    message: 'Integrity scan verified sha256 checksums across /etc/nginx configuration',
    severity: 'info',
    source: 'File Monitor',
    timestamp: new Date(Date.now() - 2400000),
  },
  {
    activityId: 'ACT-008',
    type: 'port_scan',
    message: 'Rapid port sweep intercepted on internal interface from 192.168.1.105',
    severity: 'medium',
    source: 'ThreatX Sensor SRV-001',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    activityId: 'ACT-009',
    type: 'backup_complete',
    message: 'Database backup snapshot archived to encrypted cold storage',
    severity: 'info',
    source: 'Storage Node SRV-003',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    activityId: 'ACT-010',
    type: 'c2_beacon',
    message: 'Outbound TCP connection to 185.220.101.5 blocked by egress firewall',
    severity: 'critical',
    source: 'Perimeter Gateway',
    timestamp: new Date(Date.now() - 4200000),
  },
  {
    activityId: 'ACT-011',
    type: 'smb_probe',
    message: 'SMB share enumeration probe intercepted from internal host 10.0.1.44',
    severity: 'high',
    source: 'ThreatX Sensor SRV-002',
    timestamp: new Date(Date.now() - 4800000),
  },
  {
    activityId: 'ACT-012',
    type: 'process_quarantine',
    message: 'Anomalous miner binary /tmp/xmr_miner terminated and quarantined',
    severity: 'medium',
    source: 'Host Defense SRV-003',
    timestamp: new Date(Date.now() - 5400000),
  },
  {
    activityId: 'ACT-013',
    type: 'user_created',
    message: 'Security administrator created new analyst account: analyst@threatx.io',
    severity: 'info',
    source: 'ThreatX RBAC Engine',
    timestamp: new Date(Date.now() - 6000000),
  },
  {
    activityId: 'ACT-014',
    type: 'policy_sync',
    message: 'Cluster detection heuristics synchronized across all active agent nodes',
    severity: 'info',
    source: 'ThreatX Platform Core',
    timestamp: new Date(Date.now() - 6600000),
  },
  {
    activityId: 'ACT-015',
    type: 'system_startup',
    message: 'ThreatX Central SIEM and AI Threat Intelligence Engine initialized',
    severity: 'info',
    source: 'ThreatX Platform Core',
    timestamp: new Date(Date.now() - 7200000),
  },
];

export const SEED_REPORTS = [
  {
    reportId: 'RPT-2026-001',
    title: 'Daily SOC Threat Intelligence & Perimeter Posture',
    type: 'security_summary',
    status: 'generated',
    generatedAt: new Date('2026-09-27T08:00:00Z'),
    createdBy: 'ThreatX AI Engine',
    summary: '24-hour enterprise threat assessment across 3 monitored nodes. 8 anomalies analyzed, 2 critical threats neutralized.',
  },
  {
    reportId: 'RPT-2026-002',
    title: 'Infrastructure Anomaly & Audit Compliance Brief',
    type: 'compliance_audit',
    status: 'reviewed',
    generatedAt: new Date('2026-09-26T18:00:00Z'),
    createdBy: 'Chief Security Officer',
    summary: 'Quarterly access control validation and privilege escalation baseline report.',
  },
  {
    reportId: 'RPT-2026-003',
    title: 'Incident Triage & Zero-Trust Access Analysis',
    type: 'incident_review',
    status: 'generated',
    generatedAt: new Date('2026-09-25T14:00:00Z'),
    createdBy: 'Lead SOC Analyst',
    summary: 'Comprehensive retrospective on credential stuffing patterns and automated firewall response latency.',
  },
];

export function getBootstrapUsers() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@ThreatX2026!';
  const analystPassword = process.env.ANALYST_PASSWORD || 'Analyst@ThreatX2026!';
  const viewerPassword = process.env.VIEWER_PASSWORD || 'Viewer@ThreatX2026!';

  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const analystHash = bcrypt.hashSync(analystPassword, 10);
  const viewerHash = bcrypt.hashSync(viewerPassword, 10);

  return [
    {
      name: 'SOC Administrator',
      username: 'admin',
      email: (process.env.ADMIN_EMAIL || 'admin@threatx.io').toLowerCase(),
      passwordHash: adminHash,
      role: 'admin',
      status: 'active',
      riskScore: 0,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date(),
    },
    {
      name: 'Lead SOC Analyst',
      username: 'analyst',
      email: (process.env.ANALYST_EMAIL || 'analyst@threatx.io').toLowerCase(),
      passwordHash: analystHash,
      role: 'analyst',
      status: 'active',
      riskScore: 5,
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date(),
    },
    {
      name: 'Security Executive Viewer',
      username: 'viewer',
      email: (process.env.VIEWER_EMAIL || 'viewer@threatx.io').toLowerCase(),
      passwordHash: viewerHash,
      role: 'viewer',
      status: 'active',
      riskScore: 0,
      createdAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Safely populates development seed data into MongoDB (and fallback store).
 * Does not delete existing collections or perform destructive operations.
 */
export async function seedDemoData(): Promise<void> {
  const bootstrapUsers = getBootstrapUsers();

  // 1. If MongoDB is connected, safely insert missing records
  if (isDbConnected()) {
    try {
      const serverCount = await ServerModel.countDocuments();
      if (serverCount === 0) {
        await ServerModel.insertMany(SEED_SERVERS);
        console.log(`[Seed] Inserted ${SEED_SERVERS.length} servers into MongoDB`);
      }

      const threatCount = await ThreatModel.countDocuments();
      if (threatCount === 0) {
        await ThreatModel.insertMany(SEED_THREATS);
        console.log(`[Seed] Inserted ${SEED_THREATS.length} threats into MongoDB`);
      }

      const alertCount = await AlertModel.countDocuments();
      if (alertCount === 0) {
        await AlertModel.insertMany(SEED_ALERTS);
        console.log(`[Seed] Inserted ${SEED_ALERTS.length} alerts into MongoDB`);
      }

      const sessionCount = await SessionModel.countDocuments();
      if (sessionCount === 0) {
        await SessionModel.insertMany(SEED_SESSIONS);
        console.log(`[Seed] Inserted ${SEED_SESSIONS.length} sessions into MongoDB`);
      }

      const activityCount = await ActivityModel.countDocuments();
      if (activityCount === 0) {
        await ActivityModel.insertMany(SEED_ACTIVITIES);
        console.log(`[Seed] Inserted ${SEED_ACTIVITIES.length} activities into MongoDB`);
      }

      const reportCount = await ReportModel.countDocuments();
      if (reportCount === 0) {
        await ReportModel.insertMany(SEED_REPORTS);
        console.log(`[Seed] Inserted ${SEED_REPORTS.length} reports into MongoDB`);
      }

      // Upsert/ensure bootstrap users exist in MongoDB
      for (const u of bootstrapUsers) {
        let existing = await UserModel.findOne({ email: u.email });
        if (!existing && u.username) {
          existing = await UserModel.findOne({ username: u.username });
        }
        if (!existing) {
          await UserModel.create(u);
          console.log(`[Seed] Created bootstrap user: ${u.email} (${u.role})`);
        } else {
          existing.name = u.name;
          existing.email = u.email;
          existing.passwordHash = u.passwordHash;
          existing.role = u.role as any;
          existing.status = u.status as any;
          await existing.save();
          console.log(`[Seed] Updated bootstrap user: ${u.email} (${u.role})`);
        }
      }
    } catch (err: any) {
      console.warn('[Seed Warning] MongoDB seeding note:', err.message);
    }
  }

  // 2. Also populate fallback store
  const db = getDb();
  if (!db.servers || db.servers.length === 0) db.servers = SEED_SERVERS as any;
  if (!db.threats || db.threats.length === 0) db.threats = SEED_THREATS as any;
  if (!db.alerts || db.alerts.length === 0) db.alerts = SEED_ALERTS as any;
  if (!db.sessions || db.sessions.length === 0) db.sessions = SEED_SESSIONS as any;
  if (!db.activities || db.activities.length === 0) db.activities = SEED_ACTIVITIES as any;
  if (!db.reports || db.reports.length === 0) db.reports = SEED_REPORTS as any;

  if (!db.users || db.users.length === 0) {
    db.users = bootstrapUsers as any;
  } else {
    for (const u of bootstrapUsers) {
      const idx = db.users.findIndex((x: any) => (x.email || '').toLowerCase() === u.email);
      if (idx === -1) {
        db.users.push(u as any);
      } else {
        (db.users[idx] as any).passwordHash = u.passwordHash;
        (db.users[idx] as any).role = u.role;
        (db.users[idx] as any).name = u.name;
        (db.users[idx] as any).status = u.status;
      }
    }
  }
  persistDb();
}

export default seedDemoData;
