"use strict";
/**
 * Console Mocking Utilities
 * Provides clean test output by mocking console methods
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsoleMocks = exports.restoreConsole = exports.mockConsole = void 0;
let originalConsole = null;
const mockConsole = () => {
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
exports.mockConsole = mockConsole;
const restoreConsole = () => {
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
exports.restoreConsole = restoreConsole;
const getConsoleMocks = () => {
    return {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };
};
exports.getConsoleMocks = getConsoleMocks;
exports.default = {
    mockConsole: exports.mockConsole,
    restoreConsole: exports.restoreConsole,
    getConsoleMocks: exports.getConsoleMocks
};
//# sourceMappingURL=mock-console.js.map