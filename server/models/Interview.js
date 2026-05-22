const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true },   // "10:45"
}, { _id: true });

const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Employer proposes one or more slots; candidate picks one
    proposedSlots: {
      type: [slotSchema],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 5,
        message: 'Provide between 1 and 5 slots.',
      },
    },

    // The slot the candidate confirmed
    confirmedSlot: {
      type: slotSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ['proposed', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'proposed',
    },

    // Optional: meeting link or location
    location: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Track who cancelled/rescheduled and why
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for calendar range queries: employer sees all interviews in a date range
interviewSchema.index({ employer: 1, 'confirmedSlot.date': 1 });
interviewSchema.index({ candidate: 1, 'confirmedSlot.date': 1 });
interviewSchema.index({ application: 1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);