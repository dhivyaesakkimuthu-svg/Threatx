export type RiskLevel = 'Low' | 'Medium' | 'High';

export type ThreatType =
  | 'unknown_ip'
  | 'unusual_login_time'
  | 'new_device'
  | 'failed_login_attempts'
  | 'impossible_travel'
  | 'unauthorized_file_access'
  | 'restricted_folder_access'
  | 'mass_download';

export interface Server {
  id: string;
  name: string;
  hostname: string;
  apiKey: string;
  status: 'online' | 'offline' | 'pending';
  os: string;
  ipAddress: string;
  agentVersion: string;
  lastSeen: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  serverId: string;
  userId: string;
  username: string;
  eventType: 'login' | 'logout' | 'file_access' | 'file_download' | 'failed_login';
  ipAddress: string;
  device: string;
  userAgent: string;
  location?: { lat: number; lng: number; city: string; country: string };
  filePath?: string;
  success: boolean;
  timestamp: string;
  telemetry?: {
    cpuPercent?: number;
    memoryPercent?: number;
    diskPercent?: number;
    activeProcessCount?: number;
    uptimeSeconds?: number;
    activeSessions?: any[];
    systemSessions?: any[];
    blockedUsers?: string[];
  } | Record<string, any>;
}

export interface UserBehaviorProfile {
  userId: string;
  username: string;
  knownIps: string[];
  knownDevices: string[];
  typicalLoginHours: number[];
  typicalLocations: { lat: number; lng: number; city: string }[];
  lastLogin?: { ip: string; device: string; timestamp: string; location?: { lat: number; lng: number } };
  failedLoginCount: number;
  accessedFiles: string[];
  restrictedAccessCount: number;
}

export interface ThreatEvent {
  id: string;
  serverId: string;
  serverName: string;
  userId: string;
  username: string;
  threatType: ThreatType;
  riskLevel: RiskLevel;
  riskScore: number;
  ipAddress: string;
  device: string;
  timestamp: string;
  explanation: string;
  recommendedActions: string[];
  location?: string;
  filePath?: string;
  acknowledged: boolean;
}

export interface Incident {
  id: string;
  threatEventId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  investigationHistory: InvestigationEntry[];
  relatedEvents: string[];
}

export interface InvestigationEntry {
  id: string;
  timestamp: string;
  action: string;
  analyst: string;
  notes: string;
}

export interface Alert {
  id: string;
  threatEventId: string;
  title: string;
  message: string;
  riskLevel: RiskLevel;
  read: boolean;
  createdAt: string;
}

export interface LoginActivity {
  id: string;
  username: string;
  ipAddress: string;
  device: string;
  location: string;
  timestamp: string;
  success: boolean;
}

export interface DashboardStats {
  totalServers: number;
  activeUsers: number;
  liveThreats: number;
  securityScore: number;
  riskDistribution: { low: number; medium: number; high: number };
  recentLogins: LoginActivity[];
  threatTimeline: { time: string; count: number; high: number; medium: number; low: number }[];
}

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Database {
  users?: User[];
  servers: Server[];
  activityLogs: ActivityLog[];
  behaviorProfiles: UserBehaviorProfile[];
  threatEvents: ThreatEvent[];
  incidents: Incident[];
  alerts: Alert[];
}

