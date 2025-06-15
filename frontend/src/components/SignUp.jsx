import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import IdVerification from "./IdVerification";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  // Proceed to ID verification step
  const proceedToVerification = (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Name validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }
    
    // ID number validation
    if (!idNumber.trim()) {
      setError("ID number is required for verification");
      return;
    }

    // Proceed to verification step
    setVerificationStep(true);
  };

  // Handle ID verification completion
  const handleVerificationComplete = (verified) => {
    setIsVerified(verified);
    
    if (verified) {
      // If verified, proceed with account creation
      handleSignUp();
    }
  };
  
  // Handle form submission for registration after verification
  const handleSignUp = async () => {
    try {
      const result = await signup(email, password, firstName, lastName, idNumber);
      
      if (result.success) {
        // Registration successful - redirect to signin
        navigate("/signin");
      } else {
        setError(result.error || "Failed to register. Please try again.");
        setVerificationStep(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setVerificationStep(false);
    }
  };

  // Handle Google sign up
  const handleGoogleSignUp = () => {
    // This will be implemented through the useAuth hook
    // Redirect will be handled by the hook
    window.location.href = "http://localhost:3000/auth/google";
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
            {verificationStep ? "ID Verification" : "Create Account"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          {!verificationStep ? (
            <form onSubmit={proceedToVerification} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-black mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-black mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-black mb-1">
                ID Number
              </label>
              <input
                id="idNumber"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black placeholder-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black w-full"
                placeholder="Enter your ID number"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-2 rounded hover:bg-zinc-800 transition-colors"
            >
              {loading ? "Creating Account..." : verificationStep ? "Complete Registration" : "Proceed to Verification"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mt-6 mb-6">
              <div className="border-t border-zinc-300 w-full"></div>
              <span className="bg-zinc-100 px-3 text-sm text-zinc-500 absolute">OR</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full bg-white border border-black text-black font-semibold py-2 rounded hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.2 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.5 0 4.8.8 6.7 2.2l6.4-6.4C33.2 5.2 28.8 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.3-.1-2.1-.3-3z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.6 17 19.5 14 24 14c2.5 0 4.8.8 6.7 2.2l6.4-6.4C33.2 5.2 28.8 3.5 24 3.5c-7.4 0-13.7 4.7-16.4 11.2z"/><path fill="#FBBC05" d="M24 44.5c5.8 0 10.7-1.9 14.2-5.1l-6.6-5.4c-2 1.4-4.5 2.3-7.6 2.3-5.8 0-10.7-3.9-12.4-9.1l-7 5.4C7.1 39.7 14.9 44.5 24 44.5z"/><path fill="#EA4335" d="M44.5 24c0-1.3-.1-2.1-.3-3H24v8.5h11.7c-1.2 3.3-4.5 6.5-11.7 6.5-5.8 0-10.7-3.9-12.4-9.1l-7 5.4C7.1 39.7 14.9 44.5 24 44.5c7.4 0 13.7-4.7 16.4-11.2z"/></g></svg>
              Sign up with Google
            </button>
          </form>
          ) : (
            <div className="id-verification-container">
              <IdVerification 
                onVerificationComplete={handleVerificationComplete} 
                formData={{firstName, lastName, idNumber}} 
              />
              <button
                onClick={() => setVerificationStep(false)}
                className="mt-4 w-full bg-zinc-300 text-black font-semibold py-2 rounded hover:bg-zinc-400 transition-colors"
              >
                Back to Registration
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-zinc-600">
              Already have an account?{" "}
              <Link to="/signin" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>


        </div>
      </div>
    </div>
  );
};

export default SignUp;
