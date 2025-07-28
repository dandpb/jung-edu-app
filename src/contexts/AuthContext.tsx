/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LoginData, 
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  UserRole,
  ResourceType,
  Action,
  AuthError
} from '../types/auth';
import { authService } from '../services/auth/authService';
import { getStoredTokens, isTokenExpired } from '../services/auth/jwt';

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  
  // Auth methods
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  
  // Password management
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>;
  resetPassword: (data: PasswordResetConfirm) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  
  // Email verification
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // Permission checking
  hasPermission: (resource: ResourceType, action: Action) => boolean;
  hasRole: (role: UserRole) => boolean;
  
  // Session management
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  
  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const { accessToken } = getStoredTokens();
      if (accessToken && isTokenExpired(accessToken)) {
        refreshSession();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);
  
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const { accessToken, refreshToken } = getStoredTokens();
      
      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }
      
      // Try to get current user
      let currentUser = await authService.getCurrentUser();
      
      // If token is expired, try to refresh
      if (!currentUser && refreshToken) {
        const response = await authService.refreshAccessToken();
        if (response) {
          currentUser = response.user as User;
        }
      }
      
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (data: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authService.login(data);
      setUser(response.user as User);
      
      // Navigate based on role
      switch (response.user.role) {
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN:
          navigate('/admin');
          break;
        case UserRole.INSTRUCTOR:
          navigate('/instructor');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  const register = async (data: RegistrationData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      await authService.register(data);
      
      // Show success message and redirect to login
      // In production, show email verification message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please check your email to verify your account.' 
        } 
      });
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const requestPasswordReset = async (data: PasswordResetRequest) => {
    try {
      setError(null);
      await authService.requestPasswordReset(data);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };
  
  const resetPassword = async (data: PasswordResetConfirm) => {
    try {
      setError(null);
      await authService.resetPassword(data);
      navigate('/login', {
        state: {
          message: 'Password reset successful! Please login with your new password.'
        }
      });
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };
  
  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      await authService.changePassword(user.id, data);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };
  
  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      await authService.verifyEmail(token);
      navigate('/login', {
        state: {
          message: 'Email verified successfully! You can now login.'
        }
      });
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };
  
  const resendVerificationEmail = async () => {
    // In production, implement resend verification email
    console.log('Resend verification email');
  };
  
  const refreshSession = async () => {
    try {
      const response = await authService.refreshAccessToken();
      if (response) {
        setUser(response.user as User);
      } else {
        // Session expired, logout
        await logout();
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      await logout();
    }
  };
  
  const hasPermission = useCallback((resource: ResourceType, action: Action): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // Check user permissions
    return user.permissions.some(permission =>
      permission.resource === resource &&
      permission.actions.includes(action)
    );
  }, [user]);
  
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    
    // Check role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 4,
      [UserRole.ADMIN]: 3,
      [UserRole.INSTRUCTOR]: 2,
      [UserRole.STUDENT]: 1,
      [UserRole.GUEST]: 0
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[role];
  }, [user]);
  
  const clearError = () => setError(null);
  
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    hasPermission,
    hasRole,
    refreshSession,
    clearError
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};