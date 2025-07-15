import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../services/api';

const EmailVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userId and email from location state or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdParam = params.get('userId') || localStorage.getItem('pendingUserId');
    const emailParam = params.get('email') || localStorage.getItem('pendingEmail');
    
    if (userIdParam) {
      setUserId(userIdParam);
      localStorage.setItem('pendingUserId', userIdParam);
    }
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pendingEmail', emailParam);
    }
  }, [location]);
  
  // Handle input change for verification code
  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };
  
  // Handle key down for backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`).focus();
    }
  };
  
  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
    }
  };
  
  // Verify code
  const verifyCode = async () => {
    if (!userId || !email) {
      setError('Missing user information. Please try logging in again.');
      return;
    }
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          code: verificationCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify code');
      }
      
      // Verification successful
      setSuccess(true);
      setMessage('Email verified successfully!');
      
      // Store token and redirect to dashboard
      if (data.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.removeItem('pendingUserId');
        localStorage.removeItem('pendingEmail');
        
        // Force reload of the app to ensure the token is properly applied
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Resend verification code
  const resendCode = async () => {
    if (!userId || !email) {
      setError('Missing user information. Please try logging in again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }
      
      // Start countdown for resend button (2 minutes)
      setCountdown(120);
      setMessage('A new verification code has been sent to your email');
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Email Verification</h2>
        
        {email && (
          <p className="text-center text-gray-600 mb-6">
            We've sent a verification code to <strong className="font-medium">{email}</strong>
          </p>
        )}
        
        {!success ? (
          <>
            <div className="flex justify-center space-x-2 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            {error && <div className="text-red-500 text-center mb-4">{error}</div>}
            {message && <div className="text-blue-500 text-center mb-4">{message}</div>}
            
            <button 
              className={`w-full py-3 px-4 rounded-md font-medium text-white ${loading || code.join('').length !== 6 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={verifyCode}
              disabled={loading || code.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            
            <div className="mt-6 text-center">
              <button
                className={`text-sm ${loading || countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                onClick={resendCode}
                disabled={loading || countdown > 0}
              >
                {countdown > 0 
                  ? `Resend code in ${countdown}s` 
                  : 'Resend verification code'}
              </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Didn't receive the code? Check your spam folder or click the resend button above.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800 mb-2">{message}</p>
            <p className="text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
