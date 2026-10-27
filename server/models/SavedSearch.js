const mongoose = require('mongoose');

const SavedSearchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  search: { type: String, trim: true, maxlength: 120, default: '' },
  categories: [{ type: String }],
  locations: [{ type: String }],
  salaryMinimum: { type: Number, min: 0, default: null },
  salaryMaximum: { type: Number, min: 0, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SavedSearch', SavedSearchSchema);
