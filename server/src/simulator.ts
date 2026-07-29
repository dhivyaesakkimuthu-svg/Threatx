import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from './db/store.js';
import { threatEngine } from './engine/threatDetection.js';
import type { ActivityLog } from './types.js';

const SIM_USERS = [
  { userId: 'u1', username: 'alice.johnson', ip: '192.168.1.10', device: 'MacBook Pro', location: { lat: 40.7128, lng: -74.006, city: 'New York', country: 'US' } },
  { userId: 'u2', username: 'bob.smith', ip: '10.0.0.45', device: 'Windows Desktop', location: { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'US' } },
  { userId: 'u3', username: 'carol.williams', ip: '172.16.0.22', device: 'iPhone 15', location: { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'US' } },
  { userId: 'u4', username: 'dave.chen', ip: '192.168.2.80', device: 'ThinkPad', location: { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'US' } },
  { userId: 'u5', username: 'eve.garcia', ip: '10.0.0.99', device: 'MacBook Air', location: { lat: 30.2672, lng: -97.7431, city: 'Austin', country: 'US' } },
];

const ANOMALOUS_IPS = ['200.41.88.22', '185.220.101.5', '45.33.32.156', '88.198.22.4'];
const CONFIDENTIAL_FILES = [
  '/confidential/payroll.xlsx',
  '/finance/reports/q4-earnings.xlsx',
  '/hr/private/investigation.pdf',
  '/admin/secrets/master.key',
];

export function startSimulator() {
  console.log('ThreatX activity simulator started (interval 35s)');

  setInterval(() => {
    try {
      const db = getDb();
      if (db.servers.length === 0) return;

      // Randomly select a server and user
      const server = db.servers[Math.floor(Math.random() * db.servers.length)];
      const user = SIM_USERS[Math.floor(Math.random() * SIM_USERS.length)];

      // Decide event type: 75% normal login/access, 25% anomaly
      const isAnomaly = Math.random() < 0.25;
      let eventType: ActivityLog['eventType'] = 'file_access';
      let ipAddress = user.ip;
      let filePath: string | undefined = undefined;
      let success = true;

      if (isAnomaly) {
        const anomalyRand = Math.random();
        if (anomalyRand < 0.3) {
          // Off-hours failed login / unusual location login
          eventType = 'failed_login';
          ipAddress = ANOMALOUS_IPS[Math.floor(Math.random() * ANOMALOUS_IPS.length)];
          success = false;
        } else if (anomalyRand < 0.6) {
          // Restricted file access
          eventType = 'file_access';
          filePath = CONFIDENTIAL_FILES[Math.floor(Math.random() * CONFIDENTIAL_FILES.length)];
        } else {
          // General unusual activity
          eventType = 'login';
          ipAddress = ANOMALOUS_IPS[Math.floor(Math.random() * ANOMALOUS_IPS.length)];
        }
      } else {
        // Normal behavior
        const normalRand = Math.random();
        if (normalRand < 0.5) {
          eventType = 'login';
        } else {
          eventType = 'file_access';
          filePath = `/public/documents/guidelines-${Math.floor(Math.random() * 10)}.pdf`;
        }
      }

      const log: ActivityLog = {
        id: uuidv4(),
        serverId: server.id,
        userId: user.userId,
        username: user.username,
        eventType,
        ipAddress,
        device: user.device,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ThreatXAgent/1.0',
        location: isAnomaly ? undefined : user.location,
        filePath,
        success,
        timestamp: new Date().toISOString(),
      };

      db.activityLogs.push(log);
      threatEngine.analyze(log, server);
      persistDb();
      console.log(`[Simulator] Ingested ${eventType} for ${user.username} on ${server.name}`);
    } catch (err) {
      console.error('Error running simulator tick:', err);
    }
  }, 35000);
}
