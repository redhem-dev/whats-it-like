import React from 'react';
import PropTypes from 'prop-types';

const adStyles = {
  banner: {
    width: '100%',
    height: '90px',
    className: 'bg-gradient-to-r from-blue-100 to-purple-100'
  },
  sidebar: {
    width: '100%',
    height: '250px',
    className: 'bg-gradient-to-r from-yellow-50 to-amber-100'
  },
  rectangle: {
    width: '100%',
    height: '120px',
    className: 'bg-gradient-to-r from-green-50 to-emerald-100'
  },
  square: {
    width: '100%',
    height: '250px',
    className: 'bg-gradient-to-r from-purple-50 to-indigo-100'
  }
};

const MockAd = ({ type = 'rectangle', label = 'Advertisement' }) => {
  const style = adStyles[type] || adStyles.rectangle;
  
  return (
    <div 
      className={`rounded-md border border-gray-200 flex flex-col items-center justify-center my-4 overflow-hidden ${style.className}`}
      style={{ height: style.height }}
    >
      <div className="flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8 text-gray-400 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
        <span className="text-lg font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-sm text-gray-400 mt-2">Mock {type} advertisement</p>
    </div>
  );
};

MockAd.propTypes = {
  type: PropTypes.oneOf(['banner', 'sidebar', 'rectangle', 'square']),
  label: PropTypes.string
};

export default MockAd;
