const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { getIO } = require('../utils/socket');

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const makeConversationId = (employerId, seekerId, applicationId) =>
  `${employerId}_${seekerId}_${applicationId}`;

// 1. Get messages for a conversation
router.get('/:applicationId/:seekerId', authenticate, async (req, res) => {
  try {
    const { applicationId, seekerId } = req.params;
    const employerId     = req.user.role === 'employer' ? req.user.id : seekerId;
    const actualSeekerId = req.user.role === 'seeker'   ? req.user.id : seekerId;

    const conversationId = makeConversationId(employerId, actualSeekerId, applicationId);

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    await Message.updateMany(
      { conversationId, receiverId: req.user.id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Send a message
router.post('/send', authenticate, async (req, res) => {
  const { applicationId, receiverId, seekerId, employerId, text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

  try {
    const conversationId = makeConversationId(employerId, seekerId, applicationId);

    const message = await Message.create({
      conversationId,
      senderId:      req.user.id,
      receiverId,
      applicationId,
      text:          text.trim(),
    });

    const io = getIO();
    io.to(receiverId.toString()).emit('new_message', { message, conversationId });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Unread message count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      read:       false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get all conversations for the logged-in user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get all messages involving this user, latest first
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .sort({ createdAt: -1 })
      .populate('senderId',   'name')
      .populate('receiverId', 'name');

    // Keep only the latest message per conversationId
    const convMap = {};
    for (const msg of messages) {
      if (!convMap[msg.conversationId]) {
        convMap[msg.conversationId] = msg;
      }
    }

    // Count unread per conversation
    const unreadAgg = await Message.aggregate([
      { $match: { receiverId: userId, read: false } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ]);
    const unreadMap = {};
    unreadAgg.forEach(u => { unreadMap[u._id] = u.count; });

    const result = Object.values(convMap).map(msg => {
      const parts         = msg.conversationId.split('_');
      const employerId    = parts[0];
      const seekerId      = parts[1];
      const applicationId = parts[2];
      const isEmployer    = req.user.role === 'employer';

      const sender   = msg.senderId;
      const receiver = msg.receiverId;

      const otherPerson = isEmployer
        ? (sender?._id?.toString() === seekerId   ? sender : receiver)
        : (sender?._id?.toString() === employerId ? sender : receiver);

      return {
        conversationId:  msg.conversationId,
        applicationId,
        seekerId,
        employerId,
        otherPersonId:   otherPerson?._id,
        otherPersonName: otherPerson?.name || 'Unknown',
        jobTitle:        '',
        lastMessage: {
          text:      msg.text,
          createdAt: msg.createdAt,
        },
        unreadCount: unreadMap[msg.conversationId] || 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;