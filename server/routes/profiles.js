const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');

const MATCHER_URL = process.env.MATCHER_URL || 'http://localhost:8000';

// ── Auth middleware ────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined. Check your .env file and that dotenv is loaded.');
    return res.status(500).json({ message: 'Server configuration error' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, id: decoded.id || decoded._id };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ── Multer config ──────────────────────────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/photos';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/cvs';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only PDF, DOC, or DOCX files are allowed'));
  },
});

// For parse-cv we keep file in memory to forward to Python
const uploadCvMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const valid = /pdf/.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only PDF files are supported for auto-parsing'));
  },
});

// ── GET /api/profiles/me ───────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    console.error('GET /me error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/profiles ─────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const existing = await Profile.findOne({ userId: req.user.id });
    if (existing) {
      const updated = await Profile.findByIdAndUpdate(existing._id, req.body, { new: true });
      return res.json(updated);
    }
    const newProfile = new Profile({ userId: req.user.id, ...req.body });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('POST / error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/profiles/photo ───────────────────────────────────────────────────
router.post('/photo', authenticate, uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const photoUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/photos/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { photoUrl },
      { new: true, upsert: true }
    );
    res.json({ photoUrl: profile.photoUrl });
  } catch (error) {
    console.error('POST /photo error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/profiles/cv ──────────────────────────────────────────────────────
router.post('/cv', authenticate, uploadCv.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CV uploaded' });
    const cvUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/cvs/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { cvUrl },
      { new: true, upsert: true }
    );
    res.json({ cvUrl: profile.cvUrl });
  } catch (error) {
    console.error('POST /cv error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/profiles/parse-cv ───────────────────────────────────────────────
// Forwards PDF to Python matcher, returns extracted skills/experience/location/bio
router.post('/parse-cv', authenticate, uploadCvMemory.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CV uploaded' });

    // Forward file to Python microservice
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const pythonRes = await axios.post(`${MATCHER_URL}/parse-cv`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    res.json(pythonRes.data);
  } catch (error) {
    console.error('POST /parse-cv error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'AI service unavailable. Make sure the matcher is running.' });
    }
    res.status(500).json({ error: error.response?.data?.detail || error.message });
  }
});

module.exports = router;