import React from 'react';

const Shimmer = ({ rows = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Header imitation */}
      <div className="h-10 bg-gray-200 rounded-lg w-full mb-6"></div>
      
      {/* Row imitations */}
      {[...Array(rows)].map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="h-12 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded-md w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded-md w-1/6"></div>
        </div>
      ))}
    </div>
  );
};

export default Shimmer;