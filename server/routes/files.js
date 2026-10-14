const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const Profile = require('../models/Profile');
const Application = require('../models/Application');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function resolveSafePath(subdir, filename) {
  const dir = path.join(UPLOADS_DIR, subdir);
  const filePath = path.resolve(dir, filename);
  if (!filePath.startsWith(dir + path.sep)) return null;
  return filePath;
}

// CVs: accessible to the owning seeker, or an employer who received
// an application referencing this CV.
router.get('/cv/:filename', authenticate, async (req, res) => {
  const filePath = resolveSafePath('cvs', req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  const suffix = `/${req.params.filename}`;
  const profile = await Profile.findOne({ cvUrl: { $regex: `${suffix}$` } });
  const isOwner = profile && String(profile.userId) === String(req.user.id);
  const isReceivingEmployer = await Application.exists({
    cvUrl: { $regex: `${suffix}$` },
    employerId: req.user.id,
  });

  if (!isOwner && !isReceivingEmployer) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.sendFile(filePath);
});

// Cover letters: accessible to the seeker who applied, or the employer
// the application was sent to.
router.get('/cover-letter/:filename', authenticate, async (req, res) => {
  const filePath = resolveSafePath('cover-letters', req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  const suffix = `/${req.params.filename}`;
  const application = await Application.findOne({ coverLetter: { $regex: `${suffix}$` } });
  if (!application) return res.status(404).json({ message: 'File not found' });

  const isSeeker = String(application.seekerId) === String(req.user.id);
  const isEmployer = String(application.employerId) === String(req.user.id);
  if (!isSeeker && !isEmployer) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.sendFile(filePath);
});

module.exports = router;
