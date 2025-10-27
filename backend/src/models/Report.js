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
    assignedTo: { type: String, default: '' },
    assignedToName: { type: String, default: null }, // Store staff member's name
    wasEverAssigned: { type: Boolean, default: false },
    // New note fields
    rejectionNote: { type: String, default: '' }, // For admin to student (required when rejecting)
    assignmentNote: { type: String, default: '' }, // For admin to staff
    statusNotes: [{ // For staff to admin (old system, kept for backward compatibility)
      status: { type: String, enum: ['in-progress', 'resolved'] },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    // New conversation system between admin and staff
    conversationNotes: [{
      sender: { type: String, enum: ['admin', 'staff'], required: true }, // Who sent the message
      senderName: { type: String, required: true }, // Name of the sender
      senderImage: { type: String, default: null }, // Profile image of the sender
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
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
