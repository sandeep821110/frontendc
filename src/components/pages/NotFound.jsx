import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-pink-400/30 rounded-full blur-3xl pointer-events-none" />
      <div className="text-center max-w-md relative">
        <div className="text-8xl font-black gradient-text-animated mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold section-title mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8 text-sm sm:text-base">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-gradient !px-6 !py-3"
          >
            <Home size={18} /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-outline !px-6 !py-3"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
