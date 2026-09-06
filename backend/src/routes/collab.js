const express = require('express')
const prisma = require('../config/db')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

// ─── Send Collaboration Request (after accepted friend) ───
router.post('/request', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { receiverId, message } = req.body

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required.' })
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot send a collab request to yourself.' })
    }

    // Check target is an approved artist
    const target = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!target || target.role !== 'ARTIST' || target.artistStatus !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'User is not an approved artist.' })
    }

    // Check they are friends (accepted friend request exists both ways)
    const friendship = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: req.user.id, receiverId },
          { senderId: receiverId, receiverId: req.user.id },
        ],
      },
    })

    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'You can only send collaboration requests to artists who are your friends.',
      })
    }

    // Check no existing pending collab
    const existing = await prisma.collabRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.id, receiverId },
          { senderId: receiverId, receiverId: req.user.id },
        ],
        status: 'PENDING',
      },
    })

    if (existing) {
      return res.status(409).json({ success: false, message: 'A collaboration request already exists.' })
    }

    const collabRequest = await prisma.collabRequest.create({
      data: {
        senderId: req.user.id,
        receiverId,
        message: message || null,
        status: 'PENDING',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Collaboration request sent.',
      request: { id: collabRequest.id, receiverId: collabRequest.receiverId },
    })
  } catch (err) {
    console.error('Send collab request error:', err)
    res.status(500).json({ success: false, message: 'Failed to send collaboration request.' })
  }
})

// ─── Get Collaboration Requests (for current user) ───
router.get('/requests', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const requests = await prisma.collabRequest.findMany({
      where: { receiverId: req.user.id, status: 'PENDING' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            artistProfile: true,
            photo: true,
            nationality: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = requests.map((r) => ({
      id: r.id,
      sender: {
        id: r.sender.id,
        fullName: r.sender.fullName,
        artistProfile: r.sender.artistProfile,
        photo: r.sender.photo,
        nationality: r.sender.nationality,
        phone: r.sender.phone,
        email: r.sender.email,
      },
      message: r.message,
      createdAt: r.createdAt,
    }))

    res.json({ success: true, requests: mapped })
  } catch (err) {
    console.error('Get collab requests error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch collaboration requests.' })
  }
})

// ─── Accept Collaboration Request ───
// On accept, both artists' bio and contact info are shared.
// Returns the other artist's contact info so they can message externally.
router.put('/accept', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' })
    }

    const collabRequest = await prisma.collabRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true },
    })

    if (!collabRequest) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found.' })
    }

    if (collabRequest.receiverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot accept this request.' })
    }

    if (collabRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been processed.' })
    }

    await prisma.collabRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    })

    // Determine the other artist (the sender)
    const otherArtist = collabRequest.sender
    const currentUser = collabRequest.receiver

    res.json({
      success: true,
      message: 'Collaboration accepted. Contact info shared.',
      sharedInfo: {
        // The other artist's info — available for direct external contact
        fullName: otherArtist.fullName,
        artistProfile: otherArtist.artistProfile,
        email: otherArtist.email,
        phone: otherArtist.phone,
        nationality: otherArtist.nationality,
        photo: otherArtist.photo,
        // Your info (the receiver) — shared with them
        yourInfo: {
          fullName: currentUser.fullName,
          artistProfile: currentUser.artistProfile,
          email: currentUser.email,
          phone: currentUser.phone,
          nationality: currentUser.nationality,
          photo: currentUser.photo,
        },
      },
    })
  } catch (err) {
    console.error('Accept collab request error:', err)
    res.status(500).json({ success: false, message: 'Failed to accept collaboration request.' })
  }
})

// ─── Reject Collaboration Request ───
router.put('/reject', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' })
    }

    const collabRequest = await prisma.collabRequest.findUnique({
      where: { id: requestId },
    })

    if (!collabRequest) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found.' })
    }

    if (collabRequest.receiverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot reject this request.' })
    }

    await prisma.collabRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    })

    res.json({ success: true, message: 'Collaboration request rejected.' })
  } catch (err) {
    console.error('Reject collab request error:', err)
    res.status(500).json({ success: false, message: 'Failed to reject collaboration request.' })
  }
})

module.exports = router
