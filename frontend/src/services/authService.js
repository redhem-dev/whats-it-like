/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { API_URL } from './api';

/**
 * Get authorization headers for API calls
 * @returns {Object} Headers object with Authorization if token exists
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Login with email and password
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise<Object>} Auth response with token and user data
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  return data;
};

/**
 * Register a new user
 * @param {Object} userData User registration data
 * @returns {Promise<Object>} Registration response with token and user data
 */
export const register = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  
  return data;
};

/**
 * Verify email with verification code
 * @param {string} userId User ID
 * @param {string} email User email
 * @param {string} code Verification code
 * @returns {Promise<Object>} Verification response with token
 */
export const verifyEmail = async (userId, email, code) => {
  // Get token if available (for already authenticated users)
  const headers = getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId,
      email,
      code
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Email verification failed');
  }
  
  return data;
};

/**
 * Resend verification code
 * @param {string} userId User ID
 * @param {string} email User email
 * @returns {Promise<Object>} Response with success status
 */
export const resendVerificationCode = async (userId, email) => {
  // Get token if available
  const headers = getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId,
      email
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to resend verification code');
  }
  
  return data;
};

/**
 * Get verification status (doesn't require email verification)
 * @returns {Promise<Object>} User's verification status
 */
export const getVerificationStatus = async () => {
  const headers = getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/auth/verification-status`, {
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get verification status');
  }
  
  return data;
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUser = async () => {
  const headers = getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get user profile');
  }
  
  return data;
};

export default {
  login,
  register,
  verifyEmail,
  resendVerificationCode,
  getVerificationStatus,
  getCurrentUser,
  getAuthHeaders
};
