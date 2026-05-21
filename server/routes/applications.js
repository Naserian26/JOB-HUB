const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const { getIO } = require('../utils/socket');
const { calculateMatch } = require('../utils/matcherHelper');

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 1. Apply to Job (Seeker) - WITH AI MATCHING
router.post('/apply/:jobId', authenticate, async (req, res) => {
  if (req.user.role !== 'seeker') return res.status(403).json({ message: 'Access denied' });
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const existing = await Application.findOne({ jobId: req.params.jobId, seekerId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const seekerProfile = await Profile.findOne({ userId: req.user.id });

    const jobData = {
      title: job.title,
      description: job.description,
      required_skills: [],
      location: job.location,
      experienceLevel: job.experienceLevel,
      salary_min: 0,
      salary_max: job.salary
    };

    const seekerData = {
      skills: (seekerProfile && seekerProfile.skills) || [],
      experience: (seekerProfile && seekerProfile.experience) || 'Entry',
      location: (seekerProfile && seekerProfile.location) || 'Remote',
      salary_expectation: (seekerProfile && seekerProfile.salaryExpectation) || 0,
      bio: (seekerProfile && seekerProfile.bio) || 'Candidate'
    };

    const aiResult = await calculateMatch(seekerData, jobData);
    const matchScore = aiResult.match_score;
    const matchBreakdown = aiResult.breakdown || {};
    const matchExplanation = aiResult.explanation || '';

    const cvUrl = req.body.cvUrl || (seekerProfile && seekerProfile.cvUrl) || '';

    const application = new Application({
      jobId: req.params.jobId,
      seekerId: req.user.id,
      employerId: job.employerId,
      coverLetter: req.body.coverLetter,
      expectedSalary: req.body.expectedSalary,
      availability: req.body.availability,
      cvUrl,
      matchScore,
      matchBreakdown,
      matchExplanation,
    });

    await application.save();
    res.status(201).json({ ...application.toObject(), explanation: matchExplanation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Update Status (Employer) - REAL TIME UPDATE
router.put('/status/:applicationId', authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const application = await Application.findById(req.params.applicationId).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.employerId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    application.status = status;
    await application.save();

    const io = getIO();
    io.to(application.seekerId.toString()).emit('status_update', {
      applicationId: application._id,
      status,
      jobTitle: application.jobId.title
    });

    // Save persistent notification
    await Notification.create({
      userId: application.seekerId,
      message: `Your application status changed to ${status}`,
      jobTitle: application.jobId.title,
      status,
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get My Applications (Seeker)
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    const applications = await Application.find({ seekerId: req.user.id })
      .populate('jobId', 'title company salary status employerId');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Applicants for a Job (Employer)
router.get('/job/:jobId/applicants', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('seekerId', 'name email location')
      .populate('jobId', 'title')
      .sort('-matchScore');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Employer Stats for Dashboard
router.get('/stats', authenticate, async (req, res) => {
  try {
    const employerId = req.user.id;
    const applicants = await Application.countDocuments({ employerId });
    const interviewed = await Application.countDocuments({ employerId, status: 'interview' });
    const offers = await Application.countDocuments({ employerId, status: 'hired' });
    const activeJobs = await Job.countDocuments({ employerId, status: 'active' });
    res.json({ applicants, interviewed, offers, activeJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get ALL applicants across all employer jobs
router.get('/employer/all', authenticate, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ message: 'Access denied' });
  try {
    const applications = await Application.find({ employerId: req.user.id })
      .populate('seekerId', 'name email location')
      .populate('jobId', 'title location')
      .sort('-createdAt');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Match Preview (Seeker)
router.post('/match-preview', authenticate, async (req, res) => {
  if (req.user.role !== 'seeker') return res.status(403).json({ message: 'Access denied' });
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const seekerProfile = await Profile.findOne({ userId: req.user.id });

    const jobData = {
      title: job.title,
      description: job.description,
      required_skills: [],
      location: job.location,
      experienceLevel: job.experienceLevel,
      salary_min: 0,
      salary_max: job.salary
    };

    const seekerData = {
      skills: seekerProfile?.skills || [],
      experience: seekerProfile?.experience || 'Entry',
      location: seekerProfile?.location || 'Remote',
      salary_expectation: seekerProfile?.salaryExpectation || 0,
      bio: seekerProfile?.bio || ''
    };

    const aiResult = await calculateMatch(seekerData, jobData);
    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 8. Check if seeker already applied to a job
router.get('/check/:jobId', authenticate, async (req, res) => {
  if (req.user.role !== 'seeker') return res.status(403).json({ message: 'Access denied' });
  try {
    const application = await Application.findOne({
      jobId: req.params.jobId,
      seekerId: req.user.id,
    });

    if (!application) {
      return res.json({ applied: false, status: null, appliedAt: null });
    }

    return res.json({
      applied: true,
      status: application.status,
      appliedAt: application.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;