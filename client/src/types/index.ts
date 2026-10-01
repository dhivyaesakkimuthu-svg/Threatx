export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Server {
  id: string;
  name: string;
  hostname: string;
  apiKey?: string;
  status: 'online' | 'offline' | 'pending';
  os: string;
  ipAddress: string;
  agentVersion: string;
  lastSeen: string;
  createdAt: string;
}

export interface ThreatEvent {
  id: string;
  serverId: string;
  serverName: string;
  userId: string;
  username: string;
  threatType: string;
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
