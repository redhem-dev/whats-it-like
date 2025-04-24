import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search functionality to be implemented');
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
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for opinions..."
              className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
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
