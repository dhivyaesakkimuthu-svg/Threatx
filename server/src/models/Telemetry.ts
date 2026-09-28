import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetry extends Document {
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  health: string;
  connectionStatus: string;
  timestamp: Date;
}

const TelemetrySchema = new Schema<ITelemetry>(
  {
    serverId: { type: String, required: true, index: true },
    cpuUsage: { type: Number, required: true },
    memoryUsage: { type: Number, required: true },
    activeSessions: { type: Number, default: 0 },
    health: { type: String, default: 'healthy' },
    connectionStatus: { type: String, default: 'connected' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    collection: 'telemetry',
  }
);

// TTL index to automatically expire records older than 7 days if desired, or query by time
TelemetrySchema.index({ serverId: 1, timestamp: -1 });

export const TelemetryModel = mongoose.models.Telemetry || mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
export default TelemetryModel;
