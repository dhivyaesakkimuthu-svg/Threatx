import mongoose, { Schema, Document } from 'mongoose';
import type { ActivityLog as IActivityLog } from '../../types.js';

export interface ActivityLogDoc extends Omit<IActivityLog, 'id'>, Document {
  id: string;
}

const ActivityLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    serverId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    eventType: { type: String, required: true },
    ipAddress: { type: String, default: '0.0.0.0' },
    device: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: '' },
    location: {
      lat: Number,
      lng: Number,
      city: String,
      country: String,
    },
    filePath: String,
    success: { type: Boolean, default: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    telemetry: { type: Schema.Types.Mixed },
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

export const ActivityLogModel =
  mongoose.models.ActivityLog || mongoose.model<ActivityLogDoc>('ActivityLog', ActivityLogSchema);
