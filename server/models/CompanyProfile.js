const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  industry: String,
  description: String,
  logoUrl: String,
  linkedin: String,
  twitter: String,
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', CompanyProfileSchema);