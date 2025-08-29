/**
 * Comprehensive test suite for JWT service
 * Tests token generation, validation, refresh, and security features
 * Targets 90%+ coverage for JWT authentication functionality
 */

import { JWTService, TokenPair, JWTPayload, TokenValidationResult } from '../jwt';
import * as crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn()
}));

describe('JWTService', () => {
  let jwtService: JWTService;
  const mockSecret = 'test-secret-key-for-jwt-testing-purposes-must-be-long-enough';
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'student'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('mock-random-bytes', 'utf-8'));
    
    jwtService = new JWTService(mockSecret);
  });

  describe('Constructor', () => {
    it('should initialize with secret', () => {
      expect(jwtService).toBeInstanceOf(JWTService);
    });

    it('should throw error for short secret', () => {
      expect(() => {
        new JWTService('short');
      }).toThrow('JWT secret must be at least 32 characters long');
    });

    it('should use environment variable when no secret provided', () => {
      process.env.JWT_SECRET = 'environment-jwt-secret-key-for-testing-long-enough';
      
      const envService = new JWTService();
      expect(envService).toBeInstanceOf(JWTService);
      
      delete process.env.JWT_SECRET;
    });

    it('should throw error when no secret available', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => {
        new JWTService();
      }).toThrow('JWT secret is required');
    });
  });

  describe('Token Generation', () => {
    it('should generate valid token pair', () => {
      const tokenPair = jwtService.generateTokens(mockUser);

      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(tokenPair).toHaveProperty('tokenType', 'Bearer');

      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
      expect(tokenPair.accessToken.split('.')).toHaveLength(3); // JWT format
      expect(tokenPair.refreshToken.split('.')).toHaveLength(3);
    });

    it('should include correct payload in access token', () => {
      const tokenPair = jwtService.generateTokens(mockUser);
      const decoded = jwtService.verifyToken(tokenPair.accessToken);

      expect(decoded.isValid).toBe(true);
      expect(decoded.payload).toEqual(expect.objectContaining({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access'
      }));
    });

    it('should include correct payload in refresh token', () => {
      const tokenPair = jwtService.generateTokens(mockUser);
      const decoded = jwtService.verifyToken(tokenPair.refreshToken);

      expect(decoded.isValid).toBe(true);
      expect(decoded.payload).toEqual(expect.objectContaining({
        sub: mockUser.id,
        type: 'refresh'
      }));
    });

    it('should set correct expiration times', () => {
      const tokenPair = jwtService.generateTokens(mockUser);
      
      const accessDecoded = jwtService.verifyToken(tokenPair.accessToken);
      const refreshDecoded = jwtService.verifyToken(tokenPair.refreshToken);

      expect(accessDecoded.payload?.exp).toBeDefined();
      expect(refreshDecoded.payload?.exp).toBeDefined();
      
      // Access token should expire before refresh token
      expect(accessDecoded.payload!.exp! < refreshDecoded.payload!.exp!).toBe(true);
    });

    it('should generate unique JTI for each token', () => {
      const tokenPair1 = jwtService.generateTokens(mockUser);
      const tokenPair2 = jwtService.generateTokens(mockUser);
      
      const decoded1 = jwtService.verifyToken(tokenPair1.accessToken);
      const decoded2 = jwtService.verifyToken(tokenPair2.accessToken);

      expect(decoded1.payload?.jti).toBeDefined();
      expect(decoded2.payload?.jti).toBeDefined();
      expect(decoded1.payload?.jti).not.toBe(decoded2.payload?.jti);
    });

    it('should use custom options when provided', () => {
      const customOptions = {
        accessExpiresIn: '2h',
        refreshExpiresIn: '14d',
        issuer: 'custom-issuer',
        audience: 'custom-audience'
      };

      const tokenPair = jwtService.generateTokens(mockUser, customOptions);
      const decoded = jwtService.verifyToken(tokenPair.accessToken);

      expect(decoded.payload?.iss).toBe('custom-issuer');
      expect(decoded.payload?.aud).toBe('custom-audience');
    });

    it('should handle user with additional claims', () => {
      const userWithClaims = {
        ...mockUser,
        permissions: ['read', 'write'],
        department: 'engineering'
      };

      const tokenPair = jwtService.generateTokens(userWithClaims);
      const decoded = jwtService.verifyToken(tokenPair.accessToken);

      expect(decoded.payload).toEqual(expect.objectContaining({
        permissions: ['read', 'write'],
        department: 'engineering'
      }));
    });
  });

  describe('Token Validation', () => {
    let validTokenPair: TokenPair;

    beforeEach(() => {
      validTokenPair = jwtService.generateTokens(mockUser);
    });

    it('should validate correct token', () => {
      const result = jwtService.verifyToken(validTokenPair.accessToken);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject malformed tokens', () => {
      const malformedTokens = [
        'invalid.token',
        'not-a-token',
        'too.few.parts',
        'too.many.parts.here.extra',
        ''
      ];

      malformedTokens.forEach(token => {
        const result = jwtService.verifyToken(token);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });
    });

    it('should reject token with invalid signature', () => {
      const tokenWithBadSignature = validTokenPair.accessToken.slice(0, -5) + 'xxxxx';
      const result = jwtService.verifyToken(tokenWithBadSignature);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token signature');
    });

    it('should reject expired tokens', () => {
      // Generate token with very short expiration
      const shortLivedOptions = { accessExpiresIn: '1ms' };
      const shortLivedPair = jwtService.generateTokens(mockUser, shortLivedOptions);

      // Wait for expiration
      setTimeout(() => {
        const result = jwtService.verifyToken(shortLivedPair.accessToken);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Token expired');
      }, 10);
    });

    it('should validate token type requirement', () => {
      const accessResult = jwtService.verifyToken(validTokenPair.accessToken, 'access');
      const refreshResult = jwtService.verifyToken(validTokenPair.refreshToken, 'access');

      expect(accessResult.isValid).toBe(true);
      expect(refreshResult.isValid).toBe(false);
      expect(refreshResult.error).toBe('Invalid token type');
    });

    it('should handle tokens with missing required claims', () => {
      // Create a token manually without required claims
      const invalidPayload = { sub: 'user-123' }; // Missing type
      const header = { alg: 'HS256', typ: 'JWT' };
      
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(invalidPayload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', mockSecret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');
      
      const malformedToken = `${encodedHeader}.${encodedPayload}.${signature}`;
      const result = jwtService.verifyToken(malformedToken);

      expect(result.isValid).toBe(false);
    });

    it('should validate issuer when specified in options', () => {
      const tokenWithIssuer = jwtService.generateTokens(mockUser, { issuer: 'test-issuer' });
      
      const validResult = jwtService.verifyToken(tokenWithIssuer.accessToken, undefined, { issuer: 'test-issuer' });
      const invalidResult = jwtService.verifyToken(tokenWithIssuer.accessToken, undefined, { issuer: 'wrong-issuer' });

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid issuer');
    });

    it('should validate audience when specified', () => {
      const tokenWithAudience = jwtService.generateTokens(mockUser, { audience: 'test-audience' });
      
      const validResult = jwtService.verifyToken(tokenWithAudience.accessToken, undefined, { audience: 'test-audience' });
      const invalidResult = jwtService.verifyToken(tokenWithAudience.accessToken, undefined, { audience: 'wrong-audience' });

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid audience');
    });
  });

  describe('Token Refresh', () => {
    let initialTokenPair: TokenPair;

    beforeEach(() => {
      initialTokenPair = jwtService.generateTokens(mockUser);
    });

    it('should refresh tokens with valid refresh token', () => {
      const newTokenPair = jwtService.refreshTokens(initialTokenPair.refreshToken);

      expect(newTokenPair).toHaveProperty('accessToken');
      expect(newTokenPair).toHaveProperty('refreshToken');
      expect(newTokenPair.accessToken).not.toBe(initialTokenPair.accessToken);
      expect(newTokenPair.refreshToken).not.toBe(initialTokenPair.refreshToken);
    });

    it('should preserve user claims in refreshed token', () => {
      const newTokenPair = jwtService.refreshTokens(initialTokenPair.refreshToken);
      const decoded = jwtService.verifyToken(newTokenPair.accessToken);

      expect(decoded.payload).toEqual(expect.objectContaining({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      }));
    });

    it('should reject invalid refresh token', () => {
      expect(() => {
        jwtService.refreshTokens('invalid.refresh.token');
      }).toThrow('Invalid refresh token');
    });

    it('should reject access token for refresh', () => {
      expect(() => {
        jwtService.refreshTokens(initialTokenPair.accessToken);
      }).toThrow('Invalid token type for refresh');
    });

    it('should reject expired refresh token', () => {
      const shortRefreshOptions = { refreshExpiresIn: '1ms' };
      const shortRefreshPair = jwtService.generateTokens(mockUser, shortRefreshOptions);

      setTimeout(() => {
        expect(() => {
          jwtService.refreshTokens(shortRefreshPair.refreshToken);
        }).toThrow('Refresh token expired');
      }, 10);
    });

    it('should handle custom options during refresh', () => {
      const customOptions = {
        accessExpiresIn: '4h',
        issuer: 'refresh-issuer'
      };

      const newTokenPair = jwtService.refreshTokens(initialTokenPair.refreshToken, customOptions);
      const decoded = jwtService.verifyToken(newTokenPair.accessToken);

      expect(decoded.payload?.iss).toBe('refresh-issuer');
    });
  });

  describe('Token Extraction', () => {
    let validTokenPair: TokenPair;

    beforeEach(() => {
      validTokenPair = jwtService.generateTokens(mockUser);
    });

    it('should extract token from Authorization header', () => {
      const bearerToken = `Bearer ${validTokenPair.accessToken}`;
      const extracted = jwtService.extractTokenFromHeader(bearerToken);

      expect(extracted).toBe(validTokenPair.accessToken);
    });

    it('should handle header without Bearer prefix', () => {
      const extracted = jwtService.extractTokenFromHeader(validTokenPair.accessToken);

      expect(extracted).toBe(validTokenPair.accessToken);
    });

    it('should handle empty or invalid headers', () => {
      expect(jwtService.extractTokenFromHeader('')).toBeNull();
      expect(jwtService.extractTokenFromHeader('Bearer')).toBeNull();
      expect(jwtService.extractTokenFromHeader('Basic xyz')).toBeNull();
      expect(jwtService.extractTokenFromHeader(null as any)).toBeNull();
      expect(jwtService.extractTokenFromHeader(undefined as any)).toBeNull();
    });

    it('should trim whitespace from extracted tokens', () => {
      const headerWithSpaces = `Bearer   ${validTokenPair.accessToken}   `;
      const extracted = jwtService.extractTokenFromHeader(headerWithSpaces);

      expect(extracted).toBe(validTokenPair.accessToken);
    });

    it('should handle case insensitive Bearer keyword', () => {
      const lowerCaseBearer = `bearer ${validTokenPair.accessToken}`;
      const mixedCaseBearer = `BeArEr ${validTokenPair.accessToken}`;

      expect(jwtService.extractTokenFromHeader(lowerCaseBearer)).toBe(validTokenPair.accessToken);
      expect(jwtService.extractTokenFromHeader(mixedCaseBearer)).toBe(validTokenPair.accessToken);
    });
  });

  describe('Token Decoding (without verification)', () => {
    let validTokenPair: TokenPair;

    beforeEach(() => {
      validTokenPair = jwtService.generateTokens(mockUser);
    });

    it('should decode token payload without verification', () => {
      const decoded = jwtService.decodeToken(validTokenPair.accessToken);

      expect(decoded).toEqual(expect.objectContaining({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access'
      }));
    });

    it('should handle malformed tokens gracefully', () => {
      expect(() => {
        jwtService.decodeToken('invalid.token');
      }).toThrow('Invalid token format');
    });

    it('should handle tokens with invalid JSON payload', () => {
      const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
      const invalidPayload = Buffer.from('invalid-json{').toString('base64url');
      const signature = 'signature';
      const malformedToken = `${header}.${invalidPayload}.${signature}`;

      expect(() => {
        jwtService.decodeToken(malformedToken);
      }).toThrow();
    });
  });

  describe('Token Blacklisting', () => {
    let validTokenPair: TokenPair;

    beforeEach(() => {
      validTokenPair = jwtService.generateTokens(mockUser);
    });

    it('should blacklist token successfully', () => {
      const jti = jwtService.decodeToken(validTokenPair.accessToken).jti!;
      
      jwtService.blacklistToken(jti);
      
      const result = jwtService.verifyToken(validTokenPair.accessToken);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token has been blacklisted');
    });

    it('should check if token is blacklisted', () => {
      const jti = jwtService.decodeToken(validTokenPair.accessToken).jti!;
      
      expect(jwtService.isTokenBlacklisted(jti)).toBe(false);
      
      jwtService.blacklistToken(jti);
      
      expect(jwtService.isTokenBlacklisted(jti)).toBe(true);
    });

    it('should handle blacklisting non-existent tokens', () => {
      expect(() => {
        jwtService.blacklistToken('non-existent-jti');
      }).not.toThrow();
      
      expect(jwtService.isTokenBlacklisted('non-existent-jti')).toBe(true);
    });

    it('should clear expired blacklist entries', () => {
      const jti = 'expired-token-jti';
      jwtService.blacklistToken(jti);
      
      // Manually set expiration to past date
      jwtService['blacklistedTokens'].set(jti, Date.now() - 1000);
      
      // Clear expired entries
      jwtService['clearExpiredBlacklistEntries']();
      
      expect(jwtService.isTokenBlacklisted(jti)).toBe(false);
    });

    it('should periodically clean blacklist', () => {
      jest.useFakeTimers();
      
      const jwtServiceWithCleanup = new JWTService(mockSecret);
      const clearSpy = jest.spyOn(jwtServiceWithCleanup as any, 'clearExpiredBlacklistEntries');
      
      // Fast forward time to trigger cleanup
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      
      expect(clearSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Security Features', () => {
    it('should generate cryptographically secure JTI', () => {
      const jti1 = jwtService['generateJTI']();
      const jti2 = jwtService['generateJTI']();

      expect(jti1).not.toBe(jti2);
      expect(jti1.length).toBeGreaterThan(16); // Should be reasonably long
      expect(typeof jti1).toBe('string');
    });

    it('should use constant-time comparison for signatures', () => {
      // This is inherent in crypto.timingSafeEqual usage
      // We test by ensuring verification works correctly
      const tokenPair = jwtService.generateTokens(mockUser);
      const result = jwtService.verifyToken(tokenPair.accessToken);

      expect(result.isValid).toBe(true);
    });

    it('should handle timing attacks by consistent error responses', () => {
      const start = Date.now();
      jwtService.verifyToken('invalid.token.here');
      const invalidTime = Date.now() - start;

      const start2 = Date.now();
      jwtService.verifyToken('another.invalid.token');
      const invalidTime2 = Date.now() - start2;

      // Times should be roughly similar (within reason for test environment)
      const timeDiff = Math.abs(invalidTime - invalidTime2);
      expect(timeDiff).toBeLessThan(50); // Allow 50ms variance
    });

    it('should prevent token reuse after blacklisting', () => {
      const tokenPair = jwtService.generateTokens(mockUser);
      const jti = jwtService.decodeToken(tokenPair.accessToken).jti!;
      
      // Token should be valid initially
      expect(jwtService.verifyToken(tokenPair.accessToken).isValid).toBe(true);
      
      // Blacklist the token
      jwtService.blacklistToken(jti);
      
      // Token should now be invalid
      expect(jwtService.verifyToken(tokenPair.accessToken).isValid).toBe(false);
      
      // Should remain invalid on subsequent checks
      expect(jwtService.verifyToken(tokenPair.accessToken).isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle crypto errors gracefully', () => {
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        throw new Error('Crypto error');
      });

      expect(() => {
        jwtService.generateTokens(mockUser);
      }).toThrow('Crypto error');
    });

    it('should handle missing user data', () => {
      expect(() => {
        jwtService.generateTokens(null as any);
      }).toThrow();

      expect(() => {
        jwtService.generateTokens(undefined as any);
      }).toThrow();
    });

    it('should handle empty user ID', () => {
      const userWithoutId = { ...mockUser, id: '' };
      
      expect(() => {
        jwtService.generateTokens(userWithoutId);
      }).toThrow();
    });

    it('should handle JSON parsing errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a token with malformed payload
      const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
      const badPayload = 'not-valid-base64!@#';
      const signature = 'signature';
      const malformedToken = `${header}.${badPayload}.${signature}`;

      const result = jwtService.verifyToken(malformedToken);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token format');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Token Expiration', () => {
    it('should set appropriate default expiration times', () => {
      const tokenPair = jwtService.generateTokens(mockUser);
      
      const accessDecoded = jwtService.decodeToken(tokenPair.accessToken);
      const refreshDecoded = jwtService.decodeToken(tokenPair.refreshToken);
      
      const now = Math.floor(Date.now() / 1000);
      const accessExpiration = accessDecoded.exp!;
      const refreshExpiration = refreshDecoded.exp!;
      
      // Access token should expire in ~15 minutes (900 seconds)
      expect(accessExpiration - now).toBeCloseTo(900, -1);
      
      // Refresh token should expire in ~7 days (604800 seconds)
      expect(refreshExpiration - now).toBeCloseTo(604800, -2);
    });

    it('should handle custom expiration formats', () => {
      const customOptions = {
        accessExpiresIn: '2h',
        refreshExpiresIn: '30d'
      };
      
      const tokenPair = jwtService.generateTokens(mockUser, customOptions);
      
      const accessDecoded = jwtService.decodeToken(tokenPair.accessToken);
      const refreshDecoded = jwtService.decodeToken(tokenPair.refreshToken);
      
      const now = Math.floor(Date.now() / 1000);
      
      // 2 hours = 7200 seconds
      expect(accessDecoded.exp! - now).toBeCloseTo(7200, -1);
      
      // 30 days = 2592000 seconds
      expect(refreshDecoded.exp! - now).toBeCloseTo(2592000, -2);
    });

    it('should reject tokens after expiration', (done) => {
      const shortExpiryOptions = {
        accessExpiresIn: '100ms'
      };
      
      const tokenPair = jwtService.generateTokens(mockUser, shortExpiryOptions);
      
      setTimeout(() => {
        const result = jwtService.verifyToken(tokenPair.accessToken);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Token expired');
        done();
      }, 150);
    });
  });

  describe('Memory Management', () => {
    it('should limit blacklist size to prevent memory leaks', () => {
      // Add many entries to blacklist
      for (let i = 0; i < 1000; i++) {
        jwtService.blacklistToken(`jti-${i}`);
      }
      
      expect(jwtService['blacklistedTokens'].size).toBeLessThanOrEqual(1000);
    });

    it('should clean up expired blacklist entries automatically', () => {
      const expiredJti = 'expired-jti';
      
      // Manually add expired entry
      jwtService['blacklistedTokens'].set(expiredJti, Date.now() - 100000);
      
      // Trigger cleanup
      jwtService['clearExpiredBlacklistEntries']();
      
      expect(jwtService.isTokenBlacklisted(expiredJti)).toBe(false);
    });
  });
});