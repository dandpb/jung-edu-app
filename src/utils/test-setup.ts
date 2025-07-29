/**
 * Common test setup utilities and configurations
 * Import this file in tests that need standard setup
 */

import '@testing-library/jest-dom';
import { mockLocalStorage } from './test-utils';
import { createMockLocalStorageData } from './test-mocks';

// Mock console methods to reduce noise in tests
export const setupConsoleHandlers = () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn((...args) => {
      // Only log actual errors, not React warnings
      if (!args[0]?.includes?.('Warning:') && !args[0]?.includes?.('act()')) {
        originalError(...args);
      }
    });
    
    console.warn = jest.fn((...args) => {
      // Filter out specific warnings
      if (!args[0]?.includes?.('componentWillReceiveProps')) {
        originalWarn(...args);
      }
    });
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
};

// Setup localStorage with default data
export const setupLocalStorage = (initialData?: Record<string, any>) => {
  beforeEach(() => {
    // Clear and reset localStorage
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    
    // Set initial data if provided
    if (initialData) {
      const store: Record<string, string> = {};
      Object.entries(initialData).forEach(([key, value]) => {
        store[key] = typeof value === 'string' ? value : JSON.stringify(value);
      });
      mockLocalStorage.__setStore(store);
    }
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });
};

// Mock API handlers
export const setupMockAPI = () => {
  // Add any global API mocks here
  beforeEach(() => {
    // Reset fetch mocks if using MSW or similar
  });
};

// Common component mocks
export const setupComponentMocks = () => {
  // Mock React Router hooks
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({})
  }));

  // Mock window methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
};

// Test helpers for async operations
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument();
  }, { timeout: 5000 });
};

// Helper to test error boundaries
export const expectErrorBoundary = async (testFn: () => Promise<void> | void) => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  try {
    await testFn();
  } finally {
    spy.mockRestore();
  }
};

// Helper for testing localStorage updates
export const expectLocalStorageUpdate = (key: string, expectedValue: any) => {
  const calls = mockLocalStorage.setItem.mock.calls;
  const relevantCall = calls.find(call => call[0] === key);
  
  expect(relevantCall).toBeDefined();
  if (relevantCall) {
    const actualValue = JSON.parse(relevantCall[1]);
    expect(actualValue).toEqual(expectedValue);
  }
};

// Helper for testing navigation
export const expectNavigation = (mockNavigate: jest.Mock, expectedPath: string) => {
  expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
};

// Setup for integration tests
export const setupIntegrationTest = () => {
  setupConsoleHandlers();
  setupLocalStorage(createMockLocalStorageData());
  setupComponentMocks();
  setupMockAPI();
};

// Clean up after all tests
export const cleanupAfterAll = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  mockLocalStorage.clear();
};