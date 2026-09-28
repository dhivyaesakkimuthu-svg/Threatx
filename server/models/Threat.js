import mongoose from 'mongoose';

const ThreatSchema = new mongoose.Schema(
  {
    threatId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high', index: true },
    source: { type: String, required: true, index: true },
    target: { type: String, required: true, default: 'SRV-001' },
    status: { type: String, enum: ['new', 'active', 'investigating', 'mitigated', 'blocked', 'open', 'closed'], default: 'new', index: true },
    description: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'threats',
  }
);

export const ThreatModel = mongoose.models.Threat || mongoose.model('Threat', ThreatSchema);
export default ThreatModel;
