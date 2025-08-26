/**
 * Comprehensive tests for crypto service
 * Tests all cryptographic utilities including password validation, hashing, and token generation
 */

import {
  hashPassword,
  generateSalt,
  verifyPassword,
  generateSecureToken,
  validatePassword,
  constantTimeCompare,
  generateSecurePassword,
  PasswordValidationResult
} from '../crypto';

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Store original crypto
const originalCrypto = global.crypto;

describe('Crypto Service Comprehensive Tests', () => {
  beforeAll(() => {
    // Setup crypto mock
    (global as any).crypto = mockCrypto;
    global.btoa = jest.fn();
  });

  afterAll(() => {
    // Restore original crypto
    global.crypto = originalCrypto;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    beforeEach(() => {
      // Mock successful crypto operations
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveBits.mockResolvedValue(
        new ArrayBuffer(32) // 32 bytes for 256-bit hash
      );
    });

    it('should hash password with salt using PBKDF2-SHA256', async () => {
      const password = 'TestPassword123!';
      const salt = 'mocksalt';

      const hash = await hashPassword(password, salt);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: expect.any(Uint8Array),
          iterations: 100000,
          hash: 'SHA-256'
        },
        'mock-key',
        256
      );

      expect(typeof hash).toBe('string');
    });

    it('should produce consistent hashes for same input', async () => {
      const password = 'TestPassword123!';
      const salt = 'fixedsalt';

      // Mock consistent output
      const mockBuffer = new ArrayBuffer(32);
      const view = new Uint8Array(mockBuffer);
      view.fill(170); // 0xAA pattern
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockBuffer);

      const hash1 = await hashPassword(password, salt);
      const hash2 = await hashPassword(password, salt);

      expect(hash1).toBe(hash2);
    });

    it('should handle empty password and salt', async () => {
      const mockBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockBuffer);

      await expect(hashPassword('', '')).resolves.toBeDefined();
    });

    it('should handle unicode characters in password', async () => {
      const password = 'Test🔒Password🌟';
      const salt = 'unicodesalt';
      const mockBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockBuffer);

      await expect(hashPassword(password, salt)).resolves.toBeDefined();
    });
  });

  describe('generateSalt', () => {
    it('should generate 32-byte hex-encoded salt', () => {
      // Mock random values
      const mockArray = new Uint8Array(32);
      mockArray.fill(255); // All FF pattern
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const salt = generateSalt();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(salt).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(salt).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique salts on multiple calls', () => {
      let callCount = 0;
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        // Fill with different values each time
        for (let i = 0; i < arr.length; i++) {
          arr[i] = (callCount + i) % 256;
        }
        callCount++;
        return arr;
      });

      const salt1 = generateSalt();
      const salt2 = generateSalt();

      expect(salt1).not.toBe(salt2);
    });
  });

  describe('verifyPassword', () => {
    beforeEach(() => {
      // Mock consistent hash generation
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      const mockBuffer = new ArrayBuffer(32);
      const view = new Uint8Array(mockBuffer);
      view.fill(170); // Consistent pattern
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockBuffer);
    });

    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123!';
      const salt = 'testsalt';
      const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // 32 bytes of 0xAA

      const result = await verifyPassword(password, hash, salt);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const salt = 'testsalt';
      const hash = 'differenthash';

      const result = await verifyPassword(wrongPassword, hash, salt);

      expect(result).toBe(false);
    });

    it('should return false when crypto operation fails', async () => {
      mockCrypto.subtle.deriveBits.mockRejectedValue(new Error('Crypto failed'));

      const result = await verifyPassword('test', 'hash', 'salt');

      expect(result).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    beforeEach(() => {
      global.btoa = jest.fn().mockReturnValue('dGVzdCt0b2tlbi9lcXVhbD0=');
    });

    it('should generate URL-safe base64 token', () => {
      const mockArray = new Uint8Array(32);
      mockArray.fill(116); // 't' character
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const token = generateSecureToken();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(global.btoa).toHaveBeenCalled();
      expect(token).toBe('dGVzdC10b2tlbi9lcXVhbA'); // URL-safe conversion
    });

    it('should generate token of specified length', () => {
      const mockArray = new Uint8Array(16);
      mockArray.fill(65); // 'A' character
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const token = generateSecureToken(16);

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(
        expect.objectContaining({ length: 16 })
      );
    });

    it('should replace unsafe base64 characters', () => {
      global.btoa = jest.fn().mockReturnValue('test+token/equal=');

      const token = generateSecureToken();

      expect(token).toBe('test-token_equal'); // + -> -, / -> _, = removed
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongP@ssw0rd123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('very-strong');
    });

    it('should reject password too short', () => {
      const result = validatePassword('Sh0rt!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringMatching(/at least \d+ characters long/)
      );
      expect(result.strength).toBe('weak');
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('lowercase123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('NoNumbersHere!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = validatePassword('NoSpecialChars123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const result = validatePassword('password123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is too common. Please choose a more unique password');
    });

    it('should reject password containing username', () => {
      const result = validatePassword('johndoe123!', 'johndoe');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password should not contain your username');
    });

    it('should reject password with repeated characters', () => {
      const result = validatePassword('Test111Password!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password should not contain repeated characters');
    });

    it('should assess medium strength password', () => {
      const result = validatePassword('MediumPass1!'); // 12 chars, all requirements

      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should handle empty password', () => {
      const result = validatePassword('');

      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for identical strings', () => {
      const result = constantTimeCompare('identical', 'identical');
      expect(result).toBe(true);
    });

    it('should return false for different strings of same length', () => {
      const result = constantTimeCompare('different', 'alsodiff');
      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = constantTimeCompare('short', 'verylongstring');
      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = constantTimeCompare('', '');
      expect(result).toBe(true);
    });

    it('should be case sensitive', () => {
      const result = constantTimeCompare('CaseSensitive', 'casesensitive');
      expect(result).toBe(false);
    });

    it('should handle unicode characters', () => {
      const result = constantTimeCompare('test🔒', 'test🔒');
      expect(result).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    beforeEach(() => {
      // Mock Math.random for predictable shuffling
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      (Math.random as jest.Mock).mockRestore();
    });

    it('should generate password with minimum length of 12', () => {
      const mockArray = new Uint8Array(12);
      mockArray.fill(0); // Will use first char of each set
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const password = generateSecurePassword(8); // Request 8, should get 12

      expect(password.length).toBe(12);
    });

    it('should generate password with requested length when >= 12', () => {
      const mockArray = new Uint8Array(16);
      mockArray.fill(0);
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const password = generateSecurePassword(16);

      expect(password.length).toBe(16);
    });

    it('should contain all required character types', () => {
      const mockArray = new Uint8Array(12);
      mockArray.fill(0);
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const password = generateSecurePassword(16);

      expect(password).toMatch(/[A-Z]/); // Uppercase
      expect(password).toMatch(/[a-z]/); // Lowercase
      expect(password).toMatch(/\d/); // Number
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Special
    });

    it('should pass validation when generated', () => {
      const mockArray = new Uint8Array(12);
      for (let i = 0; i < mockArray.length; i++) {
        mockArray[i] = i * 10; // Varied values
      }
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      const password = generateSecurePassword();
      const validation = validatePassword(password);

      expect(validation.valid).toBe(true);
      expect(['medium', 'strong', 'very-strong']).toContain(validation.strength);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      // These should not throw but may return false/empty
      await expect(verifyPassword(null as any, '', '')).resolves.toBe(false);
      await expect(verifyPassword('', null as any, '')).resolves.toBe(false);
      await expect(verifyPassword('', '', null as any)).resolves.toBe(false);
    });

    it('should handle crypto API unavailability', () => {
      delete (global as any).crypto;

      expect(() => generateSalt()).toThrow();
      expect(() => generateSecureToken()).toThrow();
      expect(() => generateSecurePassword()).toThrow();

      // Restore crypto
      (global as any).crypto = mockCrypto;
    });

    it('should handle btoa unavailability', () => {
      delete (global as any).btoa;

      expect(() => generateSecureToken()).toThrow();

      // Restore btoa
      global.btoa = jest.fn();
    });

    it('should handle very long passwords in validation', () => {
      const veryLongPassword = 'A'.repeat(1000) + 'a1!';
      const result = validatePassword(veryLongPassword);

      expect(result.strength).toBe('very-strong');
      expect(result.valid).toBe(true);
    });

    it('should handle unicode edge cases in constant time compare', () => {
      const emoji1 = '🔒🔑';
      const emoji2 = '🔒🗝️';

      const result = constantTimeCompare(emoji1, emoji2);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Security Properties', () => {
    it('should use secure iteration count for PBKDF2', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue('key');
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      await hashPassword('test', 'salt');

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 100000 // Should be >= 100,000 for security
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should generate tokens with sufficient entropy', () => {
      const mockArray = new Uint8Array(32);
      // Fill with max entropy pattern
      for (let i = 0; i < mockArray.length; i++) {
        mockArray[i] = i * 8;
      }
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockArray);
        return arr;
      });

      global.btoa = jest.fn().mockImplementation((str) => 
        Buffer.from(str, 'binary').toString('base64')
      );

      const token = generateSecureToken(32);

      expect(token.length).toBeGreaterThan(0);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should enforce minimum security requirements', () => {
      // Test that validation catches insecure patterns
      const insecurePasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        'abc123'
      ];

      insecurePasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.strength).toBe('weak');
      });
    });
  });
});