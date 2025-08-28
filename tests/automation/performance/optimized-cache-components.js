"use strict";
/**
 * Optimized Cache Test Components for jaqEdu Platform
 * Implements performance optimizations identified in bottleneck analysis
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentCacheWarmer = exports.SharedCacheWorkerPool = exports.PreGeneratedCacheDataSets = void 0;
exports.initializeCacheOptimizations = initializeCacheOptimizations;
exports.cleanupCacheOptimizations = cleanupCacheOptimizations;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const os = __importStar(require("os"));
// ============================================================================
// Pre-Generated Test Data Management
// ============================================================================
class PreGeneratedCacheDataSets {
    constructor() {
        this.dataSets = new Map();
        this.isInitialized = false;
    }
    static getInstance() {
        if (!PreGeneratedCacheDataSets.instance) {
            PreGeneratedCacheDataSets.instance = new PreGeneratedCacheDataSets();
        }
        return PreGeneratedCacheDataSets.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        console.log('🔄 Pre-generating cache test data sets...');
        const startTime = perf_hooks_1.performance.now();
        // Generate different data patterns in parallel
        const patterns = [
            { name: 'sequential', size: 10000 },
            { name: 'random', size: 10000 },
            { name: 'hotspot', size: 5000 }, // 80/20 access pattern
            { name: 'zipfian', size: 8000 }, // Zipfian distribution
            { name: 'temporal', size: 6000 } // Time-based patterns
        ];
        const generationTasks = patterns.map(pattern => this.generateDataSetAsync(pattern.name, pattern.size));
        await Promise.all(generationTasks);
        const initTime = perf_hooks_1.performance.now() - startTime;
        console.log(`✅ Data sets pre-generated in ${initTime.toFixed(2)}ms`);
        this.isInitialized = true;
    }
    async generateDataSetAsync(pattern, size) {
        const dataSet = await this.generateDataSet(pattern, size);
        this.dataSets.set(pattern, dataSet);
    }
    async generateDataSet(pattern, size) {
        const dataSet = {
            pattern,
            items: [],
            metadata: {
                size,
                generatedAt: Date.now(),
                distribution: pattern,
                averageKeySize: 0,
                averageValueSize: 0
            }
        };
        switch (pattern) {
            case 'sequential':
                dataSet.items = this.generateSequentialData(size);
                break;
            case 'random':
                dataSet.items = this.generateRandomData(size);
                break;
            case 'hotspot':
                dataSet.items = this.generateHotspotData(size);
                break;
            case 'zipfian':
                dataSet.items = this.generateZipfianData(size);
                break;
            case 'temporal':
                dataSet.items = this.generateTemporalData(size);
                break;
        }
        // Calculate metadata
        dataSet.metadata.averageKeySize = dataSet.items.reduce((sum, item) => sum + item.key.length, 0) / size;
        dataSet.metadata.averageValueSize = dataSet.items.reduce((sum, item) => sum + JSON.stringify(item.value).length, 0) / size;
        return dataSet;
    }
    generateSequentialData(size) {
        return Array.from({ length: size }, (_, i) => ({
            key: `seq_key_${i.toString().padStart(8, '0')}`,
            value: {
                id: i,
                data: `sequential_data_${i}`,
                timestamp: Date.now() + i,
                metadata: { type: 'sequential', index: i }
            },
            accessWeight: 1,
            ttl: 300000 // 5 minutes
        }));
    }
    generateRandomData(size) {
        return Array.from({ length: size }, (_, i) => ({
            key: `rnd_key_${Math.random().toString(36).substr(2, 12)}`,
            value: {
                id: Math.random() * 1000000,
                data: this.generateRandomString(100 + Math.floor(Math.random() * 500)),
                timestamp: Date.now() + Math.random() * 86400000,
                metadata: { type: 'random', entropy: Math.random() }
            },
            accessWeight: Math.random(),
            ttl: 60000 + Math.random() * 240000 // 1-5 minutes
        }));
    }
    generateHotspotData(size) {
        const hotspotSize = Math.floor(size * 0.2); // 20% hot data
        const items = [];
        // Hot data (80% of access)
        for (let i = 0; i < hotspotSize; i++) {
            items.push({
                key: `hot_key_${i}`,
                value: {
                    id: i,
                    data: `hot_data_${i}`,
                    timestamp: Date.now(),
                    metadata: { type: 'hot', popularity: 0.8 + Math.random() * 0.2 }
                },
                accessWeight: 4.0, // 4x more likely to be accessed
                ttl: 600000 // 10 minutes (longer TTL for hot data)
            });
        }
        // Cold data (20% of access)
        for (let i = hotspotSize; i < size; i++) {
            items.push({
                key: `cold_key_${i}`,
                value: {
                    id: i,
                    data: `cold_data_${i}`,
                    timestamp: Date.now(),
                    metadata: { type: 'cold', popularity: Math.random() * 0.2 }
                },
                accessWeight: 0.25, // 4x less likely to be accessed
                ttl: 120000 // 2 minutes
            });
        }
        return items;
    }
    generateZipfianData(size) {
        // Zipfian distribution: popularity ~ 1/rank^s (s ≈ 1)
        const items = [];
        const s = 1.0; // Zipfian parameter
        for (let i = 1; i <= size; i++) {
            const popularity = 1 / Math.pow(i, s);
            items.push({
                key: `zipf_key_${i}`,
                value: {
                    id: i,
                    rank: i,
                    data: `zipfian_data_${i}`,
                    timestamp: Date.now(),
                    metadata: { type: 'zipfian', rank: i, popularity }
                },
                accessWeight: popularity * 1000, // Scale for practical use
                ttl: Math.max(60000, 600000 / i) // Higher rank = longer TTL
            });
        }
        return items;
    }
    generateTemporalData(size) {
        const now = Date.now();
        const timeWindow = 86400000; // 24 hours
        return Array.from({ length: size }, (_, i) => {
            const timeOffset = (i / size) * timeWindow;
            const accessTime = now + timeOffset;
            return {
                key: `temp_key_${i}_${accessTime}`,
                value: {
                    id: i,
                    validFrom: accessTime,
                    validUntil: accessTime + (300000 + Math.random() * 600000), // 5-15 minutes
                    data: `temporal_data_${i}`,
                    timestamp: accessTime,
                    metadata: { type: 'temporal', timeWindow: Math.floor(timeOffset / 3600000) }
                },
                accessWeight: Math.max(0.1, 1 - (timeOffset / timeWindow)), // Decay over time
                ttl: Math.max(60000, 900000 - timeOffset / 1000) // Decreasing TTL
            };
        });
    }
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    }
    getDataSet(pattern, requestedSize) {
        const dataSet = this.dataSets.get(pattern);
        if (!dataSet)
            return null;
        if (!requestedSize || requestedSize >= dataSet.items.length) {
            return dataSet;
        }
        // Return subset of requested size
        return {
            ...dataSet,
            items: dataSet.items.slice(0, requestedSize),
            metadata: {
                ...dataSet.metadata,
                size: requestedSize
            }
        };
    }
    getAllPatterns() {
        return Array.from(this.dataSets.keys());
    }
    getDataSetInfo(pattern) {
        const dataSet = this.dataSets.get(pattern);
        return dataSet ? {
            pattern,
            size: dataSet.items.length,
            averageKeySize: dataSet.metadata.averageKeySize,
            averageValueSize: dataSet.metadata.averageValueSize,
            generatedAt: dataSet.metadata.generatedAt
        } : null;
    }
}
exports.PreGeneratedCacheDataSets = PreGeneratedCacheDataSets;
// ============================================================================
// Shared Cache Worker Pool
// ============================================================================
class SharedCacheWorkerPool extends events_1.EventEmitter {
    constructor() {
        super();
        this.workerPool = [];
        this.taskQueue = [];
        this.activeWorkers = new Map();
        this.workerStats = new Map();
        this.maxWorkers = Math.min(os.cpus().length, 6); // Max 6 workers for cache operations
        this.initializeWorkerPool();
    }
    static getInstance() {
        if (!SharedCacheWorkerPool.instance) {
            SharedCacheWorkerPool.instance = new SharedCacheWorkerPool();
        }
        return SharedCacheWorkerPool.instance;
    }
    async initializeWorkerPool() {
        console.log(`🔧 Initializing cache worker pool with ${this.maxWorkers} workers...`);
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = await this.createCacheWorker(i);
                this.workerPool.push(worker);
                this.workerStats.set(worker.id, {
                    tasksCompleted: 0,
                    averageExecutionTime: 0,
                    errorCount: 0,
                    totalExecutionTime: 0,
                    isActive: false
                });
            }
            catch (error) {
                console.error(`❌ Failed to create cache worker ${i}:`, error);
            }
        }
        console.log(`✅ Cache worker pool initialized with ${this.workerPool.length} workers`);
    }
    async createCacheWorker(index) {
        const workerId = `cache-worker-${index}`;
        // In a real implementation, this would create an actual worker thread
        // For this example, we'll create a mock worker
        const worker = {
            id: workerId,
            threadId: index,
            isActive: false,
            execute: async (task) => {
                return this.executeCacheTask(task);
            },
            terminate: async () => {
                console.log(`🛑 Terminating worker ${workerId}`);
            }
        };
        return worker;
    }
    async executeTask(task) {
        const startTime = perf_hooks_1.performance.now();
        // Try to get available worker
        const worker = await this.acquireWorker();
        try {
            // Mark worker as active
            worker.isActive = true;
            this.activeWorkers.set(task.id, worker);
            // Execute task
            const result = await worker.execute(task);
            // Update statistics
            const executionTime = perf_hooks_1.performance.now() - startTime;
            this.updateWorkerStats(worker.id, executionTime, result.success);
            return result;
        }
        finally {
            // Release worker
            worker.isActive = false;
            this.activeWorkers.delete(task.id);
            this.releaseWorker(worker);
        }
    }
    async acquireWorker() {
        // Find available worker
        const availableWorker = this.workerPool.find(w => !w.isActive);
        if (availableWorker) {
            return availableWorker;
        }
        // If no workers available, wait for one to become free
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const worker = this.workerPool.find(w => !w.isActive);
                if (worker) {
                    clearInterval(checkInterval);
                    resolve(worker);
                }
            }, 10);
        });
    }
    releaseWorker(worker) {
        worker.isActive = false;
        // Process queued tasks if any
        if (this.taskQueue.length > 0) {
            const queuedTask = this.taskQueue.shift();
            if (queuedTask) {
                // Execute queued task immediately
                setTimeout(() => this.executeTask(queuedTask), 0);
            }
        }
    }
    async executeCacheTask(task) {
        const startTime = perf_hooks_1.performance.now();
        try {
            let result;
            switch (task.operation) {
                case 'get':
                    result = await this.simulateCacheGet(task.key);
                    break;
                case 'set':
                    result = await this.simulateCacheSet(task.key, task.value, task.ttl);
                    break;
                case 'delete':
                    result = await this.simulateCacheDelete(task.key);
                    break;
                case 'batch':
                    result = await this.simulateBatchOperation(task.batchOperations || []);
                    break;
                case 'warming':
                    result = await this.simulateCacheWarming(task.warmingData || []);
                    break;
                default:
                    throw new Error(`Unknown cache operation: ${task.operation}`);
            }
            return {
                taskId: task.id,
                success: true,
                result,
                executionTime: perf_hooks_1.performance.now() - startTime,
                workerId: 'simulated-worker'
            };
        }
        catch (error) {
            return {
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                executionTime: perf_hooks_1.performance.now() - startTime,
                workerId: 'simulated-worker'
            };
        }
    }
    async simulateCacheGet(key) {
        // Simulate cache get operation with realistic timing
        const lookupTime = 1 + Math.random() * 5; // 1-6ms
        await new Promise(resolve => setTimeout(resolve, lookupTime));
        // 70% hit rate simulation
        const isHit = Math.random() < 0.7;
        return {
            hit: isHit,
            value: isHit ? { data: `cached_value_for_${key}`, timestamp: Date.now() } : null,
            responseTime: lookupTime
        };
    }
    async simulateCacheSet(key, value, ttl) {
        // Simulate cache set operation
        const writeTime = 2 + Math.random() * 8; // 2-10ms
        await new Promise(resolve => setTimeout(resolve, writeTime));
        // 5% chance of eviction needed
        const evicted = Math.random() < 0.05;
        return {
            stored: true,
            evicted,
            responseTime: writeTime,
            evictedKey: evicted ? `evicted_key_${Math.random()}` : null
        };
    }
    async simulateCacheDelete(key) {
        // Simulate cache delete operation
        const deleteTime = 1 + Math.random() * 3; // 1-4ms
        await new Promise(resolve => setTimeout(resolve, deleteTime));
        return {
            deleted: true,
            responseTime: deleteTime
        };
    }
    async simulateBatchOperation(operations) {
        // Simulate batch operations with parallel processing
        const batchResults = await Promise.all(operations.map(async (op) => {
            switch (op.type) {
                case 'get':
                    return this.simulateCacheGet(op.key);
                case 'set':
                    return this.simulateCacheSet(op.key, op.value, op.ttl);
                case 'delete':
                    return this.simulateCacheDelete(op.key);
                default:
                    return { error: `Unknown operation: ${op.type}` };
            }
        }));
        return {
            batchSize: operations.length,
            results: batchResults,
            successCount: batchResults.filter(r => r && !r.error).length
        };
    }
    async simulateCacheWarming(warmingData) {
        // Simulate efficient cache warming with batching
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < warmingData.length; i += batchSize) {
            batches.push(warmingData.slice(i, i + batchSize));
        }
        let warmedKeys = 0;
        const startTime = perf_hooks_1.performance.now();
        for (const batch of batches) {
            await Promise.all(batch.map(async (item) => {
                await this.simulateCacheSet(item.key, item.value, item.ttl);
                warmedKeys++;
            }));
        }
        return {
            warmedKeys,
            totalKeys: warmingData.length,
            warmingTime: perf_hooks_1.performance.now() - startTime,
            efficiency: warmedKeys / warmingData.length
        };
    }
    updateWorkerStats(workerId, executionTime, success) {
        const stats = this.workerStats.get(workerId);
        if (!stats)
            return;
        stats.tasksCompleted++;
        stats.totalExecutionTime += executionTime;
        stats.averageExecutionTime = stats.totalExecutionTime / stats.tasksCompleted;
        if (!success) {
            stats.errorCount++;
        }
    }
    getWorkerStats() {
        return new Map(this.workerStats);
    }
    getActiveWorkerCount() {
        return this.activeWorkers.size;
    }
    getTotalWorkerCount() {
        return this.workerPool.length;
    }
    async cleanup() {
        console.log('🧹 Cleaning up cache worker pool...');
        // Terminate all workers
        const terminationPromises = this.workerPool.map(worker => worker.terminate());
        await Promise.all(terminationPromises);
        // Clear collections
        this.workerPool.length = 0;
        this.activeWorkers.clear();
        this.workerStats.clear();
        this.taskQueue.length = 0;
        console.log('✅ Cache worker pool cleaned up');
    }
}
exports.SharedCacheWorkerPool = SharedCacheWorkerPool;
// ============================================================================
// Intelligent Cache Warmer
// ============================================================================
class IntelligentCacheWarmer extends events_1.EventEmitter {
    constructor() {
        super();
        this.dataProvider = PreGeneratedCacheDataSets.getInstance();
        this.workerPool = SharedCacheWorkerPool.getInstance();
    }
    async warmCache(cacheInstance, strategy, options) {
        console.log(`🔥 Starting intelligent cache warming with strategy: ${strategy}`);
        const startTime = perf_hooks_1.performance.now();
        try {
            let result;
            switch (strategy) {
                case 'progressive':
                    result = await this.progressiveWarmup(cacheInstance, options);
                    break;
                case 'bulk':
                    result = await this.bulkWarmup(cacheInstance, options);
                    break;
                case 'pattern_aware':
                    result = await this.patternAwareWarmup(cacheInstance, options);
                    break;
                case 'adaptive':
                    result = await this.adaptiveWarmup(cacheInstance, options);
                    break;
                default:
                    result = await this.adaptiveWarmup(cacheInstance, options);
            }
            const totalTime = perf_hooks_1.performance.now() - startTime;
            result.totalWarmupTime = totalTime;
            console.log(`✅ Cache warming completed in ${totalTime.toFixed(2)}ms`);
            this.emit('warmup-completed', result);
            return result;
        }
        catch (error) {
            console.error('❌ Cache warming failed:', error);
            throw error;
        }
    }
    async progressiveWarmup(cacheInstance, options) {
        const dataSet = this.dataProvider.getDataSet(options.pattern, options.targetSize);
        if (!dataSet)
            throw new Error(`Data set not found: ${options.pattern}`);
        const batchSize = 25; // Smaller batches for progressive loading
        const batches = [];
        for (let i = 0; i < dataSet.items.length; i += batchSize) {
            batches.push(dataSet.items.slice(i, i + batchSize));
        }
        let warmedKeys = 0;
        let failedKeys = 0;
        const batchResults = [];
        // Process batches with progressive delay
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchStart = perf_hooks_1.performance.now();
            try {
                const warmingTask = {
                    id: `progressive-warmup-${i}`,
                    operation: 'warming',
                    warmingData: batch.map(item => ({
                        key: item.key,
                        value: item.value,
                        ttl: item.ttl
                    }))
                };
                const result = await this.workerPool.executeTask(warmingTask);
                if (result.success && result.result) {
                    warmedKeys += result.result.warmedKeys || 0;
                }
                else {
                    failedKeys += batch.length;
                }
                batchResults.push(perf_hooks_1.performance.now() - batchStart);
                // Progressive delay: slightly increase delay between batches
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5 + i));
                }
            }
            catch (error) {
                console.error(`❌ Progressive warmup batch ${i} failed:`, error);
                failedKeys += batch.length;
            }
        }
        return {
            strategy: 'progressive',
            totalKeys: dataSet.items.length,
            warmedKeys,
            failedKeys,
            efficiency: warmedKeys / dataSet.items.length,
            averageBatchTime: batchResults.reduce((sum, time) => sum + time, 0) / batchResults.length,
            totalWarmupTime: 0 // Will be set by caller
        };
    }
    async bulkWarmup(cacheInstance, options) {
        const dataSet = this.dataProvider.getDataSet(options.pattern, options.targetSize);
        if (!dataSet)
            throw new Error(`Data set not found: ${options.pattern}`);
        const batchSize = 100; // Larger batches for bulk loading
        const batches = [];
        for (let i = 0; i < dataSet.items.length; i += batchSize) {
            batches.push(dataSet.items.slice(i, i + batchSize));
        }
        let warmedKeys = 0;
        let failedKeys = 0;
        const batchTasks = [];
        // Execute all batches in parallel
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const warmingTask = {
                id: `bulk-warmup-${i}`,
                operation: 'warming',
                warmingData: batch.map(item => ({
                    key: item.key,
                    value: item.value,
                    ttl: item.ttl
                }))
            };
            batchTasks.push(this.workerPool.executeTask(warmingTask));
        }
        // Wait for all batches to complete
        const results = await Promise.all(batchTasks);
        results.forEach(result => {
            if (result.success && result.result) {
                warmedKeys += result.result.warmedKeys || 0;
            }
            else {
                failedKeys += 100; // Approximate batch size
            }
        });
        return {
            strategy: 'bulk',
            totalKeys: dataSet.items.length,
            warmedKeys,
            failedKeys,
            efficiency: warmedKeys / dataSet.items.length,
            averageBatchTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
            totalWarmupTime: 0
        };
    }
    async patternAwareWarmup(cacheInstance, options) {
        const dataSet = this.dataProvider.getDataSet(options.pattern, options.targetSize);
        if (!dataSet)
            throw new Error(`Data set not found: ${options.pattern}`);
        // Sort items by access weight (priority)
        const prioritizedItems = [...dataSet.items].sort((a, b) => b.accessWeight - a.accessWeight);
        // Warm high-priority items first
        const highPriorityItems = prioritizedItems.slice(0, Math.floor(prioritizedItems.length * 0.3));
        const mediumPriorityItems = prioritizedItems.slice(Math.floor(prioritizedItems.length * 0.3), Math.floor(prioritizedItems.length * 0.7));
        const lowPriorityItems = prioritizedItems.slice(Math.floor(prioritizedItems.length * 0.7));
        let warmedKeys = 0;
        let failedKeys = 0;
        const phaseResults = [];
        // Phase 1: High priority (sequential for accuracy)
        const highPriorityResult = await this.warmItemsSequential(highPriorityItems, 'high-priority');
        warmedKeys += highPriorityResult.warmedKeys;
        failedKeys += highPriorityResult.failedKeys;
        phaseResults.push(highPriorityResult.phaseTime);
        // Phase 2: Medium priority (small batches)
        const mediumPriorityResult = await this.warmItemsBatched(mediumPriorityItems, 'medium-priority', 25);
        warmedKeys += mediumPriorityResult.warmedKeys;
        failedKeys += mediumPriorityResult.failedKeys;
        phaseResults.push(mediumPriorityResult.phaseTime);
        // Phase 3: Low priority (large batches, parallel)
        const lowPriorityResult = await this.warmItemsBatched(lowPriorityItems, 'low-priority', 75);
        warmedKeys += lowPriorityResult.warmedKeys;
        failedKeys += lowPriorityResult.failedKeys;
        phaseResults.push(lowPriorityResult.phaseTime);
        return {
            strategy: 'pattern_aware',
            totalKeys: dataSet.items.length,
            warmedKeys,
            failedKeys,
            efficiency: warmedKeys / dataSet.items.length,
            averageBatchTime: phaseResults.reduce((sum, time) => sum + time, 0) / phaseResults.length,
            totalWarmupTime: 0
        };
    }
    async adaptiveWarmup(cacheInstance, options) {
        // Analyze cache characteristics first
        const cacheAnalysis = await this.analyzeCacheCharacteristics(cacheInstance, options);
        // Choose optimal strategy based on analysis
        let chosenStrategy;
        if (cacheAnalysis.writeLatency > 10) {
            chosenStrategy = 'progressive';
        }
        else if (cacheAnalysis.memoryPressure > 0.8) {
            chosenStrategy = 'pattern_aware';
        }
        else {
            chosenStrategy = 'bulk';
        }
        console.log(`🧠 Adaptive warmup chose strategy: ${chosenStrategy}`);
        // Execute chosen strategy
        return this.warmCache(cacheInstance, chosenStrategy, options);
    }
    async warmItemsSequential(items, phase) {
        const startTime = perf_hooks_1.performance.now();
        let warmedKeys = 0;
        let failedKeys = 0;
        for (const item of items) {
            try {
                const task = {
                    id: `${phase}-${item.key}`,
                    operation: 'set',
                    key: item.key,
                    value: item.value,
                    ttl: item.ttl
                };
                const result = await this.workerPool.executeTask(task);
                if (result.success) {
                    warmedKeys++;
                }
                else {
                    failedKeys++;
                }
            }
            catch (error) {
                failedKeys++;
            }
        }
        return {
            warmedKeys,
            failedKeys,
            phaseTime: perf_hooks_1.performance.now() - startTime
        };
    }
    async warmItemsBatched(items, phase, batchSize) {
        const startTime = perf_hooks_1.performance.now();
        let warmedKeys = 0;
        let failedKeys = 0;
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        const batchTasks = batches.map((batch, index) => {
            const task = {
                id: `${phase}-batch-${index}`,
                operation: 'warming',
                warmingData: batch.map(item => ({
                    key: item.key,
                    value: item.value,
                    ttl: item.ttl
                }))
            };
            return this.workerPool.executeTask(task);
        });
        const results = await Promise.all(batchTasks);
        results.forEach(result => {
            if (result.success && result.result) {
                warmedKeys += result.result.warmedKeys || 0;
            }
            else {
                failedKeys += batchSize; // Approximate
            }
        });
        return {
            warmedKeys,
            failedKeys,
            phaseTime: perf_hooks_1.performance.now() - startTime
        };
    }
    async analyzeCacheCharacteristics(cacheInstance, options) {
        // Perform small sample operations to analyze cache behavior
        const sampleSize = 10;
        const sampleData = this.dataProvider.getDataSet(options.pattern, sampleSize);
        if (!sampleData) {
            return {
                writeLatency: 5,
                readLatency: 2,
                memoryPressure: 0.5,
                evictionRate: 0.1
            };
        }
        const writeTimes = [];
        const readTimes = [];
        // Measure write performance
        for (const item of sampleData.items) {
            const writeTask = {
                id: `analysis-write-${item.key}`,
                operation: 'set',
                key: item.key,
                value: item.value,
                ttl: item.ttl
            };
            const writeResult = await this.workerPool.executeTask(writeTask);
            writeTimes.push(writeResult.executionTime);
            // Measure read performance
            const readTask = {
                id: `analysis-read-${item.key}`,
                operation: 'get',
                key: item.key
            };
            const readResult = await this.workerPool.executeTask(readTask);
            readTimes.push(readResult.executionTime);
        }
        return {
            writeLatency: writeTimes.reduce((sum, time) => sum + time, 0) / writeTimes.length,
            readLatency: readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length,
            memoryPressure: Math.random() * 0.5 + 0.3, // Simulated
            evictionRate: Math.random() * 0.2 // Simulated
        };
    }
}
exports.IntelligentCacheWarmer = IntelligentCacheWarmer;
// ============================================================================
// Factory Functions
// ============================================================================
async function initializeCacheOptimizations() {
    console.log('🚀 Initializing optimized cache components...');
    const dataProvider = PreGeneratedCacheDataSets.getInstance();
    await dataProvider.initialize();
    const workerPool = SharedCacheWorkerPool.getInstance();
    const cacheWarmer = new IntelligentCacheWarmer();
    console.log('✅ Optimized cache components initialized');
    return {
        dataProvider,
        workerPool,
        cacheWarmer
    };
}
async function cleanupCacheOptimizations() {
    console.log('🧹 Cleaning up cache optimizations...');
    const workerPool = SharedCacheWorkerPool.getInstance();
    await workerPool.cleanup();
    console.log('✅ Cache optimizations cleaned up');
}
//# sourceMappingURL=optimized-cache-components.js.map