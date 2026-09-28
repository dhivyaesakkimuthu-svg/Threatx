import mongoose, { Schema, Document } from 'mongoose';

export interface IIntelligenceDecision extends Document {
  decisionId: string;
  source: string;
  sourceIp: string;
  eventType: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasons: string[];
  anomalies: string[];
  recommendedAction: string;
  telemetrySnapshot?: {
    cpuUsage?: number;
    memoryUsage?: number;
    activeSessions?: number;
    health?: string;
  };
  eventPayload?: any;
  threatId?: string;
  alertId?: string;
  analyzedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const IntelligenceDecisionSchema = new Schema<IIntelligenceDecision>(
  {
    decisionId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true, default: 'threat_intelligence_engine' },
    sourceIp: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    riskScore: { type: Number, required: true, min: 0, max: 100, index: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true, index: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    reasons: { type: [String], default: [] },
    anomalies: { type: [String], default: [] },
    recommendedAction: { type: String, required: true },
    telemetrySnapshot: {
      cpuUsage: Number,
      memoryUsage: Number,
      activeSessions: Number,
      health: String,
    },
    eventPayload: { type: Schema.Types.Mixed },
    threatId: { type: String, index: true },
    alertId: { type: String, index: true },
    analyzedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'intelligence_decisions',
  }
);

export const IntelligenceDecisionModel =
  mongoose.models.IntelligenceDecision ||
  mongoose.model<IIntelligenceDecision>('IntelligenceDecision', IntelligenceDecisionSchema);

export default IntelligenceDecisionModel;
