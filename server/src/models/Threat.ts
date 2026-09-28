import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: string[];
  anomalies: string[];
  recommendedAction: string;
  analyzedAt: Date | string;
}

export interface IThreat extends Document {
  threatId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  status: 'new' | 'active' | 'investigating' | 'mitigated' | 'blocked' | 'open' | 'closed';
  description: string;
  detectedAt: string | Date;
  aiAnalysis?: IAIAnalysis;
  // Backward compatibility fields
  username?: string;
  threatType?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore?: number;
  ipAddress?: string;
  explanation?: string;
  recommendedActions?: string[];
  acknowledged?: boolean;
  timestamp?: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    reasons: { type: [String], default: [] },
    anomalies: { type: [String], default: [] },
    recommendedAction: { type: String, required: true },
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ThreatSchema = new Schema<IThreat>(
  {
    threatId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high', index: true },
    source: { type: String, required: true, index: true },
    target: { type: String, required: true, default: 'SRV-001' },
    status: { type: String, enum: ['new', 'active', 'investigating', 'mitigated', 'blocked', 'open', 'closed'], default: 'new', index: true },
    description: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now, index: true },
    aiAnalysis: { type: AIAnalysisSchema },
    // Compatibility fields
    username: { type: String },
    threatType: { type: String },
    riskLevel: { type: String },
    riskScore: { type: Number, default: 85 },
    ipAddress: { type: String },
    explanation: { type: String },
    recommendedActions: { type: [String], default: [] },
    acknowledged: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'threats',
  }
);

export const ThreatModel = mongoose.models.Threat || mongoose.model<IThreat>('Threat', ThreatSchema);
export default ThreatModel;
