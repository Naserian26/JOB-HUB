const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const jwt = require('jsonwebtoken');

// =====================
// AUTH MIDDLEWARE
// =====================
const authenticate = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// =====================
// CREATE JOB
// =====================
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can post jobs' });
    }

    const jobData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      experienceLevel: req.body.experienceLevel,
      salaryMin: Number(req.body.salaryMin),
      salaryMax: Number(req.body.salaryMax),
      employerId: new mongoose.Types.ObjectId(req.user.id),
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json(job);

  } catch (error) {
    console.error("JOB CREATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// GET ALL JOBS (public)
// =====================
router.get('/', async (req, res) => {
  try {
    const { category, sort } = req.query;

    let query = { status: 'active' };
    if (category) query.category = category;

    let sortOption = {};
    if (sort === 'salary') sortOption = { salaryMin: -1 };
    if (sort === 'date') sortOption = { createdAt: -1 };

    const jobs = await Job.find(query)
      .sort(sortOption)
      .populate('employerId', 'name');

    res.json(jobs);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// GET EMPLOYER'S OWN JOBS
// =====================
router.get('/employer', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await Job.find({ employerId: new mongoose.Types.ObjectId(req.user.id) })
      .sort({ createdAt: -1 });

    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const applicantsCount = await Application.countDocuments({ jobId: job._id });
        return { ...job.toObject(), applicantsCount };
      })
    );

    res.json(jobsWithCount);

  } catch (error) {
    console.error("EMPLOYER JOBS ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// GET SINGLE JOB
// =====================
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    const job = await Job.findById(req.params.id).populate('employerId', 'name');
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// UPDATE JOB
// =====================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// TOGGLE JOB STATUS
// =====================
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id), employerId: new mongoose.Types.ObjectId(req.user.id) },
      { status: req.body.status },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: 'Job not found' });

    res.json(job);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// DELETE JOB
// =====================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;