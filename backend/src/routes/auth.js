const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── Generate JWT ─────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'debinyce-jwt-secret-2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── Register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, fullName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: username || undefined }],
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or username already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username: username || null,
        password: hashedPassword,
        fullName: fullName || (username || null),
        role: role === 'ARTIST' ? 'ARTIST' : 'LISTENER',
        isVerified: true,
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
});

// ─── Login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username or email and password are required.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: loginId }, { email: loginId }],
      },
    });
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = generateToken(user);

    // Mark first login as done
    await prisma.user.update({
      where: { id: user.id },
      data: { isFirstLogin: false },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        isFirstLogin: false,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
});

// ─── Logout ───────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// ─── Get Current User ─────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      artistProfile: req.user.artistProfile,
      nationality: req.user.nationality,
      phone: req.user.phone,
      photo: req.user.photo,
      isFirstLogin: req.user.isFirstLogin,
    },
  });
});

// ─── Google OAuth ─────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&role=${req.user.role}`);
  }
);

// ─── Facebook OAuth ───────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&role=${req.user.role}`);
  }
);

module.exports = router;
