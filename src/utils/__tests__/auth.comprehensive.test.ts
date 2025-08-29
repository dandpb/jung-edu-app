/**
 * Comprehensive tests for auth utility functions
 * Achieving 90%+ code coverage with edge cases and error scenarios
 */

import {
  hashPassword,
  generateSalt,
  verifyPassword,
  generateToken,
  createSessionToken,
  validateSessionToken
} from '../auth';

// Mock Buffer for Node.js environment (keeping for reference)
const mockBuffer = {
  from: jest.fn((str: string, encoding?: string) => ({
    toString: jest.fn((outputEncoding?: string) => {
      if (encoding === 'base64' && outputEncoding === undefined) {
        return str; // Mock implementation
      }
      return btoa ? btoa(str) : 'mock-base64';
    })
  }))
};

// Mock btoa/atob for browser environment
const originalBtoa = global.btoa;
const originalAtob = global.atob;
const originalBuffer = (global as any).Buffer;

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.btoa = originalBtoa;
    global.atob = originalAtob;
    (global as any).Buffer = originalBuffer;
  });

  describe('hashPassword', () => {
    it('should hash a password with salt consistently', () => {
      const password = 'testPassword123';
      const salt = 'abc123';
      
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different passwords', () => {
      const salt = 'sameSalt';
      const hash1 = hashPassword('password1', salt);
      const hash2 = hashPassword('password2', salt);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for same password with different salts', () => {
      const password = 'samePassword';
      const hash1 = hashPassword(password, 'salt1');
      const hash2 = hashPassword(password, 'salt2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty passwords', () => {
      const hash = hashPassword('', 'salt');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle empty salts', () => {
      const hash = hashPassword('password', '');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(10000);
      const hash = hashPassword(longPassword, 'salt');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters in password and salt', () => {
      const password = '!@#$%^&*()_+{}|:"<>?`~';
      const salt = '©®™€£¥§¶•‰';
      const hash = hashPassword(password, salt);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should pad hash to 16 characters with zeros', () => {
      // Test with values that would produce shorter hashes
      const hash1 = hashPassword('a', 'b');
      const hash2 = hashPassword('1', '2');
      
      expect(hash1.length).toBe(16);
      expect(hash2.length).toBe(16);
    });
  });

  describe('generateSalt', () => {
    it('should generate a 32-character hexadecimal salt', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32);
      expect(/^[0-9a-f]{32}$/.test(salt)).toBe(true);
    });

    it('should generate different salts on each call', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const salt3 = generateSalt();
      
      expect(salt1).not.toBe(salt2);
      expect(salt2).not.toBe(salt3);
      expect(salt1).not.toBe(salt3);
    });

    it('should always generate valid hex characters', () => {
      for (let i = 0; i < 100; i++) {
        const salt = generateSalt();
        expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
      }
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'testPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword(password, hash, salt)).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'testPassword';
      const wrongPassword = 'wrongPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword(wrongPassword, hash, salt)).toBe(false);
    });

    it('should reject password with wrong salt', () => {
      const password = 'testPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const hash = hashPassword(password, salt1);
      
      expect(verifyPassword(password, hash, salt2)).toBe(false);
    });

    it('should handle empty password verification', () => {
      const password = '';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword('', hash, salt)).toBe(true);
      expect(verifyPassword('notEmpty', hash, salt)).toBe(false);
    });

    it('should handle special characters in password verification', () => {
      const password = '!@#$%^&*()_+{}|:"<>?';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword(password, hash, salt)).toBe(true);
      expect(verifyPassword(password + 'extra', hash, salt)).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate token with default length', () => {
      const token = generateToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // default length * 2
    });

    it('should generate token with specified length', () => {
      const token10 = generateToken(10);
      const token50 = generateToken(50);
      
      expect(token10.length).toBe(20); // length * 2
      expect(token50.length).toBe(100); // length * 2
    });

    it('should generate different tokens on each call', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      const token3 = generateToken();
      
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate tokens with valid characters', () => {
      const validChars = /^[0-9a-zA-Z]+$/;
      for (let i = 0; i < 50; i++) {
        const token = generateToken(10);
        expect(validChars.test(token)).toBe(true);
      }
    });

    it('should handle edge case of length 0', () => {
      const token = generateToken(0);
      expect(token).toBe('');
    });

    it('should handle very large lengths', () => {
      const token = generateToken(1000);
      expect(token.length).toBe(2000);
      expect(typeof token).toBe('string');
    });
  });

  describe('createSessionToken', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create session token with browser btoa', () => {
      const mockBtoa = jest.fn((str: string) => 'mockedBase64Token');
      global.btoa = mockBtoa;
      
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      expect(mockBtoa).toHaveBeenCalled();
      expect(token).toBe('mockedBase64Token');
      
      const callArg = mockBtoa.mock.calls[0][0];
      const payload = JSON.parse(callArg);
      expect(payload.userId).toBe(userId);
      expect(payload.exp).toBe(Date.now() + 24 * 60 * 60 * 1000);
      expect(payload.iat).toBe(Date.now());
    });

    it('should create session token with Node.js Buffer when btoa is not available', () => {
      delete (global as any).btoa;
      
      // Create proper Buffer mock
      const mockToString = jest.fn().mockReturnValue('base64EncodedToken');
      const mockBufferInstance = { toString: mockToString };
      const mockBufferFrom = jest.fn().mockReturnValue(mockBufferInstance);
      (global as any).Buffer = { from: mockBufferFrom };
      
      const userId = 'user456';
      const token = createSessionToken(userId);
      
      expect(mockBufferFrom).toHaveBeenCalled();
      expect(mockToString).toHaveBeenCalledWith('base64');
      expect(token).toBe('base64EncodedToken');
    });

    it('should create session token with custom expiry', () => {
      const mockBtoa = jest.fn((str: string) => 'mockedToken');
      global.btoa = mockBtoa;
      
      const userId = 'user789';
      const customExpiry = 2 * 60 * 60 * 1000; // 2 hours
      const token = createSessionToken(userId, customExpiry);
      
      const callArg = mockBtoa.mock.calls[0][0];
      const payload = JSON.parse(callArg);
      expect(payload.exp).toBe(Date.now() + customExpiry);
    });

    it('should handle empty userId', () => {
      const mockBtoa = jest.fn((str: string) => 'emptyUserToken');
      global.btoa = mockBtoa;
      
      const token = createSessionToken('');
      expect(token).toBe('emptyUserToken');
      
      const callArg = mockBtoa.mock.calls[0][0];
      const payload = JSON.parse(callArg);
      expect(payload.userId).toBe('');
    });

    it('should handle zero expiry', () => {
      const mockBtoa = jest.fn((str: string) => 'zeroExpiryToken');
      global.btoa = mockBtoa;
      
      const token = createSessionToken('user', 0);
      expect(token).toBe('zeroExpiryToken');
      
      const callArg = mockBtoa.mock.calls[0][0];
      const payload = JSON.parse(callArg);
      expect(payload.exp).toBe(Date.now());
    });
  });

  describe('validateSessionToken', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should validate valid token with browser atob', () => {
      const userId = 'user123';
      const exp = Date.now() + 60000; // 1 minute from now
      const iat = Date.now();
      const payload = { userId, exp, iat };
      
      const mockAtob = jest.fn((token: string) => JSON.stringify(payload));
      global.atob = mockAtob;
      
      const result = validateSessionToken('validToken');
      
      expect(mockAtob).toHaveBeenCalledWith('validToken');
      expect(result).toEqual(payload);
    });

    it('should validate valid token with Node.js Buffer when atob is not available', () => {
      delete (global as any).atob;
      
      const userId = 'user456';
      const exp = Date.now() + 60000;
      const iat = Date.now();
      const payload = { userId, exp, iat };
      
      const mockBufferFrom = jest.fn(() => ({
        toString: jest.fn(() => JSON.stringify(payload))
      }));
      (global as any).Buffer = { from: mockBufferFrom };
      
      const result = validateSessionToken('validBufferToken');
      
      expect(mockBufferFrom).toHaveBeenCalledWith('validBufferToken', 'base64');
      expect(result).toEqual(payload);
    });

    it('should return null for expired token', () => {
      const userId = 'user789';
      const exp = Date.now() - 60000; // 1 minute ago (expired)
      const iat = Date.now() - 120000;
      const payload = { userId, exp, iat };
      
      const mockAtob = jest.fn(() => JSON.stringify(payload));
      global.atob = mockAtob;
      
      const result = validateSessionToken('expiredToken');
      expect(result).toBeNull();
    });

    it('should return null for token without expiry', () => {
      const payload = { userId: 'user', iat: Date.now() };
      
      const mockAtob = jest.fn(() => JSON.stringify(payload));
      global.atob = mockAtob;
      
      const result = validateSessionToken('noExpiryToken');
      expect(result).toBeNull();
    });

    it('should return null for malformed token (invalid JSON)', () => {
      const mockAtob = jest.fn(() => 'invalid json');
      global.atob = mockAtob;
      
      const result = validateSessionToken('malformedToken');
      expect(result).toBeNull();
    });

    it('should return null for token that throws error during decoding', () => {
      const mockAtob = jest.fn(() => {
        throw new Error('Decoding error');
      });
      global.atob = mockAtob;
      
      const result = validateSessionToken('errorToken');
      expect(result).toBeNull();
    });

    it('should handle token exactly at expiry time', () => {
      const userId = 'user';
      const exp = Date.now(); // exactly now
      const iat = Date.now() - 60000;
      const payload = { userId, exp, iat };
      
      const mockAtob = jest.fn(() => JSON.stringify(payload));
      global.atob = mockAtob;
      
      const result = validateSessionToken('exactExpiryToken');
      expect(result).toBeNull(); // Should be null because exp <= now
    });

    it('should handle empty token string', () => {
      const mockAtob = jest.fn(() => {
        throw new Error('Empty token');
      });
      global.atob = mockAtob;
      
      const result = validateSessionToken('');
      expect(result).toBeNull();
    });

    it('should validate token with future expiry correctly', () => {
      const userId = 'futureUser';
      const exp = Date.now() + 3600000; // 1 hour from now
      const iat = Date.now();
      const payload = { userId, exp, iat };
      
      const mockAtob = jest.fn(() => JSON.stringify(payload));
      global.atob = mockAtob;
      
      const result = validateSessionToken('futureToken');
      expect(result).toEqual(payload);
    });
  });

  describe('Integration tests', () => {
    it('should create and validate session token end-to-end with btoa/atob', () => {
      const originalBtoa = global.btoa;
      const originalAtob = global.atob;
      
      // Mock btoa/atob to simulate browser environment
      global.btoa = jest.fn((str: string) => Buffer.from(str).toString('base64'));
      global.atob = jest.fn((token: string) => Buffer.from(token, 'base64').toString());
      
      const userId = 'integration-user';
      const token = createSessionToken(userId, 60000); // 1 minute expiry
      
      const validatedPayload = validateSessionToken(token);
      
      expect(validatedPayload).not.toBeNull();
      expect(validatedPayload!.userId).toBe(userId);
      expect(validatedPayload!.exp).toBeGreaterThan(Date.now());
      
      global.btoa = originalBtoa;
      global.atob = originalAtob;
    });

    it('should handle password flow end-to-end', () => {
      const password = 'mySecretPassword123!';
      const salt = generateSalt();
      
      // Hash password
      const hash = hashPassword(password, salt);
      
      // Verify correct password
      expect(verifyPassword(password, hash, salt)).toBe(true);
      
      // Verify incorrect passwords
      expect(verifyPassword('wrongPassword', hash, salt)).toBe(false);
      expect(verifyPassword(password + 'extra', hash, salt)).toBe(false);
      expect(verifyPassword('', hash, salt)).toBe(false);
    });

    it('should generate unique tokens and salts consistently', () => {
      const tokens = new Set();
      const salts = new Set();
      
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken(32));
        salts.add(generateSalt());
      }
      
      expect(tokens.size).toBe(100); // All unique
      expect(salts.size).toBe(100); // All unique
    });
  });
});