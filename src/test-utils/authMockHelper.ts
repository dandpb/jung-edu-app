import { UserRole } from '../types/auth';

/**
 * Creates a complete mock for AuthContextType with all required properties
 */
export const createCompleteAuthMock = (overrides: any = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue(undefined),
  requestPasswordReset: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  changePassword: jest.fn().mockResolvedValue(undefined),
  verifyEmail: jest.fn().mockResolvedValue(undefined),
  resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  hasPermission: jest.fn().mockReturnValue(false),
  hasRole: jest.fn().mockReturnValue(false),
  refreshSession: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  ...overrides
});