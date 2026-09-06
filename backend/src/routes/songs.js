const express = require('express');
const prisma = require('../config/db');
const upload = require('../config/upload');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function publicUrl(absPath) {
  if (!absPath) return null;
  const rel = absPath.replace(/\\/g, '/').split('/uploads/')[1];
  return rel ? `/uploads/${rel}` : null;
}

async function recordEvent(type, userId, songId, metadata) {
  try {
    await prisma.event.create({
      data: {
        type,
        userId: userId || null,
        songId: songId || null,
        metadata: metadata || null,
      },
    });
  } catch (err) {
    console.error('Failed to record event:', err);
  }
}

// ─── Record Play ──────────────────────────────────────────────
router.post('/:id/play', optionalAuth, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    await prisma.song.update({
      where: { id: song.id },
      data: { plays: { increment: 1 } },
    });
    await recordEvent('PLAY', req.user?.id, song.id);
    res.json({ success: true, plays: song.plays + 1 });
  } catch (err) {
    console.error('Record play error:', err);
    res.status(500).json({ success: false, message: 'Failed to record play.' });
  }
});

// ─── Record Stream (actual playback reached audio) ─────────────
router.post('/:id/stream', optionalAuth, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    await prisma.song.update({
      where: { id: song.id },
      data: { streams: { increment: 1 } },
    });
    await recordEvent('STREAM', req.user?.id, song.id);
    res.json({ success: true, streams: song.streams + 1 });
  } catch (err) {
    console.error('Record stream error:', err);
    res.status(500).json({ success: false, message: 'Failed to record stream.' });
  }
});

// ─── Toggle Like ──────────────────────────────────────────────
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    const updated = await prisma.song.update({
      where: { id: song.id },
      data: { likes: { increment: 1 } },
    });
    await recordEvent('LIKE', req.user?.id, song.id);
    res.json({ success: true, likes: updated.likes });
  } catch (err) {
    console.error('Like song error:', err);
    res.status(500).json({ success: false, message: 'Failed to like song.' });
  }
});

// ─── Unlike ───────────────────────────────────────────────────
router.delete('/:id/like', optionalAuth, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    const updated = await prisma.song.update({
      where: { id: song.id },
      data: { likes: { decrement: 1 } },
    });
    await recordEvent('UNLIKE', req.user?.id, song.id);
    res.json({ success: true, likes: Math.max(0, updated.likes) });
  } catch (err) {
    console.error('Unlike song error:', err);
    res.status(500).json({ success: false, message: 'Failed to unlike song.' });
  }
});

// ─── Record Share ─────────────────────────────────────────────
router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    const updated = await prisma.song.update({
      where: { id: song.id },
      data: { shares: { increment: 1 } },
    });
    await recordEvent('SHARE', req.user?.id, song.id);
    res.json({ success: true, shares: updated.shares });
  } catch (err) {
    console.error('Share song error:', err);
    res.status(500).json({ success: false, message: 'Failed to record share.' });
  }
});

// ─── Create Song (Artist only) ────────────────────────────────
router.post('/', authenticate, requireRole('ARTIST', 'ADMIN'), upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'albumArt', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, duration, genre, lyricVideoId } = req.body;
    const lyrics = typeof req.body.lyrics === 'string' ? JSON.parse(req.body.lyrics) : req.body.lyrics;
    const files = req.files || {};

    const audioFile = files.audio && files.audio[0];
    const artFile = files.albumArt && files.albumArt[0];
    const bgFile = files.background && files.background[0];

    const audioUrl = publicUrl(audioFile && audioFile.path) || (req.body.audioUrl || null);

    if (!title || !audioUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and audio file are required.',
      });
    }

    const song = await prisma.song.create({
      data: {
        title,
        artistId: req.user.id,
        audioUrl,
        albumArtUrl: publicUrl(artFile && artFile.path) || (req.body.albumArtUrl || null),
        backgroundUrl: publicUrl(bgFile && bgFile.path) || (req.body.backgroundUrl || null),
        duration: Number(duration) || 0,
        genre: genre || null,
        lyricVideoId: lyricVideoId || null,
        isPublished: false,
        lyrics: lyrics ? {
          create: lyrics.map((l, i) => ({
            lyricText: l.text,
            timestamp: l.timestamp, // milliseconds
            font: l.font || null,
            order: i,
          })),
        } : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Song created. It will be reviewed before publishing.',
      song: {
        id: song.id,
        title: song.title,
        duration: song.duration,
        audioUrl: song.audioUrl,
        albumArtUrl: song.albumArtUrl,
        isPublished: song.isPublished,
      },
    });
  } catch (err) {
    console.error('Create song error:', err);
    res.status(500).json({ success: false, message: 'Failed to create song.' });
  }
});

// ─── Trending Songs (public) ──────────────────────────────────
router.get('/trending', async (req, res) => {
  try {
    const metric = req.query.metric || 'plays';
    const allowed = ['plays', 'streams', 'likes', 'shares'];
    const field = allowed.includes(metric) ? metric : 'plays';
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

    const songs = await prisma.song.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        audioUrl: true,
        albumArtUrl: true,
        duration: true,
        genre: true,
        plays: true,
        streams: true,
        likes: true,
        shares: true,
        artist: {
          select: { id: true, artistProfile: true, fullName: true, photo: true },
        },
      },
      orderBy: { [field]: 'desc' },
      take: limit,
    });

    res.json({ success: true, metric: field, songs });
  } catch (err) {
    console.error('Trending songs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trending songs.' });
  }
});

// ─── Get All Published Songs ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      where: { isPublished: true },
      include: {
        artist: {
          select: { id: true, fullName: true, artistProfile: true, photo: true },
        },
        lyrics: {
          orderBy: { timestamp: 'asc' },
        },
        lyricVideo: {
          select: { id: true, videoUrl: true, thumbnailUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, songs });
  } catch (err) {
    console.error('Get songs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch songs.' });
  }
});

// ─── Get Single Song ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: {
        artist: {
          select: { id: true, fullName: true, artistProfile: true, photo: true },
        },
        lyrics: {
          orderBy: { timestamp: 'asc' },
        },
        lyricVideo: {
          select: { id: true, videoUrl: true, thumbnailUrl: true },
        },
      },
    });

    if (!song || !song.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Song not found.',
      });
    }

    res.json({ success: true, song });
  } catch (err) {
    console.error('Get song error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch song.' });
  }
});

// ─── Update Song (Artist or Admin) ────────────────────────────
router.put('/:id', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }

    // Only the artist who uploaded it or an admin can update
    if (song.artistId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not own this song.',
      });
    }

    const { title, albumArtUrl, backgroundUrl, duration, genre, isPublished } = req.body;

    const updated = await prisma.song.update({
      where: { id: req.params.id },
      data: {
        title: title || undefined,
        albumArtUrl: albumArtUrl || undefined,
        backgroundUrl: backgroundUrl || undefined,
        duration: duration ?? undefined,
        genre: genre || undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Song updated.',
      song: {
        id: updated.id,
        title: updated.title,
        isPublished: updated.isPublished,
      },
    });
  } catch (err) {
    console.error('Update song error:', err);
    res.status(500).json({ success: false, message: 'Failed to update song.' });
  }
});

// ─── Publish/Unpublish Song (Artist or Admin) ─────────────────
router.put('/:id/publish', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } })
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' })
    }

    if (song.artistId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You do not own this song.' })
    }

    const updated = await prisma.song.update({
      where: { id: req.params.id },
      data: { isPublished: !song.isPublished },
    })

    res.json({
      success: true,
      message: updated.isPublished
        ? 'Song published and is now available to listeners.'
        : 'Song unpublished. It is no longer visible to listeners.',
      song: {
        id: updated.id,
        title: updated.title,
        isPublished: updated.isPublished,
      },
    })
  } catch (err) {
    console.error('Publish song error:', err)
    res.status(500).json({ success: false, message: 'Failed to update song.' })
  }
})

// ─── Delete Song (Artist or Admin) ────────────────────────────
router.delete('/:id', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const song = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }

    if (song.artistId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not own this song.',
      });
    }

    await prisma.song.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Song deleted.',
    });
  } catch (err) {
    console.error('Delete song error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete song.' });
  }
});

module.exports = router;
