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

// GET /reports/mine - reports created by current user (filtered for students)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const reports = await Report.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    
    // For students
    if (user.role === 'student') {
      const filteredReports = reports.map(report => {
        const reportObj = report.toJSON();
        return reportObj;
      });
      
      console.log(`🔍 Student accessing own reports: Found ${filteredReports.length} reports`);
      return res.json({ reports: filteredReports });
    }
    
    return res.json({ reports: reports.map((r) => r.toJSON()) });
  } catch (e) {
    console.error('List my reports error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /reports - all reports (campus view) - restricted for students
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { assignedTo } = req.query || {};
    const filter = {};
    
    // Filter reports based on role
    if (user.role === 'student') {
      // Students can see all non-pending reports
      filter.status = { $ne: 'pending' };
    } else if (assignedTo && typeof assignedTo === 'string') {
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



// GET /reports/:id - fetch single report with role-based filtering
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const doc = await Report.findById(id);
    if (!doc) return res.status(404).json({ error: 'Report not found' });
    
    // Students can view their own reports
    if (user.role === 'student') {
      const reportObj = doc.toJSON();
      return res.json({ report: reportObj });
    }
    
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
    const { status, assignedTo, rejectionNote, assignmentNote, statusNote } = req.body || {};

    const allowedStatus = ['pending', 'in-progress', 'completed', 'resolved', 'rejected'];
    const update = {};

    // Handle status updates
    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      update.status = status === 'completed' ? 'resolved' : status;

      // Require rejection note when admin rejects a report
      if (status === 'rejected' && user.role === 'admin') {
        if (!rejectionNote || !rejectionNote.trim()) {
          return res.status(400).json({ error: 'Rejection note is required when rejecting a report' });
        }
        update.rejectionNote = rejectionNote.trim();
      }
    }

    // Permissions and role-specific updates
    if (user.role === 'admin') {
      // Admin assigning to staff
      if (typeof assignedTo === 'string') {
        if (assignedTo.trim() !== '') {
          // Find the staff member to get their name
          const staffMember = await User.findOne({ staffId: assignedTo.trim() });
          if (!staffMember) {
            return res.status(400).json({ error: 'Staff member not found' });
          }
          
          update.assignedTo = assignedTo.trim();
          update.assignedToName = staffMember.name; // Store staff name
          update.wasEverAssigned = true;
          
          // Set assignment note if provided
          if (assignmentNote && assignmentNote.trim()) {
            update.assignmentNote = assignmentNote.trim();
          }
        } else {
          update.assignedTo = '';
          update.assignedToName = null;
          update.wasEverAssigned = false;
        }
      }
    } else if (user.role === 'staff') {
      const docCurrent = await Report.findById(id);
      if (!docCurrent) return res.status(404).json({ error: 'Report not found' });
      if (!user.staffId || docCurrent.assignedTo !== user.staffId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Staff adding status note
      if (status && statusNote && statusNote.trim()) {
        update.$push = {
          statusNotes: {
            status: status === 'completed' ? 'resolved' : status,
            note: statusNote.trim(),
            createdAt: new Date()
          }
        };
      }
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Apply updates
    const doc = await Report.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Report not found' });


    // Fetch the final updated document
    const finalDoc = await Report.findById(id);
    return res.json({ report: finalDoc.toJSON() });
  } catch (e) {
    console.error('Update report error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
