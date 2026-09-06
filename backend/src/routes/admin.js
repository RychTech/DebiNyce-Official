const express = require('express')
const router = express.Router()
const prisma = require('../config/db')
const { authenticate, requireRole } = require('../middleware/auth')

// ─── Get Admin Info ────────────────────────────────────────────
router.get('/me', authenticate, requireRole('ADMIN'), async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
    },
  })
})

// ─── Get All Songs (Admin) ────────────────────────────────────
router.get('/songs', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      include: {
        artist: {
          select: { id: true, artistProfile: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, songs })
  } catch (err) {
    console.error('Get songs error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch songs.' })
  }
})

// ─── Get All Users (Admin) ─────────────────────────────────────
router.get('/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        artistProfile: true,
        artistStatus: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            songs: true,
            playlists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      artistProfile: u.artistProfile,
      artistStatus: u.artistStatus,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      songCount: u._count.songs,
      playlistCount: u._count.playlists,
    }))

    res.json({ success: true, users: mapped })
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch users.' })
  }
})

// ─── Delete User (Admin) ───────────────────────────────────────
router.delete('/users/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    await prisma.user.delete({ where: { id: req.params.id } })

    res.json({
      success: true,
      message: `User \"${user.email}\" deleted.`,
    })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete user.' })
  }
})

// ─── Realtime Activity Series ─────────────────────────────────
function buildActivitySeries(events, range) {
  const hours = range === '24h' ? 24 : range === '7d' ? 7 * 24 : 30 * 24;
  const now = Date.now();
  const buckets = [];
  const labels = [];

  const isHourly = hours <= 24;
  const bucketSize = isHourly ? 3600 * 1000 : hours === 168 ? 24 * 3600 * 1000 : 24 * 3600 * 1000;
  const count = isHourly ? 24 : hours === 168 ? 7 : 30;

  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * bucketSize;
    const d = new Date(t);
    labels.push(
      isHourly
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    buckets.push({ PLAY: 0, STREAM: 0, LIKE: 0, SHARE: 0, SIGNUP: 0, ARTIST_SIGNUP: 0 });
  }

  for (const ev of events) {
    const age = now - new Date(ev.createdAt).getTime();
    const idx = count - 1 - Math.floor(age / bucketSize);
    if (idx >= 0 && idx < count && buckets[idx][ev.type] !== undefined) {
      buckets[idx][ev.type] += 1;
    }
  }

  return labels.map((label, i) => ({ label, ...buckets[i] }));
}

// ─── Admin Stats: Overview ────────────────────────────────────
router.get('/stats/overview', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, totalArtists, totalAdmins, totalSongs, publishedSongs, likes, shares, plays, streams] = await Promise.all([
      prisma.user.count({ where: { role: 'LISTENER' } }),
      prisma.user.count({ where: { role: 'ARTIST' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.song.count(),
      prisma.song.count({ where: { isPublished: true } }),
      prisma.song.aggregate({ _sum: { likes: true } }),
      prisma.song.aggregate({ _sum: { shares: true } }),
      prisma.song.aggregate({ _sum: { plays: true } }),
      prisma.song.aggregate({ _sum: { streams: true } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalArtists,
        totalAdmins,
        totalSongs,
        publishedSongs,
        totalLikes: likes._sum.likes || 0,
        totalShares: shares._sum.shares || 0,
        totalPlays: plays._sum.plays || 0,
        totalStreams: streams._sum.streams || 0,
      },
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─── Admin Stats: Activity Timeline ───────────────────────────
router.get('/stats/activity', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const events = await prisma.event.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, createdAt: true },
    });

    res.json({
      success: true,
      range,
      series: buildActivitySeries(events, range),
    });
  } catch (err) {
    console.error('Admin activity error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activity.' });
  }
});

// ─── Admin Stats: Top Songs by Metric ─────────────────────────
router.get('/stats/top', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const metric = req.query.metric || 'plays';
    const allowed = ['plays', 'streams', 'likes', 'shares'];
    const field = allowed.includes(metric) ? metric : 'plays';
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const songs = await prisma.song.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        albumArtUrl: true,
        plays: true,
        streams: true,
        likes: true,
        shares: true,
        artist: {
          select: { id: true, artistProfile: true, fullName: true },
        },
      },
      orderBy: { [field]: 'desc' },
      take: limit,
    });

    res.json({ success: true, metric: field, songs });
  } catch (err) {
    console.error('Admin top songs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch top songs.' });
  }
});

// ─── Admin Stats: Growth (new users/artists per bucket) ───────
router.get('/stats/growth', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const [users, artists] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'LISTENER', createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { role: 'ARTIST', createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const isHourly = hours <= 24;
    const bucketSize = isHourly ? 3600 * 1000 : 24 * 3600 * 1000;
    const count = isHourly ? 24 : hours === 168 ? 7 : 30;
    const now = Date.now();
    const labels = [];
    const userBuckets = [];
    const artistBuckets = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now - i * bucketSize);
      labels.push(
        isHourly
          ? `${String(d.getHours()).padStart(2, '0')}:00`
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
      userBuckets.push(0);
      artistBuckets.push(0);
    }

    for (const u of users) {
      const idx = count - 1 - Math.floor((now - new Date(u.createdAt).getTime()) / bucketSize);
      if (idx >= 0 && idx < count) userBuckets[idx] += 1;
    }
    for (const a of artists) {
      const idx = count - 1 - Math.floor((now - new Date(a.createdAt).getTime()) / bucketSize);
      if (idx >= 0 && idx < count) artistBuckets[idx] += 1;
    }

    res.json({
      success: true,
      range,
      series: labels.map((label, i) => ({
        label,
        users: userBuckets[i],
        artists: artistBuckets[i],
      })),
    });
  } catch (err) {
    console.error('Admin growth error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch growth.' });
  }
});

// ─── Admin Stats: Recent Activity Feed ────────────────────────
router.get('/stats/recent', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50)
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        song: {
          select: { id: true, title: true, albumArtUrl: true },
        },
        user: {
          select: { id: true, username: true, fullName: true, artistProfile: true },
        },
      },
    })

    const mapped = events.map((e) => ({
      id: e.id,
      type: e.type,
      createdAt: e.createdAt,
      metadata: e.metadata,
      songTitle: e.song?.title || null,
      songArt: e.song?.albumArtUrl || null,
      actor: e.user?.artistProfile || e.user?.username || e.user?.fullName || null,
    }))

    res.json({ success: true, events: mapped })
  } catch (err) {
    console.error('Recent activity error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity.' })
  }
})

// ─── Admin Stats: Top Artists by Total Plays ──────────────────
router.get('/stats/topartists', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20)
    const artists = await prisma.user.findMany({
      where: { role: 'ARTIST' },
      select: {
        id: true,
        artistProfile: true,
        fullName: true,
        photo: true,
        songs: {
          select: {
            plays: true,
            streams: true,
            likes: true,
            shares: true,
            isPublished: true,
          },
        },
      },
      take: 200,
    })

    const ranked = artists
      .map((a) => ({
        id: a.id,
        name: a.artistProfile || a.fullName || 'Unknown',
        photo: a.photo,
        plays: a.songs.reduce((s, x) => s + (x.isPublished ? x.plays : 0), 0),
        streams: a.songs.reduce((s, x) => s + (x.isPublished ? x.streams : 0), 0),
        likes: a.songs.reduce((s, x) => s + (x.isPublished ? x.likes : 0), 0),
        shares: a.songs.reduce((s, x) => s + (x.isPublished ? x.shares : 0), 0),
        songCount: a.songs.filter((x) => x.isPublished).length,
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit)

    res.json({ success: true, artists: ranked })
  } catch (err) {
    console.error('Top artists error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch top artists.' })
  }
})

module.exports = router
