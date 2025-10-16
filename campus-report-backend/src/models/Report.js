import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      building: { type: String, required: true },
      room: { type: String, required: true },
    },
    photo: { type: String, default: null },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotesCount: { type: Number, default: 0 },
    adminNotes: { type: String, default: '' },
    assignedTo: { type: String, default: '' },
    wasEverAssigned: { type: Boolean, default: false },
    notes: {
      type: [
        new mongoose.Schema(
          {
            byUserId: { type: String },
            byName: { type: String },
            byRole: { type: String, enum: ['student', 'admin', 'staff'] },
            text: { type: String },
            statusAtTime: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'] },
            noteType: { type: String, enum: ['status_change', 'assignment', 'general'], default: 'general' },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

ReportSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Report', ReportSchema);
