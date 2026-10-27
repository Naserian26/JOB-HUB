// Single source of truth for the server's address. Override by setting
// VITE_API_URL in the environment (e.g. for a non-local deployment).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;
