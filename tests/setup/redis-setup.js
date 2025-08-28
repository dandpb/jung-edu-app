"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushTestRedis = exports.getTestRedis = exports.cleanupRedisTest = exports.setupRedisTest = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const test_config_1 = require("./test-config");
/**
 * Redis Test Setup and Management
 * Handles Redis connection and cleanup for tests
 */
let testRedisClient = null;
let isSetup = false;
const setupRedisTest = async () => {
    if (isSetup && testRedisClient) {
        return testRedisClient;
    }
    try {
        testRedisClient = new ioredis_1.default({
            host: test_config_1.testConfig.redis.host,
            port: test_config_1.testConfig.redis.port,
            db: test_config_1.testConfig.redis.db,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 1,
            lazyConnect: true
        });
        await testRedisClient.connect();
        // Test connection
        await testRedisClient.ping();
        // Clear test database
        await testRedisClient.flushdb();
        console.log('✅ Test Redis connection established');
        isSetup = true;
        return testRedisClient;
    }
    catch (error) {
        console.error('❌ Failed to setup test Redis:', error);
        throw error;
    }
};
exports.setupRedisTest = setupRedisTest;
const cleanupRedisTest = async () => {
    if (testRedisClient) {
        await testRedisClient.flushdb();
        await testRedisClient.disconnect();
        testRedisClient = null;
        isSetup = false;
        console.log('✅ Test Redis connection closed');
    }
};
exports.cleanupRedisTest = cleanupRedisTest;
const getTestRedis = () => {
    if (!testRedisClient) {
        throw new Error('Test Redis not initialized. Call setupRedisTest first.');
    }
    return testRedisClient;
};
exports.getTestRedis = getTestRedis;
const flushTestRedis = async () => {
    const redis = (0, exports.getTestRedis)();
    await redis.flushdb();
};
exports.flushTestRedis = flushTestRedis;
exports.default = {
    setupRedisTest: exports.setupRedisTest,
    cleanupRedisTest: exports.cleanupRedisTest,
    getTestRedis: exports.getTestRedis,
    flushTestRedis: exports.flushTestRedis
};
//# sourceMappingURL=redis-setup.js.map