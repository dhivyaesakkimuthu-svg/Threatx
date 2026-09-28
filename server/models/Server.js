import mongoose from 'mongoose';

const ServerSchema = new mongoose.Schema(
  {
    serverId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true },
    status: { type: String, enum: ['online', 'offline', 'warning', 'pending'], default: 'online', index: true },
    health: { type: String, enum: ['healthy', 'warning', 'degraded', 'critical'], default: 'healthy' },
    cpuUsage: { type: Number, default: 48 },
    memoryUsage: { type: Number, default: 62 },
    connectionStatus: { type: String, enum: ['connected', 'degraded', 'offline'], default: 'connected' },
    activeSessions: { type: Number, default: 4 },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'servers',
  }
);

export const ServerModel = mongoose.models.Server || mongoose.model('Server', ServerSchema);
export default ServerModel;
