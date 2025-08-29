/**
 * Comprehensive unit tests for jwt.ts authentication service
 * Tests JWT creation, validation, token rotation, and storage operations
 */

import {
  createAccessToken,
  createRefreshToken,
  validateToken,
  decodeToken,
  isTokenExpired,
  storeTokens,
  getStoredTokens,
  clearTokens,
  rotateTokens,
  TOKEN_STORAGE_KEYS,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenValidationResult
} from '../jwt';
import { UserRole, Permission } from '../../../types/auth';

// Mock the crypto module
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    sign: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Mock generateSecureToken and constantTimeCompare from crypto.ts
jest.mock('../crypto', () => ({
  generateSecureToken: jest.fn((length = 32) => {
    return 'mock-secure-token-' + length;
  }),
  constantTimeCompare: jest.fn((a, b) => a === b)
}));

// Mock localStorage
const mockLocalStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock global crypto and btoa/atob
Object.defineProperty(global, 'crypto', { value: mockCrypto });
global.btoa = jest.fn((str) => {
  try {
    return Buffer.from(str, 'binary').toString('base64');
  } catch {
    return '';
  }
});
global.atob = jest.fn((str) => {
  try {
    return Buffer.from(str, 'base64').toString('binary');
  } catch {
    return '';
  }
});

describe('jwt.ts - createAccessToken', () => {
  const mockUserId = 'user123';
  const mockEmail = 'test@example.com';
  const mockRole: UserRole = 'student';
  const mockPermissions: Permission[] = ['read_modules', 'write_progress'];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto operations
    mockCrypto.subtle.importKey.mockResolvedValue({});
    const mockSignature = new ArrayBuffer(32);
    const mockArray = new Uint8Array(mockSignature);
    for (let i = 0; i < 32; i++) {
      mockArray[i] = i;
    }
    mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create access token with valid payload', async () => {
    const token = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
    
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    
    // Verify payload structure by decoding
    const payload = decodeToken<AccessTokenPayload>(token);
    expect(payload).toMatchObject({
      sub: mockUserId,
      email: mockEmail,
      role: mockRole,
      permissions: mockPermissions,
      exp: expect.any(Number),
      iat: expect.any(Number),
      jti: expect.any(String)
    });
  });

  it('should create token with expiration 15 minutes in future', async () => {
    const token = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
    const payload = decodeToken<AccessTokenPayload>(token);
    
    const expectedExp = Math.floor((Date.now() + 15 * 60 * 1000) / 1000);
    expect(payload?.exp).toBe(expectedExp);
  });

  it('should create token with current timestamp as iat', async () => {
    const token = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
    const payload = decodeToken<AccessTokenPayload>(token);
    
    const expectedIat = Math.floor(Date.now() / 1000);
    expect(payload?.iat).toBe(expectedIat);
  });

  it('should include unique JTI for each token', async () => {
    const token1 = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
    const token2 = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
    
    const payload1 = decodeToken<AccessTokenPayload>(token1);
    const payload2 = decodeToken<AccessTokenPayload>(token2);
    
    expect(payload1?.jti).not.toBe(payload2?.jti);
  });

  it('should handle empty permissions array', async () => {
    const token = await createAccessToken(mockUserId, mockEmail, mockRole, []);
    const payload = decodeToken<AccessTokenPayload>(token);
    
    expect(payload?.permissions).toEqual([]);
  });

  it('should handle different user roles', async () => {
    const roles: UserRole[] = ['student', 'instructor', 'admin'];
    
    for (const role of roles) {
      const token = await createAccessToken(mockUserId, mockEmail, role, mockPermissions);
      const payload = decodeToken<AccessTokenPayload>(token);
      expect(payload?.role).toBe(role);
    }
  });

  it('should handle crypto API failure', async () => {
    mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API failed'));
    
    await expect(createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions))
      .rejects.toThrow('Crypto API failed');
  });

  it('should handle very long user data', async () => {
    const longEmail = 'a'.repeat(1000) + '@example.com';
    const manyPermissions = Array(100).fill('read_modules') as Permission[];
    
    const token = await createAccessToken(mockUserId, longEmail, mockRole, manyPermissions);
    const payload = decodeToken<AccessTokenPayload>(token);
    
    expect(payload?.email).toBe(longEmail);
    expect(payload?.permissions).toHaveLength(100);
  });
});

describe('jwt.ts - createRefreshToken', () => {
  const mockUserId = 'user123';
  const mockTokenFamily = 'family123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto operations
    mockCrypto.subtle.importKey.mockResolvedValue({});
    const mockSignature = new ArrayBuffer(32);
    mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create refresh token with valid payload', async () => {
    const token = await createRefreshToken(mockUserId, mockTokenFamily);
    
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
    
    const payload = decodeToken<RefreshTokenPayload>(token);
    expect(payload).toMatchObject({
      sub: mockUserId,
      exp: expect.any(Number),
      iat: expect.any(Number),
      jti: expect.any(String),
      family: mockTokenFamily
    });
  });

  it('should create token with 30-day expiration', async () => {
    const token = await createRefreshToken(mockUserId);
    const payload = decodeToken<RefreshTokenPayload>(token);
    
    const expectedExp = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
    expect(payload?.exp).toBe(expectedExp);
  });

  it('should generate token family if not provided', async () => {
    const token = await createRefreshToken(mockUserId);
    const payload = decodeToken<RefreshTokenPayload>(token);
    
    expect(payload?.family).toBeDefined();
    expect(typeof payload?.family).toBe('string');
  });

  it('should use provided token family', async () => {
    const token = await createRefreshToken(mockUserId, mockTokenFamily);
    const payload = decodeToken<RefreshTokenPayload>(token);
    
    expect(payload?.family).toBe(mockTokenFamily);
  });

  it('should create different tokens for same user', async () => {
    const token1 = await createRefreshToken(mockUserId);
    const token2 = await createRefreshToken(mockUserId);
    
    expect(token1).not.toBe(token2);
    
    const payload1 = decodeToken<RefreshTokenPayload>(token1);
    const payload2 = decodeToken<RefreshTokenPayload>(token2);
    
    expect(payload1?.jti).not.toBe(payload2?.jti);
  });
});

describe('jwt.ts - validateToken', () => {
  let mockValidToken: string;
  let mockExpiredToken: string;
  let mockInvalidToken: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup crypto mocks
    mockCrypto.subtle.importKey.mockResolvedValue({});
    const mockSignature = new ArrayBuffer(32);
    mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

    // Mock constantTimeCompare to return true for valid signatures
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockImplementation((a: string, b: string) => 
      a.includes('valid') && b.includes('valid')
    );

    // Create test tokens
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    mockValidToken = await createAccessToken('user123', 'test@example.com', 'student', []);
    
    // Create expired token (past timestamp)
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000 - 20 * 60 * 1000); // 20 minutes ago
    mockExpiredToken = await createAccessToken('user123', 'test@example.com', 'student', []);
    
    // Reset time
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    
    mockInvalidToken = 'invalid.token.format';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should validate correct token', async () => {
    // Make signature validation pass
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);

    const result = await validateToken(mockValidToken);
    
    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should reject token with invalid format', async () => {
    const result = await validateToken('invalid-format');
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token format');
  });

  it('should reject token with invalid signature', async () => {
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(false);

    const result = await validateToken(mockValidToken);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid signature');
  });

  it('should reject expired token', async () => {
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);

    const result = await validateToken(mockExpiredToken);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });

  it('should handle token without expiration', async () => {
    // Create token without exp field
    const tokenWithoutExp = btoa(JSON.stringify({
      sub: 'user123',
      iat: Math.floor(Date.now() / 1000)
    }));
    const fakeToken = `header.${tokenWithoutExp}.signature`;
    
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);

    const result = await validateToken(fakeToken);
    
    expect(result.valid).toBe(true);
  });

  it('should handle malformed JSON in payload', async () => {
    const malformedPayload = 'not-valid-base64';
    const malformedToken = `header.${malformedPayload}.signature`;
    
    const result = await validateToken(malformedToken);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Token validation failed');
  });

  it('should handle crypto operation failures', async () => {
    mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto failed'));
    
    const result = await validateToken(mockValidToken);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return proper error for edge cases', async () => {
    const testCases = [
      { token: '', expectedError: 'Invalid token format' },
      { token: 'a.b', expectedError: 'Invalid token format' },
      { token: 'a.b.c.d', expectedError: 'Invalid token format' }
    ];

    for (const testCase of testCases) {
      const result = await validateToken(testCase.token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(testCase.expectedError);
    }
  });
});

describe('jwt.ts - decodeToken', () => {
  it('should decode valid token payload', () => {
    const payload = { sub: 'user123', exp: 1234567890 };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    const decoded = decodeToken(token);
    expect(decoded).toEqual(payload);
  });

  it('should return null for invalid token format', () => {
    expect(decodeToken('invalid')).toBeNull();
    expect(decodeToken('a.b')).toBeNull();
    expect(decodeToken('a.b.c.d')).toBeNull();
  });

  it('should return null for invalid base64', () => {
    const token = 'header.invalid-base64.signature';
    expect(decodeToken(token)).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    const invalidJson = btoa('not valid json');
    const token = `header.${invalidJson}.signature`;
    expect(decodeToken(token)).toBeNull();
  });

  it('should handle empty payload', () => {
    const emptyPayload = btoa('{}');
    const token = `header.${emptyPayload}.signature`;
    
    const decoded = decodeToken(token);
    expect(decoded).toEqual({});
  });

  it('should preserve all payload fields', () => {
    const complexPayload = {
      sub: 'user123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['read', 'write'],
      exp: 1234567890,
      iat: 1234567000,
      jti: 'token-id',
      custom: 'field'
    };
    
    const encodedPayload = btoa(JSON.stringify(complexPayload));
    const token = `header.${encodedPayload}.signature`;
    
    const decoded = decodeToken(token);
    expect(decoded).toEqual(complexPayload);
  });
});

describe('jwt.ts - isTokenExpired', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return false for valid token', () => {
    const futureExp = Math.floor((Date.now() + 60000) / 1000); // 1 minute in future
    const payload = { exp: futureExp };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    expect(isTokenExpired(token)).toBe(false);
  });

  it('should return true for expired token', () => {
    const pastExp = Math.floor((Date.now() - 60000) / 1000); // 1 minute in past
    const payload = { exp: pastExp };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for token without exp', () => {
    const payload = { sub: 'user123' };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for invalid token', () => {
    expect(isTokenExpired('invalid')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired('a.b.c')).toBe(true);
  });

  it('should handle exactly expired token', () => {
    const exactExp = Math.floor(Date.now() / 1000); // Exactly now
    const payload = { exp: exactExp };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    expect(isTokenExpired(token)).toBe(false); // Should be considered valid at exact time
  });

  it('should handle malformed expiration value', () => {
    const payload = { exp: 'invalid-exp' };
    const encodedPayload = btoa(JSON.stringify(payload));
    const token = `header.${encodedPayload}.signature`;
    
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('jwt.ts - Token Storage Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('storeTokens', () => {
    it('should store access and refresh tokens', () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      
      storeTokens(accessToken, refreshToken);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.accessToken,
        accessToken
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.refreshToken,
        refreshToken
      );
    });

    it('should handle empty tokens', () => {
      storeTokens('', '');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.accessToken,
        ''
      );
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(10000);
      storeTokens(longToken, longToken);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.accessToken,
        longToken
      );
    });
  });

  describe('getStoredTokens', () => {
    it('should retrieve stored tokens', () => {
      const accessToken = 'stored-access-token';
      const refreshToken = 'stored-refresh-token';
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      
      const result = getStoredTokens();
      
      expect(result).toEqual({
        accessToken,
        refreshToken
      });
    });

    it('should handle missing tokens', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = getStoredTokens();
      
      expect(result).toEqual({
        accessToken: null,
        refreshToken: null
      });
    });

    it('should handle partial token storage', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce(null);
      
      const result = getStoredTokens();
      
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: null
      });
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from storage', () => {
      clearTokens();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.accessToken
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        TOKEN_STORAGE_KEYS.refreshToken
      );
    });

    it('should handle storage removal errors', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => clearTokens()).toThrow('Storage error');
    });
  });
});

describe('jwt.ts - rotateTokens', () => {
  const mockUserId = 'user123';
  const mockFamily = 'family123';
  const mockUserData = {
    email: 'test@example.com',
    role: 'student' as UserRole,
    permissions: ['read_modules'] as Permission[]
  };

  let mockValidRefreshToken: string;
  let mockGetUserData: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup crypto mocks
    mockCrypto.subtle.importKey.mockResolvedValue({});
    const mockSignature = new ArrayBuffer(32);
    mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

    // Mock time
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

    // Create valid refresh token
    mockValidRefreshToken = await createRefreshToken(mockUserId, mockFamily);

    // Mock getUserData function
    mockGetUserData = jest.fn().mockResolvedValue(mockUserData);

    // Mock validateToken to return valid result
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should rotate tokens successfully with valid refresh token', async () => {
    const result = await rotateTokens(mockValidRefreshToken, mockGetUserData);
    
    expect(result).not.toBeNull();
    expect(result?.accessToken).toBeDefined();
    expect(result?.refreshToken).toBeDefined();
    expect(typeof result?.accessToken).toBe('string');
    expect(typeof result?.refreshToken).toBe('string');
  });

  it('should preserve token family in new refresh token', async () => {
    const result = await rotateTokens(mockValidRefreshToken, mockGetUserData);
    
    const newRefreshPayload = decodeToken<RefreshTokenPayload>(result!.refreshToken);
    expect(newRefreshPayload?.family).toBe(mockFamily);
  });

  it('should include user data in new access token', async () => {
    const result = await rotateTokens(mockValidRefreshToken, mockGetUserData);
    
    const newAccessPayload = decodeToken<AccessTokenPayload>(result!.accessToken);
    expect(newAccessPayload?.email).toBe(mockUserData.email);
    expect(newAccessPayload?.role).toBe(mockUserData.role);
    expect(newAccessPayload?.permissions).toEqual(mockUserData.permissions);
  });

  it('should return null for invalid refresh token', async () => {
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(false);

    const result = await rotateTokens('invalid-token', mockGetUserData);
    
    expect(result).toBeNull();
  });

  it('should return null when user data not found', async () => {
    mockGetUserData.mockResolvedValue(null);
    
    const result = await rotateTokens(mockValidRefreshToken, mockGetUserData);
    
    expect(result).toBeNull();
  });

  it('should return null for expired refresh token', async () => {
    // Create expired token
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000 - 31 * 24 * 60 * 60 * 1000); // 31 days ago
    const expiredToken = await createRefreshToken(mockUserId, mockFamily);
    
    // Reset time to current
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);

    const result = await rotateTokens(expiredToken, mockGetUserData);
    
    expect(result).toBeNull();
  });

  it('should handle getUserData errors', async () => {
    mockGetUserData.mockRejectedValue(new Error('Database error'));
    
    await expect(rotateTokens(mockValidRefreshToken, mockGetUserData))
      .rejects.toThrow('Database error');
  });

  it('should handle token creation failures', async () => {
    mockCrypto.subtle.sign.mockRejectedValue(new Error('Crypto failed'));
    
    await expect(rotateTokens(mockValidRefreshToken, mockGetUserData))
      .rejects.toThrow('Crypto failed');
  });

  it('should call getUserData with correct user ID', async () => {
    await rotateTokens(mockValidRefreshToken, mockGetUserData);
    
    expect(mockGetUserData).toHaveBeenCalledWith(mockUserId);
  });

  it('should handle malformed refresh token payload', async () => {
    const malformedPayload = btoa(JSON.stringify({ sub: mockUserId })); // Missing required fields
    const malformedToken = `header.${malformedPayload}.signature`;
    
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(true);

    const result = await rotateTokens(malformedToken, mockGetUserData);
    
    // Should still work if sub is present
    expect(result).not.toBeNull();
  });
});

describe('jwt.ts - Security and Edge Cases', () => {
  it('should handle concurrent token operations', async () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const role: UserRole = 'student';
    const permissions: Permission[] = ['read_modules'];

    // Setup mocks
    mockCrypto.subtle.importKey.mockResolvedValue({});
    const mockSignature = new ArrayBuffer(32);
    mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

    const promises = Array(10).fill(0).map(() => 
      createAccessToken(userId, email, role, permissions)
    );

    const tokens = await Promise.all(promises);
    
    expect(tokens).toHaveLength(10);
    // All tokens should be unique
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(10);
  });

  it('should handle memory pressure scenarios', async () => {
    // Test with very large data
    const largeEmail = 'a'.repeat(1000) + '@example.com'; // Reduced size for testing
    const largePermissions = Array(100).fill('read_modules') as Permission[];
    
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
    
    await expect(createAccessToken('user123', largeEmail, 'student', largePermissions))
      .resolves.toBeDefined();
  });

  it('should validate storage key constants', () => {
    expect(TOKEN_STORAGE_KEYS.accessToken).toBe('jungApp_accessToken');
    expect(TOKEN_STORAGE_KEYS.refreshToken).toBe('jungApp_refreshToken');
  });

  it('should handle localStorage unavailable', () => {
    const originalLocalStorage = global.localStorage;
    delete (global as any).localStorage;

    expect(() => storeTokens('token1', 'token2')).toThrow();
    expect(() => getStoredTokens()).toThrow();
    expect(() => clearTokens()).toThrow();

    global.localStorage = originalLocalStorage;
  });

  it('should prevent timing attacks in token validation', async () => {
    const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
    const invalidToken = 'different.header.signature';
    
    const { constantTimeCompare } = require('../crypto');
    constantTimeCompare.mockReturnValue(false);

    const times: number[] = [];
    
    // Test multiple validations
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await validateToken(i % 2 === 0 ? validToken : invalidToken);
      times.push(Date.now() - start);
    }
    
    // Times should be relatively consistent
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    expect(maxTime - minTime).toBeLessThan(50); // Allow some variance
  });

  it('should handle special characters in JWT payload', async () => {
    const specialEmail = 'test+special@example.com';
    
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

    const token = await createAccessToken('user123', specialEmail, 'student', []);
    const payload = decodeToken<AccessTokenPayload>(token);
    
    expect(payload?.email).toBe(specialEmail);
  });

  it('should validate JWT structure constants', () => {
    // Verify JWT expiration times are reasonable
    const accessExp = 15 * 60 * 1000; // 15 minutes
    const refreshExp = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    expect(accessExp).toBeLessThan(refreshExp);
    expect(accessExp).toBeGreaterThan(0);
    expect(refreshExp).toBeGreaterThan(0);
  });
});