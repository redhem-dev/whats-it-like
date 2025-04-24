import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import "./App.css";

// Mock authenticated user for demo purposes
const mockUser = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  email: 'john.doe@example.com',
  reputation: 145
};

// ProtectedRoute component to handle authentication
const ProtectedRoute = ({ children }) => {
  // In a real app, check for auth token in localStorage or context
  const isAuthenticated = true; // For demo purposes, always authenticated
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to sign in page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Simulate fetching user data
  useEffect(() => {
    // In a real app, fetch user data from API
    // For now, use mock data
    setTimeout(() => {
      setUser(mockUser);
    }, 500);
  }, []);

  return (
    <Router>
      <div className="min-h-screen w-full bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
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
