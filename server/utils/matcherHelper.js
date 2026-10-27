const axios = require('axios');

const MATCHER_URL = `${process.env.MATCHER_URL || 'http://localhost:8000'}/match`;

const buildMatchData = (profile, job) => ({
  seekerData: {
    skills: profile?.skills || [],
    experience: profile?.experience || '',
    location: profile?.location || '',
    salary_expectation: profile?.salaryExpectation ?? 0,
    bio: profile?.bio || '',
  },
  jobData: {
    title: job.title,
    description: job.description,
    required_skills: job.requiredSkills || [],
    preferred_skills: job.preferredSkills || [],
    location: job.location,
    experienceLevel: job.experienceLevel,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
  },
});

const calculateMatch = async (seekerData, jobData) => {
  try {
    const payload = {
      seeker: {
        skills: seekerData.skills || [],
        experience: seekerData.experience || '',
        location: seekerData.location || '',
        salary_expectation: seekerData.salary_expectation ?? 0,
        bio: seekerData.bio || '',
      },
      job: {
        title: jobData.title || '',
        description: jobData.description || '',
        required_skills: jobData.required_skills || [],
        preferred_skills: jobData.preferred_skills || [],
        location: jobData.location || '',
        experience_level: jobData.experienceLevel || jobData.experience_level || '',
        salary_min: jobData.salary_min ?? jobData.salaryMin ?? 0,
        salary_max: jobData.salary_max ?? jobData.salaryMax ?? 0,
      }
    };

    const response = await axios.post(MATCHER_URL, payload);
    if (!Number.isFinite(response.data?.match_score)
      || response.data.match_score < 0
      || response.data.match_score > 100
      || !response.data.breakdown) {
      throw new Error('Matcher returned an invalid score response');
    }
    return response.data;
  } catch (error) {
    console.error('Error contacting AI Matcher:', error.message);
    const unavailableError = new Error('Match scoring is temporarily unavailable. Please try again.');
    unavailableError.statusCode = 503;
    throw unavailableError;
  }
};

module.exports = { buildMatchData, calculateMatch };