import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export const AICTELayout: React.FC = () => {
  const { user, isLoading, isAICTEAdmin, isReviewer } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Validating regulatory credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAICTEAdmin() && !isReviewer()) {
    return <Navigate to="/institution" replace />;
  }

  return <Outlet />;
};

export default AICTELayout;
