/**
 * Console Mocking Utilities
 * Provides clean test output by mocking console methods
 */
export declare const mockConsole: () => void;
export declare const restoreConsole: () => void;
export declare const getConsoleMocks: () => {
    log: jest.MockedFunction<typeof console.log>;
    error: jest.MockedFunction<typeof console.error>;
    warn: jest.MockedFunction<typeof console.warn>;
    info: jest.MockedFunction<typeof console.info>;
    debug: jest.MockedFunction<typeof console.debug>;
};
declare const _default: {
    mockConsole: () => void;
    restoreConsole: () => void;
    getConsoleMocks: () => {
        log: jest.MockedFunction<typeof console.log>;
        error: jest.MockedFunction<typeof console.error>;
        warn: jest.MockedFunction<typeof console.warn>;
        info: jest.MockedFunction<typeof console.info>;
        debug: jest.MockedFunction<typeof console.debug>;
    };
};
export default _default;
//# sourceMappingURL=mock-console.d.ts.map