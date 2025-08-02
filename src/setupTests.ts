import '@testing-library/jest-dom';
import 'jest-localstorage-mock';
import * as React from 'react';
import { setupTestEnvironment } from './test-utils/testConfig';

// Setup test environment based on USE_REAL_API flag
setupTestEnvironment();

// Handle integration tests based on SKIP_INTEGRATION flag
if (process.env.SKIP_INTEGRATION === 'true') {
  const State = expect.getState();
  if (State && State.testPath) {
    const testPath = State.testPath;
    const isIntegrationTest = 
      testPath.includes('integrationValidator') ||
      testPath.includes('endToEndValidator') ||
      testPath.includes('/integration/') ||
      testPath.includes('integration.test') ||
      testPath.includes('e2e.test');
    
    if (isIntegrationTest) {
      // Log integration test skipping but don't globally disable tests
      beforeAll(() => {
        console.log(`⏭️  Skipping integration test: ${testPath}`);
        console.log('   Use "npm run test:integration" to run integration tests');
      });
      
      // Note: Individual tests should handle their own skipping based on environment
      // Removed global test.skip and it.skip assignment to prevent all tests from being disabled
    }
  }
}

// When running integration tests, ensure proper environment setup
if (process.env.SKIP_INTEGRATION !== 'true') {
  // When running integration tests, ensure proper environment setup
  const State = expect.getState();
  if (State && State.testPath) {
    const testPath = State.testPath;
    const isIntegrationTest = 
      testPath.includes('integrationValidator') ||
      testPath.includes('endToEndValidator') ||
      testPath.includes('/integration/') ||
      testPath.includes('integration.test') ||
      testPath.includes('e2e.test');
    
    if (isIntegrationTest) {
      beforeAll(() => {
        console.log(`🧪 Running integration test: ${testPath}`);
        // Ensure localStorage is cleared before each integration test suite
        localStorage.clear();
        sessionStorage.clear();
      });
      
      afterEach(() => {
        // Clean up after each integration test
        localStorage.clear();
        sessionStorage.clear();
        jest.clearAllMocks();
      });
    }
  }
}

// Mock console.log to suppress service initialization messages
const originalLog = console.log;
console.log = jest.fn((...args) => {
  // Suppress specific service initialization logs
  if (typeof args[0] === 'string' && 
      (args[0].includes('Using OpenAI provider') || 
       args[0].includes('YouTube Service:') ||
       args[0].includes('No API key found'))) {
    return;
  }
  originalLog.call(console, ...args);
});


// Test utilities will be imported directly in test files

// The localStorage and sessionStorage are already mocked by jest-localstorage-mock
// Just ensure we have the clear method available
beforeEach(() => {
  // Use the methods from jest-localstorage-mock
  if (typeof localStorage !== 'undefined' && localStorage.clear) {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined' && sessionStorage.clear) {
    sessionStorage.clear();
  }
  jest.clearAllMocks();
});

// Ensure timer functions are properly available in the test environment
// Use Node.js timer functions directly from the timers module
const timers = require('timers');

// Ensure global timer functions are available and properly bound
if (!global.setInterval || typeof global.setInterval !== 'function') {
  global.setInterval = timers.setInterval.bind(timers);
}
if (!global.clearInterval || typeof global.clearInterval !== 'function') {
  global.clearInterval = timers.clearInterval.bind(timers);
}
if (!global.setTimeout || typeof global.setTimeout !== 'function') {
  global.setTimeout = timers.setTimeout.bind(timers);
}
if (!global.clearTimeout || typeof global.clearTimeout !== 'function') {
  global.clearTimeout = timers.clearTimeout.bind(timers);
}

// Also ensure they are available on window object for browser-like environment
if (typeof window !== 'undefined') {
  window.setInterval = global.setInterval;
  window.clearInterval = global.clearInterval;
  window.setTimeout = global.setTimeout;
  window.clearTimeout = global.clearTimeout;
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

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

// Mock YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

window.YT = {
  Player: jest.fn(),
  PlayerState: {
    PLAYING: 1,
    PAUSED: 2,
    ENDED: 0,
  },
};

// Add polyfills for MSW v2 compatibility
if (typeof global.TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  const util = require('util');
  global.TextDecoder = util.TextDecoder;
}

// Add crypto polyfill for test environment
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: (array: Uint8Array) => {
      const bytes = crypto.randomBytes(array.length);
      array.set(bytes);
      return array;
    }
  } as any;
}

// Add btoa/atob polyfills for test environment
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Mock fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Suppress specific console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Failed prop type'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});