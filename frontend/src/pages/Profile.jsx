import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

// Mock user data
const mockUser = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  email: 'john.doe@example.com',
  reputation: 145,
  locations: [
    {
      country: 'United States',
      city: 'New York',
      verified: true,
      verificationMethod: 'GPS'
    }
  ],
  documentVerified: true,
  emailVerified: true,
  status: 'active',
  createdAt: new Date('2024-12-15T10:30:00')
};

// Mock voted posts
const mockVotedPosts = [
  {
    _id: '1',
    title: 'Political Reform Needed in Our City',
    vote: 1, // upvote
    author: {
      _id: '101',
      personalInfo: {
        firstName: 'Alice',
        lastName: 'Johnson'
      }
    },
    location: {
      country: 'United States',
      city: 'New York'
    },
    votedAt: new Date('2025-04-21T14:30:00')
  },
  {
    _id: '2',
    title: 'Environmental Policies Should Be Prioritized',
    vote: 1, // upvote
    author: {
      _id: '102',
      personalInfo: {
        firstName: 'Robert',
        lastName: 'Smith'
      }
    },
    location: {
      country: 'Canada',
      city: 'Toronto'
    },
    votedAt: new Date('2025-04-22T09:45:00')
  },
  {
    _id: '3',
    title: 'Education System Needs Reform',
    vote: -1, // downvote
    author: {
      _id: '103',
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Williams'
      }
    },
    location: {
      country: 'United Kingdom',
      city: 'London'
    },
    votedAt: new Date('2025-04-23T11:15:00')
  }
];

const Profile = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [votedPosts, setVotedPosts] = useState(mockVotedPosts);
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    // If user is authenticated, use the real user data
    if (authUser) {
      // Format user data structure to match component expectations
      const formattedUser = {
        id: authUser.id || authUser._id,
        email: authUser.email,
        personalInfo: {
          firstName: authUser.personalInfo?.firstName || authUser.firstName || '',
          lastName: authUser.personalInfo?.lastName || authUser.lastName || ''
        },
        status: authUser.status,
        createdAt: authUser.createdAt,
        votes: authUser.votes || [],
        // Other properties that might be needed
        reputation: authUser.reputation || 0,
        locations: authUser.locations || [],
        documentVerified: authUser.documentVerified || false,
        emailVerified: authUser.emailVerified || false
      };
      setUser(formattedUser);
    } else {
      // Fall back to mock data only for development purposes
      setUser(mockUser);
    }
  }, [authUser]);

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to calculate member since
  const getMemberSince = () => {
    if (!user || !user.createdAt) return 'N/A';
    return formatDate(user.createdAt);
  };
  
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

  // Show loading state if user data is not yet loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white relative">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold mr-6">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.personalInfo?.firstName || ''} {user.personalInfo?.lastName || ''}</h1>
                <p className="text-blue-100">{user.email}</p>
                <div className="mt-2 flex items-center">
                  <div className="flex items-center mr-6">
                    <span className="font-semibold text-xl">{user.reputation || 0}</span>
                    <span className="ml-1 text-blue-100">Reputation</span>
                  </div>
                  <div className="text-blue-100">
                    Member since {getMemberSince()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add logout button */}
            <div className="absolute top-6 right-6">
              <button
                onClick={() => {
                  // Clear authentication
                  localStorage.removeItem('authToken');
                  // Redirect to sign in page
                  window.location.href = '/signin';
                }}
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
          
          {/* Profile Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('votes')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'votes'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Voting History
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'posts'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Posts
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 font-medium text-gray-900">{user.email}</p>
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-500">ID Document</p>
                      <p className="mt-1 font-medium text-gray-900">{user.documentVerified ? 'Verified' : 'Not Verified'}</p>
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.documentVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.documentVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Account Status</p>
                      <p className="mt-1 font-medium text-gray-900">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</p>
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'Active' : user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-500">Reputation Score</p>
                      <p className="mt-1 font-medium text-gray-900">{user.reputation} points</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Verified Locations</h3>
                  <ul className="mt-4 divide-y divide-gray-200">
                    {user.locations.map((location, index) => (
                      <li key={index} className="py-4 flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{location.city}, {location.country}</p>
                          <p className="text-sm text-gray-500">Verified via {location.verificationMethod}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {location.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'votes' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Voting History</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Post Title</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Author</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vote</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {votedPosts.map(post => (
                        <tr key={post._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{post.title}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {post.author.personalInfo.firstName} {post.author.personalInfo.lastName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              post.vote === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {post.vote === 1 ? 'Upvote' : 'Downvote'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(post.votedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'posts' && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't created any posts yet.</p>
                <div className="mt-6">
                  <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Create a new post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
