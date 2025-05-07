import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Login successful - redirect to home or dashboard
        navigate("/");  // Change this to your dashboard route later
      } else {
        setError(result.error || "Failed to sign in. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleGoogleSignIn = () => {
    // This will redirect to Google OAuth
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

          <h2 className="text-2xl font-semibold text-black mb-6 text-center">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignIn} className="space-y-4">
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
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-black">
                  Password
                </label>
                {/* Password reset disabled for MVP
                <button 
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot password?
                </button>
                */}
              </div>
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-2 rounded hover:bg-zinc-800 transition-colors"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
            
            {/* Divider */}
            <div className="relative flex items-center justify-center mt-6 mb-6">
              <div className="border-t border-zinc-300 w-full"></div>
              <span className="bg-zinc-100 px-3 text-sm text-zinc-500 absolute">OR</span>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-black text-black font-semibold py-2 rounded hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.2 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.5 0 4.8.8 6.7 2.2l6.4-6.4C33.2 5.2 28.8 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.3-.1-2.1-.3-3z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.6 17 19.5 14 24 14c2.5 0 4.8.8 6.7 2.2l6.4-6.4C33.2 5.2 28.8 3.5 24 3.5c-7.4 0-13.7 4.7-16.4 11.2z"/><path fill="#FBBC05" d="M24 44.5c5.8 0 10.7-1.9 14.2-5.1l-6.6-5.4c-2 1.4-4.5 2.3-7.6 2.3-5.8 0-10.7-3.9-12.4-9.1l-7 5.4C7.1 39.7 14.9 44.5 24 44.5z"/><path fill="#EA4335" d="M44.5 24c0-1.3-.1-2.1-.3-3H24v8.5h11.7c-1.2 3.3-4.5 6.5-11.7 6.5-5.8 0-10.7-3.9-12.4-9.1l-7 5.4C7.1 39.7 14.9 44.5 24 44.5c7.4 0 13.7-4.7 16.4-11.2z"/></g></svg>
              Sign in with Google
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-zinc-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
