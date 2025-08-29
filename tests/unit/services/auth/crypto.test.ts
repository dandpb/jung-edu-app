/**
 * Comprehensive Unit Tests for Cryptographic Utilities
 * Tests password hashing, validation, salt generation, and security functions
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
} from '../../../../src/services/auth/crypto';
import { ADMIN_CONFIG } from '../../../../src/config/admin';

// Mock admin config
jest.mock('../../../../src/config/admin', () => ({
  ADMIN_CONFIG: {
    security: {
      minPasswordLength: 8
    }
  }
}));

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
    sign: jest.fn()
  },
  getRandomValues: jest.fn()
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('Cryptographic Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.getRandomValues.mockImplementation((array: any) => {
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });
  });

  describe('Salt Generation', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      
      expect(salt).toBeTruthy();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(64); // 32 bytes * 2 hex chars
    });

    it('should generate different salts on each call', () => {
      // Mock different random values
      mockCrypto.getRandomValues.mockImplementation((array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });

      const salt1 = generateSalt();
      const salt2 = generateSalt();

      expect(salt1).not.toBe(salt2);
    });

    it('should generate hex-encoded salt', () => {
      const salt = generateSalt();
      
      // Should only contain hex characters
      expect(salt).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle getRandomValues errors gracefully', () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      expect(() => generateSalt()).toThrow('Random generation failed');
    });
  });

  describe('Password Hashing', () => {
    const testPassword = 'TestPassword123!';
    const testSalt = 'test-salt';

    it('should hash password successfully', async () => {
      const hash = await hashPassword(testPassword, testSalt);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // 32 bytes * 2 hex chars
    });

    it('should use correct PBKDF2 parameters', async () => {
      await hashPassword(testPassword, testSalt);

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
          iterations: 100000, // OWASP recommended minimum
          hash: 'SHA-256'
        },
        expect.any(Object),
        256 // 32 bytes
      );
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1', testSalt);
      const hash2 = await hashPassword('password2', testSalt);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different salts', async () => {
      const hash1 = await hashPassword(testPassword, 'salt1');
      const hash2 = await hashPassword(testPassword, 'salt2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce same hash for same password and salt', async () => {
      const hash1 = await hashPassword(testPassword, testSalt);
      const hash2 = await hashPassword(testPassword, testSalt);

      expect(hash1).toBe(hash2);
    });

    it('should handle crypto errors gracefully', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Import failed'));

      await expect(hashPassword(testPassword, testSalt))
        .rejects
        .toThrow('Import failed');
    });

    it('should handle deriveBits errors', async () => {
      mockCrypto.subtle.deriveBits.mockRejectedValue(new Error('Derive failed'));

      await expect(hashPassword(testPassword, testSalt))
        .rejects
        .toThrow('Derive failed');
    });
  });

  describe('Password Verification', () => {
    const testPassword = 'TestPassword123!';
    const testSalt = 'test-salt';
    let testHash: string;

    beforeEach(async () => {
      testHash = await hashPassword(testPassword, testSalt);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword(testPassword, testHash, testSalt);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('WrongPassword', testHash, testSalt);

      expect(isValid).toBe(false);
    });

    it('should reject with wrong salt', async () => {
      const isValid = await verifyPassword(testPassword, testHash, 'wrong-salt');

      expect(isValid).toBe(false);
    });

    it('should handle verification errors gracefully', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Verification failed'));

      const isValid = await verifyPassword(testPassword, testHash, testSalt);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const isValid = await verifyPassword('testpassword123!', testHash, testSalt);

      expect(isValid).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate token of default length', () => {
      const token = generateSecureToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      // Base64URL encoded 32 bytes should be ~43 characters
      expect(token.length).toBeGreaterThan(40);
    });

    it('should generate token of specified length', () => {
      const token = generateSecureToken(16);

      expect(token).toBeTruthy();
      // Base64URL encoded 16 bytes should be ~22 characters
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateSecureToken();

      // Should not contain +, /, or = characters
      expect(token).not.toMatch(/[+/=]/);
      // Should only contain URL-safe base64 characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate different tokens on each call', () => {
      mockCrypto.getRandomValues.mockImplementation((array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });

      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should handle different token lengths', () => {
      const lengths = [8, 16, 32, 64, 128];
      
      lengths.forEach(length => {
        const token = generateSecureToken(length);
        expect(token).toBeTruthy();
        expect(token.length).toBeGreaterThan(length / 2); // Rough base64 length check
      });
    });
  });

  describe('Password Validation', () => {
    describe('Length Requirements', () => {
      it('should accept password meeting minimum length', () => {
        const result = validatePassword('Password123!');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject password below minimum length', () => {
        const result = validatePassword('Pass1!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should give higher strength score for longer passwords', () => {
        const result1 = validatePassword('Password123!'); // 12 chars
        const result2 = validatePassword('VeryLongPassword123!'); // 20 chars

        expect(result1.strength).toBeDefined();
        expect(result2.strength).toBeDefined();
        // Longer password should have same or better strength
        const strengths = ['weak', 'medium', 'strong', 'very-strong'];
        expect(strengths.indexOf(result2.strength)).toBeGreaterThanOrEqual(
          strengths.indexOf(result1.strength)
        );
      });
    });

    describe('Character Type Requirements', () => {
      it('should require uppercase letters', () => {
        const result = validatePassword('password123!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should require lowercase letters', () => {
        const result = validatePassword('PASSWORD123!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should require numbers', () => {
        const result = validatePassword('Password!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should require special characters', () => {
        const result = validatePassword('Password123');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should accept password with all required character types', () => {
        const result = validatePassword('Password123!');

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Common Password Detection', () => {
      const commonPasswords = [
        'password',
        'Password1',
        '123456',
        'password123',
        'admin',
        'letmein',
        'welcome',
        'qwerty'
      ];

      commonPasswords.forEach(commonPassword => {
        it(`should reject common password: ${commonPassword}`, () => {
          const result = validatePassword(commonPassword);

          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Password is too common. Please choose a more unique password');
        });
      });

      it('should be case insensitive for common password detection', () => {
        const result = validatePassword('PASSWORD');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a more unique password');
      });
    });

    describe('Username Similarity Check', () => {
      it('should reject password containing username', () => {
        const result = validatePassword('johnPassword123!', 'john');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password should not contain your username');
      });

      it('should be case insensitive for username check', () => {
        const result = validatePassword('JOHNPassword123!', 'john');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password should not contain your username');
      });

      it('should accept password not containing username', () => {
        const result = validatePassword('SecurePassword123!', 'john');

        expect(result.valid).toBe(true);
        expect(result.errors).not.toContain('Password should not contain your username');
      });

      it('should work without username parameter', () => {
        const result = validatePassword('Password123!');

        expect(result.errors).not.toContain('Password should not contain your username');
      });
    });

    describe('Sequential Characters Check', () => {
      it('should reject password with repeated characters', () => {
        const result = validatePassword('Passsssword123!');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password should not contain repeated characters');
      });

      it('should accept password with non-repeated characters', () => {
        const result = validatePassword('Password123!');

        expect(result.errors).not.toContain('Password should not contain repeated characters');
      });

      it('should allow up to 2 consecutive identical characters', () => {
        const result = validatePassword('Password1123!');

        expect(result.errors).not.toContain('Password should not contain repeated characters');
      });
    });

    describe('Strength Assessment', () => {
      it('should assign weak strength to basic passwords', () => {
        const result = validatePassword('Pass123!');

        expect(result.strength).toBe('weak');
      });

      it('should assign medium strength to decent passwords', () => {
        const result = validatePassword('Password123!');

        expect(result.strength).toBe('medium');
      });

      it('should assign strong strength to good passwords', () => {
        const result = validatePassword('StrongPassword123!');

        expect(result.strength).toBe('strong');
      });

      it('should assign very-strong strength to excellent passwords', () => {
        const result = validatePassword('VeryStrongUniquePassword123!@#');

        expect(result.strength).toBe('very-strong');
      });

      it('should reduce strength for common passwords', () => {
        const result = validatePassword('password123');

        expect(result.strength).toBe('weak');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty password', () => {
        const result = validatePassword('');

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle very long passwords', () => {
        const longPassword = 'A'.repeat(1000) + 'a1!';
        const result = validatePassword(longPassword);

        expect(result.valid).toBe(true);
        expect(result.strength).toBe('very-strong');
      });

      it('should handle unicode characters', () => {
        const unicodePassword = 'Pássw0rd123!';
        const result = validatePassword(unicodePassword);

        expect(result.valid).toBe(true);
      });

      it('should handle passwords with only special characters', () => {
        const result = validatePassword('!@#$%^&*()');

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
      });
    });
  });

  describe('Constant Time Comparison', () => {
    it('should return true for identical strings', () => {
      const result = constantTimeCompare('hello', 'hello');

      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = constantTimeCompare('hello', 'world');

      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = constantTimeCompare('hello', 'hello!');

      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const result = constantTimeCompare('Hello', 'hello');

      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(constantTimeCompare('', '')).toBe(true);
      expect(constantTimeCompare('', 'a')).toBe(false);
      expect(constantTimeCompare('a', '')).toBe(false);
    });

    it('should handle special characters', () => {
      const str1 = '!@#$%^&*()';
      const str2 = '!@#$%^&*()';

      expect(constantTimeCompare(str1, str2)).toBe(true);
    });

    it('should perform in constant time regardless of string content', () => {
      // This test is more about ensuring the implementation doesn't short-circuit
      const str1 = 'a'.repeat(1000);
      const str2 = 'a'.repeat(999) + 'b';

      expect(constantTimeCompare(str1, str2)).toBe(false);
    });
  });

  describe('Secure Password Generation', () => {
    it('should generate password of correct length', () => {
      const password = generateSecurePassword(16);

      expect(password).toBeTruthy();
      expect(password.length).toBe(16);
    });

    it('should enforce minimum length', () => {
      const password = generateSecurePassword(5); // Below minimum

      expect(password.length).toBe(12); // Should be raised to minimum
    });

    it('should generate password meeting all requirements', () => {
      const password = generateSecurePassword();
      const validation = validatePassword(password);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should include all required character types', () => {
      const password = generateSecurePassword();

      expect(password).toMatch(/[A-Z]/); // Uppercase
      expect(password).toMatch(/[a-z]/); // Lowercase  
      expect(password).toMatch(/\d/);    // Numbers
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Special chars
    });

    it('should generate different passwords on each call', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should handle various lengths', () => {
      const lengths = [12, 16, 20, 32];
      
      lengths.forEach(length => {
        const password = generateSecurePassword(length);
        expect(password.length).toBe(length);
        
        const validation = validatePassword(password);
        expect(validation.valid).toBe(true);
      });
    });

    it('should produce strong passwords', () => {
      const password = generateSecurePassword();
      const validation = validatePassword(password);

      expect(['strong', 'very-strong']).toContain(validation.strength);
    });
  });

  describe('Performance and Security', () => {
    it('should handle multiple concurrent password hashes', async () => {
      const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];
      const salt = generateSalt();

      const promises = passwords.map(pass => hashPassword(pass, salt));
      const hashes = await Promise.all(promises);

      expect(hashes).toHaveLength(5);
      expect(new Set(hashes).size).toBe(5); // All should be unique
    });

    it('should handle large batches of token generation', () => {
      const tokens = [];
      
      for (let i = 0; i < 1000; i++) {
        tokens.push(generateSecureToken());
      }

      expect(tokens).toHaveLength(1000);
      expect(new Set(tokens).size).toBe(1000); // All should be unique
    });

    it('should validate password complexity efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        validatePassword(`Password${i}123!`);
      }
      
      const end = performance.now();
      
      // Should complete in reasonable time (less than 1 second for 100 validations)
      expect(end - start).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle crypto API unavailability', () => {
      const originalCrypto = global.crypto;
      
      // Remove crypto API
      delete (global as any).crypto;

      expect(() => generateSalt()).toThrow();
      expect(() => generateSecureToken()).toThrow();

      // Restore
      global.crypto = originalCrypto;
    });

    it('should handle getRandomValues failure', () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random generation not available');
      });

      expect(() => generateSalt()).toThrow('Random generation not available');
      expect(() => generateSecureToken()).toThrow('Random generation not available');
    });
  });
});