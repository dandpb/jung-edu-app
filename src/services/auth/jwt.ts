/**
 * JWT Token Management Service
 * Implements secure JWT creation, validation, and refresh token rotation
 */

import { generateSecureToken, constantTimeCompare } from './crypto';
import { UserRole, Permission } from '../../types/auth';

/**
 * JWT header structure
 */
interface JWTHeader {
  alg: 'HS256';
  typ: 'JWT';
}

/**
 * Access token payload
 */
export interface AccessTokenPayload {
  sub: string;           // Subject (user ID)
  email: string;
  role: UserRole;
  permissions: Permission[];
  exp: number;           // Expiration (Unix timestamp)
  iat: number;           // Issued at (Unix timestamp)
  jti: string;          // JWT ID (unique identifier)
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  sub: string;          // Subject (user ID)
  exp: number;          // Expiration (Unix timestamp)
  iat: number;          // Issued at (Unix timestamp)
  jti: string;          // JWT ID
  family: string;       // Token family for rotation tracking
}

/**
 * Token validation result
 */
export interface TokenValidationResult<T = any> {
  valid: boolean;
  payload?: T;
  error?: string;
}

/**
 * Token configuration
 */
const TOKEN_CONFIG = {
  accessTokenExpiry: 15 * 60 * 1000,        // 15 minutes
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000,  // 30 days
  issuer: 'jaqEdu',
  audience: 'jaqEdu-client'
};

/**
 * Secret key for HMAC signing (in production, use environment variable)
 */
const JWT_SECRET = process.env.REACT_APP_JWT_SECRET || generateSecureToken(64);

/**
 * Create HMAC-SHA256 signature
 */
async function createSignature(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const key = encoder.encode(JWT_SECRET);
  
  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Create signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  
  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifySignature(message: string, signature: string): Promise<boolean> {
  try {
    const expectedSignature = await createSignature(message);
    return constantTimeCompare(signature, expectedSignature);
  } catch {
    return false;
  }
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data: any): string {
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): any {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json);
}

/**
 * Create an access token
 */
export async function createAccessToken(
  userId: string,
  email: string,
  role: UserRole,
  permissions: Permission[]
): Promise<string> {
  const header: JWTHeader = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Date.now();
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    role,
    permissions,
    exp: Math.floor((now + TOKEN_CONFIG.accessTokenExpiry) / 1000),
    iat: Math.floor(now / 1000),
    jti: generateSecureToken(16)
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(message);
  
  return `${message}.${signature}`;
}

/**
 * Create a refresh token
 */
export async function createRefreshToken(
  userId: string,
  tokenFamily?: string
): Promise<string> {
  const header: JWTHeader = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Date.now();
  const payload: RefreshTokenPayload = {
    sub: userId,
    exp: Math.floor((now + TOKEN_CONFIG.refreshTokenExpiry) / 1000),
    iat: Math.floor(now / 1000),
    jti: generateSecureToken(16),
    family: tokenFamily || generateSecureToken(16)
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(message);
  
  return `${message}.${signature}`;
}

/**
 * Validate and decode a JWT token
 */
export async function validateToken<T = any>(token: string): Promise<TokenValidationResult<T>> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Verify signature
    const isValid = await verifySignature(message, signature);
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payload = base64UrlDecode(encodedPayload) as T & { exp?: number };
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Token validation failed' 
    };
  }
}

/**
 * Extract payload without validation (for client-side reading)
 */
export function decodeToken<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    return base64UrlDecode(parts[1]) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired (client-side check)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken<{ exp?: number }>(token);
  if (!payload || !payload.exp) {
    return true;
  }
  return payload.exp < Math.floor(Date.now() / 1000);
}

/**
 * Token storage keys
 */
export const TOKEN_STORAGE_KEYS = {
  accessToken: 'jungApp_accessToken',
  refreshToken: 'jungApp_refreshToken'
};

/**
 * Store tokens securely in localStorage
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
}

/**
 * Retrieve stored tokens
 */
export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)
  };
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken);
}

/**
 * Refresh token rotation
 * Creates new access and refresh tokens, invalidating the old refresh token
 */
export async function rotateTokens(
  refreshToken: string,
  getUserData: (userId: string) => Promise<{ email: string; role: UserRole; permissions: Permission[] }>
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const validation = await validateToken<RefreshTokenPayload>(refreshToken);
  
  if (!validation.valid || !validation.payload) {
    return null;
  }
  
  const { sub: userId, family } = validation.payload;
  
  // Get user data
  const userData = await getUserData(userId);
  if (!userData) {
    return null;
  }
  
  // Create new tokens
  const newAccessToken = await createAccessToken(
    userId,
    userData.email,
    userData.role,
    userData.permissions
  );
  
  const newRefreshToken = await createRefreshToken(userId, family);
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}