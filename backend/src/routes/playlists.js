const express = require('express');
const prisma = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── Create Playlist ──────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required.',
      });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        userId: req.user.id,
        isPublic: isPublic !== false, // default public
      },
    });

    res.status(201).json({
      success: true,
      message: 'Playlist created.',
      playlist: {
        id: playlist.id,
        name: playlist.name,
        isPublic: playlist.isPublic,
        invitationCode: playlist.invitationCode,
        songCount: 0,
      },
    });
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to create playlist.' });
  }
});

// ─── Get User's Playlists ─────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      include: {
        songs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                audioUrl: true,
                albumArtUrl: true,
                duration: true,
                artist: {
                  select: { artistProfile: true, fullName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      isPublic: p.isPublic,
      invitationCode: p.invitationCode,
      songCount: p.songs.length,
      songs: p.songs.map((ps) => ps.song),
      createdAt: p.createdAt,
    }));

    res.json({ success: true, playlists: result });
  } catch (err) {
    console.error('Get playlists error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch playlists.' });
  }
});

// ─── Get Public Playlists ─────────────────────────────────────
router.get('/public', async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { fullName: true, artistProfile: true, photo: true },
        },
        songs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                audioUrl: true,
                albumArtUrl: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      invitationCode: p.invitationCode,
      songCount: p.songs.length,
      creator: p.user,
      songs: p.songs.map((ps) => ps.song),
      createdAt: p.createdAt,
    }));

    res.json({ success: true, playlists: result });
  } catch (err) {
    console.error('Get public playlists error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch public playlists.' });
  }
});

// ─── Get Playlist by Code/Link ────────────────────────────────
router.get('/invite/:code', optionalAuth, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { invitationCode: req.params.code },
      include: {
        songs: {
          include: {
            song: {
              select: {
                id: true,
                title: true,
                audioUrl: true,
                albumArtUrl: true,
                duration: true,
                artist: {
                  select: { artistProfile: true, fullName: true },
                },
              },
            },
          },
        },
        user: {
          select: { fullName: true, artistProfile: true, photo: true, id: true },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found.',
      });
    }

    if (!playlist.isPublic && playlist.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'This playlist is private.',
      });
    }

    const result = {
      id: playlist.id,
      name: playlist.name,
      isPublic: playlist.isPublic,
      invitationCode: playlist.invitationCode,
      songCount: playlist.songs.length,
      creator: playlist.user,
      songs: playlist.songs.map((ps) => ps.song),
      joined: playlist.userId === req.user?.id,
      createdAt: playlist.createdAt,
    };

    res.json({ success: true, playlist: result });
  } catch (err) {
    console.error('Get playlist by code error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch playlist.' });
  }
});

// ─── Join Playlist via Invitation ─────────────────────────────
router.post('/join', authenticate, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required.',
      });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { invitationCode: code },
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation code.',
      });
    }

    if (!playlist.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This playlist is private.',
      });
    }

    // In a real app, you'd add the user to a "joined" list.
    // For now, we confirm the code is valid.
    res.json({
      success: true,
      message: 'Invitation code accepted. You can now view this playlist.',
      playlist: {
        id: playlist.id,
        name: playlist.name,
        invitationCode: playlist.invitationCode,
      },
    });
  } catch (err) {
    console.error('Join playlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to join playlist.' });
  }
});

// ─── Update Playlist ──────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    if (playlist.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this playlist.',
      });
    }

    const { name, isPublic } = req.body;

    const updated = await prisma.playlist.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Playlist updated.',
      playlist: {
        id: updated.id,
        name: updated.name,
        isPublic: updated.isPublic,
        invitationCode: updated.invitationCode,
      },
    });
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to update playlist.' });
  }
});

// ─── Delete Playlist ──────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found.' });
    }

    if (playlist.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this playlist.',
      });
    }

    await prisma.playlist.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Playlist deleted.',
    });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete playlist.' });
  }
});

module.exports = router;
