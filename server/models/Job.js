const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  salaryMin: { type: Number, required: true },
  salaryMax: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);