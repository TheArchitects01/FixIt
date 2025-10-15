import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

const router = express.Router();

// POST /reports
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, location, photo, priority } = req.body || {};
    if (!title || !description || !location?.building || !location?.room) {
      return res.status(400).json({ error: 'title, description, location.building, location.room are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await Report.create({
      title,
      description,
      location,
      photo: photo || null,
      priority: priority || 'medium',
      studentId: user.studentId || '',
      studentName: user.name,
      createdBy: user._id,
      status: 'pending',
      upvotesCount: 0,
    });

    return res.status(201).json({ report: doc.toJSON() });
  } catch (e) {
    console.error('Create report error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /reports/mine - reports created by current user
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return res.json({ reports: reports.map((r) => r.toJSON()) });
  } catch (e) {
    console.error('List my reports error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /reports - all reports (campus view)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { assignedTo } = req.query || {};
    const filter = {};
    if (assignedTo && typeof assignedTo === 'string') {
      filter.assignedTo = assignedTo;
    }
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    return res.json({ reports: reports.map((r) => r.toJSON()) });
  } catch (e) {
    console.error('List all reports error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /reports/assigned-to-me - for staff: reports assigned to this staff
router.get('/assigned-to-me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'staff') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!user.staffId) {
      return res.status(400).json({ error: 'Staff profile incomplete' });
    }

    const reports = await Report.find({ assignedTo: user.staffId }).sort({ createdAt: -1 });
    return res.json({ reports: reports.map((r) => r.toJSON()) });
  } catch (e) {
    console.error('List assigned reports error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /reports/:id - fetch single report
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Report.findById(id);
    if (!doc) return res.status(404).json({ error: 'Report not found' });
    return res.json({ report: doc.toJSON() });
  } catch (e) {
    console.error('Get report by id error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// PATCH /reports/:id - admin can update status/adminNotes/assignedTo
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, adminNotes, assignedTo, cleanupNotes } = req.body || {};

    const allowedStatus = ['pending', 'in-progress', 'completed', 'resolved'];
    const update = {};
    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      update.status = status === 'completed' ? 'resolved' : status;
    }
    if (typeof adminNotes === 'string') update.adminNotes = adminNotes;

    // Permissions:
    // - Admin: can update any report and set assignedTo
    // - Staff: can update only reports assigned to their staffId; cannot change assignedTo
    if (user.role === 'admin') {
      if (typeof assignedTo === 'string') update.assignedTo = assignedTo;
    } else if (user.role === 'staff') {
      const docCurrent = await Report.findById(id);
      if (!docCurrent) return res.status(404).json({ error: 'Report not found' });
      if (!user.staffId || docCurrent.assignedTo !== user.staffId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      // staff cannot change assignment
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (Object.keys(update).length === 0 && typeof adminNotes !== 'string') {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Apply updates
    const doc = await Report.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Report not found' });

    // Append note to timeline if provided
    if (typeof adminNotes === 'string' && adminNotes.trim()) {
      const note = {
        byUserId: user.id,
        byName: user.name,
        byRole: user.role,
        text: adminNotes.trim(),
        statusAtTime: doc.status, // already normalized above
        createdAt: new Date(),
      };
      await Report.findByIdAndUpdate(id, { $push: { notes: note } });
    }

    // Cleanup notes if marking as completed (selective note deletion)
    if (cleanupNotes && (status === 'completed' || status === 'resolved')) {
      console.log('🧹 Cleanup notes triggered for report:', id);
      const currentDoc = await Report.findById(id);
      if (currentDoc && currentDoc.notes && currentDoc.notes.length > 0) {
        console.log('📝 Notes before cleanup:', currentDoc.notes.length);
        
        // Keep only notes that were added when changing status
        const importantNotes = currentDoc.notes.filter(note => {
          // Keep notes that have a statusAtTime (notes added during status changes)
          // These are the important milestone notes
          if (note.statusAtTime && note.statusAtTime !== 'pending') return true;
          
          // Delete standalone notes (notes added without status change)
          return false;
        });
        
        console.log('✅ Notes after cleanup:', importantNotes.length);
        
        // Update the report with cleaned notes
        await Report.findByIdAndUpdate(id, { notes: importantNotes });
      }
    }

    // Fetch the final updated document
    const finalDoc = await Report.findById(id);
    return res.json({ report: finalDoc.toJSON() });
  } catch (e) {
    console.error('Update report error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
