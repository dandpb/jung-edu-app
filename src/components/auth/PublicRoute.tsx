/**
 * Public Route Component
 * Redirects authenticated users away from public-only pages (login, register)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user) {
    // Redirect based on user role if no specific redirect provided
    if (!redirectTo) {
      switch (user.role) {
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN:
          return <Navigate to="/admin" replace />;
        case UserRole.INSTRUCTOR:
          return <Navigate to="/instructor/dashboard" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};