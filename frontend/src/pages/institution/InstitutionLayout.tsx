import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export const InstitutionLayout: React.FC = () => {
  const { user, isLoading, isInstitutionOperator, isInstitutionAdmin, isAICTEAdmin, isReviewer } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Authenticating session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // AICTE Admin, Reviewer, or Institution users are allowed to access institution views
  if (!isInstitutionOperator() && !isInstitutionAdmin() && !isAICTEAdmin() && !isReviewer()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default InstitutionLayout;
