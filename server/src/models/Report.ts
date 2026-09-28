import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reportId: string;
  title: string;
  type: string;
  status: string;
  generatedAt: Date;
  createdBy: string;
  // Compatibility fields
  summary?: string;
  author?: string;
  severity?: 'low' | 'medium' | 'high';
  period?: string;
  metrics?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      default: 'security_summary',
    },
    status: { type: String, default: 'generated' },
    generatedAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'ThreatX SOC Admin' },
    // Compatibility fields
    summary: { type: String, default: 'Automated executive security brief and posture evaluation' },
    author: { type: String, default: 'ThreatX AI Engine' },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    period: { type: String, default: 'Last 24 Hours' },
    metrics: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'reports',
  }
);

export const ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export default ReportModel;
