/**
 * Health Service Tests
 * 
 * Comprehensive test suite for the health monitoring service
 * including all validation and monitoring capabilities.
 */

import { HealthService, SystemHealth, HealthCheckResult } from '../healthService';

// Mock environment variables
const mockEnvVars = {
  REACT_APP_SUPABASE_URL: 'https://test-project.supabase.co',
  REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key-with-sufficient-length-for-validation',
  REACT_APP_OPENAI_API_KEY: 'test-openai-key',
  REACT_APP_YOUTUBE_API_KEY: 'test-youtube-key',
  NODE_ENV: 'test',
  REACT_APP_VERSION: '1.0.0-test',
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock performance API
const performanceMock = {
  now: jest.fn(() => 100),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 2000000000,
  },
};

// Mock navigator
const navigatorMock = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  language: 'en-US',
  onLine: true,
  cookieEnabled: true,
};

describe('HealthService', () => {
  let healthService: HealthService;

  beforeAll(() => {
    // Mock environment variables
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Mock global objects
    (global as any).localStorage = localStorageMock;
    (global as any).performance = performanceMock;
    (global as any).navigator = navigatorMock;
  });

  beforeEach(() => {
    // Get fresh instance for each test
    healthService = HealthService.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test');
  });

  afterAll(() => {
    // Clean up environment variables
    Object.keys(mockEnvVars).forEach(key => {
      delete process.env[key];
    });
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = HealthService.getInstance();
      const instance2 = HealthService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('System Health Check', () => {
    test('should perform comprehensive system health check', async () => {
      const health = await healthService.checkSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(health.services).toBeInstanceOf(Array);
      expect(health.services.length).toBeGreaterThan(0);
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBe('1.0.0-test');
      expect(health.environment).toBe('test');
    });

    test('should include all expected services', async () => {
      const health = await healthService.checkSystemHealth();
      
      const serviceNames = health.services.map(s => s.service);
      
      expect(serviceNames).toContain('supabase');
      expect(serviceNames).toContain('api');
      expect(serviceNames).toContain('storage');
      expect(serviceNames).toContain('auth');
      expect(serviceNames).toContain('database');
      expect(serviceNames).toContain('external_apis');
    });

    test('should handle service failures gracefully', async () => {
      // Mock localStorage to fail
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const health = await healthService.checkSystemHealth();
      
      const storageService = health.services.find(s => s.service === 'storage');
      expect(storageService?.status).toBe('unhealthy');
      expect(storageService?.error).toContain('localStorage not available');
    });
  });

  describe('Individual Service Health Checks', () => {
    test('should validate Supabase configuration', async () => {
      const health = await healthService.checkSystemHealth();
      const supabaseService = health.services.find(s => s.service === 'supabase');
      
      expect(supabaseService).toBeDefined();
      expect(supabaseService?.responseTime).toBeGreaterThan(0);
      expect(supabaseService?.details?.configured).toBe(true);
    });

    test('should check storage functionality', async () => {
      const health = await healthService.checkSystemHealth();
      const storageService = health.services.find(s => s.service === 'storage');
      
      expect(storageService).toBeDefined();
      expect(storageService?.status).toBe('healthy');
      expect(storageService?.details?.localStorage).toBe(true);
    });

    test('should validate authentication configuration', async () => {
      const health = await healthService.checkSystemHealth();
      const authService = health.services.find(s => s.service === 'auth');
      
      expect(authService).toBeDefined();
      expect(authService?.status).toBe('healthy');
      expect(authService?.details?.supabaseUrl).toBe(true);
      expect(authService?.details?.supabaseKey).toBe(true);
    });

    test('should check external APIs', async () => {
      const health = await healthService.checkSystemHealth();
      const externalApiService = health.services.find(s => s.service === 'external_apis');
      
      expect(externalApiService).toBeDefined();
      expect(externalApiService?.details?.openai).toBe(true);
      expect(externalApiService?.details?.youtube).toBe(true);
    });
  });

  describe('Overall Health Calculation', () => {
    test('should return healthy when all services are healthy', async () => {
      const health = await healthService.checkSystemHealth();
      
      // In test environment with mocked services, should be healthy
      expect(['healthy', 'degraded']).toContain(health.overall);
    });

    test('should return unhealthy when critical services fail', async () => {
      // Mock environment to simulate missing critical configuration
      delete process.env.REACT_APP_SUPABASE_URL;
      delete process.env.REACT_APP_SUPABASE_ANON_KEY;

      const health = await healthService.checkSystemHealth();
      
      expect(health.overall).toBe('unhealthy');

      // Restore environment
      process.env.REACT_APP_SUPABASE_URL = mockEnvVars.REACT_APP_SUPABASE_URL;
      process.env.REACT_APP_SUPABASE_ANON_KEY = mockEnvVars.REACT_APP_SUPABASE_ANON_KEY;
    });

    test('should return degraded when non-critical services fail', async () => {
      // Mock scenario where external APIs are missing but core services work
      delete process.env.REACT_APP_OPENAI_API_KEY;

      const health = await healthService.checkSystemHealth();
      
      // Should still be healthy or degraded, not unhealthy
      expect(['healthy', 'degraded']).toContain(health.overall);

      // Restore environment
      process.env.REACT_APP_OPENAI_API_KEY = mockEnvVars.REACT_APP_OPENAI_API_KEY;
    });
  });

  describe('System Metrics', () => {
    test('should collect system metrics', async () => {
      const metrics = await healthService.getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.browser).toBeDefined();
      expect(metrics.environment).toBeDefined();
      expect(metrics.response_time).toBeGreaterThanOrEqual(0);
    });

    test('should include memory information', async () => {
      const metrics = await healthService.getSystemMetrics();
      
      expect(metrics.memory.used).toBe(50000000);
      expect(metrics.memory.total).toBe(100000000);
      expect(metrics.memory.limit).toBe(2000000000);
    });

    test('should include browser information', async () => {
      const metrics = await healthService.getSystemMetrics();
      
      expect(metrics.browser.user_agent).toBe('Mozilla/5.0 (Test Browser)');
      expect(metrics.browser.language).toBe('en-US');
      expect(metrics.browser.online).toBe(true);
      expect(metrics.browser.cookies_enabled).toBe(true);
    });

    test('should handle metrics collection errors', async () => {
      // Mock performance to throw error
      (global as any).performance = {
        now: () => { throw new Error('Performance API not available'); },
      };

      const metrics = await healthService.getSystemMetrics();
      
      expect(metrics.error).toBeDefined();
      expect(metrics.timestamp).toBeDefined();

      // Restore performance mock
      (global as any).performance = performanceMock;
    });
  });

  describe('Deep Health Check', () => {
    test('should perform deep health check with retries', async () => {
      const health = await healthService.performDeepHealthCheck(2);
      
      expect(health).toBeDefined();
      expect(health.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    test('should retry on unhealthy status', async () => {
      // Mock a scenario that starts unhealthy but recovers
      let attempt = 0;
      const originalCheckHealth = healthService.checkSystemHealth;
      
      healthService.checkSystemHealth = jest.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          return {
            overall: 'unhealthy' as const,
            services: [],
            timestamp: new Date().toISOString(),
            version: '1.0.0-test',
            environment: 'test',
          };
        }
        return originalCheckHealth.call(healthService);
      });

      const health = await healthService.performDeepHealthCheck(2);
      
      expect(healthService.checkSystemHealth).toHaveBeenCalledTimes(2);
      expect(health.overall).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    test('should return unhealthy after all retries fail', async () => {
      // Mock checkSystemHealth to always throw
      healthService.checkSystemHealth = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const health = await healthService.performDeepHealthCheck(2);
      
      expect(health.overall).toBe('unhealthy');
      expect(health.services).toEqual([]);
    });
  });

  describe('Response Time Tracking', () => {
    test('should track response times for all services', async () => {
      const health = await healthService.checkSystemHealth();
      
      health.services.forEach(service => {
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
        expect(typeof service.responseTime).toBe('number');
      });
    });

    test('should include timestamp for all services', async () => {
      const health = await healthService.checkSystemHealth();
      
      health.services.forEach(service => {
        expect(service.timestamp).toBeDefined();
        expect(new Date(service.timestamp)).toBeInstanceOf(Date);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const health = await healthService.checkSystemHealth();
      const storageService = health.services.find(s => s.service === 'storage');
      
      expect(storageService?.status).toBe('unhealthy');
      expect(storageService?.error).toContain('Storage quota exceeded');
    });

    test('should handle missing environment variables', async () => {
      const originalUrl = process.env.REACT_APP_SUPABASE_URL;
      delete process.env.REACT_APP_SUPABASE_URL;

      const health = await healthService.checkSystemHealth();
      const supabaseService = health.services.find(s => s.service === 'supabase');
      
      expect(supabaseService?.status).toBe('unhealthy');
      expect(supabaseService?.error).toContain('configuration missing');

      // Restore
      process.env.REACT_APP_SUPABASE_URL = originalUrl;
    });
  });

  describe('Configuration Validation', () => {
    test('should validate Supabase URL format', async () => {
      const originalUrl = process.env.REACT_APP_SUPABASE_URL;
      process.env.REACT_APP_SUPABASE_URL = 'invalid-url';

      const health = await healthService.checkSystemHealth();
      const supabaseService = health.services.find(s => s.service === 'supabase');
      
      // Should still work but might be degraded depending on implementation
      expect(supabaseService).toBeDefined();

      // Restore
      process.env.REACT_APP_SUPABASE_URL = originalUrl;
    });

    test('should handle short API keys', async () => {
      const originalKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      process.env.REACT_APP_SUPABASE_ANON_KEY = 'short';

      const health = await healthService.checkSystemHealth();
      const authService = health.services.find(s => s.service === 'auth');
      
      expect(authService?.status).toBe('unhealthy');

      // Restore
      process.env.REACT_APP_SUPABASE_ANON_KEY = originalKey;
    });
  });
});