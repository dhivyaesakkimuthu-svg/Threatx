import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    serverId: { type: String, default: 'SRV-001', index: true },
    username: { type: String, required: true, index: true },
    sourceIp: { type: String, required: true },
    status: { type: String, enum: ['active', 'idle', 'flagged', 'terminated'], default: 'active', index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

export const SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export default SessionModel;
