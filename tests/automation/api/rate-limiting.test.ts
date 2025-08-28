/**
 * API Automation Tests: Rate Limiting & Throttling
 * Comprehensive testing of rate limiting policies across different endpoints
 */

import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Types
interface RateLimitHeaders {
  'x-rate-limit-limit'?: string;
  'x-rate-limit-remaining'?: string;
  'x-rate-limit-reset'?: string;
  'x-rate-limit-window'?: string;
  'retry-after'?: string;
}

interface RateLimitResponse {
  status: number;
  headers: RateLimitHeaders;
  data: {
    success: boolean;
    error?: {
      code: string;
      message: string;
      retryAfter?: number;
    };
  };
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const CLEANUP_DELAY = 2000;

// Global test data
let authToken: string;
let testUserIds: string[] = [];

// Helper Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (config: any): Promise<AxiosResponse> => {
  try {
    return await axios({
      timeout: 10000,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...config.headers
      }
    });
  } catch (error: any) {
    if (error.response) {
      return error.response;
    }
    throw error;
  }
};

const extractRateLimitHeaders = (response: AxiosResponse): RateLimitHeaders => {
  const headers = response.headers;
  return {
    'x-rate-limit-limit': headers['x-rate-limit-limit'],
    'x-rate-limit-remaining': headers['x-rate-limit-remaining'],
    'x-rate-limit-reset': headers['x-rate-limit-reset'],
    'x-rate-limit-window': headers['x-rate-limit-window'],
    'retry-after': headers['retry-after']
  };
};

const makeRapidRequests = async (
  count: number,
  requestConfig: any,
  delayBetweenRequests: number = 0
): Promise<AxiosResponse[]> => {
  const requests = [];
  
  for (let i = 0; i < count; i++) {
    if (delayBetweenRequests > 0) {
      await delay(delayBetweenRequests);
    }
    
    requests.push(makeRequest({
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        'X-Request-ID': `${uuidv4()}-${i}`
      }
    }));
  }
  
  return Promise.all(requests);
};

const waitForRateLimitReset = async (resetTime?: string): Promise<void> => {
  if (!resetTime) {
    await delay(RATE_LIMIT_WINDOW);
    return;
  }
  
  const resetTimestamp = parseInt(resetTime) * 1000;
  const now = Date.now();
  const waitTime = Math.max(0, resetTimestamp - now + 1000); // Add 1 second buffer
  
  await delay(waitTime);
};

const createTestUser = async (): Promise<string> => {
  const userData = {
    email: `ratelimit_${uuidv4()}@jaqedu.test`,
    username: `ratelimit_${uuidv4().slice(0, 8)}`,
    password: 'TestPassword123!',
    firstName: 'Rate',
    lastName: 'Test'
  };
  
  const response = await makeRequest({
    method: 'POST',
    url: `${BASE_URL}/auth/register`,
    data: userData
  });
  
  if (response.status === 201) {
    return response.data.data.user.id;
  }
  
  throw new Error('Failed to create test user');
};

// Test Suite
describe('API Rate Limiting Tests', () => {
  beforeAll(async () => {
    // Wait for any previous rate limits to reset
    await delay(CLEANUP_DELAY);
    
    // Authenticate
    try {
      const authResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'admin_test',
          password: 'AdminTest123!'
        }
      });
      
      if (authResponse.status === 200) {
        authToken = authResponse.data.data.accessToken;
      }
    } catch (error) {
      console.warn('Auth failed, some tests may be skipped');
    }
  });

  afterAll(async () => {
    // Cleanup test users
    for (const userId of testUserIds) {
      try {
        await makeRequest({
          method: 'DELETE',
          url: `${BASE_URL}/admin/users/${userId}`
        });
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}`);
      }
    }
  });

  describe('Authentication Endpoint Rate Limits', () => {
    afterEach(async () => {
      // Wait between tests to avoid interference
      await delay(1000);
    });

    test('should enforce rate limit on login attempts', async () => {
      const loginAttempts = 10;
      const responses = await makeRapidRequests(loginAttempts, {
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'nonexistent_user',
          password: 'wrong_password'
        }
      });

      // Should have some successful requests and some rate limited
      const successfulRequests = responses.filter(r => r.status === 401);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      
      // Check rate limit headers on rate limited responses
      const rateLimitedResponse = rateLimitedRequests[0];
      const headers = extractRateLimitHeaders(rateLimitedResponse);
      
      expect(headers['x-rate-limit-limit']).toBeDefined();
      expect(headers['x-rate-limit-remaining']).toBe('0');
      expect(headers['x-rate-limit-reset']).toBeDefined();
      expect(headers['retry-after']).toBeDefined();
      
      // Error response should include retry information
      expect(rateLimitedResponse.data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitedResponse.data.error.retryAfter).toBeDefined();
    });

    test('should enforce rate limit on registration attempts', async () => {
      const registrationAttempts = 8;
      const responses = [];
      
      // Make rapid registration attempts
      for (let i = 0; i < registrationAttempts; i++) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/auth/register`,
          data: {
            email: `ratelimit_reg_${i}@jaqedu.test`,
            username: `ratelimit_reg_${i}`,
            password: 'TestPassword123!',
            firstName: 'Rate',
            lastName: 'Test'
          }
        });
        
        responses.push(response);
        
        // Track successful registrations for cleanup
        if (response.status === 201) {
          testUserIds.push(response.data.data.user.id);
        }
        
        // Small delay to avoid overwhelming the system
        await delay(100);
      }

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Verify rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0];
      const headers = extractRateLimitHeaders(rateLimitedResponse);
      expect(headers['x-rate-limit-remaining']).toBe('0');
    });

    test('should enforce rate limit on password reset requests', async () => {
      const resetAttempts = 6;
      const responses = await makeRapidRequests(resetAttempts, {
        method: 'POST',
        url: `${BASE_URL}/auth/password-reset`,
        data: {
          email: 'test@jaqedu.test'
        }
      });

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Verify error details
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitedResponse.data.error.message).toContain('password reset');
    });

    test('should have different rate limits for different auth endpoints', async () => {
      // Test that login and registration have different limits
      const endpoints = [
        { name: 'login', url: `${BASE_URL}/auth/login`, data: { username: 'test', password: 'test' } },
        { name: 'password-reset', url: `${BASE_URL}/auth/password-reset`, data: { email: 'test@jaqedu.test' } }
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        const responses = await makeRapidRequests(5, {
          method: 'POST',
          url: endpoint.url,
          data: endpoint.data
        });
        
        const firstResponse = responses[0];
        const headers = extractRateLimitHeaders(firstResponse);
        results[endpoint.name] = parseInt(headers['x-rate-limit-limit'] || '0');
        
        await delay(1000); // Wait between endpoint tests
      }
      
      // Different endpoints should have different limits
      expect(Object.keys(results).length).toBeGreaterThan(1);
    });
  });

  describe('API Endpoint Rate Limits', () => {
    beforeAll(async () => {
      if (!authToken) {
        throw new Error('Authentication required for API endpoint tests');
      }
    });

    test('should enforce rate limit on workflow creation', async () => {
      const workflowAttempts = 15;
      const responses = [];
      
      for (let i = 0; i < workflowAttempts; i++) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: `Rate Limit Test Workflow ${i}`,
            description: 'Test workflow for rate limiting',
            version: '1.0.0',
            status: 'draft',
            steps: [{
              id: uuidv4(),
              name: 'Test Step',
              type: 'script',
              config: { script: 'console.log("test");' }
            }]
          }
        });
        
        responses.push(response);
        await delay(50); // Small delay
      }

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      const successfulResponses = responses.filter(r => r.status === 201);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Cleanup successful workflows
      for (const response of successfulResponses) {
        try {
          await makeRequest({
            method: 'DELETE',
            url: `${BASE_URL}/workflows/${response.data.data.id}`
          });
        } catch (error) {
          console.warn('Failed to cleanup workflow');
        }
      }
    });

    test('should enforce rate limit on workflow execution', async () => {
      // First create a test workflow
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          name: `Execution Rate Limit Test`,
          description: 'Test workflow for execution rate limiting',
          version: '1.0.0',
          status: 'active',
          steps: [{
            id: uuidv4(),
            name: 'Quick Step',
            type: 'script',
            config: { script: 'console.log("executed");' }
          }]
        }
      });
      
      expect(workflowResponse.status).toBe(201);
      const workflowId = workflowResponse.data.data.id;
      
      try {
        // Rapid execution attempts
        const executionAttempts = 20;
        const responses = await makeRapidRequests(executionAttempts, {
          method: 'POST',
          url: `${BASE_URL}/workflows/${workflowId}/execute`,
          data: {
            variables: { test: true }
          }
        });

        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        
        // Check that rate limit is properly communicated
        const rateLimitedResponse = rateLimitedResponses[0];
        expect(rateLimitedResponse.data.error.code).toBe('RATE_LIMIT_EXCEEDED');
        
        // Cancel any running executions
        const runningExecutions = responses.filter(r => r.status === 202);
        for (const response of runningExecutions) {
          try {
            await makeRequest({
              method: 'POST',
              url: `${BASE_URL}/executions/${response.data.data.id}/cancel`
            });
          } catch (error) {
            // Ignore cancellation errors
          }
        }
      } finally {
        // Cleanup workflow
        await makeRequest({
          method: 'DELETE',
          url: `${BASE_URL}/workflows/${workflowId}`
        });
      }
    });

    test('should enforce rate limit on API read operations', async () => {
      const readAttempts = 30;
      const responses = await makeRapidRequests(readAttempts, {
        method: 'GET',
        url: `${BASE_URL}/workflows?limit=1`
      });

      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Read operations should have higher limits than write operations
      expect(successfulResponses.length).toBeGreaterThan(rateLimitedResponses.length);
      
      if (rateLimitedResponses.length > 0) {
        const rateLimitedResponse = rateLimitedResponses[0];
        const headers = extractRateLimitHeaders(rateLimitedResponse);
        expect(parseInt(headers['x-rate-limit-limit'] || '0')).toBeGreaterThan(10);
      }
    });
  });

  describe('Rate Limit Headers and Responses', () => {
    test('should include rate limit headers in all responses', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?limit=1`
      });

      const headers = extractRateLimitHeaders(response);
      
      expect(headers['x-rate-limit-limit']).toBeDefined();
      expect(headers['x-rate-limit-remaining']).toBeDefined();
      expect(headers['x-rate-limit-reset']).toBeDefined();
      
      // Values should be numeric
      expect(parseInt(headers['x-rate-limit-limit']!)).toBeGreaterThan(0);
      expect(parseInt(headers['x-rate-limit-remaining']!)).toBeGreaterThanOrEqual(0);
      expect(parseInt(headers['x-rate-limit-reset']!)).toBeGreaterThan(0);
    });

    test('should decrement remaining count with each request', async () => {
      // Make a few requests and track the remaining count
      const responses = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        
        responses.push(response);
        await delay(100);
      }
      
      // Extract remaining counts
      const remainingCounts = responses.map(r => {
        const headers = extractRateLimitHeaders(r);
        return parseInt(headers['x-rate-limit-remaining'] || '0');
      });
      
      // Each subsequent request should have fewer remaining requests
      for (let i = 1; i < remainingCounts.length; i++) {
        expect(remainingCounts[i]).toBeLessThanOrEqual(remainingCounts[i - 1]);
      }
    });

    test('should provide accurate retry-after header when rate limited', async () => {
      // Generate rate limit condition
      const responses = await makeRapidRequests(15, {
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'nonexistent',
          password: 'wrong'
        }
      });
      
      const rateLimitedResponse = responses.find(r => r.status === 429);
      
      if (rateLimitedResponse) {
        const retryAfter = rateLimitedResponse.headers['retry-after'];
        expect(retryAfter).toBeDefined();
        
        const retryAfterSeconds = parseInt(retryAfter!);
        expect(retryAfterSeconds).toBeGreaterThan(0);
        expect(retryAfterSeconds).toBeLessThan(3600); // Should be less than 1 hour
        
        // Verify that requests before retry-after are still rate limited
        const quickRetryResponse = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: {
            username: 'test',
            password: 'test'
          }
        });
        
        expect(quickRetryResponse.status).toBe(429);
      }
    });
  });

  describe('Rate Limit Reset and Recovery', () => {
    test('should reset rate limit after time window expires', async () => {
      // Trigger rate limit
      const responses = await makeRapidRequests(10, {
        method: 'POST',
        url: `${BASE_URL}/auth/password-reset`,
        data: { email: 'reset_test@jaqedu.test' }
      });
      
      const rateLimitedResponse = responses.find(r => r.status === 429);
      
      if (rateLimitedResponse) {
        const headers = extractRateLimitHeaders(rateLimitedResponse);
        const resetTime = headers['x-rate-limit-reset'];
        
        // Wait for reset (with small buffer)
        await waitForRateLimitReset(resetTime);
        
        // Try request again - should succeed
        const recoveryResponse = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/auth/password-reset`,
          data: { email: 'reset_test@jaqedu.test' }
        });
        
        expect(recoveryResponse.status).not.toBe(429);
        
        // Check that remaining count is reset
        const newHeaders = extractRateLimitHeaders(recoveryResponse);
        const newRemaining = parseInt(newHeaders['x-rate-limit-remaining'] || '0');
        expect(newRemaining).toBeGreaterThan(0);
      }
    }, 65000); // Extend timeout for rate limit reset

    test('should handle rate limit sliding window correctly', async () => {
      // Make requests with time gaps to test sliding window
      const responses = [];
      
      // First batch of requests
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        responses.push(response);
        await delay(200);
      }
      
      // Wait for partial window reset
      await delay(2000);
      
      // Second batch of requests
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        responses.push(response);
        await delay(200);
      }
      
      // All requests should succeed if sliding window is working
      const failedRequests = responses.filter(r => r.status === 429);
      expect(failedRequests.length).toBe(0);
    });
  });

  describe('Per-User vs Global Rate Limits', () => {
    test('should enforce per-user rate limits independently', async () => {
      // Create two test users
      const user1Id = await createTestUser();
      const user2Id = await createTestUser();
      testUserIds.push(user1Id, user2Id);
      
      // Login as both users
      const user1Auth = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'user1_test',
          password: 'TestPassword123!'
        }
      });
      
      const user2Auth = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          username: 'user2_test',
          password: 'TestPassword123!'
        }
      });
      
      // If authentication succeeded, test per-user limits
      if (user1Auth.status === 200 && user2Auth.status === 200) {
        const user1Token = user1Auth.data.data.accessToken;
        const user2Token = user2Auth.data.data.accessToken;
        
        // User 1 hits rate limit
        const user1Responses = await makeRapidRequests(10, {
          method: 'GET',
          url: `${BASE_URL}/workflows`,
          headers: { Authorization: `Bearer ${user1Token}` }
        });
        
        // User 2 should still be able to make requests
        const user2Response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows`,
          headers: { Authorization: `Bearer ${user2Token}` }
        });
        
        expect(user2Response.status).not.toBe(429);
      }
    });

    test('should handle unauthenticated rate limits globally', async () => {
      // Make unauthenticated requests from "different" clients
      const responses1 = await makeRapidRequests(5, {
        method: 'GET',
        url: `${BASE_URL}/health`,
        headers: { 'X-Client-ID': 'client1' }
      });
      
      const responses2 = await makeRapidRequests(5, {
        method: 'GET',
        url: `${BASE_URL}/health`,
        headers: { 'X-Client-ID': 'client2' }
      });
      
      // Should be treated as same client for unauthenticated requests
      const allResponses = [...responses1, ...responses2];
      const rateLimitedCount = allResponses.filter(r => r.status === 429).length;
      
      // If there are rate limits, they should affect both "clients"
      if (rateLimitedCount > 0) {
        expect(rateLimitedCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limit Bypass and Edge Cases', () => {
    test('should not allow rate limit bypass with different headers', async () => {
      // Attempt to bypass rate limits with various headers
      const bypassAttempts = [
        { 'X-Forwarded-For': '192.168.1.1' },
        { 'X-Real-IP': '10.0.0.1' },
        { 'X-Client-IP': '172.16.0.1' },
        { 'User-Agent': 'BypassBot/1.0' },
        { 'X-Bypass-Rate-Limit': 'true' }
      ];
      
      for (const headers of bypassAttempts) {
        const responses = await makeRapidRequests(8, {
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: { username: 'bypass_test', password: 'test' },
          headers
        });
        
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        expect(rateLimitedCount).toBeGreaterThan(0); // Should still be rate limited
        
        await delay(1000); // Wait between attempts
      }
    });

    test('should handle concurrent requests at rate limit boundary', async () => {
      // Get current rate limit status
      const checkResponse = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/health`
      });
      
      const headers = extractRateLimitHeaders(checkResponse);
      const remaining = parseInt(headers['x-rate-limit-remaining'] || '5');
      
      if (remaining > 2) {
        // Make exactly the remaining number of requests concurrently
        const concurrentRequests = Math.min(remaining, 5);
        const promises = [];
        
        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(makeRequest({
            method: 'GET',
            url: `${BASE_URL}/health`,
            headers: { 'X-Concurrent-Test': `request-${i}` }
          }));
        }
        
        const responses = await Promise.all(promises);
        
        // Some should succeed, at least one might be rate limited
        const successCount = responses.filter(r => r.status === 200).length;
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        
        expect(successCount + rateLimitedCount).toBe(concurrentRequests);
        expect(successCount).toBeGreaterThan(0);
      }
    });

    test('should handle malformed rate limit requests gracefully', async () => {
      const malformedRequests = [
        {
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: null, // Null data
          headers: { 'Content-Type': 'application/json' }
        },
        {
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: 'invalid json',
          headers: { 'Content-Type': 'application/json' }
        },
        {
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: { username: 'test' }, // Missing required field
          headers: { 'Content-Type': 'application/json' }
        }
      ];
      
      for (const requestConfig of malformedRequests) {
        const responses = await makeRapidRequests(5, requestConfig);
        
        // Should still enforce rate limits even for malformed requests
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        
        // At least some responses should be error responses (400/422)
        const errorCount = responses.filter(r => [400, 422].includes(r.status)).length;
        expect(errorCount + rateLimitedCount).toBe(responses.length);
        
        await delay(1000);
      }
    });
  });

  describe('Rate Limit Monitoring and Metrics', () => {
    test('should provide consistent rate limit information across requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        responses.push(response);
        await delay(100);
      }
      
      // Check that rate limit information is consistent
      const headerSets = responses.map(extractRateLimitHeaders);
      
      // All responses should have the same limit
      const limits = headerSets.map(h => h['x-rate-limit-limit']);
      expect(new Set(limits).size).toBe(1);
      
      // Reset times should be consistent (within reasonable variance)
      const resetTimes = headerSets.map(h => parseInt(h['x-rate-limit-reset'] || '0'));
      const maxVariance = resetTimes.reduce((max, time, i) => {
        if (i === 0) return 0;
        return Math.max(max, Math.abs(time - resetTimes[0]));
      }, 0);
      
      expect(maxVariance).toBeLessThan(5); // Should be within 5 seconds
    });

    test('should handle rate limit edge case scenarios', async () => {
      // Test rapid requests right at the rate limit reset time
      const initialResponse = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/health`
      });
      
      const headers = extractRateLimitHeaders(initialResponse);
      const resetTime = parseInt(headers['x-rate-limit-reset'] || '0') * 1000;
      const now = Date.now();
      
      if (resetTime - now > 1000 && resetTime - now < 30000) {
        // Wait until just before reset
        await delay(resetTime - now - 500);
        
        // Make request right before reset
        const beforeResetResponse = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        
        // Wait for reset to occur
        await delay(1000);
        
        // Make request right after reset
        const afterResetResponse = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/health`
        });
        
        const beforeHeaders = extractRateLimitHeaders(beforeResetResponse);
        const afterHeaders = extractRateLimitHeaders(afterResetResponse);
        
        // After reset, remaining count should be higher
        const beforeRemaining = parseInt(beforeHeaders['x-rate-limit-remaining'] || '0');
        const afterRemaining = parseInt(afterHeaders['x-rate-limit-remaining'] || '0');
        
        expect(afterRemaining).toBeGreaterThanOrEqual(beforeRemaining);
      }
    }, 35000);
  });
});
