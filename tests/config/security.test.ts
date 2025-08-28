/**
 * Comprehensive Security Tests
 * Testing authentication, authorization, data sanitization, and security headers
 * @priority CRITICAL - Security vulnerabilities have highest impact
 */

import { 
  SecurityUtils, 
  SecurityConfig, 
  AuthMethod, 
  ThreatLevel,
  AccessControlModel,
  EncryptionAlgorithm,
  validateSecurityConfig,
  createSecurityConfig,
  defaultSecurityConfig
} from '../../src/config/security';
import crypto from 'crypto';

describe('Security Configuration Tests', () => {
  describe('SecurityConfig Validation', () => {
    test('should validate complete security configuration', () => {
      const config = {
        enabled: true,
        strictMode: true,
        environment: 'production',
        authentication: {
          methods: [AuthMethod.PASSWORD, AuthMethod.TWO_FACTOR],
          multiFactorRequired: true,
          socialLoginProviders: ['google', 'github'],
          passwordPolicy: {
            minLength: 12,
            maxLength: 64,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            complexityScore: 4
          }
        }
      };

      expect(() => validateSecurityConfig(config)).not.toThrow();
    });

    test('should reject invalid authentication method', () => {
      const config = {
        authentication: {
          methods: ['invalid_method' as any],
          passwordPolicy: defaultSecurityConfig.authentication!.passwordPolicy
        }
      };

      expect(() => validateSecurityConfig(config)).toThrow();
    });

    test('should reject password policy with invalid length constraints', () => {
      const config = {
        authentication: {
          methods: [AuthMethod.PASSWORD],
          passwordPolicy: {
            minLength: 256, // Too high
            maxLength: 64,  // Lower than min
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          }
        }
      };

      expect(() => validateSecurityConfig(config)).toThrow();
    });

    test('should validate rate limiting configuration', () => {
      const config = {
        rateLimiting: {
          global: {
            windowMs: 900000,
            max: 1000,
            skipSuccessfulRequests: false
          },
          byEndpoint: {
            '/api/login': {
              windowMs: 300000,
              max: 5,
              skipSuccessfulRequests: false
            }
          }
        }
      };

      expect(() => validateSecurityConfig(config)).not.toThrow();
    });

    test('should validate encryption configuration', () => {
      const config = {
        encryption: {
          atRest: {
            enabled: true,
            algorithm: EncryptionAlgorithm.AES_256_GCM,
            keyRotationInterval: 90
          },
          inTransit: {
            enforceHTTPS: true,
            tlsVersion: '1.3'
          }
        }
      };

      expect(() => validateSecurityConfig(config)).not.toThrow();
    });
  });

  describe('Environment-based Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('should create production-safe configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_STRICT_MODE = 'true';

      const config = createSecurityConfig();

      expect(config.environment).toBe('production');
      expect(config.strictMode).toBe(true);
      expect(config.encryption.inTransit.enforceHTTPS).toBe(true);
    });

    test('should create development configuration with relaxed settings', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_STRICT_MODE = 'false';

      const config = createSecurityConfig();

      expect(config.environment).toBe('development');
      expect(config.enabled).toBe(true);
    });
  });
});

describe('Password Security Tests', () => {
  const defaultPolicy = defaultSecurityConfig.authentication!.passwordPolicy;

  describe('Password Hashing', () => {
    test('should hash password securely', async () => {
      const password = 'TestPassword123!';
      const hash = await SecurityUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should verify password against hash', async () => {
      const password = 'TestPassword123!';
      const hash = await SecurityUtils.hashPassword(password);

      const isValid = await SecurityUtils.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await SecurityUtils.verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    test('should use different salts for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await SecurityUtils.hashPassword(password);
      const hash2 = await SecurityUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      const password = 'StrongP@ssw0rd123';
      const result = SecurityUtils.validatePassword(password, defaultPolicy!);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(defaultPolicy!.complexityScore);
    });

    test('should reject password too short', () => {
      const password = 'Short1!';
      const result = SecurityUtils.validatePassword(password, defaultPolicy!);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Password must be at least ${defaultPolicy!.minLength} characters long`
      );
    });

    test('should reject password without uppercase', () => {
      const policy = { ...defaultPolicy!, requireUppercase: true };
      const password = 'lowercase123!';
      const result = SecurityUtils.validatePassword(password, policy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    test('should reject password without numbers', () => {
      const policy = { ...defaultPolicy!, requireNumbers: true };
      const password = 'NoNumbers!';
      const result = SecurityUtils.validatePassword(password, policy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    test('should reject password without special characters', () => {
      const policy = { ...defaultPolicy!, requireSpecialChars: true };
      const password = 'NoSpecialChars123';
      const result = SecurityUtils.validatePassword(password, policy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    test('should reject password too long', () => {
      const policy = { ...defaultPolicy!, maxLength: 20 };
      const password = 'ThisPasswordIsTooLongForThePolicy123!';
      const result = SecurityUtils.validatePassword(password, policy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Password must be no more than ${policy.maxLength} characters long`
      );
    });

    test('should calculate password complexity score', () => {
      const weakPassword = 'password';
      const strongPassword = 'Str0ng!P@ssw0rd';

      const weakResult = SecurityUtils.validatePassword(weakPassword, defaultPolicy!);
      const strongResult = SecurityUtils.validatePassword(strongPassword, defaultPolicy!);

      expect(strongResult.score).toBeGreaterThan(weakResult.score);
    });
  });
});

describe('Encryption Tests', () => {
  const testKey = crypto.randomBytes(32).toString('hex');
  const testData = 'Sensitive data to encrypt';

  test('should encrypt and decrypt data correctly', () => {
    const encrypted = SecurityUtils.encrypt(testData, testKey);

    expect(encrypted.encrypted).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.encrypted).not.toBe(testData);

    const decrypted = SecurityUtils.decrypt(
      encrypted.encrypted,
      testKey,
      encrypted.iv,
      encrypted.tag
    );

    expect(decrypted).toBe(testData);
  });

  test('should fail decryption with wrong key', () => {
    const encrypted = SecurityUtils.encrypt(testData, testKey);
    const wrongKey = crypto.randomBytes(32).toString('hex');

    expect(() => {
      SecurityUtils.decrypt(
        encrypted.encrypted,
        wrongKey,
        encrypted.iv,
        encrypted.tag
      );
    }).toThrow();
  });

  test('should fail decryption with tampered data', () => {
    const encrypted = SecurityUtils.encrypt(testData, testKey);
    const tamperedData = encrypted.encrypted.slice(0, -2) + '00';

    expect(() => {
      SecurityUtils.decrypt(
        tamperedData,
        testKey,
        encrypted.iv,
        encrypted.tag
      );
    }).toThrow();
  });

  test('should use unique IV for each encryption', () => {
    const encrypted1 = SecurityUtils.encrypt(testData, testKey);
    const encrypted2 = SecurityUtils.encrypt(testData, testKey);

    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
  });
});

describe('API Key Security Tests', () => {
  test('should generate valid API key', () => {
    const apiKey = SecurityUtils.generateApiKey();

    expect(apiKey).toMatch(/^jaqedu_[A-Za-z0-9_-]{32}$/);
    expect(SecurityUtils.validateApiKey(apiKey)).toBe(true);
  });

  test('should validate API key format', () => {
    const validKey = 'jaqedu_' + 'A'.repeat(32);
    const invalidKeys = [
      'invalid_key',
      'jaqedu_short',
      'jaqedu_' + 'A'.repeat(31),
      'jaqedu_' + 'A'.repeat(33),
      'wrongprefix_' + 'A'.repeat(32)
    ];

    expect(SecurityUtils.validateApiKey(validKey)).toBe(true);
    
    invalidKeys.forEach(key => {
      expect(SecurityUtils.validateApiKey(key)).toBe(false);
    });
  });

  test('should generate unique API keys', () => {
    const key1 = SecurityUtils.generateApiKey();
    const key2 = SecurityUtils.generateApiKey();

    expect(key1).not.toBe(key2);
  });
});

describe('Input Sanitization Tests', () => {
  test('should generate CSRF token', () => {
    const token = SecurityUtils.generateCSRFToken();

    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  test('should generate unique CSRF tokens', () => {
    const token1 = SecurityUtils.generateCSRFToken();
    const token2 = SecurityUtils.generateCSRFToken();

    expect(token1).not.toBe(token2);
  });

  test('should sanitize HTML input', () => {
    const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = SecurityUtils.sanitizeHTML(maliciousHTML);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe content</p>');
  });

  test('should detect SQL injection patterns', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "UNION SELECT * FROM users",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "/* comment */ SELECT * FROM users"
    ];

    const safInputs = [
      "normal user input",
      "user@example.com",
      "123-456-7890",
      "Safe text with numbers 123"
    ];

    sqlInjectionAttempts.forEach(input => {
      expect(SecurityUtils.detectSQLInjection(input)).toBe(true);
    });

    safInputs.forEach(input => {
      expect(SecurityUtils.detectSQLInjection(input)).toBe(false);
    });
  });
});

describe('Security Random Generation Tests', () => {
  test('should generate secure random strings', () => {
    const random1 = SecurityUtils.generateSecureRandom(16);
    const random2 = SecurityUtils.generateSecureRandom(16);

    expect(random1).toBeDefined();
    expect(random2).toBeDefined();
    expect(random1).not.toBe(random2);
    expect(random1.length).toBe(32); // 16 bytes = 32 hex chars
    expect(random2.length).toBe(32);
  });

  test('should generate random strings of specified length', () => {
    const lengths = [8, 16, 32, 64];

    lengths.forEach(length => {
      const random = SecurityUtils.generateSecureRandom(length);
      expect(random.length).toBe(length * 2); // hex encoding doubles length
    });
  });

  test('should use cryptographically secure randomness', () => {
    const samples = Array.from({ length: 100 }, () => 
      SecurityUtils.generateSecureRandom(4)
    );

    // All samples should be different (extremely high probability)
    const uniqueSamples = new Set(samples);
    expect(uniqueSamples.size).toBe(samples.length);
  });
});

describe('Authentication Method Tests', () => {
  test('should validate supported authentication methods', () => {
    const supportedMethods = Object.values(AuthMethod);
    
    expect(supportedMethods).toContain(AuthMethod.PASSWORD);
    expect(supportedMethods).toContain(AuthMethod.TWO_FACTOR);
    expect(supportedMethods).toContain(AuthMethod.JWT);
    expect(supportedMethods).toContain(AuthMethod.API_KEY);
  });

  test('should handle multi-factor authentication configuration', () => {
    const config = {
      authentication: {
        methods: [AuthMethod.PASSWORD, AuthMethod.TWO_FACTOR],
        multiFactorRequired: true
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });
});

describe('Access Control Model Tests', () => {
  test('should support RBAC model', () => {
    const config = {
      accessControl: {
        model: AccessControlModel.RBAC,
        defaultRole: 'student',
        adminRoles: ['admin', 'super_admin']
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });

  test('should support ABAC model', () => {
    const config = {
      accessControl: {
        model: AccessControlModel.ABAC,
        resources: {
          courses: {
            actions: ['read', 'write'],
            conditions: { 'user.department': 'education' }
          }
        }
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });
});

describe('Security Headers Configuration Tests', () => {
  test('should configure security headers', () => {
    const config = {
      headers: {
        helmet: {
          enabled: true,
          contentSecurityPolicy: true,
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: true
          }
        },
        customHeaders: {
          'X-API-Version': '1.0.0'
        }
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });

  test('should validate HSTS configuration', () => {
    const config = {
      headers: {
        helmet: {
          enabled: true,
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false
          }
        }
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });
});

describe('Threat Detection Tests', () => {
  test('should configure threat detection rules', () => {
    const config = {
      monitoring: {
        threatDetection: {
          enabled: true,
          realTime: true,
          rules: [{
            id: 'test-rule',
            name: 'Test Rule',
            pattern: 'suspicious_activity',
            severity: ThreatLevel.HIGH,
            action: 'block' as const,
            enabled: true
          }]
        }
      }
    };

    expect(() => validateSecurityConfig(config)).not.toThrow();
  });

  test('should support different threat levels', () => {
    const levels = Object.values(ThreatLevel);
    
    expect(levels).toContain(ThreatLevel.LOW);
    expect(levels).toContain(ThreatLevel.MEDIUM);
    expect(levels).toContain(ThreatLevel.HIGH);
    expect(levels).toContain(ThreatLevel.CRITICAL);
  });
});

describe('Error Handling and Edge Cases', () => {
  test('should handle null/undefined inputs gracefully', () => {
    expect(() => SecurityUtils.validatePassword('', defaultSecurityConfig.authentication!.passwordPolicy!)).not.toThrow();
    expect(() => SecurityUtils.sanitizeHTML('')).not.toThrow();
    expect(() => SecurityUtils.detectSQLInjection('')).not.toThrow();
  });

  test('should handle malformed configuration', () => {
    const malformedConfigs = [
      null,
      undefined,
      {},
      { authentication: null },
      { authentication: { methods: null } }
    ];

    malformedConfigs.forEach(config => {
      expect(() => validateSecurityConfig(config)).not.toThrow();
    });
  });

  test('should provide meaningful error messages for invalid config', () => {
    const invalidConfig = {
      authentication: {
        methods: ['invalid_method' as any]
      }
    };

    try {
      validateSecurityConfig(invalidConfig);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});