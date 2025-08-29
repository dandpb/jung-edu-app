/**
 * Comprehensive test suite for Crypto service
 * Tests password hashing, encryption/decryption, key derivation, and security features
 * Targets 90%+ coverage for cryptographic functionality
 */

import { CryptoService, HashResult, EncryptionResult } from '../crypto';
import * as crypto from 'crypto';

// Mock crypto functions for controlled testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  pbkdf2Sync: jest.fn(),
  createCipher: jest.fn(),
  createDecipher: jest.fn(),
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn()
}));

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  const mockSalt = Buffer.from('mock-salt-16bytes', 'utf-8');
  const mockKey = Buffer.from('mock-key-32-bytes-for-encryption-', 'utf-8');
  const mockIv = Buffer.from('mock-iv-16-bytes', 'utf-8');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto.randomBytes to return predictable values
    (crypto.randomBytes as jest.Mock)
      .mockReturnValueOnce(mockSalt)
      .mockReturnValueOnce(mockIv)
      .mockReturnValue(Buffer.from('mock-random-data', 'utf-8'));

    // Mock pbkdf2Sync
    (crypto.pbkdf2Sync as jest.Mock).mockReturnValue(mockKey);

    // Mock timing safe equal
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);

    cryptoService = new CryptoService();
  });

  describe('Password Hashing', () => {
    it('should hash password with salt', async () => {
      const password = 'test-password-123';
      const result = await cryptoService.hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should use provided salt when given', async () => {
      const password = 'test-password';
      const providedSalt = 'existing-salt';
      
      const result = await cryptoService.hashPassword(password, providedSalt);
      
      expect(result.salt).toBe(providedSalt);
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        password,
        providedSalt,
        expect.any(Number),
        expect.any(Number),
        'sha256'
      );
    });

    it('should generate unique salt for each hash', async () => {
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(Buffer.from('salt-1', 'utf-8'))
        .mockReturnValueOnce(Buffer.from('salt-2', 'utf-8'));

      const result1 = await cryptoService.hashPassword('password');
      const result2 = await cryptoService.hashPassword('password');

      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should use configurable iterations', async () => {
      const iterations = 50000;
      const cryptoWithCustomIterations = new CryptoService({ pbkdf2Iterations: iterations });
      
      await cryptoWithCustomIterations.hashPassword('password');

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        'password',
        expect.any(String),
        iterations,
        expect.any(Number),
        'sha256'
      );
    });

    it('should handle empty password', async () => {
      const result = await cryptoService.hashPassword('');
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const result = await cryptoService.hashPassword(longPassword);
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle passwords with special characters', async () => {
      const specialPassword = 'pássw@rd!#$%^&*(){}[]|\\:";\'<>?,.~/`';
      const result = await cryptoService.hashPassword(specialPassword);
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });
  });

  describe('Password Verification', () => {
    let hashResult: HashResult;

    beforeEach(async () => {
      hashResult = await cryptoService.hashPassword('test-password-123');
    });

    it('should verify correct password', async () => {
      const isValid = await cryptoService.verifyPassword('test-password-123', hashResult.hash, hashResult.salt);
      
      expect(isValid).toBe(true);
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should reject incorrect password', async () => {
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);
      
      const isValid = await cryptoService.verifyPassword('wrong-password', hashResult.hash, hashResult.salt);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const emptyHashResult = await cryptoService.hashPassword('');
      const isValid = await cryptoService.verifyPassword('', emptyHashResult.hash, emptyHashResult.salt);
      
      expect(isValid).toBe(true);
    });

    it('should handle null/undefined inputs safely', async () => {
      await expect(cryptoService.verifyPassword(null as any, hashResult.hash, hashResult.salt))
        .resolves.toBe(false);
      
      await expect(cryptoService.verifyPassword('password', null as any, hashResult.salt))
        .resolves.toBe(false);
      
      await expect(cryptoService.verifyPassword('password', hashResult.hash, null as any))
        .resolves.toBe(false);
    });

    it('should use timing-safe comparison', async () => {
      await cryptoService.verifyPassword('test-password-123', hashResult.hash, hashResult.salt);
      
      expect(crypto.timingSafeEqual).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(Buffer)
      );
    });

    it('should handle mismatched buffer lengths', async () => {
      (crypto.timingSafeEqual as jest.Mock).mockImplementation(() => {
        throw new Error('Input buffers must have the same length');
      });

      const isValid = await cryptoService.verifyPassword('password', hashResult.hash, hashResult.salt);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Encryption and Decryption', () => {
    const testData = 'sensitive data to encrypt';
    const encryptionKey = 'encryption-key-must-be-32-chars!';

    it('should encrypt data successfully', () => {
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('encrypted-part', 'utf-8')),
        final: jest.fn().mockReturnValue(Buffer.from('final-part', 'utf-8'))
      };

      (crypto.createCipher as jest.Mock).mockReturnValue(mockCipher);

      const result = cryptoService.encrypt(testData, encryptionKey);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(crypto.createCipher).toHaveBeenCalledWith('aes-256-cbc', encryptionKey);
    });

    it('should decrypt data successfully', () => {
      const mockDecipher = {
        update: jest.fn().mockReturnValue(Buffer.from('decrypted-part', 'utf-8')),
        final: jest.fn().mockReturnValue(Buffer.from('final-part', 'utf-8'))
      };

      (crypto.createDecipher as jest.Mock).mockReturnValue(mockDecipher);

      const encryptedData = {
        encrypted: Buffer.from('mock-encrypted-data').toString('base64'),
        iv: Buffer.from('mock-iv').toString('base64')
      };

      const decrypted = cryptoService.decrypt(encryptedData, encryptionKey);

      expect(decrypted).toBe('decrypted-partfinal-part');
      expect(crypto.createDecipher).toHaveBeenCalledWith('aes-256-cbc', encryptionKey);
    });

    it('should handle encryption errors', () => {
      (crypto.createCipher as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      expect(() => {
        cryptoService.encrypt(testData, encryptionKey);
      }).toThrow('Encryption failed');
    });

    it('should handle decryption errors', () => {
      (crypto.createDecipher as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = {
        encrypted: 'invalid-data',
        iv: 'invalid-iv'
      };

      expect(() => {
        cryptoService.decrypt(encryptedData, encryptionKey);
      }).toThrow('Decryption failed');
    });

    it('should handle empty data encryption', () => {
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.alloc(0)),
        final: jest.fn().mockReturnValue(Buffer.from('final', 'utf-8'))
      };

      (crypto.createCipher as jest.Mock).mockReturnValue(mockCipher);

      const result = cryptoService.encrypt('', encryptionKey);

      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
    });

    it('should generate unique IV for each encryption', () => {
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(Buffer.from('iv-1', 'utf-8'))
        .mockReturnValueOnce(Buffer.from('iv-2', 'utf-8'));

      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('encrypted', 'utf-8')),
        final: jest.fn().mockReturnValue(Buffer.from('final', 'utf-8'))
      };

      (crypto.createCipher as jest.Mock).mockReturnValue(mockCipher);

      const result1 = cryptoService.encrypt(testData, encryptionKey);
      const result2 = cryptoService.encrypt(testData, encryptionKey);

      expect(result1.iv).not.toBe(result2.iv);
    });
  });

  describe('Key Derivation', () => {
    const password = 'user-password';
    const salt = 'unique-salt';

    it('should derive key from password', () => {
      const key = cryptoService.deriveKey(password, salt);

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        password,
        salt,
        expect.any(Number),
        32, // Key length
        'sha256'
      );
    });

    it('should generate same key for same inputs', () => {
      const key1 = cryptoService.deriveKey(password, salt);
      const key2 = cryptoService.deriveKey(password, salt);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different salts', () => {
      const key1 = cryptoService.deriveKey(password, 'salt1');
      const key2 = cryptoService.deriveKey(password, 'salt2');

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different passwords', () => {
      const key1 = cryptoService.deriveKey('password1', salt);
      const key2 = cryptoService.deriveKey('password2', salt);

      expect(key1).not.toBe(key2);
    });

    it('should handle empty inputs', () => {
      expect(() => {
        cryptoService.deriveKey('', salt);
      }).not.toThrow();

      expect(() => {
        cryptoService.deriveKey(password, '');
      }).not.toThrow();
    });

    it('should use configurable key length', () => {
      const customLength = 64;
      const cryptoWithCustomKey = new CryptoService({ keyLength: customLength });
      
      cryptoWithCustomKey.deriveKey(password, salt);

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        password,
        salt,
        expect.any(Number),
        customLength,
        'sha256'
      );
    });
  });

  describe('HMAC Generation and Verification', () => {
    const data = 'data to authenticate';
    const secret = 'hmac-secret-key';

    it('should generate HMAC', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mock-hmac-hash')
      };

      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);

      const hmac = cryptoService.generateHMAC(data, secret);

      expect(hmac).toBe('mock-hmac-hash');
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', secret);
      expect(mockHmac.update).toHaveBeenCalledWith(data);
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
    });

    it('should verify HMAC correctly', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected-hmac')
      };

      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);

      const isValid = cryptoService.verifyHMAC(data, 'expected-hmac', secret);

      expect(isValid).toBe(true);
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should reject invalid HMAC', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected-hmac')
      };

      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);

      const isValid = cryptoService.verifyHMAC(data, 'invalid-hmac', secret);

      expect(isValid).toBe(false);
    });

    it('should handle HMAC generation errors', () => {
      (crypto.createHmac as jest.Mock).mockImplementation(() => {
        throw new Error('HMAC generation failed');
      });

      expect(() => {
        cryptoService.generateHMAC(data, secret);
      }).toThrow('HMAC generation failed');
    });

    it('should handle different algorithms', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('sha512-hmac')
      };

      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);

      const hmac = cryptoService.generateHMAC(data, secret, 'sha512');

      expect(crypto.createHmac).toHaveBeenCalledWith('sha512', secret);
      expect(hmac).toBe('sha512-hmac');
    });
  });

  describe('Random Data Generation', () => {
    it('should generate random bytes', () => {
      const mockRandomBytes = Buffer.from('random-data-16-b', 'utf-8');
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockRandomBytes);

      const randomData = cryptoService.generateRandomBytes(16);

      expect(randomData).toBe(mockRandomBytes.toString('hex'));
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
    });

    it('should generate random strings', () => {
      const mockRandomBytes = Buffer.from('randomdata123456', 'utf-8');
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockRandomBytes);

      const randomString = cryptoService.generateRandomString(32);

      expect(typeof randomString).toBe('string');
      expect(randomString.length).toBe(32);
    });

    it('should generate random tokens', () => {
      const token = cryptoService.generateSecureToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('should handle random generation errors', () => {
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        throw new Error('Random generation failed');
      });

      expect(() => {
        cryptoService.generateRandomBytes(16);
      }).toThrow('Random generation failed');
    });

    it('should generate different tokens each time', () => {
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(Buffer.from('token-1', 'utf-8'))
        .mockReturnValueOnce(Buffer.from('token-2', 'utf-8'));

      const token1 = cryptoService.generateSecureToken();
      const token2 = cryptoService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        pbkdf2Iterations: 150000,
        keyLength: 64,
        saltLength: 32
      };

      const customCryptoService = new CryptoService(customConfig);
      
      customCryptoService.hashPassword('password');

      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        'password',
        expect.any(String),
        150000,
        expect.any(Number),
        'sha256'
      );
    });

    it('should validate configuration values', () => {
      expect(() => {
        new CryptoService({ pbkdf2Iterations: -1 });
      }).toThrow();

      expect(() => {
        new CryptoService({ keyLength: 0 });
      }).toThrow();

      expect(() => {
        new CryptoService({ saltLength: -1 });
      }).toThrow();
    });

    it('should use secure defaults', () => {
      const defaultService = new CryptoService();
      
      defaultService.hashPassword('password');

      // Should use secure iteration count
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(
        'password',
        expect.any(String),
        100000, // Default secure iterations
        expect.any(Number),
        'sha256'
      );
    });
  });

  describe('Memory Security', () => {
    it('should clear sensitive data from memory', () => {
      const buffer = Buffer.from('sensitive-data', 'utf-8');
      const originalData = buffer.toString();
      
      cryptoService['clearBuffer'](buffer);
      
      expect(buffer.toString()).not.toBe(originalData);
      // Buffer should be filled with zeros
      expect(buffer.every(byte => byte === 0)).toBe(true);
    });

    it('should handle null buffer clearing', () => {
      expect(() => {
        cryptoService['clearBuffer'](null as any);
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle Unicode characters in passwords', async () => {
      const unicodePassword = '🔐pássw@rd中文🌟';
      const result = await cryptoService.hashPassword(unicodePassword);
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle very long encryption keys', () => {
      const longKey = 'a'.repeat(256);
      const data = 'test data';

      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('encrypted', 'utf-8')),
        final: jest.fn().mockReturnValue(Buffer.from('final', 'utf-8'))
      };

      (crypto.createCipher as jest.Mock).mockReturnValue(mockCipher);

      expect(() => {
        cryptoService.encrypt(data, longKey);
      }).not.toThrow();
    });

    it('should handle concurrent operations safely', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        cryptoService.hashPassword(`password-${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.hash).toBeDefined();
        expect(result.salt).toBeDefined();
      });

      // All results should be unique
      const hashes = results.map(r => r.hash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should handle system resource limitations', () => {
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        const error = new Error('Insufficient entropy');
        error.name = 'ENOENT';
        throw error;
      });

      expect(() => {
        cryptoService.generateRandomBytes(16);
      }).toThrow('Insufficient entropy');
    });
  });

  describe('Security Properties', () => {
    it('should use cryptographically secure random number generation', () => {
      cryptoService.generateRandomBytes(32);
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      // crypto.randomBytes is cryptographically secure
    });

    it('should use constant-time comparison for password verification', async () => {
      const hashResult = await cryptoService.hashPassword('password');
      await cryptoService.verifyPassword('password', hashResult.hash, hashResult.salt);
      
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should use sufficient iterations for PBKDF2', () => {
      cryptoService.hashPassword('password');
      
      const iterations = (crypto.pbkdf2Sync as jest.Mock).mock.calls[0][2];
      expect(iterations).toBeGreaterThanOrEqual(100000); // OWASP recommended minimum
    });

    it('should use appropriate key derivation algorithm', () => {
      cryptoService.hashPassword('password');
      
      const algorithm = (crypto.pbkdf2Sync as jest.Mock).mock.calls[0][4];
      expect(algorithm).toBe('sha256'); // SHA-256 is secure
    });

    it('should generate sufficiently long salts', () => {
      cryptoService.hashPassword('password');
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(16); // 128-bit salt
    });

    it('should use secure encryption algorithm', () => {
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('encrypted', 'utf-8')),
        final: jest.fn().mockReturnValue(Buffer.alloc(0))
      };

      (crypto.createCipher as jest.Mock).mockReturnValue(mockCipher);

      cryptoService.encrypt('data', 'key');
      
      expect(crypto.createCipher).toHaveBeenCalledWith('aes-256-cbc', 'key');
    });
  });
});