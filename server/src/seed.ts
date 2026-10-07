import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb, persistDb } from './db/store.js';
import { threatEngine } from './engine/threatDetection.js';
import { behaviorManager } from './engine/behaviorProfile.js';
import type { ActivityLog, User } from './types.js';

const DEMO_USERS = [
  { userId: 'u1', username: 'alice.johnson', ip: '192.168.1.10', device: 'MacBook Pro', city: 'New York', country: 'US', lat: 40.7128, lng: -74.006 },
  { userId: 'u2', username: 'bob.smith', ip: '10.0.0.45', device: 'Windows Desktop', city: 'Chicago', country: 'US', lat: 41.8781, lng: -87.6298 },
  { userId: 'u3', username: 'carol.williams', ip: '172.16.0.22', device: 'iPhone 15', city: 'San Francisco', country: 'US', lat: 37.7749, lng: -122.4194 },
  { userId: 'u4', username: 'dave.chen', ip: '192.168.2.80', device: 'ThinkPad', city: 'Seattle', country: 'US', lat: 47.6062, lng: -122.3321 },
  { userId: 'u5', username: 'eve.garcia', ip: '10.0.0.99', device: 'MacBook Air', city: 'Austin', country: 'US', lat: 30.2672, lng: -97.7431 },
];

export function seedDemoData(): void {
  const db = getDb();
  if (!db.users) db.users = [];

  // Seed default admin users
  const defaultAdmins = [
    { email: 'admin@threatx.io', name: 'Security Admin' },
    { email: 'admin@theadx.local', name: 'System Administrator' },
  ];

  for (const admin of defaultAdmins) {
    const existing = db.users.find((u) => u.email.toLowerCase() === admin.email.toLowerCase());
    if (!existing) {
      db.users.push({
        id: uuidv4(),
        email: admin.email,
        name: admin.name,
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    } else if (!existing.passwordHash) {
      existing.passwordHash = bcrypt.hashSync('admin123', 10);
    }
  }
  persistDb();

  console.log('[Auth] Default Admin Account: admin@theadx.local / admin123 (WARNING: change in production)');

  const demoTargetKey = 'tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b';
  const hasDemoTarget = db.servers.some((s) => s.apiKey === demoTargetKey);
  if (!hasDemoTarget) {
    db.servers.push({
      id: uuidv4(),
      name: 'OmniCorp Demo Target Server',
      hostname: 'omnicorp-target-01.demo.local',
      apiKey: demoTargetKey,
      status: 'online' as const,
      os: 'Linux (Ubuntu 22.04 LTS)',
      ipAddress: '127.0.0.1:5001',
      agentVersion: 'theartx-agent-v1.0',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    persistDb();
  }

  if (db.servers.length > 1) return;

  const server = {
    id: uuidv4(),
    name: 'Production Web Server',
    hostname: 'prod-web-01.company.com',
    apiKey: 'tx_demo_key_for_testing_only',
    status: 'online' as const,
    os: 'Ubuntu 22.04 LTS',
    ipAddress: '203.0.113.10',
    agentVersion: '1.2.0',
    lastSeen: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  };

  const server2 = {
    id: uuidv4(),
    name: 'Database Server',
    hostname: 'db-primary.company.com',
    apiKey: 'tx_demo_key_db_server',
    status: 'online' as const,
    os: 'RHEL 9',
    ipAddress: '203.0.113.20',
    agentVersion: '1.2.0',
    lastSeen: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  };

  const server3 = {
    id: uuidv4(),
    name: 'Backup Server',
    hostname: 'backup-01.company.com',
    apiKey: 'tx_demo_key_backup_server',
    status: 'online' as const,
    os: 'Ubuntu 22.04 LTS',
    ipAddress: '203.0.113.30',
    agentVersion: '1.2.0',
    lastSeen: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  };

  const server4 = {
    id: uuidv4(),
    name: 'Analytics Server',
    hostname: 'analytics.company.com',
    apiKey: 'tx_demo_key_analytics_server',
    status: 'online' as const,
    os: 'Ubuntu 22.04 LTS',
    ipAddress: '203.0.113.40',
    agentVersion: '1.2.0',
    lastSeen: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  };

  const server5 = {
    id: uuidv4(),
    name: 'Dev Server',
    hostname: 'dev-01.company.com',
    apiKey: 'tx_demo_key_dev_server',
    status: 'online' as const,
    os: 'Debian 12',
    ipAddress: '203.0.113.50',
    agentVersion: '1.1.0',
    lastSeen: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  db.servers.push(server, server2, server3, server4, server5);

  const baselineLogs: Partial<ActivityLog>[] = [];
  for (let day = 14; day >= 1; day--) {
    for (const user of DEMO_USERS) {
      const ts = new Date(Date.now() - day * 86400000 + 9 * 3600000);
      baselineLogs.push({
        userId: user.userId,
        username: user.username,
        eventType: 'login',
        ipAddress: user.ip,
        device: user.device,
        location: { lat: user.lat, lng: user.lng, city: user.city, country: user.country },
        success: true,
        timestamp: ts.toISOString(),
      });
    }
  }

  for (const raw of baselineLogs) {
    const log: ActivityLog = {
      id: uuidv4(),
      serverId: server.id,
      userId: raw.userId!,
      username: raw.username!,
      eventType: raw.eventType as ActivityLog['eventType'],
      ipAddress: raw.ipAddress!,
      device: raw.device!,
      userAgent: '',
      location: raw.location,
      success: true,
      timestamp: raw.timestamp!,
    };
    db.activityLogs.push(log);
    behaviorManager.updateFromActivity(log);
  }

  // Preset behavior profiles with a New York lastLogin and Chicago lastLogin before the impossible travels occur.
  const profileAlice = behaviorManager.getOrCreate('u1', 'alice.johnson');
  profileAlice.lastLogin = {
    ip: '192.168.1.10',
    device: 'MacBook Pro',
    timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    location: { lat: 40.7128, lng: -74.006 }
  };

  const profileBob = behaviorManager.getOrCreate('u2', 'bob.smith');
  profileBob.lastLogin = {
    ip: '10.0.0.45',
    device: 'Windows Desktop',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    location: { lat: 41.8781, lng: -87.6298 } // Chicago
  };

  const anomalyScenarios: Partial<ActivityLog>[] = [
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'login',
      ipAddress: '45.33.32.156', device: 'Unknown Linux',
      location: { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'RU' },
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      userId: 'u2', username: 'bob.smith', eventType: 'login',
      ipAddress: '88.198.22.4', device: 'Unknown Desktop',
      location: { lat: 51.5074, lng: -0.1278, city: 'London', country: 'GB' }, // London travel from Chicago
      timestamp: new Date(Date.now() - 1.8 * 3600000).toISOString(),
    },
    {
      userId: 'u2', username: 'bob.smith', eventType: 'failed_login',
      ipAddress: '45.33.32.156', device: 'Unknown',
      timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), success: false,
    },
    {
      userId: 'u2', username: 'bob.smith', eventType: 'failed_login',
      ipAddress: '45.33.32.156', device: 'Unknown',
      timestamp: new Date(Date.now() - 1.4 * 3600000).toISOString(), success: false,
    },
    {
      userId: 'u2', username: 'bob.smith', eventType: 'failed_login',
      ipAddress: '45.33.32.156', device: 'Unknown',
      timestamp: new Date(Date.now() - 1.3 * 3600000).toISOString(), success: false,
    },
    {
      userId: 'u3', username: 'carol.williams', eventType: 'file_access',
      ipAddress: '172.16.0.22', device: 'iPhone 15',
      filePath: '/confidential/merger-plans.pdf',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/q4-earnings.xlsx',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/q3-earnings.xlsx',
      timestamp: new Date(Date.now() - 1700000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/q2-earnings.xlsx',
      timestamp: new Date(Date.now() - 1600000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/q1-earnings.xlsx',
      timestamp: new Date(Date.now() - 1500000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/annual-report.pdf',
      timestamp: new Date(Date.now() - 1400000).toISOString(),
    },
    {
      userId: 'u1', username: 'alice.johnson', eventType: 'file_download',
      ipAddress: '192.168.1.10', device: 'MacBook Pro',
      filePath: '/finance/reports/budget-2026.xlsx',
      timestamp: new Date(Date.now() - 1300000).toISOString(),
    },
    {
      userId: 'u4', username: 'dave.chen', eventType: 'file_access',
      ipAddress: '192.168.2.80', device: 'ThinkPad',
      filePath: '/admin/secrets/credentials.key',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      userId: 'u5', username: 'eve.garcia', eventType: 'login',
      ipAddress: '24.120.44.11', device: 'MacBook Air',
      location: { lat: 30.2672, lng: -97.7431, city: 'Austin', country: 'US' },
      timestamp: new Date().toISOString(),
    }
  ];

  for (const raw of anomalyScenarios) {
    const log: ActivityLog = {
      id: uuidv4(),
      serverId: server.id,
      userId: raw.userId!,
      username: raw.username!,
      eventType: raw.eventType as ActivityLog['eventType'],
      ipAddress: raw.ipAddress!,
      device: raw.device!,
      userAgent: '',
      location: raw.location,
      filePath: raw.filePath,
      success: raw.success !== false,
      timestamp: raw.timestamp!,
    };
    threatEngine.analyze(log, server);
  }

  persistDb();
  console.log('Demo data seeded successfully');
}
