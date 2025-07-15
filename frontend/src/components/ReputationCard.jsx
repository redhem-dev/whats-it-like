import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';

// Default reputation object structure with safe values
const DEFAULT_REPUTATION = {
  score: 50.0, // Default score for users with no votes
  correctVotes: 0,
  totalVotes: 0,
  lastCalculated: new Date(),
  stats: {
    totalVotesCast: 0,
    pendingVotes: 0,
    correctVotes: 0,
    incorrectVotes: 0
  }
};

const ReputationCard = ({ userId }) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        // Determine which endpoint to use based on userId
        const endpoint = userId 
          ? `${API_URL}/api/auth/user/${userId}/reputation`
          : `${API_URL}/api/auth/reputation`;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reputation data');
        }

        const data = await response.json();
        console.log('Raw reputation API response:', data);
        
        // Make sure we have a valid reputation object
        if (data && data.reputation) {
          // Get data from the API response
          const totalVotes = data.reputation.totalVotes || 0;
          const correctVotes = data.reputation.correctVotes || 0;
          
          // Use the score from the backend if available, otherwise calculate it
          let score = data.reputation.score;
          console.log('Raw score from backend:', score, 'totalVotes:', totalVotes, 'correctVotes:', correctVotes);
          
          if (score === undefined && totalVotes > 0) {
            // Calculate score as percentage 
            score = Math.round((correctVotes / totalVotes) * 100 * 10) / 10;
            console.log('Calculated score on frontend:', score);
          } else if (score === undefined) {
            score = 50.0; // Default score if no votes and no score provided
            console.log('Using default score of 50');
          } else {
            console.log('Using backend score:', score);
          }
          
          // Create a safe reputation object with all required fields
          const safeReputation = {
            score: score, // Score with 1 decimal place
            correctVotes: correctVotes,
            totalVotes: totalVotes,
            lastCalculated: data.reputation.lastCalculated || new Date(),
            stats: {
              totalVotesCast: totalVotes,
              pendingVotes: data.reputation.pendingVotes || 0,
              correctVotes: correctVotes,
              incorrectVotes: data.reputation.incorrectVotes || 0
            }
          };
          
          console.log('Final processed reputation data:', safeReputation);
          setReputation(safeReputation);
        } else {
          // If no reputation data, set the default
          setReputation(DEFAULT_REPUTATION);
        }
      } catch (err) {
        console.error('Error fetching reputation:', err);
        setError(err.message || 'An error occurred');
        // Set default reputation even on error for graceful UI display
        setReputation(DEFAULT_REPUTATION);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Reputation</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Reputation</h2>
        <p>No reputation data available yet. Start voting on posts to build your reputation!</p>
      </div>
    );
  }

  // Calculate reputation level
  const getReputationLevel = (score = 0) => {
    // Ensure score is a number
    const numScore = Number(score) || 0;
    
    if (numScore >= 90) return { level: 'Expert', color: 'text-purple-600' };
    if (numScore >= 75) return { level: 'Trusted', color: 'text-blue-600' };
    if (numScore >= 60) return { level: 'Reliable', color: 'text-green-600' };
    if (numScore >= 40) return { level: 'Neutral', color: 'text-yellow-600' };
    if (numScore >= 25) return { level: 'Questionable', color: 'text-orange-600' };
    return { level: 'Unreliable', color: 'text-red-600' };
  };

  // Safely access reputation score
  const reputationScore = reputation?.score || 0;
  const reputationInfo = getReputationLevel(reputationScore);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Reputation</h2>
      
      <div className="mb-6 text-center">
        <div className="text-4xl font-bold mb-2">{reputationScore.toFixed(1)}/100</div>
        <div className={`text-lg font-semibold ${reputationInfo.color}`}>
          {reputationInfo.level}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${Math.min(Math.max(reputationScore, 0), 100)}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold">{reputation?.correctVotes || 0}</div>
          <div className="text-sm text-gray-600">Correct Votes</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold">{reputation?.stats?.totalVotesCast || 0}</div>
          <div className="text-sm text-gray-600">Total Votes Cast</div>
        </div>
      </div>
      

      
      <div className="mt-6 text-xs text-gray-500">
        Last updated: {reputation?.lastCalculated ? new Date(reputation.lastCalculated).toLocaleString() : 'Never'}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-2">Your reputation score is calculated based on how often your votes align with the majority consensus on posts.</p>
        <p>Continue voting on posts to improve your reputation!</p>
      </div>
    </div>
  );
};

export default ReputationCard;
