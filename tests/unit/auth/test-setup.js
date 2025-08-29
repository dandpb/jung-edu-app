/**
 * Test Setup for Authentication Unit Tests
 * Configures global mocks, utilities, and environment for auth tests
 */

import '@testing-library/jest-dom';
import 'jest-localstorage-mock';

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto.subtle for Web Crypto API
const mockSubtle = {
  importKey: jest.fn().mockResolvedValue({}),
  sign: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32))
};

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: jest.fn().mockImplementation(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

// Mock btoa/atob for base64 encoding
global.btoa = jest.fn().mockImplementation(str => Buffer.from(str).toString('base64'));
global.atob = jest.fn().mockImplementation(str => Buffer.from(str, 'base64').toString());

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Console spy setup for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Suppress expected console messages in tests
  console.error = jest.fn((message, ...args) => {
    // Allow certain expected errors to be logged
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
       message.includes('Error:') ||
       message.includes('Failed to'))
    ) {
      return;
    }
    originalError(message, ...args);
  });

  console.warn = jest.fn((message, ...args) => {
    // Suppress common warnings
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps') ||
       message.includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn(message, ...args);
  });
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  
  // Clean up localStorage after each test
  localStorage.clear();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitForAsync: (timeout = 100) => 
    new Promise(resolve => setTimeout(resolve, timeout)),
    
  // Helper to create mock events
  createMockEvent: (type, properties = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...properties
  }),
  
  // Helper to create mock users
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'student',
    permissions: [],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: false
      }
    },
    security: {
      twoFactorEnabled: false,
      passwordHistory: [],
      lastPasswordChange: new Date(),
      loginNotifications: true,
      trustedDevices: [],
      sessions: []
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isVerified: true,
    ...overrides
  }),

  // Helper to simulate localStorage errors
  simulateStorageError: (operation = 'setItem') => {
    const originalMethod = Storage.prototype[operation];
    Storage.prototype[operation] = jest.fn(() => {
      throw new Error('Storage operation failed');
    });
    return () => {
      Storage.prototype[operation] = originalMethod;
    };
  },

  // Helper to mock fetch responses
  mockFetch: (response, options = {}) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(response),
      text: jest.fn().mockResolvedValue(JSON.stringify(response)),
      ...options
    });
  },

  // Helper to assert error throwing
  expectToThrowAsync: async (asyncFn, expectedError) => {
    try {
      await asyncFn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError) {
        expect(error).toEqual(expect.objectContaining(expectedError));
      } else {
        expect(error).toBeDefined();
      }
    }
  }
};

// Enhanced matchers
expect.extend({
  toBeValidJWT(received) {
    const pass = typeof received === 'string' && received.split('.').length === 3;
    return {
      message: () => 
        pass 
          ? `expected ${received} not to be a valid JWT`
          : `expected ${received} to be a valid JWT`,
      pass,
    };
  },

  toHaveBeenCalledWithError(received, errorType) {
    const pass = received.mock.calls.some(call => 
      call.some(arg => arg instanceof Error && 
        (errorType ? arg.constructor.name === errorType : true))
    );
    return {
      message: () => 
        pass 
          ? `expected function not to have been called with ${errorType || 'an error'}`
          : `expected function to have been called with ${errorType || 'an error'}`,
      pass,
    };
  },

  toBeWithinTimeRange(received, expected, toleranceMs = 1000) {
    const receivedTime = new Date(received).getTime();
    const expectedTime = new Date(expected).getTime();
    const pass = Math.abs(receivedTime - expectedTime) <= toleranceMs;
    
    return {
      message: () =>
        pass
          ? `expected ${received} not to be within ${toleranceMs}ms of ${expected}`
          : `expected ${received} to be within ${toleranceMs}ms of ${expected}`,
      pass,
    };
  }
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Setup for React Testing Library
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
  // Increase timeout for async operations
  asyncUtilTimeout: 5000,
});

// Mock admin config
jest.mock('../../../src/config/admin', () => ({
  ADMIN_CONFIG: {
    security: {
      minPasswordLength: 8,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30
    },
    session: {
      timeoutMinutes: 30,
      maxConcurrentSessions: 3
    }
  }
}));