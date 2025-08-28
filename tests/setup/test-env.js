"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load test environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env.test') });
// Set Node environment
process.env.NODE_ENV = 'test';
// Increase timeout for async operations
process.env.JEST_TIMEOUT = '10000';
// Configure test database
if (!process.env.TEST_DB_NAME) {
    process.env.TEST_DB_NAME = 'jaqedu_test';
}
if (!process.env.TEST_DB_HOST) {
    process.env.TEST_DB_HOST = 'localhost';
}
if (!process.env.TEST_DB_PORT) {
    process.env.TEST_DB_PORT = '5433';
}
// Configure Redis for tests
if (!process.env.TEST_REDIS_HOST) {
    process.env.TEST_REDIS_HOST = 'localhost';
}
if (!process.env.TEST_REDIS_PORT) {
    process.env.TEST_REDIS_PORT = '6380';
}
if (!process.env.TEST_REDIS_DB) {
    process.env.TEST_REDIS_DB = '1';
}
// Set JWT secrets for testing
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens-only-for-testing';
}
if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
}
// Disable external services in tests
process.env.USE_MOCK_SERVICES = 'true';
process.env.MOCK_PAYMENT_GATEWAY = 'true';
process.env.MOCK_EMAIL_SERVICE = 'true';
process.env.MOCK_FILE_STORAGE = 'true';
// Disable analytics and monitoring
process.env.ENABLE_ANALYTICS = 'false';
process.env.ENABLE_MONITORING = 'false';
// Set log level to reduce noise
process.env.LOG_LEVEL = 'error';
// Enable test coverage
process.env.ENABLE_TEST_COVERAGE = 'true';
// Set API URLs for testing
if (!process.env.TEST_API_URL) {
    process.env.TEST_API_URL = 'http://localhost:3001';
}
if (!process.env.TEST_WS_URL) {
    process.env.TEST_WS_URL = 'ws://localhost:3001';
}
// Performance testing thresholds
if (!process.env.PERF_MAX_RESPONSE_TIME) {
    process.env.PERF_MAX_RESPONSE_TIME = '500';
}
if (!process.env.PERF_MAX_MEMORY_USAGE) {
    process.env.PERF_MAX_MEMORY_USAGE = '104857600'; // 100MB
}
// Suppress console output during tests
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
    console.log = () => { };
    console.info = () => { };
    console.warn = () => { };
}
// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit process in tests
});
// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit process in tests
});
// Set timezone for consistent date testing
process.env.TZ = 'UTC';
console.log('✅ Test environment configured');
//# sourceMappingURL=test-env.js.map