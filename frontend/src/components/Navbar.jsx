import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar'; // Import SearchBar component

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [cachedInitials, setCachedInitials] = useState(localStorage.getItem('userInitials') || 'JD');
  
  // Effect to update cached initials when user changes
  useEffect(() => {
    // Try from direct user prop first
    if (user && (user.firstName || user.lastName || user.email || 
               (user.personalInfo && (user.personalInfo.firstName || user.personalInfo.lastName)))) {
      const initials = getUserInitials(user);
      if (initials !== '?' && initials !== 'JD') {
        localStorage.setItem('userInitials', initials);
        setCachedInitials(initials);
      }
    } 
    // If no user prop, try from localStorage
    else {
      const cachedUser = localStorage.getItem('userData');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser) {
            const initials = getUserInitials(parsedUser);
            if (initials !== '?' && initials !== 'JD') {
              localStorage.setItem('userInitials', initials);
              setCachedInitials(initials);
            }
          }
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
        }
      }
    }
  }, [user]);
  
  // Function to get user initials from any user object
  const getUserInitials = (userData) => {
    if (!userData) {
      return 'JD';
    }
    
    // Try to get first and last name from all possible locations
    const firstName = userData.firstName || 
                     (userData.personalInfo && userData.personalInfo.firstName) || 
                     (userData.user && userData.user.firstName) || 
                     (userData.user && userData.user.personalInfo && userData.user.personalInfo.firstName) || 
                     '';
                     
    const lastName = userData.lastName || 
                    (userData.personalInfo && userData.personalInfo.lastName) || 
                    (userData.user && userData.user.lastName) || 
                    (userData.user && userData.user.personalInfo && userData.user.personalInfo.lastName) || 
                    '';
    
    // If we have both first and last name
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    // If we only have first name
    if (firstName) {
      return `${firstName.charAt(0)}`.toUpperCase();
    }
    
    // Fall back to email from all possible locations
    const email = userData.email || 
                 (userData.user && userData.user.email) || 
                 '';
                 
    if (email) {
      const emailParts = email.split('@');
      if (emailParts.length > 1) {
        // Try to get first two characters of the email username
        return emailParts[0].substring(0, 2).toUpperCase();
      }
      return email.charAt(0).toUpperCase();
    }
    
    // Default value that's better than '?'
    return 'JD';
  };

  return (
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Left: Logo/Brand */}
        <div className="flex-shrink-0">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-blue-600 font-bold text-xl">What's it like?</span>
            <span className="ml-2 text-gray-600 text-sm font-medium">True Media</span>
          </Link>
        </div>

        {/* Middle: Search */}
        <div className="flex-grow max-w-md mx-8">
          <SearchBar />
        </div>

        {/* Right: User Profile */}
        <div className="flex-shrink-0">
          <Link to="/profile" className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {user ? getUserInitials(user) : cachedInitials}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
