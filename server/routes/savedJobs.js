const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.use((req, res, next) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ message: 'Only seekers can save jobs' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('savedJobs')
      .populate({
        path: 'savedJobs',
        match: { status: 'active' },
        populate: { path: 'employerId', select: 'name' },
      });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.savedJobs.filter(Boolean));
  } catch (error) {
    console.error('GET /saved-jobs error:', error.message);
    res.status(500).json({ message: 'Failed to load saved jobs' });
  }
});

router.post('/:jobId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const job = await Job.findOne({ _id: req.params.jobId, status: 'active' }).select('_id');
    if (!job) return res.status(404).json({ message: 'Active job not found' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { savedJobs: job._id } },
      { new: true }
    ).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (error) {
    console.error('POST /saved-jobs/:jobId error:', error.message);
    res.status(500).json({ message: 'Failed to save job' });
  }
});

router.delete('/:jobId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { savedJobs: req.params.jobId } },
      { new: true }
    ).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (error) {
    console.error('DELETE /saved-jobs/:jobId error:', error.message);
    res.status(500).json({ message: 'Failed to remove saved job' });
  }
});

module.exports = router;
