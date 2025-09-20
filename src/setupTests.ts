import '@testing-library/jest-dom';
import 'jest-extended';
import 'jest-localstorage-mock';
import * as React from 'react';
import { setupTestEnvironment } from './test-utils/testConfig';

// Add crypto.subtle mock for JWT tests
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    subtle: {
      sign: jest.fn().mockImplementation(async (algorithm: any, key: any, data: ArrayBuffer) => {
        // Return proper ArrayBuffer for JWT signing
        const signature = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
          signature[i] = Math.floor(Math.random() * 256);
        }
        return signature.buffer;
      }),
      verify: jest.fn().mockResolvedValue(true),
      importKey: jest.fn().mockImplementation(async (format, keyData, algorithm, extractable, keyUsages) => {
        return { type: 'secret', algorithm, extractable, usages: keyUsages };
      }),
      generateKey: jest.fn().mockImplementation(async (algorithm, extractable, keyUsages) => {
        return { type: 'secret', algorithm, extractable, usages: keyUsages };
      }),
      digest: jest.fn().mockImplementation(async (algorithm, data) => {
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = Math.floor(Math.random() * 256);
        }
        return hash.buffer;
      })
    },
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}

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
    }
  }
}

// When running integration tests, ensure proper environment setup
if (process.env.SKIP_INTEGRATION !== 'true') {
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
        if (!process.env.CI) {
          console.log(`🧪 Running integration test: ${testPath}`);
        }
        // Fast cleanup for integration tests
        try {
          if (typeof localStorage !== 'undefined' && localStorage !== null && typeof localStorage.clear === 'function') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined' && sessionStorage !== null && typeof sessionStorage.clear === 'function') {
            sessionStorage.clear();
          }
        } catch (e) {
          // Storage might be disabled or mocked
        }
      });

      afterEach(() => {
        // Fast cleanup after each integration test
        jest.clearAllMocks();
        jest.clearAllTimers();
        try {
          if (typeof localStorage !== 'undefined' && localStorage !== null && typeof localStorage.clear === 'function') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined' && sessionStorage !== null && typeof sessionStorage.clear === 'function') {
            sessionStorage.clear();
          }
        } catch (e) {
          // Storage might be disabled or mocked
        }
      });
    }
  }
}

// Optimized console output for tests
const originalLog = console.log;
const suppressedPatterns = [
  'Using OpenAI provider',
  'YouTube Service:',
  'No API key found',
  '=== Bibliography',
  '=== Reading Paths',
  '=== Film References',
  '=== Alchemy References',
  '=== Contemporary Research',
  '=== Prerequisites',
  'No references found',
  'No reading paths found',
  'No contemporary',
  'URL:',
  'Matter of Heart',
  'Psychology and Alchemy',
  'Processing batch of',
  'Cache hit for query:',
  'Cache miss for query:'
];

console.log = jest.fn((...args) => {
  // In CI mode, suppress all console output except errors
  if (process.env.CI && !args[0]?.includes('🧪') && !args[0]?.includes('⏭️')) {
    return;
  }

  // Suppress specific service initialization logs
  if (typeof args[0] === 'string' && suppressedPatterns.some(pattern => args[0].includes(pattern))) {
    return;
  }

  originalLog.call(console, ...args);
});


// Test utilities will be imported directly in test files

// The localStorage and sessionStorage are already mocked by jest-localstorage-mock
// Just ensure we have the clear method available
beforeEach(() => {
  // Fast cleanup for all tests
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Clear storage safely and efficiently
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage !== null && typeof sessionStorage.clear === 'function') {
      sessionStorage.clear();
    }
  } catch (e) {
    // Storage might be disabled or mocked without clear method
  }

  // Reset fetch mocks efficiently
  if (global.fetch && typeof global.fetch === 'function' && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Optimized cleanup after each test
  jest.clearAllMocks();
  jest.runOnlyPendingTimers();

  // Fast storage cleanup
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage !== null && typeof sessionStorage.clear === 'function') {
      sessionStorage.clear();
    }
  } catch (e) {
    // Storage might be disabled or mocked without clear method
  }

  // Reset fetch mocks
  if (global.fetch && typeof global.fetch === 'function' && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
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
    },
    subtle: {
      async importKey(format: string, keyData: ArrayBuffer, algorithm: any, extractable: boolean, keyUsages: string[]) {
        // Mock implementation for PBKDF2
        return { algorithm: 'PBKDF2', extractable, type: 'secret', usages: keyUsages };
      },
      async deriveBits(algorithm: any, baseKey: any, length: number) {
        // Mock PBKDF2 key derivation - return deterministic bytes for testing
        const iterations = algorithm.iterations || 100000;
        const salt = new Uint8Array(algorithm.salt);
        const keyLength = length / 8;
        
        // Use Node.js crypto for actual PBKDF2 in test environment
        const derived = crypto.pbkdf2Sync('test-password', salt, iterations, keyLength, algorithm.hash.toLowerCase().replace('-', ''));
        return derived.buffer.slice(0, keyLength);
      },
      async digest(algorithm: string, data: ArrayBuffer) {
        const hashName = algorithm.toLowerCase().replace('-', '');
        const buffer = Buffer.from(data);
        const hash = crypto.createHash(hashName).update(buffer).digest();
        return hash.buffer;
      },
      async encrypt(algorithm: any, key: any, data: ArrayBuffer) {
        // Mock encryption for testing
        return new ArrayBuffer(data.byteLength + 16); // Mock encrypted data with IV
      },
      async decrypt(algorithm: any, key: any, data: ArrayBuffer) {
        // Mock decryption for testing
        return new ArrayBuffer(Math.max(0, data.byteLength - 16)); // Mock decrypted data
      },
      async sign(algorithm: any, key: any, data: ArrayBuffer) {
        // Mock signing for JWT operations - return proper ArrayBuffer
        const buffer = Buffer.from(data);
        const hash = crypto.createHash('sha256').update(buffer).digest();
        // Convert Buffer to ArrayBuffer properly
        const arrayBuffer = new ArrayBuffer(hash.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        uint8Array.set(hash);
        return arrayBuffer;
      },
      async verify(algorithm: any, key: any, signature: ArrayBuffer, data: ArrayBuffer) {
        // Mock verification for JWT operations
        return true; // Always return true for testing
      },
      async generateKey(algorithm: any, extractable: boolean, keyUsages: string[]) {
        // Mock key generation
        return { algorithm, extractable, type: 'secret', usages: keyUsages };
      }
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
  // Restore console functions safely
  if (originalError && typeof originalError === 'function') {
    try {
      console.error = originalError;
    } catch (e) {
      // If console.error is read-only, try using Object.defineProperty
      Object.defineProperty(console, 'error', {
        value: originalError,
        writable: true,
        configurable: true
      });
    }
  }
  if (originalWarn && typeof originalWarn === 'function') {
    try {
      console.warn = originalWarn;
    } catch (e) {
      // If console.warn is read-only, try using Object.defineProperty
      Object.defineProperty(console, 'warn', {
        value: originalWarn,
        writable: true,
        configurable: true
      });
    }
  }
});