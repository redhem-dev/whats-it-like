import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idDocument, setIdDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [location, setLocation] = useState({ country: "", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingDocument, setProcessingDocument] = useState(false);
  const [documentVerified, setDocumentVerified] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    idNumber: ""
  });

  // Handle file selection for ID document
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdDocument(file);
      // Create a preview URL for the uploaded document
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle document verification
  const verifyDocument = async () => {
    if (!idDocument) {
      setError("Please upload an ID document");
      return;
    }

    setProcessingDocument(true);
    setError("");

    try {
      // In a real application, we would upload the document to the server
      // and get the OCR results back
      // Simulating document processing with setTimeout
      setTimeout(() => {
        // Simulated OCR results
        setPersonalInfo({
          firstName: "John",
          lastName: "Doe",
          idNumber: "ID12345678"
        });
        setDocumentVerified(true);
        setProcessingDocument(false);
      }, 2000);
    } catch (err) {
      setError("Failed to process document. Please try again.");
      setProcessingDocument(false);
    }
  };

  // Detect user's location
  const detectLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In a real app, you would use a reverse geocoding service
            // to convert coordinates to city and country
            // For demo purposes, we'll set dummy values
            setLocation({
              country: "United States",
              city: "New York"
            });
            setLoading(false);
          } catch (error) {
            setError("Error detecting location. Please enter manually.");
            setLoading(false);
          }
        },
        (error) => {
          setError("Location access denied. Please enter location manually.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  // Handle form submission for final registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // In a real application, we would send all data to the server
    try {
      // TODO: Connect to backend registration API
      // const formData = new FormData();
      // formData.append('email', email);
      // formData.append('password', password);
      // formData.append('document', idDocument);
      // formData.append('personalInfo', JSON.stringify(personalInfo));
      // formData.append('location', JSON.stringify(location));
      
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to register');
      // }
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        // Redirect to success page or sign in
        // window.location.href = '/signin';
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  };

  // Handle Google sign up
  const handleGoogleSignUp = () => {
    // TODO: Trigger Google OAuth2 flow
    // window.location.href = '/api/auth/google';
  };

  // Go to next step
  const goToNextStep = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (!documentVerified) {
        setError("Please upload and verify your ID document");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    setStep(step - 1);
    setError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">What's It Like?</h1>
            <p className="mt-2 text-gray-600">Share political opinions in your region</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            {step === 1 ? "Create Account" : 
             step === 2 ? "Verify Identity" : "Confirm Location"}
          </h2>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Email and Password */}
          {step === 1 && (
            <>
              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Continue
                </button>
                
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-300 absolute w-full"></div>
                  <div className="bg-white px-3 relative text-sm text-gray-500">or continue with</div>
                </div>
                
                <button
                  type="button"
                  className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  onClick={handleGoogleSignUp}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.787-1.676-4.139-2.701-6.735-2.701-5.522 0-10.002 4.48-10.002 10.002s4.48 10.002 10.002 10.002c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.077z" fill="#FFC107"/>
                    <path d="M12.545 10.239l-9.426 0.077c-0.293 1.436 0.107 2.949 0.775 4.221l8.65-0.099v-4.199z" fill="#FF3D00"/>
                    <path d="M12.545 10.239v4.199l8.65 0.099c-0.768-2.13-2.742-3.573-5.003-3.882l-3.647-0.416z" fill="#4CAF50"/>
                    <path d="M3.894 14.537c1.336 2.604 4.027 4.38 7.097 4.38 2.798 0 4.733-1.658 5.445-3.972l-8.65-0.099-3.892-0.309z" fill="#1976D2"/>
                  </svg>
                  Sign up with Google
                </button>
              </form>
              
              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Sign In
                </Link>
              </p>
            </>
          )}

          {/* Step 2: ID Document Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm mb-4">
                We need to verify your identity. Please upload a government-issued ID document.
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors">
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <img src={previewUrl} alt="ID Document Preview" className="max-h-48 object-contain rounded" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {idDocument?.name} ({Math.round(idDocument?.size / 1024)} KB)
                    </p>
                    <button 
                      onClick={() => {
                        setIdDocument(null);
                        setPreviewUrl("");
                        setDocumentVerified(false);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex justify-center text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload ID document</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">Passport, ID card, or driver's license</p>
                  </div>
                )}
              </div>
              
              {idDocument && !documentVerified && (
                <button
                  type="button"
                  onClick={verifyDocument}
                  disabled={processingDocument}
                  className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  {processingDocument ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : "Verify Document"}
                </button>
              )}
              
              {documentVerified && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium">Document verified successfully</p>
                        <p className="text-sm">We've extracted the following information:</p>
                        <ul className="mt-1.5 text-sm list-disc list-inside">
                          <li>Name: {personalInfo.firstName} {personalInfo.lastName}</li>
                          <li>ID Number: {personalInfo.idNumber}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                >
                  Back
                </button>
                
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!documentVerified}
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm mb-4">
                Please provide your location. This will be used to match you with relevant political posts.
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    placeholder="Enter your country"
                    value={location.country}
                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="Enter your city"
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={detectLocation}
                disabled={loading}
                className="w-full flex items-center justify-center border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Detecting...
                  </span>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Detect My Location
                  </>
                )}
              </button>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !location.country || !location.city}
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : "Complete Registration"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
