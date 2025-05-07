import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
  const [trendingPosts, setTrendingPosts] = useState(mockTrendingPosts);
  const [sortBy, setSortBy] = useState('votes');

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
    setTrendingPosts(
      trendingPosts.map(post => {
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

  // Sort posts based on selection
  const sortedPosts = [...trendingPosts].sort((a, b) => {
    if (sortBy === 'votes') {
      const aScore = a.votes.upvotes - a.votes.downvotes;
      const bScore = b.votes.upvotes - b.votes.downvotes;
      return bScore - aScore; // Descending
    } else if (sortBy === 'recent') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {sortedPosts.map(post => (
            <div key={post._id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-start">
                  {/* Voting */}
                  <div className="flex flex-col items-center mr-6">
                    <button 
                      onClick={() => handleVote(post._id, 'upvote')}
                      className="text-gray-500 hover:text-blue-500 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="my-1 text-xl font-bold text-gray-900">{post.votes.upvotes - post.votes.downvotes}</span>
                    <button 
                      onClick={() => handleVote(post._id, 'downvote')}
                      className="text-gray-500 hover:text-red-500 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Post Content */}
                  <div className="flex-1">
                    <Link to={`/post/${post._id}`} className="text-xl font-bold text-blue-600 hover:text-blue-800">
                      {post.title}
                    </Link>
                    <p className="mt-2 text-gray-600 line-clamp-3">{post.content}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags && post.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <div className="mr-4">
                        <span className="font-medium text-gray-900">
                          {post.author.personalInfo.firstName} {post.author.personalInfo.lastName}
                        </span>
                      </div>
                      <div className="mr-4">
                        <span>{post.location.city}, {post.location.country}</span>
                      </div>
                      <div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TrendingPosts;