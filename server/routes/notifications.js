const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate');

// GET /api/notifications — fetch all for logged in user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;