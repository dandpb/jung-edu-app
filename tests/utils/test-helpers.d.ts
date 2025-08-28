import { Request, Response, NextFunction } from 'express';
/**
 * Test Helper Utilities for jaqEdu Platform
 * Provides common testing functions and utilities
 */
export declare const timeHelpers: {
    sleep: (ms: number) => Promise<void>;
    waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<void>;
    measureExecutionTime: <T>(fn: () => Promise<T>) => Promise<{
        result: T;
        duration: number;
    }>;
};
export declare const mockHelpers: {
    createMockRequest: (overrides?: Partial<Request>) => Partial<Request>;
    createMockResponse: () => Partial<Response>;
    createMockNext: () => NextFunction;
    mockConsoleError: () => jest.SpyInstance;
    mockConsoleWarn: () => jest.SpyInstance;
};
export declare const authHelpers: {
    generateTestToken: (payload?: object) => string;
    generateExpiredToken: (payload?: object) => string;
    hashPassword: (password: string) => Promise<string>;
    createAuthHeaders: (token?: string) => {
        Authorization: string;
    };
};
export declare const dbHelpers: {
    generateUUID: () => string;
    cleanupTables: (tableNames: string[]) => Promise<void>;
    seedTestData: (data: Record<string, any[]>) => Promise<void>;
    truncateAllTables: () => Promise<void>;
};
export declare const validationHelpers: {
    isValidUUID: (uuid: string) => boolean;
    isValidEmail: (email: string) => boolean;
    isValidPassword: (password: string) => boolean;
    isValidPhoneNumber: (phone: string) => boolean;
};
export declare const responseHelpers: {
    expectSuccessResponse: (response: any, expectedData?: any) => void;
    expectErrorResponse: (response: any, expectedMessage?: string, expectedCode?: number) => void;
    expectPaginatedResponse: (response: any) => void;
};
export declare const performanceHelpers: {
    expectFastResponse: (duration: number, maxDuration?: number) => void;
    measureMemoryUsage: () => {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    expectMemoryWithinLimits: (initialMemory: number, finalMemory: number, maxIncrease?: number) => void;
};
export declare const fileHelpers: {
    createTempFile: (content: string, extension?: string) => Promise<string>;
    cleanupTempFile: (filePath: string) => Promise<void>;
};
export declare const randomHelpers: {
    randomString: (length?: number) => string;
    randomEmail: () => string;
    randomNumber: (min?: number, max?: number) => number;
    randomBoolean: () => boolean;
    randomDate: (startYear?: number, endYear?: number) => Date;
    randomArrayElement: <T>(array: T[]) => T;
};
export declare const errorHelpers: {
    simulateNetworkError: () => Error;
    simulateTimeoutError: () => Error;
    simulateDatabaseError: () => Error;
    simulateValidationError: (field: string) => Error;
    simulateAuthenticationError: () => Error;
    simulateAuthorizationError: () => Error;
};
declare const _default: {
    timeHelpers: {
        sleep: (ms: number) => Promise<void>;
        waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<void>;
        measureExecutionTime: <T>(fn: () => Promise<T>) => Promise<{
            result: T;
            duration: number;
        }>;
    };
    mockHelpers: {
        createMockRequest: (overrides?: Partial<Request>) => Partial<Request>;
        createMockResponse: () => Partial<Response>;
        createMockNext: () => NextFunction;
        mockConsoleError: () => jest.SpyInstance;
        mockConsoleWarn: () => jest.SpyInstance;
    };
    authHelpers: {
        generateTestToken: (payload?: object) => string;
        generateExpiredToken: (payload?: object) => string;
        hashPassword: (password: string) => Promise<string>;
        createAuthHeaders: (token?: string) => {
            Authorization: string;
        };
    };
    dbHelpers: {
        generateUUID: () => string;
        cleanupTables: (tableNames: string[]) => Promise<void>;
        seedTestData: (data: Record<string, any[]>) => Promise<void>;
        truncateAllTables: () => Promise<void>;
    };
    validationHelpers: {
        isValidUUID: (uuid: string) => boolean;
        isValidEmail: (email: string) => boolean;
        isValidPassword: (password: string) => boolean;
        isValidPhoneNumber: (phone: string) => boolean;
    };
    responseHelpers: {
        expectSuccessResponse: (response: any, expectedData?: any) => void;
        expectErrorResponse: (response: any, expectedMessage?: string, expectedCode?: number) => void;
        expectPaginatedResponse: (response: any) => void;
    };
    performanceHelpers: {
        expectFastResponse: (duration: number, maxDuration?: number) => void;
        measureMemoryUsage: () => {
            heapUsed: number;
            heapTotal: number;
            external: number;
        };
        expectMemoryWithinLimits: (initialMemory: number, finalMemory: number, maxIncrease?: number) => void;
    };
    fileHelpers: {
        createTempFile: (content: string, extension?: string) => Promise<string>;
        cleanupTempFile: (filePath: string) => Promise<void>;
    };
    randomHelpers: {
        randomString: (length?: number) => string;
        randomEmail: () => string;
        randomNumber: (min?: number, max?: number) => number;
        randomBoolean: () => boolean;
        randomDate: (startYear?: number, endYear?: number) => Date;
        randomArrayElement: <T>(array: T[]) => T;
    };
    errorHelpers: {
        simulateNetworkError: () => Error;
        simulateTimeoutError: () => Error;
        simulateDatabaseError: () => Error;
        simulateValidationError: (field: string) => Error;
        simulateAuthenticationError: () => Error;
        simulateAuthorizationError: () => Error;
    };
};
export default _default;
//# sourceMappingURL=test-helpers.d.ts.map