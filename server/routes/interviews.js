const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const { sendInterviewInviteEmail, sendInterviewCancelledEmail } = require('../utils/emailService');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sendInterviewMessage = async (io, recipientId, payload) => {
  if (io) {
    io.to(recipientId.toString()).emit('notification', payload);
  }
};

// ─── POST /api/interviews ─────────────────────────────────────────────────────
router.post('/', authenticate, authorizeRoles('employer'), async (req, res) => {
  try {
    const { applicationId, proposedSlots, location, meetingLink, notes } = req.body;

    if (!applicationId || !proposedSlots?.length) {
      return res.status(400).json({ message: 'applicationId and proposedSlots are required.' });
    }

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('seekerId');

    if (!application) return res.status(404).json({ message: 'Application not found.' });

    if (application.jobId.employerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }

    const existing = await Interview.findOne({
      application: applicationId,
      status: { $in: ['proposed', 'confirmed'] },
    });
    if (existing) {
      return res.status(409).json({
        message: 'An active interview already exists for this application.',
        interviewId: existing._id,
      });
    }

    const interview = await Interview.create({
      application: applicationId,
      job: application.jobId._id,
      employer: req.user.id,
      candidate: application.seekerId._id,
      proposedSlots,
      location: location || '',
      meetingLink: meetingLink || '',
      notes: notes || '',
      status: 'proposed',
    });

    application.status = 'interview';
    await application.save();

    // Socket.io notification
    const io = req.app.get('io');
    await sendInterviewMessage(io, application.seekerId._id, {
      type: 'interview_proposed',
      message: `You have been invited to interview for ${application.jobId.title}. Please confirm a time slot.`,
      interviewId: interview._id,
    });

    // Email notification — fire and forget, don't block the response
    sendInterviewInviteEmail({
      candidateEmail: application.seekerId.email,
      candidateName: application.seekerId.name,
      jobTitle: application.jobId.title,
      companyName: application.jobId.company || '',
      slots: proposedSlots,
      location: location || '',
      meetingLink: meetingLink || '',
      notes: notes || '',
    }).catch(err => console.error('Email error:', err));

    const populated = await interview.populate([
      { path: 'candidate', select: 'name email' },
      { path: 'employer', select: 'name email' },
      { path: 'job', select: 'title' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /interviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/interviews ──────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const isEmployer = req.user.role === 'employer';

    const filter = isEmployer
      ? { employer: req.user.id }
      : { candidate: req.user.id };

    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .populate('candidate', 'name email profilePhoto')
      .populate('employer', 'name email')
      .populate('job', 'title')
      .populate('application', 'status')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('GET /interviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/interviews/:id ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email profilePhoto')
      .populate('employer', 'name email')
      .populate('job', 'title location')
      .populate('application');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });

    const userId = req.user.id.toString();
    const isParty =
      interview.employer._id.toString() === userId ||
      interview.candidate._id.toString() === userId;

    if (!isParty) return res.status(403).json({ message: 'Not authorised.' });

    res.json(interview);
  } catch (err) {
    console.error('GET /interviews/:id error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/interviews/:id/confirm ───────────────────────────────────────
router.patch('/:id/confirm', authenticate, authorizeRoles('seeker'), async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ message: 'slotId is required.' });

    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('employer', 'name email')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.candidate._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    if (interview.status !== 'proposed' && interview.status !== 'rescheduled') {
      return res.status(409).json({ message: `Interview is already ${interview.status}.` });
    }

    const slot = interview.proposedSlots.id(slotId);
    if (!slot) return res.status(400).json({ message: 'Slot not found in this interview.' });

    interview.confirmedSlot = slot;
    interview.status = 'confirmed';
    await interview.save();

    const io = req.app.get('io');
    await sendInterviewMessage(io, interview.employer._id, {
      type: 'interview_confirmed',
      message: `${interview.candidate.name} confirmed their interview for ${interview.job.title} on ${slot.date} at ${slot.startTime}.`,
      interviewId: interview._id,
    });

    res.json(interview);
  } catch (err) {
    console.error('PATCH /interviews/:id/confirm error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/interviews/:id/cancel ────────────────────────────────────────
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('employer', 'name email')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });

    const userId = req.user.id.toString();
    const isParty =
      interview.employer._id.toString() === userId ||
      interview.candidate._id.toString() === userId;

    if (!isParty) return res.status(403).json({ message: 'Not authorised.' });
    if (['completed', 'cancelled'].includes(interview.status)) {
      return res.status(409).json({ message: `Cannot cancel a ${interview.status} interview.` });
    }

    interview.status = 'cancelled';
    interview.cancelledBy = req.user.id;
    interview.cancelReason = req.body.reason || '';
    await interview.save();

    const notifyId =
      userId === interview.employer._id.toString()
        ? interview.candidate._id
        : interview.employer._id;

    const io = req.app.get('io');
    await sendInterviewMessage(io, notifyId, {
      type: 'interview_cancelled',
      message: `The interview for ${interview.job.title} has been cancelled.`,
      interviewId: interview._id,
      reason: interview.cancelReason,
    });

    // Email the candidate if employer cancelled
    if (userId === interview.employer._id.toString()) {
      sendInterviewCancelledEmail({
        candidateEmail: interview.candidate.email,
        candidateName: interview.candidate.name,
        jobTitle: interview.job.title,
        reason: interview.cancelReason,
      }).catch(err => console.error('Email error:', err));
    }

    res.json(interview);
  } catch (err) {
    console.error('PATCH /interviews/:id/cancel error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/interviews/:id/reschedule ────────────────────────────────────
router.patch('/:id/reschedule', authenticate, authorizeRoles('employer'), async (req, res) => {
  try {
    const { proposedSlots, notes } = req.body;
    if (!proposedSlots?.length) {
      return res.status(400).json({ message: 'proposedSlots are required.' });
    }

    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.employer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    if (interview.status === 'completed') {
      return res.status(409).json({ message: 'Cannot reschedule a completed interview.' });
    }

    interview.proposedSlots = proposedSlots;
    interview.confirmedSlot = null;
    interview.status = 'rescheduled';
    if (notes) interview.notes = notes;
    await interview.save();

    const io = req.app.get('io');
    await sendInterviewMessage(io, interview.candidate._id, {
      type: 'interview_rescheduled',
      message: `Your interview for ${interview.job.title} has been rescheduled. Please confirm a new time slot.`,
      interviewId: interview._id,
    });

    res.json(interview);
  } catch (err) {
    console.error('PATCH /interviews/:id/reschedule error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── PATCH /api/interviews/:id/complete ──────────────────────────────────────
router.patch('/:id/complete', authenticate, authorizeRoles('employer'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.employer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    if (interview.status !== 'confirmed') {
      return res.status(409).json({ message: 'Only confirmed interviews can be marked complete.' });
    }

    interview.status = 'completed';
    await interview.save();

    res.json(interview);
  } catch (err) {
    console.error('PATCH /interviews/:id/complete error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;