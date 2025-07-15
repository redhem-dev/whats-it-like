/**
 * Location Service
 * Provides functions for verifying user location
 * Uses geocoding to determine country and city from coordinates
 */

const axios = require('axios');

// Constants
const ALLOWED_COUNTRY_CODE = 'BA'; // Bosnia and Herzegovina country code
const DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production';

// List of localhost and private IPs that should bypass verification in development
const LOCALHOST_IPS = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'];
const PRIVATE_IP_RANGES = [
  /^10\./,                    // 10.0.0.0 - 10.255.255.255
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0 - 172.31.255.255
  /^192\.168\./              // 192.168.0.0 - 192.168.255.255
];

/**
 * Verify if coordinates are within Bosnia and Herzegovina
 * Uses reverse geocoding to determine country from coordinates
 * 
 * @param {Number} latitude - Latitude coordinate
 * @param {Number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Location data including country, city and allowed status
 */
const verifyCoordinates = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap's Nominatim for reverse geocoding (free and open source)
    // Make sure to follow usage policy: https://operations.osmfoundation.org/policies/nominatim/
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'WhatsItLike/1.0' // Required by Nominatim usage policy
      }
    });

    const data = response.data;
    
    // Extract country code and city
    const countryCode = data.address.country_code?.toUpperCase();
    const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || 'Unknown';
    
    return {
      country: countryCode,
      countryName: data.address.country || 'Unknown',
      city: city,
      allowed: countryCode === ALLOWED_COUNTRY_CODE,
      coordinates: {
        latitude,
        longitude
      }
    };
  } catch (error) {
    console.error('Error verifying coordinates:', error);
    throw new Error('Failed to verify location coordinates');
  }
};

/**
 * Verify IP address location
 * Uses IP geolocation to determine country with multiple fallback options
 * 
 * @param {String} ip - IP address to verify
 * @returns {Promise<Object>} Location data including country and allowed status
 */
const verifyIPLocation = async (ip) => {
  // If IP is invalid or internal, use a default response for development
  if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    console.log(`Using default location data for internal IP: ${ip}`);
    return {
      country: ALLOWED_COUNTRY_CODE,
      countryName: 'Bosnia and Herzegovina',
      city: 'Sarajevo',
      allowed: true,
      coordinates: {
        latitude: 43.8563, // Sarajevo coordinates
        longitude: 18.4131
      },
      source: 'default'
    };
  }
  
  // Array of geolocation service calls to try in order
  const services = [
    // Try ipapi.co first (free tier, limited requests)
    async () => {
      console.log(`Trying ipapi.co for IP: ${ip}`);
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      
      if (response.data.error) {
        throw new Error(`ipapi.co error: ${response.data.reason || response.data.error}`);
      }
      
      return {
        country: response.data.country_code,
        city: response.data.city,
        source: 'ipapi.co'
      };
    },
    // First fallback
    async () => {
      console.log(`Trying ip-api.com for IP: ${ip}`);
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      
      if (response.data.status === 'fail') {
        throw new Error(`ip-api.com error: ${response.data.message || 'Unknown error'}`);
      }
      
      return {
        country: response.data.countryCode,
        city: response.data.city,
        source: 'ip-api.com'
      };
    }
  ];
  
  // Try each service until one succeeds
  let lastError = null;
  for (const serviceCall of services) {
    try {
      const locationData = await serviceCall();
      console.log(`Successfully retrieved location data from ${locationData.source}`);
      
      return {
        ...locationData,
        countryName: locationData.country,
        allowed: locationData.country === ALLOWED_COUNTRY_CODE,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        }
      };
    } catch (error) {
      console.error(`IP geolocation service failed:`, error.message);
      lastError = error;
      // Continue to next service
    }
  }
  
  // If we get here, all services failed
  console.error('All IP geolocation services failed');
  throw new Error(lastError?.message || 'Failed to verify IP location');
};

/**
 * Get client IP from request object
 * 
 * @param {Object} req - Express request object
 * @returns {String} Client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

/**
 * Bypass location verification for development
 * Always returns allowed: true
 * 
 * @returns {Object} Mock location data for development
 */
const bypassLocationVerification = () => {
  return {
    country: ALLOWED_COUNTRY_CODE,
    city: 'Development',
    source: 'development-bypass',
    allowed: true
  };
};

module.exports = {
  verifyCoordinates,
  verifyIPLocation,
  getClientIP,
  bypassLocationVerification,
  ALLOWED_COUNTRY_CODE
};
