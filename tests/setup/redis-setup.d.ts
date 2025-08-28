import Redis from 'ioredis';
export declare const setupRedisTest: () => Promise<Redis>;
export declare const cleanupRedisTest: () => Promise<void>;
export declare const getTestRedis: () => Redis;
export declare const flushTestRedis: () => Promise<void>;
declare const _default: {
    setupRedisTest: () => Promise<Redis>;
    cleanupRedisTest: () => Promise<void>;
    getTestRedis: () => Redis;
    flushTestRedis: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=redis-setup.d.ts.map