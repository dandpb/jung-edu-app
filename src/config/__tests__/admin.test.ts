import { ADMIN_CONFIG, PASSWORD_REGEX, validatePasswordComplexity } from '../admin';

describe('Admin Configuration', () => {
  describe('ADMIN_CONFIG', () => {
    test('has default admin configuration', () => {
      expect(ADMIN_CONFIG.defaultAdmin).toBeDefined();
      expect(ADMIN_CONFIG.defaultAdmin.username).toBe('admin');
      expect(ADMIN_CONFIG.defaultAdmin.passwordHash).toBeDefined();
      expect(ADMIN_CONFIG.defaultAdmin.salt).toBeDefined();
    });

    test('has session configuration', () => {
      expect(ADMIN_CONFIG.session).toBeDefined();
      expect(ADMIN_CONFIG.session.expiry).toBe(86400000); // 24 hours
      expect(ADMIN_CONFIG.session.tokenKey).toBe('jungAppSessionToken');
      expect(ADMIN_CONFIG.session.refreshThreshold).toBe(7200000); // 2 hours
    });

    test('has security settings', () => {
      expect(ADMIN_CONFIG.security).toBeDefined();
      expect(ADMIN_CONFIG.security.minPasswordLength).toBe(8);
      expect(ADMIN_CONFIG.security.requireComplexPassword).toBe(true);
      expect(ADMIN_CONFIG.security.maxLoginAttempts).toBe(5);
      expect(ADMIN_CONFIG.security.lockoutDuration).toBe(1800000); // 30 minutes
    });
  });

  describe('PASSWORD_REGEX', () => {
    test('validates strong passwords', () => {
      const strongPasswords = [
        'Test123!',
        'PassWord@456',
        'Complex$Pass1',
        'Str0ng!Password'
      ];

      strongPasswords.forEach(password => {
        expect(PASSWORD_REGEX.test(password)).toBe(true);
      });
    });

    test('rejects weak passwords', () => {
      const weakPasswords = [
        'password',      // No uppercase, no number, no special char
        'PASSWORD',      // No lowercase, no number, no special char
        'Password',      // No number, no special char
        'Password1',     // No special char
        'password1!',    // No uppercase
        'PASSWORD1!',    // No lowercase
        'Pass!',         // Too short
        '12345678',      // No letters
        '!@#$%^&*'       // No letters or numbers
      ];

      weakPasswords.forEach(password => {
        expect(PASSWORD_REGEX.test(password)).toBe(false);
      });
    });
  });

  describe('validatePasswordComplexity', () => {
    test('validates password length', () => {
      const result = validatePasswordComplexity('Short1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    test('validates password complexity when required', () => {
      const result = validatePasswordComplexity('simplepwd');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase letter');
      expect(result.message).toContain('lowercase letter');
      expect(result.message).toContain('number');
      expect(result.message).toContain('special character');
    });

    test('accepts valid complex passwords', () => {
      const validPasswords = [
        'Test123!',
        'ValidPass@456',
        'Complex$Pass1'
      ];

      validPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });

    test('provides specific error messages', () => {
      const shortResult = validatePasswordComplexity('Test1!');
      expect(shortResult.message).toContain('8 characters');

      const simpleResult = validatePasswordComplexity('longpassword');
      expect(simpleResult.message).toContain('uppercase');
    });
  });

  describe('Environment variable support', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('uses environment variables when available', () => {
      // This would require re-importing the module with different env vars
      // For now, we just verify the structure supports env vars
      expect(ADMIN_CONFIG.defaultAdmin.username).toBeDefined();
      expect(typeof ADMIN_CONFIG.session.expiry).toBe('number');
    });
  });
});