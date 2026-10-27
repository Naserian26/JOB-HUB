const User = require('../models/User');

const requireApprovedEmployer = async (req, res, next) => {
  if (req.user.role !== 'employer') {
    return next();
  }

  try {
    const user = await User.findById(req.user.id).select('employerApprovalStatus');
    if (!user) return res.status(401).json({ message: 'Account not found' });

    // Accounts created before approval existed have no status and remain active.
    if (user.employerApprovalStatus && user.employerApprovalStatus !== 'approved') {
      return res.status(403).json({
        message: user.employerApprovalStatus === 'pending'
          ? 'Your employer account is awaiting admin approval'
          : 'Your employer application was not approved',
        employerApprovalStatus: user.employerApprovalStatus,
      });
    }

    next();
  } catch (error) {
    console.error('Employer approval check failed:', error.message);
    res.status(500).json({ message: 'Could not verify employer approval' });
  }
};

module.exports = requireApprovedEmployer;
