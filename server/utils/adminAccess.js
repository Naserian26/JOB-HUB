const isAdminEmail = (email) => (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(value => value.trim().toLowerCase())
  .includes(String(email || '').trim().toLowerCase());

module.exports = { isAdminEmail };
