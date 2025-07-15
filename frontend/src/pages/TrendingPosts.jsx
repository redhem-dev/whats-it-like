import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserHoverCard from '../components/UserHoverCard';
import { API_URL } from '../services/api';
import MockAd from '../components/ads/MockAd';

// Mock trending posts data - you would fetch this from your API
const mockTrendingPosts = [
  {
    _id: '1',
    title: 'Political Reform Needed in Our City',
    content: 'I believe we need to focus on infrastructure development before anything else. Our roads and public transport are in desperate need of improvement.',
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
    votes: {
      upvotes: 323,
      downvotes: 45
    },
    tags: ['Infrastructure', 'Local Politics', 'Transportation'],
    createdAt: new Date('2025-04-20T10:30:00'),
    status: 'approved'
  },
  {
    _id: '2',
    title: 'Environmental Policies Should Be Prioritized',
    content: 'With climate change becoming more evident, I think our country needs to take stronger measures to reduce carbon emissions and promote renewable energy.',
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
    votes: {
      upvotes: 289,
      downvotes: 12
    },
    tags: ['Environment', 'Climate Change', 'Policy'],
    createdAt: new Date('2025-04-22T14:45:00'),
    status: 'approved'
  },
  {
    _id: '3',
    title: 'Healthcare Reform: What We Need Now',
    content: 'Our healthcare system needs significant reforms to ensure better access for all citizens while controlling costs.',
    votes: {
      upvotes: 245,
      downvotes: 32
    },
    author: {
      _id: '103',
      personalInfo: {
        firstName: 'Michael',
        lastName: 'Chen'
      }
    },
    location: {
      country: 'Australia',
      city: 'Sydney'
    },
    tags: ['Healthcare', 'Reform', 'Policy'],
    createdAt: new Date('2025-04-19T11:30:00'),
    status: 'approved'
  },
  {
    _id: '4',
    title: 'The Future of Renewable Energy',
    content: 'Renewable energy sources like solar and wind power are the key to sustainable development.',
    votes: {
      upvotes: 189,
      downvotes: 27
    },
    author: {
      _id: '104',
      personalInfo: {
        firstName: 'Emma',
        lastName: 'Taylor'
      }
    },
    location: {
      country: 'Germany',
      city: 'Berlin'
    },
    tags: ['Energy', 'Environment', 'Technology'],
    createdAt: new Date('2025-04-21T09:15:00'),
    status: 'approved'
  },
  {
    _id: '5',
    title: 'Digital Privacy Laws Need to Change',
    content: 'With increasing surveillance and data collection, we need stronger privacy laws to protect citizens.',
    votes: {
      upvotes: 176,
      downvotes: 19
    },
    author: {
      _id: '105',
      personalInfo: {
        firstName: 'David',
        lastName: 'Garcia'
      }
    },
    location: {
      country: 'Spain',
      city: 'Barcelona'
    },
    tags: ['Privacy', 'Technology', 'Law'],
    createdAt: new Date('2025-04-23T16:45:00'),
    status: 'approved'
  },
  {
    _id: '6',
    title: 'Education System Needs Reform',
    content: 'Our current education system is outdated and doesn\'t prepare students for the modern workforce. We need comprehensive reforms to stay competitive.',
    author: {
      _id: '106',
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Williams'
      }
    },
    location: {
      country: 'United Kingdom',
      city: 'London'
    },
    votes: {
      upvotes: 167,
      downvotes: 23
    },
    tags: ['Education', 'Reform', 'Future'],
    createdAt: new Date('2025-04-23T09:15:00'),
    status: 'approved'
  }
];

const TrendingPosts = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('votes');
  const [timeFrame, setTimeFrame] = useState('10');
  const [tagFilter, setTagFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  
  // Common tags for filtering
  const popularTags = ['Politics', 'Environment', 'Healthcare', 'Economy', 'Education', 'Infrastructure', 'Technology'];
  
  // Fetch trending posts from the API
  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get authentication token for protected endpoints
        const token = localStorage.getItem('authToken');
        
        // Create URL with query parameters for trending posts
        let url = `${API_URL}/api/posts/trending`;
        const queryParams = [];
        
        // Add days parameter based on selected timeframe
        queryParams.push(`days=${timeFrame}`);
        
        // No limit for trending page - get all posts from the specified timeframe
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trending posts: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Trending posts data:', data);
        
        if (data && Array.isArray(data.posts)) {
          // Ensure each post has the userVote property properly set
          const processedPosts = data.posts.map(post => ({
            ...post,
            userVote: post.userVote || 0 // Explicitly set userVote if not present
          }));
          setTrendingPosts(processedPosts);
        } else {
          console.error('Invalid trending posts data structure:', data);
          setTrendingPosts([]);
        }
      } catch (error) {
        console.error('Error fetching trending posts:', error);
        setError('Failed to load trending posts. Please try again later.');
        setTrendingPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingPosts();
  }, [timeFrame]);

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
    const post = trendingPosts.find(p => p._id === postId);
    if (!post) return;
    
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
        throw new Error(`Error: ${response.statusText}`);
      }

      // Use the vote response to update just the one post
      const result = await response.json();
      
      setTrendingPosts(prevPosts => {
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

  // Apply filters and sort posts
  const filteredAndSortedPosts = [...trendingPosts]
    .filter(post => {
      // Apply tag filter if selected
      if (tagFilter && post.tags) {
        return post.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
      }
      return true;
    })
    .filter(post => {
      // Apply country filter if selected
      if (countryFilter && post.location?.country) {
        return post.location.country.toLowerCase().includes(countryFilter.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') {
        const aScore = (a.votes?.upvotes || 0) - (a.votes?.downvotes || 0);
        const bScore = (b.votes?.upvotes || 0) - (b.votes?.downvotes || 0);
        return bScore - aScore; // Descending
      } else if (sortBy === 'recent') {
        return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
      } else if (sortBy === 'comments') {
        // Sort by number of replies if available
        const aReplies = a.replyCount || 0;
        const bReplies = b.replyCount || 0;
        return bReplies - aReplies;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Top Banner Ad */}
      <div className="max-w-screen-xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
        <MockAd type="banner" label="Trending Page Top Banner" />
      </div>
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar with Ads and Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            {/* Left Sidebar Ad */}
            <MockAd type="skyscraper" label="Left Sidebar Ad" />
            
            {/* Filter Controls */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                  <select
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="3">Last 3 days</option>
                    <option value="7">Last week</option>
                    <option value="10">Last 10 days</option>
                    <option value="30">Last month</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Tag</label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Tags</option>
                    {popularTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Countries</option>
                    <option value="Bosnia">Bosnia</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Trending Posts</h1>
              <div className="flex space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-40 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="votes">Most Votes</option>
                  <option value="recent">Most Recent</option>
                  <option value="comments">Most Comments</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-lg text-gray-600">Loading trending posts...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-red-800">{error}</h3>
              </div>
            ) : filteredAndSortedPosts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No posts found</h3>
                <p className="mt-1 text-sm text-gray-500">No posts match your current filter criteria. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* In-feed top ad */}
                <MockAd type="rectangle" label="In-feed Top Ad" />
                
                {filteredAndSortedPosts.map((post, index) => (
                <React.Fragment key={post._id}>
                  {/* Insert ad after every 3 posts */}
                  {index > 0 && index % 3 === 0 && (
                    <MockAd type="rectangle" label={`In-feed Ad #${Math.ceil(index/3)}`} />
                  )}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link to={`/post/${post._id}`} className="hover:text-blue-600">
                          {post.title}
                        </Link>
                      </h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <UserHoverCard 
                          userId={post.author?._id} 
                          userName={`${post.author?.personalInfo?.firstName || ''} ${post.author?.personalInfo?.lastName || ''}`}
                          userEmail={post.author?.email}
                        >
                          <Link to={`/profile/${post.author?._id}`} className="text-blue-600 hover:underline">
                            {post.author?.personalInfo?.firstName || ''} {post.author?.personalInfo?.lastName || ''}
                          </Link>
                        </UserHoverCard>
                        <span className="mx-2">•</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>{post.location?.city || 'Unknown'}, {post.location?.country || 'Bosnia'}</span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags && post.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Voting section */}
                    <div className="flex items-center space-x-4 ml-6">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleVote(post._id, 'upvote')}
                          className={`flex items-center ${post.userVote === 1 ? 'text-green-600 font-bold' : 'text-gray-500'} hover:text-green-600 transition-colors`}
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span className="ml-1 font-medium">{post.votes?.upvotes || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleVote(post._id, 'downvote')}
                          className={`flex items-center ${post.userVote === -1 ? 'text-red-600 font-bold' : 'text-gray-500'} hover:text-red-600 transition-colors`}
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="ml-1 font-medium">{post.votes?.downvotes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                    </div>
                  </div>
                </React.Fragment>
                ))}
                
                {/* Bottom in-feed ad */}
                {filteredAndSortedPosts.length > 0 && (
                  <MockAd type="rectangle" label="In-feed Bottom Ad" />
                )}
              </div>
            )}
          </div>
          
          {/* Right Sidebar with Ads */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            {/* Top Right Sidebar Ad */}
            <MockAd type="skyscraper" label="Right Sidebar Top Ad" />
            
            {/* Bottom Right Sidebar Ad */}
            <div className="sticky top-4">
              <MockAd type="rectangle" label="Right Sidebar Bottom Ad" />
            </div>
          </div>
        </div>
      </main>
      
      {/* Bottom Banner Ad */}
      <div className="max-w-screen-xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <MockAd type="banner" label="Trending Page Bottom Banner" />
      </div>
    </div>
  );
};

export default TrendingPosts;