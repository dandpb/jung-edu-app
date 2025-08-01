/**
 * Supabase Authentication Service
 * Replaces localStorage-based auth with Supabase Auth
 */

import { 
  AuthError as SupabaseAuthError, 
  AuthTokenResponse, 
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  User as SupabaseUser,
  Session,
  AuthChangeEvent,
  AuthSession
} from '@supabase/supabase-js';
import { supabase, createDatabaseQuery } from '../../config/supabase';
import { 
  User, 
  UserProfile, 
  UserInsert, 
  UserProfileInsert,
  UserRole 
} from '../../types/database';
import { 
  LoginData, 
  RegistrationData, 
  AuthError, 
  AuthErrorType,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../../types/auth';

export class SupabaseAuthService {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  
  constructor() {
    // Initialize with current session
    this.initializeAuth();
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });
  }

  private async initializeAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        this.currentSession = session;
        await this.loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  private async handleAuthStateChange(event: AuthChangeEvent, session: AuthSession | null) {
    this.currentSession = session;
    
    switch (event) {
      case 'SIGNED_IN':
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
        }
        break;
      case 'SIGNED_OUT':
        this.currentUser = null;
        break;
      case 'TOKEN_REFRESHED':
        // Session automatically updated
        break;
      default:
        break;
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      // Get user data from users table
      const { data: userData, error: userError } = await createDatabaseQuery
        .users()
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      
      // Get user profile data
      const { data: profileData, error: profileError } = await createDatabaseQuery
        .userProfiles()
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
        throw profileError;
      }
      
      // Combine user and profile data
      this.currentUser = {
        ...userData,
        profile: profileData || null
      } as User;
      
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw new AuthError(
        AuthErrorType.DATABASE_ERROR,
        'Failed to load user profile'
      );
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<User> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'student'
          }
        }
      });

      if (authError) {
        throw this.mapSupabaseError(authError);
      }

      if (!authData.user) {
        throw new AuthError(
          AuthErrorType.REGISTRATION_FAILED,
          'Registration failed - no user data returned'
        );
      }

      // Create user record in users table
      const userInsert: UserInsert = {
        id: authData.user.id,
        email: data.email,
        username: data.username,
        role: (data.role as UserRole) || 'student',
        is_active: true,
        is_verified: false
      };

      const { data: userData, error: userError } = await createDatabaseQuery
        .users()
        .insert(userInsert)
        .select()
        .single();

      if (userError) {
        // Clean up auth user if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw this.mapSupabaseError(userError);
      }

      // Create user profile
      const profileInsert: UserProfileInsert = {
        user_id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        language: 'pt-BR',
        theme: 'light',
        email_notifications: true,
        push_notifications: false
      };

      const { error: profileError } = await createDatabaseQuery
        .userProfiles()
        .insert(profileInsert);

      if (profileError) {
        console.warn('Failed to create user profile:', profileError);
      }

      return userData;

    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.REGISTRATION_FAILED,
        'Registration failed',
        { originalError: error }
      );
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const credentials: SignInWithPasswordCredentials = {
        email: data.username.includes('@') ? data.username : '', // Use email if provided
        password: data.password
      };

      // If username doesn't contain @, look up email by username
      if (!credentials.email) {
        const { data: userData, error: userError } = await createDatabaseQuery
          .users()
          .select('email')
          .eq('username', data.username)
          .single();

        if (userError || !userData) {
          throw new AuthError(
            AuthErrorType.INVALID_CREDENTIALS,
            'Invalid username or password'
          );
        }

        credentials.email = userData.email;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword(credentials);

      if (authError) {
        throw this.mapSupabaseError(authError);
      }

      if (!authData.user || !authData.session) {
        throw new AuthError(
          AuthErrorType.LOGIN_FAILED,
          'Login failed - no session created'
        );
      }

      // Update last login
      await createDatabaseQuery
        .users()
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      // Create session record
      await this.createSessionRecord(authData.user.id, data);

      // Load full user profile
      await this.loadUserProfile(authData.user.id);

      if (!this.currentUser) {
        throw new AuthError(
          AuthErrorType.DATABASE_ERROR,
          'Failed to load user profile after login'
        );
      }

      return {
        user: this.currentUser,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in || 3600
      };

    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.LOGIN_FAILED,
        'Login failed',
        { originalError: error }
      );
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.currentSession = null;
    } catch (error) {
      console.error('Logout failed:', error);
      throw new AuthError(
        AuthErrorType.LOGOUT_FAILED,
        'Logout failed'
      );
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.PASSWORD_RESET_FAILED,
        'Password reset request failed'
      );
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.PASSWORD_RESET_FAILED,
        'Password reset failed'
      );
    }
  }

  /**
   * Change password (requires current password)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new AuthError(
          AuthErrorType.NOT_AUTHENTICATED,
          'User not authenticated'
        );
      }

      // Re-authenticate with current password first
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: this.currentUser.email,
        password: currentPassword
      });

      if (reauthError) {
        throw new AuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Current password is incorrect'
        );
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw this.mapSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.PASSWORD_CHANGE_FAILED,
        'Password change failed'
      );
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        throw this.mapSupabaseError(error);
      }

      // Update user verification status
      if (this.currentUser) {
        await createDatabaseQuery
          .users()
          .update({ 
            is_verified: true,
            email_verified_at: new Date().toISOString()
          })
          .eq('id', this.currentUser.id);
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      
      throw new AuthError(
        AuthErrorType.EMAIL_VERIFICATION_FAILED,
        'Email verification failed'
      );
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<LoginResponse | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        return null;
      }

      this.currentSession = data.session;
      
      if (this.currentUser) {
        return {
          user: this.currentUser,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in || 3600
        };
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(resource: string, action: string): Promise<boolean> {
    if (!this.currentUser) return false;
    
    // Super admin has all permissions
    if (this.currentUser.role === 'super_admin') return true;
    
    // Implement role-based permission checking logic here
    // This is a simplified version - expand based on your needs
    const rolePermissions: Record<UserRole, string[]> = {
      super_admin: ['*'],
      admin: ['users:read', 'users:write', 'modules:read', 'modules:write'],
      instructor: ['modules:read', 'modules:write', 'quizzes:read', 'quizzes:write'],
      student: ['modules:read', 'progress:read', 'progress:write', 'notes:read', 'notes:write'],
      guest: ['modules:read']
    };
    
    const userPermissions = rolePermissions[this.currentUser.role] || [];
    const requiredPermission = `${resource}:${action}`;
    
    return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
  }

  private async createSessionRecord(userId: string, loginData: LoginData): Promise<void> {
    try {
      await createDatabaseQuery
        .userSessions()
        .insert({
          user_id: userId,
          device_id: loginData.deviceId || 'web-unknown',
          device_name: loginData.deviceName || 'Web Browser',
          ip_address: '127.0.0.1', // In production, get from request headers
          user_agent: navigator.userAgent,
          is_active: true,
          expires_at: new Date(Date.now() + (loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
        });
    } catch (error) {
      console.warn('Failed to create session record:', error);
    }
  }

  private mapSupabaseError(error: SupabaseAuthError): AuthError {
    switch (error.message) {
      case 'Invalid login credentials':
        return new AuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Invalid email or password'
        );
      case 'Email not confirmed':
        return new AuthError(
          AuthErrorType.EMAIL_NOT_VERIFIED,
          'Please verify your email before logging in'
        );
      case 'Too many requests':
        return new AuthError(
          AuthErrorType.RATE_LIMITED,
          'Too many attempts. Please try again later'
        );
      case 'User already registered':
        return new AuthError(
          AuthErrorType.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists'
        );
      default:
        return new AuthError(
          AuthErrorType.UNKNOWN_ERROR,
          error.message || 'An unknown error occurred'
        );
    }
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();