require('dotenv').config(); // <--- CRITICAL: Loads your .env file

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authenticate = require('../middleware/authenticate');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { isSmsConfigured, normalizePhoneNumber } = require('../utils/smsAlerts');
const { isAdminEmail } = require('../utils/adminAccess');

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Caps brute-force attempts per endpoint: 5 tries per 15 min per IP. Each
// route gets its own limiter so attempts on one don't eat another's budget.
const makeAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

const registerLimiter = makeAuthLimiter();
const loginLimiter = makeAuthLimiter();
const forgotPasswordLimiter = makeAuthLimiter();

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password, role, companyName, companyWebsite } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (!['seeker', 'employer'].includes(role)) {
    return res.status(400).json({ message: 'Role must be either "seeker" or "employer"' });
  }
  if (role === 'employer') {
    if (typeof companyName !== 'string' || !companyName.trim() || companyName.trim().length > 120) {
      return res.status(400).json({ message: 'A company name of 1 to 120 characters is required' });
    }
    if (typeof companyWebsite !== 'string' || !companyWebsite.trim()) {
      return res.status(400).json({ message: 'A company website is required' });
    }
    try {
      const website = new URL(companyWebsite);
      if (!['http:', 'https:'].includes(website.protocol)) throw new Error('invalid protocol');
    } catch {
      return res.status(400).json({ message: 'Enter a valid company website URL' });
    }
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === 'employer' && {
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim(),
        employerApprovalStatus: 'pending',
      }),
    });
    await user.save();
    console.log('User saved:', user._id);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        companyName: user.companyName,
        employerApprovalStatus: user.employerApprovalStatus || 'approved',
        isAdmin: isAdminEmail(user.email),
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    console.error('Register error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id, name: user.name, role: user.role, email: user.email,
        companyName: user.companyName,
        employerApprovalStatus: user.employerApprovalStatus || 'approved',
        isAdmin: isAdminEmail(user.email),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/employer-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('role companyName companyWebsite employerApprovalStatus employerReviewNote');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'employer') return res.status(403).json({ message: 'Employer account required' });
    res.json({
      companyName: user.companyName,
      companyWebsite: user.companyWebsite,
      employerApprovalStatus: user.employerApprovalStatus || 'approved',
      employerReviewNote: user.employerReviewNote,
    });
  } catch (error) {
    console.error('GET /employer-status error:', error.message);
    res.status(500).json({ message: 'Failed to load employer application status' });
  }
});

// ─── Forgot Password (IMPROVED) ────────────────────────────────────────────
const GENERIC_RESET_MESSAGE = 'If that email is registered, a password reset link has been sent.';

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;

  console.log(`[FORGOT PASSWORD] Request received for email: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Deliberately generic: don't reveal whether this email is registered.
      console.log(`[FORGOT PASSWORD] User not found: ${email}`);
      return res.json({ message: GENERIC_RESET_MESSAGE });
    }

    // Generate Token (15 minutes expiry)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // Configure Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports like 587
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    // Verify Configuration (Catches bad passwords immediately)
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.log('[EMAIL ERROR] Configuration Failed:', error);
          reject(error);
        } else {
          console.log('[EMAIL SUCCESS] Server is ready to send emails');
          resolve(success);
        }
      });
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    // Send Email
    await transporter.sendMail({
      from: `"JobHub Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'JobHub Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #eab308;">JobHub Password Reset</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #eab308; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #888;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    console.log(`[FORGOT PASSWORD] Email sent successfully to ${email}`);
    res.json({ message: GENERIC_RESET_MESSAGE });

  } catch (error) {
    console.error('[FORGOT PASSWORD] Error:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Hash new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// ─── Change Password ────────────────────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Change Email ────────────────────────────────────────────────────────────
router.post('/change-email', authenticate, async (req, res) => {
  const { newEmail, password } = req.body;
  if (!isValidEmail(newEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password is incorrect' });
    
    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    
    user.email = newEmail;
    await user.save();
    res.json({ message: 'Email updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Settings ────────────────────────────────────────────────────────────
router.get('/settings', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('emailNotifications profileVisible email name phoneNumber smsAlertsEnabled companyName companyWebsite employerApprovalStatus employerReviewNote');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ...user.toObject(), smsAlertsAvailable: isSmsConfigured() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Settings ─────────────────────────────────────────────────────────
router.post('/settings', authenticate, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.emailNotifications === 'boolean') {
      updates.emailNotifications = req.body.emailNotifications;
    }
    if (typeof req.body.profileVisible === 'boolean') {
      updates.profileVisible = req.body.profileVisible;
    }

    if (req.user.role === 'seeker') {
      let effectivePhoneNumber;
      if (typeof req.body.phoneNumber === 'string') {
        const phoneNumber = req.body.phoneNumber.trim();
        if (phoneNumber) {
          const normalized = normalizePhoneNumber(phoneNumber);
          if (!normalized) {
            return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 0712345678 or +254712345678' });
          }
          updates.phoneNumber = normalized;
          effectivePhoneNumber = normalized;
        } else {
          updates.phoneNumber = '';
          effectivePhoneNumber = '';
        }
      }
      if (typeof req.body.smsAlertsEnabled === 'boolean') {
        if (req.body.smsAlertsEnabled && !isSmsConfigured()) {
          return res.status(503).json({ message: 'SMS alerts are not configured yet. Please try again later.' });
        }
        if (req.body.smsAlertsEnabled && effectivePhoneNumber === undefined) {
          const currentUser = await User.findById(req.user.id).select('phoneNumber');
          effectivePhoneNumber = currentUser?.phoneNumber || '';
        }
        if (req.body.smsAlertsEnabled && !effectivePhoneNumber) {
          return res.status(400).json({ message: 'Add your phone number before enabling SMS alerts' });
        }
        updates.smsAlertsEnabled = req.body.smsAlertsEnabled;
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select('emailNotifications profileVisible email name phoneNumber smsAlertsEnabled companyName companyWebsite employerApprovalStatus employerReviewNote');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Settings updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Deactivate Account ─────────────────────────────────────────────────────
router.post('/deactivate', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ message: 'Account deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete Account ──────────────────────────────────────────────────────────
router.delete('/delete-account', authenticate, async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password is incorrect' });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;