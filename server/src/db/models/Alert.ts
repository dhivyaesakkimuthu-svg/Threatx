import mongoose, { Schema, Document } from 'mongoose';
import type { Alert as IAlert } from '../../types.js';

export interface AlertDoc extends Omit<IAlert, 'id'>, Document {
  id: string;
}

const AlertSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    threatEventId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const AlertModel = mongoose.models.Alert || mongoose.model<AlertDoc>('Alert', AlertSchema);
