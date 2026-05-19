const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skills: [{ type: String }],
  experience: String,
  location: String,
  salaryExpectation: Number,
  jobTypePreference: String,
  cvUrl: String,
  photoUrl: String,
  bio: String,
});

module.exports = mongoose.model('Profile', ProfileSchema);