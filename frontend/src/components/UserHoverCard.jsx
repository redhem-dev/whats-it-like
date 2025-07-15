import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../services/api';

const UserHoverCard = ({ userId, userName, userEmail, children, userData: propUserData, reputation: propReputation, showAsProfile = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Use provided data or fetch if needed
  useEffect(() => {
    if (propUserData && propReputation) {
      // Use provided data for profile display
      const formattedData = {
        userId: propUserData.id,
        name: `${propUserData.firstName || ''} ${propUserData.lastName || ''}`.trim() || propUserData.email,
        email: propUserData.email,
        memberSince: propUserData.createdAt,
        reputation: {
          score: propReputation.score || propUserData.reputation || 50,
          total: propReputation.totalVotes || 0,
          upvotes: propReputation.upvotes || 0,
          downvotes: propReputation.downvotes || 0,
          correctVotes: propReputation.correctVotes || 0
        }
      };
      setUserData(formattedData);
    }
  }, [propUserData, propReputation]);

  // Function to fetch user reputation data
  const fetchUserData = async () => {
    if (!userId || propUserData) {
      return; // Don't fetch if we already have data
    }
    
    console.log(`UserHoverCard: Fetching data for user ID: ${userId}`);
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('UserHoverCard: No auth token available');
        setError('Authentication required');
        return;
      }
      
      // Use the appropriate endpoint based on whether we have a userId
      const url = userId 
        ? `${API_URL}/api/auth/user/${userId}/reputation` 
        : `${API_URL}/api/auth/reputation`;
      console.log(`UserHoverCard: Fetching from URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('UserHoverCard: API error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch user data');
      }
      
      const data = await response.json();
      console.log('UserHoverCard: Received user data:', data);
      setUserData(data);
    } catch (err) {
      console.error('UserHoverCard: Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle mouse enter with delay to prevent flickering
  const handleMouseEnter = () => {
    if (showAsProfile) return; // Don't show hover card in profile mode
    
    const timeout = setTimeout(() => {
      setIsHovering(true);
      if (!userData && !loading && !propUserData) {
        fetchUserData();
      }
    }, 300); // 300ms delay before showing
    
    setHoverTimeout(timeout);
  };

  // Handle mouse leave with cleanup
  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsHovering(false);
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (userName) {
      const nameParts = userName.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (nameParts[0]) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    if (userEmail) {
      return userEmail.substring(0, 2).toUpperCase();
    }
    
    return 'UN';
  };

  // Show as profile card if in profile mode
  if (showAsProfile && userData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
              {getInitials()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {userData.name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-600">{userData.email}</p>
            {userData.memberSince && (
              <p className="text-xs text-gray-500 mt-1">
                Member since {new Date(userData.memberSince).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold text-gray-900">
                {userData.reputation?.score || 50}/100
              </span>
              <span className="text-sm text-gray-500 ml-1">reputation</span>
            </div>
            <div className="flex space-x-4 text-sm">
              <div className="text-green-600">
                <span className="font-medium">{userData.reputation?.correctVotes || 0}</span> correct
              </div>
              <div className="text-gray-600">
                <span className="font-medium">{userData.reputation?.total || 0}</span> total votes
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isHovering && (
        <div className="absolute z-50 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                {getInitials()}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${userId}`} className="text-sm font-medium text-gray-900 hover:underline">
                {userName || userData?.name || 'Unknown User'}
              </Link>
              {loading ? (
                <p className="text-sm text-gray-500">Loading reputation data...</p>
              ) : error ? (
                <p className="text-sm text-red-500">Error loading data</p>
              ) : userData ? (
                <div className="mt-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{userData.reputation?.score || 50}/100</span>
                    <span className="ml-1">reputation</span>
                  </div>
                  <div className="mt-1 flex space-x-4 text-xs">
                    <div className="text-green-600">
                      <span className="font-medium">{userData.reputation?.correctVotes || 0}</span> correct
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{userData.reputation?.total || 0}</span> total
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No reputation data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

export default UserHoverCard;
