import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to map id+role to email string
function emailFromId(id, role) {
  if (role === 'admin') return `${id}@staff.local`;
  if (role === 'staff') return `${id}@staff.local`;
  return `${id}@student.local`;
}

// POST /auth/register { name, studentId, password }
router.post('/register', async (req, res) => {
  try {
    const { name, studentId, password } = req.body || {};
    if (!name || !studentId || !password) {
      return res.status(400).json({ error: 'name, studentId, password required' });
    }

    const email = emailFromId(studentId, 'student');

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role: 'student',
      studentId,
      email,
      passwordHash,
    });

    const token = signToken({ id: user.id });
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (e) {
    console.error('Register error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/register-admin { staffId, name, password, seedKey? }
// Temporary seeding endpoint
router.post('/register-admin', async (req, res) => {
  try {
    const { staffId, name, password, seedKey } = req.body || {};
    if (!staffId || !name || !password) {
      return res.status(400).json({ error: 'staffId, name, password required' });
    }

    const existingAdminCount = await User.countDocuments({ role: 'admin' });
    // If there is at least one admin, require valid seed key
    if (existingAdminCount > 0) {
      const requiredKey = process.env.ADMIN_SEED_KEY;
      if (!requiredKey || seedKey !== requiredKey) {
        return res.status(403).json({ error: 'Not allowed' });
      }
    }

    const email = emailFromId(staffId, 'admin');
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role: 'admin',
      staffId,
      email,
      passwordHash,
    });

    const token = signToken({ id: user.id });
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (e) {
    console.error('Register-admin error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/register-staff { staffId, name, password } (admin-only)
router.post('/register-staff', requireAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'name, password required' });
    }

    // Auto-generate sequential 4-digit staffId starting from 5551
    const agg = await User.aggregate([
      { $match: { role: 'staff', staffId: { $type: 'string' } } },
      { $addFields: { staffNum: { $toInt: '$staffId' } } },
      { $sort: { staffNum: -1 } },
      { $limit: 1 },
    ]);
    const currentMax = Array.isArray(agg) && agg.length > 0 && Number.isFinite(agg[0].staffNum) ? agg[0].staffNum : 5550;
    const nextIdNum = Math.max(5550, currentMax) + 1;
    const staffId = String(nextIdNum);

    const email = emailFromId(staffId, 'staff');
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Staff already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role: 'staff',
      staffId,
      email,
      passwordHash,
    });

    const token = signToken({ id: user.id });
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (e) {
    console.error('Register-staff error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/login { id, password, role }
router.post('/login', async (req, res) => {
  try {
    // TEMP DEBUG: log incoming headers and body
    console.log('[DEBUG] /auth/login headers:', req.headers);
    console.log('[DEBUG] /auth/login body:', req.body);
    const { id, password, role } = req.body || {};
    if (!id || !password || !role) {
      return res.status(400).json({ error: 'id, password, role required' });
    }

    const email = emailFromId(id, role);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id });
    return res.json({ token, user: user.toJSON() });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// GET /auth/me (requires Bearer token)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: user.toJSON() });
  } catch (e) {
    console.error('Me error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/change-password { currentPassword, newPassword }
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow all authenticated users to change passwords
    if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'student') {
      return res.status(403).json({ error: 'Invalid user role' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(req.user.id, { passwordHash: newPasswordHash });

    return res.json({ message: 'Password changed successfully' });
  } catch (e) {
    console.error('Change password error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/delete-reports { password } - DANGEROUS: Delete all reports (admin only)
router.post('/delete-reports', requireAuth, async (req, res) => {
  try {
    const { password } = req.body || {};
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Get current user and verify admin role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    console.log('🚨 REPORTS DELETION INITIATED by admin:', user.name, user.email);

    // Import Report model
    const Report = (await import('../models/Report.js')).default;
    
    // Count reports before deletion
    const reportCount = await Report.countDocuments();
    
    // Delete all reports
    const result = await Report.deleteMany({});
    
    console.log(`🗑️ Deleted ${result.deletedCount} reports`);
    console.log('💥 ALL REPORTS DELETED');

    return res.json({ 
      message: 'All reports deleted successfully',
      deletedCount: result.deletedCount,
      previousCount: reportCount
    });
  } catch (e) {
    console.error('Delete reports error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
