import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      
      {/* Main Wrapper */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-16">

        {/* Left Image */}
        <div className="hidden md:block w-1/2">
          <img
            src="/thinking.png"
            alt="Page not found illustration"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Right Content */}
       <div className="bg-primary-50/60 backdrop-blur-md p-10 rounded-2xl w-full max-w-md text-center">


        <h1 className="text-7xl font-bold text-primary-700 mb-2">404</h1>


          <h2 className="text-2xl font-semibold text-dark-800 mb-3">
            Page Not Found
          </h2>

          <p className="text-gray-600 mb-8">
            Oops! The page you are looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>

        </div>

      </div>
    </div>
  );
};

export default NotFound;
