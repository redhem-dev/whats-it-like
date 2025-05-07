import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar'; // Import SearchBar component

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  
  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.personalInfo) return '?';
    const { firstName, lastName } = user.personalInfo;
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user.email ? user.email.charAt(0).toUpperCase() : '?';
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
