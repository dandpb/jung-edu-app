/**
 * JWT Authentication Error Handling Tests
 * Tests token expiration, malformed tokens, and signature validation failures
 */

import { jest } from '@jest/globals';
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
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenValidationResult
} from '../../src/services/auth/jwt';
import { UserRole, Permission } from '../../src/types/auth';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    sign: jest.fn(),
    digest: jest.fn()
  },
  getRandomValues: jest.fn()
};
Object.defineProperty(global, 'crypto', { value: mockCrypto });

// Mock btoa/atob for base64 encoding/decoding
global.btoa = jest.fn((str: string) => Buffer.from(str).toString('base64'));
global.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString());

describe('JWT Authentication Error Handling', () => {
  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockRole: UserRole = 'student';
  const mockPermissions: Permission[] = ['read:modules', 'write:progress'];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock successful crypto operations by default
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.getRandomValues.mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  describe('Token Creation Error Scenarios', () => {
    it('should handle crypto API unavailability during token creation', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API not available'));

      await expect(
        createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions)
      ).rejects.toThrow('Crypto API not available');
    });

    it('should handle HMAC signing failures', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockRejectedValue(new Error('Signing failed'));

      await expect(
        createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions)
      ).rejects.toThrow('Signing failed');
    });

    it('should handle invalid user data during token creation', async () => {
      await expect(
        createAccessToken('', mockEmail, mockRole, mockPermissions)
      ).rejects.toThrow('Invalid user ID');

      await expect(
        createAccessToken(mockUserId, '', mockRole, mockPermissions)
      ).rejects.toThrow('Invalid email');
    });

    it('should handle missing required fields in payload', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));

      // Test with null/undefined role
      await expect(
        createAccessToken(mockUserId, mockEmail, null as any, mockPermissions)
      ).rejects.toThrow('Invalid role');

      // Test with invalid permissions
      await expect(
        createAccessToken(mockUserId, mockEmail, mockRole, null as any)
      ).rejects.toThrow('Invalid permissions');
    });
  });

  describe('Token Validation Error Scenarios', () => {
    it('should handle malformed token format', async () => {
      const malformedTokens = [
        '', // Empty token
        'invalid', // Single part
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        'header..signature', // Empty payload
        '.payload.signature', // Empty header
        'header.payload.', // Empty signature
      ];

      for (const token of malformedTokens) {
        const result = await validateToken(token);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid token format');
      }
    });

    it('should handle invalid base64 encoding in token parts', async () => {
      // Mock atob to throw for invalid base64
      global.atob = jest.fn((str: string) => {
        if (str === 'invalid@base64') {
          throw new Error('Invalid character in base64');
        }
        return Buffer.from(str, 'base64').toString();
      });

      const invalidToken = 'invalid@base64.invalid@base64.validsignature';
      const result = await validateToken(invalidToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token validation failed');
    });

    it('should handle invalid JSON in token payload', async () => {
      global.atob = jest.fn((str: string) => {
        if (str === 'header') return JSON.stringify({ alg: 'HS256', typ: 'JWT' });
        if (str === 'payload') return 'invalid json{}';
        return 'signature';
      });

      const invalidToken = 'header.payload.signature';
      const result = await validateToken(invalidToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token validation failed');
    });

    it('should handle signature verification failures', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
      
      // Create a valid token first
      const validToken = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
      
      // Tamper with the token by changing the signature
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;
      
      const result = await validateToken(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should handle expired tokens', async () => {
      // Mock Date.now to simulate token expiration
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      
      try {
        // Create token in the past
        mockNow.mockReturnValue(1000000); // Past time
        mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
        mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
        
        const expiredToken = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
        
        // Validate in the future
        mockNow.mockReturnValue(Date.now() + 24 * 60 * 60 * 1000); // Future time
        
        const result = await validateToken(expiredToken);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token expired');
      } finally {
        Date.now = originalNow;
      }
    });

    it('should handle crypto API failures during validation', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API failed'));
      
      const result = await validateToken('header.payload.signature');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token validation failed');
    });
  });

  describe('Token Decoding Error Scenarios', () => {
    it('should handle malformed tokens gracefully in decodeToken', () => {
      const malformedTokens = [
        '',
        'invalid',
        'header.payload',
        'header.payload.signature.extra'
      ];

      malformedTokens.forEach(token => {
        const result = decodeToken(token);
        expect(result).toBeNull();
      });
    });

    it('should handle JSON parsing errors in decodeToken', () => {
      global.atob = jest.fn(() => 'invalid json{}');
      
      const result = decodeToken('header.payload.signature');
      expect(result).toBeNull();
    });

    it('should handle base64 decoding errors in decodeToken', () => {
      global.atob = jest.fn(() => {
        throw new Error('Invalid base64');
      });
      
      const result = decodeToken('header.payload.signature');
      expect(result).toBeNull();
    });
  });

  describe('Token Expiration Check Error Scenarios', () => {
    it('should handle tokens without expiration field', () => {
      global.atob = jest.fn((str: string) => {
        if (str === 'payload') {
          return JSON.stringify({ sub: 'user-123' }); // No exp field
        }
        return 'decoded';
      });
      
      const result = isTokenExpired('header.payload.signature');
      expect(result).toBe(true); // Should be considered expired if no exp field
    });

    it('should handle malformed expiration values', () => {
      global.atob = jest.fn((str: string) => {
        if (str === 'payload') {
          return JSON.stringify({ exp: 'not-a-number' });
        }
        return 'decoded';
      });
      
      const result = isTokenExpired('header.payload.signature');
      expect(result).toBe(true); // Should be considered expired if exp is invalid
    });

    it('should handle decoding errors during expiration check', () => {
      global.atob = jest.fn(() => {
        throw new Error('Decoding failed');
      });
      
      const result = isTokenExpired('header.payload.signature');
      expect(result).toBe(true); // Should be considered expired if decoding fails
    });
  });

  describe('Token Storage Error Scenarios', () => {
    it('should handle localStorage unavailability during storage', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });
      
      expect(() => {
        storeTokens('access-token', 'refresh-token');
      }).toThrow('localStorage is not available');
    });

    it('should handle localStorage quota exceeded errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError: localStorage quota exceeded');
      });
      
      expect(() => {
        storeTokens('access-token', 'refresh-token');
      }).toThrow('QuotaExceededError');
    });

    it('should handle localStorage access errors during retrieval', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      expect(() => {
        getStoredTokens();
      }).toThrow('localStorage access denied');
    });

    it('should handle localStorage access errors during clearing', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage removal failed');
      });
      
      expect(() => {
        clearTokens();
      }).toThrow('localStorage removal failed');
    });

    it('should handle corrupted data in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('corrupted-token-data');
      
      const result = getStoredTokens();
      expect(result.accessToken).toBe('corrupted-token-data');
      expect(result.refreshToken).toBe('corrupted-token-data');
    });
  });

  describe('Token Rotation Error Scenarios', () => {
    it('should handle invalid refresh tokens during rotation', async () => {
      const invalidRefreshToken = 'invalid.refresh.token';
      const getUserData = jest.fn();
      
      const result = await rotateTokens(invalidRefreshToken, getUserData);
      expect(result).toBeNull();
      expect(getUserData).not.toHaveBeenCalled();
    });

    it('should handle user data retrieval failures during rotation', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
      
      // Create a valid refresh token
      const refreshToken = await createRefreshToken(mockUserId);
      
      const getUserData = jest.fn().mockRejectedValue(new Error('User not found'));
      
      const result = await rotateTokens(refreshToken, getUserData);
      expect(result).toBeNull();
    });

    it('should handle crypto failures during new token creation in rotation', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign
        .mockResolvedValueOnce(new ArrayBuffer(32)) // For refresh token validation
        .mockRejectedValue(new Error('Crypto failed')); // For new token creation
      
      const refreshToken = await createRefreshToken(mockUserId);
      const getUserData = jest.fn().mockResolvedValue({
        email: mockEmail,
        role: mockRole,
        permissions: mockPermissions
      });
      
      await expect(
        rotateTokens(refreshToken, getUserData)
      ).rejects.toThrow('Crypto failed');
    });

    it('should handle expired refresh tokens during rotation', async () => {
      const originalNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;
      
      try {
        // Create refresh token in the past
        mockNow.mockReturnValue(1000000);
        mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
        mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
        
        const expiredRefreshToken = await createRefreshToken(mockUserId);
        
        // Try to rotate in the future
        mockNow.mockReturnValue(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31 days later
        
        const getUserData = jest.fn();
        const result = await rotateTokens(expiredRefreshToken, getUserData);
        
        expect(result).toBeNull();
        expect(getUserData).not.toHaveBeenCalled();
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Browser Compatibility Error Scenarios', () => {
    it('should handle missing crypto.subtle API', async () => {
      const originalCrypto = global.crypto;
      global.crypto = {} as Crypto; // Missing subtle API
      
      try {
        await expect(
          createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions)
        ).rejects.toThrow();
      } finally {
        global.crypto = originalCrypto;
      }
    });

    it('should handle missing btoa/atob functions', async () => {
      const originalBtoa = global.btoa;
      const originalAtob = global.atob;
      
      // Remove btoa/atob
      delete (global as any).btoa;
      delete (global as any).atob;
      
      try {
        await expect(
          createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions)
        ).rejects.toThrow();
      } finally {
        global.btoa = originalBtoa;
        global.atob = originalAtob;
      }
    });

    it('should handle insecure context (no crypto API)', async () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      try {
        await expect(
          createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions)
        ).rejects.toThrow('Crypto API not available');
      } finally {
        global.crypto = originalCrypto;
      }
    });
  });

  describe('Security Attack Scenarios', () => {
    it('should reject tokens with algorithm confusion attacks', async () => {
      // Mock a token with 'none' algorithm
      global.atob = jest.fn((str: string) => {
        if (str === 'header') {
          return JSON.stringify({ alg: 'none', typ: 'JWT' });
        }
        if (str === 'payload') {
          return JSON.stringify({ sub: mockUserId, exp: Date.now() / 1000 + 3600 });
        }
        return '';
      });
      
      const maliciousToken = 'header.payload.';
      const result = await validateToken(maliciousToken);
      
      expect(result.valid).toBe(false);
    });

    it('should reject tokens with weak algorithms', async () => {
      global.atob = jest.fn((str: string) => {
        if (str === 'header') {
          return JSON.stringify({ alg: 'MD5', typ: 'JWT' }); // Weak algorithm
        }
        if (str === 'payload') {
          return JSON.stringify({ sub: mockUserId, exp: Date.now() / 1000 + 3600 });
        }
        return 'signature';
      });
      
      const weakToken = 'header.payload.signature';
      const result = await validateToken(weakToken);
      
      expect(result.valid).toBe(false);
    });

    it('should handle timing attacks with constant-time comparison', async () => {
      const startTime = performance.now();
      
      // Test multiple invalid signatures of different lengths
      const invalidSignatures = [
        'short',
        'medium-length',
        'very-long-signature-that-might-cause-timing-differences'
      ];
      
      const times: number[] = [];
      
      for (const signature of invalidSignatures) {
        const testStart = performance.now();
        
        global.atob = jest.fn((str: string) => {
          if (str === 'header') return JSON.stringify({ alg: 'HS256', typ: 'JWT' });
          if (str === 'payload') return JSON.stringify({ sub: mockUserId, exp: Date.now() / 1000 + 3600 });
          return 'signature';
        });
        
        await validateToken(`header.payload.${signature}`);
        times.push(performance.now() - testStart);
      }
      
      // Check that timing differences are minimal (within 10ms)
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime - minTime).toBeLessThan(10);
    });

    it('should prevent JWT payload tampering', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
      
      const originalToken = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
      const parts = originalToken.split('.');
      
      // Tamper with payload (change user role)
      const tamperedPayload = {
        ...JSON.parse(atob(parts[1])),
        role: 'admin' // Escalate privileges
      };
      
      const tamperedToken = `${parts[0]}.${btoa(JSON.stringify(tamperedPayload))}.${parts[2]}`;
      const result = await validateToken(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('Concurrent Access Error Scenarios', () => {
    it('should handle concurrent token validation requests', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(32));
      
      const token = await createAccessToken(mockUserId, mockEmail, mockRole, mockPermissions);
      
      // Validate same token concurrently
      const validationPromises = Array(10).fill(null).map(() => validateToken(token));
      const results = await Promise.all(validationPromises);
      
      // All validations should succeed
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });
    });

    it('should handle concurrent token storage operations', () => {
      const storagePromises = Array(10).fill(null).map((_, index) => {
        return new Promise<void>((resolve, reject) => {
          try {
            storeTokens(`access-token-${index}`, `refresh-token-${index}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
      
      expect(() => {
        return Promise.all(storagePromises);
      }).not.toThrow();
    });
  });
});
