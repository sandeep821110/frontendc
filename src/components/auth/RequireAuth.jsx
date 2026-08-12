import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { selectIsAuthenticated, selectBootstrapDone } from '../../features/auth/authSlice';

const RequireAuth = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapDone = useSelector(selectBootstrapDone);
  const location = useLocation();

  if (!bootstrapDone) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <Loader2 className="animate-spin text-pink-600" size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default RequireAuth;
