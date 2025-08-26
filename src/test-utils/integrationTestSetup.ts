/**
 * Integration Test Setup
 * Provides proper localStorage mocking for integration tests
 */

export function setupIntegrationTestEnvironment() {
  // Create a proper localStorage mock that persists data during tests
  const localStorageMock: Storage & { store: Record<string, string> } = {
    store: {} as Record<string, string>,
    getItem: jest.fn(function(this: typeof localStorageMock, key: string) {
      return this.store[key] || null;
    }),
    setItem: jest.fn(function(this: typeof localStorageMock, key: string, value: string) {
      this.store[key] = value;
    }),
    removeItem: jest.fn(function(this: typeof localStorageMock, key: string) {
      delete this.store[key];
    }),
    clear: jest.fn(function(this: typeof localStorageMock) {
      this.store = {};
    }),
    key: jest.fn(function(this: typeof localStorageMock, index: number) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(this.store).length;
    }
  };

  // Define the mock on global scope
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true
  });

  // Create sessionStorage mock as well
  const sessionStorageMock: Storage & { store: Record<string, string> } = {
    store: {} as Record<string, string>,
    getItem: jest.fn(function(this: typeof sessionStorageMock, key: string) {
      return this.store[key] || null;
    }),
    setItem: jest.fn(function(this: typeof sessionStorageMock, key: string, value: string) {
      this.store[key] = value;
    }),
    removeItem: jest.fn(function(this: typeof sessionStorageMock, key: string) {
      delete this.store[key];
    }),
    clear: jest.fn(function(this: typeof sessionStorageMock) {
      this.store = {};
    }),
    key: jest.fn(function(this: typeof sessionStorageMock, index: number) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(this.store).length;
    }
  };

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true
  });

  return { localStorageMock, sessionStorageMock };
}

export function clearIntegrationTestStorage() {
  if (global.localStorage && typeof global.localStorage.clear === 'function') {
    global.localStorage.clear();
  }
  if (global.sessionStorage && typeof global.sessionStorage.clear === 'function') {
    global.sessionStorage.clear();
  }
}