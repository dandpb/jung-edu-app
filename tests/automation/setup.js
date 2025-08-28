"use strict";
/**
 * Jest Setup for Workflow Automation Tests
 * Configures London School TDD environment with comprehensive mocking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Extend Jest matchers for better assertions
expect.extend({
    toHaveBeenCalledBefore(received, expected) {
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
            message: () => pass
                ? `Expected ${received.getMockName()} NOT to have been called before ${expected.getMockName()}`
                : `Expected ${received.getMockName()} to have been called before ${expected.getMockName()}`,
            pass
        };
    },
    toHaveBeenCalledAfter(received, expected) {
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
            message: () => pass
                ? `Expected ${received.getMockName()} NOT to have been called after ${expected.getMockName()}`
                : `Expected ${received.getMockName()} to have been called after ${expected.getMockName()}`,
            pass
        };
    },
    toSatisfyContract(received, contract) {
        const pass = Object.keys(contract).every(key => {
            const contractValue = contract[key];
            const receivedValue = received[key];
            if (typeof contractValue === 'object' && contractValue !== null) {
                return this.utils.subsetEquality(receivedValue, contractValue);
            }
            return this.utils.equals(receivedValue, contractValue);
        });
        return {
            message: () => pass
                ? `Expected object NOT to satisfy contract`
                : `Expected object to satisfy contract: ${this.utils.printExpected(contract)}, received: ${this.utils.printReceived(received)}`,
            pass
        };
    }
});
// Global mock utilities for London School TDD
globalThis.createSwarmMock = (serviceName, methods) => {
    const mock = {
        ...methods,
        __serviceName: serviceName,
        __mockType: 'swarm'
    };
    // Track all calls for swarm coordination testing
    Object.keys(methods).forEach(methodName => {
        const originalMock = methods[methodName];
        methods[methodName] = globals_1.jest.fn((...args) => {
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
globalThis.extendSwarmMock = (baseMock, extensions) => {
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
    coordinate: globals_1.jest.fn(),
    synchronize: globals_1.jest.fn(),
    delegate: globals_1.jest.fn(),
    aggregate: globals_1.jest.fn()
});
// Contract testing utilities
globalThis.defineContract = (name, contract) => {
    globalThis.contractRegistry = globalThis.contractRegistry || new Map();
    globalThis.contractRegistry.set(name, contract);
    return contract;
};
globalThis.getContract = (name) => {
    return globalThis.contractRegistry?.get(name);
};
// Error simulation utilities for fault injection testing
globalThis.simulateError = (errorType, probability = 1.0) => {
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
globalThis.withTimeout = async (fn, timeout = 5000) => {
    return Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), timeout))
    ]);
};
// Mock state management for stateful testing
class MockStateManager {
    constructor() {
        this.state = new Map();
    }
    setState(key, value) {
        this.state.set(key, value);
    }
    getState(key) {
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
    globals_1.jest.clearAllTimers();
    globals_1.jest.clearAllMocks();
});
afterEach(() => {
    // Clean up any remaining timeouts or intervals
    globals_1.jest.runOnlyPendingTimers();
    globals_1.jest.useRealTimers();
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
console.log = globals_1.jest.fn();
console.warn = globals_1.jest.fn();
console.error = globals_1.jest.fn();
// Restore console methods for debugging when needed
globalThis.restoreConsole = () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
};
// Performance testing utilities
globalThis.measurePerformance = async (fn) => {
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
globalThis.mockTime = (timestamp) => {
    const mockDate = new Date(timestamp);
    globals_1.jest.useFakeTimers();
    globals_1.jest.setSystemTime(mockDate);
    return mockDate;
};
// Parallel testing utilities
globalThis.runInParallel = async (tasks) => {
    return Promise.all(tasks.map(task => task()));
};
// Contract validation utilities
globalThis.validateMockInteractions = (mock, expectedContract) => {
    const calls = mock.mock.calls;
    return expectedContract.every((expectedCall, index) => {
        const actualCall = calls[index];
        if (!actualCall)
            return false;
        return expectedCall.every((expectedArg, argIndex) => {
            const actualArg = actualCall[argIndex];
            if (typeof expectedArg === 'object' && expectedArg !== null) {
                return expect.objectContaining(expectedArg);
            }
            return actualArg === expectedArg;
        });
    });
};
// London School TDD specific utilities
globalThis.verifyCollaboratorInteractions = (collaborators) => {
    const interactions = Object.entries(collaborators).map(([name, mock]) => ({
        collaborator: name,
        callCount: mock.mock.calls.length,
        calls: mock.mock.calls
    }));
    return interactions;
};
// Test doubles factory for different test patterns
globalThis.TestDoubles = {
    createSpy: (implementation) => globals_1.jest.fn(implementation),
    createStub: (returnValue) => globals_1.jest.fn(() => returnValue),
    createMock: (methods) => {
        const mock = {};
        methods.forEach(method => {
            mock[method] = globals_1.jest.fn();
        });
        return mock;
    },
    createFake: (behavior) => behavior
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
//# sourceMappingURL=setup.js.map