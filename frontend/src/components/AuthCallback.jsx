import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component that handles OAuth callbacks
 * It extracts the token from URL query parameters and stores it in localStorage
 */
const AuthCallback = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');
    const redirectPath = params.get('redirect') || '/';

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      // Redirect to sign in page after a short delay
      setTimeout(() => navigate('/signin'), 3000);
      return;
    }

    if (!token) {
      setError('No authentication token received. Please try again.');
      // Redirect to sign in page after a short delay
      setTimeout(() => navigate('/signin'), 3000);
      return;
    }

    try {
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      // Fetch user info (optional but recommended to verify token works)
      const getUserInfo = async () => {
        try {
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Store user data if needed
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          // Redirect to dashboard or specified redirect path
          navigate(redirectPath);
        } catch (err) {
          console.error('Error fetching user data:', err);
          // Still redirect to specified path since we have the token
          navigate(redirectPath);
        }
      };
      
      getUserInfo();
    } catch (err) {
      setError('Error processing authentication. Please try again.');
      setTimeout(() => navigate('/signin'), 3000);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md">
        <div className="bg-zinc-100 p-8 rounded-lg shadow-md border border-zinc-200 text-center">
          {error ? (
            <div className="text-red-600 mb-4">{error}</div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-black mb-4">Authentication Successful</h2>
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
              </div>
              <p className="text-zinc-600">Redirecting you to the dashboard...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
