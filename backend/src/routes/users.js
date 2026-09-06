const express = require('express');
const prisma = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Get Profile ──────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        artistProfile: true,
        nationality: true,
        phone: true,
        photo: true,
        isVerified: true,
        artistStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Failed to get user.' });
  }
});

// ─── Update Profile ───────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Users can only update their own profile
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile.',
      });
    }

    const { fullName, phone, photo, nationality } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        photo: photo || undefined,
        nationality: nationality || undefined,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated.',
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        photo: user.photo,
        nationality: user.nationality,
      },
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ─── Delete Account ───────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account.',
      });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Account deleted.',
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
});

module.exports = router;
