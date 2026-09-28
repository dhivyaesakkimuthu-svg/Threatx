import UserModel from './User.js';
import ServerModel from './Server.js';
import ThreatModel from './Threat.js';
import AlertModel from './Alert.js';
import SessionModel from './Session.js';
import ActivityModel from './Activity.js';
import ReportModel from './Report.js';

export {
  UserModel,
  ServerModel,
  ThreatModel,
  AlertModel,
  SessionModel,
  ActivityModel,
  ReportModel,
};

export const COLLECTIONS = {
  USERS: 'users',
  SERVERS: 'servers',
  THREATS: 'threats',
  ALERTS: 'alerts',
  SESSIONS: 'sessions',
  ACTIVITIES: 'activities',
  REPORTS: 'reports',
};

export default {
  UserModel,
  ServerModel,
  ThreatModel,
  AlertModel,
  SessionModel,
  ActivityModel,
  ReportModel,
};
