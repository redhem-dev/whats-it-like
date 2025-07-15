import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

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
      
      // Check current vote to determine final vote value
      const post = searchResults.find(p => p._id === postId);
      let finalVoteValue = voteType;
      
      if (post.userVote === voteType) {
        // Clicking same vote type again = remove vote
        finalVoteValue = 0;
      }
      
      const response = await fetch(`${API_URL}/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType: finalVoteValue })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      // Update just the one post with the result
      const result = await response.json();
      
      setSearchResults(prevResults => {
        return prevResults.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              votes: {
                ...post.votes,
                upvotes: result.upvotes,
                downvotes: result.downvotes
              },
              userVote: result.userVote
            };
          }
          return post;
        });
      });
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
          {searchResults.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-2">
                <Link to={`/post/${post._id}`} className="text-blue-600 hover:text-blue-800">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-700 mb-4">{post.content.substring(0, 200)}...</p>
              
              {/* Post metadata */}
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>By: {post.authorId?.email || 'Anonymous'}</span>
                <span className="mx-2">•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              
              {/* Voting buttons */}
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handleVote(post._id, 1)}
                  className="flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${post.userVote === 1 ? 'text-green-600' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{post.votes.upvotes}</span>
                </button>
                
                <button 
                  onClick={() => handleVote(post._id, -1)}
                  className="flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${post.userVote === -1 ? 'text-red-600' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                  </svg>
                  <span>{post.votes.downvotes}</span>
                </button>
                
                <Link to={`/post/${post._id}`} className="flex items-center space-x-1 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>View Post</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default SearchResults;
