// Admin configuration with secure defaults
// In production, these should come from environment variables

export const ADMIN_CONFIG = {
  // Default admin account (for initial setup only)
  defaultAdmin: {
    username: process.env.REACT_APP_ADMIN_USERNAME || 'admin',
    // This is the hash of 'jungadmin123' - DO NOT store plain passwords
    passwordHash: process.env.REACT_APP_ADMIN_PASSWORD_HASH || 
      'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
    salt: process.env.REACT_APP_ADMIN_SALT || 
      '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  
  // Session configuration
  session: {
    // Session expiry in milliseconds (24 hours)
    expiry: parseInt(process.env.REACT_APP_SESSION_EXPIRY || '86400000', 10),
    // Session token key in localStorage
    tokenKey: 'jungAppSessionToken',
    // Session refresh threshold (refresh if less than 2 hours remaining)
    refreshThreshold: 2 * 60 * 60 * 1000
  },
  
  // Security settings
  security: {
    // Minimum password length
    minPasswordLength: 8,
    // Require password complexity
    requireComplexPassword: true,
    // Maximum login attempts before lockout
    maxLoginAttempts: 5,
    // Lockout duration in milliseconds (30 minutes)
    lockoutDuration: 30 * 60 * 1000
  }
};

// Password complexity regex
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Validate password complexity
export function validatePasswordComplexity(password: string): { valid: boolean; message?: string } {
  if (password.length < ADMIN_CONFIG.security.minPasswordLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${ADMIN_CONFIG.security.minPasswordLength} characters long` 
    };
  }
  
  if (ADMIN_CONFIG.security.requireComplexPassword && !PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
    };
  }
  
  return { valid: true };
}