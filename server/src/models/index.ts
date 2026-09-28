import UserModel, { IUser } from './User.js';
import ServerModel, { IServer } from './Server.js';
import ThreatModel, { IThreat } from './Threat.js';
import AlertModel, { IAlert } from './Alert.js';
import SessionModel, { ISession } from './Session.js';
import ActivityModel, { IActivity } from './Activity.js';
import ReportModel, { IReport } from './Report.js';
import TelemetryModel, { ITelemetry } from './Telemetry.js';
import IntelligenceDecisionModel, { IIntelligenceDecision } from './IntelligenceDecision.js';
import AuditLogModel, { IAuditLog } from './AuditLog.js';

export {
  UserModel,
  ServerModel,
  ThreatModel,
  AlertModel,
  SessionModel,
  ActivityModel,
  ReportModel,
  TelemetryModel,
  IntelligenceDecisionModel,
  AuditLogModel,
};

export type {
  IUser,
  IServer,
  IThreat,
  IAlert,
  ISession,
  IActivity,
  IReport,
  ITelemetry,
  IIntelligenceDecision,
  IAuditLog,
};

export const COLLECTIONS = {
  USERS: 'users',
  SERVERS: 'servers',
  THREATS: 'threats',
  ALERTS: 'alerts',
  SESSIONS: 'sessions',
  ACTIVITIES: 'activities',
  REPORTS: 'reports',
  TELEMETRY: 'telemetry',
  INTELLIGENCE_DECISIONS: 'intelligence_decisions',
  AUDIT_LOGS: 'audit_logs',
} as const;

export const models = {
  User: UserModel,
  Server: ServerModel,
  Threat: ThreatModel,
  Alert: AlertModel,
  Session: SessionModel,
  Activity: ActivityModel,
  Report: ReportModel,
  Telemetry: TelemetryModel,
  IntelligenceDecision: IntelligenceDecisionModel,
  AuditLog: AuditLogModel,
};

export default models;
