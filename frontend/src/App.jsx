import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TrendingPosts from "./pages/TrendingPosts";
import SinglePostPage from "./pages/SinglePostPage";
import NewPost from "./pages/NewPost";
import SearchResults from "./pages/SearchResults";
import AuthCallback from "./components/AuthCallback";
import "./App.css";

// ProtectedRoute component to handle authentication
const ProtectedRoute = ({ children }) => {
  // Check for authentication token in localStorage
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to sign in page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Fetch user data if authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Fetch user data from API
      fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch user data');
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        // If token is invalid, remove it
        if (error.message === 'Invalid token') {
          localStorage.removeItem('authToken');
        }
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen w-full bg-white">
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
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
    </Router>
  );
}

export default App;
