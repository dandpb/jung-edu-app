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

    test('creates different tokens for same user', () => {
      const userId = 'user123';
      const token1 = createSessionToken(userId);
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const token2 = createSessionToken(userId);
        expect(token1).not.toBe(token2);
      }, 10);
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
});