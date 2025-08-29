/**
 * Comprehensive Unit Tests for AuthContext
 * Tests all authentication methods, permission checking, token management, and error handling
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import { authService } from '../../../src/services/auth/authService';
import { getStoredTokens, clearTokens, storeTokens } from '../../../src/services/auth/jwt';
import { 
  UserRole, 
  ResourceType, 
  Action, 
  AuthErrorType, 
  AuthError,
  User,
  LoginData,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest
} from '../../../src/types/auth';

// Mock dependencies
jest.mock('../../../src/services/auth/authService');
jest.mock('../../../src/services/auth/jwt');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockGetStoredTokens = getStoredTokens as jest.MockedFunction<typeof getStoredTokens>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockStoreTokens = storeTokens as jest.MockedFunction<typeof storeTokens>;

// Test component to access context
const TestComponent: React.FC = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No user'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{auth.isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{auth.error ? auth.error.message : 'No error'}</div>
      
      <button onClick={() => auth.login({ username: 'test@example.com', password: 'password123' })}>
        Login
      </button>
      <button onClick={() => auth.logout()}>
        Logout
      </button>
      <button onClick={() => auth.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'NewPass123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.STUDENT
      })}>
        Register
      </button>
      <button onClick={() => auth.requestPasswordReset({ email: 'reset@example.com' })}>
        Reset Password Request
      </button>
      <button onClick={() => auth.resetPassword({ token: 'reset-token', newPassword: 'NewPass456!' })}>
        Reset Password
      </button>
      <button onClick={() => auth.changePassword({
        currentPassword: 'oldpass',
        newPassword: 'NewPass789!'
      })}>
        Change Password
      </button>
      <button onClick={() => auth.verifyEmail('verify-token')}>
        Verify Email
      </button>
      <button onClick={() => auth.refreshSession()}>
        Refresh Session
      </button>
      <button onClick={() => auth.clearError()}>
        Clear Error
      </button>
      
      <div data-testid="has-permission-module-read">
        {auth.hasPermission(ResourceType.MODULE, Action.READ) ? 'true' : 'false'}
      </div>
      <div data-testid="has-role-admin">
        {auth.hasRole(UserRole.ADMIN) ? 'true' : 'false'}
      </div>
    </div>
  );
};

const renderAuthProvider = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  // Mock user data
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hash',
    salt: 'salt',
    role: UserRole.STUDENT,
    permissions: [
      {
        id: 'perm-1',
        resource: ResourceType.MODULE,
        actions: [Action.READ],
      }
    ],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: false,
      }
    },
    security: {
      twoFactorEnabled: false,
      passwordHistory: [],
      lastPasswordChange: new Date(),
      loginNotifications: true,
      trustedDevices: [],
      sessions: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default mock implementations
    mockGetStoredTokens.mockReturnValue({
      accessToken: null,
      refreshToken: null,
    });
    
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.refreshAccessToken.mockResolvedValue(null);
  });

  describe('Context Provider', () => {
    it('should provide auth context values', () => {
      renderAuthProvider();
      
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    it('should throw error when useAuth is used outside provider', () => {
      const TestComponentOutside = () => {
        try {
          const auth = useAuth();
          return <div>Should not reach here</div>;
        } catch (error) {
          return <div>Error: {(error as Error).message}</div>;
        }
      };

      render(<TestComponentOutside />);
      expect(screen.getByText('Error: useAuth must be used within an AuthProvider')).toBeInTheDocument();
    });
  });

  describe('Initial Authentication Check', () => {
    it('should check for existing session on mount', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
      });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle test mode authentication', async () => {
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: UserRole.STUDENT,
        permissions: [],
        name: 'Test User'
      }));

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should refresh token if access token is expired', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      });
      mockAuthService.getCurrentUser.mockResolvedValue(null);
      mockAuthService.refreshAccessToken.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully', async () => {
      const loginData: LoginData = {
        username: 'test@example.com',
        password: 'password123'
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should handle login error', async () => {
      const authError = new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials');
      mockAuthService.login.mockRejectedValue(authError);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });

    it('should navigate based on user role after login', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockAuthService.login.mockResolvedValue({
        user: adminUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(async () => {
      // Set up authenticated state
      mockAuthService.login.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue();

      await act(async () => {
        await userEvent.click(screen.getByText('Logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle logout error gracefully', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        await userEvent.click(screen.getByText('Logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Registration Functionality', () => {
    it('should register successfully', async () => {
      const registrationData: RegistrationData = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'NewPass123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.STUDENT
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Register'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData);
    });

    it('should handle registration error', async () => {
      const authError = new AuthError(AuthErrorType.REGISTRATION_FAILED, 'Email already exists');
      mockAuthService.register.mockRejectedValue(authError);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Register'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('Password Reset Functionality', () => {
    it('should request password reset successfully', async () => {
      const resetRequest: PasswordResetRequest = { email: 'reset@example.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue();

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Reset Password Request'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(resetRequest);
    });

    it('should handle password reset request error', async () => {
      const authError = new AuthError(AuthErrorType.PASSWORD_RESET_FAILED, 'Reset failed');
      mockAuthService.requestPasswordReset.mockRejectedValue(authError);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Reset Password Request'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Reset failed');
      });
    });

    it('should reset password successfully', async () => {
      const resetData: PasswordResetConfirm = {
        token: 'reset-token',
        newPassword: 'NewPass456!'
      };
      mockAuthService.resetPassword.mockResolvedValue();

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Reset Password'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData);
    });
  });

  describe('Change Password Functionality', () => {
    beforeEach(async () => {
      // Set up authenticated state
      mockAuthService.login.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should change password successfully', async () => {
      const changePasswordData: ChangePasswordRequest = {
        currentPassword: 'oldpass',
        newPassword: 'NewPass789!'
      };
      mockAuthService.changePassword.mockResolvedValue();

      await act(async () => {
        await userEvent.click(screen.getByText('Change Password'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockUser.id, changePasswordData);
    });

    it('should handle change password when no user is logged in', async () => {
      // Logout first
      await act(async () => {
        await userEvent.click(screen.getByText('Logout'));
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Change Password'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No user logged in');
      });
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', async () => {
      mockAuthService.verifyEmail.mockResolvedValue();

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Verify Email'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('verify-token');
    });

    it('should handle email verification error', async () => {
      const authError = new AuthError(AuthErrorType.EMAIL_VERIFICATION_FAILED, 'Invalid token');
      mockAuthService.verifyEmail.mockRejectedValue(authError);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Verify Email'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid token');
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Set up authenticated state
      mockAuthService.login.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should refresh session successfully', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900000,
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Refresh Session'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalled();
    });

    it('should logout when session refresh fails', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue(null);
      mockAuthService.logout.mockResolvedValue();

      await act(async () => {
        await userEvent.click(screen.getByText('Refresh Session'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Permission and Role Checking', () => {
    beforeEach(async () => {
      // Set up authenticated state with specific permissions
      const userWithPermissions = {
        ...mockUser,
        permissions: [
          {
            id: 'perm-1',
            resource: ResourceType.MODULE,
            actions: [Action.READ],
          }
        ]
      };

      mockAuthService.login.mockResolvedValue({
        user: userWithPermissions as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });

    it('should check permissions correctly', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('has-permission-module-read')).toHaveTextContent('true');
      });
    });

    it('should check roles correctly', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('has-role-admin')).toHaveTextContent('false');
      });
    });

    it('should return false for permissions when not authenticated', async () => {
      await act(async () => {
        await userEvent.click(screen.getByText('Logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('has-permission-module-read')).toHaveTextContent('false');
        expect(screen.getByTestId('has-role-admin')).toHaveTextContent('false');
      });
    });

    it('should grant all permissions for super admin', async () => {
      const superAdminUser = { ...mockUser, role: UserRole.SUPER_ADMIN };
      mockAuthService.login.mockResolvedValue({
        user: superAdminUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Logout'));
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('has-permission-module-read')).toHaveTextContent('true');
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      const authError = new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Test error');
      mockAuthService.login.mockRejectedValue(authError);

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Clear Error'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error');
      });
    });

    it('should handle authentication check errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Network error'));

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Auth check failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Token Refresh Interval', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up token refresh interval when user is authenticated', async () => {
      mockGetStoredTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
      });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Mock token as expired
      jest.requireMock('../../../src/services/auth/jwt').isTokenExpired.mockReturnValue(true);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      await waitFor(() => {
        expect(mockAuthService.refreshAccessToken).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed test user data', async () => {
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('auth_user', 'invalid-json');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse test user data:', expect.any(SyntaxError));
      consoleSpy.mockRestore();
    });

    it('should handle session refresh error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Set up authenticated state
      mockAuthService.login.mockResolvedValue({
        user: mockUser as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900000,
      });

      renderAuthProvider();

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Mock refresh to fail
      mockAuthService.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
      mockAuthService.logout.mockResolvedValue();

      await act(async () => {
        await userEvent.click(screen.getByText('Refresh Session'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Session refresh failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});