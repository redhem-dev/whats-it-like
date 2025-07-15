import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../services/api';

const MyPosts = ({ userId, isOwnProfile = true }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPosts: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchMyPosts(page);
  }, [page, userId]);

  const fetchMyPosts = async (pageNum) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Use different endpoints depending on whether viewing own posts or another user's posts
      const endpoint = userId && !isOwnProfile
        ? `${API_URL}/api/auth/user/${userId}/posts?page=${pageNum}`
        : `${API_URL}/api/auth/my-posts?page=${pageNum}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
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

      // Remove the deleted post from the state
      setPosts(posts.filter(post => post._id !== postId));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        totalPosts: prev.totalPosts - 1,
        totalPages: Math.ceil((prev.totalPosts - 1) / prev.limit)
      }));

    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    }
  };

  // Function to get user initials for avatar display (consistent with existing implementation)
  const getUserInitials = (user) => {
    // Try to get initials from first and last name
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    // Try to get initials from personalInfo
    if (user?.personalInfo?.firstName && user?.personalInfo?.lastName) {
      return `${user.personalInfo.firstName[0]}${user.personalInfo.lastName[0]}`.toUpperCase();
    }
    
    // Fall back to email if available
    if (user?.email) {
      // Get first two characters from email, or first character if only one word
      const emailParts = user.email.split('@')[0].split('.');
      if (emailParts.length > 1) {
        return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
      }
      return user.email.substring(0, 2).toUpperCase();
    }
    
    // Default fallback
    return 'U';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{isOwnProfile ? 'My Posts' : 'User Posts'}</h2>
        <div className="animate-pulse">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-6 border-b pb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{isOwnProfile ? 'My Posts' : 'User Posts'}</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{isOwnProfile ? 'My Posts' : 'User Posts'}</h2>
      
      {posts.length === 0 ? (
        <div className="text-center py-8">
          {isOwnProfile ? (
            <>
              <p className="text-gray-500 mb-4">You haven't created any posts yet.</p>
              <Link 
                to="/create-post" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Your First Post
              </Link>
            </>
          ) : (
            <p className="text-gray-500">This user hasn't created any posts yet.</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/post/${post._id}`} className="block">
                      <h3 className="font-medium hover:text-blue-600 cursor-pointer">{post.title}</h3>
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>Posted by {
                        // Check for either authorId or author field (API returns different field names)
                        post.authorId ? 
                          `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}`.trim() || post.authorId.email?.split('@')[0] 
                        : post.author ? 
                          `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.email?.split('@')[0]
                        : 'Unknown User'
                      } • </span>
                      <span>{post.location?.city || 'Unknown'}, {post.location?.country || 'Unknown'}</span>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Created on {formatDate(post.createdAt)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    page === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPage(index + 1)}
                    className={`px-3 py-1 rounded ${
                      page === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={page === pagination.totalPages}
                  className={`px-3 py-1 rounded ${
                    page === pagination.totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPosts;
