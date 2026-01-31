import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userInfo } = useSelector((state) => state.auth);

  // 1. Check if user is logged in
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if user has the correct role (if roles are specified)
  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    // If a student tries to access admin page, send them to their own dashboard
    // or just to the root "/" which handles redirection smartly now.
    return <Navigate to="/" replace />;
  }

  // 3. If all checks pass, render the page
  return children;
};

export default ProtectedRoute;