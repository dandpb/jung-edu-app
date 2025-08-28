/**
 * Optimized Cache Test Components for jaqEdu Platform
 * Implements performance optimizations identified in bottleneck analysis
 */
import { EventEmitter } from 'events';
export declare class PreGeneratedCacheDataSets {
    private static instance;
    private dataSets;
    private isInitialized;
    static getInstance(): PreGeneratedCacheDataSets;
    initialize(): Promise<void>;
    private generateDataSetAsync;
    private generateDataSet;
    private generateSequentialData;
    private generateRandomData;
    private generateHotspotData;
    private generateZipfianData;
    private generateTemporalData;
    private generateRandomString;
    getDataSet(pattern: string, requestedSize?: number): CacheDataSet | null;
    getAllPatterns(): string[];
    getDataSetInfo(pattern: string): CacheDataSetInfo | null;
}
export declare class SharedCacheWorkerPool extends EventEmitter {
    private static instance;
    private workerPool;
    private taskQueue;
    private activeWorkers;
    private maxWorkers;
    private workerStats;
    private constructor();
    static getInstance(): SharedCacheWorkerPool;
    private initializeWorkerPool;
    private createCacheWorker;
    executeTask(task: CacheTask): Promise<CacheTaskResult>;
    private acquireWorker;
    private releaseWorker;
    private executeCacheTask;
    private simulateCacheGet;
    private simulateCacheSet;
    private simulateCacheDelete;
    private simulateBatchOperation;
    private simulateCacheWarming;
    private updateWorkerStats;
    getWorkerStats(): Map<string, CacheWorkerStats>;
    getActiveWorkerCount(): number;
    getTotalWorkerCount(): number;
    cleanup(): Promise<void>;
}
export declare class IntelligentCacheWarmer extends EventEmitter {
    private dataProvider;
    private workerPool;
    constructor();
    warmCache(cacheInstance: any, strategy: WarmupStrategy, options: CacheWarmingOptions): Promise<WarmupResult>;
    private progressiveWarmup;
    private bulkWarmup;
    private patternAwareWarmup;
    private adaptiveWarmup;
    private warmItemsSequential;
    private warmItemsBatched;
    private analyzeCacheCharacteristics;
}
interface CacheDataSet {
    pattern: string;
    items: CacheDataItem[];
    metadata: CacheDataSetMetadata;
}
interface CacheDataItem {
    key: string;
    value: any;
    accessWeight: number;
    ttl: number;
}
interface CacheDataSetMetadata {
    size: number;
    generatedAt: number;
    distribution: string;
    averageKeySize: number;
    averageValueSize: number;
}
interface CacheDataSetInfo {
    pattern: string;
    size: number;
    averageKeySize: number;
    averageValueSize: number;
    generatedAt: number;
}
interface CacheTask {
    id: string;
    operation: 'get' | 'set' | 'delete' | 'batch' | 'warming';
    key?: string;
    value?: any;
    ttl?: number;
    batchOperations?: BatchOperation[];
    warmingData?: CacheWarmingItem[];
}
interface BatchOperation {
    type: 'get' | 'set' | 'delete';
    key: string;
    value?: any;
    ttl?: number;
}
interface CacheWarmingItem {
    key: string;
    value: any;
    ttl: number;
}
interface CacheTaskResult {
    taskId: string;
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    workerId: string;
}
interface CacheWorkerStats {
    tasksCompleted: number;
    averageExecutionTime: number;
    errorCount: number;
    totalExecutionTime: number;
    isActive: boolean;
}
type WarmupStrategy = 'progressive' | 'bulk' | 'pattern_aware' | 'adaptive';
interface CacheWarmingOptions {
    pattern: string;
    targetSize: number;
    priority?: 'high' | 'medium' | 'low';
    batchSize?: number;
    concurrency?: number;
}
interface WarmupResult {
    strategy: WarmupStrategy;
    totalKeys: number;
    warmedKeys: number;
    failedKeys: number;
    efficiency: number;
    averageBatchTime: number;
    totalWarmupTime: number;
}
export declare function initializeCacheOptimizations(): Promise<{
    dataProvider: PreGeneratedCacheDataSets;
    workerPool: SharedCacheWorkerPool;
    cacheWarmer: IntelligentCacheWarmer;
}>;
export declare function cleanupCacheOptimizations(): Promise<void>;
export {};
//# sourceMappingURL=optimized-cache-components.d.ts.map