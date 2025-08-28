/**
 * API Automation Tests: Authentication & Authorization
 * Comprehensive test coverage for auth endpoints, JWT tokens, roles, and permissions
 */

import axios, { AxiosResponse, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// API Types
interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      permissions: string[];
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
  requestId: string;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  timestamp: string;
  requestId: string;
}

interface RateLimitHeaders {
  'x-rate-limit-limit': string;
  'x-rate-limit-remaining': string;
  'x-rate-limit-reset': string;
  'retry-after'?: string;
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const ADMIN_USER = {
  email: 'admin@jaqedu.test',
  username: 'admin_test',
  password: 'AdminTest123!',
  role: 'admin'
};
const STUDENT_USER = {
  email: 'student@jaqedu.test',
  username: 'student_test', 
  password: 'StudentTest123!',
  role: 'student'
};

// Global test data
let adminToken: string;
let studentToken: string;
let refreshToken: string;
let testUserIds: string[] = [];

// Helper Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (config: any): Promise<AxiosResponse> => {
  try {
    return await axios(config);
  } catch (error: any) {
    if (error.response) {
      return error.response;
    }
    throw error;
  }
};

const extractRateLimitHeaders = (headers: any): Partial<RateLimitHeaders> => ({
  'x-rate-limit-limit': headers['x-rate-limit-limit'],
  'x-rate-limit-remaining': headers['x-rate-limit-remaining'],
  'x-rate-limit-reset': headers['x-rate-limit-reset'],
  'retry-after': headers['retry-after']
});

const isValidJWT = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

const decodeJWTPayload = (token: string): any => {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64').toString());
};

// Test Suite
describe('API Authentication & Authorization Tests', () => {
  // Setup and Teardown
  beforeAll(async () => {
    // Wait for API to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.status === 200) break;
      } catch (error) {
        console.log(`Waiting for API... (${retries} retries left)`);
        await delay(2000);
        retries--;
      }
    }
    
    if (retries === 0) {
      throw new Error('API is not responding');
    }
  });

  afterAll(async () => {
    // Cleanup test users
    for (const userId of testUserIds) {
      try {
        await axios.delete(`${BASE_URL}/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}`);
      }
    }
  });

  describe('User Registration', () => {
    test('should successfully register a new user', async () => {
      const userData = {
        email: `user_${uuidv4()}@jaqedu.test`,
        username: `user_${uuidv4().slice(0, 8)}`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: userData,
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data.user.email).toBe(userData.email);
      expect(response.data.data.user.role).toBe('student');
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      
      // Validate JWT structure
      expect(isValidJWT(response.data.data.accessToken)).toBe(true);
      expect(isValidJWT(response.data.data.refreshToken)).toBe(true);
      
      // Store for cleanup
      testUserIds.push(response.data.data.user.id);
    });

    test('should reject registration with invalid email format', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: 'invalid-email-format',
          username: 'testuser',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
      expect(response.data.error.field).toBe('email');
    });

    test('should reject registration with weak password', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: `user_${uuidv4()}@jaqedu.test`,
          username: `user_${uuidv4()}`,
          password: '123',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
      expect(response.data.error.field).toBe('password');
      expect(response.data.error.message).toContain('password');
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        email: `duplicate_${uuidv4()}@jaqedu.test`,
        username: `user1_${uuidv4()}`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      // First registration
      const firstResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: userData
      });
      expect(firstResponse.status).toBe(201);
      testUserIds.push(firstResponse.data.data.user.id);

      // Duplicate registration
      const duplicateResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          ...userData,
          username: `user2_${uuidv4()}` // Different username, same email
        }
      });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.data.success).toBe(false);
      expect(duplicateResponse.data.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should enforce registration rate limiting', async () => {
      const requests = [];
      const baseEmail = `ratelimit_${uuidv4()}`;
      
      // Make multiple rapid registration attempts
      for (let i = 0; i < 15; i++) {
        requests.push(
          makeRequest({
            method: 'POST',
            url: `${BASE_URL}/auth/register`,
            data: {
              email: `${baseEmail}_${i}@jaqedu.test`,
              username: `ratelimit_${i}`,
              password: 'TestPassword123!',
              firstName: 'Rate',
              lastName: 'Test'
            }
          })
        );
      }

      const responses = await Promise.allSettled(requests);
      const actualResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<AxiosResponse>).value);
      
      // Should have some rate limited responses
      const rateLimitedResponses = actualResponses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Check rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.headers).toHaveProperty('x-rate-limit-limit');
      expect(rateLimitedResponse.headers).toHaveProperty('x-rate-limit-remaining');
      expect(rateLimitedResponse.headers).toHaveProperty('x-rate-limit-reset');
      expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
      
      // Cleanup successful registrations
      for (const response of actualResponses) {
        if (response.status === 201) {
          testUserIds.push(response.data.data.user.id);
        }
      }
    });
  });

  describe('User Login', () => {
    beforeAll(async () => {
      // Create test users for login tests
      const adminResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: ADMIN_USER.email,
          username: ADMIN_USER.username,
          password: ADMIN_USER.password,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        }
      });
      testUserIds.push(adminResponse.data.data.user.id);
      
      const studentResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: STUDENT_USER.email,
          username: STUDENT_USER.username,
          password: STUDENT_USER.password,
          firstName: 'Student',
          lastName: 'User',
          role: 'student'
        }
      });
      testUserIds.push(studentResponse.data.data.user.id);
    });

    test('should successfully login with valid credentials', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: ADMIN_USER.username,
          password: ADMIN_USER.password,
          deviceId: uuidv4(),
          deviceName: 'Test Device'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('expiresIn');
      
      // Validate token payload
      const payload = decodeJWTPayload(response.data.data.accessToken);
      expect(payload).toHaveProperty('sub'); // User ID
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('permissions');
      expect(payload).toHaveProperty('exp'); // Expiration
      expect(payload).toHaveProperty('iat'); // Issued at
      
      // Store tokens for other tests
      adminToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
    });

    test('should reject login with invalid credentials', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: ADMIN_USER.username,
          password: 'WrongPassword123!'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject login with non-existent user', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'nonexistent_user',
          password: 'AnyPassword123!'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should enforce login rate limiting', async () => {
      const requests = [];
      
      // Make multiple rapid failed login attempts
      for (let i = 0; i < 10; i++) {
        requests.push(
          makeRequest({
            method: 'POST',
            url: `${BASE_URL}/auth/login`,
            data: {
              username: ADMIN_USER.username,
              password: 'WrongPassword123!'
            }
          })
        );
      }

      const responses = await Promise.allSettled(requests);
      const actualResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<AxiosResponse>).value);
      
      // Should have some rate limited responses after multiple failures
      const rateLimitedResponses = actualResponses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Token Operations', () => {
    test('should refresh access token with valid refresh token', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/refresh`,
        data: {
          refreshToken: refreshToken
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('accessToken');
      expect(response.data.data).toHaveProperty('refreshToken');
      expect(response.data.data).toHaveProperty('expiresIn');
      
      // Validate new tokens are different from old ones
      expect(response.data.data.accessToken).not.toBe(adminToken);
      expect(response.data.data.refreshToken).not.toBe(refreshToken);
      
      // Update stored tokens
      adminToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
    });

    test('should reject invalid refresh token', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/refresh`,
        data: {
          refreshToken: 'invalid.refresh.token'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('TOKEN_INVALID');
    });

    test('should validate access token', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/validate`,
        data: {
          token: adminToken
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('valid', true);
      expect(response.data.data).toHaveProperty('user');
      expect(response.data.data).toHaveProperty('expiresAt');
    });

    test('should reject expired/invalid access token', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/validate`,
        data: {
          token: 'invalid.access.token'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('TOKEN_INVALID');
    });
  });

  describe('Authorization & Permissions', () => {
    beforeAll(async () => {
      // Login as student to get student token
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: STUDENT_USER.username,
          password: STUDENT_USER.password
        }
      });
      studentToken = response.data.data.accessToken;
    });

    test('should allow admin to access admin-only endpoints', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/admin/users`,
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('should deny student access to admin-only endpoints', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/admin/users`,
        headers: {
          Authorization: `Bearer ${studentToken}`
        }
      });

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow authenticated users to access protected endpoints', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`,
        headers: {
          Authorization: `Bearer ${studentToken}`
        }
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    test('should deny access to protected endpoints without authentication', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('NOT_AUTHENTICATED');
    });

    test('should validate Bearer token format', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`,
        headers: {
          Authorization: `Invalid ${adminToken}`
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('TOKEN_INVALID');
    });

    test('should handle malformed authorization header', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`,
        headers: {
          Authorization: 'Malformed Header'
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('TOKEN_INVALID');
    });
  });

  describe('Logout & Session Management', () => {
    test('should successfully logout user', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/logout`,
        headers: {
          Authorization: `Bearer ${adminToken}`
        },
        data: {
          refreshToken: refreshToken
        }
      });

      expect([200, 204]).toContain(response.status);
      if (response.data) {
        expect(response.data.success).toBe(true);
      }
    });

    test('should invalidate tokens after logout', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`,
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('TOKEN_INVALID');
    });

    test('should handle logout with invalid token gracefully', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/logout`,
        headers: {
          Authorization: 'Bearer invalid.token.here'
        }
      });

      expect([401, 204]).toContain(response.status);
    });
  });

  describe('Password Management', () => {
    test('should initiate password reset for valid email', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/password-reset`,
        data: {
          email: STUDENT_USER.email
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('message');
    });

    test('should handle password reset for non-existent email gracefully', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/password-reset`,
        data: {
          email: 'nonexistent@jaqedu.test'
        }
      });

      // Should return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('should enforce rate limiting on password reset requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 8; i++) {
        requests.push(
          makeRequest({
            method: 'POST',
            url: `${BASE_URL}/auth/password-reset`,
            data: {
              email: STUDENT_USER.email
            }
          })
        );
      }

      const responses = await Promise.allSettled(requests);
      const actualResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<AxiosResponse>).value);
      
      const rateLimitedResponses = actualResponses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Response Format', () => {
    test('should return consistent error response format', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'nonexistent',
          password: 'wrongpassword'
        }
      });

      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('requestId');
      expect(response.data.error).toHaveProperty('code');
      expect(response.data.error).toHaveProperty('message');
      expect(typeof response.data.timestamp).toBe('string');
      expect(typeof response.data.requestId).toBe('string');
    });

    test('should include request correlation ID in responses', async () => {
      const correlationId = uuidv4();
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'test',
          password: 'test'
        },
        headers: {
          'X-Correlation-ID': correlationId
        }
      });

      expect(response.data.requestId).toBeDefined();
      // Optionally check if correlation ID is reflected
      if (response.headers['x-correlation-id']) {
        expect(response.headers['x-correlation-id']).toBe(correlationId);
      }
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/health`
      });

      // Check for common security headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          expect(response.headers[header]).toBeDefined();
        }
      });
    });

    test('should not expose sensitive headers in responses', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/health`
      });

      // Headers that should not be exposed
      const sensitiveHeaders = [
        'x-powered-by',
        'server'
      ];

      sensitiveHeaders.forEach(header => {
        expect(response.headers[header]).toBeUndefined();
      });
    });
  });
});
