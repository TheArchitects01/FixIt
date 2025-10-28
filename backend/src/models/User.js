import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin', 'staff'], required: true },
    studentId: { type: String, index: true },
    staffId: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', UserSchema);
