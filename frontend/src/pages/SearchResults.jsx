import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import Navbar from '../components/Navbar';
import UserHoverCard from '../components/UserHoverCard';
import MockAd from '../components/ads/MockAd';
import useAuth from '../hooks/useAuth';

// Helper function to format dates consistently
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Get search query from URL
  const query = new URLSearchParams(location.search).get('q');
  
  // Fetch user data if authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Fetch user data from API
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch user data');
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });
    }
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        // Get token for authenticated requests
        const token = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/posts/search?query=${encodeURIComponent(query)}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (query) {
      fetchSearchResults();
    } else {
      setLoading(false);
    }
  }, [query]);
  
  // Handle vote functionality - similar to Dashboard
  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated()) {
      alert('Please log in to vote');
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      // Convert string voteType to number if needed
      const voteValue = voteType === 'upvote' ? 1 : voteType === 'downvote' ? -1 : voteType;
      
      const response = await fetch(`${API_URL}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote: voteValue })
      });

      if (!response.ok) {
        throw new Error('Failed to vote on post');
      }

      // Update UI to reflect the new vote
      const updatedResults = searchResults.map(post => {
        if (post._id === postId) {
          // Calculate the new vote values based on the user's previous vote
          const prevVote = post.userVote;
          let updatedPost = { ...post };
          
          // Handle upvote
          if (voteValue === 1) {
            if (prevVote === 1) {
              // User is removing their upvote
              updatedPost.userVote = 0;
              updatedPost.votes.upvotes--;
            } else if (prevVote === -1) {
              // User is changing from downvote to upvote
              updatedPost.userVote = 1;
              updatedPost.votes.upvotes++;
              updatedPost.votes.downvotes--;
            } else {
              // User is adding a new upvote
              updatedPost.userVote = 1;
              updatedPost.votes.upvotes++;
            }
          }
          // Handle downvote
          else if (voteValue === -1) {
            if (prevVote === -1) {
              // User is removing their downvote
              updatedPost.userVote = 0;
              updatedPost.votes.downvotes--;
            } else if (prevVote === 1) {
              // User is changing from upvote to downvote
              updatedPost.userVote = -1;
              updatedPost.votes.upvotes--;
              updatedPost.votes.downvotes++;
            } else {
              // User is adding a new downvote
              updatedPost.userVote = -1;
              updatedPost.votes.downvotes++;
            }
          }
          
          return updatedPost;
        }
        return post;
      });
      
      setSearchResults(updatedResults);
      
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        Search Results for "{query}"
      </h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : searchResults.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No posts found matching "{query}". Try a different search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Top Banner Ad */}
          <MockAd type="banner" label="Search Results Banner Ad" />
          
          {searchResults.map((post, index) => (
            <React.Fragment key={post._id}>
              {/* Insert ad after every 3 posts */}
              {index > 0 && index % 3 === 0 && (
                <MockAd type="rectangle" label={`In-feed Ad #${Math.ceil(index/3)}`} />
              )}
              
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link to={`/post/${post._id}`} className="hover:text-blue-600">
                          {post.title}
                        </Link>
                      </h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <UserHoverCard 
                          userId={post.authorId?._id || post.author?._id} 
                          userName={post.authorId ? 
                            `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}` : 
                            post.author ? `${post.author.personalInfo?.firstName || ''} ${post.author.personalInfo?.lastName || ''}` : 'Anonymous'
                          }
                          userEmail={post.authorId?.email || post.author?.email}
                        >
                          <Link to={`/profile/${post.authorId?._id || post.author?._id || ''}`} className="text-blue-600 hover:underline">
                            {post.authorId ? 
                              `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}` : 
                              post.author ? `${post.author.personalInfo?.firstName || ''} ${post.author.personalInfo?.lastName || ''}` : 'Anonymous'
                            }
                          </Link>
                        </UserHoverCard>
                        <span className="mx-2">•</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {post.location?.city || 'Unknown'}, {post.location?.country || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{post.content?.substring(0, 150)}...</p>
                  
                  <div className="flex items-center space-x-4">
                    {/* Voting */}
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleVote(post._id, 'upvote')}
                        className={`flex items-center ${post.userVote === 1 ? 'text-green-600' : 'text-gray-500'} hover:text-green-600 transition-colors`}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="ml-1 font-medium">{post.votes?.upvotes || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleVote(post._id, 'downvote')}
                        className={`flex items-center ${post.userVote === -1 ? 'text-red-600' : 'text-gray-500'} hover:text-red-600 transition-colors`}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="ml-1 font-medium">{post.votes?.downvotes || 0}</span>
                      </button>
                      
                      <Link to={`/post/${post._id}`} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>View Post</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
          
          {/* Bottom Banner Ad */}
          {searchResults.length > 0 && <MockAd type="banner" label="Search Results Bottom Banner Ad" />}
        </div>
      )}
    </div>
    </>
  );
};

export default SearchResults;
