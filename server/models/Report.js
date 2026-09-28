import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
    collection: 'reports',
  }
);

export const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export default ReportModel;
