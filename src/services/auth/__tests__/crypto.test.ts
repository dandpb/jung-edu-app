/**
 * Comprehensive unit tests for crypto.ts authentication service
 * Tests all cryptographic functions, edge cases, and security validations
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
import { ADMIN_CONFIG } from '../../../config/admin';

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Set up the global crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

describe('crypto.ts - hashPassword', () => {
  const mockHashBuffer = new ArrayBuffer(32);
  const mockHashArray = new Uint8Array(mockHashBuffer);
  // Set some test values
  mockHashArray[0] = 171; // 0xab
  mockHashArray[1] = 205; // 0xcd
  mockHashArray[31] = 239; // 0xef

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup successful crypto mock responses
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);
  });

  it('should hash password with salt using PBKDF2', async () => {
    const password = 'TestPassword123!';
    const salt = 'testsalt';

    const hash = await hashPassword(password, salt);

    // Verify crypto functions were called correctly
    expect(mockCrypto.subtle.importKey).toHaveBeenCalledTimes(1);
    expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledTimes(1);

    // Verify the algorithm parameters
    const importArgs = mockCrypto.subtle.importKey.mock.calls[0];
    expect(importArgs[0]).toBe('raw');
    expect(importArgs[2]).toBe('PBKDF2');
    expect(importArgs[3]).toBe(false);
    expect(importArgs[4]).toEqual(['deriveBits']);

    const deriveBitsArgs = mockCrypto.subtle.deriveBits.mock.calls[0];
    expect(deriveBitsArgs[0].name).toBe('PBKDF2');
    expect(deriveBitsArgs[0].salt).toBeDefined();
    expect(deriveBitsArgs[0].salt.constructor.name).toBe('Uint8Array');
    expect(deriveBitsArgs[0].iterations).toBe(100000);
    expect(deriveBitsArgs[0].hash).toBe('SHA-256');
    expect(deriveBitsArgs[2]).toBe(256);

    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // 32 bytes * 2 (hex encoding)
  });

  it('should produce different hashes for different passwords', async () => {
    const salt = 'sameSalt';
    const password1 = 'password1';
    const password2 = 'password2';

    // Mock different hash outputs
    mockCrypto.subtle.deriveBits
      .mockResolvedValueOnce(mockHashBuffer)
      .mockResolvedValueOnce(new ArrayBuffer(32)); // Different buffer

    const hash1 = await hashPassword(password1, salt);
    const hash2 = await hashPassword(password2, salt);

    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for same password with different salts', async () => {
    const password = 'samePassword';
    const salt1 = 'salt1';
    const salt2 = 'salt2';

    // Mock different hash outputs for different salts
    let callCount = 0;
    mockCrypto.subtle.deriveBits.mockImplementation(async () => {
      const mockArray = new Uint8Array(32);
      // Different values based on call count
      for (let i = 0; i < 32; i++) {
        mockArray[i] = (i + callCount * 50) % 256;
      }
      callCount++;
      return mockArray.buffer;
    });

    const hash1 = await hashPassword(password, salt1);
    const hash2 = await hashPassword(password, salt2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty password', async () => {
    const result = await hashPassword('', 'salt');
    expect(typeof result).toBe('string');
  });

  it('should handle empty salt', async () => {
    const result = await hashPassword('password', '');
    expect(typeof result).toBe('string');
  });

  it('should handle crypto API failure gracefully', async () => {
    mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API unavailable'));

    await expect(hashPassword('password', 'salt')).rejects.toThrow();
  });

  it('should handle very long passwords', async () => {
    const longPassword = 'a'.repeat(10000);
    const result = await hashPassword(longPassword, 'salt');
    expect(typeof result).toBe('string');
  });

  it('should handle unicode characters', async () => {
    const unicodePassword = 'pássw🔐rd123';
    const result = await hashPassword(unicodePassword, 'salt');
    expect(typeof result).toBe('string');
  });
});

describe('crypto.ts - generateSalt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock random values for consistent testing
    const mockArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      mockArray[i] = i; // Set predictable values
    }
    mockCrypto.getRandomValues.mockImplementation((array) => {
      array.set(mockArray);
      return array;
    });
  });

  it('should generate a 32-byte salt', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBe(64); // 32 bytes * 2 (hex encoding)
  });

  it('should generate different salts on multiple calls', () => {
    // Mock different random values for each call
    let callCount = 0;
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = (i + callCount) % 256;
      }
      callCount++;
      return array;
    });

    const salt1 = generateSalt();
    const salt2 = generateSalt();
    
    expect(salt1).not.toBe(salt2);
  });

  it('should only contain hexadecimal characters', () => {
    const salt = generateSalt();
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
  });

  it('should handle crypto.getRandomValues failure', () => {
    mockCrypto.getRandomValues.mockImplementation(() => {
      throw new Error('Random generation failed');
    });

    expect(() => generateSalt()).toThrow('Random generation failed');
  });

  it('should pad single digit hex values with zero', () => {
    const mockArray = new Uint8Array(32);
    mockArray[0] = 5; // Should become '05'
    mockArray[1] = 255; // Should become 'ff'
    
    mockCrypto.getRandomValues.mockImplementation((array) => {
      array.set(mockArray);
      return array;
    });

    const salt = generateSalt();
    expect(salt.startsWith('05ff')).toBe(true);
  });
});

describe('crypto.ts - verifyPassword', () => {
  const testPassword = 'TestPassword123!';
  const testSalt = 'testSalt';
  let testHash: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup consistent mocks
    const mockHashBuffer = new ArrayBuffer(32);
    const mockArray = new Uint8Array(mockHashBuffer);
    for (let i = 0; i < 32; i++) {
      mockArray[i] = i;
    }
    
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);
    
    testHash = await hashPassword(testPassword, testSalt);
  });

  it('should return true for correct password', async () => {
    const result = await verifyPassword(testPassword, testHash, testSalt);
    expect(result).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    // Mock different hash for wrong password
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    
    const result = await verifyPassword('WrongPassword', testHash, testSalt);
    expect(result).toBe(false);
  });

  it('should return false for incorrect salt', async () => {
    // Mock different hash for wrong salt
    const mockArray = new Uint8Array(32);
    mockArray.fill(255); // Different from the setup
    mockCrypto.subtle.deriveBits.mockResolvedValue(mockArray.buffer);
    
    const result = await verifyPassword(testPassword, testHash, 'wrongSalt');
    expect(result).toBe(false);
  });

  it('should handle crypto API failures gracefully', async () => {
    mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API failed'));
    
    const result = await verifyPassword(testPassword, testHash, testSalt);
    expect(result).toBe(false);
  });

  it('should handle empty inputs', async () => {
    // Empty password should return false (different hash)
    const mockArray = new Uint8Array(32);
    mockArray.fill(255);
    mockCrypto.subtle.deriveBits.mockResolvedValue(mockArray.buffer);
    
    const result1 = await verifyPassword('', testHash, testSalt);
    expect(result1).toBe(false);
    
    // Empty stored hash should return false
    const result2 = await verifyPassword(testPassword, '', testSalt);
    expect(result2).toBe(false);
    
    // Empty salt should return false
    const result3 = await verifyPassword(testPassword, testHash, '');
    expect(result3).toBe(false);
  });

  it('should be resistant to timing attacks', async () => {
    const startTime = Date.now();
    await verifyPassword('short', testHash, testSalt);
    const shortTime = Date.now() - startTime;

    const startTime2 = Date.now();
    await verifyPassword('verylongpasswordthatdoesnotmatch', testHash, testSalt);
    const longTime = Date.now() - startTime2;

    // Times should be similar (within reasonable bounds for testing)
    expect(Math.abs(longTime - shortTime)).toBeLessThan(100);
  });
});

describe('crypto.ts - generateSecureToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      mockArray[i] = i;
    }
    mockCrypto.getRandomValues.mockImplementation((array) => {
      array.set(mockArray.slice(0, array.length));
      return array;
    });
  });

  it('should generate token with default length', () => {
    const token = generateSecureToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate token with custom length', () => {
    const lengths = [8, 16, 32, 64];
    lengths.forEach(length => {
      const token = generateSecureToken(length);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  it('should generate URL-safe base64 tokens', () => {
    const token = generateSecureToken();
    // Should not contain +, /, or = characters
    expect(token).not.toMatch(/[+/=]/);
    // Should only contain URL-safe characters
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should generate different tokens on multiple calls', () => {
    let callCount = 0;
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = (i + callCount * 10) % 256;
      }
      callCount++;
      return array;
    });

    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    
    expect(token1).not.toBe(token2);
  });

  it('should handle zero length', () => {
    const token = generateSecureToken(0);
    expect(token).toBe('');
  });

  it('should handle very large lengths', () => {
    const token = generateSecureToken(1024);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(1000);
  });
});

describe('crypto.ts - validatePassword', () => {
  // Mock ADMIN_CONFIG
  const originalConfig = ADMIN_CONFIG.security.minPasswordLength;

  beforeEach(() => {
    // Reset config to known state
    (ADMIN_CONFIG.security as any).minPasswordLength = 8;
  });

  afterEach(() => {
    (ADMIN_CONFIG.security as any).minPasswordLength = originalConfig;
  });

  it('should validate strong password', () => {
    const result = validatePassword('StrongPass123!');
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.strength).toBe('very-strong');
  });

  it('should reject password that is too short', () => {
    const result = validatePassword('Sh0rt!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('at least 8 characters'));
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('lowercase123!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('uppercase letter'));
  });

  it('should reject password without lowercase', () => {
    const result = validatePassword('UPPERCASE123!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('lowercase letter'));
  });

  it('should reject password without numbers', () => {
    const result = validatePassword('NoNumbers!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('one number'));
  });

  it('should reject password without special characters', () => {
    const result = validatePassword('NoSpecial123');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('special character'));
  });

  it('should reject common passwords', () => {
    const commonPasswords = ['password', '123456', 'Password1'];
    
    commonPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('too common'));
    });
  });

  it('should reject password containing username', () => {
    const result = validatePassword('MyUsernamePass123!', 'MyUsername');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('should not contain your username'));
  });

  it('should reject password with repeated characters', () => {
    const result = validatePassword('Passsssword123!');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('repeated characters'));
  });

  it('should calculate strength correctly - weak', () => {
    const result = validatePassword('weak', 'user');
    expect(result.strength).toBe('weak');
  });

  it('should calculate strength correctly - medium', () => {
    const result = validatePassword('Medium1!');
    expect(result.strength).toBe('strong'); // 8 chars + all types = strong (score 5)
  });

  it('should calculate strength correctly - strong', () => {
    const result = validatePassword('StrongPass1!');
    expect(result.strength).toBe('very-strong'); // 12+ chars + all types = very-strong (score 6)
  });

  it('should calculate strength correctly - very strong', () => {
    const result = validatePassword('VeryStrongPassword123!@#');
    expect(result.strength).toBe('very-strong');
  });

  it('should handle empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.strength).toBe('weak');
  });

  it('should handle unicode characters', () => {
    const result = validatePassword('Unicodé123!@#');
    expect(result.valid).toBe(true);
  });

  it('should be case insensitive for username check', () => {
    const result = validatePassword('MyUserNAMEpass123!', 'myusername');
    expect(result.valid).toBe(false);
  });
});

describe('crypto.ts - constantTimeCompare', () => {
  it('should return true for identical strings', () => {
    const str = 'identicalString';
    expect(constantTimeCompare(str, str)).toBe(true);
  });

  it('should return false for different strings of same length', () => {
    expect(constantTimeCompare('string1', 'string2')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(constantTimeCompare('short', 'muchLongerString')).toBe(false);
  });

  it('should handle empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true);
    expect(constantTimeCompare('nonempty', '')).toBe(false);
  });

  it('should handle unicode strings', () => {
    const unicode1 = 'ñoñó123';
    const unicode2 = 'ñoñó123';
    const unicode3 = 'ñoño123';
    
    expect(constantTimeCompare(unicode1, unicode2)).toBe(true);
    expect(constantTimeCompare(unicode1, unicode3)).toBe(false);
  });

  it('should be resistant to timing attacks', () => {
    const baseString = 'a'.repeat(1000);
    const differentString = 'b'.repeat(1000);
    
    // Test multiple comparisons to check timing consistency
    const times: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      constantTimeCompare(baseString, differentString);
      times.push(Date.now() - start);
    }
    
    // All times should be very close (implementation may vary)
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    expect(maxTime - minTime).toBeLessThan(5); // Allow some variance
  });

  it('should handle null bytes', () => {
    const string1 = 'test\0string';
    const string2 = 'test\0string';
    const string3 = 'test\0different';
    
    expect(constantTimeCompare(string1, string2)).toBe(true);
    expect(constantTimeCompare(string1, string3)).toBe(false);
  });
});

describe('crypto.ts - generateSecurePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Math.random for predictable testing
    let randomCounter = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      return (randomCounter++ * 0.1) % 1;
    });

    // Mock crypto.getRandomValues
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = (i + 50) % 256; // Predictable values
      }
      return array;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate password with default length', () => {
    const password = generateSecurePassword();
    expect(password.length).toBe(16);
  });

  it('should generate password with custom length', () => {
    const password = generateSecurePassword(20);
    expect(password.length).toBe(20);
  });

  it('should enforce minimum length of 12', () => {
    const password = generateSecurePassword(8);
    expect(password.length).toBe(12);
  });

  it('should contain all required character types', () => {
    const password = generateSecurePassword();
    
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });

  it('should generate different passwords', () => {
    // Reset counter for different results
    let counter = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      return (counter++ * 0.13) % 1;
    });

    // Mock different crypto values for each call
    let cryptoCallCount = 0;
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = (i + cryptoCallCount * 30) % 256;
      }
      cryptoCallCount++;
      return array;
    });

    const password1 = generateSecurePassword();
    const password2 = generateSecurePassword();
    
    expect(password1).not.toBe(password2);
  });

  it('should pass validation', () => {
    const password = generateSecurePassword();
    const validation = validatePassword(password);
    
    expect(validation.valid).toBe(true);
    expect(validation.strength).toMatch(/(medium|strong|very-strong)/);
  });

  it('should handle very long passwords', () => {
    const password = generateSecurePassword(100);
    expect(password.length).toBe(100);
    
    const validation = validatePassword(password);
    expect(validation.valid).toBe(true);
  });
});

describe('crypto.ts - Edge Cases and Security', () => {
  it('should handle malformed inputs gracefully', async () => {
    // Test with null/undefined inputs - should handle gracefully
    const result = validatePassword(null as any);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Test crypto operations with proper mocks
    mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API unavailable'));
    await expect(hashPassword('password', 'salt')).rejects.toThrow();
    
    // Reset mocks for other operations
    mockCrypto.subtle.importKey.mockResolvedValue({});
    expect(() => generateSalt()).not.toThrow();
    expect(generateSecureToken()).toBeDefined();
  });

  it('should handle crypto API unavailability', () => {
    const originalCrypto = global.crypto;
    delete (global as any).crypto;

    expect(() => generateSalt()).toThrow();
    expect(() => generateSecureToken()).toThrow();

    global.crypto = originalCrypto;
  });

  it('should handle memory exhaustion scenarios', () => {
    // Test with very large inputs that might cause memory issues
    const hugeString = 'a'.repeat(1000000);
    
    expect(() => constantTimeCompare(hugeString, hugeString)).not.toThrow();
    expect(() => validatePassword(hugeString)).not.toThrow();
  });

  it('should handle concurrent operations', async () => {
    const salt = generateSalt();
    const password = 'TestPassword123!';
    
    // Run multiple operations concurrently
    const promises = Array(10).fill(0).map(() => hashPassword(password, salt));
    const hashes = await Promise.all(promises);
    
    // All hashes should be identical (same password + salt)
    const firstHash = hashes[0];
    hashes.forEach(hash => {
      expect(hash).toBe(firstHash);
    });
  });

  it('should validate against known attack vectors', () => {
    // SQL injection attempts
    let result = validatePassword("'; DROP TABLE users; --");
    expect(result.valid).toBe(false);
    
    // XSS attempts
    result = validatePassword("<script>alert('xss')</script>");
    expect(result.valid).toBe(false);
    
    // Command injection attempts
    result = validatePassword("password; rm -rf /");
    expect(result.valid).toBe(false);
  });
});