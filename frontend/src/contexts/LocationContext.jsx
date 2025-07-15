import React, { createContext, useState, useEffect, useContext } from 'react';
import { verifyUserLocation, isLocationAllowed } from '../services/geolocationService';
import { API_URL } from '../services/api';
import useAuth from '../hooks/useAuth';

// Create context
export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  
  // Fetch cities for Bosnia and Herzegovina
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_URL}/api/location/cities/BA`);
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        
        const data = await response.json();
        setCities(data.cities || []);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError(err.message);
      }
    };
    
    fetchCities();
  }, []);
  
  // Check user's location when they're authenticated
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Only check location if user is authenticated and we don't already have location data
    const checkLocation = async () => {
      if (!isAuthenticated() || (location && isAllowed !== null)) return;
      
      console.log('LocationContext: Starting location verification');
      setLoading(true);
      setError(null);
      
      try {
        const result = await verifyUserLocation();
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log('LocationContext: Location verification result:', result);
          setLocation(result.location);
          setIsAllowed(result.allowed);
          
          // Alert user about their location status
          if (result.allowed) {
            console.log('LocationContext: User is in Bosnia and Herzegovina');
          } else {
            console.log('LocationContext: User is NOT in Bosnia and Herzegovina');
          }
        }
      } catch (err) {
        console.error('LocationContext: Location verification error:', err);
        if (isMounted) {
          setError(err.message);
          setIsAllowed(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkLocation();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, location, isAllowed]);
  
  // Function to manually check location (for voting and posting)
  const verifyLocation = async () => {
    // If we already have a valid location and it's allowed, don't re-verify
    if (location && isAllowed === true && !loading) {
      console.log('LocationContext: Using cached location verification (allowed)');
      return true;
    }
    
    // If we're already loading, don't start another verification
    if (loading) {
      console.log('LocationContext: Location verification already in progress');
      return isAllowed || false;
    }
    
    console.log('LocationContext: Manual location verification started');
    setLoading(true);
    setError(null);
    
    try {
      const result = await verifyUserLocation();
      console.log('LocationContext: Manual verification result:', result);
      
      setLocation(result.location);
      setIsAllowed(result.allowed);
      
      return result.allowed;
    } catch (err) {
      console.error('LocationContext: Manual verification error:', err);
      setError(err.message);
      setIsAllowed(false);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LocationContext.Provider
      value={{
        location,
        isAllowed,
        loading,
        error,
        cities,
        verifyLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// Custom hook to use the location context
export const useLocation = () => useContext(LocationContext);

export default LocationProvider;
