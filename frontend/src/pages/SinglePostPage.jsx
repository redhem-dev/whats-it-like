import React, { useState, useEffect, useContext } from 'react';
import { API_URL } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserHoverCard from '../components/UserHoverCard';
import useAuth from '../hooks/useAuth';
import { LocationContext } from '../contexts/LocationContext';
import MockAd from '../components/ads/MockAd';

const SinglePostPage = () => {
  const { postId } = useParams();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyError, setReplyError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  
  // Format user data from auth context
  useEffect(() => {
    if (authUser) {
      // Ensure all necessary fields for Navbar to properly display initials
      const formattedUser = {
        ...authUser,
        id: authUser.id || authUser._id,
        email: authUser.email || '',
        // Make sure firstName and lastName are available at both root and personalInfo levels
        firstName: authUser.personalInfo?.firstName || authUser.firstName || '',
        lastName: authUser.personalInfo?.lastName || authUser.lastName || '',
        personalInfo: {
          ...(authUser.personalInfo || {}),
          firstName: authUser.personalInfo?.firstName || authUser.firstName || '',
          lastName: authUser.personalInfo?.lastName || authUser.lastName || ''
        },
        status: authUser.status || '',
        reputation: authUser.reputation || { score: 50 }
      };
      setUser(formattedUser);
    }
  }, [authUser]);

  // Get current user ID from localStorage if available
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (e) {
        console.error('Error extracting user ID from token:', e);
      }
    }
  }, []);

  // Fetch post data based on postId
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        
        // Get authentication token for protected endpoints
        const token = localStorage.getItem('authToken');
        
        // Set up request headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Make the API request
        const response = await fetch(`${API_URL}/api/posts/${postId}`, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const postData = await response.json();
        
        // Format the post data to match our component's expected structure
        const formattedPost = {
          ...postData,
          author: {
            _id: postData.authorId._id,
            personalInfo: {
              firstName: postData.authorId.firstName || 'Anonymous',
              lastName: postData.authorId.lastName || 'User'
            },
            email: postData.authorId.email
          },
          // Explicitly preserve the userVote field
          userVote: postData.userVote || 0
        };
        
        setPost(formattedPost);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch replies for this post
    const fetchReplies = async () => {
      try {
        setRepliesLoading(true);
        
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/posts/${postId}/replies`, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch replies');
        }
        
        const data = await response.json();
        
        // Format replies to match our component's expected structure
        const formattedReplies = data.replies.map(reply => ({
          ...reply,
          author: {
            _id: reply.authorId._id,
            personalInfo: {
              firstName: reply.authorId.firstName || 'Anonymous',
              lastName: reply.authorId.lastName || 'User'
            },
            email: reply.authorId.email
          },
          // Explicitly preserve the userVote field
          userVote: reply.userVote || 0
        }));
        
        setReplies(formattedReplies);
        setReplyError(null);
      } catch (err) {
        console.error('Error fetching replies:', err);
        setReplyError('Failed to load replies. Please try again later.');
      } finally {
        setRepliesLoading(false);
      }
    };
    
    if (postId) {
      fetchPostData();
      fetchReplies();
    }
  }, [postId]);

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to handle voting on post
  const handlePostVote = async (voteType) => {
    if (!currentUserId) {
      setError('You must be logged in to vote');
      return;
    }
    
    // Verify user location before allowing vote
    if (!locationVerified) {
      try {
        // Attempt to verify location
        setError('Verifying your location...');
        const locationAllowed = await verifyLocation();
        
        if (!locationAllowed) {
          setError('Voting is only allowed for users physically located in Bosnia and Herzegovina.');
          return;
        }
      } catch (error) {
        console.error('Location verification failed:', error);
        setError('Location verification failed. Voting is only allowed for users physically located in Bosnia and Herzegovina.');
        return;
      }
    }

    // Save current vote state to revert if API call fails
    const previousVote = post.userVote;
    const voteValue = voteType === 'upvote' ? 1 : -1;
    
    // Check if the user is trying to remove their vote by clicking the same option
    let finalVoteValue = voteValue;
    if ((voteType === 'upvote' && post.userVote === 1) || 
        (voteType === 'downvote' && post.userVote === -1)) {
      finalVoteValue = 0; // Remove vote
    }
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType: finalVoteValue })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle location verification error
        if (response.status === 403 && errorData.locationRequired) {
          setError('Voting is only allowed for users physically located in Bosnia and Herzegovina.');
          return;
        }
        
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      // Use the vote response to update the post
      const result = await response.json();
      
      // Clear any error messages on successful vote
      setError('');
      
      setPost(prevPost => ({
        ...prevPost,
        votes: {
          ...prevPost.votes,
          upvotes: result.upvotes,
          downvotes: result.downvotes
        },
        userVote: result.userVote
      }));
      
    } catch (error) {
      console.error('Error voting on post:', error);
      setError('Failed to register your vote. Please try again.');
    }
  };

  // Function to handle voting on reply
  // Get location context for verification
  const { locationVerified, verifyLocation } = useContext(LocationContext);

  const handleReplyVote = async (replyId, voteType) => {
    if (!currentUserId) {
      setReplyError('You must be logged in to vote');
      return;
    }

    // Verify user location before allowing vote
    if (!locationVerified) {
      try {
        // Attempt to verify location
        setReplyError('Verifying your location...');
        const locationAllowed = await verifyLocation();
        
        if (!locationAllowed) {
          setReplyError('Voting is only allowed for users physically located in Bosnia and Herzegovina.');
          return;
        }
      } catch (error) {
        console.error('Location verification failed:', error);
        setReplyError('Location verification failed. Voting is only allowed for users physically located in Bosnia and Herzegovina.');
        return;
      }
    }

    // Find the reply
    const reply = replies.find(r => r._id === replyId);
    if (!reply) return;
    
    // Save previous vote for revert if needed
    const previousVote = reply.userVote;
    const voteValue = voteType === 'upvote' ? 1 : -1;
    
    // Check if the user is trying to remove their vote by clicking the same option
    let finalVoteValue = voteValue;
    if ((voteType === 'upvote' && reply.userVote === 1) || 
        (voteType === 'downvote' && reply.userVote === -1)) {
      finalVoteValue = 0; // Remove vote
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/replies/${replyId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType: finalVoteValue })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle location verification error
        if (response.status === 403 && errorData.locationRequired) {
          setReplyError('Voting is only allowed for users physically located in Bosnia and Herzegovina.');
          return;
        }
        
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      // Use the vote response to update just this reply
      const result = await response.json();
      
      // Clear any error messages on successful vote
      setReplyError('');
      
      setReplies(prevReplies => {
        return prevReplies.map(r => {
          if (r._id === replyId) {
            return {
              ...r,
              votes: {
                ...r.votes,
                upvotes: result.upvotes,
                downvotes: result.downvotes
              },
              userVote: result.userVote
            };
          }
          return r;
        });
      });
      
    } catch (error) {
      console.error('Error voting on reply:', error);
      setReplyError('Failed to register your vote. Please try again.');
    }
  };

  // Handle new reply submission
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!newReply.trim()) {
      setReplyError('Reply cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setReplyError('You must be logged in to reply');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newReply })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }
      
      const newReplyData = await response.json();
      
      // Format the new reply to match our component's expected structure
      const formattedNewReply = {
        ...newReplyData,
        author: {
          _id: newReplyData.authorId._id,
          personalInfo: {
            firstName: newReplyData.authorId.firstName || 'Anonymous',
            lastName: newReplyData.authorId.lastName || 'User'
          },
          email: newReplyData.authorId.email
        },
        // Explicitly preserve the userVote field
        userVote: newReplyData.userVote || 0
      };
      
      // Add the new reply to the list
      setReplies([formattedNewReply, ...replies]);
      setNewReply('');
      setReplyError(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyError('Failed to submit your reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to delete a post');
        return;
      }

      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Redirect to dashboard after successful deletion
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete your post. Please try again.');
    }
  };

  // Handle reply deletion
  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setReplyError('You must be logged in to delete a reply');
        return;
      }

      const response = await fetch(`${API_URL}/api/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      // Remove the deleted reply from the UI
      setReplies(replies.filter(reply => reply._id !== replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
      setReplyError('Failed to delete your reply. Please try again.');
    }
  };

  // Sort replies by date (newest first)
  const sortedReplies = [...replies].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Loading post...</h3>
            <p className="mt-1 text-sm text-gray-500">Please wait while we load the post details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{error || 'Post not found'}</h3>
            <p className="mt-1 text-sm text-gray-500">We couldn't load this post. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Top Banner Ad */}
        <MockAd type="banner" label="Article Banner Ad" />
        <div className="mb-6"></div>
        {/* Post */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>Posted by </span>
                  <UserHoverCard 
                    userId={post.authorId._id} 
                    userName={`${post.author.personalInfo.firstName} ${post.author.personalInfo.lastName}`}
                    userEmail={post.author.email}
                  >
                    <Link to={`/profile/${post.authorId._id}`} className="text-blue-600 hover:underline ml-1 mr-1">
                      {post.author.personalInfo.firstName} {post.author.personalInfo.lastName}
                    </Link>
                  </UserHoverCard>
                  <span className="mx-2">•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>{post.location.city}, {post.location.country}</span>
                </div>
                <div className="prose max-w-none mb-4">
                  {post.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Delete button for post owner */}
              {currentUserId && post.authorId._id === currentUserId && (
                <button
                  onClick={handleDeletePost}
                  className="text-red-500 hover:text-red-700"
                  title="Delete post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Post voting */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePostVote('upvote')}
                  className="p-1 rounded hover:bg-green-100"
                  aria-label="Upvote"
                  title="Upvote"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${post.userVote === 1 ? 'text-green-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-gray-600 font-medium">{post.votes.upvotes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePostVote('downvote')}
                  className="p-1 rounded hover:bg-red-100"
                  aria-label="Downvote"
                  title="Downvote"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${post.userVote === -1 ? 'text-red-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-gray-600 font-medium">{post.votes.downvotes}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ad between post and reply form */}
        <MockAd type="rectangle" label="In-article Advertisement" />
        
        {/* Reply form */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Your Reply</h2>
            
            {replyError && (
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                {replyError}
              </div>
            )}
            
            <form onSubmit={handleSubmitReply}>
              <div className="mb-4">
                <textarea
                  className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-indigo-500"
                  rows="4"
                  placeholder="Share your thoughts..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Ad between reply form and replies section */}
        <MockAd type="rectangle" label="Discussion Promo" />
        
        {/* Replies section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{replies.length} Replies</h2>
            
            {repliesLoading ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Loading replies...</h3>
              </div>
            ) : replyError && replies.length === 0 ? (
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                {replyError}
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No replies yet. Be the first to reply!
              </div>
            ) : (
              <div className="space-y-6">
                {sortedReplies.map((reply, index) => (
                  <React.Fragment key={reply._id}>
                    {/* Insert ad after every 4 replies */}
                    {index > 0 && index % 4 === 0 && (
                      <MockAd type="rectangle" label={`Discussion Ad #${Math.ceil(index/4)}`} />
                    )}
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <UserHoverCard 
                                userId={reply.author._id} 
                                userName={`${reply.author.personalInfo.firstName} ${reply.author.personalInfo.lastName}`}
                                userEmail={reply.author.email}
                              >
                                <Link to={`/profile/${reply.author._id}`} className="font-medium text-blue-600 hover:underline">
                                  {reply.author.personalInfo.firstName} {reply.author.personalInfo.lastName}
                                </Link>
                              </UserHoverCard>
                              <span className="mx-2">•</span>
                              <span>{formatDate(reply.createdAt)}</span>
                            </div>
                            <div className="prose max-w-none">
                              {reply.content}
                            </div>
                          </div>
                        
                          {/* Delete button for reply owner */}
                          {currentUserId && reply.author._id === currentUserId && (
                            <button
                              onClick={() => handleDeleteReply(reply._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete reply"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Reply voting */}
                      <div className="flex items-center justify-end space-x-4 pt-4 mt-4 border-t">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleReplyVote(reply._id, 'upvote')}
                            className="p-1 rounded hover:bg-green-100"
                            aria-label="Upvote"
                            title="Upvote"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${reply.userVote === 1 ? 'text-green-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <span className="text-gray-600 font-medium">{reply.votes.upvotes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleReplyVote(reply._id, 'downvote')}
                            className="p-1 rounded hover:bg-red-100"
                            aria-label="Downvote"
                            title="Downvote"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${reply.userVote === -1 ? 'text-red-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <span className="text-gray-600 font-medium">{reply.votes.downvotes}</span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SinglePostPage;