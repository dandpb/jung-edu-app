/**
 * Admin Protected Route Component
 * Ensures users are authenticated as admin before accessing admin pages
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  fallbackPath = '/admin/login'
}) => {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  
  // Redirect to admin login if not authenticated as admin
  if (!isAdmin) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};