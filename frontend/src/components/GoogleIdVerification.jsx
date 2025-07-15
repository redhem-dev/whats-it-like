import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import IdVerification from './IdVerification';
import { API_URL } from '../services/api';

/**
 * Google ID Verification component for completing registration 
 * after Google SSO authentication but before account creation
 */
const GoogleIdVerification = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempToken, setTempToken] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [googleData, setGoogleData] = useState(null);
  const [processingRegistration, setProcessingRegistration] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Extract query parameters from URL and validate Google session
  useEffect(() => {
    const validateSession = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (!token) {
        setError('Invalid verification session. Please try again.');
        setLoading(false);
        return;
      }
      
      setTempToken(token);
      
      try {
        // Validate the Google session with backend
        const response = await axios.get(`${API_URL}/api/verify/google-session`, {
          params: { token },
          withCredentials: true
        });
        
        if (response.data.valid && response.data.googleUser) {
          setGoogleData(response.data.googleUser);
        } else {
          setError('Invalid or expired verification session. Please try signing up again.');
        }
      } catch (err) {
        console.error('Error validating Google session:', err);
        setError('Failed to validate your session. Please try signing up again.');
        setTimeout(() => {
          // Redirect to signup page after error
          navigate('/signup');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    validateSession();
  }, [location, navigate]);

  // Submit verification data to server
  const submitVerification = async () => {
    // Validate ID number
    if (!idNumber || idNumber.trim() === '') {
      setError('Please enter your ID number to complete registration');
      return false;
    }
    
    // Validate Google data
    if (!googleData || !googleData.firstName || !googleData.lastName || !googleData.email) {
      setError('Missing profile data from Google. Please try signing up again.');
      console.error('Google data is incomplete:', googleData);
      return false;
    }
    
    try {
      setLoading(true);
      setProcessingRegistration(true);
      
      const verificationData = {
        tempToken,
        idNumber,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        email: googleData.email,
        idVerified: true
      };
      
      console.log('Sending verification data to server:', verificationData);
      
      // Send verification data back to server
      const response = await axios.post(`${API_URL}/api/verify/google-user`, verificationData, {
        withCredentials: true // Include cookies for session data
      });
      
      if (response.data.success) {
        // Store the token
        localStorage.setItem('authToken', response.data.token);
        
        // Redirect to dashboard or home page
        navigate('/dashboard');
        return true;
      } else {
        setError('Failed to complete registration. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Error completing Google registration:', err);
      setError(err.response?.data?.message || 'Failed to complete registration');
      return false;
    } finally {
      setLoading(false);
      setProcessingRegistration(false);
    }
  };

  // Handle ID verification completion from child component
  const handleVerificationComplete = async (verified) => {
    setIsVerified(verified);
    
    if (verified) {
      // If ID verification completed and ID number is provided, submit
      await submitVerification();
    }
  };

  // Update ID number when changed in the verification component
  const handleFormDataChange = (data) => {
    if (data && data.idNumber) {
      setIdNumber(data.idNumber);
    }
  };

  // Handle cancellation - redirect to sign up page
  const handleCancel = () => {
    navigate('/signup');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md">
        <div className="bg-zinc-100 p-8 rounded-lg shadow-md border border-zinc-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-black">What's It Like?</h1>
            <p className="mt-2 text-zinc-600">Share political opinions in your region</p>
          </div>

          <h2 className="text-2xl font-semibold text-black mb-6 text-center">
            Complete Your Registration
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div>
              <div className="mb-6">
                {googleData && (
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center text-xl font-bold mr-3">
                      {/* Implement avatar with initials following the established pattern */}
                      {googleData.firstName && googleData.lastName 
                        ? `${googleData.firstName[0]}${googleData.lastName[0]}`.toUpperCase()
                        : googleData.email 
                          ? `${googleData.email[0]}${googleData.email[1] || ''}`.toUpperCase()
                          : '??'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {googleData.firstName && googleData.lastName 
                          ? `${googleData.firstName} ${googleData.lastName}` 
                          : googleData.email 
                            ? googleData.email 
                            : 'Google User'}
                      </h3>
                      <p className="text-sm text-gray-600">{googleData.email}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                  <p>You've successfully authenticated with Google. To complete your registration, please enter your ID number and verify your identity by uploading your ID card.</p>
                </div>
              </div>

              {/* Add ID number input field */}
              <div className="mb-6">
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">ID Card Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your ID card number"
                  required
                />
                {error && error.includes('ID number') && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
                <button 
                  onClick={submitVerification}
                  className="mt-3 w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition-colors"
                  disabled={processingRegistration || !idNumber}
                >
                  Continue with ID Verification
                </button>
              </div>

              <IdVerification 
                onVerificationComplete={handleVerificationComplete}
                onFormDataChange={handleFormDataChange}
                formData={{ 
                  idNumber,
                  firstName: googleData?.firstName || '',
                  lastName: googleData?.lastName || ''
                }}
              />

              <button
                onClick={handleCancel}
                className="mt-4 w-full bg-zinc-300 text-black font-semibold py-2 rounded hover:bg-zinc-400 transition-colors"
              >
                Cancel Registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleIdVerification;
