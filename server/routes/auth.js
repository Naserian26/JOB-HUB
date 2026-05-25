require('dotenv').config(); // <--- CRITICAL: Loads your .env file

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, id: decoded.id || decoded._id };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('Register hit:', { name, email, role });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    console.log('User saved:', user._id);
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Forgot Password (IMPROVED) ────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  console.log(`[FORGOT PASSWORD] Request received for email: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[FORGOT PASSWORD] User not found: ${email}`);
      return res.status(400).json({ message: 'User not found' });
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
    res.json({ message: 'Reset link sent to email' });

  } catch (error) {
    console.error('[FORGOT PASSWORD] Error:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
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
    const user = await User.findById(req.user.id).select('emailNotifications profileVisible email name');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Settings ─────────────────────────────────────────────────────────
router.post('/settings', authenticate, async (req, res) => {
  const { emailNotifications, profileVisible } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { emailNotifications, profileVisible },
      { new: true }
    );
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