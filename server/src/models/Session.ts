import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  serverId?: string;
  username: string;
  sourceIp: string;
  status: 'active' | 'idle' | 'flagged' | 'terminated';
  startedAt: Date;
  endedAt?: Date;
  // Compatibility fields
  userId?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  riskScore?: number;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    serverId: { type: String, default: 'SRV-001', index: true },
    username: { type: String, required: true, index: true },
    sourceIp: { type: String, required: true },
    status: { type: String, enum: ['active', 'idle', 'flagged', 'terminated'], default: 'active', index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    // Compatibility fields
    userId: { type: String, index: true },
    ipAddress: { type: String },
    device: { type: String, default: 'SSH Session / Terminal' },
    location: { type: String, default: 'Internal Network' },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default SessionModel;
