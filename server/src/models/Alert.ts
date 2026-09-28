import mongoose, { Schema, Document } from 'mongoose';
import type { IAIAnalysis } from './Threat.js';

export interface IAlert extends Document {
  alertId: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'closed';
  description?: string;
  aiAnalysis?: IAIAnalysis;
  // Compatibility fields
  message?: string;
  threatId?: string;
  threatEventId?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  read?: boolean;
  target?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema(
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

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'critical', index: true },
    source: { type: String, required: true, default: '192.168.1.20' },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed', 'closed'], default: 'open', index: true },
    description: { type: String, default: 'Unauthorized Access Attempt' },
    aiAnalysis: { type: AIAnalysisSchema },
    // Compatibility fields
    message: { type: String },
    threatId: { type: String },
    threatEventId: { type: String },
    riskLevel: { type: String },
    read: { type: Boolean, default: false },
    target: { type: String, default: 'SRV-001' },
  },
  {
    timestamps: true,
    collection: 'alerts',
  }
);

export const AlertModel = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
export default AlertModel;
