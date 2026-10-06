import mongoose, { Schema, Document } from 'mongoose';
import type { Incident as IIncident } from '../../types.js';

export interface IncidentDoc extends Omit<IIncident, 'id'>, Document {
  id: string;
}

const InvestigationEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    action: { type: String, required: true },
    analyst: { type: String, required: true },
    notes: { type: String, required: true },
  },
  { _id: false }
);

const IncidentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    threatEventId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: String, default: 'Security Team' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    investigationHistory: [InvestigationEntrySchema],
    relatedEvents: [{ type: String }],
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

export const IncidentModel =
  mongoose.models.Incident || mongoose.model<IncidentDoc>('Incident', IncidentSchema);
