const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const mongoose = require('mongoose');

router.use(authenticate, requireAdmin);

router.get('/employer-applications', async (req, res) => {
  try {
    const applications = await User.find({
      role: 'employer',
      employerApprovalStatus: 'pending',
    }).select('name email companyName companyWebsite createdAt').sort('createdAt');
    res.json(applications);
  } catch (error) {
    console.error('GET /admin/employer-applications error:', error.message);
    res.status(500).json({ message: 'Failed to load employer applications' });
  }
});

router.patch('/employer-applications/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid employer application ID' });
  }
  const { decision, reviewNote = '' } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be approved or rejected' });
  }
  if (typeof reviewNote !== 'string' || reviewNote.length > 500) {
    return res.status(400).json({ message: 'Review note must be 500 characters or fewer' });
  }

  try {
    const employer = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: 'employer',
        employerApprovalStatus: 'pending',
      },
      {
        employerApprovalStatus: decision,
        employerReviewNote: reviewNote.trim(),
        employerReviewedAt: new Date(),
      },
      { new: true }
    ).select('name email companyName companyWebsite employerApprovalStatus employerReviewNote employerReviewedAt');

    if (!employer) return res.status(404).json({ message: 'Pending employer application not found' });
    res.json(employer);
  } catch (error) {
    console.error('PATCH /admin/employer-applications/:id error:', error.message);
    res.status(500).json({ message: 'Failed to review employer application' });
  }
});

module.exports = router;
