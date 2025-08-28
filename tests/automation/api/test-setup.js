/**
 * Global Test Setup for API Automation Tests
 * Configures test environment, utilities, and global settings
 */

const axios = require('axios');

// Global test configuration
global.TEST_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api',
  WS_BASE_URL: process.env.WS_BASE_URL || 'ws://localhost:8080',
  TIMEOUT: parseInt(process.env.TEST_TIMEOUT) || 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Configure axios defaults
axios.defaults.timeout = global.TEST_CONFIG.TIMEOUT;
axios.defaults.validateStatus = () => true; // Don't throw on HTTP error statuses

// Global utilities
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.retry = async (fn, maxRetries = global.TEST_CONFIG.MAX_RETRIES) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await global.delay(global.TEST_CONFIG.RETRY_DELAY * (i + 1));
      }
    }
  }
  
  throw lastError;
};

// Custom matchers
expect.extend({
  toBeHttpStatus(received, expected) {
    const pass = Array.isArray(expected) 
      ? expected.includes(received)
      : received === expected;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be HTTP status ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be HTTP status ${expected}`,
        pass: false
      };
    }
  },
  
  toHaveValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false
      };
    }
  },
  
  toBeValidApiResponse(received) {
    const hasRequiredFields = 
      received && 
      typeof received === 'object' &&
      typeof received.success === 'boolean' &&
      typeof received.timestamp === 'string' &&
      typeof received.requestId === 'string';
    
    if (hasRequiredFields) {
      return {
        message: () => `expected object not to be a valid API response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected object to be a valid API response with success, timestamp, and requestId fields`,
        pass: false
      };
    }
  }
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Jest setup
beforeAll(async () => {
  console.log('🚀 Starting API Automation Tests');
  console.log(`📍 API Base URL: ${global.TEST_CONFIG.BASE_URL}`);
  console.log(`🔌 WebSocket URL: ${global.TEST_CONFIG.WS_BASE_URL}`);
  
  // Wait for API to be available
  console.log('⏳ Waiting for API to be ready...');
  
  let retries = 10;
  let apiReady = false;
  
  while (retries > 0 && !apiReady) {
    try {
      const response = await axios.get(`${global.TEST_CONFIG.BASE_URL}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        apiReady = true;
        console.log('✅ API is ready');
      }
    } catch (error) {
      console.log(`⏳ API not ready, retrying... (${retries} retries left)`);
      await global.delay(2000);
      retries--;
    }
  }
  
  if (!apiReady) {
    console.error('❌ API is not responding after multiple attempts');
    console.error('Please ensure the API server is running before executing tests');
    process.exit(1);
  }
});

afterAll(() => {
  console.log('🏁 API Automation Tests completed');
});

// Global test data cleanup tracking
global.TEST_CLEANUP = {
  workflows: [],
  executions: [],
  users: []
};

// Cleanup function
global.addToCleanup = (type, id) => {
  if (global.TEST_CLEANUP[type]) {
    global.TEST_CLEANUP[type].push(id);
  }
};

// Enhanced logging for CI/CD
if (process.env.CI) {
  console.log('🤖 Running in CI/CD environment');
  
  // Extend timeouts in CI
  jest.setTimeout(120000); // 2 minutes
  
  // Add CI-specific configuration
  global.TEST_CONFIG.TIMEOUT = 60000;
  global.TEST_CONFIG.MAX_RETRIES = 5;
}
