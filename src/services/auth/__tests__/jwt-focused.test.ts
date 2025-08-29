/**
 * Focused unit tests for jwt.ts authentication service
 * Tests core JWT functions with proper mocking
 */

import {
  decodeToken,
  isTokenExpired,
  storeTokens,
  getStoredTokens,
  clearTokens,
  TOKEN_STORAGE_KEYS,
  AccessTokenPayload,
  RefreshTokenPayload
} from '../jwt';
import { UserRole, Permission } from '../../../types/auth';

// Mock localStorage
const mockLocalStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock btoa/atob for Node.js environment
global.btoa = jest.fn((str) => Buffer.from(str, 'binary').toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString('binary'));

describe('jwt.ts - Core Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('decodeToken', () => {
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
      expect(decodeToken('')).toBeNull();
    });

    it('should handle malformed base64', () => {
      const token = 'header.invalid-base64.signature';
      // Make atob throw an error for invalid base64
      (global.atob as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid base64');
      });
      
      expect(decodeToken(token)).toBeNull();
    });

    it('should handle invalid JSON', () => {
      const invalidJson = btoa('not valid json');
      const token = `header.${invalidJson}.signature`;
      expect(decodeToken(token)).toBeNull();
    });

    it('should preserve all payload fields', () => {
      const complexPayload = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
        exp: 1234567890,
        iat: 1234567000,
        jti: 'token-id'
      };
      
      const encodedPayload = btoa(JSON.stringify(complexPayload));
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = decodeToken(token);
      expect(decoded).toEqual(complexPayload);
    });
  });

  describe('isTokenExpired', () => {
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
    });

    it('should handle exactly current time', () => {
      const exactExp = Math.floor(Date.now() / 1000);
      const payload = { exp: exactExp };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(false);
    });
  });

  describe('Token Storage Functions', () => {
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
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      });

      it('should handle empty tokens', () => {
        storeTokens('', '');
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          TOKEN_STORAGE_KEYS.accessToken,
          ''
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
        expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(2);
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
        expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Security and Constants', () => {
    it('should validate storage key constants', () => {
      expect(TOKEN_STORAGE_KEYS.accessToken).toBe('jungApp_accessToken');
      expect(TOKEN_STORAGE_KEYS.refreshToken).toBe('jungApp_refreshToken');
    });

    it('should handle concurrent decode operations', () => {
      const payload = { sub: 'user123', exp: 1234567890 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const promises = Array(10).fill(0).map(() => decodeToken(token));
      const results = Promise.all(promises);
      
      expect(results).resolves.toHaveLength(10);
    });

    it('should handle edge case inputs gracefully', () => {
      // Test with null/undefined
      expect(decodeToken(null as any)).toBeNull();
      expect(decodeToken(undefined as any)).toBeNull();
      
      expect(isTokenExpired(null as any)).toBe(true);
      expect(isTokenExpired(undefined as any)).toBe(true);
      
      // Should not throw with invalid inputs
      expect(() => storeTokens(null as any, null as any)).not.toThrow();
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => storeTokens('token1', 'token2')).toThrow('Storage full');
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      
      expect(() => getStoredTokens()).toThrow('Storage unavailable');
      
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove');
      });
      
      expect(() => clearTokens()).toThrow('Cannot remove');
    });

    it('should handle malformed expiration values', () => {
      const payload = { exp: 'not-a-number' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(token)).toBe(true);
      
      const payload2 = { exp: null };
      const encodedPayload2 = btoa(JSON.stringify(payload2));
      const token2 = `header.${encodedPayload2}.signature`;
      
      expect(isTokenExpired(token2)).toBe(true);
    });

    it('should handle very large payloads', () => {
      const largePayload = {
        sub: 'user123',
        data: 'x'.repeat(10000) // Large data field
      };
      
      const encodedPayload = btoa(JSON.stringify(largePayload));
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = decodeToken(token);
      expect(decoded?.sub).toBe('user123');
      expect(decoded?.data).toHaveLength(10000);
    });
  });

  describe('Type Safety', () => {
    it('should handle AccessTokenPayload type correctly', () => {
      const payload: AccessTokenPayload = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'student' as UserRole,
        permissions: ['read_modules'] as Permission[],
        exp: 1234567890,
        iat: 1234567000,
        jti: 'token-id'
      };
      
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = decodeToken<AccessTokenPayload>(token);
      expect(decoded?.sub).toBe('user123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('student');
      expect(decoded?.permissions).toEqual(['read_modules']);
    });

    it('should handle RefreshTokenPayload type correctly', () => {
      const payload: RefreshTokenPayload = {
        sub: 'user123',
        exp: 1234567890,
        iat: 1234567000,
        jti: 'token-id',
        family: 'token-family'
      };
      
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = decodeToken<RefreshTokenPayload>(token);
      expect(decoded?.sub).toBe('user123');
      expect(decoded?.family).toBe('token-family');
    });
  });
});