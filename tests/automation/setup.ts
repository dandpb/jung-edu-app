/**
 * Jest Setup for Workflow Automation Tests
 * Configures London School TDD environment with comprehensive mocking
 */

import { jest } from '@jest/globals';

// Extend Jest matchers for better assertions
expect.extend({
  toHaveBeenCalledBefore(received: jest.Mock, expected: jest.Mock) {
    const receivedCalls = received.mock.invocationCallOrder;
    const expectedCalls = expected.mock.invocationCallOrder;

    if (receivedCalls.length === 0) {
      return {
        message: () => `Expected ${received.getMockName()} to have been called before ${expected.getMockName()}, but it was never called`,
        pass: false
      };
    }

    if (expectedCalls.length === 0) {
      return {
        message: () => `Expected ${expected.getMockName()} to have been called after ${received.getMockName()}, but it was never called`,
        pass: false
      };
    }

    const receivedFirst = Math.min(...receivedCalls);
    const expectedFirst = Math.min(...expectedCalls);
    const pass = receivedFirst < expectedFirst;

    return {
      message: () => 
        pass 
          ? `Expected ${received.getMockName()} NOT to have been called before ${expected.getMockName()}`
          : `Expected ${received.getMockName()} to have been called before ${expected.getMockName()}`,
      pass
    };
  },

  toHaveBeenCalledAfter(received: jest.Mock, expected: jest.Mock) {
    const receivedCalls = received.mock.invocationCallOrder;
    const expectedCalls = expected.mock.invocationCallOrder;

    if (receivedCalls.length === 0) {
      return {
        message: () => `Expected ${received.getMockName()} to have been called after ${expected.getMockName()}, but it was never called`,
        pass: false
      };
    }

    if (expectedCalls.length === 0) {
      return {
        message: () => `Expected ${expected.getMockName()} to have been called before ${received.getMockName()}, but it was never called`,
        pass: false
      };
    }

    const receivedFirst = Math.min(...receivedCalls);
    const expectedLast = Math.max(...expectedCalls);
    const pass = receivedFirst > expectedLast;

    return {
      message: () => 
        pass 
          ? `Expected ${received.getMockName()} NOT to have been called after ${expected.getMockName()}`
          : `Expected ${received.getMockName()} to have been called after ${expected.getMockName()}`,
      pass
    };
  },

  toSatisfyContract(received: any, contract: any) {
    const pass = Object.keys(contract).every(key => {
      const contractValue = contract[key];
      const receivedValue = received[key];

      if (typeof contractValue === 'object' && contractValue !== null) {
        return this.utils.subsetEquality(receivedValue, contractValue);
      }

      return this.utils.equals(receivedValue, contractValue);
    });

    return {
      message: () => 
        pass 
          ? `Expected object NOT to satisfy contract`
          : `Expected object to satisfy contract: ${this.utils.printExpected(contract)}, received: ${this.utils.printReceived(received)}`,
      pass
    };
  }
});

// Global mock utilities for London School TDD
globalThis.createSwarmMock = (serviceName: string, methods: Record<string, jest.Mock>) => {
  const mock = {
    ...methods,
    __serviceName: serviceName,
    __mockType: 'swarm'
  };

  // Track all calls for swarm coordination testing
  Object.keys(methods).forEach(methodName => {
    const originalMock = methods[methodName];
    methods[methodName] = jest.fn((...args) => {
      // Record call for swarm interaction verification
      globalThis.swarmCallHistory = globalThis.swarmCallHistory || [];
      globalThis.swarmCallHistory.push({
        service: serviceName,
        method: methodName,
        args,
        timestamp: Date.now()
      });
      
      return originalMock(...args);
    });
  });

  return mock;
};

globalThis.extendSwarmMock = (baseMock: any, extensions: Record<string, jest.Mock>) => {
  return {
    ...baseMock,
    ...extensions
  };
};

globalThis.getAllMockCalls = () => {
  return globalThis.swarmCallHistory || [];
};

globalThis.clearSwarmCallHistory = () => {
  globalThis.swarmCallHistory = [];
};

// Mock coordination utilities
globalThis.createMockCoordinator = () => ({
  coordinate: jest.fn(),
  synchronize: jest.fn(),
  delegate: jest.fn(),
  aggregate: jest.fn()
});

// Contract testing utilities
globalThis.defineContract = (name: string, contract: any) => {
  globalThis.contractRegistry = globalThis.contractRegistry || new Map();
  globalThis.contractRegistry.set(name, contract);
  return contract;
};

globalThis.getContract = (name: string) => {
  return globalThis.contractRegistry?.get(name);
};

// Error simulation utilities for fault injection testing
globalThis.simulateError = (errorType: string, probability = 1.0) => {
  if (Math.random() < probability) {
    switch (errorType) {
      case 'network':
        throw new Error('Network connection failed');
      case 'timeout':
        throw new Error('Operation timed out');
      case 'validation':
        throw new Error('Validation failed');
      case 'system':
        throw new Error('System resource unavailable');
      default:
        throw new Error(`Simulated error: ${errorType}`);
    }
  }
};

// Test timing utilities
globalThis.withTimeout = async (fn: () => Promise<any>, timeout = 5000) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), timeout)
    )
  ]);
};

// Mock state management for stateful testing
class MockStateManager {
  private state = new Map<string, any>();

  setState(key: string, value: any) {
    this.state.set(key, value);
  }

  getState(key: string) {
    return this.state.get(key);
  }

  clearState() {
    this.state.clear();
  }

  getAllState() {
    return Object.fromEntries(this.state);
  }
}

globalThis.mockStateManager = new MockStateManager();

// Test lifecycle hooks
beforeEach(() => {
  // Clear all mock call histories
  globalThis.clearSwarmCallHistory();
  globalThis.mockStateManager.clearState();
  
  // Reset all jest timers
  jest.clearAllTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any remaining timeouts or intervals
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  
  // Clear any global test state
  globalThis.mockStateManager.clearState();
});

// Configure global test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Restore console methods for debugging when needed
globalThis.restoreConsole = () => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
};

// Performance testing utilities
globalThis.measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  return {
    result,
    executionTime: end - start,
    memoryUsage: process.memoryUsage()
  };
};

// Mock time utilities for deterministic testing
globalThis.mockTime = (timestamp: string | number | Date) => {
  const mockDate = new Date(timestamp);
  jest.useFakeTimers();
  jest.setSystemTime(mockDate);
  return mockDate;
};

// Parallel testing utilities
globalThis.runInParallel = async (tasks: (() => Promise<any>)[]) => {
  return Promise.all(tasks.map(task => task()));
};

// Contract validation utilities
globalThis.validateMockInteractions = (mock: jest.Mock, expectedContract: any) => {
  const calls = mock.mock.calls;
  
  return expectedContract.every((expectedCall: any, index: number) => {
    const actualCall = calls[index];
    if (!actualCall) return false;
    
    return expectedCall.every((expectedArg: any, argIndex: number) => {
      const actualArg = actualCall[argIndex];
      
      if (typeof expectedArg === 'object' && expectedArg !== null) {
        return expect.objectContaining(expectedArg);
      }
      
      return actualArg === expectedArg;
    });
  });
};

// London School TDD specific utilities
globalThis.verifyCollaboratorInteractions = (collaborators: Record<string, jest.Mock>) => {
  const interactions = Object.entries(collaborators).map(([name, mock]) => ({
    collaborator: name,
    callCount: mock.mock.calls.length,
    calls: mock.mock.calls
  }));
  
  return interactions;
};

// Test doubles factory for different test patterns
globalThis.TestDoubles = {
  createSpy: (implementation?: any) => jest.fn(implementation),
  createStub: (returnValue: any) => jest.fn(() => returnValue),
  createMock: (methods: string[]) => {
    const mock: any = {};
    methods.forEach(method => {
      mock[method] = jest.fn();
    });
    return mock;
  },
  createFake: (behavior: Record<string, any>) => behavior
};

// Global test configuration
globalThis.TEST_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  PARALLEL_EXECUTION: true,
  MOCK_INTERACTIONS: true,
  PERFORMANCE_MONITORING: true
};

console.log('🧪 Jest setup complete - London School TDD environment ready');

// Type declarations for global utilities
declare global {
  function createSwarmMock(serviceName: string, methods: Record<string, jest.Mock>): any;
  function extendSwarmMock(baseMock: any, extensions: Record<string, jest.Mock>): any;
  function getAllMockCalls(): any[];
  function clearSwarmCallHistory(): void;
  function createMockCoordinator(): any;
  function defineContract(name: string, contract: any): any;
  function getContract(name: string): any;
  function simulateError(errorType: string, probability?: number): never;
  function withTimeout<T>(fn: () => Promise<T>, timeout?: number): Promise<T>;
  function restoreConsole(): void;
  function measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number; memoryUsage: any }>;
  function mockTime(timestamp: string | number | Date): Date;
  function runInParallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]>;
  function validateMockInteractions(mock: jest.Mock, expectedContract: any): boolean;
  function verifyCollaboratorInteractions(collaborators: Record<string, jest.Mock>): any[];
  
  var mockStateManager: {
    setState(key: string, value: any): void;
    getState(key: string): any;
    clearState(): void;
    getAllState(): Record<string, any>;
  };
  
  var TestDoubles: {
    createSpy: (implementation?: any) => jest.Mock;
    createStub: (returnValue: any) => jest.Mock;
    createMock: (methods: string[]) => any;
    createFake: (behavior: Record<string, any>) => any;
  };
  
  var TEST_CONFIG: {
    TIMEOUT: number;
    RETRY_ATTEMPTS: number;
    PARALLEL_EXECUTION: boolean;
    MOCK_INTERACTIONS: boolean;
    PERFORMANCE_MONITORING: boolean;
  };
  
  var swarmCallHistory: any[];
  var contractRegistry: Map<string, any>;

  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledBefore(expected: jest.Mock): R;
      toHaveBeenCalledAfter(expected: jest.Mock): R;
      toSatisfyContract(contract: any): R;
    }
  }
}