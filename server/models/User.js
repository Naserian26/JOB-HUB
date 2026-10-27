const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['seeker', 'employer'], required: true },
  companyName: { type: String, trim: true, default: '' },
  companyWebsite: { type: String, trim: true, default: '' },
  employerApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  employerReviewNote: { type: String, trim: true, default: '' },
  employerReviewedAt: { type: Date, default: null },
  emailNotifications: { type: Boolean, default: true },
  phoneNumber: { type: String, default: '' },
  smsAlertsEnabled: { type: Boolean, default: false },
  profileVisible: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);