import mongoose, { Schema, Document } from 'mongoose';
import type { ThreatEvent as IThreatEvent } from '../../types.js';

export interface ThreatEventDoc extends Omit<IThreatEvent, 'id'>, Document {
  id: string;
}

const ThreatEventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    serverId: { type: String, required: true, index: true },
    serverName: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    threatType: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    riskScore: { type: Number, required: true },
    ipAddress: { type: String, required: true },
    device: { type: String, required: true },
    timestamp: { type: String, required: true, index: true },
    explanation: { type: String, required: true },
    recommendedActions: [{ type: String }],
    location: String,
    filePath: String,
    acknowledged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ThreatEventModel =
  mongoose.models.ThreatEvent || mongoose.model<ThreatEventDoc>('ThreatEvent', ThreatEventSchema);
