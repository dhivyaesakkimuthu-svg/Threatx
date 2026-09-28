import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'analyst' | 'viewer';
export type UserStatus = 'active' | 'disabled';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  username?: string;
  riskScore?: number;
  knownIps?: string[];
  knownDevices?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeUser(): {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLogin?: Date;
    createdAt: Date;
  };
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    lastLogin: { type: Date },
    // Backward compatibility fields
    username: { type: String },
    riskScore: { type: Number, default: 0 },
    knownIps: { type: [String], default: [] },
    knownDevices: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Method to verify candidate password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to return safe sanitized user object (never returns passwordHash)
UserSchema.methods.toSafeUser = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
