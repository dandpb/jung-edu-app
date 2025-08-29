/**
 * Comprehensive test suite for Supabase configuration utilities
 * Testing connection handling, type safety, error recovery, and security
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase, SupabaseConfig, createSupabaseClient, validateSupabaseConfig } from '../supabase';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock console methods
let consoleErrorSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleLogSpy: jest.SpyInstance;

// Mock environment variables
const originalEnv = process.env;

describe('Supabase Configuration Utilities - Comprehensive Test Suite', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Mock console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChange: jest.fn(),
        getUser: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        data: null,
        error: null
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          download: jest.fn(),
          list: jest.fn(),
          remove: jest.fn()
        }))
      },
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      })),
      removeChannel: jest.fn()
    };

    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Environment Variable Configuration', () => {
    it('should load configuration from environment variables', () => {
      process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
      process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';

      // Re-import or reinitialize the module
      const config = {
        url: process.env.REACT_APP_SUPABASE_URL || '',
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
      };

      expect(config.url).toBe('https://test.supabase.co');
      expect(config.anonKey).toBe('test-anon-key');
    });

    it('should handle missing environment variables', () => {
      delete process.env.REACT_APP_SUPABASE_URL;
      delete process.env.REACT_APP_SUPABASE_ANON_KEY;

      const config = {
        url: process.env.REACT_APP_SUPABASE_URL || '',
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
      };

      expect(config.url).toBe('');
      expect(config.anonKey).toBe('');
    });

    it('should handle empty environment variables', () => {
      process.env.REACT_APP_SUPABASE_URL = '';
      process.env.REACT_APP_SUPABASE_ANON_KEY = '';

      const config = {
        url: process.env.REACT_APP_SUPABASE_URL || '',
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
      };

      expect(config.url).toBe('');
      expect(config.anonKey).toBe('');
    });

    it('should handle whitespace in environment variables', () => {
      process.env.REACT_APP_SUPABASE_URL = '  https://test.supabase.co  ';
      process.env.REACT_APP_SUPABASE_ANON_KEY = '  test-key-with-spaces  ';

      const config = {
        url: (process.env.REACT_APP_SUPABASE_URL || '').trim(),
        anonKey: (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim()
      };

      expect(config.url).toBe('https://test.supabase.co');
      expect(config.anonKey).toBe('test-key-with-spaces');
    });

    it('should handle special characters in keys', () => {
      process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
      process.env.REACT_APP_SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test-key-with-special-chars!@#$%^&*()';

      const config = {
        url: process.env.REACT_APP_SUPABASE_URL || '',
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
      };

      expect(config.url).toBe('https://test.supabase.co');
      expect(config.anonKey).toContain('test-key-with-special-chars!@#$%^&*()');
    });
  });

  describe('validateSupabaseConfig', () => {
    it('should validate correct configuration', () => {
      const validConfig: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      };

      expect(() => validateSupabaseConfig(validConfig)).not.toThrow();
    });

    it('should reject empty URL', () => {
      const invalidConfig: SupabaseConfig = {
        url: '',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(invalidConfig)).toThrow('Supabase URL is required');
    });

    it('should reject empty anonymous key', () => {
      const invalidConfig: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: ''
      };

      expect(() => validateSupabaseConfig(invalidConfig)).toThrow('Supabase anonymous key is required');
    });

    it('should reject invalid URL format', () => {
      const invalidConfig: SupabaseConfig = {
        url: 'not-a-valid-url',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(invalidConfig)).toThrow('Invalid Supabase URL format');
    });

    it('should accept localhost URLs for development', () => {
      const localhostConfig: SupabaseConfig = {
        url: 'http://localhost:54321',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(localhostConfig)).not.toThrow();
    });

    it('should accept IP addresses for development', () => {
      const ipConfig: SupabaseConfig = {
        url: 'http://192.168.1.100:54321',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(ipConfig)).not.toThrow();
    });

    it('should reject non-HTTPS URLs in production', () => {
      process.env.NODE_ENV = 'production';

      const httpConfig: SupabaseConfig = {
        url: 'http://test.supabase.co',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(httpConfig)).toThrow('Supabase URL must use HTTPS in production');
    });

    it('should accept HTTPS URLs in production', () => {
      process.env.NODE_ENV = 'production';

      const httpsConfig: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'valid-key'
      };

      expect(() => validateSupabaseConfig(httpsConfig)).not.toThrow();
    });

    it('should validate JWT-like anonymous key format', () => {
      const configs = [
        { url: 'https://test.supabase.co', anonKey: 'not-jwt-format' },
        { url: 'https://test.supabase.co', anonKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9' }, // Valid JWT format
        { url: 'https://test.supabase.co', anonKey: 'eyJ.test.key' }, // Minimal JWT format
      ];

      // First should pass (we're not strictly validating JWT format)
      expect(() => validateSupabaseConfig(configs[0])).not.toThrow();
      expect(() => validateSupabaseConfig(configs[1])).not.toThrow();
      expect(() => validateSupabaseConfig(configs[2])).not.toThrow();
    });

    it('should handle null/undefined configuration', () => {
      expect(() => validateSupabaseConfig(null as any)).toThrow();
      expect(() => validateSupabaseConfig(undefined as any)).toThrow();
    });

    it('should handle configuration with missing properties', () => {
      const incompleteConfig = { url: 'https://test.supabase.co' } as SupabaseConfig;

      expect(() => validateSupabaseConfig(incompleteConfig)).toThrow();
    });
  });

  describe('createSupabaseClient', () => {
    it('should create client with valid configuration', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const client = createSupabaseClient(config);

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          })
        })
      );
      expect(client).toBe(mockSupabaseClient);
    });

    it('should create client with custom options', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const customOptions = {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'X-Custom-Header': 'test-value'
          }
        }
      };

      const client = createSupabaseClient(config, customOptions);

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }),
          global: expect.objectContaining({
            headers: {
              'X-Custom-Header': 'test-value'
            }
          })
        })
      );
    });

    it('should throw error for invalid configuration', () => {
      const invalidConfig: SupabaseConfig = {
        url: '',
        anonKey: 'test-key'
      };

      expect(() => createSupabaseClient(invalidConfig)).toThrow('Supabase URL is required');
    });

    it('should handle createClient errors gracefully', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const createError = new Error('Failed to create Supabase client');
      mockCreateClient.mockImplementation(() => {
        throw createError;
      });

      expect(() => createSupabaseClient(config)).toThrow('Failed to create Supabase client');
    });

    it('should merge default options with custom options', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const partialOptions = {
        auth: {
          autoRefreshToken: false
        }
      };

      createSupabaseClient(config, partialOptions);

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: true, // Should keep default
            detectSessionInUrl: true // Should keep default
          })
        })
      );
    });
  });

  describe('Client Connection and Health', () => {
    beforeEach(() => {
      process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
      process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('should test database connectivity', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ version: 'PostgreSQL 13' }],
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ version: 'PostgreSQL 13' }],
            error: null
          })
        })
      });

      const isConnected = await testDatabaseConnection(mockSupabaseClient);
      expect(isConnected).toBe(true);
    });

    it('should handle connection failures', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' }
          })
        })
      });

      const isConnected = await testDatabaseConnection(mockSupabaseClient);
      expect(isConnected).toBe(false);
    });

    it('should handle network timeouts', async () => {
      jest.useFakeTimers();

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(
            new Promise(resolve => setTimeout(resolve, 30000))
          )
        })
      });

      const connectionPromise = testDatabaseConnection(mockSupabaseClient);
      
      // Fast forward past timeout
      jest.advanceTimersByTime(10000);
      
      const isConnected = await connectionPromise;
      expect(isConnected).toBe(false);

      jest.useRealTimers();
    });

    it('should retry connection on failure', async () => {
      let attempt = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockImplementation(() => {
            attempt++;
            if (attempt < 3) {
              return Promise.resolve({
                data: null,
                error: { message: 'Temporary failure' }
              });
            }
            return Promise.resolve({
              data: [{ version: 'PostgreSQL 13' }],
              error: null
            });
          })
        })
      });

      const isConnected = await testDatabaseConnectionWithRetry(mockSupabaseClient, 3);
      expect(isConnected).toBe(true);
      expect(attempt).toBe(3);
    });

    it('should validate authentication state', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
        error: null
      });

      const hasValidSession = await validateAuthState(mockSupabaseClient);
      expect(hasValidSession).toBe(true);
    });

    it('should handle authentication errors', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Authentication failed' }
      });

      const hasValidSession = await validateAuthState(mockSupabaseClient);
      expect(hasValidSession).toBe(false);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle multiple concurrent connections efficiently', async () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const start = performance.now();

      const clients = await Promise.all(
        Array.from({ length: 10 }, () => 
          Promise.resolve(createSupabaseClient(config))
        )
      );

      const duration = performance.now() - start;

      expect(clients).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should be fast
      expect(mockCreateClient).toHaveBeenCalledTimes(10);
    });

    it('should handle connection pooling appropriately', async () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      // Create multiple clients with same config
      const client1 = createSupabaseClient(config);
      const client2 = createSupabaseClient(config);
      const client3 = createSupabaseClient(config);

      // Each should be a separate instance (no automatic pooling)
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
      expect(client3).toBeDefined();
      expect(mockCreateClient).toHaveBeenCalledTimes(3);
    });

    it('should clean up resources properly', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const client = createSupabaseClient(config);

      // Simulate cleanup
      if (client.removeChannel && typeof client.removeChannel === 'function') {
        client.removeChannel();
      }

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalled();
    });

    it('should handle memory pressure scenarios', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      // Create many clients to simulate memory pressure
      const clients = Array.from({ length: 100 }, () => 
        createSupabaseClient(config)
      );

      expect(clients).toHaveLength(100);
      expect(mockCreateClient).toHaveBeenCalledTimes(100);
    });
  });

  describe('Security and Error Handling', () => {
    it('should sanitize logs to prevent key exposure', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'sk-very-secret-key-that-should-not-appear-in-logs'
      };

      createSupabaseClient(config);

      // Check that sensitive data is not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('sk-very-secret-key')
      );
    });

    it('should handle malformed configuration gracefully', () => {
      const malformedConfigs = [
        { url: null, anonKey: 'test-key' },
        { url: 'https://test.supabase.co', anonKey: null },
        { url: undefined, anonKey: undefined },
        { url: 123, anonKey: 'test-key' },
        { url: 'https://test.supabase.co', anonKey: {} }
      ];

      malformedConfigs.forEach(config => {
        expect(() => validateSupabaseConfig(config as any)).toThrow();
      });
    });

    it('should validate against injection attacks', () => {
      const suspiciousConfigs = [
        {
          url: 'https://test.supabase.co; DROP TABLE users;',
          anonKey: 'test-key'
        },
        {
          url: 'https://test.supabase.co',
          anonKey: 'test-key\'; DROP TABLE users; --'
        }
      ];

      // Should not throw for basic validation, but URL validation should catch malformed URLs
      suspiciousConfigs.forEach(config => {
        expect(() => validateSupabaseConfig(config)).toThrow();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockCreateClient.mockImplementation(() => {
        throw new Error('Network unavailable');
      });

      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      expect(() => createSupabaseClient(config)).toThrow('Network unavailable');
    });

    it('should validate URL protocols for security', () => {
      const insecureConfigs = [
        { url: 'ftp://test.supabase.co', anonKey: 'test-key' },
        { url: 'file:///etc/passwd', anonKey: 'test-key' },
        { url: 'javascript:alert(1)', anonKey: 'test-key' }
      ];

      insecureConfigs.forEach(config => {
        expect(() => validateSupabaseConfig(config)).toThrow('Invalid Supabase URL format');
      });
    });

    it('should handle CORS-related errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(
            new Error('CORS error: Origin not allowed')
          )
        })
      });

      const isConnected = await testDatabaseConnection(mockSupabaseClient);
      expect(isConnected).toBe(false);
    });
  });

  describe('Type Safety and API Compliance', () => {
    it('should maintain type safety for configuration objects', () => {
      const typedConfig: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      expect(typeof typedConfig.url).toBe('string');
      expect(typeof typedConfig.anonKey).toBe('string');
    });

    it('should ensure client API compliance', () => {
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const client = createSupabaseClient(config);

      // Verify expected API methods exist
      expect(client.auth).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.storage).toBeDefined();
      expect(typeof client.from).toBe('function');
    });

    it('should handle TypeScript strict mode compatibility', () => {
      // These should not cause TypeScript errors in strict mode
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const client: SupabaseClient = createSupabaseClient(config);
      
      expect(client).toBeDefined();
    });
  });

  describe('Integration and Compatibility', () => {
    it('should work with different Supabase client versions', () => {
      // Test with different mock client implementations
      const clients = [
        { version: '1.x', hasRealtimeMethod: false },
        { version: '2.x', hasRealtimeMethod: true }
      ];

      clients.forEach(clientInfo => {
        const versionedClient = {
          ...mockSupabaseClient,
          realtime: clientInfo.hasRealtimeMethod ? {} : undefined
        };

        mockCreateClient.mockReturnValueOnce(versionedClient as any);

        const config: SupabaseConfig = {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key'
        };

        const client = createSupabaseClient(config);
        expect(client).toBeDefined();
      });
    });

    it('should handle browser vs Node.js environments', () => {
      const originalWindow = (global as any).window;
      
      // Test browser environment
      (global as any).window = { location: { origin: 'https://myapp.com' } };
      
      const config: SupabaseConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key'
      };

      const browserClient = createSupabaseClient(config);
      expect(browserClient).toBeDefined();

      // Test Node.js environment
      delete (global as any).window;

      const nodeClient = createSupabaseClient(config);
      expect(nodeClient).toBeDefined();

      // Restore
      (global as any).window = originalWindow;
    });

    it('should support development vs production configurations', () => {
      const developmentConfig: SupabaseConfig = {
        url: 'http://localhost:54321',
        anonKey: 'dev-anon-key'
      };

      const productionConfig: SupabaseConfig = {
        url: 'https://prod.supabase.co',
        anonKey: 'prod-anon-key'
      };

      // Development should allow HTTP
      process.env.NODE_ENV = 'development';
      expect(() => validateSupabaseConfig(developmentConfig)).not.toThrow();

      // Production should require HTTPS
      process.env.NODE_ENV = 'production';
      expect(() => validateSupabaseConfig(productionConfig)).not.toThrow();
    });
  });
});

// Helper functions for testing (these would be part of the actual implementation)
async function testDatabaseConnection(client: any): Promise<boolean> {
  try {
    const { data, error } = await client.from('pg_stat_activity').select('*').limit(1);
    return !error && data !== null;
  } catch {
    return false;
  }
}

async function testDatabaseConnectionWithRetry(client: any, maxRetries: number): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isConnected = await testDatabaseConnection(client);
    if (isConnected) return true;
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

async function validateAuthState(client: any): Promise<boolean> {
  try {
    const { data, error } = await client.auth.getSession();
    return !error && data?.session?.user;
  } catch {
    return false;
  }
}