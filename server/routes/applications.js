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

    // --- 1. Skills score ---
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const seekerSkills = profile.skills || [];
    const matchedSkills = seekerSkills.filter(s => jobText.includes(s.toLowerCase()));
    const missingSkills = seekerSkills.filter(s => !jobText.includes(s.toLowerCase()));
    const skillsScore = seekerSkills.length
      ? Math.round((matchedSkills.length / seekerSkills.length) * 100)
      : 0;

    // --- 2. Experience score ---
    const expMap = { 'Entry': 1, 'Junior': 2, 'Mid': 3, 'Senior': 4, 'Lead': 5, 'Manager': 5 };
    const seekerExp = expMap[profile.experience] ?? 2;
    const jobExp    = expMap[job.experienceLevel]  ?? 2;
    const expScore  = seekerExp >= jobExp
      ? 100
      : Math.round((seekerExp / jobExp) * 100);

    // --- 3. Location score ---
    const isRemote = job.location?.toLowerCase().includes('remote');
    const locationMatch = profile.location?.toLowerCase() === job.location?.toLowerCase();
    const locationScore = (!job.location || isRemote || locationMatch) ? 100 : 50;

    // --- 4. Salary score ---
    let salaryScore = 100;
    if (profile.salaryExpectation && job.salaryMax) {
      if (profile.salaryExpectation <= job.salaryMax)            salaryScore = 100;
      else if (profile.salaryExpectation <= job.salaryMax * 1.15) salaryScore = 65;
      else                                                         salaryScore = 30;
    }

    // --- 5. CV completeness score ---
    const cvScore = profile.cvUrl ? 100 : 40;

    // --- Weighted overall ---
    const overall = Math.round(
      skillsScore   * 0.40 +
      expScore      * 0.25 +
      salaryScore   * 0.15 +
      locationScore * 0.10 +
      cvScore       * 0.10
    );

    // --- Human-readable signals ---
    const signals = [
      {
        key: 'skills',
        label: 'Skill match',
        score: skillsScore,
        detail: matchedSkills.length
          ? `${matchedSkills.length} of ${seekerSkills.length} skills match this role`
          : 'No skills on your profile match this role yet',
      },
      {
        key: 'experience',
        label: 'Experience level',
        score: expScore,
        detail: expScore === 100
          ? `Your experience meets the ${job.experienceLevel} requirement`
          : `Role needs ${job.experienceLevel} level — consider highlighting relevant projects`,
      },
      {
        key: 'salary',
        label: 'Salary alignment',
        score: salaryScore,
        detail: salaryScore === 100
          ? 'Your expectation is within the listed range'
          : salaryScore === 65
          ? 'Your expectation is slightly above range — still competitive'
          : 'Your expectation exceeds the range — may affect shortlisting',
      },
      {
        key: 'location',
        label: 'Location fit',
        score: locationScore,
        detail: locationScore === 100
          ? isRemote ? 'Remote role — no location conflict' : 'Location matches'
          : `Role is based in ${job.location} — your profile shows ${profile.location || 'no location'}`,
      },
      {
        key: 'cv',
        label: 'CV attached',
        score: cvScore,
        detail: profile.cvUrl
          ? 'CV is on your profile and will be sent with your application'
          : 'No CV uploaded — add one to your profile to boost your chances',
      },
    ];

    res.json({
      overall,
      breakdown: {
        skills:     skillsScore,
        experience: expScore,
        salary:     salaryScore,
        location:   locationScore,
        cv:         cvScore,
      },
      signals,
      matchedSkills,
      missingSkills,
      hasCv: !!profile.cvUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;