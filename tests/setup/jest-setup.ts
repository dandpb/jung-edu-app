/**
 * Global Jest Setup - Fixed version
 */

// Define global jest for test files
global.jest = jest;

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for important messages
  error: console.error,
};

// Mock DOM APIs that aren't available in Node.js
global.localStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

global.sessionStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

// Add custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be a valid UUID`
        : `Expected ${received} to be a valid UUID`
    };
  },
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid email`
        : `Expected ${received} to be a valid email`
    };
  },

  toBeOneOf(received: any, validValues: any[]) {
    const pass = validValues.includes(received);
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be one of ${JSON.stringify(validValues)}`
        : `Expected ${received} to be one of ${JSON.stringify(validValues)}`
    };
  },

  toBeBoolean(received: any) {
    const pass = typeof received === 'boolean';
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a boolean`
        : `Expected ${received} to be a boolean`
    };
  }
});

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(30000);

// Export to make TypeScript happy
export {};

// Declare global types for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeOneOf(validValues: any[]): R;
      toBeBoolean(): R;
    }
  }
}