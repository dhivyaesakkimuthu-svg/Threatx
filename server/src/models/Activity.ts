import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: string;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  // Compatibility fields
  activityId?: string;
  serverId?: string;
  userId?: string;
  username?: string;
  eventType?: string;
  sourceIp?: string;
  device?: string;
  location?: string;
  details?: string;
  success?: boolean;
  createdAt?: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, required: true, default: 'system_log', index: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
      index: true,
    },
    source: { type: String, default: 'ThreatX Sensor' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    // Compatibility fields
    activityId: { type: String, index: true },
    serverId: { type: String, index: true },
    userId: { type: String, index: true },
    username: { type: String },
    eventType: { type: String },
    sourceIp: { type: String },
    device: { type: String },
    location: { type: String },
    details: { type: String },
    success: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'activities',
  }
);

export const ActivityModel = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
export default ActivityModel;
