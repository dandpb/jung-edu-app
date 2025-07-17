// Browser-compatible authentication utilities
// Using simple implementations for demo purposes
// In production, use proper crypto libraries like crypto-js or bcryptjs

// Security utility functions for authentication

/**
 * Hashes a password using a simple hash function
 * @param password - The plain text password
 * @param salt - The salt to use (generate with generateSalt() if new)
 * @returns The hashed password as a hex string
 */
export function hashPassword(password: string, salt: string): string {
  // Simple hash implementation for demo
  // In production, use bcryptjs or similar
  const combined = password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generates a random salt for password hashing
 * @returns A random salt as a hex string
 */
export function generateSalt(): string {
  // Simple random string generation for demo
  const chars = '0123456789abcdef';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Verifies a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The stored hash
 * @param salt - The salt used for the hash
 * @returns True if the password matches, false otherwise
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const passwordHash = hashPassword(password, salt);
  return passwordHash === hash;
}

/**
 * Generates a secure random token
 * @param length - The length of the token in bytes (default: 32)
 * @returns A random token as a hex string
 */
export function generateToken(length: number = 32): string {
  // Simple random token generation for demo
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < length * 2; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Creates a JWT-like session token (simplified for demo)
 * @param userId - The user ID to encode
 * @param expiry - Token expiry time in milliseconds (default: 24 hours)
 * @returns A session token
 */
export function createSessionToken(userId: string, expiry: number = 24 * 60 * 60 * 1000): string {
  const payload = {
    userId,
    exp: Date.now() + expiry,
    iat: Date.now()
  };
  // In production, use proper JWT library with signing
  // Using Buffer.from for Node.js compatibility in tests
  if (typeof btoa !== 'undefined') {
    return btoa(JSON.stringify(payload));
  } else {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

/**
 * Validates a session token
 * @param token - The token to validate
 * @returns The decoded payload if valid, null otherwise
 */
export function validateSessionToken(token: string): { userId: string; exp: number; iat: number } | null {
  try {
    let payload;
    if (typeof atob !== 'undefined') {
      payload = JSON.parse(atob(token));
    } else {
      payload = JSON.parse(Buffer.from(token, 'base64').toString());
    }
    if (payload.exp && payload.exp > Date.now()) {
      return payload;
    }
  } catch (error) {
    // Invalid token
  }
  return null;
}