/**
 * Cryptographic utilities for secure authentication
 * Uses Web Crypto API for browser compatibility
 */

import { ADMIN_CONFIG } from '../../config/admin';

/**
 * Password validation rules
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

/**
 * Common weak passwords to check against
 */
const COMMON_PASSWORDS = [
  'password', '123456', 'password123', 'admin', 'letmein',
  'welcome', 'monkey', '1234567890', 'qwerty', 'abc123',
  'Password1', 'password1', '123456789', 'welcome123'
];

/**
 * Hash a password using PBKDF2 with SHA-256
 * @param password - Plain text password
 * @param salt - Salt for hashing (generate with generateSalt if new)
 * @returns Promise resolving to hex-encoded hash
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // OWASP recommended minimum
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );
  
  // Convert to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a cryptographically secure random salt
 * @returns Hex-encoded salt string
 */
export function generateSalt(): string {
  const saltArray = new Uint8Array(32);
  crypto.getRandomValues(saltArray);
  return Array.from(saltArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @param salt - Salt used for the hash
 * @returns Promise resolving to verification result
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(password, salt);
    return passwordHash === hash;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random token
 * @param length - Token length in bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export function generateSecureToken(length: number = 32): string {
  const tokenArray = new Uint8Array(length);
  crypto.getRandomValues(tokenArray);
  
  // Convert to URL-safe base64
  const base64 = btoa(String.fromCharCode(...tokenArray));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Validate password strength and compliance
 * @param password - Password to validate
 * @param username - Username to check against (prevents using username in password)
 * @returns Validation result with errors and strength assessment
 */
export function validatePassword(
  password: string,
  username?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;
  
  // Length check
  if (password.length < ADMIN_CONFIG.security.minPasswordLength) {
    errors.push(`Password must be at least ${ADMIN_CONFIG.security.minPasswordLength} characters long`);
  } else if (password.length >= 12) {
    strengthScore += 2;
  } else {
    strengthScore += 1;
  }
  
  // Character type checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"|,.<>/?]/.test(password);
  
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strengthScore += 1;
  }
  
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strengthScore += 1;
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  } else {
    strengthScore += 1;
  }
  
  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  } else {
    strengthScore += 1;
  }
  
  // Common password check
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
    strengthScore = Math.max(0, strengthScore - 3);
  }
  
  // Username similarity check
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Password should not contain your username');
    strengthScore = Math.max(0, strengthScore - 2);
  }
  
  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    strengthScore = Math.max(0, strengthScore - 1);
  }
  
  // Determine strength
  let strength: PasswordValidationResult['strength'] = 'weak';
  if (strengthScore >= 6) {
    strength = 'very-strong';
  } else if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 2) {
    strength = 'medium';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns Whether strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a random password that meets all requirements
 * @param length - Desired password length (minimum 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < 12) {
    length = 12;
  }
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each required character type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  const array = new Uint8Array(length - 4);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < array.length; i++) {
    password += all[array[i] % all.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}