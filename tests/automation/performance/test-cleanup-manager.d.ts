/**
 * Test Cleanup Manager
 * Comprehensive cleanup mechanisms to prevent memory accumulation between tests
 */
import { EventEmitter } from 'events';
interface CleanupConfig {
    enableAutoCleanup: boolean;
    cleanupInterval: number;
    memoryThreshold: number;
    forceGCThreshold: number;
    cleanupStrategies: CleanupStrategy[];
    retentionPolicy: RetentionPolicy;
    emergencyCleanup: EmergencyCleanupConfig;
}
interface CleanupStrategy {
    name: string;
    priority: 'high' | 'medium' | 'low';
    enabled: boolean;
    cleanup: () => Promise<void> | void;
    estimatedSavingsMB?: number;
}
interface RetentionPolicy {
    maxCacheEntries: number;
    maxLogEntries: number;
    maxMetricSamples: number;
    maxEventHistory: number;
    cleanupAfterMs: number;
}
interface EmergencyCleanupConfig {
    enabled: boolean;
    triggerThresholdMB: number;
    aggressiveMode: boolean;
    forceGarbageCollection: boolean;
}
interface CleanupResult {
    strategy: string;
    success: boolean;
    memoryBeforeMB: number;
    memoryAfterMB: number;
    memorySavedMB: number;
    duration: number;
    error?: Error;
}
interface CleanupReport {
    timestamp: number;
    trigger: 'manual' | 'automatic' | 'emergency' | 'interval';
    totalMemoryBeforeMB: number;
    totalMemoryAfterMB: number;
    totalMemorySavedMB: number;
    totalDuration: number;
    strategiesExecuted: number;
    strategiesSucceeded: number;
    strategiesFailed: number;
    results: CleanupResult[];
    recommendations: string[];
}
declare class GlobalCleanupRegistry {
    private static instance;
    private cleanupCallbacks;
    private resourceReferences;
    private activeHandles;
    static getInstance(): GlobalCleanupRegistry;
    /**
     * Register a cleanup callback
     */
    register(name: string, callback: () => void | Promise<void>): void;
    /**
     * Unregister a cleanup callback
     */
    unregister(name: string): void;
    /**
     * Register resource references for cleanup
     */
    registerResources(category: string, resources: any[]): void;
    /**
     * Track active handles
     */
    trackHandle(handle: NodeJS.Timeout | NodeJS.Immediate): void;
    /**
     * Remove handle from tracking
     */
    untrackHandle(handle: NodeJS.Timeout | NodeJS.Immediate): void;
    /**
     * Execute all cleanup callbacks
     */
    executeAll(): Promise<string[]>;
    /**
     * Clear all resource references
     */
    clearResources(): number;
    /**
     * Clear active handles
     */
    clearHandles(): number;
    /**
     * Get cleanup statistics
     */
    getStats(): {
        callbackCount: number;
        resourceCategoryCount: number;
        totalResourceCount: number;
        activeHandleCount: number;
    };
    /**
     * Reset the entire registry
     */
    reset(): void;
}
export declare class TestCleanupManager extends EventEmitter {
    private config;
    private registry;
    private cleanupInterval;
    private isCleaningUp;
    private cleanupHistory;
    private maxHistoryEntries;
    constructor(config?: Partial<CleanupConfig>);
    /**
     * Start automatic cleanup monitoring
     */
    startAutoCleanup(): void;
    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup(): void;
    /**
     * Perform comprehensive cleanup
     */
    performCleanup(trigger?: 'manual' | 'automatic' | 'emergency' | 'interval'): Promise<CleanupReport>;
    /**
     * Register a custom cleanup strategy
     */
    registerCleanupStrategy(strategy: CleanupStrategy): void;
    /**
     * Register multiple cleanup callbacks
     */
    registerCleanupCallbacks(callbacks: Record<string, () => void | Promise<void>>): void;
    /**
     * Perform emergency cleanup
     */
    performEmergencyCleanup(): Promise<CleanupReport>;
    /**
     * Clean up test-specific resources
     */
    cleanupTestResources(testName: string): Promise<void>;
    /**
     * Get cleanup statistics
     */
    getCleanupStats(): {
        registryStats: ReturnType<GlobalCleanupRegistry['getStats']>;
        historyCount: number;
        lastCleanup?: CleanupReport;
        memoryUsage: number;
        isCleaningUp: boolean;
    };
    /**
     * Reset all cleanup systems
     */
    reset(): void;
    /**
     * Cleanup and destroy the manager
     */
    destroy(): Promise<void>;
    private executeCleanupStrategy;
    private performAggressiveCleanup;
    private getDefaultStrategies;
    private setupDefaultCleanupStrategies;
    private getCurrentMemoryUsage;
    private getPriorityValue;
    private generateCleanupRecommendations;
    private addToHistory;
    private createEmptyReport;
    private sleep;
}
/**
 * Get or create global cleanup manager for Jest
 */
export declare function getJestCleanupManager(): TestCleanupManager;
/**
 * Setup Jest hooks for automatic cleanup
 */
export declare function setupJestCleanupHooks(): void;
/**
 * Utility function to wrap tests with cleanup
 */
export declare function withCleanup<T>(testFn: () => Promise<T>, cleanupFn?: () => void | Promise<void>): () => Promise<T>;
export { TestCleanupManager, GlobalCleanupRegistry };
export type { CleanupConfig, CleanupStrategy, CleanupResult, CleanupReport, RetentionPolicy, EmergencyCleanupConfig };
//# sourceMappingURL=test-cleanup-manager.d.ts.map