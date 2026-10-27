const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');
const { buildMatchData, calculateMatch } = require('../utils/matcherHelper');
const upload = require('../middleware/upload'); // <--- ADDED THIS
const authenticate = require('../middleware/authenticate');
const requireApprovedEmployer = require('../middleware/requireApprovedEmployer');
const authorizeRoles = require('../middleware/authorizeRoles');

// 1. Apply to Job (Seeker) - WITH AI MATCHING
// <--- ADDED upload.single('coverLetter') BELOW
router.post('/apply/:jobId', authenticate, upload.single('coverLetter'), async (req, res) => {
  if (req.user.role !== 'seeker') return res.status(403).json({ message: 'Access denied' });
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // <--- ADDED THIS: Check if file was actually uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a cover letter document.' });
    }

    const existing = await Application.findOne({ jobId: req.params.jobId, seekerId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const seekerProfile = await Profile.findOne({ userId: req.user.id });

    const { seekerData, jobData } = buildMatchData(seekerProfile, job);
    const aiResult = await calculateMatch(seekerData, jobData);
    const matchScore = aiResult.match_score;
    const matchBreakdown = aiResult.breakdown || {};
    const matchExplanation = aiResult.explanation || '';

    const cvUrl = req.body.cvUrl || (seekerProfile && seekerProfile.cvUrl) || '';

    const application = new Application({
      jobId: req.params.jobId,
      seekerId: req.user.id,
      employerId: job.employerId,
      coverLetter: `${process.env.BASE_URL || 'http://localhost:5000'}/api/files/cover-letter/${req.file.filename}`,
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
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// 2. Update Status (Employer) - REAL TIME UPDATE
router.put('/status/:applicationId', authenticate, requireApprovedEmployer, authorizeRoles('employer'), async (req, res) => {
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
router.get('/job/:jobId/applicants', authenticate, requireApprovedEmployer, authorizeRoles('employer'), async (req, res) => {
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
router.get('/stats', authenticate, requireApprovedEmployer, authorizeRoles('employer'), async (req, res) => {
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
router.get('/employer/all', authenticate, requireApprovedEmployer, authorizeRoles('employer'), async (req, res) => {
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

    const { seekerData, jobData } = buildMatchData(seekerProfile, job);
    const aiResult = await calculateMatch(seekerData, jobData);
    res.json(aiResult);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
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

// 9. Employer Response Rate (Public)
router.get('/response-rate/:employerId', async (req, res) => {
  try {
    const total = await Application.countDocuments({ employerId: req.params.employerId });
    if (total === 0) return res.json({ rate: null, total: 0, responded: 0 });

    const responded = await Application.countDocuments({
      employerId: req.params.employerId,
      status: { $ne: 'pending' }
    });

    const rate = Math.round((responded / total) * 100);
    res.json({ rate, total, responded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. CV Score (Seeker) - scores profile readiness against a specific job
router.get('/cv-score/:jobId', authenticate, async (req, res) => {
  if (req.user.role !== 'seeker') return res.status(403).json({ message: 'Access denied' });
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found. Complete your profile first.' });

    const { seekerData, jobData } = buildMatchData(profile, job);
    const match = await calculateMatch(seekerData, jobData);
    const cvScore = profile.cvUrl ? 100 : 0;
    const signals = [
      ...match.signals,
      {
        key: 'cv',
        label: 'CV attached',
        score: cvScore,
        detail: profile.cvUrl
          ? 'A CV is saved on your profile'
          : 'No CV uploaded — add one to your profile before applying',
      },
    ];

    res.json({
      overall: match.match_score,
      breakdown: {
        ...match.breakdown,
        cv: cvScore,
      },
      signals,
      matchedSkills: match.matched_skills || [],
      missingSkills: match.missing_skills || [],
      hasCv: !!profile.cvUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

module.exports = router;