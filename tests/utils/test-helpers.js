"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHelpers = exports.randomHelpers = exports.fileHelpers = exports.performanceHelpers = exports.responseHelpers = exports.validationHelpers = exports.dbHelpers = exports.authHelpers = exports.mockHelpers = exports.timeHelpers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const test_config_1 = require("../setup/test-config");
/**
 * Test Helper Utilities for jaqEdu Platform
 * Provides common testing functions and utilities
 */
// Time utilities
exports.timeHelpers = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    waitFor: async (condition, timeout = 5000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition())
                return;
            await exports.timeHelpers.sleep(100);
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    },
    measureExecutionTime: async (fn) => {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        return { result, duration };
    }
};
// Mock utilities
exports.mockHelpers = {
    createMockRequest: (overrides = {}) => ({
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        ...overrides
    }),
    createMockResponse: () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis()
        };
        return res;
    },
    createMockNext: () => jest.fn(),
    mockConsoleError: () => {
        return jest.spyOn(console, 'error').mockImplementation(() => { });
    },
    mockConsoleWarn: () => {
        return jest.spyOn(console, 'warn').mockImplementation(() => { });
    }
};
// Authentication utilities
exports.authHelpers = {
    generateTestToken: (payload = { id: (0, uuid_1.v4)(), email: 'test@example.com' }) => {
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    },
    generateExpiredToken: (payload = { id: (0, uuid_1.v4)(), email: 'test@example.com' }) => {
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });
    },
    hashPassword: async (password) => {
        return bcrypt_1.default.hash(password, 10);
    },
    createAuthHeaders: (token) => ({
        Authorization: `Bearer ${token || exports.authHelpers.generateTestToken()}`
    })
};
// Database utilities
exports.dbHelpers = {
    generateUUID: () => (0, uuid_1.v4)(),
    cleanupTables: async (tableNames) => {
        // Implementation would depend on your database setup
        // This is a placeholder for the actual cleanup logic
        console.log(`Cleaning up tables: ${tableNames.join(', ')}`);
    },
    seedTestData: async (data) => {
        // Implementation would depend on your database setup
        console.log(`Seeding test data for tables: ${Object.keys(data).join(', ')}`);
    },
    truncateAllTables: async () => {
        // Implementation would depend on your database setup
        console.log('Truncating all test tables');
    }
};
// Validation utilities
exports.validationHelpers = {
    isValidUUID: (uuid) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    isValidPassword: (password) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },
    isValidPhoneNumber: (phone) => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
    }
};
// API response utilities
exports.responseHelpers = {
    expectSuccessResponse: (response, expectedData) => {
        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
        if (expectedData) {
            expect(response.data).toMatchObject(expectedData);
        }
    },
    expectErrorResponse: (response, expectedMessage, expectedCode) => {
        expect(response).toHaveProperty('success', false);
        expect(response).toHaveProperty('error');
        if (expectedMessage) {
            expect(response.error).toContain(expectedMessage);
        }
        if (expectedCode) {
            expect(response.status || response.statusCode).toBe(expectedCode);
        }
    },
    expectPaginatedResponse: (response) => {
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('pagination');
        expect(response.pagination).toHaveProperty('page');
        expect(response.pagination).toHaveProperty('limit');
        expect(response.pagination).toHaveProperty('total');
        expect(response.pagination).toHaveProperty('pages');
    }
};
// Performance testing utilities
exports.performanceHelpers = {
    expectFastResponse: (duration, maxDuration = test_config_1.testConfig.performance.maxResponseTime) => {
        expect(duration).toBeLessThan(maxDuration);
    },
    measureMemoryUsage: () => {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external
        };
    },
    expectMemoryWithinLimits: (initialMemory, finalMemory, maxIncrease = test_config_1.testConfig.performance.maxMemoryUsage) => {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(maxIncrease);
    }
};
// File utilities
exports.fileHelpers = {
    createTempFile: async (content, extension = 'txt') => {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const os = await Promise.resolve().then(() => __importStar(require('os')));
        const tempDir = os.tmpdir();
        const fileName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, content);
        return filePath;
    },
    cleanupTempFile: async (filePath) => {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            // File might not exist, ignore error
        }
    }
};
// Random data generators
exports.randomHelpers = {
    randomString: (length = 10) => {
        return Math.random().toString(36).substring(2, 2 + length);
    },
    randomEmail: () => {
        return `${exports.randomHelpers.randomString(8)}@${exports.randomHelpers.randomString(5)}.com`;
    },
    randomNumber: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    randomBoolean: () => {
        return Math.random() < 0.5;
    },
    randomDate: (startYear = 2020, endYear = 2024) => {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    },
    randomArrayElement: (array) => {
        return array[Math.floor(Math.random() * array.length)];
    }
};
// Error simulation utilities
exports.errorHelpers = {
    simulateNetworkError: () => new Error('Network Error: Connection failed'),
    simulateTimeoutError: () => new Error('Timeout Error: Request timed out'),
    simulateDatabaseError: () => new Error('Database Error: Connection lost'),
    simulateValidationError: (field) => new Error(`Validation Error: Invalid ${field}`),
    simulateAuthenticationError: () => new Error('Authentication Error: Invalid credentials'),
    simulateAuthorizationError: () => new Error('Authorization Error: Access denied')
};
exports.default = {
    timeHelpers: exports.timeHelpers,
    mockHelpers: exports.mockHelpers,
    authHelpers: exports.authHelpers,
    dbHelpers: exports.dbHelpers,
    validationHelpers: exports.validationHelpers,
    responseHelpers: exports.responseHelpers,
    performanceHelpers: exports.performanceHelpers,
    fileHelpers: exports.fileHelpers,
    randomHelpers: exports.randomHelpers,
    errorHelpers: exports.errorHelpers
};
//# sourceMappingURL=test-helpers.js.map