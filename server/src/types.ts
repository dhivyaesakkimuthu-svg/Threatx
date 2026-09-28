export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ThreatType =
  | 'Suspicious Login'
  | 'Unauthorized Access Attempt'
  | 'Impossible Travel'
  | 'Sensitive Download'
  | 'SQL Injection'
  | 'Privilege Escalation'
  | string;

export interface User {
  id?: string;
  userId?: string;
  username: string;
  email?: string;
  role: 'admin' | 'analyst' | 'operator' | 'user';
  status: 'active' | 'suspended' | 'flagged';
  riskScore: number;
  knownIps?: string[];
  knownDevices?: string[];
  lastLogin?: string;
  failedLoginCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Server {
  id?: string;
  serverId: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'warning' | 'pending';
  health: 'healthy' | 'warning' | 'degraded' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  connectionStatus: 'connected' | 'degraded' | 'offline';
  lastHeartbeat: string;
  hostname?: string;
  apiKey?: string;
  os?: string;
  agentVersion?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThreatEvent {
  id: string;
  threatId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  status: 'active' | 'investigating' | 'mitigated' | 'blocked' | 'open' | 'closed' | 'new';
  description: string;
  detectedAt: string;
  // Compatibility fields
  serverId?: string;
  serverName?: string;
  userId?: string;
  username: string;
  threatType: string;
  riskLevel: RiskLevel;
  riskScore?: number;
  ipAddress?: string;
  device?: string;
  timestamp: string;
  explanation?: string;
  recommendedActions?: string[];
  location?: string;
  filePath?: string;
  acknowledged?: boolean;
}

export interface Alert {
  id?: string;
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  source: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'closed';
  createdAt: string;
  description?: string;
  // Compatibility fields
  threatEventId?: string;
  threatId?: string;
  message?: string;
  riskLevel?: RiskLevel;
  read?: boolean;
  target?: string;
}

export interface Session {
  id?: string;
  sessionId: string;
  userId?: string;
  username: string;
  ipAddress?: string;
  sourceIp?: string;
  serverId?: string;
  device?: string;
  location?: string;
  status: 'active' | 'idle' | 'flagged' | 'terminated';
  riskScore?: number;
  startedAt: string;
  lastActive?: string;
  endedAt?: string;
}

export interface ActivityLog {
  id?: string;
  activityId?: string;
  serverId?: string;
  userId: string;
  username: string;
  type?: string;
  eventType: 'login' | 'logout' | 'file_access' | 'file_download' | 'failed_login' | 'impossible_travel' | 'sensitive_download' | 'command_exec' | 'system' | string;
  message?: string;
  source?: string;
  ipAddress: string;
  sourceIp?: string;
  device: string;
  userAgent?: string;
  location?: { lat: number; lng: number; city: string; country: string };
  filePath?: string;
  details?: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Report {
  id?: string;
  reportId: string;
  title: string;
  type: 'security_summary' | 'threat_incident' | 'compliance_audit' | 'executive_brief' | string;
  summary: string;
  author?: string;
  createdBy?: string;
  severity?: 'low' | 'medium' | 'high';
  period?: string;
  metrics?: Record<string, any>;
  status: 'generated' | 'reviewed' | 'archived';
  createdAt: string;
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

export interface Database {
  users: User[];
  servers: Server[];
  threats: ThreatEvent[];
  alerts: Alert[];
  sessions: Session[];
  activities: ActivityLog[];
  reports: Report[];
  // Legacy / internal compatibility
  activityLogs: ActivityLog[];
  behaviorProfiles: UserBehaviorProfile[];
  threatEvents: ThreatEvent[];
  incidents: Incident[];
}
