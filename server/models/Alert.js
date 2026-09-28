import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'critical', index: true },
    source: { type: String, required: true, default: '192.168.1.20' },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open', index: true },
    description: { type: String, default: 'Unauthorized Access Attempt' },
  },
  {
    timestamps: true,
    collection: 'alerts',
  }
);

export const AlertModel = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
export default AlertModel;
