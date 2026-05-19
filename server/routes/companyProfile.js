const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const CompanyProfile = require('../models/CompanyProfile');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, id: decoded.id || decoded._id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Logo upload
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/logos';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const valid = /jpeg|jpg|png|webp|svg/.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

// GET /api/company-profile/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'No company profile found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/company-profile  — create or update
router.post('/', authenticate, async (req, res) => {
  try {
    const existing = await CompanyProfile.findOne({ userId: req.user.id });
    if (existing) {
      const updated = await CompanyProfile.findByIdAndUpdate(existing._id, req.body, { new: true });
      return res.json(updated);
    }
    const newProfile = new CompanyProfile({ userId: req.user.id, ...req.body });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/company-profile/logo
router.post('/logo', authenticate, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No logo uploaded' });
    const logoUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/logos/${req.file.filename}`;
    const profile = await CompanyProfile.findOneAndUpdate(
      { userId: req.user.id },
      { logoUrl },
      { new: true, upsert: true }
    );
    res.json({ logoUrl: profile.logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;