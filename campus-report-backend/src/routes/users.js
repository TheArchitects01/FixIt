import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Report from '../models/Report.js';

const router = express.Router();

// PATCH /users/me/profileImage { url }
router.patch('/me/profileImage', requireAuth, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profileImage: url } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: user.toJSON() });
  } catch (e) {
    console.error('Update profile image error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /users - admin-only list (supports role filter)
router.get('/', requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { role } = req.query || {};
    const filter = {};
    if (role === 'staff') filter.role = 'staff';
    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.json({ users: users.map(u => u.toJSON()) });
  } catch (e) {
    console.error('List users error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /users/staff-stats - admin-only: task counts per staff
router.get('/staff-stats', requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Aggregate counts grouped by assignedTo
    const pipeline = [
      { $match: { assignedTo: { $exists: true, $ne: '' } } },
      { $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        }
      },
    ];

    const counts = await Report.aggregate(pipeline);
    const staffUsers = await User.find({ role: 'staff' });
    const byId = new Map(staffUsers.map(u => [u.staffId || '', u]));
    const result = counts.map(c => {
      const u = byId.get(c._id) || {};
      return {
        staffId: c._id,
        name: u.name || 'Unknown',
        total: c.total,
        pending: c.pending,
        inProgress: c.inProgress,
        completed: c.resolved,
      };
    });

    // Include staff with zero tasks
    staffUsers.forEach(u => {
      const sid = u.staffId || '';
      if (sid && !result.find(r => r.staffId === sid)) {
        result.push({ staffId: sid, name: u.name, total: 0, pending: 0, inProgress: 0, completed: 0 });
      }
    });

    // Sort by total desc
    result.sort((a, b) => b.total - a.total);
    return res.json({ stats: result });
  } catch (e) {
    console.error('Staff stats error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
