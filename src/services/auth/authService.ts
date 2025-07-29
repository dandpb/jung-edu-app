/**
 * Main Authentication Service
 * Handles user registration, login, session management, and authorization
 */

import { 
  hashPassword, 
  verifyPassword, 
  generateSalt, 
  generateSecureToken,
  validatePassword 
} from './crypto';
import {
  createAccessToken,
  createRefreshToken,
  validateToken,
  rotateTokens,
  storeTokens,
  clearTokens,
  getStoredTokens,
  AccessTokenPayload
} from './jwt';
import {
  User,
  UserRole,
  LoginData,
  LoginResponse,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  AuthError,
  AuthErrorType,
  Session,
  DEFAULT_PERMISSIONS
} from '../../types/auth';

/**
 * User storage (in production, this would be a database)
 */
class UserStorage {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private resetTokens: Map<string, { userId: string; expires: Date }> = new Map();
  
  constructor() {
    this.loadFromLocalStorage();
  }
  
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('jungApp_users');
      if (stored) {
        const users = JSON.parse(stored);
        Object.values(users).forEach((user: any) => {
          this.users.set(user.id, user);
          this.emailIndex.set(user.email.toLowerCase(), user.id);
          this.usernameIndex.set(user.username.toLowerCase(), user.id);
        });
      }
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
    }
  }
  
  private saveToLocalStorage(): void {
    const users: Record<string, User> = {};
    this.users.forEach((user, id) => {
      users[id] = user;
    });
    localStorage.setItem('jungApp_users', JSON.stringify(users));
  }
  
  async createUser(user: User): Promise<void> {
    if (this.emailIndex.has(user.email.toLowerCase())) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Email already exists'
      );
    }
    
    if (this.usernameIndex.has(user.username.toLowerCase())) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Username already exists'
      );
    }
    
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    this.usernameIndex.set(user.username.toLowerCase(), user.id);
    this.saveToLocalStorage();
  }
  
  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }
  
  async getUserByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }
  
  async updateUser(user: User): Promise<void> {
    this.users.set(user.id, user);
    this.saveToLocalStorage();
  }
  
  async setResetToken(userId: string, token: string, expires: Date): Promise<void> {
    this.resetTokens.set(token, { userId, expires });
  }
  
  async getResetToken(token: string): Promise<{ userId: string; expires: Date } | null> {
    const data = this.resetTokens.get(token);
    if (!data) return null;
    
    if (data.expires < new Date()) {
      this.resetTokens.delete(token);
      return null;
    }
    
    return data;
  }
  
  async deleteResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }
}

/**
 * Session storage
 */
class SessionStorage {
  private sessions: Map<string, Session> = new Map();
  
  constructor() {
    this.loadFromLocalStorage();
  }
  
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('jungApp_sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        Object.values(sessions).forEach((session: any) => {
          this.sessions.set(session.id, {
            ...session,
            createdAt: new Date(session.createdAt),
            lastActivity: new Date(session.lastActivity),
            expiresAt: new Date(session.expiresAt)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
    }
  }
  
  private saveToLocalStorage(): void {
    const sessions: Record<string, Session> = {};
    this.sessions.forEach((session, id) => {
      sessions[id] = session;
    });
    localStorage.setItem('jungApp_sessions', JSON.stringify(sessions));
  }
  
  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    this.saveToLocalStorage();
  }
  
  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }
  
  async updateSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    this.saveToLocalStorage();
  }
  
  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    this.saveToLocalStorage();
  }
  
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions: Session[] = [];
    this.sessions.forEach(session => {
      if (session.userId === userId) {
        sessions.push(session);
      }
    });
    return sessions;
  }
  
  async deleteUserSessions(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    userSessions.forEach(session => {
      this.sessions.delete(session.id);
    });
    this.saveToLocalStorage();
  }
}

/**
 * Main Authentication Service
 */
export class AuthService {
  private userStorage = new UserStorage();
  private sessionStorage = new SessionStorage();
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  
  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<User> {
    // Validate password
    const passwordValidation = validatePassword(data.password, data.username);
    if (!passwordValidation.valid) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Password does not meet requirements',
        { errors: passwordValidation.errors }
      );
    }
    
    // Check if email/username already exists
    const existingEmail = await this.userStorage.getUserByEmail(data.email);
    if (existingEmail) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Email already registered'
      );
    }
    
    const existingUsername = await this.userStorage.getUserByUsername(data.username);
    if (existingUsername) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Username already taken'
      );
    }
    
    // Create user
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const verificationToken = generateSecureToken();
    
    const user: User = {
      id: `user_${Date.now()}_${generateSecureToken(8)}`,
      email: data.email,
      username: data.username,
      passwordHash,
      salt,
      role: data.role || UserRole.STUDENT,
      permissions: DEFAULT_PERMISSIONS[data.role || UserRole.STUDENT],
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        preferences: {
          theme: 'light',
          language: 'pt-BR',
          emailNotifications: true,
          pushNotifications: false
        }
      },
      security: {
        twoFactorEnabled: false,
        passwordHistory: [passwordHash],
        lastPasswordChange: new Date(),
        loginNotifications: true,
        trustedDevices: [],
        sessions: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isVerified: false,
      verificationToken
    };
    
    await this.userStorage.createUser(user);
    
    // In production, send verification email here
    console.log('Verification token:', verificationToken);
    
    return user;
  }
  
  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    // Check rate limiting
    const attemptsKey = data.username.toLowerCase();
    const attempts = this.loginAttempts.get(attemptsKey);
    
    if (attempts && attempts.count >= 5) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < 30 * 60 * 1000) { // 30 minutes
        throw new AuthError(
          AuthErrorType.ACCOUNT_LOCKED,
          'Account locked due to multiple failed login attempts. Please try again later.'
        );
      } else {
        this.loginAttempts.delete(attemptsKey);
      }
    }
    
    // Find user
    const user = await this.userStorage.getUserByUsername(data.username);
    if (!user) {
      this.recordFailedAttempt(attemptsKey);
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid username or password'
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.passwordHash, user.salt);
    if (!isValidPassword) {
      this.recordFailedAttempt(attemptsKey);
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid username or password'
      );
    }
    
    // Check account status
    if (!user.isActive) {
      throw new AuthError(
        AuthErrorType.ACCOUNT_INACTIVE,
        'Account is inactive'
      );
    }
    
    // Email verification temporarily disabled
    // if (!user.isVerified) {
    //   throw new AuthError(
    //     AuthErrorType.EMAIL_NOT_VERIFIED,
    //     'Please verify your email before logging in'
    //   );
    // }
    
    // Clear failed attempts
    this.loginAttempts.delete(attemptsKey);
    
    // Create session
    const session: Session = {
      id: generateSecureToken(),
      userId: user.id,
      deviceId: data.deviceId || generateSecureToken(16),
      deviceName: data.deviceName,
      ipAddress: '127.0.0.1', // In production, get from request
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + (data.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
      isActive: true
    };
    
    await this.sessionStorage.createSession(session);
    
    // Update user
    user.lastLogin = new Date();
    user.security.sessions.push(session);
    await this.userStorage.updateUser(user);
    
    // Create tokens
    const accessToken = await createAccessToken(
      user.id,
      user.email,
      user.role,
      user.permissions
    );
    
    const refreshToken = await createRefreshToken(user.id);
    
    // Store tokens
    storeTokens(accessToken, refreshToken);
    
    // Prepare response
    const { passwordHash, salt, security, ...safeUser } = user;
    
    return {
      user: safeUser,
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000 // 15 minutes
    };
  }
  
  /**
   * Logout user
   */
  async logout(sessionId?: string): Promise<void> {
    clearTokens();
    
    if (sessionId) {
      await this.sessionStorage.deleteSession(sessionId);
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<LoginResponse | null> {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) {
      return null;
    }
    
    const tokens = await rotateTokens(refreshToken, async (userId) => {
      const user = await this.userStorage.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        email: user.email,
        role: user.role,
        permissions: user.permissions
      };
    });
    
    if (!tokens) {
      clearTokens();
      return null;
    }
    
    storeTokens(tokens.accessToken, tokens.refreshToken);
    
    // Get user for response
    const tokenData = await validateToken<AccessTokenPayload>(tokens.accessToken);
    if (!tokenData.valid || !tokenData.payload) {
      return null;
    }
    
    const user = await this.userStorage.getUserById(tokenData.payload.sub);
    if (!user) {
      return null;
    }
    
    const { passwordHash, salt, security, ...safeUser } = user;
    
    return {
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 15 * 60 * 1000
    };
  }
  
  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    // Find user with verification token
    // In production, this would be a database query
    let foundUser: User | null = null;
    const users = await this.getAllUsers(); // This is a hack for demo
    
    for (const user of users) {
      if (user.verificationToken === token) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      throw new AuthError(
        AuthErrorType.TOKEN_INVALID,
        'Invalid verification token'
      );
    }
    
    foundUser.isVerified = true;
    foundUser.verificationToken = undefined;
    await this.userStorage.updateUser(foundUser);
  }
  
  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const user = await this.userStorage.getUserByEmail(data.email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }
    
    const resetToken = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await this.userStorage.setResetToken(user.id, resetToken, expires);
    
    // In production, send reset email here
    console.log('Password reset token:', resetToken);
  }
  
  /**
   * Reset password
   */
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    const tokenData = await this.userStorage.getResetToken(data.token);
    if (!tokenData) {
      throw new AuthError(
        AuthErrorType.TOKEN_INVALID,
        'Invalid or expired reset token'
      );
    }
    
    const user = await this.userStorage.getUserById(tokenData.userId);
    if (!user) {
      throw new AuthError(
        AuthErrorType.TOKEN_INVALID,
        'Invalid reset token'
      );
    }
    
    // Validate new password
    const passwordValidation = validatePassword(data.newPassword, user.username);
    if (!passwordValidation.valid) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Password does not meet requirements',
        { errors: passwordValidation.errors }
      );
    }
    
    // Update password
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.newPassword, salt);
    
    user.passwordHash = passwordHash;
    user.salt = salt;
    user.security.passwordHistory.push(passwordHash);
    user.security.lastPasswordChange = new Date();
    
    await this.userStorage.updateUser(user);
    await this.userStorage.deleteResetToken(data.token);
    
    // Invalidate all sessions
    await this.sessionStorage.deleteUserSessions(user.id);
  }
  
  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    const user = await this.userStorage.getUserById(userId);
    if (!user) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'User not found'
      );
    }
    
    // Verify current password
    const isValidPassword = await verifyPassword(data.currentPassword, user.passwordHash, user.salt);
    if (!isValidPassword) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Current password is incorrect'
      );
    }
    
    // Validate new password
    const passwordValidation = validatePassword(data.newPassword, user.username);
    if (!passwordValidation.valid) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Password does not meet requirements',
        { errors: passwordValidation.errors }
      );
    }
    
    // Update password
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.newPassword, salt);
    
    user.passwordHash = passwordHash;
    user.salt = salt;
    user.security.passwordHistory.push(passwordHash);
    user.security.lastPasswordChange = new Date();
    
    await this.userStorage.updateUser(user);
  }
  
  /**
   * Get current user from token
   */
  async getCurrentUser(): Promise<User | null> {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      return null;
    }
    
    const validation = await validateToken<AccessTokenPayload>(accessToken);
    if (!validation.valid || !validation.payload) {
      return null;
    }
    
    return this.userStorage.getUserById(validation.payload.sub);
  }
  
  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await this.userStorage.getUserById(userId);
    if (!user) {
      return false;
    }
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Check user permissions
    return user.permissions.some(permission => 
      permission.resource === resource &&
      permission.actions.includes(action as any)
    );
  }
  
  private recordFailedAttempt(key: string): void {
    const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(key, attempts);
  }
  
  // Helper method for demo purposes
  private async getAllUsers(): Promise<User[]> {
    const stored = localStorage.getItem('jungApp_users');
    if (!stored) return [];
    
    const users = JSON.parse(stored);
    return Object.values(users);
  }
}

// Export singleton instance
export const authService = new AuthService();