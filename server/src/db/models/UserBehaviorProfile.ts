import mongoose, { Schema, Document } from 'mongoose';
import type { UserBehaviorProfile as IUserBehaviorProfile } from '../../types.js';

export interface UserBehaviorProfileDoc extends IUserBehaviorProfile, Document {}

const UserBehaviorProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    knownIps: [{ type: String }],
    knownDevices: [{ type: String }],
    typicalLoginHours: [{ type: Number }],
    typicalLocations: [
      {
        lat: Number,
        lng: Number,
        city: String,
      },
    ],
    lastLogin: {
      ip: String,
      device: String,
      timestamp: String,
      location: { lat: Number, lng: Number },
    },
    failedLoginCount: { type: Number, default: 0 },
    accessedFiles: [{ type: String }],
    restrictedAccessCount: { type: Number, default: 0 },
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

export const UserBehaviorProfileModel =
  mongoose.models.UserBehaviorProfile ||
  mongoose.model<UserBehaviorProfileDoc>('UserBehaviorProfile', UserBehaviorProfileSchema);
