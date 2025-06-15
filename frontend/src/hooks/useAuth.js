import { useState, useCallback, useEffect } from 'react';

// API base URL
const API_URL = 'http://localhost:3000';

/**
 * Authentication hook for handling user signup and login
 * Manages authentication state, requests, and errors
 * @returns {Object} Authentication methods and state
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);

  // Set auth token in localStorage and state
  const setAuthToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
    setToken(newToken);
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!token;
  }, [token]);

  // Signup with email and password
  const signup = useCallback(async (email, password, firstName, lastName, idNumber = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName, idNumber }),
        credentials: 'include', // Include cookies for session handling
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      
      // Store the token and user data
      setAuthToken(data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setAuthToken]);

  // Login with email and password
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
      
      // Store the token and user data
      setAuthToken(data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setAuthToken]);

  // Logout functionality
  const logout = useCallback(() => {
    // Optional: Call the server to invalidate token
    // fetch(`${API_URL}/api/auth/logout`, { 
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${token}` } 
    // });
    
    setAuthToken(null);
    setUser(null);
  }, [setAuthToken]);

  // Google OAuth signin
  const googleSignIn = useCallback(() => {
    // For MVP, just redirect to the backend's Google auth endpoint
    window.location.href = `${API_URL}/auth/google`;
  }, []);

  // Initial auth check (on component mount)
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid or expired
            setAuthToken(null);
          }
        } catch (err) {
          setAuthToken(null);
        }
      }
    };
    
    checkAuthStatus();
  }, [token, setAuthToken]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signup,
    login,
    logout,
    googleSignIn
  };
};

export default useAuth;
