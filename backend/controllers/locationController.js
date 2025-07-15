/**
 * Location Controller
 * Handles location verification requests
 */

const axios = require('axios');
const locationService = require('../services/locationService');
const { getClientIP } = locationService;
const User = require('../models/User');

/**
 * Verify user's location
 * @route POST /api/verify/location
 * @requires auth
 */
exports.verifyLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, source } = req.body;
    const userId = req.user?.userId;
    
    console.log(`Location verification request from ${userId ? `user ${userId}` : 'unauthenticated user'}:`, { latitude, longitude, accuracy, source });
    
    // Input validation
    if (source === 'browser' && (!latitude || !longitude)) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required',
        details: 'Browser geolocation requires valid coordinates' 
      });
    }
    
    let locationData;
    
    try {
      if (source === 'browser' && latitude && longitude) {
        // Verify using coordinates from browser geolocation
        console.log(`Verifying browser coordinates: ${latitude}, ${longitude}`);
        locationData = await locationService.verifyCoordinates(latitude, longitude);
      } else {
        // Fallback to IP-based verification
        const clientIP = locationService.getClientIP(req);
        console.log(`Verifying location using IP address: ${clientIP}`);
        locationData = await locationService.verifyIPLocation(clientIP);
      }
      
      console.log('Location verification result:', locationData);
    } catch (locationError) {
      console.error('Location service error:', locationError);
      return res.status(500).json({ 
        message: 'Failed to verify location',
        details: locationError.message || 'Location service unavailable',
        source: source || 'unknown'
      });
    }
    
    // Update user's verified location if authenticated
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          // Store the verified location
          user.location = {
            country: locationData.country,
            city: locationData.city,
            coordinates: {
              latitude: locationData.coordinates.latitude,
              longitude: locationData.coordinates.longitude
            },
            verificationMethod: source || locationData.source || 'unknown',
            verificationDate: new Date(),
            verified: true
          };
          
          await user.save();
          console.log(`Updated location for user ${userId}:`, user.location);
        }
      } catch (userUpdateError) {
        // Don't fail the request if user update fails
        console.error(`Failed to update user location for ${userId}:`, userUpdateError);
      }
    }
    
    return res.status(200).json({
      allowed: locationData.allowed,
      country: locationData.country,
      countryName: locationData.countryName,
      city: locationData.city,
      source: locationData.source || source || 'unknown',
      message: locationData.allowed 
        ? 'Location verified. You are in Bosnia and Herzegovina.' 
        : 'Location verification failed. You must be in Bosnia and Herzegovina to vote or create posts.'
    });
  } catch (error) {
    console.error('Location verification error:', error);
    return res.status(500).json({ 
      message: 'Server error during location verification',
      details: error.message || 'Unknown error'
    });
  }
};

/**
 * Get list of cities for a country
 * @route GET /api/location/cities/:country
 */
/**
 * Proxy for IP geolocation to avoid CORS issues
 * @route GET /api/location/ip-info
 */
exports.getIpInfo = async (req, res) => {
  try {
    // Get client IP
    const clientIP = getClientIP(req);
    console.log(`IP info request for IP: ${clientIP}`);
    
    // Handle local development IPs
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === 'localhost' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
      console.log(`Using default location data for development IP: ${clientIP}`);
      return res.status(200).json({
        ip: clientIP || '127.0.0.1',
        city: 'Sarajevo',
        region: 'Sarajevo Canton',
        country_name: 'Bosnia and Herzegovina',
        country_code: 'BA',
        latitude: 43.8563,
        longitude: 18.4131,
        timezone: 'Europe/Sarajevo',
        source: 'development'
      });
    }
    
    // Try multiple IP geolocation services with fallbacks
    const services = [
      // Primary service
      async () => {
        console.log(`Trying ipapi.co for IP info: ${clientIP}`);
        const response = await axios.get(`https://ipapi.co/${clientIP}/json/`, { timeout: 3000 });
        
        // Check for error response from ipapi
        if (response.data.error) {
          throw new Error(`ipapi.co error: ${response.data.reason || 'Unknown error'}`);
        }
        
        return {
          ...response.data,
          source: 'ipapi.co'
        };
      },
      // First fallback
      async () => {
        console.log(`Trying ip-api.com for IP info: ${clientIP}`);
        const response = await axios.get(`http://ip-api.com/json/${clientIP}`, { timeout: 3000 });
        
        if (response.data.status === 'fail') {
          throw new Error(`ip-api.com error: ${response.data.message || 'Unknown error'}`);
        }
        
        // Convert to ipapi.co format for consistency
        return {
          ip: clientIP,
          city: response.data.city,
          region: response.data.regionName,
          country_name: response.data.country,
          country_code: response.data.countryCode,
          latitude: response.data.lat,
          longitude: response.data.lon,
          timezone: response.data.timezone,
          source: 'ip-api.com'
        };
      }
    ];
    
    // Try each service until one succeeds
    let lastError = null;
    for (const serviceCall of services) {
      try {
        const ipData = await serviceCall();
        console.log(`Successfully retrieved IP info from ${ipData.source}`);
        return res.status(200).json(ipData);
      } catch (error) {
        console.error(`IP info service failed:`, error.message);
        lastError = error;
        // Continue to next service
      }
    }
    
    // If we get here, all services failed
    console.error('All IP info services failed');
    return res.status(500).json({ 
      message: 'Failed to fetch IP location data', 
      details: lastError?.message || 'All geolocation services failed',
      ip: clientIP
    });
  } catch (error) {
    console.error('Error in IP info endpoint:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch IP location data',
      details: error.message || 'Unknown error'
    });
  }
};

/**
 * Get list of cities for a country
 * @route GET /api/location/cities/:country
 */
exports.getCitiesByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    
    // For now, we'll focus on Bosnia and Herzegovina
    if (country.toUpperCase() !== locationService.ALLOWED_COUNTRY_CODE) {
      return res.status(400).json({ 
        message: 'Only Bosnia and Herzegovina is supported at this time'
      });
    }
    
    // List of major cities in Bosnia and Herzegovina
    const cities = [
      'Sarajevo',
      'Banja Luka',
      'Tuzla',
      'Zenica',
      'Mostar',
      'Bijeljina',
      'Brčko',
      'Prijedor',
      'Doboj',
      'Cazin',
      'Trebinje',
      'Gradačac',
      'Gračanica',
      'Visoko',
      'Bugojno',
      'Travnik',
      'Goražde',
      'Livno',
      'Bihać',
      'Konjic'
    ].sort();
    
    return res.status(200).json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
