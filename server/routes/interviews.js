const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const { authenticate } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
// ─── Helpers ────────────────────────────────────────────────────────────────

const sendInterviewMessage = async (io, recipientId, payload) => {
  // Re-use your existing Socket.io message system
  // Swap this body for however you emit to a user room in your app
  if (io) {
    io.to(recipientId.toString()).emit('notification', payload);
  }
};

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/interviews
 * Employer proposes interview slots for an application.
 * Body: { applicationId, proposedSlots: [{date, startTime, endTime}], location?, meetingLink?, notes? }
 */
router.post('/', authenticate, authorizeRoles('employer'), async (req, res) => {
  try {
    const { applicationId, proposedSlots, location, meetingLink, notes } = req.body;

    if (!applicationId || !proposedSlots?.length) {
      return res.status(400).json({ message: 'applicationId and proposedSlots are required.' });
    }

    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('applicant');

    if (!application) return res.status(404).json({ message: 'Application not found.' });

    // Make sure the employer owns this job
    if (application.job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }

    // Prevent duplicate active interview for the same application
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
      job: application.job._id,
      employer: req.user._id,
      candidate: application.applicant._id,
      proposedSlots,
      location: location || '',
      meetingLink: meetingLink || '',
      notes: notes || '',
      status: 'proposed',
    });

    // Update application status to 'interview'
    application.status = 'interview';
    await application.save();

    // Notify candidate via Socket.io
    const io = req.app.get('io');
    await sendInterviewMessage(io, application.applicant._id, {
      type: 'interview_proposed',
      message: `You have been invited to interview for ${application.job.title}. Please confirm a time slot.`,
      interviewId: interview._id,
    });

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

/**
 * GET /api/interviews
 * Employer: all their interviews (calendar view), filterable by date range.
 * Candidate: all their interviews.
 * Query: ?from=2026-05-01&to=2026-05-31&status=confirmed
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const isEmployer = req.user.role === 'employer';

    const filter = isEmployer
      ? { employer: req.user._id }
      : { candidate: req.user._id };

    if (status) filter.status = status;

    // Date range filter on confirmedSlot.date (for calendar view)
    if (from || to) {
      filter['confirmedSlot.date'] = {};
      if (from) filter['confirmedSlot.date'].$gte = new Date(from);
      if (to) filter['confirmedSlot.date'].$lte = new Date(to);
    }

    const interviews = await Interview.find(filter)
      .populate('candidate', 'name email profilePhoto')
      .populate('employer', 'name email')
      .populate('job', 'title')
      .populate('application', 'status')
      .sort({ 'confirmedSlot.date': 1, createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('GET /interviews error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * GET /api/interviews/:id
 * Single interview — accessible by the employer or candidate involved.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email profilePhoto')
      .populate('employer', 'name email')
      .populate('job', 'title location')
      .populate('application');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });

    const userId = req.user._id.toString();
    const isParty =
      interview.employer.toString() === userId ||
      interview.candidate._id.toString() === userId;

    if (!isParty) return res.status(403).json({ message: 'Not authorised.' });

    res.json(interview);
  } catch (err) {
    console.error('GET /interviews/:id error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * PATCH /api/interviews/:id/confirm
 * Candidate confirms one of the proposed slots.
 * Body: { slotId }
 */
router.patch('/:id/confirm', authenticate, authorizeRoles('seeker'), async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ message: 'slotId is required.' });

    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('employer', 'name email')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.candidate._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    if (interview.status !== 'proposed') {
      return res.status(409).json({ message: `Interview is already ${interview.status}.` });
    }

    const slot = interview.proposedSlots.id(slotId);
    if (!slot) return res.status(400).json({ message: 'Slot not found in this interview.' });

    interview.confirmedSlot = slot;
    interview.status = 'confirmed';
    await interview.save();

    // Notify employer
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

/**
 * PATCH /api/interviews/:id/cancel
 * Either party can cancel.
 * Body: { reason? }
 */
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('job', 'title')
      .populate('employer', 'name email')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found.' });

    const userId = req.user._id.toString();
    const isParty =
      interview.employer._id.toString() === userId ||
      interview.candidate._id.toString() === userId;

    if (!isParty) return res.status(403).json({ message: 'Not authorised.' });
    if (['completed', 'cancelled'].includes(interview.status)) {
      return res.status(409).json({ message: `Cannot cancel a ${interview.status} interview.` });
    }

    interview.status = 'cancelled';
    interview.cancelledBy = req.user._id;
    interview.cancelReason = req.body.reason || '';
    await interview.save();

    // Notify the other party
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

    res.json(interview);
  } catch (err) {
    console.error('PATCH /interviews/:id/cancel error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * PATCH /api/interviews/:id/reschedule
 * Employer proposes new slots (resets status back to proposed).
 * Body: { proposedSlots: [{date, startTime, endTime}], notes? }
 */
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
    if (interview.employer.toString() !== req.user._id.toString()) {
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

/**
 * PATCH /api/interviews/:id/complete
 * Employer marks interview as completed.
 */
router.patch('/:id/complete', authenticate, authorizeRoles('employer'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.employer.toString() !== req.user._id.toString()) {
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