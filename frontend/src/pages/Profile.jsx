import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import ProfileForm from '../components/ProfileForm';
import ReputationCard from '../components/ReputationCard';
import MyPosts from '../components/MyPosts';
import { API_URL } from '../services/api';



const Profile = ({ user: propsUser }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const { userId: profileUserId } = useParams(); // Get userId from URL if available
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [votedPosts, setVotedPosts] = useState([]);
  const [votesLoading, setVotesLoading] = useState(true);
  const [votesError, setVotesError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // Fetch user profile data based on URL or authenticated user
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no profileUserId in URL, use authenticated user
        if (!profileUserId) {
          const sourceUser = propsUser || authUser;
          setIsOwnProfile(true);
          
          if (sourceUser) {
            // Format user data structure to match component expectations
            const formattedUser = {
              id: sourceUser.id || sourceUser._id,
              email: sourceUser.email,
              firstName: sourceUser.firstName || sourceUser.personalInfo?.firstName || '',
              lastName: sourceUser.lastName || sourceUser.personalInfo?.lastName || '',
              personalInfo: {
                firstName: sourceUser.firstName || sourceUser.personalInfo?.firstName || '',
                lastName: sourceUser.lastName || sourceUser.personalInfo?.lastName || ''
              },
              bio: sourceUser.bio || '',
              profession: sourceUser.profession || '',
              interests: sourceUser.interests || [],
              location: sourceUser.location || { country: '', city: '' },
              status: sourceUser.status || 'active',
              createdAt: sourceUser.createdAt,
              votes: sourceUser.votes || [],
              reputation: sourceUser.reputation || 0,
              locations: sourceUser.locations || [],
              documentVerified: true, // Always mark as verified
              emailVerified: sourceUser.emailVerified || false
            };
            
            setUser(formattedUser);
          }
        } else {
          // Fetch other user's profile
          setIsOwnProfile(false);
          
          const token = localStorage.getItem('authToken');
          if (!token) {
            navigate('/signin');
            return;
          }
          
          const response = await fetch(`${API_URL}/api/auth/user/${profileUserId}/reputation`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }
          
          const userData = await response.json();
          
          // Format user data structure
          const formattedUser = {
            id: userData.userId,
            email: userData.email,
            firstName: userData.name ? userData.name.split(' ')[0] : '',
            lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : '',
            personalInfo: {
              firstName: userData.name ? userData.name.split(' ')[0] : '',
              lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : ''
            },
            createdAt: userData.memberSince,
            reputation: userData.reputation?.score || 50
          };
          
          setUser(formattedUser);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [profileUserId, authUser, propsUser, navigate]);
  
  // Fetch user's voting history
  useEffect(() => {
    const fetchVotingHistory = async () => {
      if (!user || !user.id) return;
      
      setVotesLoading(true);
      setVotesError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setVotesError('Authentication required');
          setVotesLoading(false);
          return;
        }

        // Use appropriate endpoint based on whether viewing own profile or another user's profile
        const endpoint = isOwnProfile 
          ? `${API_URL}/api/auth/votes`
          : `${API_URL}/api/auth/user/${user.id}/votes`;
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch voting history');
        }
        
        const data = await response.json();
        setVotedPosts(data.votes || []);
      } catch (err) {
        console.error('Error fetching voting history:', err);
        setVotesError(err.message || 'An error occurred while fetching your voting history');
      } finally {
        setVotesLoading(false);
      }
    };
    
    if (activeTab === 'votes') {
      fetchVotingHistory();
    }
  }, [user, activeTab]);

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to get initials from name or email
  const getInitials = (email) => {
    if (!email) return 'UN';
    return email.substring(0, 2).toUpperCase();
  };

  // Function to calculate member since
  const getMemberSince = () => {
    if (!user || !user.createdAt) return 'N/A';
    return formatDate(user.createdAt);
  };
  
  // Function to get user initials - consistent with existing implementation
  const getUserInitials = () => {
    if (!user) return '?';
    
    // If user has first and last name
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    // If only first name exists
    if (user.firstName) {
      return `${user.firstName.charAt(0)}`.toUpperCase();
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
      <Navbar user={authUser} />
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white relative">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold mr-6">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.firstName || ''} {user.lastName || ''}</h1>
                {isOwnProfile && <p className="text-blue-100">{user.email}</p>}
                <div className="mt-2 flex items-center">
                  <div className="text-blue-100">
                    Member since {getMemberSince()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="absolute top-6 right-6">
              {isOwnProfile ? (
                <button
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    window.location.href = '/signin';
                  }}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              )}
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
              
              {isOwnProfile && (
                <>
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
                </>
              )}
              
              {!isOwnProfile && (
                <>
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
                    User Posts
                  </button>
                </>
              )}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{isOwnProfile ? 'Account Information' : 'User Information'}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="mt-1 font-medium text-gray-900">{user.firstName || ''} {user.lastName || ''}</p>
                      </div>
                      
                      {isOwnProfile && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="mt-1 font-medium text-gray-900">{user.email}</p>
                            <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.emailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                          
                          {user.location && (user.location.city || user.location.country) && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Location</p>
                              <p className="mt-1 font-medium text-gray-900">
                                {[user.location.city, user.location.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm font-medium text-gray-500">ID Document</p>
                            <p className="mt-1 font-medium text-gray-900">Identity Verification</p>
                            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Member Since</p>
                        <p className="mt-1 font-medium text-gray-900">{getMemberSince()}</p>
                      </div>
                      
                      {!isOwnProfile && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Reputation</p>
                          <p className="mt-1 font-medium text-gray-900">{user.reputation || 50}/100</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <ReputationCard userId={user.id} />
                </div>
              </div>
            )}
            {activeTab === 'votes' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{isOwnProfile ? 'Your Voting History' : 'User\'s Voting History'}</h2>
                
                {votesLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : votesError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
                    <p className="font-medium">Error loading voting history</p>
                    <p className="text-sm mt-1">{votesError}</p>
                    <button 
                      onClick={() => setActiveTab('votes')} 
                      className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : votedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {votedPosts.map(post => (
                      <div key={post._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link to={`/post/${post.postId}`} className="block">
                              <h3 className="font-medium hover:text-blue-600 cursor-pointer">{post.title}</h3>
                            </Link>
                            <div className="text-sm text-gray-500 mt-1">
                              <span>Posted by {post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || getInitials(post.author.email) : 'Unknown'} • </span>
                              <span>{post.location?.city || 'Unknown'}, {post.location?.country || 'Unknown'}</span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-sm font-medium ${post.vote === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {post.vote === 1 ? 'Upvoted' : 'Downvoted'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Voted on {post.votedAt ? formatDate(post.votedAt) : 'Unknown date'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No votes yet</h3>
                    <p className="mt-1 text-sm text-gray-500">{isOwnProfile ? "You haven't voted on any posts yet." : "This user hasn't voted on any posts yet."}</p>
                    <div className="mt-6">
                      <a href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Browse Posts
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'posts' && (
              <MyPosts userId={user.id} isOwnProfile={isOwnProfile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
