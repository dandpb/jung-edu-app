/**
 * Authentication and Authorization Types
 */

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor', 
  STUDENT = 'student',
  GUEST = 'guest'
}

/**
 * Resource types that can be accessed
 */
export enum ResourceType {
  MODULE = 'module',
  QUIZ = 'quiz',
  NOTES = 'notes',
  MINDMAP = 'mindmap',
  ANALYTICS = 'analytics',
  USER = 'user',
  SYSTEM = 'system'
}

/**
 * Actions that can be performed on resources
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  SHARE = 'share'
}

/**
 * Permission condition types
 */
export interface PermissionCondition {
  type: 'ownership' | 'group' | 'time' | 'custom';
  value: any;
}

/**
 * Permission structure
 */
export interface Permission {
  id: string;
  resource: ResourceType;
  actions: Action[];
  conditions?: PermissionCondition[];
}

/**
 * User profile information
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  preferences: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Security settings for a user
 */
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordHistory: string[];
  lastPasswordChange: Date;
  loginNotifications: boolean;
  trustedDevices: string[];
  sessions: Session[];
}

/**
 * User session information
 */
export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Complete user model
 */
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  permissions: Permission[];
  profile: UserProfile;
  security: SecuritySettings;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

/**
 * Registration request data
 */
export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Login request data
 */
export interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
  deviceName?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: Omit<User, 'passwordHash' | 'salt' | 'security'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Two-factor authentication setup
 */
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Two-factor verification
 */
export interface TwoFactorVerification {
  userId: string;
  code: string;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details?: any;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  remaining: number;
  limit: number;
  reset: Date;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID = 'TWO_FACTOR_INVALID'
}

/**
 * Authentication error
 */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.GUEST],
  [UserRole.ADMIN]: [UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.GUEST],
  [UserRole.INSTRUCTOR]: [UserRole.STUDENT, UserRole.GUEST],
  [UserRole.STUDENT]: [UserRole.GUEST],
  [UserRole.GUEST]: []
};

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    {
      id: 'super-admin-all',
      resource: ResourceType.SYSTEM,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH, Action.SHARE]
    }
  ],
  [UserRole.ADMIN]: [
    {
      id: 'admin-modules',
      resource: ResourceType.MODULE,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.PUBLISH]
    },
    {
      id: 'admin-users',
      resource: ResourceType.USER,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE]
    },
    {
      id: 'admin-analytics',
      resource: ResourceType.ANALYTICS,
      actions: [Action.READ]
    }
  ],
  [UserRole.INSTRUCTOR]: [
    {
      id: 'instructor-modules',
      resource: ResourceType.MODULE,
      actions: [Action.CREATE, Action.READ, Action.UPDATE],
      conditions: [{ type: 'ownership', value: true }]
    },
    {
      id: 'instructor-quiz',
      resource: ResourceType.QUIZ,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
      conditions: [{ type: 'ownership', value: true }]
    },
    {
      id: 'instructor-analytics',
      resource: ResourceType.ANALYTICS,
      actions: [Action.READ],
      conditions: [{ type: 'ownership', value: true }]
    }
  ],
  [UserRole.STUDENT]: [
    {
      id: 'student-modules',
      resource: ResourceType.MODULE,
      actions: [Action.READ]
    },
    {
      id: 'student-quiz',
      resource: ResourceType.QUIZ,
      actions: [Action.READ]
    },
    {
      id: 'student-notes',
      resource: ResourceType.NOTES,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
      conditions: [{ type: 'ownership', value: true }]
    },
    {
      id: 'student-mindmap',
      resource: ResourceType.MINDMAP,
      actions: [Action.READ]
    }
  ],
  [UserRole.GUEST]: [
    {
      id: 'guest-modules',
      resource: ResourceType.MODULE,
      actions: [Action.READ],
      conditions: [{ type: 'custom', value: 'public_only' }]
    }
  ]
};