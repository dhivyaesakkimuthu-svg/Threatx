import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
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
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'activities',
  }
);

export const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
export default ActivityModel;
