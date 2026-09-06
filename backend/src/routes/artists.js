const express = require('express')
const prisma = require('../config/db')
const upload = require('../config/upload')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

function publicUrl(absPath) {
  if (!absPath) return null
  const rel = absPath.replace(/\\/g, '/').split('/uploads/')[1]
  return rel ? `/uploads/${rel}` : null
}

// ─── Artist Verification Submission (any authenticated user can submit) ───
router.post('/signup', authenticate, upload.fields([
  { name: 'selfPhotoDoc', maxCount: 1 },
  { name: 'nationalIdDoc', maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      fullName,
      artistProfile,
      nationality,
      phone,
    } = req.body

    if (!fullName || !artistProfile || !nationality || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name, artist profile name, nationality, and phone are required.',
      })
    }

    const files = req.files || {}
    const selfPhotoDoc = files.selfPhotoDoc && files.selfPhotoDoc[0]
    const nationalIdDoc = files.nationalIdDoc && files.nationalIdDoc[0]

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        artistProfile,
        nationality,
        phone,
        selfPhotoDoc: publicUrl(selfPhotoDoc && selfPhotoDoc.path) || (req.body.selfPhotoDoc || null),
        nationalIdDoc: publicUrl(nationalIdDoc && nationalIdDoc.path) || (req.body.nationalIdDoc || null),
        role: 'ARTIST',
        artistStatus: 'PENDING',
      },
    })

    res.json({
      success: true,
      message: 'Artist verification submitted. Awaiting admin approval.',
      user: {
        id: user.id,
        role: user.role,
        artistProfile: user.artistProfile,
        artistStatus: user.artistStatus,
      },
    })
  } catch (err) {
    console.error('Artist signup error:', err)
    res.status(500).json({ success: false, message: 'Failed to submit artist verification.' })
  }
})

// ─── Get Pending Artist Requests (Admin only) ───
router.get('/pending', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { artistStatus: 'PENDING', role: 'ARTIST' },
      select: {
        id: true,
        fullName: true,
        artistProfile: true,
        nationality: true,
        phone: true,
        email: true,
        photo: true,
        selfPhotoDoc: true,
        nationalIdDoc: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ success: true, artists: pending })
  } catch (err) {
    console.error('Get pending artists error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch pending artists.' })
  }
})

// ─── Get Approved Artists (public) ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const artists = await prisma.user.findMany({
      where: { role: 'ARTIST', artistStatus: 'APPROVED' },
      select: {
        id: true,
        artistProfile: true,
        nationality: true,
        photo: true,
        createdAt: true,
        songs: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const mapped = artists
      .map((a) => ({ ...a, songCount: a.songs.length, songs: undefined }))
      .sort((a, b) => b.songCount - a.songCount)

    res.json({ success: true, artists: mapped })
  } catch (err) {
    console.error('Get artists error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch artists.' })
  }
})

// ─── Get Artist Profile (public) ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const artist = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        artistProfile: true,
        nationality: true,
        photo: true,
        role: true,
        artistStatus: true,
        createdAt: true,
        songs: {
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
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!artist || artist.role !== 'ARTIST' || artist.artistStatus !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'Artist not found.' })
    }

    res.json({
      success: true,
      artist: { ...artist, songCount: artist.songs.length },
    })
  } catch (err) {
    console.error('Get artist error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch artist.' })
  }
})

// ─── Approve Artist (Admin only) ───
router.put('/:id/approve', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Artist not found.' })
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { artistStatus: 'APPROVED' },
    })

    await prisma.event.create({
      data: { type: 'ARTIST_APPROVED', userId: req.user.id, metadata: updated.artistProfile || updated.fullName || null },
    })

    res.json({
      success: true,
      message: `Artist "${updated.artistProfile || updated.fullName}" approved.`,
      artist: { id: updated.id, artistStatus: updated.artistStatus },
    })
  } catch (err) {
    console.error('Approve artist error:', err)
    res.status(500).json({ success: false, message: 'Failed to approve artist.' })
  }
})

// ─── Reject Artist (Admin only) ───
router.put('/:id/reject', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Artist not found.' })
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { artistStatus: 'REJECTED' },
    })

    await prisma.event.create({
      data: { type: 'ARTIST_REJECTED', userId: req.user.id, metadata: updated.artistProfile || updated.fullName || null },
    })

    res.json({
      success: true,
      message: `Artist "${updated.artistProfile || updated.fullName}" rejected.`,
      artist: { id: updated.id, artistStatus: updated.artistStatus },
    })
  } catch (err) {
    console.error('Reject artist error:', err)
    res.status(500).json({ success: false, message: 'Failed to reject artist.' })
  }
})

module.exports = router