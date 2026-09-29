import type { DashboardStats, ThreatEvent, Server, Incident, Alert, LoginActivity } from '../types';

export type UserRole = 'admin' | 'analyst' | 'viewer';
export type UserStatus = 'active' | 'disabled';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  _id?: string;
  id?: string;
  logId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemStatusData {
  server_health: 'healthy' | 'warning' | 'degraded' | 'offline' | string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  active_session_count: number;
  connection_status: 'connected' | 'degraded' | 'offline' | string;
  timestamp: string;
  source?: string;
}

export interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  database: 'connected' | 'disconnected';
  demoServer: 'connected' | 'degraded' | 'offline';
  socket: 'active' | 'disconnected';
  socketClients?: number;
  latencyMs?: number;
  timestamp: string;
}

export interface UserSession {
  id?: string;
  sessionId: string;
  serverId?: string;
  userId?: string;
  username: string;
  sourceIp?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  startedAt: string | Date;
  endedAt?: string | Date;
  lastActive?: string;
  status: 'active' | 'idle' | 'flagged' | 'terminated';
  riskScore?: number;
}

export interface SecurityActivity {
  id?: string;
  activityId?: string;
  type: string;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: string | Date;
  metadata?: Record<string, any>;
  userId?: string;
  username?: string;
  sourceIp?: string;
}

export interface SecurityReport {
  id?: string;
  reportId: string;
  title: string;
  type: string;
  status: string;
  generatedAt: string | Date;
  createdBy: string;
  summary?: string;
  author?: string;
  severity?: string;
  period?: string;
  metrics?: Record<string, any>;
  createdAt?: string;
}

export interface ServerTelemetryRecord {
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  health: string;
  connectionStatus: string;
  timestamp: string | Date;
}

export interface GlobalSearchResults {
  threats: ThreatEvent[];
  alerts: Alert[];
  servers: Server[];
  sessions: UserSession[];
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalyticsData {
  securityScore: number;
  activeThreats: number;
  totalThreats?: number;
  threatsToday?: number;
  criticalAlerts: number;
  resolvedAlerts?: number;
  totalAlerts?: number;
  alertsByStatus?: {
    open: number;
    investigating: number;
    resolved: number;
    dismissed: number;
  };
  totalServers: number;
  onlineServers: number;
  serverHealthDistribution?: {
    healthy: number;
    warning: number;
    degraded: number;
    critical: number;
  };
  activeSessions: number;
  totalSessions?: number;
  totalActivities: number;
  eventsToday?: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  threatTypeBreakdown: Record<string, number>;
  timeline: Array<{
    time: string;
    count: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  lastCalculated?: string;
}

export interface ApiService {
  login: (email: string, password: string) => Promise<{ token: string; user: UserProfile }>;
  register: (userData: any) => Promise<{ token: string; user: UserProfile }>;
  getMe: () => Promise<{ user: UserProfile }>;
  logout: () => Promise<void>;
  getUsers: (params?: Record<string, any>) => Promise<UserProfile[] | PaginatedResult<UserProfile>>;
  createUser: (userData: any) => Promise<UserProfile>;
  updateUserRole: (id: string, role: UserRole) => Promise<UserProfile>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<UserProfile>;
  getAuditLogs: (params?: Record<string, any>) => Promise<AuditLogEntry[] | PaginatedResult<AuditLogEntry>>;
  getStatus: () => Promise<SystemStatusData>;
  getHealth: () => Promise<HealthData>;
  search: (q: string) => Promise<GlobalSearchResults>;
  getServers: () => Promise<Server[]>;
  getServer: (id: string) => Promise<Server>;
  getServerTelemetry: (id: string, limit?: number) => Promise<ServerTelemetryRecord[]>;
  createServer: (data: Partial<Server>) => Promise<Server>;
  updateServer: (id: string, data: Partial<Server>) => Promise<Server>;
  deleteServer: (id: string) => Promise<{ success: boolean; removedId: string }>;
  regenerateKey: (id: string) => Promise<{ apiKey: string }>;
  getThreats: (params?: Record<string, any>) => Promise<ThreatEvent[] | PaginatedResult<ThreatEvent>>;
  getThreat: (id: string) => Promise<ThreatEvent>;
  createThreat: (data: Partial<ThreatEvent>) => Promise<ThreatEvent>;
  updateThreat: (id: string, data: Partial<ThreatEvent>) => Promise<ThreatEvent>;
  getAlerts: (params?: Record<string, any>) => Promise<Alert[]>;
  getAlert: (id: string) => Promise<Alert>;
  createAlert: (data: Partial<Alert>) => Promise<Alert>;
  updateAlert: (id: string, data: Partial<Alert>) => Promise<Alert>;
  markAlertRead: (id: string) => Promise<Alert>;
  markAllAlertsRead: () => Promise<{ success: boolean }>;
  getSessions: (params?: Record<string, any>) => Promise<UserSession[] | PaginatedResult<UserSession>>;
  terminateSession: (id: string) => Promise<{ success: boolean; sessionId: string; status: string }>;
  getActivities: (params?: Record<string, any>) => Promise<SecurityActivity[] | PaginatedResult<SecurityActivity>>;
  createActivity: (data: Partial<SecurityActivity>) => Promise<SecurityActivity>;
  getReports: () => Promise<SecurityReport[]>;
  getReport: (id: string) => Promise<SecurityReport>;
  createReport: (data: Partial<SecurityReport>) => Promise<SecurityReport>;
  getAnalytics: () => Promise<AnalyticsData>;
  analyzeEvent: (payload: { event?: any; telemetry?: any }) => Promise<any>;
  getIntelligenceDecisions: (params?: Record<string, any>) => Promise<any>;
  getIntelligenceStats: () => Promise<any>;
  getIntelligenceStatus: () => Promise<{
    abuseIpdb: { configured: boolean; service: string; status: string };
    virusTotal: { configured: boolean; service: string; status: string };
    gemini: { configured: boolean; service: string; status: string };
  }>;
  lookupIp: (ip: string) => Promise<any>;
  lookupDomain: (domain: string) => Promise<any>;
  lookupHash: (hash: string) => Promise<any>;
  copilotChat: (message: string, context?: any, chatHistory?: any[]) => Promise<any>;
  copilotAnalyze: (payload: { event?: any; telemetry?: any; server?: any; enrichWithIoc?: boolean }) => Promise<any>;
  generateAiReport: (incidentData: any) => Promise<any>;
  getDemoScenarios: () => Promise<{ demoMode: boolean; count: number; scenarios: any[] }>;
  triggerDemoScenario: (scenario: string) => Promise<any>;
  resetDemoData: () => Promise<{ status: string; message: string }>;
  getInfo: () => Promise<any>;
  getEvents: (params?: Record<string, any>) => Promise<ThreatEvent[]>;
  acknowledgeEvent: (id: string) => Promise<ThreatEvent>;
  getDashboardStats: () => Promise<DashboardStats>;
  getIncidents: () => Promise<Incident[]>;
}

// @ts-ignore - JavaScript service integration
export { api, apiClient, normalizeStatusData } from './api.js';
export type { DashboardStats, ThreatEvent, Server, Incident, Alert, LoginActivity };
