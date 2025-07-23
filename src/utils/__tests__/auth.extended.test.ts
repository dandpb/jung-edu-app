import {
  hashPassword,
  generateSalt,
  verifyPassword,
  generateToken,
  createSessionToken,
  validateSessionToken
} from '../auth';

// Mock global functions for consistent testing
const mockBtoa = (str: string) => Buffer.from(str).toString('base64');
const mockAtob = (str: string) => Buffer.from(str, 'base64').toString();

describe('Auth Utilities Extended Tests', () => {
  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toHaveLength(32);
    });

    it('should generate only hexadecimal characters', () => {
      const salt = generateSalt();
      expect(salt).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate unique salts', () => {
      const salts = new Set();
      for (let i = 0; i < 100; i++) {
        salts.add(generateSalt());
      }
      // While theoretically possible to have duplicates, it's extremely unlikely
      expect(salts.size).toBeGreaterThan(95);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password consistently with same salt', () => {
      const password = 'testPassword123';
      const salt = 'abcdef1234567890abcdef1234567890';
      
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should produce different hashes for different passwords', () => {
      const salt = 'abcdef1234567890abcdef1234567890';
      
      const hash1 = hashPassword('password1', salt);
      const hash2 = hashPassword('password2', salt);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for same password with different salts', () => {
      const password = 'samePassword';
      
      const hash1 = hashPassword(password, 'salt1234567890abcdef1234567890ab');
      const hash2 = hashPassword(password, 'differentsalt567890abcdef12345678');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', () => {
      const salt = generateSalt();
      const hash = hashPassword('', salt);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(16);
    });

    it('should handle special characters in password', () => {
      const salt = generateSalt();
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      
      const hash = hashPassword(specialPassword, salt);
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(16);
    });

    it('should handle unicode characters', () => {
      const salt = generateSalt();
      const unicodePassword = '🔐 Séçürë Pàsswörd 你好 🌟';
      
      const hash = hashPassword(unicodePassword, salt);
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(16);
    });

    it('should always produce 16-character hex string', () => {
      const salt = generateSalt();
      
      // Test various password lengths
      const passwords = ['a', 'ab', 'abc', 'a'.repeat(100), 'a'.repeat(1000)];
      
      passwords.forEach(password => {
        const hash = hashPassword(password, salt);
        expect(hash).toMatch(/^[0-9a-f]{16}$/);
      });
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword(password, hash, salt)).toBeTruthy();
    });

    it('should reject incorrect password', () => {
      const password = 'correctPassword';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword('wrongPassword', hash, salt)).toBeFalsy();
    });

    it('should reject correct password with wrong salt', () => {
      const password = 'testPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const hash = hashPassword(password, salt1);
      
      expect(verifyPassword(password, hash, salt2)).toBeFalsy();
    });

    it('should handle empty password verification', () => {
      const salt = generateSalt();
      const hash = hashPassword('', salt);
      
      expect(verifyPassword('', hash, salt)).toBeTruthy();
      expect(verifyPassword('notEmpty', hash, salt)).toBeFalsy();
    });

    it('should be case sensitive', () => {
      const password = 'CaseSensitive';
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      
      expect(verifyPassword('casesensitive', hash, salt)).toBeFalsy();
      expect(verifyPassword('CASESENSITIVE', hash, salt)).toBeFalsy();
      expect(verifyPassword('CaseSensitive', hash, salt)).toBeTruthy();
    });
  });

  describe('generateToken', () => {
    it('should generate token of default length', () => {
      const token = generateToken();
      expect(token).toHaveLength(64); // default 32 * 2
    });

    it('should generate token of specified length', () => {
      const token = generateToken(16);
      expect(token).toHaveLength(32); // 16 * 2
    });

    it('should generate alphanumeric tokens', () => {
      const token = generateToken();
      expect(token).toMatch(/^[0-9a-zA-Z]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should handle different token lengths', () => {
      const lengths = [8, 16, 32, 64, 128];
      
      lengths.forEach(length => {
        const token = generateToken(length);
        expect(token).toHaveLength(length * 2);
      });
    });
  });

  describe('createSessionToken', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create session token with default expiry', () => {
      // Mock btoa for Node.js environment
      global.btoa = mockBtoa;
      
      const userId = 'user123';
      const token = createSessionToken(userId);
      
      const decoded = JSON.parse(mockAtob(token));
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBe(1000000000000 + 24 * 60 * 60 * 1000); // 24 hours
      expect(decoded.iat).toBe(1000000000000);
      
      delete global.btoa;
    });

    it('should create session token with custom expiry', () => {
      global.btoa = mockBtoa;
      
      const userId = 'user456';
      const customExpiry = 60 * 60 * 1000; // 1 hour
      const token = createSessionToken(userId, customExpiry);
      
      const decoded = JSON.parse(mockAtob(token));
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBe(1000000000000 + customExpiry);
      
      delete global.btoa;
    });

    it('should use Buffer.from when btoa is not available', () => {
      // Ensure btoa is not defined
      delete (global as any).btoa;
      
      const userId = 'user789';
      const token = createSessionToken(userId);
      
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      expect(decoded.userId).toBe(userId);
    });

    it('should handle special characters in userId', () => {
      global.btoa = mockBtoa;
      
      const userId = 'user@example.com';
      const token = createSessionToken(userId);
      
      const decoded = JSON.parse(mockAtob(token));
      expect(decoded.userId).toBe(userId);
      
      delete global.btoa;
    });
  });

  describe('validateSessionToken', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should validate valid token', () => {
      global.btoa = mockBtoa;
      global.atob = mockAtob;
      
      const userId = 'validUser';
      const token = createSessionToken(userId);
      
      const result = validateSessionToken(token);
      expect(result).toBeTruthy();
      expect(result!.userId).toBe(userId);
      expect(result!.exp).toBeGreaterThan(Date.now());
      
      delete global.btoa;
      delete global.atob;
    });

    it('should reject expired token', () => {
      global.btoa = mockBtoa;
      global.atob = mockAtob;
      
      const userId = 'expiredUser';
      const token = createSessionToken(userId, -1000); // Already expired
      
      const result = validateSessionToken(token);
      expect(result).toBeNull();
      
      delete global.btoa;
      delete global.atob;
    });

    it('should reject invalid token format', () => {
      global.atob = mockAtob;
      
      const invalidTokens = [
        'notBase64!@#$',
        'invalidJson',
        mockBtoa('not a json'),
        mockBtoa('{"missing": "fields"}'),
        ''
      ];
      
      invalidTokens.forEach(token => {
        const result = validateSessionToken(token);
        expect(result).toBeNull();
      });
      
      delete global.atob;
    });

    it('should use Buffer.from when atob is not available', () => {
      delete (global as any).atob;
      global.btoa = mockBtoa;
      
      const userId = 'nodeUser';
      const token = createSessionToken(userId);
      
      const result = validateSessionToken(token);
      expect(result).toBeTruthy();
      expect(result!.userId).toBe(userId);
      
      delete global.btoa;
    });

    it('should handle token without exp field', () => {
      global.atob = mockAtob;
      
      const tokenWithoutExp = mockBtoa(JSON.stringify({
        userId: 'user123',
        iat: Date.now()
      }));
      
      const result = validateSessionToken(tokenWithoutExp);
      expect(result).toBeNull();
      
      delete global.atob;
    });

    it('should validate token at exact expiry time', () => {
      global.btoa = mockBtoa;
      global.atob = mockAtob;
      
      const userId = 'boundaryUser';
      const token = createSessionToken(userId, 1000);
      
      // Fast forward to just before expiry
      jest.spyOn(Date, 'now').mockReturnValue(1000000001000 - 1);
      expect(validateSessionToken(token)).toBeTruthy();
      
      // At exact expiry
      jest.spyOn(Date, 'now').mockReturnValue(1000000001000);
      expect(validateSessionToken(token)).toBeNull();
      
      // Just after expiry
      jest.spyOn(Date, 'now').mockReturnValue(1000000001001);
      expect(validateSessionToken(token)).toBeNull();
      
      delete global.btoa;
      delete global.atob;
    });

    it('should handle malformed base64', () => {
      global.atob = () => {
        throw new Error('Invalid base64');
      };
      
      const result = validateSessionToken('malformed-base64');
      expect(result).toBeNull();
      
      delete global.atob;
    });
  });

  describe('Integration tests', () => {
    it('should handle complete authentication flow', () => {
      // 1. Generate salt and hash password
      const password = 'SecurePassword123!';
      const salt = generateSalt();
      const hashedPassword = hashPassword(password, salt);
      
      // 2. Verify password
      expect(verifyPassword(password, hashedPassword, salt)).toBeTruthy();
      expect(verifyPassword('WrongPassword', hashedPassword, salt)).toBeFalsy();
      
      // 3. Create session after successful authentication
      global.btoa = mockBtoa;
      global.atob = mockAtob;
      
      const userId = 'authenticated-user';
      const sessionToken = createSessionToken(userId);
      
      // 4. Validate session
      const session = validateSessionToken(sessionToken);
      expect(session).toBeTruthy();
      expect(session!.userId).toBe(userId);
      
      // 5. Generate additional secure token for other purposes
      const secureToken = generateToken(32);
      expect(secureToken).toHaveLength(64);
      
      delete global.btoa;
      delete global.atob;
    });

    it('should handle password change flow', () => {
      const userId = 'user-changing-password';
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456!';
      
      // Store old password
      const oldSalt = generateSalt();
      const oldHash = hashPassword(oldPassword, oldSalt);
      
      // Verify old password before allowing change
      expect(verifyPassword(oldPassword, oldHash, oldSalt)).toBeTruthy();
      
      // Create new password
      const newSalt = generateSalt();
      const newHash = hashPassword(newPassword, newSalt);
      
      // Ensure new hash is different
      expect(newHash).not.toBe(oldHash);
      expect(newSalt).not.toBe(oldSalt);
      
      // Verify new password works
      expect(verifyPassword(newPassword, newHash, newSalt)).toBeTruthy();
      expect(verifyPassword(oldPassword, newHash, newSalt)).toBeFalsy();
    });
  });
});