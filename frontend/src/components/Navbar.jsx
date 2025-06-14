import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar'; // Import SearchBar component

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  
  // Function to get user initials
  const getUserInitials = () => {
    if (!user) return '?';
    
    // If user has personalInfo with first and last name
    if (user.personalInfo && user.personalInfo.firstName && user.personalInfo.lastName) {
      return `${user.personalInfo.firstName.charAt(0)}${user.personalInfo.lastName.charAt(0)}`.toUpperCase();
    }
    
    // If only first name exists
    if (user.personalInfo && user.personalInfo.firstName) {
      return `${user.personalInfo.firstName.charAt(0)}`.toUpperCase();
    }
    
    // Fall back to email
    if (user.email) {
      const emailParts = user.email.split('@');
      if (emailParts.length > 1) {
        // Try to get first two characters of the email username
        return emailParts[0].substring(0, 2).toUpperCase();
      }
      return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
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
              {getUserInitials()}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
