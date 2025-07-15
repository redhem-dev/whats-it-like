import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { API_URL } from "./services/api";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import GoogleIdVerification from "./components/GoogleIdVerification";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TrendingPosts from "./pages/TrendingPosts";
import SinglePostPage from "./pages/SinglePostPage";
import NewPost from "./pages/NewPost";
import SearchResults from "./pages/SearchResults";
import EmailVerification from "./pages/EmailVerification";
import AuthCallback from "./components/AuthCallback";
import { LocationProvider } from "./contexts/LocationContext";
import "./App.css";

// ProtectedRoute component to handle authentication and verification
const ProtectedRoute = ({ children }) => {
  // Check for authentication token in localStorage
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const location = useLocation();
  
  // Get user data to check email verification status
  const userData = localStorage.getItem('userData');
  let emailVerified = false;
  
  if (userData) {
    try {
      const parsedUserData = JSON.parse(userData);
      emailVerified = parsedUserData.emailVerified === true;
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
    }
  }

  if (!isAuthenticated) {
    // Redirect to sign in page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  
  // Check if this user needs email verification (new registration)
  // We'll only redirect if:
  // 1. The user data exists (they're logged in)
  // 2. Email is specifically marked as NOT verified (emailVerified === false)
  // 3. We're not already on the verification page
  if (userData && emailVerified === false && !location.pathname.includes('/verify-email')) {
    console.log('Email verification needed, redirecting to verification page');
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Fetch user data if authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('Auth token from localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      // Fetch user data from API
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        console.log('API response status:', response.status);
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      })
      .then(userData => {
        console.log('User data received:', userData);
        // The backend returns user data inside a 'user' property
        if (userData && userData.user) {
          console.log('Setting user state with:', userData.user);
          
          // Store user data in state
          setUser(userData.user);
          
          // Format user data for consistent structure
          const formattedUser = {
            id: userData.user.id || userData.user._id,
            email: userData.user.email,
            firstName: userData.user.firstName || userData.user.personalInfo?.firstName || '',
            lastName: userData.user.lastName || userData.user.personalInfo?.lastName || '',
            personalInfo: {
              firstName: userData.user.firstName || userData.user.personalInfo?.firstName || '',
              lastName: userData.user.lastName || userData.user.personalInfo?.lastName || ''
            },
            status: userData.user.status || 'active',
            reputation: userData.user.reputation || 0,
            emailVerified: userData.user.emailVerified || false
          };
          
          // Store in localStorage for persistence
          localStorage.setItem('userData', JSON.stringify(formattedUser));
          
          // Store initials for avatar consistency
          if (formattedUser.firstName && formattedUser.lastName) {
            const initials = `${formattedUser.firstName.charAt(0)}${formattedUser.lastName.charAt(0)}`.toUpperCase();
            localStorage.setItem('userInitials', initials);
          } else if (formattedUser.email) {
            const emailParts = formattedUser.email.split('@');
            const emailInitial = emailParts.length > 1 ? 
              emailParts[0].substring(0, 2).toUpperCase() : 
              formattedUser.email.charAt(0).toUpperCase();
            localStorage.setItem('userInitials', emailInitial);
          }
        } else {
          console.error('Invalid user data structure:', userData);
          
          // Try to recover from localStorage if available
          const cachedUser = localStorage.getItem('userData');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              console.log('Recovered user data from localStorage');
            } catch (e) {
              console.error('Failed to parse cached user data:', e);
            }
          }
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        // If token is invalid, remove it
        if (error.message.includes('Invalid token') || error.message.includes('401')) {
          localStorage.removeItem('authToken');
        }
        
        // Try to recover from localStorage if available
        const cachedUser = localStorage.getItem('userData');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            console.log('Recovered user data from localStorage after fetch error');
          } catch (e) {
            console.error('Failed to parse cached user data:', e);
          }
        }
      });
    }
  }, []);

  return (
    <Router>
      <LocationProvider>
        <div className="min-h-screen w-full bg-white">
          <Routes>
            {/* Public routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-id" element={<GoogleIdVerification />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/search" element={<SearchResults />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <Profile user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trending" 
              element={
                <ProtectedRoute>
                  <TrendingPosts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post/:postId" 
              element={
                <ProtectedRoute>
                  <SinglePostPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/new-post" 
              element={
                <ProtectedRoute>
                  <NewPost />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </LocationProvider>
    </Router>
  );
}

export default App;
