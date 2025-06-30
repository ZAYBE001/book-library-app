import React from 'react';

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative">
        {/* Outer ring with gradient */}
        <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
        
        {/* Animated spinner with gradient */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin-fast"></div>
        
        {/* Optional center dot (remove if not needed) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
      </div>
      
      {/* Optional loading text (remove if not needed) */}
      <span className="ml-3 text-gray-700 font-medium">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;