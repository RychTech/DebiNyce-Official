require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const artistRoutes = require('./routes/artists');
const friendRoutes = require('./routes/friends');
const collabRoutes = require('./routes/collab');
const adminRoutes = require('./routes/admin');
const { UPLOAD_DIR } = require('./config/upload');

// Initialize passport strategies
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'debinyce-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Static uploads ───────────────────────────────────────────
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/collab', collabRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DebiNyce API is running' });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 DebiNyce API running on port ${PORT}`);
  console.log(`📡 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
