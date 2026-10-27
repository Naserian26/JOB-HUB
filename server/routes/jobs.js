const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const authenticate = require('../middleware/authenticate');
const requireApprovedEmployer = require('../middleware/requireApprovedEmployer');
const { sendJobAlerts } = require('../utils/smsAlerts');

const normalizeSkills = (skills) => {
  if (skills === undefined) return [];
  if (!Array.isArray(skills)) throw new Error('Skills must be provided as a list');
  const seen = new Set();
  const normalized = skills.map(skill => {
    if (typeof skill !== 'string') throw new Error('Each skill must be text');
    return skill.trim();
  }).filter(skill => {
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (normalized.some(skill => skill.length > 60)) {
    throw new Error('Each skill must be 60 characters or fewer');
  }
  if (normalized.length > 30) {
    throw new Error('You can add up to 30 skills per list');
  }
  return normalized;
};

// =====================
// CREATE JOB
// =====================
router.post('/', authenticate, requireApprovedEmployer, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can post jobs' });
    }

    let requiredSkills;
    let preferredSkills;
    try {
      requiredSkills = normalizeSkills(req.body.requiredSkills);
      preferredSkills = normalizeSkills(req.body.preferredSkills);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const jobData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      experienceLevel: req.body.experienceLevel,
      salaryMin: Number(req.body.salaryMin),
      salaryMax: Number(req.body.salaryMax),
      requiredSkills,
      preferredSkills,
      employerId: new mongoose.Types.ObjectId(req.user.id),
    };

    const job = new Job(jobData);
    await job.save();

    sendJobAlerts(job).catch(error => {
      console.error(`Failed to process SMS alerts for job ${job._id}:`, error.message);
    });

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
router.get('/employer', authenticate, requireApprovedEmployer, async (req, res) => {
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
router.put('/:id', authenticate, requireApprovedEmployer, async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'category', 'location', 'experienceLevel', 'salaryMin', 'salaryMax'];
    const updates = Object.fromEntries(
      allowedFields
        .filter(field => req.body[field] !== undefined)
        .map(field => [field, req.body[field]])
    );
    try {
      for (const field of ['requiredSkills', 'preferredSkills']) {
        if (req.body[field] !== undefined) updates[field] = normalizeSkills(req.body[field]);
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// TOGGLE JOB STATUS
// =====================
router.patch('/:id/status', authenticate, requireApprovedEmployer, async (req, res) => {
  try {
    if (!['active', 'inactive', 'closed'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid job status' });
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
router.delete('/:id', authenticate, requireApprovedEmployer, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, employerId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;