import mongoose, { Schema, Document } from 'mongoose';

export interface IServer extends Document {
  serverId: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'warning' | 'pending';
  health: 'healthy' | 'warning' | 'degraded' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  connectionStatus: 'connected' | 'degraded' | 'offline';
  activeSessions: number;
  lastHeartbeat: Date;
  hostname?: string;
  apiKey?: string;
  os?: string;
  agentVersion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ServerSchema = new Schema<IServer>(
  {
    serverId: { type: String, required: true, unique: true, index: true, default: () => `SRV-${Math.floor(100 + Math.random() * 900)}` },
    name: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true },
    status: { type: String, enum: ['online', 'offline', 'warning', 'pending'], default: 'online', index: true },
    health: { type: String, enum: ['healthy', 'warning', 'degraded', 'critical'], default: 'healthy' },
    cpuUsage: { type: Number, default: 48 },
    memoryUsage: { type: Number, default: 62 },
    connectionStatus: { type: String, enum: ['connected', 'degraded', 'offline'], default: 'connected' },
    activeSessions: { type: Number, default: 4 },
    lastHeartbeat: { type: Date, default: Date.now },
    hostname: { type: String, trim: true },
    apiKey: { type: String },
    os: { type: String, default: 'Linux' },
    agentVersion: { type: String, default: 'v2.4.1' },
  },
  {
    timestamps: true,
    collection: 'servers',
  }
);

export const ServerModel = mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);
export default ServerModel;
