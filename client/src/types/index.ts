export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Server {
  id: string;
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
  os: string;
  agentVersion: string;
  lastSeen: string;
  createdAt: string;
}

export interface AIAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: string[];
  anomalies: string[];
  recommendedAction: string;
  analyzedAt: string;
}

export interface ThreatEvent {
  id: string;
  threatId: string;
  serverId?: string;
  serverName?: string;
  userId?: string;
  username: string;
  type: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: RiskLevel;
  riskScore: number;
  source: string;
  ipAddress: string;
  target: string;
  device?: string;
  status: 'new' | 'active' | 'investigating' | 'mitigated' | 'blocked' | 'open' | 'closed';
  detectedAt: string;
  timestamp: string;
  description: string;
  explanation: string;
  recommendedActions?: string[];
  location?: string;
  filePath?: string;
  acknowledged: boolean;
  aiAnalysis?: AIAnalysis;
}

export interface Incident {
  id: string;
  threatEventId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  investigationHistory: InvestigationEntry[];
  relatedEvents: string[];
  threats?: ThreatEvent[];
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
  alertId: string;
  threatEventId?: string;
  threatId?: string;
  title: string;
  message?: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: RiskLevel;
  source: string;
  target?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'closed';
  read: boolean;
  createdAt: string;
  timestamp?: string;
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

export interface IntelligenceDecision {
  id?: string;
  _id?: string;
  decisionId: string;
  source: string;
  sourceIp: string;
  eventType: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: string[];
  anomalies: string[];
  recommendedAction: string;
  telemetrySnapshot?: {
    cpuUsage?: number;
    memoryUsage?: number;
    activeSessions?: number;
    health?: string;
  };
  eventPayload?: any;
  threatId?: string;
  alertId?: string;
  analyzedAt: string;
  createdAt?: string;
}

export interface IntelligenceStats {
  totalAnalyzed: number;
  anomaliesDetected: number;
  highRiskCount: number;
  criticalRiskCount: number;
  averageRiskScore: number;
  overallRiskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recentAnomalies: IntelligenceDecision[];
}
