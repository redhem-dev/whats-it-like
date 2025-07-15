/**
 * Geolocation Service
 * Provides functions for getting and verifying user location
 * Uses browser Geolocation API with IP-based fallback
 */

import { API_URL } from './api';

// Check if we're running in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Constants
const ALLOWED_COUNTRY = 'BA'; // Bosnia and Herzegovina country code

/**
 * Get user's current location using browser's Geolocation API
 * @returns {Promise} Promise resolving to {latitude, longitude, accuracy}
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser'
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Fallback to IP-based geolocation when browser geolocation is denied
 * @returns {Promise} Promise resolving to {latitude, longitude, country}
 */
export const getLocationByIP = async () => {
  try {
    // Using our backend proxy to avoid CORS issues
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(`${API_URL}/api/location/ip-info`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch IP-based location');
    }
    
    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      country: data.country_code,
      city: data.city,
      source: 'ip'
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    throw error;
  }
};

/**
 * Verify if user is in Bosnia and Herzegovina
 * First tries browser geolocation, falls back to IP-based if denied
 * @returns {Promise} Promise resolving to {allowed: boolean, location: Object}
 */
export const verifyUserLocation = async () => {
  // In development mode, bypass location verification
  if (isDevelopment && window.location.hostname === 'localhost') {
    console.log('Development mode: Bypassing location verification in frontend');
    return {
      allowed: true,
      location: {
        country: 'BA',
        city: 'Development',
        coordinates: {
          latitude: 43.8563, // Sarajevo coordinates as placeholder
          longitude: 18.4131
        }
      }
    };
  }
  
  try {
    // First try browser geolocation
    let location;
    
    try {
      location = await getCurrentPosition();
      
      // Verify location with backend
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/location/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          source: location.source
        })
      });
      
      if (!response.ok) {
        throw new Error('Location verification failed');
      }
      
      const result = await response.json();
      return {
        allowed: result.allowed,
        location: {
          ...location,
          country: result.country,
          city: result.city,
          verified: true
        }
      };
    } catch (geoError) {
      console.log('Browser geolocation failed, falling back to IP:', geoError);
      
      try {
        // Fall back to IP-based geolocation
        location = await getLocationByIP();
        
        // Verify with backend if we have coordinates
        if (location && location.latitude && location.longitude) {
          const token = localStorage.getItem('authToken');
          if (token) {
            try {
              const response = await fetch(`${API_URL}/api/location/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  source: 'ip'
                })
              });
              
              if (response.ok) {
                const result = await response.json();
                return {
                  allowed: result.allowed,
                  location: {
                    ...location,
                    country: result.country,
                    city: result.city,
                    verified: true
                  }
                };
              }
            } catch (verifyError) {
              console.error('IP location verification failed:', verifyError);
            }
          }
        }
        
        // If backend verification failed or wasn't attempted, use the IP data directly
        return {
          allowed: location && location.country === ALLOWED_COUNTRY,
          location: location ? {
            ...location,
            verified: location.country === ALLOWED_COUNTRY
          } : null
        };
      } catch (ipError) {
        console.error('IP geolocation fallback failed:', ipError);
        throw ipError;
      }
    }
  } catch (error) {
    console.error('Location verification error:', error);
    return {
      allowed: false,
      error: error.message,
      location: null
    };
  }
};

/**
 * Check if the user's location is allowed for voting and posting
 * @returns {Promise<boolean>} True if user is in Bosnia and Herzegovina
 */
export const isLocationAllowed = async () => {
  try {
    const { allowed } = await verifyUserLocation();
    return allowed;
  } catch (error) {
    console.error('Location check failed:', error);
    return false;
  }
};

export default {
  getCurrentPosition,
  getLocationByIP,
  verifyUserLocation,
  isLocationAllowed
};
