import Redis from 'ioredis';
import { testConfig } from './test-config';

/**
 * Redis Test Setup and Management
 * Handles Redis connection and cleanup for tests
 */

let testRedisClient: Redis | null = null;
let isSetup = false;

export const setupRedisTest = async (): Promise<Redis> => {
  if (isSetup && testRedisClient) {
    return testRedisClient;
  }
  
  try {
    testRedisClient = new Redis({
      host: testConfig.redis.host,
      port: testConfig.redis.port,
      db: testConfig.redis.db,
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
    
  } catch (error) {
    console.error('❌ Failed to setup test Redis:', error);
    throw error;
  }
};

export const cleanupRedisTest = async (): Promise<void> => {
  if (testRedisClient) {
    await testRedisClient.flushdb();
    await testRedisClient.disconnect();
    testRedisClient = null;
    isSetup = false;
    console.log('✅ Test Redis connection closed');
  }
};

export const getTestRedis = (): Redis => {
  if (!testRedisClient) {
    throw new Error('Test Redis not initialized. Call setupRedisTest first.');
  }
  return testRedisClient;
};

export const flushTestRedis = async (): Promise<void> => {
  const redis = getTestRedis();
  await redis.flushdb();
};

export default {
  setupRedisTest,
  cleanupRedisTest,
  getTestRedis,
  flushTestRedis
};
