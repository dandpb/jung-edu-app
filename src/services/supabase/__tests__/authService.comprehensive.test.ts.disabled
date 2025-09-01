/**
 * Comprehensive test suite for SupabaseAuthService
 * Tests authentication flow, database integration, error handling, and session management
 * Targets 90%+ coverage for authentication service functionality
 */

import { SupabaseAuthService } from '../authService';
import { AuthError, AuthErrorType, LoginData, RegistrationData } from '../../../types/auth';
import { UserRole } from '../../../types/database';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    verifyOtp: jest.fn(),
    refreshSession: jest.fn(),
    admin: {
      deleteUser: jest.fn()
    }
  }
};

const mockCreateDatabaseQuery = jest.fn().mockReturnValue({
  users: () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }),
  userProfiles: () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }),
  userSessions: () => ({
    insert: jest.fn().mockReturnThis()
  })
});

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
  createDatabaseQuery: mockCreateDatabaseQuery
}));

describe('SupabaseAuthService', () => {
  let authService: SupabaseAuthService;
  let mockSessionCallback: (event: string, session: any) => void;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'student' as UserRole,
    is_active: true,
    is_verified: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    last_login: null,
    avatar_url: null
  };

  const mockProfile = {
    user_id: 'user-123',
    first_name: 'Test',
    last_name: 'User',
    language: 'pt-BR',
    theme: 'light',
    email_notifications: true,
    push_notifications: false
  };

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com'
    },
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-123',
    expires_in: 3600
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      mockSessionCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    // Reset database query mocks
    const mockUsersQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
    };

    const mockProfilesQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
    };

    const mockSessionsQuery = {
      insert: jest.fn().mockReturnThis()
    };

    mockCreateDatabaseQuery.mockReturnValue({
      users: () => mockUsersQuery,
      userProfiles: () => mockProfilesQuery,
      userSessions: () => mockSessionsQuery
    });

    authService = new SupabaseAuthService();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize auth state change listener', () => {
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should initialize with existing session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const service = new SupabaseAuthService();
      
      // Allow async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Init failed'));

      new SupabaseAuthService();
      
      // Allow async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize auth:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Auth State Change Handling', () => {
    beforeEach(() => {
      authService = new SupabaseAuthService();
    });

    it('should handle SIGNED_IN event', async () => {
      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mockResolvedValue(undefined);

      await mockSessionCallback('SIGNED_IN', mockSession);

      expect(loadUserProfileSpy).toHaveBeenCalledWith('user-123');
      loadUserProfileSpy.mockRestore();
    });

    it('should handle SIGNED_OUT event', async () => {
      await mockSessionCallback('SIGNED_OUT', null);

      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should handle TOKEN_REFRESHED event', async () => {
      const newSession = { ...mockSession, access_token: 'new-token' };
      
      await mockSessionCallback('TOKEN_REFRESHED', newSession);

      expect(authService.getCurrentSession()).toEqual(newSession);
    });

    it('should ignore unknown events', async () => {
      await expect(mockSessionCallback('UNKNOWN_EVENT' as any, mockSession))
        .resolves.not.toThrow();
    });
  });

  describe('User Profile Loading', () => {
    it('should load user and profile data successfully', async () => {
      const loadUserProfile = authService['loadUserProfile'].bind(authService);
      
      await loadUserProfile('user-123');

      expect(authService.getCurrentUser()).toEqual({
        ...mockUser,
        profile: mockProfile
      });
    });

    it('should handle missing profile data', async () => {
      const mockProfilesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } // Not found error
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
        }),
        userProfiles: () => mockProfilesQuery
      });

      const loadUserProfile = authService['loadUserProfile'].bind(authService);
      await loadUserProfile('user-123');

      expect(authService.getCurrentUser()).toEqual({
        ...mockUser,
        profile: null
      });
    });

    it('should handle database errors', async () => {
      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mkReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' }
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery
      });

      const loadUserProfile = authService['loadUserProfile'].bind(authService);
      
      await expect(loadUserProfile('user-123'))
        .rejects.toThrow(AuthError);
    });
  });

  describe('Registration', () => {
    const registrationData: RegistrationData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      role: 'student'
    };

    it('should register user successfully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-123',
            email: registrationData.email
          }
        },
        error: null
      });

      const mockUsersQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUser, id: 'new-user-123', email: registrationData.email },
          error: null
        })
      };

      const mockProfilesQuery = {
        insert: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery,
        userProfiles: () => mockProfilesQuery
      });

      const result = await authService.register(registrationData);

      expect(result).toBeDefined();
      expect(result.email).toBe(registrationData.email);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            username: registrationData.username,
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            role: registrationData.role
          }
        }
      });
    });

    it('should handle Supabase auth errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.INVALID_EMAIL, 'Invalid email'));

      await expect(authService.register(registrationData))
        .rejects.toThrow(AuthError);

      expect(mapSupabaseErrorSpy).toHaveBeenCalled();
      mapSupabaseErrorSpy.mockRestore();
    });

    it('should handle missing user data', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(authService.register(registrationData))
        .rejects.toThrow('Registration failed - no user data returned');
    });

    it('should cleanup auth user on database insert failure', async () => {
      const authUserId = 'failed-user-123';
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: authUserId, email: registrationData.email } },
        error: null
      });

      const mockUsersQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unique constraint violation' }
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery
      });

      await expect(authService.register(registrationData))
        .rejects.toThrow(AuthError);

      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(authUserId);
    });

    it('should handle profile creation failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123', email: registrationData.email } },
        error: null
      });

      const mockUsersQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mkReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUser,
          error: null
        })
      };

      const mockProfilesQuery = {
        insert: jest.fn().mockResolvedValue({
          error: { message: 'Profile creation failed' }
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery,
        userProfiles: () => mockProfilesQuery
      });

      const result = await authService.register(registrationData);

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create user profile:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('should use default role when not provided', async () => {
      const dataWithoutRole = { ...registrationData };
      delete (dataWithoutRole as any).role;

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123', email: dataWithoutRole.email } },
        error: null
      });

      await authService.register(dataWithoutRole);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({
              role: 'student'
            })
          })
        })
      );
    });
  });

  describe('Login', () => {
    const loginData: LoginData = {
      username: 'test@example.com',
      password: 'password123'
    };

    beforeEach(() => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockSession.user,
          session: mockSession
        },
        error: null
      });

      const mockUsersQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery,
        userSessions: () => ({
          insert: jest.fn().mockResolvedValue({ error: null })
        })
      });
    });

    it('should login with email successfully', async () => {
      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mockResolvedValue(undefined);
      
      authService['currentUser'] = { ...mockUser, profile: mockProfile };

      const result = await authService.login(loginData);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username
        }),
        accessToken: mockSession.access_token,
        refreshToken: mockSession.refresh_token,
        expiresIn: mockSession.expires_in
      });

      loadUserProfileSpy.mockRestore();
    });

    it('should login with username by looking up email', async () => {
      const usernameLoginData: LoginData = {
        username: 'testuser', // Not an email
        password: 'password123'
      };

      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { email: 'test@example.com' },
          error: null
        }),
        update: jest.fn().mockReturnThis()
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery,
        userSessions: () => ({
          insert: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mockResolvedValue(undefined);
      
      authService['currentUser'] = { ...mockUser, profile: mockProfile };

      await authService.login(usernameLoginData);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: usernameLoginData.password
      });

      loadUserProfileSpy.mockRestore();
    });

    it('should handle invalid username lookup', async () => {
      const usernameLoginData: LoginData = {
        username: 'nonexistent',
        password: 'password123'
      };

      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery
      });

      await expect(authService.login(usernameLoginData))
        .rejects.toThrow('Invalid username or password');
    });

    it('should handle Supabase login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Invalid credentials'));

      await expect(authService.login(loginData))
        .rejects.toThrow(AuthError);

      mapSupabaseErrorSpy.mockRestore();
    });

    it('should handle missing session after login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      });

      await expect(authService.login(loginData))
        .rejects.toThrow('Login failed - no session created');
    });

    it('should update last login timestamp', async () => {
      const mockUsersQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery,
        userSessions: () => ({
          insert: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mockResolvedValue(undefined);
      
      authService['currentUser'] = { ...mockUser, profile: mockProfile };

      await authService.login(loginData);

      expect(mockUsersQuery.update).toHaveBeenCalledWith({
        last_login: expect.any(String)
      });

      loadUserProfileSpy.mockRestore();
    });

    it('should create session record', async () => {
      const mockSessionsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null })
      };

      const createSessionRecordSpy = jest.spyOn(authService as any, 'createSessionRecord')
        .mockResolvedValue(undefined);

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => ({
          update: jest.fn().mkReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        }),
        userSessions: () => mockSessionsQuery
      });

      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mkResolvedValue(undefined);
      
      authService['currentUser'] = { ...mockUser, profile: mockProfile };

      await authService.login(loginData);

      expect(createSessionRecordSpy).toHaveBeenCalledWith(mockSession.user.id, loginData);

      loadUserProfileSpy.mockRestore();
      createSessionRecordSpy.mockRestore();
    });

    it('should handle profile loading failure after login', async () => {
      const loadUserProfileSpy = jest.spyOn(authService as any, 'loadUserProfile')
        .mockRejectedValue(new Error('Profile load failed'));

      await expect(authService.login(loginData))
        .rejects.toThrow('Profile load failed');

      loadUserProfileSpy.mockRestore();
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await authService.logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getCurrentSession()).toBeNull();
    });

    it('should handle logout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(authService.logout())
        .rejects.toThrow(AuthError);

      expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      // Mock window.location
      delete (window as any).location;
      window.location = { origin: 'http://localhost:3000' } as any;

      await authService.requestPasswordReset({ email: 'test@example.com' });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      );
    });

    it('should handle password reset request errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.EMAIL_NOT_FOUND, 'Email not found'));

      await expect(authService.requestPasswordReset({ email: 'nonexistent@example.com' }))
        .rejects.toThrow(AuthError);

      mapSupabaseErrorSpy.mockRestore();
    });

    it('should reset password with token successfully', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      await authService.resetPassword({
        token: 'reset-token',
        newPassword: 'NewSecurePassword123!'
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewSecurePassword123!'
      });
    });

    it('should handle password reset errors', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Invalid token' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.INVALID_TOKEN, 'Invalid token'));

      await expect(authService.resetPassword({
        token: 'invalid-token',
        newPassword: 'newpass'
      })).rejects.toThrow(AuthError);

      mapSupabaseErrorSpy.mockRestore();
    });
  });

  describe('Change Password', () => {
    beforeEach(() => {
      authService['currentUser'] = mockUser;
    });

    it('should change password successfully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      await authService.changePassword('currentPassword', 'newPassword123');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: 'currentPassword'
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      });
    });

    it('should throw error when not authenticated', async () => {
      authService['currentUser'] = null;

      await expect(authService.changePassword('current', 'new'))
        .rejects.toThrow('User not authenticated');
    });

    it('should handle incorrect current password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(authService.changePassword('wrongPassword', 'newPassword'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should handle password update errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Password too weak' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.WEAK_PASSWORD, 'Password too weak'));

      await expect(authService.changePassword('current', 'weak'))
        .rejects.toThrow(AuthError);

      mapSupabaseErrorSpy.mockRestore();
    });
  });

  describe('Email Verification', () => {
    beforeEach(() => {
      authService['currentUser'] = mockUser;
    });

    it('should verify email successfully', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

      const mockUsersQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        users: () => mockUsersQuery
      });

      await authService.verifyEmail('verification-token');

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'verification-token',
        type: 'email'
      });

      expect(mockUsersQuery.update).toHaveBeenCalledWith({
        is_verified: true,
        email_verified_at: expect.any(String)
      });
    });

    it('should handle verification errors', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        error: { message: 'Invalid token' }
      });

      const mapSupabaseErrorSpy = jest.spyOn(authService as any, 'mapSupabaseError')
        .mockReturnValue(new AuthError(AuthErrorType.INVALID_TOKEN, 'Invalid token'));

      await expect(authService.verifyEmail('invalid-token'))
        .rejects.toThrow(AuthError);

      mapSupabaseErrorSpy.mockRestore();
    });

    it('should handle verification without current user', async () => {
      authService['currentUser'] = null;
      mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

      // Should not throw error, just skip user update
      await expect(authService.verifyEmail('token')).resolves.not.toThrow();
    });
  });

  describe('Token Refresh', () => {
    beforeEach(() => {
      authService['currentUser'] = { ...mockUser, profile: mockProfile };
    });

    it('should refresh access token successfully', async () => {
      const newSession = {
        ...mockSession,
        access_token: 'new-access-token',
        expires_in: 7200
      };

      mockSupabase.auth.refreshSession.mkResolvedValue({
        data: { session: newSession },
        error: null
      });

      const result = await authService.refreshAccessToken();

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email
        }),
        accessToken: 'new-access-token',
        refreshToken: newSession.refresh_token,
        expiresIn: 7200
      });
    });

    it('should return null when refresh fails', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' }
      });

      const result = await authService.refreshAccessToken();

      expect(result).toBeNull();
    });

    it('should return null when no current user', async () => {
      authService['currentUser'] = null;

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.refreshAccessToken();

      expect(result).toBeNull();
    });

    it('should handle refresh exceptions gracefully', async () => {
      mockSupabase.auth.refreshSession.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await authService.refreshAccessToken();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Permissions', () => {
    it('should grant all permissions to super admin', async () => {
      authService['currentUser'] = { ...mockUser, role: 'super_admin' as UserRole };

      const hasPermission = await authService.hasPermission('any-resource', 'any-action');

      expect(hasPermission).toBe(true);
    });

    it('should check specific permissions for other roles', async () => {
      authService['currentUser'] = { ...mockUser, role: 'student' as UserRole };

      const readModules = await authService.hasPermission('modules', 'read');
      const writeModules = await authService.hasPermission('modules', 'write');

      expect(readModules).toBe(true);  // Students can read modules
      expect(writeModules).toBe(false); // Students cannot write modules
    });

    it('should deny permissions when not authenticated', async () => {
      authService['currentUser'] = null;

      const hasPermission = await authService.hasPermission('any-resource', 'any-action');

      expect(hasPermission).toBe(false);
    });

    it('should handle instructor permissions correctly', async () => {
      authService['currentUser'] = { ...mockUser, role: 'instructor' as UserRole };

      const readModules = await authService.hasPermission('modules', 'read');
      const writeModules = await authService.hasPermission('modules', 'write');
      const readUsers = await authService.hasPermission('users', 'read');

      expect(readModules).toBe(true);
      expect(writeModules).toBe(true);
      expect(readUsers).toBe(false); // Instructors cannot read users
    });

    it('should handle admin permissions correctly', async () => {
      authService['currentUser'] = { ...mockUser, role: 'admin' as UserRole };

      const readUsers = await authService.hasPermission('users', 'read');
      const writeUsers = await authService.hasPermission('users', 'write');

      expect(readUsers).toBe(true);
      expect(writeUsers).toBe(true);
    });

    it('should handle guest permissions correctly', async () => {
      authService['currentUser'] = { ...mockUser, role: 'guest' as UserRole };

      const readModules = await authService.hasPermission('modules', 'read');
      const writeModules = await authService.hasPermission('modules', 'write');

      expect(readModules).toBe(true);  // Guests can read modules
      expect(writeModules).toBe(false); // Guests cannot write
    });
  });

  describe('Session Management', () => {
    it('should create session record successfully', async () => {
      const mockSessionsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        userSessions: () => mockSessionsQuery
      });

      const loginData: LoginData = {
        username: 'test@example.com',
        password: 'password',
        deviceId: 'device-123',
        deviceName: 'iPhone 12',
        rememberMe: true
      };

      const createSessionRecord = authService['createSessionRecord'].bind(authService);
      await createSessionRecord('user-123', loginData);

      expect(mockSessionsQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        device_id: 'device-123',
        device_name: 'iPhone 12',
        ip_address: '127.0.0.1',
        user_agent: expect.any(String),
        is_active: true,
        expires_at: expect.any(String)
      });
    });

    it('should use default values for session record', async () => {
      const mockSessionsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        userSessions: () => mockSessionsQuery
      });

      const loginData: LoginData = {
        username: 'test@example.com',
        password: 'password'
      };

      const createSessionRecord = authService['createSessionRecord'].bind(authService);
      await createSessionRecord('user-123', loginData);

      expect(mockSessionsQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          device_id: 'web-unknown',
          device_name: 'Web Browser'
        })
      );
    });

    it('should handle session creation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mockSessionsQuery = {
        insert: jest.fn().mockRejectedValue(new Error('Session creation failed'))
      };

      mockCreateDatabaseQuery.mockReturnValue({
        userSessions: () => mockSessionsQuery
      });

      const loginData: LoginData = {
        username: 'test@example.com',
        password: 'password'
      };

      const createSessionRecord = authService['createSessionRecord'].bind(authService);
      await createSessionRecord('user-123', loginData);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create session record:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should set appropriate expiration for remember me', async () => {
      const mockSessionsQuery = {
        insert: jest.fn().mockImplementation((data) => {
          const expiresAt = new Date(data.expires_at);
          const now = new Date();
          const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          expect(daysDiff).toBeGreaterThanOrEqual(29); // Should be around 30 days
          expect(daysDiff).toBeLessThanOrEqual(31);
          
          return Promise.resolve({ error: null });
        })
      };

      mockCreateDatabaseQuery.mockReturnValue({
        userSessions: () => mockSessionsQuery
      });

      const loginData: LoginData = {
        username: 'test@example.com',
        password: 'password',
        rememberMe: true
      };

      const createSessionRecord = authService['createSessionRecord'].bind(authService);
      await createSessionRecord('user-123', loginData);
    });
  });

  describe('User Mapping', () => {
    it('should map database user to auth user format', async () => {
      const dbUser = {
        ...mockUser,
        profile: mockProfile
      };

      const mapDatabaseUserToAuthUser = authService['mapDatabaseUserToAuthUser'].bind(authService);
      const result = mapDatabaseUserToAuthUser(dbUser);

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        profile: expect.objectContaining({
          firstName: mockProfile.first_name,
          lastName: mockProfile.last_name,
          preferences: expect.objectContaining({
            theme: mockProfile.theme,
            language: mockProfile.language,
            emailNotifications: mockProfile.email_notifications,
            pushNotifications: mockProfile.push_notifications
          })
        }),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isActive: mockUser.is_active,
        isVerified: mockUser.is_verified
      }));
    });

    it('should handle user without profile', async () => {
      const dbUserWithoutProfile = {
        ...mockUser,
        profile: null
      };

      const mapDatabaseUserToAuthUser = authService['mapDatabaseUserToAuthUser'].bind(authService);
      const result = mapDatabaseUserToAuthUser(dbUserWithoutProfile);

      expect(result.profile).toEqual({
        firstName: '',
        lastName: '',
        preferences: {
          theme: 'light',
          language: 'en',
          emailNotifications: true,
          pushNotifications: false
        }
      });
    });
  });

  describe('Error Mapping', () => {
    it('should map Supabase errors correctly', () => {
      const mapSupabaseError = authService['mapSupabaseError'].bind(authService);

      const testCases = [
        {
          supabaseError: { message: 'Invalid login credentials' },
          expectedType: AuthErrorType.INVALID_CREDENTIALS,
          expectedMessage: 'Invalid email or password'
        },
        {
          supabaseError: { message: 'Email not confirmed' },
          expectedType: AuthErrorType.EMAIL_NOT_VERIFIED,
          expectedMessage: 'Please verify your email before logging in'
        },
        {
          supabaseError: { message: 'Too many requests' },
          expectedType: AuthErrorType.RATE_LIMITED,
          expectedMessage: 'Too many attempts. Please try again later'
        },
        {
          supabaseError: { message: 'User already registered' },
          expectedType: AuthErrorType.EMAIL_ALREADY_EXISTS,
          expectedMessage: 'An account with this email already exists'
        },
        {
          supabaseError: { message: 'Unknown error occurred' },
          expectedType: AuthErrorType.UNKNOWN_ERROR,
          expectedMessage: 'Unknown error occurred'
        }
      ];

      testCases.forEach(({ supabaseError, expectedType, expectedMessage }) => {
        const result = mapSupabaseError(supabaseError as any);
        expect(result.type).toBe(expectedType);
        expect(result.message).toBe(expectedMessage);
      });
    });

    it('should handle errors without messages', () => {
      const mapSupabaseError = authService['mapSupabaseError'].bind(authService);
      const result = mapSupabaseError({} as any);

      expect(result.type).toBe(AuthErrorType.UNKNOWN_ERROR);
      expect(result.message).toBe('An unknown error occurred');
    });
  });

  describe('Getter Methods', () => {
    it('should return current user', () => {
      const testUser = { ...mockUser, profile: mockProfile };
      authService['currentUser'] = testUser;

      expect(authService.getCurrentUser()).toBe(testUser);
    });

    it('should return current session', () => {
      const testSession = mockSession;
      authService['currentSession'] = testSession;

      expect(authService.getCurrentSession()).toBe(testSession);
    });

    it('should return null when no current user', () => {
      authService['currentUser'] = null;

      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return null when no current session', () => {
      authService['currentSession'] = null;

      expect(authService.getCurrentSession()).toBeNull();
    });
  });
});