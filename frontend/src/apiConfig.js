// Centralized API base URL for frontend
// Uses `REACT_APP_API_BASE` env var when provided, fallback to localhost:5001/api
export const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:5001/api';

export default API_BASE_URL;
