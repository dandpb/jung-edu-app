import {
  hashPassword,
  generateSalt,
  verifyPassword,
  generateToken,
  createSessionToken,
  validateSessionToken
} from './auth';

describe('auth utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password with salt', () => {
      const password = 'testPassword123';
      const salt = 'someSalt';
      const hash = hashPassword(password, salt);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should produce different hashes for different passwords', () => {
      const salt = 'sameSalt';
      const hash1 = hashPassword('password1', salt);
      const hash2 = hashPassword('password2', salt);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different salts', () => {
      const password = 'samePassword';
      const hash1 = hashPassword(password, 'salt1');
      const hash2 = hashPassword(password, 'salt2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce the same hash for the same password and salt', () => {
      const password = 'testPassword';
      const salt = 'testSalt';
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      
      expect(salt).toHaveLength(32);
      expect(salt).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const salt3 = generateSalt();
      
      expect(salt1).not.toBe(salt2);
      expect(salt2).not.toBe(salt3);
      expect(salt1).not.toBe(salt3);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      const isValid = verifyPassword(password, hash, salt);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      const isValid = verifyPassword('wrongPassword', hash, salt);
      
      expect(isValid).toBe(false);
    });

    it('should reject correct password with wrong salt', () => {
      const password = 'correctPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const hash = hashPassword(password, salt1);
      
      const isValid = verifyPassword(password, hash, salt2);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a token of default length', () => {
      const token = generateToken();
      
      expect(token).toHaveLength(64); // 32 * 2
      expect(token).toMatch(/^[0-9a-zA-Z]{64}$/);
    });

    it('should generate a token of specified length', () => {
      const token = generateToken(16);
      
      expect(token).toHaveLength(32); // 16 * 2
      expect(token).toMatch(/^[0-9a-zA-Z]{32}$/);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      const token3 = generateToken();
      
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });

  describe('createSessionToken', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a session token with default expiry', () => {
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Decode and verify
      const decoded = Buffer.from(token, 'base64').toString();
      const payload = JSON.parse(decoded);
      
      expect(payload.userId).toBe(userId);
      expect(payload.iat).toBe(1000000);
      expect(payload.exp).toBe(1000000 + 24 * 60 * 60 * 1000);
    });

    it('should create a session token with custom expiry', () => {
      const userId = 'user456';
      const customExpiry = 60 * 60 * 1000; // 1 hour
      const token = createSessionToken(userId, customExpiry);
      
      const decoded = Buffer.from(token, 'base64').toString();
      const payload = JSON.parse(decoded);
      
      expect(payload.userId).toBe(userId);
      expect(payload.exp).toBe(1000000 + customExpiry);
    });
  });

  describe('validateSessionToken', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should validate a valid token', () => {
      const userId = 'user789';
      const token = createSessionToken(userId);
      
      const payload = validateSessionToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.iat).toBe(1000000);
    });

    it('should reject an expired token', () => {
      const payload = {
        userId: 'expiredUser',
        exp: 999999, // Before current time
        iat: 900000
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      const result = validateSessionToken(token);
      
      expect(result).toBeNull();
    });

    it('should reject an invalid token format', () => {
      const result1 = validateSessionToken('invalid-token');
      const result2 = validateSessionToken('');
      const result3 = validateSessionToken('!!!');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should reject a token with missing exp field', () => {
      const payload = {
        userId: 'user',
        iat: 1000000
        // Missing exp field
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      const result = validateSessionToken(token);
      
      expect(result).toBeNull();
    });
  });

  // Test browser environment compatibility
  describe('browser compatibility', () => {
    it('should use btoa/atob when available', () => {
      // Mock browser environment
      const originalBtoa = (global as any).btoa;
      const originalAtob = (global as any).atob;
      
      (global as any).btoa = (str: string) => Buffer.from(str).toString('base64');
      (global as any).atob = (str: string) => Buffer.from(str, 'base64').toString();
      
      const userId = 'browserUser';
      const token = createSessionToken(userId);
      const payload = validateSessionToken(token);
      
      expect(payload?.userId).toBe(userId);
      
      // Restore
      (global as any).btoa = originalBtoa;
      (global as any).atob = originalAtob;
    });
  });
});