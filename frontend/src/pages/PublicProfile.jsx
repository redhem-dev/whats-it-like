import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import ProfileForm from '../components/ProfileForm';
import ReputationCard from '../components/ReputationCard';
import UserHoverCard from '../components/UserHoverCard';
import { API_URL } from '../services/api';

const PublicProfile = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const { userId: profileUserId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [votesLoading, setVotesLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [reputation, setReputation] = useState(null);

  // Check if this is the user's own profile
  useEffect(() => {
    if (authUser?.user && profileUserId) {
      const userId = authUser.user.id || authUser.user._id;
      setIsOwnProfile(userId === profileUserId);
    } else if (!profileUserId) {
      setIsOwnProfile(true);
    }
  }, [authUser, profileUserId]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/signin');
          return;
        }

        let targetUserId = profileUserId;
        
        // If no profileUserId, this is the user's own profile
        if (!profileUserId) {
          if (authUser?.user) {
            targetUserId = authUser.user.id || authUser.user._id || authUser.user.userId;
            setIsOwnProfile(true);
            console.log('Using authUser for own profile:', authUser, 'targetUserId:', targetUserId);
          } else {
            console.error('No authUser available:', authUser);
            throw new Error('User not authenticated');
          }
        }

        if (!targetUserId) {
          console.error('No targetUserId determined:', { profileUserId, authUser, targetUserId });
          throw new Error('Unable to determine user ID');
        }

        console.log('Fetching profile for user:', targetUserId, 'isOwnProfile:', isOwnProfile);
        
        // Use different endpoints for own profile vs other users
        const apiEndpoint = isOwnProfile || !profileUserId 
          ? `${API_URL}/api/auth/reputation`
          : `${API_URL}/api/auth/user/${targetUserId}/reputation`;
          
        console.log('API endpoint:', apiEndpoint);
        
        // Fetch user reputation and basic data
        const response = await fetch(apiEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('Received user data:', userData);
        
        // Handle different response structures for own profile vs other user profile
        let formattedUser;
        if (isOwnProfile || !profileUserId) {
          // Own profile endpoint response structure
          formattedUser = {
            id: authUser?.user?.id || authUser?.user?._id || authUser?.user?.userId,
            email: authUser?.user?.email || userData.email,
            firstName: authUser?.user?.firstName || authUser?.user?.personalInfo?.firstName || (userData.name ? userData.name.split(' ')[0] : ''),
            lastName: authUser?.user?.lastName || authUser?.user?.personalInfo?.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : ''),
            personalInfo: {
              firstName: authUser?.user?.firstName || authUser?.user?.personalInfo?.firstName || (userData.name ? userData.name.split(' ')[0] : ''),
              lastName: authUser?.user?.lastName || authUser?.user?.personalInfo?.lastName || (userData.name ? userData.name.split(' ').slice(1).join(' ') : '')
            },
            createdAt: authUser?.user?.createdAt || userData.memberSince,
            reputation: userData.reputation?.score || 50,
            documentVerified: true // Always show as verified
          };
        } else {
          // Other user profile endpoint response structure
          formattedUser = {
            id: userData.userId || targetUserId,
            email: userData.email,
            firstName: userData.name ? userData.name.split(' ')[0] : '',
            lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : '',
            personalInfo: {
              firstName: userData.name ? userData.name.split(' ')[0] : '',
              lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : ''
            },
            createdAt: userData.memberSince,
            reputation: userData.reputation?.score || 50,
            documentVerified: true // Always show as verified
          };
        }
        
        console.log('Formatted user:', formattedUser);
        setUser(formattedUser);
        setReputation(userData.reputation);
        
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [profileUserId, authUser, navigate, isAuthenticated]);

  // Fetch user posts
  const fetchUserPosts = async () => {
    if (!user?.id) return;
    
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isOwnProfile 
        ? `${API_URL}/api/auth/my-posts`
        : `${API_URL}/api/auth/user/${user.id}/posts`;
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
      }
      
      const data = await response.json();
      setUserPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch user votes
  const fetchUserVotes = async () => {
    if (!user?.id) return;
    
    setVotesLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isOwnProfile 
        ? `${API_URL}/api/auth/votes`
        : `${API_URL}/api/auth/user/${user.id}/votes`;
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user votes');
      }
      
      const data = await response.json();
      setUserVotes(data.votes || []);
    } catch (err) {
      console.error('Error fetching user votes:', err);
    } finally {
      setVotesLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts();
    } else if (activeTab === 'votes') {
      fetchUserVotes();
    }
  }, [activeTab, user, isOwnProfile]);

  // Delete post function for own posts
  const handleDeletePost = async (postId) => {
    if (!isOwnProfile) return;
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete post');
        }
        
        // Remove post from local state
        setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to view profiles.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              {user?.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userName}
                {isOwnProfile && <span className="text-sm text-gray-500 ml-2">(You)</span>}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              {user?.createdAt && (
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Reputation Display */}
          {reputation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold text-gray-900">
                    Reputation: {reputation.score || 50}/100
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {reputation.correctVotes || 0} correct out of {reputation.totalVotes || 0} votes
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isOwnProfile ? 'My Profile' : 'Profile'}
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'posts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('votes')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'votes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Voting History
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('reputation')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'reputation'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reputation
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'profile' && (
            <div>
              {isOwnProfile ? (
                <ProfileForm user={user} onUserUpdate={setUser} />
              ) : (
                <div className="text-center py-8">
                  <UserHoverCard 
                    userData={user} 
                    reputation={reputation}
                    showAsProfile={true}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {isOwnProfile ? 'My Posts' : `${userName}'s Posts`}
              </h2>
              {postsLoading ? (
                <div className="text-center py-8">Loading posts...</div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isOwnProfile ? 'You haven\'t created any posts yet.' : 'This user hasn\'t created any posts yet.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div key={post._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/post/${post._id}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {post.title}
                          </Link>
                          <p className="text-gray-600 mt-2 line-clamp-3">{post.content}</p>
                          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <span>{post.location?.city}, {post.location?.country}</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                {post.votes?.upvotes || 0}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-red-600 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                {post.votes?.downvotes || 0}
                              </span>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'votes' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {isOwnProfile ? 'My Voting History' : `${userName}'s Voting History`}
              </h2>
              {votesLoading ? (
                <div className="text-center py-8">Loading voting history...</div>
              ) : userVotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isOwnProfile ? 'You haven\'t voted on any posts yet.' : 'This user hasn\'t voted on any posts yet.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {userVotes.map((vote) => (
                    <div key={vote._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/post/${vote.postId}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {vote.title}
                          </Link>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4">
                              <span className={`flex items-center px-2 py-1 rounded text-sm ${
                                vote.vote === 1 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {vote.vote === 1 ? '👍 Upvoted' : '👎 Downvoted'}
                              </span>
                              {vote.correctVote !== undefined && (
                                <span className={`px-2 py-1 rounded text-sm ${
                                  vote.correctVote 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {vote.correctVote ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(vote.votedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            {vote.location?.city}, {vote.location?.country}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reputation' && isOwnProfile && (
            <div>
              <ReputationCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
