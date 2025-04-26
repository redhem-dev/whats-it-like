import React, { useState } from 'react';
import Navbar from '../components/Navbar';

// Mock user data
const mockUser = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  email: 'john.doe@example.com',
  reputation: 145
};

// Mock post data
const mockPosts = [
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
      upvotes: 123,
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
      upvotes: 89,
      downvotes: 12
    },
    tags: ['Environment', 'Climate Change', 'Policy'],
    createdAt: new Date('2025-04-22T14:45:00'),
    status: 'approved'
  },
  {
    _id: '3',
    title: 'Education System Needs Reform',
    content: 'Our current education system is outdated and doesn\'t prepare students for the modern workforce. We need comprehensive reforms to stay competitive.',
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
    votes: {
      upvotes: 67,
      downvotes: 23
    },
    tags: ['Education', 'Reform', 'Future'],
    createdAt: new Date('2025-04-23T09:15:00'),
    status: 'approved'
  }
];

// Mock trending posts data
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
  const [posts, setPosts] = useState(mockPosts);
  const [user, setUser] = useState(mockUser);
  const [trendingPosts, setTrendingPosts] = useState(mockTrendingPosts);
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    tags: []
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to handle voting
  const handleVote = (postId, voteType) => {
    setPosts(
      posts.map(post => {
        if (post._id === postId) {
          const updatedPost = { ...post };
          if (voteType === 'upvote') {
            updatedPost.votes.upvotes += 1;
          } else if (voteType === 'downvote') {
            updatedPost.votes.downvotes += 1;
          }
          return updatedPost;
        }
        return post;
      })
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <div key={post._id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
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
                        
                        {/* Voting */}
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => handleVote(post._id, 'upvote')}
                            className="flex items-center text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            <span className="ml-1 font-medium">{post.votes.upvotes}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleVote(post._id, 'downvote')}
                            className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="ml-1 font-medium">{post.votes.downvotes}</span>
                          </button>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending Posts</h2>
              
              <div className="space-y-4">
                {trendingPosts.map(post => (
                  <div key={post._id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                      {post.title}
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
              
              <button 
                className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Trending Posts
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
