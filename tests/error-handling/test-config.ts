/**
 * Error Handling Test Configuration
 * Central configuration for comprehensive error handling tests
 */

import { jest } from '@jest/globals';

// Test configuration constants
export const ERROR_TEST_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 5000,
  LONG_TIMEOUT: 10000,
  SHORT_TIMEOUT: 1000,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 100,
  EXPONENTIAL_BACKOFF_BASE: 2,
  
  // Network simulation
  NETWORK_DELAY_MIN: 10,
  NETWORK_DELAY_MAX: 500,
  FAILURE_RATE: 0.3,
  
  // Memory limits
  MAX_MEMORY_MB: 50,
  LARGE_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Security test patterns
  XSS_PAYLOADS: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ],
  
  SQL_INJECTION_PAYLOADS: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM admin_users WHERE '1'='1",
    "'; DELETE FROM sessions; --"
  ],
  
  COMMAND_INJECTION_PAYLOADS: [
    'file.txt; rm -rf /',
    'document.pdf && echo "hacked"',
    'image.jpg | cat /etc/passwd',
    'data.csv `whoami`'
  ]
};

// Common error scenarios for testing
export const ERROR_SCENARIOS = {
  NETWORK: {
    CONNECTION_REFUSED: 'ECONNREFUSED',
    TIMEOUT: 'TIMEOUT',
    DNS_FAILURE: 'ENOTFOUND',
    SSL_ERROR: 'CERT_UNTRUSTED',
    RATE_LIMITED: 'RATE_LIMITED'
  },
  
  HTTP: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    PAYLOAD_TOO_LARGE: 413,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    INSUFFICIENT_STORAGE: 507
  },
  
  DATABASE: {
    UNIQUE_CONSTRAINT: '23505',
    FOREIGN_KEY_CONSTRAINT: '23503',
    CHECK_CONSTRAINT: '23514',
    NOT_NULL_CONSTRAINT: '23502',
    CONNECTION_LOST: 'CONNECTION_LOST'
  },
  
  FILE_SYSTEM: {
    PERMISSION_DENIED: 'EACCES',
    FILE_NOT_FOUND: 'ENOENT',
    DISK_FULL: 'ENOSPC',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
  }
};

// Mock factory functions
export const createMockError = (type: string, message: string, code?: string | number) => {
  const error = new Error(message);
  error.name = type;
  if (code) {
    (error as any).code = code;
  }
  return error;
};

export const createNetworkError = (scenario: keyof typeof ERROR_SCENARIOS.NETWORK) => {
  const messages = {
    CONNECTION_REFUSED: 'Connection refused',
    TIMEOUT: 'Request timeout',
    DNS_FAILURE: 'DNS resolution failed',
    SSL_ERROR: 'SSL certificate error',
    RATE_LIMITED: 'Too many requests'
  };
  
  return createMockError('NetworkError', messages[scenario], ERROR_SCENARIOS.NETWORK[scenario]);
};

export const createHttpError = (status: keyof typeof ERROR_SCENARIOS.HTTP, message?: string) => {
  const statusCode = ERROR_SCENARIOS.HTTP[status];
  const defaultMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    413: 'Payload Too Large',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    507: 'Insufficient Storage'
  };
  
  const error = createMockError('HttpError', message || defaultMessages[statusCode], statusCode);
  (error as any).status = statusCode;
  return error;
};

// Test utilities
export const createDelayedPromise = <T>(value: T, delay: number): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(value), delay));
};

export const createDelayedRejection = (error: Error, delay: number): Promise<never> => {
  return new Promise((_, reject) => setTimeout(() => reject(error), delay));
};

export const createRandomDelay = (min: number = ERROR_TEST_CONFIG.NETWORK_DELAY_MIN, max: number = ERROR_TEST_CONFIG.NETWORK_DELAY_MAX) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Mock response factory
export const createMockResponse = (status: number, body?: any, headers?: Record<string, string>): Response => {
  const mockHeaders = new Headers(headers);
  
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Error ${status}`,
    headers: mockHeaders,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    blob: () => Promise.resolve(new Blob([typeof body === 'string' ? body : JSON.stringify(body)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    clone: () => createMockResponse(status, body, headers)
  } as Response;
};

// Performance monitoring utilities
export const measureExecutionTime = async <T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;
  return { result, duration };
};

export const measureMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  
  // Fallback for browser environment
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return {
      heapUsed: (performance as any).memory.usedJSHeapSize || 0,
      heapTotal: (performance as any).memory.totalJSHeapSize || 0,
      external: 0,
      rss: 0
    };
  }
  
  return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
};

// Error boundary test helper
export class TestErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'TestErrorBoundary';
  }
}

// Cleanup utilities
export const createCleanupRegistry = () => {
  const cleanupFunctions: (() => void)[] = [];
  
  return {
    register: (cleanup: () => void) => {
      cleanupFunctions.push(cleanup);
    },
    cleanup: () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      cleanupFunctions.length = 0;
    }
  };
};

// Validation utilities
export const validateErrorHandling = {
  hasProperErrorMessage: (error: any): boolean => {
    return error && typeof error.message === 'string' && error.message.length > 0;
  },
  
  hasProperErrorType: (error: any): boolean => {
    return error && typeof error.name === 'string';
  },
  
  isSecuritySafe: (input: string): boolean => {
    // Check for common security vulnerabilities
    const dangerousPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /\$\{.*\}/g,
      /\{\{.*\}\}/g,
      /DROP\s+TABLE/gi,
      /DELETE\s+FROM/gi,
      /INSERT\s+INTO/gi,
      /UNION\s+SELECT/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  },
  
  isWithinMemoryLimits: (heapUsed: number): boolean => {
    return heapUsed < ERROR_TEST_CONFIG.MAX_MEMORY_MB * 1024 * 1024;
  }
};

// Test data generators
export const generateTestData = {
  largeString: (size: number = 1024) => 'x'.repeat(size),
  
  maliciousInput: (type: 'xss' | 'sql' | 'command') => {
    const payloads = {
      xss: ERROR_TEST_CONFIG.XSS_PAYLOADS,
      sql: ERROR_TEST_CONFIG.SQL_INJECTION_PAYLOADS,
      command: ERROR_TEST_CONFIG.COMMAND_INJECTION_PAYLOADS
    };
    
    const selectedPayloads = payloads[type];
    return selectedPayloads[Math.floor(Math.random() * selectedPayloads.length)];
  },
  
  randomEmail: () => {
    const domains = ['example.com', 'test.org', 'demo.net'];
    const username = Math.random().toString(36).substring(7);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  },
  
  randomPassword: (length: number = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
};

// Global test setup and teardown
export const setupErrorTests = () => {
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log
  };
  
  // Mock console methods to prevent noise in tests
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
  
  const cleanupRegistry = createCleanupRegistry();
  
  return {
    cleanup: () => {
      // Restore console methods
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.log = originalConsole.log;
      
      // Run registered cleanup functions
      cleanupRegistry.cleanup();
    },
    
    registerCleanup: cleanupRegistry.register
  };
};

// Error coverage tracking
export const createErrorCoverageTracker = () => {
  const coveredScenarios = new Set<string>();
  
  return {
    markCovered: (scenario: string) => {
      coveredScenarios.add(scenario);
    },
    
    getCoverage: () => {
      const totalScenarios = [
        ...Object.keys(ERROR_SCENARIOS.NETWORK),
        ...Object.keys(ERROR_SCENARIOS.HTTP),
        ...Object.keys(ERROR_SCENARIOS.DATABASE),
        ...Object.keys(ERROR_SCENARIOS.FILE_SYSTEM)
      ];
      
      return {
        covered: coveredScenarios.size,
        total: totalScenarios.length,
        percentage: (coveredScenarios.size / totalScenarios.length) * 100,
        missing: totalScenarios.filter(scenario => !coveredScenarios.has(scenario))
      };
    },
    
    reset: () => {
      coveredScenarios.clear();
    }
  };
};
