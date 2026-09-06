const express = require('express')
const prisma = require('../config/db')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

// ─── Send Friend Request (Artist to Artist) ───
router.post('/request', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { receiverId } = req.body

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required.' })
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself.' })
    }

    // Check target is an approved artist
    const target = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!target || target.role !== 'ARTIST' || target.artistStatus !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'User is not an approved artist.' })
    }

    // Check no existing pending request
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user.id, receiverId },
          { senderId: receiverId, receiverId: req.user.id },
        ],
        status: 'PENDING',
      },
    })

    if (existing) {
      return res.status(409).json({ success: false, message: 'A friend request already exists between you.' })
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: req.user.id,
        receiverId,
        status: 'PENDING',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Friend request sent.',
      request: { id: friendRequest.id, receiverId: friendRequest.receiverId },
    })
  } catch (err) {
    console.error('Send friend request error:', err)
    res.status(500).json({ success: false, message: 'Failed to send friend request.' })
  }
})

// ─── Get Friend Requests (for current user) ───
router.get('/requests', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: req.user.id, status: 'PENDING' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            artistProfile: true,
            photo: true,
            nationality: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, requests })
  } catch (err) {
    console.error('Get friend requests error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch friend requests.' })
  }
})

// ─── Accept Friend Request ───
router.put('/accept', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' })
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true },
    })

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' })
    }

    if (friendRequest.receiverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot accept this request.' })
    }

    if (friendRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been processed.' })
    }

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
    ])

    res.json({
      success: true,
      message: 'Friend request accepted. You can now send collaboration requests.',
    })
  } catch (err) {
    console.error('Accept friend request error:', err)
    res.status(500).json({ success: false, message: 'Failed to accept friend request.' })
  }
})

// ─── Reject Friend Request ───
router.put('/reject', authenticate, requireRole('ARTIST', 'ADMIN'), async (req, res) => {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required.' })
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' })
    }

    if (friendRequest.receiverId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot reject this request.' })
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    })

    res.json({ success: true, message: 'Friend request rejected.' })
  } catch (err) {
    console.error('Reject friend request error:', err)
    res.status(500).json({ success: false, message: 'Failed to reject friend request.' })
  }
})

module.exports = router
