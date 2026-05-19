const axios = require('axios');

const MATCHER_URL = 'http://localhost:8000/match';

const calculateMatch = async (seekerData, jobData) => {
  try {
    const payload = {
      seeker: {
        skills: seekerData.skills || [],
        experience: seekerData.experience || 'Entry',
        location: seekerData.location || 'Remote',
        salary_expectation: seekerData.salary_expectation || 0,
        bio: seekerData.bio || '',
      },
      job: {
        title: jobData.title || '',
        description: jobData.description || '',
        required_skills: jobData.required_skills || [],
        location: jobData.location || '',
        experience_level: jobData.experienceLevel || jobData.experience_level || 'Entry',
        salary_min: jobData.salary_min || 0,
        salary_max: jobData.salary_max || 0,
      }
    };

    console.log('Sending to matcher:', JSON.stringify(payload, null, 2));
    const response = await axios.post(MATCHER_URL, payload);
    return response.data;
  } catch (error) {
    console.error('Error contacting AI Matcher:', error.message);
    console.error('Response data:', error.response?.data);
    return {
      match_score: 50,
      explanation: 'Matcher service unavailable',
      breakdown: { skills: 0, semantic: 0, experience: 0, location: 0, salary: 0 }
    };
  }
};

module.exports = { calculateMatch };