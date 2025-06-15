import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API base URL - using the same URL as in useAuth hook
const API_URL = 'http://localhost:3000';

/**
 * ID Verification component for uploading and verifying ID cards
 * To be integrated into the registration flow
 */
const IdVerification = ({ onVerificationComplete, formData }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  // Handle ID card image upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Reset states
      setError('');
      setExtractedData(null);
      setVerificationResult(null);
      
      // Basic validation
      if (!selectedFile.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Upload and process ID card image
  const handleUpload = async () => {
    if (!file) {
      setError('Please select an ID card image first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('idCard', file);
      
      const response = await axios.post(`${API_URL}/api/verify/upload-id`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true, // Important for session cookies
      });
      
      setExtractedData(response.data.extractedData);
      setVerificationResult(null);
    } catch (err) {
      console.error('Error uploading ID card:', err);
      
      // Get specific error message from response when available
      const errorMessage = err.response?.data?.message || 'Failed to upload and process ID card';
      
      // Enhanced error messages for better UX
      if (errorMessage.includes('billing')) {
        setError('System configuration error: OCR service is not properly set up. Please contact support.');
      } else if (errorMessage.includes('format')) {
        setError('Invalid image format. Please upload a JPG, PNG or other common image format.');
      } else if (errorMessage.includes('clear')) {
        setError('Could not read the ID clearly. Please upload a clearer image with good lighting.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Verify extracted data against user-provided data
  const verifyData = async () => {
    if (!extractedData) {
      setError('Please upload and process your ID card first');
      return;
    }
    
    if (!formData?.firstName || !formData?.lastName || !formData?.idNumber) {
      setError('Please fill in your name and ID number in the registration form');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/api/verify/match-data`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        idNumber: formData.idNumber
      }, {
        withCredentials: true, // Important for session cookies
      });
      
      setVerificationResult({
        success: true,
        message: 'Identity verified successfully'
      });
      
      // Notify parent component that verification is complete
      if (onVerificationComplete) {
        onVerificationComplete(true);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      
      setVerificationResult({
        success: false,
        message: err.response?.data?.message || 'Verification failed',
        details: err.response?.data?.details || {}
      });
      
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const resetProcess = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setVerificationResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="id-verification-container">
      <h2 className="text-2xl font-bold mb-4">ID Verification</h2>
      
      <div className="verification-instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Upload a clear image of your government-issued ID card</li>
          <li>Ensure your <strong>full name</strong> and <strong>ID number</strong> are clearly visible</li>
          <li>Make sure the image is well-lit and not blurry</li>
          <li>The system will extract and verify your information automatically</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <p className="mb-2">Please upload a clear photo of your government-issued ID card.</p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            ref={fileInputRef}
          />
          {!extractedData && (
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`px-4 py-2 rounded ${
                loading || !file
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Processing...' : 'Upload & Verify'}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {preview && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">ID Card Preview</h3>
          <div className="border border-gray-300 rounded p-2 max-w-md">
            <img
              src={preview}
              alt="ID Card Preview"
              className="w-full h-auto object-contain max-h-48"
            />
          </div>
        </div>
      )}
      
      {extractedData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Extracted Information</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <div className="mb-2">
              <span className="font-medium">Full Name:</span> {extractedData.fullName}
            </div>
            <div className="mb-2">
              <span className="font-medium">ID Number:</span> {extractedData.idNumber}
            </div>
            
            {!verificationResult && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Please verify that this information matches your registration details.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={verifyData}
                    disabled={loading}
                    className={`px-4 py-2 rounded ${
                      loading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? 'Verifying...' : 'Confirm & Verify'}
                  </button>
                  <button
                    onClick={resetProcess}
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {verificationResult && (
        <div className={`mb-6 p-4 rounded ${
          verificationResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        } border-l-4`}>
          <h3 className={`text-lg font-semibold ${
            verificationResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
          </h3>
          <p className={verificationResult.success ? 'text-green-700' : 'text-red-700'}>
            {verificationResult.message}
          </p>
          
          {!verificationResult.success && verificationResult.details && (
            <div className="mt-2 text-sm">
              <p>Details:</p>
              <ul className="list-disc list-inside ml-2">
                {verificationResult.details.nameMatch === false && (
                  <li>The name on your ID doesn't match your provided name</li>
                )}
                {verificationResult.details.idMatch === false && (
                  <li>The ID number on your ID doesn't match your provided ID number</li>
                )}
              </ul>
            </div>
          )}
          
          <div className="mt-4">
            {verificationResult.success ? (
              <button
                onClick={() => onVerificationComplete && onVerificationComplete(true)}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Registration
              </button>
            ) : (
              <button
                onClick={resetProcess}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdVerification;
