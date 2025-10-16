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
    
    // Get staff information for assigned reports
    const assignedStaffIds = [...new Set(reports.map(r => r.assignedTo).filter(Boolean))];
    const staffUsers = assignedStaffIds.length > 0 
      ? await User.find({ staffId: { $in: assignedStaffIds }, role: 'staff' }).select('staffId name')
      : [];
    const staffMap = new Map(staffUsers.map(s => [s.staffId, s.name]));
    
    // For students, filter out admin notes and assignment notes, add staff names
    if (user.role === 'student') {
      const filteredReports = reports.map(report => {
        const reportObj = report.toJSON();
        
        // Add staff name if assigned
        if (reportObj.assignedTo) {
          reportObj.assignedToName = staffMap.get(reportObj.assignedTo) || 'Unknown Staff';
        }
        
        // Remove adminNotes completely for students (could contain assignment notes)
        delete reportObj.adminNotes;
        
        // Filter notes array - only show status_change notes, hide assignment notes
        if (reportObj.notes && reportObj.notes.length > 0) {
          reportObj.notes = reportObj.notes.filter(note => {
            // Keep notes that are explicitly status_change type
            if (note.noteType === 'status_change') return true;
            
            // Hide notes that are explicitly assignment type
            if (note.noteType === 'assignment') return false;
            
            // For existing notes without noteType, be more inclusive:
            // Keep if it has statusAtTime (likely a status change note)
            // OR if the report status is rejected (likely a rejection note)
            return !note.noteType && (note.statusAtTime || reportObj.status === 'rejected');
          });
        }
        
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
    
    // Students should use /reports/rejected endpoint instead
    if (user.role === 'student') {
      return res.status(403).json({ error: 'Students should use /reports/rejected endpoint' });
    }
    
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

// GET /reports/rejected - for students: only rejected reports with admin notes, but not if assigned to staff
router.get('/rejected', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden - Students only' });
    }

    // Find rejected reports that were NEVER assigned to staff and have some notes
    // Check both wasEverAssigned flag AND current assignedTo field for existing data
    const reports = await Report.find({ 
      status: 'rejected',
      $and: [
        { wasEverAssigned: { $ne: true } },
        { 
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: '' }
          ]
        }
      ],
      $or: [
        { adminNotes: { $exists: true, $ne: '' } },
        { 'notes.0': { $exists: true } }
      ]
    }).sort({ createdAt: -1 });
    
    // Filter out assignment notes and adminNotes from the response for students
    const filteredReports = reports.map(report => {
      const reportObj = report.toJSON();
      
      // Remove adminNotes completely for students (could contain assignment notes)
      delete reportObj.adminNotes;
      
      // Filter notes array - only show status_change notes, hide assignment notes
      if (reportObj.notes && reportObj.notes.length > 0) {
        reportObj.notes = reportObj.notes.filter(note => {
          // Keep notes that are explicitly status_change type
          if (note.noteType === 'status_change') return true;
          
          // Hide notes that are explicitly assignment type
          if (note.noteType === 'assignment') return false;
          
          // For existing notes without noteType, be more inclusive:
          // Keep if it has statusAtTime (likely a status change note)
          // OR if the report status is rejected (likely a rejection note)
          return !note.noteType && (note.statusAtTime || reportObj.status === 'rejected');
        });
      }
      
      return reportObj;
    }).filter(report => {
      // Only return reports that still have valid notes after filtering
      return report.notes && report.notes.length > 0;
    });
    
    console.log(`🔍 Student accessing rejected reports: Found ${filteredReports.length} reports`);
    filteredReports.forEach(report => {
      console.log(`📝 Report ${report.id}: ${report.notes?.length || 0} notes, wasEverAssigned: ${report.wasEverAssigned}, assignedTo: "${report.assignedTo}"`);
    });
    
    return res.json({ reports: filteredReports });
  } catch (e) {
    console.error('List rejected reports error', e);
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
    
    // Students can only see rejected reports that were NEVER assigned to staff
    if (user.role === 'student') {
      if (doc.status !== 'rejected') {
        return res.status(403).json({ error: 'Students can only view rejected reports' });
      }
      if (doc.wasEverAssigned || (doc.assignedTo && doc.assignedTo.trim() !== '')) {
        return res.status(403).json({ error: 'Cannot view reports that were assigned to staff' });
      }
      // For students, completely hide adminNotes and filter notes array
      const reportObj = doc.toJSON();
      
      // Remove adminNotes completely for students (could contain assignment notes)
      delete reportObj.adminNotes;
      
      // Filter notes array - only show status_change notes, hide assignment notes
      if (reportObj.notes && reportObj.notes.length > 0) {
        reportObj.notes = reportObj.notes.filter(note => {
          // Keep notes that are explicitly status_change type
          if (note.noteType === 'status_change') return true;
          
          // Hide notes that are explicitly assignment type
          if (note.noteType === 'assignment') return false;
          
          // For existing notes without noteType, be more inclusive:
          // Keep if it has statusAtTime (likely a status change note)
          // OR if the report status is rejected (likely a rejection note)
          return !note.noteType && (note.statusAtTime || reportObj.status === 'rejected');
        });
      }
      
      // Check if there are any valid notes left for students to see
      const hasValidNotes = reportObj.notes && reportObj.notes.length > 0;
      if (!hasValidNotes) {
        return res.status(403).json({ error: 'No admin notes available' });
      }
      
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
    const { status, adminNotes, assignedTo } = req.body || {};

    const allowedStatus = ['pending', 'in-progress', 'completed', 'resolved', 'rejected'];
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
      if (typeof assignedTo === 'string') {
        update.assignedTo = assignedTo;
        // If assigning to staff (not empty), mark as ever assigned
        if (assignedTo.trim() !== '') {
          update.wasEverAssigned = true;
        }
      }
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
      const noteType = status ? 'status_change' : (assignedTo ? 'assignment' : 'general');
      const note = {
        byUserId: user.id,
        byName: user.name,
        byRole: user.role,
        text: adminNotes.trim(),
        statusAtTime: doc.status, // already normalized above
        noteType: noteType,
        createdAt: new Date(),
      };
      await Report.findByIdAndUpdate(id, { $push: { notes: note } });
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
