/**
 * API Configuration
 * Provides the base URL for API calls based on environment
 */

// Get the environment-specific API URL
// Using Vite's environment variables format (import.meta.env)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default API_URL;
