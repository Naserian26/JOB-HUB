const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => typeof email === 'string' && EMAIL_RE.test(email);

const isValidPassword = (password) => typeof password === 'string' && password.length >= 8;

module.exports = { isValidEmail, isValidPassword };
