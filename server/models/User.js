import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'analyst', 'operator', 'user'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended', 'flagged'], default: 'active' },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default UserModel;
