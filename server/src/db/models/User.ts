import mongoose, { Schema, Document } from 'mongoose';
import type { User as IUser } from '../../types.js';

export interface UserDoc extends Omit<IUser, 'id'>, Document {
  id: string;
  username?: string;
}

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.passwordHash;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema);
