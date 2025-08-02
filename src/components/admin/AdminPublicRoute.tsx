/**
 * Admin Public Route Component
 * Redirects authenticated admin users away from public admin pages (like login)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminPublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AdminPublicRoute: React.FC<AdminPublicRouteProps> = ({ 
  children, 
  redirectTo = '/admin/modules' 
}) => {
  const { isAdmin } = useAdmin();
  
  // Redirect to admin modules if already authenticated as admin
  if (isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};