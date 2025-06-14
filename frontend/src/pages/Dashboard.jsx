import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

// Keep mock user and trending posts for now
const mockUser = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  email: 'john.doe@example.com',
  reputation: 145
};

// Keep mock trending posts data
const mockTrendingPosts = [
  {
    _id: '4',
    title: 'Healthcare Reform: What We Need Now',
    votes: {
      upvotes: 245,
      downvotes: 32
    },
    author: {
      personalInfo: {
        firstName: 'Michael',
        lastName: 'Chen'
      }
    },
    location: {
      country: 'Australia',
      city: 'Sydney'
    }
  },
  {
    _id: '5',
    title: 'The Future of Renewable Energy',
    votes: {
      upvotes: 189,
      downvotes: 27
    },
    author: {
      personalInfo: {
        firstName: 'Emma',
        lastName: 'Taylor'
      }
    },
    location: {
      country: 'Germany',
      city: 'Berlin'
    }
  },
  {
    _id: '6',
    title: 'Digital Privacy Laws Need to Change',
    votes: {
      upvotes: 176,
      downvotes: 19
    },
    author: {
      personalInfo: {
        firstName: 'David',
        lastName: 'Garcia'
      }
    },
    location: {
      country: 'Spain',
      city: 'Barcelona'
    }
  }
];

// Mock locations for filtering
const mockLocations = [
  { country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'] },
  { country: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { country: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne'] }
];

// Mock tags for filtering
const mockTags = [
  'Environment', 'Climate Change', 'Policy', 'Education', 'Healthcare', 
  'Economy', 'Technology', 'Infrastructure', 'Social Justice', 'Local Politics',
  'Transportation', 'Housing', 'Reform', 'Security', 'Foreign Policy'
];

const Dashboard = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState(mockTrendingPosts);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    tags: []
  });

  // Use real user data when available
  useEffect(() => {
    if (authUser) {
      const formattedUser = {
        id: authUser.id || authUser._id,
        email: authUser.email,
        personalInfo: {
          firstName: authUser.personalInfo?.firstName || authUser.firstName || '',
          lastName: authUser.personalInfo?.lastName || authUser.lastName || ''
        },
        status: authUser.status,
        reputation: authUser.reputation || 0
      };
      setUser(formattedUser);
    } else {
      // Fall back to mock data only during development
      setUser(mockUser);
    }
  }, [authUser]);

  // Extract user ID from token when component mounts
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

  // Fetch posts from the API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Get authentication token for protected endpoints
        const token = localStorage.getItem('authToken');
        
        // Create URL with query parameters for filters
        let url = 'http://localhost:3000/api/posts';
        const queryParams = [];
        
        if (filters.country) queryParams.push(`country=${encodeURIComponent(filters.country)}`);
        if (filters.city) queryParams.push(`city=${encodeURIComponent(filters.city)}`);
        if (filters.tags.length > 0) {
          filters.tags.forEach(tag => {
            queryParams.push(`tag=${encodeURIComponent(tag)}`);
          });
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        // Set up request headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Make the API request
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        
        // Process the received data
        // The API returns { posts: [...], totalPages, currentPage, totalPosts }
        const formattedPosts = data.posts.map(post => {
          return {
            ...post,
            author: {
              _id: post.authorId._id,
              personalInfo: {
                firstName: post.authorId.firstName || 'Anonymous',
                lastName: post.authorId.lastName || 'User'
              },
              email: post.authorId.email
            },
            // Explicitly preserve the userVote field
            userVote: post.userVote || 0
          };
        });
        
        setPosts(formattedPosts);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
        // Keep any previously loaded posts
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [filters.country, filters.city, filters.tags]); // Re-fetch when filters change

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to handle voting
  const handleVote = async (postId, voteType) => {
    if (!localStorage.getItem('authToken')) {
      setError('You must be logged in to vote');
      return;
    }

    // Find the post
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    // Save current state to revert if API call fails
    const previousVote = post.userVote;
    const previousUpvotes = post.votes.upvotes;
    const previousDownvotes = post.votes.downvotes;
    
    const voteValue = voteType === 'upvote' ? 1 : -1;
    
    // Check if the user is trying to remove their vote by clicking the same option
    let finalVoteValue = voteValue;
    if ((voteType === 'upvote' && post.userVote === 1) || 
        (voteType === 'downvote' && post.userVote === -1)) {
      finalVoteValue = 0; // Remove vote
    }
    
    // Don't update the UI optimistically - wait for server response
    // This prevents double-counting

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/vote`, {
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

      // Use the vote response to update just the one post
      const result = await response.json();
      
      setPosts(prevPosts => {
        return prevPosts.map(post => {
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
      setError('Failed to register your vote. Please try again.');
    }
  };

  // Function to handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to delete a post');
        return;
      }
      
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      // Remove the deleted post from the UI
      setPosts(posts.filter(post => post._id !== postId));
      
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  // Function to handle country change in filters
  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFilters({
      ...filters,
      country,
      city: '' // Reset city when country changes
    });
    
    // Update available cities
    if (country) {
      const selectedCountry = mockLocations.find(loc => loc.country === country);
      setAvailableCities(selectedCountry ? selectedCountry.cities : []);
    } else {
      setAvailableCities([]);
    }
  };

  // Function to handle city change in filters
  const handleCityChange = (e) => {
    setFilters({
      ...filters,
      city: e.target.value
    });
  };

  // Function to handle tag selection
  const handleTagToggle = (tag) => {
    setFilters(prevFilters => {
      const tags = [...prevFilters.tags];
      if (tags.includes(tag)) {
        // Remove tag if already selected
        return {
          ...prevFilters,
          tags: tags.filter(t => t !== tag)
        };
      } else {
        // Add tag if not already selected
        return {
          ...prevFilters,
          tags: [...tags, tag]
        };
      }
    });
  };

  // Filter posts based on selected filters
  const filteredPosts = posts.filter(post => {
    // Filter by country
    if (filters.country && post.location.country !== filters.country) {
      return false;
    }
    
    // Filter by city
    if (filters.city && post.location.city !== filters.city) {
      return false;
    }
    
    // Filter by tags
    if (filters.tags.length > 0) {
      const hasMatchingTag = post.tags.some(tag => filters.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(termLower);
      const matchesContent = post.content.toLowerCase().includes(termLower);
      if (!matchesTitle && !matchesContent) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate vote score for trending posts
  const getVoteScore = (post) => {
    return post.votes.upvotes - post.votes.downvotes;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading posts...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link 
            to="/new-post" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>
        
        <div className="mb-8">
          <p className="mt-2 text-gray-600">Latest political opinions from your region</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white shadow rounded-lg p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Location filters */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
                <div className="space-y-2">
                  <select
                    value={filters.country}
                    onChange={handleCountryChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Countries</option>
                    {mockLocations.map(location => (
                      <option key={location.country} value={location.country}>
                        {location.country}
                      </option>
                    ))}
                  </select>
                  
                  {availableCities.length > 0 && (
                    <select
                      value={filters.city}
                      onChange={handleCityChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Cities</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              {/* Tags filter */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {mockTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          filters.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Search filter */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Reset filters button */}
              <button
                onClick={() => {
                  setFilters({ country: '', city: '', tags: [] });
                  setSearchTerm('');
                  setAvailableCities([]);
                }}
                className="w-full py-2 px-4 border border-transparent text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {/* Main Content - Latest Posts */}
          <div className="flex-grow">
            <div className="space-y-6">
              {loading ? (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Loading...</h3>
                  <p className="mt-1 text-sm text-gray-500">Please wait while we load the latest posts.</p>
                </div>
              ) : error ? (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
                  <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <div key={post._id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            <Link to={`/post/${post._id}`} className="hover:text-blue-600">
                              {post.title}
                            </Link>
                          </h2>
                          <div className="flex items-center text-sm text-gray-500 mb-4">
                            <span>
                              By {post.author.personalInfo.firstName} {post.author.personalInfo.lastName}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span className="mx-2">•</span>
                            <span>
                              {post.location.city}, {post.location.country}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Delete button - only visible to post owner */}
                          {currentUserId && post.author._id === currentUserId && (
                            <button 
                              onClick={() => handleDeletePost(post._id)}
                              className="text-red-500 hover:text-red-700 focus:outline-none"
                              title="Delete post"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          
                          {/* Voting */}
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleVote(post._id, 'upvote')}
                              className={`flex items-center ${post.userVote === 1 ? 'text-green-600' : 'text-gray-500'} hover:text-green-600 transition-colors`}
                            >
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              <span className="ml-1 font-medium">{post.votes.upvotes}</span>
                            </button>
                            
                            <button 
                              onClick={() => handleVote(post._id, 'downvote')}
                              className={`flex items-center ${post.userVote === -1 ? 'text-red-600' : 'text-gray-500'} hover:text-red-600 transition-colors`}
                            >
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span className="ml-1 font-medium">{post.votes.downvotes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mt-2 mb-4">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No posts found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to find what you're looking for.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - Trending Posts */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white shadow rounded-lg p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Trending Posts</h2>
                <Link to="/trending" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {trendingPosts.map(post => (
                  <div key={post._id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      <Link to={`/post/${post._id}`} className="hover:text-blue-600">
                        {post.title}
                      </Link>
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {post.location.city}, {post.location.country}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center text-xs text-green-600">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {post.votes.upvotes}
                        </span>
                        <span className="flex items-center text-xs text-red-600">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {post.votes.downvotes}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      by {post.author.personalInfo.firstName} {post.author.personalInfo.lastName}
                    </p>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/trending"
                className="mt-4 block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Trending Posts
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
