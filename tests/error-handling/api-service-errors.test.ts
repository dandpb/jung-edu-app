/**
 * Comprehensive API Service Error Handling Tests
 * Tests network failures, timeout scenarios, and malformed responses
 */

import { jest } from '@jest/globals';
import { LLMOrchestrator } from '../../src/services/llm/orchestrator';
import { MockLLMProvider } from '../../src/services/llm/providers/mock';
import { supabaseAuthService } from '../../src/services/supabase/authService';
import { createDatabaseQuery } from '../../src/config/supabase';

// Mock network failures
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      verifyOtp: jest.fn(),
      refreshSession: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    }
  },
  createDatabaseQuery: {
    users: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis()
    }),
    userProfiles: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn()
    }),
    userSessions: () => ({
      insert: jest.fn()
    })
  }
}));

describe('API Service Error Handling', () => {
  let orchestrator: LLMOrchestrator;
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = new MockLLMProvider();
    orchestrator = new LLMOrchestrator([mockProvider]);
  });

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Network request failed');
    });

    it('should handle timeout scenarios with proper error messages', async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      );
      
      mockFetch.mockImplementationOnce(() => timeoutPromise as Promise<Response>);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ENOTFOUND api.example.com'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('ENOTFOUND');
    });

    it('should handle SSL/TLS certificate errors', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('unable to verify the first certificate')
      );

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('certificate');
    });

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('HTTP Error Response Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid request parameters' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Invalid request parameters');
    });

    it('should handle 401 Unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Invalid API key' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle 403 Forbidden errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Insufficient permissions' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should handle 404 Not Found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Endpoint not found' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Endpoint not found');
    });

    it('should handle 429 Rate Limiting errors with retry logic', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '5' }),
          json: () => Promise.resolve({ error: 'Rate limit exceeded' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: 'Success' } }] })
        } as Response);

      // Should eventually succeed after retry
      const result = await orchestrator.generateText('Test prompt', { temperature: 0.5 });
      expect(result).toContain('Success');
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error occurred' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Server error occurred');
    });

    it('should handle 502 Bad Gateway errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.resolve({ error: 'Gateway error' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Gateway error');
    });

    it('should handle 503 Service Unavailable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ error: 'Service temporarily unavailable' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Service temporarily unavailable');
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected token in JSON'))
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Unexpected token in JSON');
    });

    it('should handle empty response bodies', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null)
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
    });

    it('should handle missing required response fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ incomplete: 'response' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
    });

    it('should handle corrupted structured output', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'invalid json: {broken:}'
            }
          }]
        })
      } as Response);

      await expect(
        orchestrator.generateStructuredOutput('Test prompt', { type: 'object', properties: {} })
      ).rejects.toThrow();
    });

    it('should handle response schema validation failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({ wrong: 'schema' })
            }
          }]
        })
      } as Response);

      const schema = {
        type: 'object',
        properties: {
          required: { type: 'string' }
        },
        required: ['required']
      };

      await expect(
        orchestrator.generateStructuredOutput('Test prompt', schema)
      ).rejects.toThrow();
    });
  });

  describe('Retry Logic and Circuit Breaker', () => {
    it('should implement exponential backoff for retries', async () => {
      const startTime = Date.now();
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: 'Success' } }] })
        } as Response);

      const result = await orchestrator.generateText('Test prompt', { temperature: 0.5 });
      const duration = Date.now() - startTime;
      
      expect(result).toContain('Success');
      expect(duration).toBeGreaterThan(100); // Should have waited for retries
    });

    it('should give up after maximum retry attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Persistent network error');
      
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on client errors (4xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid parameters' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow('Invalid parameters');
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx
    });

    it('should implement circuit breaker after consecutive failures', async () => {
      mockFetch.mockRejectedValue(new Error('Service down'));

      // Multiple calls should trigger circuit breaker
      await Promise.allSettled([
        orchestrator.generateText('Test 1', { temperature: 0.5 }),
        orchestrator.generateText('Test 2', { temperature: 0.5 }),
        orchestrator.generateText('Test 3', { temperature: 0.5 }),
        orchestrator.generateText('Test 4', { temperature: 0.5 }),
        orchestrator.generateText('Test 5', { temperature: 0.5 })
      ]);

      // Circuit should be open, next call should fail fast
      const startTime = Date.now();
      await expect(
        orchestrator.generateText('Test 6', { temperature: 0.5 })
      ).rejects.toThrow();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should fail fast due to circuit breaker
    });
  });

  describe('Error Logging and Monitoring', () => {
    let consoleSpy: jest.SpyInstance;
    
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log network errors with proper context', async () => {
      const networkError = new Error('Network request failed');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
        expect.objectContaining({
          error: networkError,
          prompt: 'Test prompt',
          options: expect.any(Object)
        })
      );
    });

    it('should log API errors with response details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      } as Response);

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API error'),
        expect.objectContaining({
          status: 500,
          error: 'Server error'
        })
      );
    });

    it('should track error metrics for monitoring', async () => {
      const metricsTracker = jest.fn();
      orchestrator.setErrorMetricsTracker(metricsTracker);
      
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
      
      expect(metricsTracker).toHaveBeenCalledWith({
        errorType: 'network_error',
        provider: 'mock',
        timestamp: expect.any(Number),
        details: expect.any(Object)
      });
    });
  });

  describe('Resource Cleanup and Memory Management', () => {
    it('should clean up resources on error', async () => {
      const cleanupSpy = jest.fn();
      orchestrator.setCleanupHandler(cleanupSpy);
      
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        orchestrator.generateText('Test prompt', { temperature: 0.5 })
      ).rejects.toThrow();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle memory pressure during errors', async () => {
      const memoryUsageBefore = process.memoryUsage().heapUsed;
      
      // Simulate multiple concurrent failed requests
      await Promise.allSettled(
        Array(50).fill(null).map(() => {
          mockFetch.mockRejectedValueOnce(new Error('Test error'));
          return orchestrator.generateText('Test prompt', { temperature: 0.5 });
        })
      );
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryUsageAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryUsageAfter - memoryUsageBefore;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple simultaneous failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const promises = Array(10).fill(null).map((_, index) => 
        orchestrator.generateText(`Test prompt ${index}`, { temperature: 0.5 })
      );
      
      const results = await Promise.allSettled(promises);
      
      // All should be rejected
      expect(results.every(result => result.status === 'rejected')).toBe(true);
      
      // Each should have the proper error
      results.forEach(result => {
        if (result.status === 'rejected') {
          expect(result.reason.message).toBe('Network error');
        }
      });
    });

    it('should handle mixed success/failure scenarios', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce({ 
          ok: true, 
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: 'Success 1' } }] })
        } as Response)
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ 
          ok: true, 
          status: 200,
          json: () => Promise.resolve({ choices: [{ message: { content: 'Success 2' } }] })
        } as Response);
      
      const promises = [
        orchestrator.generateText('Test 1', { temperature: 0.5 }),
        orchestrator.generateText('Test 2', { temperature: 0.5 }),
        orchestrator.generateText('Test 3', { temperature: 0.5 }),
        orchestrator.generateText('Test 4', { temperature: 0.5 })
      ];
      
      const results = await Promise.allSettled(promises);
      
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('rejected');
      expect(results[3].status).toBe('fulfilled');
    });
  });
});
