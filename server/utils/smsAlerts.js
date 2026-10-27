const axios = require('axios');
const SavedSearch = require('../models/SavedSearch');
const User = require('../models/User');

const getSmsConfig = () => ({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
  senderId: process.env.AT_SENDER_ID,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  endpoint: process.env.AT_ENV === 'sandbox'
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging',
});

const isSmsConfigured = () => {
  const { apiKey, username } = getSmsConfig();
  return Boolean(apiKey && username);
};

const normalizePhoneNumber = (value) => {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (/^0[17]\d{8}$/.test(compact)) return `+254${compact.slice(1)}`;
  if (/^254[17]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^\+254[17]\d{8}$/.test(compact)) return compact;
  return null;
};

const matchesSavedSearch = (savedSearch, job) => {
  const terms = savedSearch.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searchable = [
    job.title,
    job.description,
    job.category,
    job.location,
    job.experienceLevel,
    job.employerId?.name,
  ].filter(Boolean).join(' ').toLowerCase();
  const matchesTerms = terms.every(term => searchable.includes(term));
  const matchesCategory = savedSearch.categories.length === 0
    || savedSearch.categories.includes(job.category);
  const matchesLocation = savedSearch.locations.length === 0
    || savedSearch.locations.some(location => location.toLowerCase() === job.location.toLowerCase());
  const matchesMinimum = savedSearch.salaryMinimum == null
    || Number(job.salaryMax) >= savedSearch.salaryMinimum;
  const matchesMaximum = savedSearch.salaryMaximum == null
    || Number(job.salaryMin) <= savedSearch.salaryMaximum;
  return matchesTerms && matchesCategory && matchesLocation && matchesMinimum && matchesMaximum;
};

const sendSms = async (phoneNumber, message) => {
  const config = getSmsConfig();
  const body = new URLSearchParams({
    username: config.username,
    to: phoneNumber,
    message,
  });
  if (config.senderId) body.set('from', config.senderId);

  await axios.post(config.endpoint, body.toString(), {
    headers: {
      apiKey: config.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });
};

const sendJobAlerts = async (job) => {
  if (!isSmsConfigured()) {
    console.error('Job SMS alerts skipped: configure AT_USERNAME and AT_API_KEY');
    return;
  }

  const searches = await SavedSearch.find({ isActive: true })
    .populate({ path: 'userId', match: { smsAlertsEnabled: true } });
  const matchingUsers = new Map();
  const employer = await User.findById(job.employerId).select('name');
  const jobForSearch = { ...job.toObject(), employerId: employer };
  for (const savedSearch of searches) {
    const user = savedSearch.userId;
    if (user && user.phoneNumber && matchesSavedSearch(savedSearch, jobForSearch)) {
      matchingUsers.set(String(user._id), user);
    }
  }

  const jobUrl = `${getSmsConfig().clientUrl}/jobs/${job._id}`;
  const message = `JobHub alert: ${job.title} in ${job.location}. View details: ${jobUrl}`;
  const results = await Promise.allSettled(
    [...matchingUsers.values()].map(async user => {
      const phoneNumber = normalizePhoneNumber(user.phoneNumber);
      if (!phoneNumber) {
        console.error(`SMS alert skipped for user ${user._id}: invalid phone number`);
        return;
      }
      await sendSms(phoneNumber, message);
    })
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const user = [...matchingUsers.values()][index];
      console.error(`Failed to send job alert SMS to user ${user._id}:`, result.reason.message);
    }
  });
};

module.exports = { isSmsConfigured, matchesSavedSearch, normalizePhoneNumber, sendJobAlerts };
