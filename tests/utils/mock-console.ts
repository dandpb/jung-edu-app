/**
 * Console Mocking Utilities
 * Provides clean test output by mocking console methods
 */

let originalConsole: {
  log: typeof console.log;
  error: typeof console.error;
  warn: typeof console.warn;
  info: typeof console.info;
  debug: typeof console.debug;
} | null = null;

export const mockConsole = (): void => {
  if (originalConsole) {
    return; // Already mocked
  }
  
  // Store original methods
  originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };
  
  // Mock console methods for cleaner test output
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
};

export const restoreConsole = (): void => {
  if (!originalConsole) {
    return; // Not mocked
  }
  
  // Restore original methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  
  originalConsole = null;
};

export const getConsoleMocks = () => {
  return {
    log: console.log as jest.MockedFunction<typeof console.log>,
    error: console.error as jest.MockedFunction<typeof console.error>,
    warn: console.warn as jest.MockedFunction<typeof console.warn>,
    info: console.info as jest.MockedFunction<typeof console.info>,
    debug: console.debug as jest.MockedFunction<typeof console.debug>
  };
};

export default {
  mockConsole,
  restoreConsole,
  getConsoleMocks
};
