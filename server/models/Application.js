const mongoose = require('mongoose');
const ApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: String,
  expectedSalary: Number,
  availability: String,
  cvUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'interview', 'hired', 'rejected'], default: 'pending' },
  matchScore: { type: Number, default: 0 },
  matchBreakdown: {
    skills: { type: Number, default: 0 },
    semantic: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
  },
  matchExplanation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);