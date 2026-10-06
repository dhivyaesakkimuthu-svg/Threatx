import mongoose, { Schema, Document } from 'mongoose';
import type { Server as IServer } from '../../types.js';

export interface ServerDoc extends Omit<IServer, 'id'>, Document {
  id: string;
}

const ServerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    hostname: { type: String, required: true },
    apiKey: { type: String, required: true, index: true },
    status: { type: String, enum: ['online', 'offline', 'pending'], default: 'pending' },
    os: { type: String, default: 'Unknown' },
    ipAddress: { type: String, default: '' },
    agentVersion: { type: String, default: '' },
    lastSeen: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const ServerModel = mongoose.models.Server || mongoose.model<ServerDoc>('Server', ServerSchema);
