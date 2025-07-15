import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import Navbar from '../components/Navbar';
import { useLocation } from '../contexts/LocationContext';
import { verifyUserLocation } from '../services/geolocationService';
import MockAd from '../components/ads/MockAd';

const NewPost = () => {
  const navigate = useNavigate();
  const { location, isAllowed, loading: locationLoading, cities, verifyLocation } = useLocation();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    country: 'BA', // Default to Bosnia and Herzegovina (fixed)
    city: '',
    tags: ''
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Set available cities based on context
  useEffect(() => {
    if (cities && cities.length > 0) {
      setAvailableCities(cities);
    }
  }, [cities]);
  
  // Verify user's location when component mounts
  useEffect(() => {
    // Track if the component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const checkUserLocation = async () => {
      try {
        console.log('NewPost: Checking user location...');
        // Always verify location when entering the post creation page
        const result = await verifyLocation();
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log('NewPost: Location verification result:', result);
          setLocationVerified(result);
          
          if (!result) {
            console.log('NewPost: User is not in Bosnia and Herzegovina, blocking form');
            setLocationError('You must be physically located in Bosnia and Herzegovina to create posts.');
          } else {
            console.log('NewPost: User is in Bosnia and Herzegovina, allowing form');
            // Set available cities from context
            setAvailableCities(cities);
          }
        }
      } catch (error) {
        console.error('NewPost: Location verification failed:', error);
        if (isMounted) {
          setLocationError('Unable to verify your location. Please enable location services.');
          setLocationVerified(false);
        }
      }
    };
    
    // Always check location when component mounts
    checkUserLocation();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [cities, verifyLocation]); // Removed locationVerified to ensure verification always runs

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First verify location
      const locationResult = await verifyLocation();
      if (!locationResult) {
        setLocationError('You must be physically located in Bosnia and Herzegovina to create posts.');
        setLocationVerified(false);
        setIsSubmitting(false);
        return;
      }
      
      setLocationVerified(true);
      setLocationError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }
      
      // Format tags as array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          location: {
            country: formData.country,
            city: formData.city,
            verified: true // Mark that location has been verified
          },
          tags: tagsArray
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const data = await response.json();
      console.log('Post creation response:', data);
      
      // Handle different response structures
      if (data.post && data.post._id) {
        navigate(`/post/${data.post._id}`);
      } else if (data._id) {
        navigate(`/post/${data._id}`);
      } else {
        console.error('Unexpected response format:', data);
        navigate('/dashboard'); // Fallback to dashboard
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ submit: error.message || 'Failed to create post. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Top Banner Ad */}
      <div className="max-w-screen-xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
        <MockAd type="banner" label="New Post Page Top Banner" />
      </div>
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar Ad */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <MockAd type="skyscraper" label="Left Sidebar Ad" />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-grow max-w-3xl">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <h1 className="text-2xl font-bold text-white">Create New Post</h1>
                <p className="mt-2 text-blue-100">Share your political opinion with the community</p>
              </div>
              
              {/* Location Verification Alert - Only show one at a time */}
              {!locationVerified ? (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Location Verification Failed</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>You must be physically located in Bosnia and Herzegovina to create posts.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={verifyLocation}
                          className="inline-flex items-center px-3 py-2 border border-red-600 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Location Verified</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your location in Bosnia and Herzegovina has been verified.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-base font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={!locationVerified}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3 ${errors.title ? 'border-red-300' : ''} ${!locationVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter a descriptive title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              
              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="6"
                  disabled={!locationVerified}
                  className={`mt-1 block w-full border ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !locationVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Share your political opinion in detail..."
                ></textarea>
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
              
              {/* Location */}
              <div>
                <label htmlFor="city" className="block text-base font-medium text-gray-700">
                  City in Bosnia and Herzegovina
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!locationVerified}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3 ${
                    errors.city ? 'border-red-300' : ''
                  } ${
                    !locationVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
              
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-base font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  disabled={!locationVerified}
                  className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base ${!locationVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g. Economy, Environment, Education"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter keywords related to your post, separated by commas
                </p>
              </div>
                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="mr-4 px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !locationVerified}
                    className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {isSubmitting ? 'Creating...' : locationVerified ? 'Create Post' : 'Location Verification Required'}
                  </button>
                </div>
                
                {errors.submit && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {errors.submit}
                  </div>
                )}
              </form>
            </div>
            
            {/* Ad Below Form */}
            <div className="mt-6">
              <MockAd type="rectangle" label="Post Form Bottom Ad" />
            </div>
          </div>
          
          {/* Right Sidebar Ad */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              <MockAd type="rectangle" label="Right Sidebar Top Ad" />
              <MockAd type="rectangle" label="Right Sidebar Bottom Ad" />
            </div>
          </div>
        </div>
      </main>
      
      {/* Bottom Banner Ad */}
      <div className="max-w-screen-xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <MockAd type="banner" label="New Post Page Bottom Banner" />
      </div>
    </div>
  );
};

export default NewPost;

