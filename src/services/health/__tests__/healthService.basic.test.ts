/**
 * Basic Health Service Tests
 * Simplified test suite without complex dependencies
 */

import { HealthService, SystemHealth, HealthCheckResult } from '../healthService';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'test'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ status: 'healthy' })
});

// Mock environment variables
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-key-12345';
process.env.REACT_APP_OPENAI_API_KEY = 'sk-test-key';

describe('HealthService - Basic Tests', () => {
  let healthService: HealthService;

  beforeEach(() => {
    // Reset singleton instance for clean testing
    (HealthService as any).instance = undefined;
    
    healthService = HealthService.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test');
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterAll(() => {
    // Reset singleton
    (HealthService as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = HealthService.getInstance();
      const instance2 = HealthService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('should maintain instance across multiple calls', () => {
      const instances = Array(5).fill(null).map(() => HealthService.getInstance());
      const firstInstance = instances[0];
      
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });
  });

  describe('Basic Health Check', () => {
    test('should perform system health check', async () => {
      const health = await healthService.checkSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(health.services).toBeDefined();
      expect(Array.isArray(health.services)).toBe(true);
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBeDefined();
      expect(health.environment).toBeDefined();
    });

    test('should include required services', async () => {
      const health = await healthService.checkSystemHealth();
      
      const serviceNames = health.services.map(s => s.service);
      
      // Should include basic services
      expect(serviceNames).toContain('supabase');
      expect(serviceNames).toContain('api');
      expect(serviceNames).toContain('storage');
    });

    test('should have valid service structure', async () => {
      const health = await healthService.checkSystemHealth();
      
      health.services.forEach(service => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('timestamp');
        expect(service).toHaveProperty('responseTime');
        
        expect(typeof service.service).toBe('string');
        expect(['healthy', 'unhealthy', 'degraded']).toContain(service.status);
        expect(typeof service.timestamp).toBe('string');
        expect(typeof service.responseTime).toBe('number');
      });
    });
  });

  describe('Storage Health Check', () => {
    test('should check storage when working', async () => {
      // Ensure localStorage is working
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue('test');
      localStorageMock.removeItem.mockImplementation(() => {});
      
      const health = await healthService.checkSystemHealth();
      const storageService = health.services.find(s => s.service === 'storage');
      
      expect(storageService).toBeDefined();
      expect(storageService?.status).toBe('healthy');
    });

    test('should handle storage errors', async () => {
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

  describe('Overall Health Calculation', () => {
    test('should calculate overall health status', async () => {
      const health = await healthService.checkSystemHealth();
      
      expect(['healthy', 'unhealthy', 'degraded']).toContain(health.overall);
    });

    test('should return unhealthy when storage fails', async () => {
      // Mock storage to fail
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const health = await healthService.checkSystemHealth();
      
      // Overall should reflect the failure
      expect(['unhealthy', 'degraded']).toContain(health.overall);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate environment configuration', async () => {
      const health = await healthService.checkSystemHealth();
      
      expect(health.environment).toBeDefined();
      expect(health.version).toBeDefined();
    });

    test('should handle missing Supabase URL', async () => {
      const originalUrl = process.env.REACT_APP_SUPABASE_URL;
      delete process.env.REACT_APP_SUPABASE_URL;

      const health = await healthService.checkSystemHealth();
      const supabaseService = health.services.find(s => s.service === 'supabase');
      
      expect(supabaseService?.status).toBe('unhealthy');

      // Restore
      process.env.REACT_APP_SUPABASE_URL = originalUrl;
    });
  });

  describe('Response Time Tracking', () => {
    test('should track response times', async () => {
      const health = await healthService.checkSystemHealth();
      
      health.services.forEach(service => {
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
        expect(typeof service.responseTime).toBe('number');
      });
    });
  });

  describe('Timestamp Validation', () => {
    test('should include valid timestamps', async () => {
      const health = await healthService.checkSystemHealth();
      
      expect(new Date(health.timestamp)).toBeInstanceOf(Date);
      
      health.services.forEach(service => {
        expect(new Date(service.timestamp)).toBeInstanceOf(Date);
      });
    });
  });
});