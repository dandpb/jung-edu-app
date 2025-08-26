/**
 * Jest setup for unit tests
 * Configures global mocks and test utilities
 */

// Global console mocks
global.mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock Node.js globals for browser environment tests
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    argv: [],
    exit: jest.fn(),
    cwd: jest.fn(() => '/mock/cwd')
  };
}

// Mock localStorage for Node environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
}

// Mock window for Node environment
if (typeof global.window === 'undefined') {
  global.window = {
    localStorage: global.localStorage
  };
}

// Common test utilities
global.createMockFunction = (returnValue = undefined) => {
  return jest.fn(() => returnValue);
};

global.createAsyncMockFunction = (returnValue = undefined) => {
  return jest.fn(() => Promise.resolve(returnValue));
};

global.createRejectedMockFunction = (error = new Error('Mock error')) => {
  return jest.fn(() => Promise.reject(error));
};

// Mock file system operations
global.mockFileSystem = {
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  rmSync: jest.fn()
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  
  // Reset console mocks
  if (global.mockConsole) {
    Object.values(global.mockConsole).forEach(mock => mock.mockClear());
  }
  
  // Reset process mocks
  if (global.process && global.process.exit && global.process.exit.mockClear) {
    global.process.exit.mockClear();
  }
  
  // Clear module cache for files that need fresh imports
  Object.keys(require.cache).forEach(key => {
    if (key.includes('test-prompts-availability') || 
        key.includes('github-safe') || 
        key.includes('promptTestService')) {
      delete require.cache[key];
    }
  });
});