const User = require('../models/User');

const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

const requireAdmin = async (req, res, next) => {
  try {
    const adminEmails = getAdminEmails();
    if (!adminEmails.length) {
      return res.status(503).json({ message: 'Admin access is not configured' });
    }

    const user = await User.findById(req.user.id).select('email');
    if (!user || !adminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin authorization failed:', error.message);
    res.status(500).json({ message: 'Could not verify admin access' });
  }
};

module.exports = requireAdmin;
