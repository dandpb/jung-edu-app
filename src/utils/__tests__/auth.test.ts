import {
  hashPassword,
  generateSalt,
  verifyPassword,
  generateToken,
  createSessionToken,
  validateSessionToken
} from '../auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    test('generates a hash from password and salt', () => {
      const password = 'testPassword123';
      const salt = 'testSalt';
      const hash = hashPassword(password, salt);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(16);
      expect(typeof hash).toBe('string');
    });

    test('generates same hash for same password and salt', () => {
      const password = 'testPassword123';
      const salt = 'testSalt';
      
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
    });

    test('generates different hash for different passwords', () => {
      const salt = 'testSalt';
      const hash1 = hashPassword('password1', salt);
      const hash2 = hashPassword('password2', salt);
      
      expect(hash1).not.toBe(hash2);
    });

    test('generates different hash for different salts', () => {
      const password = 'testPassword';
      const hash1 = hashPassword(password, 'salt1');
      const hash2 = hashPassword(password, 'salt2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSalt', () => {
    test('generates a salt string', () => {
      const salt = generateSalt();
      
      expect(salt).toBeDefined();
      expect(salt).toHaveLength(32);
      expect(typeof salt).toBe('string');
    });

    test('generates different salts on each call', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      
      expect(salt1).not.toBe(salt2);
    });

    test('generates salt with valid hex characters', () => {
      const salt = generateSalt();
      const hexRegex = /^[0-9a-f]+$/;
      
      expect(salt).toMatch(hexRegex);
    });
  });

  describe('verifyPassword', () => {
    test('verifies correct password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      const isValid = verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    test('rejects incorrect password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      const isValid = verifyPassword('wrongPassword', hash, salt);
      expect(isValid).toBe(false);
    });

    test('rejects correct password with wrong salt', () => {
      const password = 'correctPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const hash = hashPassword(password, salt1);
      
      const isValid = verifyPassword(password, hash, salt2);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    test('generates token with default length', () => {
      const token = generateToken();
      
      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // 32 * 2
      expect(typeof token).toBe('string');
    });

    test('generates token with custom length', () => {
      const token = generateToken(16);
      
      expect(token).toHaveLength(32); // 16 * 2
    });

    test('generates different tokens on each call', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
    });

    test('generates token with alphanumeric characters', () => {
      const token = generateToken();
      const alphanumericRegex = /^[0-9a-zA-Z]+$/;
      
      expect(token).toMatch(alphanumericRegex);
    });
  });

  describe('createSessionToken', () => {
    test('creates a session token for user', () => {
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('creates different tokens for same user', async () => {
      const userId = 'user123';
      const token1 = createSessionToken(userId);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const token2 = createSessionToken(userId);
      expect(token1).not.toBe(token2);
    });

    test('creates token with custom expiry', () => {
      const userId = 'user123';
      const customExpiry = 60 * 60 * 1000; // 1 hour
      const token = createSessionToken(userId, customExpiry);
      
      expect(token).toBeDefined();
    });

    test('encodes user information in token', () => {
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      // Decode the token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('validateSessionToken', () => {
    test('validates a valid token', () => {
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      const payload = validateSessionToken(token);
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
    });

    test('returns null for expired token', () => {
      const userId = 'user123';
      // Create token that expires immediately
      const token = createSessionToken(userId, -1000);
      
      const payload = validateSessionToken(token);
      expect(payload).toBeNull();
    });

    test('returns null for invalid token format', () => {
      const invalidToken = 'invalid-token-format';
      
      const payload = validateSessionToken(invalidToken);
      expect(payload).toBeNull();
    });

    test('returns null for tampered token', () => {
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      // Tamper with the token
      const tamperedToken = token + 'tampered';
      
      const payload = validateSessionToken(tamperedToken);
      expect(payload).toBeNull();
    });

    test('validates token expiry correctly', () => {
      const userId = 'user123';
      const futureExpiry = 60 * 60 * 1000; // 1 hour
      const token = createSessionToken(userId, futureExpiry);
      
      const payload = validateSessionToken(token);
      expect(payload).toBeDefined();
      expect(payload?.exp).toBeGreaterThan(Date.now());
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle empty password', () => {
      const salt = generateSalt();
      const hash = hashPassword('', salt);
      
      expect(hash).toBeDefined();
      expect(verifyPassword('', hash, salt)).toBe(true);
      expect(verifyPassword('notEmpty', hash, salt)).toBe(false);
    });

    test('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(10000);
      const salt = generateSalt();
      const hash = hashPassword(longPassword, salt);
      
      expect(verifyPassword(longPassword, hash, salt)).toBe(true);
    });

    test('should handle passwords with special characters', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\\\'';
      const salt = generateSalt();
      const hash = hashPassword(specialPassword, salt);
      
      expect(verifyPassword(specialPassword, hash, salt)).toBe(true);
    });

    test('should handle unicode passwords', () => {
      const unicodePassword = '密码测试🔐🗝️';
      const salt = generateSalt();
      const hash = hashPassword(unicodePassword, salt);
      
      expect(verifyPassword(unicodePassword, hash, salt)).toBe(true);
    });

    test('should generate different hashes for similar passwords', () => {
      const salt = generateSalt();
      const hash1 = hashPassword('password', salt);
      const hash2 = hashPassword('Password', salt);
      const hash3 = hashPassword('password1', salt);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    test('should handle empty salt gracefully', () => {
      const password = 'testPassword';
      const hash1 = hashPassword(password, '');
      const hash2 = hashPassword(password, '');
      
      expect(hash1).toBe(hash2); // Should be consistent
      expect(verifyPassword(password, hash1, '')).toBe(true);
    });

    test('should generate tokens with sufficient entropy', () => {
      const tokens = new Set();
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateToken());
      }
      
      // Should have high uniqueness
      expect(tokens.size).toBe(1000);
    });

    test('should handle token length edge cases', () => {
      expect(generateToken(0)).toHaveLength(0);
      expect(generateToken(1)).toHaveLength(2);
      expect(generateToken(100)).toHaveLength(200);
    });

    test('should handle extreme session token scenarios', () => {
      // Very long userId
      const longUserId = 'user' + 'a'.repeat(1000);
      const token1 = createSessionToken(longUserId);
      expect(validateSessionToken(token1)?.userId).toBe(longUserId);
      
      // Empty userId
      const token2 = createSessionToken('');
      expect(validateSessionToken(token2)?.userId).toBe('');
      
      // Unicode userId
      const unicodeUserId = '用户🔐';
      const token3 = createSessionToken(unicodeUserId);
      expect(validateSessionToken(token3)?.userId).toBe(unicodeUserId);
    });

    test('should handle malformed base64 tokens', () => {
      const malformedTokens = [
        'invalid!!!',
        'not-base64',
        '==invalid==',
        'MQ', // Valid base64 but invalid JSON
        btoa('invalid json {'),
        btoa('{}'), // Valid JSON but missing required fields
      ];
      
      malformedTokens.forEach(token => {
        expect(validateSessionToken(token)).toBeNull();
      });
    });

    test('should handle token with missing fields', () => {
      const incompletePayload = { userId: 'test' }; // Missing exp and iat
      const token = btoa(JSON.stringify(incompletePayload));
      
      expect(validateSessionToken(token)).toBeNull();
    });

    test('should handle tokens with invalid expiry values', () => {
      const invalidExpiryPayloads = [
        { userId: 'test', exp: 'invalid', iat: Date.now() },
        { userId: 'test', exp: null, iat: Date.now() },
        { userId: 'test', exp: -1, iat: Date.now() },
      ];
      
      invalidExpiryPayloads.forEach(payload => {
        const token = btoa(JSON.stringify(payload));
        expect(validateSessionToken(token)).toBeNull();
      });
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle many hash operations efficiently', () => {
      const start = performance.now();
      const salt = generateSalt();
      
      for (let i = 0; i < 1000; i++) {
        hashPassword(`password${i}`, salt);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle many token generations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        generateToken();
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    test('should handle many session token operations efficiently', () => {
      const start = performance.now();
      const tokens = [];
      
      // Create many tokens
      for (let i = 0; i < 100; i++) {
        tokens.push(createSessionToken(`user${i}`));
      }
      
      // Validate all tokens
      tokens.forEach(token => {
        validateSessionToken(token);
      });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Cross-Environment Compatibility', () => {
    test('should work consistently across different environments', () => {
      // Test both browser (btoa/atob) and Node.js (Buffer) paths
      const userId = 'testUser';
      
      // Create token using current environment
      const token1 = createSessionToken(userId);
      const payload1 = validateSessionToken(token1);
      
      expect(payload1?.userId).toBe(userId);
      
      // Test manual base64 encoding/decoding
      const testPayload = { userId, exp: Date.now() + 10000, iat: Date.now() };
      let manualToken: string;
      
      if (typeof btoa !== 'undefined') {
        manualToken = btoa(JSON.stringify(testPayload));
      } else {
        manualToken = Buffer.from(JSON.stringify(testPayload)).toString('base64');
      }

      const decodedPayload = validateSessionToken(manualToken);
      expect(decodedPayload?.userId).toBe(userId);
    });
  });

  describe('Boundary Value Tests', () => {
    test('should handle boundary values for hash function', () => {
      const testCases = [
        { password: '0', salt: '0' },
        { password: String.fromCharCode(0), salt: String.fromCharCode(0) },
        { password: String.fromCharCode(255), salt: String.fromCharCode(255) },
        { password: '\u0000\u0001\u00FF', salt: '\u00FF\u0001\u0000' },
      ];

      testCases.forEach(({ password, salt }) => {
        const hash = hashPassword(password, salt);
        expect(hash).toHaveLength(16);
        expect(verifyPassword(password, hash, salt)).toBe(true);
      });
    });

    test('should handle exact expiry time boundaries', () => {
      const userId = 'testUser';
      const expiry = 1000; // 1 second
      const token = createSessionToken(userId, expiry);

      // Should be valid immediately
      expect(validateSessionToken(token)).not.toBeNull();

      // Mock time to be exactly at expiry
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + expiry);

      // Should be invalid at exact expiry time
      expect(validateSessionToken(token)).toBeNull();

      // Restore Date.now
      Date.now = originalNow;
    });
  });
});