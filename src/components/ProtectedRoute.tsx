import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from './SessionProvider';
import { LoadingSkeleton } from './LoadingSkeleton';

export const ProtectedRoute = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};