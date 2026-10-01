import type { DemoUser } from './users.js';

export interface IngestEvent {
  username: string;
  userId: string;
  eventType: 'login' | 'logout' | 'file_access' | 'file_download' | 'failed_login';
  ipAddress: string;
  device: string;
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  filePath?: string;
  success: boolean;
  timestamp: string;
}

const NORMAL_EVENT_TYPES: IngestEvent['eventType'][] = ['login', 'logout', 'file_access', 'file_download'];

const SAFE_FILE_PATHS = [
  '/projects/report-2026.pdf',
  '/shared/team-notes.docx',
  '/finance/quarterly-summary.xlsx',
  '/documents/architecture-overview.pdf',
  '/marketing/campaign-q3.pptx',
  '/engineering/design-specs.md',
];

const RESTRICTED_FILE_PATHS = [
  '/confidential/merger-plans.pdf',
  '/admin/secrets/credentials.key',
  '/hr/private/salaries.xlsx',
  '/confidential/customer-passwords.csv',
  '/admin/secrets/private_key.pem',
];

const FOREIGN_LOCATIONS = [
  { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'RU', ip: '45.33.32.156' },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'JP', ip: '133.242.18.1' },
  { lat: 51.5074, lng: -0.1278, city: 'London', country: 'GB', ip: '88.198.22.4' },
  { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'CN', ip: '185.220.101.5' },
  { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'SG', ip: '203.0.113.42' },
];

const UNUSUAL_DEVICES = ['Unknown Linux', 'iPhone 15 Pro', 'Xiaomi Phone', 'Kali Linux Workstation', 'Android Pixel'];

export function generateEvent(user: DemoUser, isAnomaly = false): IngestEvent {
  const timestamp = new Date().toISOString();

  if (!isAnomaly) {
    const eventType = NORMAL_EVENT_TYPES[Math.floor(Math.random() * NORMAL_EVENT_TYPES.length)];
    const isFileEvent = eventType === 'file_access' || eventType === 'file_download';

    return {
      username: user.username,
      userId: user.userId,
      eventType,
      ipAddress: user.normalIp,
      device: user.normalDevice,
      location: user.normalLocation,
      filePath: isFileEvent ? SAFE_FILE_PATHS[Math.floor(Math.random() * SAFE_FILE_PATHS.length)] : undefined,
      success: true,
      timestamp,
    };
  }

  // Single anomalous event choices: unknown_ip, new_device, impossible_travel, restricted_folder
  const singleAnomalyTypes = ['unknown_ip', 'new_device', 'impossible_travel', 'restricted_folder'];
  const anomalyType = singleAnomalyTypes[Math.floor(Math.random() * singleAnomalyTypes.length)];

  switch (anomalyType) {
    case 'unknown_ip': {
      const foreign = FOREIGN_LOCATIONS[Math.floor(Math.random() * FOREIGN_LOCATIONS.length)];
      return {
        username: user.username,
        userId: user.userId,
        eventType: 'login',
        ipAddress: foreign.ip,
        device: user.normalDevice,
        location: { lat: foreign.lat, lng: foreign.lng, city: foreign.city, country: foreign.country },
        success: true,
        timestamp,
      };
    }

    case 'new_device': {
      const device = UNUSUAL_DEVICES[Math.floor(Math.random() * UNUSUAL_DEVICES.length)];
      return {
        username: user.username,
        userId: user.userId,
        eventType: 'login',
        ipAddress: user.normalIp,
        device,
        location: user.normalLocation,
        success: true,
        timestamp,
      };
    }

    case 'impossible_travel': {
      const foreign = FOREIGN_LOCATIONS[Math.floor(Math.random() * FOREIGN_LOCATIONS.length)];
      return {
        username: user.username,
        userId: user.userId,
        eventType: 'login',
        ipAddress: foreign.ip,
        device: user.normalDevice,
        location: { lat: foreign.lat, lng: foreign.lng, city: foreign.city, country: foreign.country },
        success: true,
        timestamp,
      };
    }

    case 'restricted_folder':
    default: {
      const filePath = RESTRICTED_FILE_PATHS[Math.floor(Math.random() * RESTRICTED_FILE_PATHS.length)];
      return {
        username: user.username,
        userId: user.userId,
        eventType: 'file_access',
        ipAddress: user.normalIp,
        device: user.normalDevice,
        location: user.normalLocation,
        filePath,
        success: true,
        timestamp,
      };
    }
  }
}

export function generateAnomalyBurst(user: DemoUser): IngestEvent[] {
  const burstTypes = ['unknown_ip', 'new_device', 'impossible_travel', 'restricted_folder', 'mass_download', 'brute_force'];
  const anomalyType = burstTypes[Math.floor(Math.random() * burstTypes.length)];
  const now = Date.now();

  if (anomalyType === 'mass_download') {
    const files = [
      '/finance/reports/q1-earnings.xlsx',
      '/finance/reports/q2-earnings.xlsx',
      '/finance/reports/q3-earnings.xlsx',
      '/finance/reports/q4-earnings.xlsx',
      '/finance/reports/annual-report.pdf',
      '/finance/reports/budget-2026.xlsx',
    ];
    return files.map((file, idx) => ({
      username: user.username,
      userId: user.userId,
      eventType: 'file_download',
      ipAddress: user.normalIp,
      device: user.normalDevice,
      location: user.normalLocation,
      filePath: file,
      success: true,
      timestamp: new Date(now + idx * 500).toISOString(),
    }));
  }

  if (anomalyType === 'brute_force') {
    const suspiciousIp = user.suspiciousIp || '45.33.32.156';
    const burst: IngestEvent[] = [];
    const count = 4; // 3+ failed logins to trigger brute-force detector
    for (let i = 0; i < count; i++) {
      burst.push({
        username: user.username,
        userId: user.userId,
        eventType: 'failed_login',
        ipAddress: suspiciousIp,
        device: 'Unknown Device',
        location: { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'RU' },
        success: false,
        timestamp: new Date(now + i * 800).toISOString(),
      });
    }
    return burst;
  }

  return [generateEvent(user, true)];
}
