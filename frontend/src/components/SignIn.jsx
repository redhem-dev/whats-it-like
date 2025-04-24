import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // TODO: Connect to backend login API
      // const response = await fetch('/api/auth/signin', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email, password }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to sign in');
      // }
      
      // const data = await response.json();
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));
      // window.location.href = '/dashboard';
      
      // Simulating API call
      setTimeout(() => {
        setLoading(false);
        // Uncomment for testing error state
        // setError("Invalid email or password. Please try again.");
      }, 1000);
    } catch (err) {
      setError(err.message || "An error occurred during sign in");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Trigger Google OAuth2 flow
    // window.location.href = '/api/auth/google';
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // TODO: Connect to backend password reset API
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email: resetEmail }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to request password reset');
      // }
      
      // Simulating API call
      setTimeout(() => {
        setLoading(false);
        setResetSuccess(true);
      }, 1000);
    } catch (err) {
      setError(err.message || "An error occurred during password reset request");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">What's It Like?</h1>
            <p className="mt-2 text-gray-600">Share political opinions in your region</p>
          </div>

          {!showResetForm ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign In</h2>
              
              <form onSubmit={handleSignIn} className="space-y-4">
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
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : "Sign In"}
                </button>
                
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-300 absolute w-full"></div>
                  <div className="bg-white px-3 relative text-sm text-gray-500">or continue with</div>
                </div>
                
                <button
                  type="button"
                  className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.787-1.676-4.139-2.701-6.735-2.701-5.522 0-10.002 4.48-10.002 10.002s4.48 10.002 10.002 10.002c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.077z" fill="#FFC107"/>
                    <path d="M12.545 10.239l-9.426 0.077c-0.293 1.436 0.107 2.949 0.775 4.221l8.65-0.099v-4.199z" fill="#FF3D00"/>
                    <path d="M12.545 10.239v4.199l8.65 0.099c-0.768-2.13-2.742-3.573-5.003-3.882l-3.647-0.416z" fill="#4CAF50"/>
                    <path d="M3.894 14.537c1.336 2.604 4.027 4.38 7.097 4.38 2.798 0 4.733-1.658 5.445-3.972l-8.65-0.099-3.892-0.309z" fill="#1976D2"/>
                  </svg>
                  Sign in with Google
                </button>
              </form>
              
              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Sign Up
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Reset Password</h2>
              
              {resetSuccess ? (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
                    Password reset link has been sent to your email address.
                  </div>
                  <button
                    onClick={() => {
                      setShowResetForm(false);
                      setResetSuccess(false);
                      setResetEmail("");
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="resetEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      We'll send you a link to reset your password.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back to Sign In
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
