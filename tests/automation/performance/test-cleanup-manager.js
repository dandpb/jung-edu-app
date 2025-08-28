"use strict";
/**
 * Test Cleanup Manager
 * Comprehensive cleanup mechanisms to prevent memory accumulation between tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalCleanupRegistry = exports.TestCleanupManager = void 0;
exports.getJestCleanupManager = getJestCleanupManager;
exports.setupJestCleanupHooks = setupJestCleanupHooks;
exports.withCleanup = withCleanup;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
// ============================================================================
// Global Cleanup Registry
// ============================================================================
class GlobalCleanupRegistry {
    constructor() {
        this.cleanupCallbacks = new Map();
        this.resourceReferences = new Map();
        this.activeHandles = new Set();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new GlobalCleanupRegistry();
        }
        return this.instance;
    }
    /**
     * Register a cleanup callback
     */
    register(name, callback) {
        this.cleanupCallbacks.set(name, callback);
    }
    /**
     * Unregister a cleanup callback
     */
    unregister(name) {
        this.cleanupCallbacks.delete(name);
    }
    /**
     * Register resource references for cleanup
     */
    registerResources(category, resources) {
        const existing = this.resourceReferences.get(category) || [];
        this.resourceReferences.set(category, [...existing, ...resources]);
    }
    /**
     * Track active handles
     */
    trackHandle(handle) {
        this.activeHandles.add(handle);
    }
    /**
     * Remove handle from tracking
     */
    untrackHandle(handle) {
        this.activeHandles.delete(handle);
    }
    /**
     * Execute all cleanup callbacks
     */
    async executeAll() {
        const results = [];
        for (const [name, callback] of this.cleanupCallbacks) {
            try {
                await callback();
                results.push(`✅ ${name}: Success`);
            }
            catch (error) {
                results.push(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    /**
     * Clear all resource references
     */
    clearResources() {
        let totalCleared = 0;
        for (const [category, resources] of this.resourceReferences) {
            totalCleared += resources.length;
            resources.length = 0; // Clear array references
        }
        this.resourceReferences.clear();
        return totalCleared;
    }
    /**
     * Clear active handles
     */
    clearHandles() {
        const handleCount = this.activeHandles.size;
        for (const handle of this.activeHandles) {
            try {
                clearTimeout(handle);
                clearImmediate(handle);
            }
            catch (error) {
                // Handle may already be cleared
            }
        }
        this.activeHandles.clear();
        return handleCount;
    }
    /**
     * Get cleanup statistics
     */
    getStats() {
        const totalResourceCount = Array.from(this.resourceReferences.values())
            .reduce((sum, resources) => sum + resources.length, 0);
        return {
            callbackCount: this.cleanupCallbacks.size,
            resourceCategoryCount: this.resourceReferences.size,
            totalResourceCount,
            activeHandleCount: this.activeHandles.size
        };
    }
    /**
     * Reset the entire registry
     */
    reset() {
        this.cleanupCallbacks.clear();
        this.resourceReferences.clear();
        this.clearHandles();
    }
}
exports.GlobalCleanupRegistry = GlobalCleanupRegistry;
// ============================================================================
// Test Cleanup Manager
// ============================================================================
class TestCleanupManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.cleanupInterval = null;
        this.isCleaningUp = false;
        this.cleanupHistory = [];
        this.maxHistoryEntries = 10;
        this.config = {
            enableAutoCleanup: true,
            cleanupInterval: 30000, // 30 seconds
            memoryThreshold: 200, // 200MB
            forceGCThreshold: 250, // 250MB
            cleanupStrategies: this.getDefaultStrategies(),
            retentionPolicy: {
                maxCacheEntries: 100,
                maxLogEntries: 500,
                maxMetricSamples: 200,
                maxEventHistory: 50,
                cleanupAfterMs: 300000 // 5 minutes
            },
            emergencyCleanup: {
                enabled: true,
                triggerThresholdMB: 300,
                aggressiveMode: true,
                forceGarbageCollection: true
            },
            ...config
        };
        this.registry = GlobalCleanupRegistry.getInstance();
        // Setup default cleanup strategies
        this.setupDefaultCleanupStrategies();
        if (this.config.enableAutoCleanup) {
            this.startAutoCleanup();
        }
    }
    /**
     * Start automatic cleanup monitoring
     */
    startAutoCleanup() {
        if (this.cleanupInterval)
            return;
        console.log('🧹 Starting automatic cleanup monitoring');
        this.cleanupInterval = setInterval(async () => {
            const currentMemory = this.getCurrentMemoryUsage();
            if (currentMemory > this.config.memoryThreshold) {
                console.log(`🧹 Auto cleanup triggered - Memory: ${currentMemory.toFixed(2)}MB`);
                await this.performCleanup('automatic');
            }
        }, this.config.cleanupInterval);
        // Track this interval
        this.registry.trackHandle(this.cleanupInterval);
    }
    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.registry.untrackHandle(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('🛑 Automatic cleanup monitoring stopped');
        }
    }
    /**
     * Perform comprehensive cleanup
     */
    async performCleanup(trigger = 'manual') {
        if (this.isCleaningUp) {
            console.log('⚠️ Cleanup already in progress, skipping...');
            return this.cleanupHistory[this.cleanupHistory.length - 1] || this.createEmptyReport();
        }
        this.isCleaningUp = true;
        const startTime = perf_hooks_1.performance.now();
        const startMemory = this.getCurrentMemoryUsage();
        console.log(`🧹 Starting ${trigger} cleanup - Memory: ${startMemory.toFixed(2)}MB`);
        const results = [];
        let strategiesExecuted = 0;
        let strategiesSucceeded = 0;
        try {
            // Execute cleanup strategies in priority order
            const enabledStrategies = this.config.cleanupStrategies
                .filter(s => s.enabled)
                .sort((a, b) => this.getPriorityValue(a.priority) - this.getPriorityValue(b.priority));
            for (const strategy of enabledStrategies) {
                const strategyResult = await this.executeCleanupStrategy(strategy);
                results.push(strategyResult);
                strategiesExecuted++;
                if (strategyResult.success) {
                    strategiesSucceeded++;
                }
                // Check if emergency cleanup should be more aggressive
                if (trigger === 'emergency' && this.config.emergencyCleanup.aggressiveMode) {
                    const currentMemory = this.getCurrentMemoryUsage();
                    if (currentMemory > this.config.emergencyCleanup.triggerThresholdMB) {
                        await this.performAggressiveCleanup();
                    }
                }
            }
            // Force garbage collection if needed
            const currentMemory = this.getCurrentMemoryUsage();
            if (currentMemory > this.config.forceGCThreshold && global.gc) {
                console.log('🗑️ Forcing garbage collection');
                global.gc();
                await this.sleep(100); // Brief pause for GC to complete
            }
            const endMemory = this.getCurrentMemoryUsage();
            const totalDuration = perf_hooks_1.performance.now() - startTime;
            const report = {
                timestamp: Date.now(),
                trigger,
                totalMemoryBeforeMB: startMemory,
                totalMemoryAfterMB: endMemory,
                totalMemorySavedMB: startMemory - endMemory,
                totalDuration,
                strategiesExecuted,
                strategiesSucceeded,
                strategiesFailed: strategiesExecuted - strategiesSucceeded,
                results,
                recommendations: this.generateCleanupRecommendations(results, startMemory, endMemory)
            };
            // Add to history
            this.addToHistory(report);
            console.log(`✅ Cleanup completed in ${totalDuration.toFixed(2)}ms`);
            console.log(`💾 Memory: ${startMemory.toFixed(2)}MB → ${endMemory.toFixed(2)}MB (${(startMemory - endMemory).toFixed(2)}MB saved)`);
            this.emit('cleanupComplete', report);
            return report;
        }
        catch (error) {
            console.error('❌ Cleanup failed:', error);
            throw error;
        }
        finally {
            this.isCleaningUp = false;
        }
    }
    /**
     * Register a custom cleanup strategy
     */
    registerCleanupStrategy(strategy) {
        // Remove existing strategy with same name
        this.config.cleanupStrategies = this.config.cleanupStrategies.filter(s => s.name !== strategy.name);
        this.config.cleanupStrategies.push(strategy);
        console.log(`📋 Registered cleanup strategy: ${strategy.name}`);
    }
    /**
     * Register multiple cleanup callbacks
     */
    registerCleanupCallbacks(callbacks) {
        for (const [name, callback] of Object.entries(callbacks)) {
            this.registry.register(name, callback);
        }
        console.log(`📋 Registered ${Object.keys(callbacks).length} cleanup callbacks`);
    }
    /**
     * Perform emergency cleanup
     */
    async performEmergencyCleanup() {
        console.warn('🚨 Emergency cleanup triggered!');
        return await this.performCleanup('emergency');
    }
    /**
     * Clean up test-specific resources
     */
    async cleanupTestResources(testName) {
        console.log(`🧹 Cleaning up resources for test: ${testName}`);
        // Execute test-specific cleanup
        await this.registry.executeAll();
        // Clear resources
        const resourcesCleared = this.registry.clearResources();
        const handlesCleared = this.registry.clearHandles();
        console.log(`✅ Test cleanup: ${resourcesCleared} resources, ${handlesCleared} handles cleared`);
    }
    /**
     * Get cleanup statistics
     */
    getCleanupStats() {
        return {
            registryStats: this.registry.getStats(),
            historyCount: this.cleanupHistory.length,
            lastCleanup: this.cleanupHistory[this.cleanupHistory.length - 1],
            memoryUsage: this.getCurrentMemoryUsage(),
            isCleaningUp: this.isCleaningUp
        };
    }
    /**
     * Reset all cleanup systems
     */
    reset() {
        this.stopAutoCleanup();
        this.registry.reset();
        this.cleanupHistory = [];
        this.isCleaningUp = false;
        console.log('🔄 Cleanup manager reset');
    }
    /**
     * Cleanup and destroy the manager
     */
    async destroy() {
        console.log('🗑️ Destroying cleanup manager');
        // Stop auto cleanup
        this.stopAutoCleanup();
        // Perform final cleanup
        await this.performCleanup('manual');
        // Reset registry
        this.registry.reset();
        // Remove all listeners
        this.removeAllListeners();
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    async executeCleanupStrategy(strategy) {
        const startTime = perf_hooks_1.performance.now();
        const startMemory = this.getCurrentMemoryUsage();
        try {
            await strategy.cleanup();
            const endTime = perf_hooks_1.performance.now();
            const endMemory = this.getCurrentMemoryUsage();
            return {
                strategy: strategy.name,
                success: true,
                memoryBeforeMB: startMemory,
                memoryAfterMB: endMemory,
                memorySavedMB: startMemory - endMemory,
                duration: endTime - startTime
            };
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            const endMemory = this.getCurrentMemoryUsage();
            return {
                strategy: strategy.name,
                success: false,
                memoryBeforeMB: startMemory,
                memoryAfterMB: endMemory,
                memorySavedMB: 0,
                duration: endTime - startTime,
                error: error
            };
        }
    }
    async performAggressiveCleanup() {
        console.log('🚨 Performing aggressive cleanup');
        // Clear all caches
        if (typeof global !== 'undefined') {
            // Clear various global caches if they exist
            delete global.performanceCache;
            delete global.testDataCache;
            delete global.moduleCache;
        }
        // Force multiple GC cycles
        if (global.gc) {
            for (let i = 0; i < 3; i++) {
                global.gc();
                await this.sleep(100);
            }
        }
        // Clear registry completely
        this.registry.clearResources();
        this.registry.clearHandles();
    }
    getDefaultStrategies() {
        return [
            {
                name: 'Registry Cleanup',
                priority: 'high',
                enabled: true,
                estimatedSavingsMB: 10,
                cleanup: async () => {
                    await this.registry.executeAll();
                    this.registry.clearResources();
                    this.registry.clearHandles();
                }
            },
            {
                name: 'Cache Cleanup',
                priority: 'high',
                enabled: true,
                estimatedSavingsMB: 20,
                cleanup: () => {
                    // Clear various caches
                    if (require.cache) {
                        // Don't clear require cache in tests as it can break things
                        // Object.keys(require.cache).forEach(key => delete require.cache[key]);
                    }
                }
            },
            {
                name: 'Event Listener Cleanup',
                priority: 'medium',
                enabled: true,
                estimatedSavingsMB: 5,
                cleanup: () => {
                    // Remove any dangling event listeners
                    if (process.listenerCount('unhandledRejection') > 1) {
                        process.removeAllListeners('unhandledRejection');
                    }
                    if (process.listenerCount('uncaughtException') > 1) {
                        process.removeAllListeners('uncaughtException');
                    }
                }
            },
            {
                name: 'Timer Cleanup',
                priority: 'medium',
                enabled: true,
                estimatedSavingsMB: 3,
                cleanup: () => {
                    // Handled by registry cleanup
                }
            },
            {
                name: 'History Cleanup',
                priority: 'low',
                enabled: true,
                estimatedSavingsMB: 2,
                cleanup: () => {
                    // Trim cleanup history
                    if (this.cleanupHistory.length > this.maxHistoryEntries) {
                        this.cleanupHistory = this.cleanupHistory.slice(-this.maxHistoryEntries);
                    }
                }
            }
        ];
    }
    setupDefaultCleanupStrategies() {
        // Register default cleanup callbacks
        this.registry.register('process_cleanup', () => {
            // Basic process cleanup
            if (global.gc) {
                global.gc();
            }
        });
    }
    getCurrentMemoryUsage() {
        return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    getPriorityValue(priority) {
        switch (priority) {
            case 'high': return 1;
            case 'medium': return 2;
            case 'low': return 3;
            default: return 2;
        }
    }
    generateCleanupRecommendations(results, startMemory, endMemory) {
        const recommendations = [];
        const failedStrategies = results.filter(r => !r.success);
        if (failedStrategies.length > 0) {
            recommendations.push(`${failedStrategies.length} cleanup strategies failed. Check error logs.`);
        }
        const memorySaved = startMemory - endMemory;
        if (memorySaved < 10) {
            recommendations.push('Low memory savings achieved. Consider additional cleanup strategies.');
        }
        if (endMemory > this.config.memoryThreshold * 1.2) {
            recommendations.push(`Memory usage still high (${endMemory.toFixed(2)}MB). Consider more aggressive cleanup.`);
        }
        const slowStrategies = results.filter(r => r.duration > 5000); // 5 seconds
        if (slowStrategies.length > 0) {
            recommendations.push(`${slowStrategies.length} cleanup strategies were slow. Review strategy efficiency.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Cleanup completed successfully with good performance.');
        }
        return recommendations;
    }
    addToHistory(report) {
        this.cleanupHistory.push(report);
        if (this.cleanupHistory.length > this.maxHistoryEntries) {
            this.cleanupHistory = this.cleanupHistory.slice(-this.maxHistoryEntries);
        }
    }
    createEmptyReport() {
        return {
            timestamp: Date.now(),
            trigger: 'manual',
            totalMemoryBeforeMB: 0,
            totalMemoryAfterMB: 0,
            totalMemorySavedMB: 0,
            totalDuration: 0,
            strategiesExecuted: 0,
            strategiesSucceeded: 0,
            strategiesFailed: 0,
            results: [],
            recommendations: []
        };
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TestCleanupManager = TestCleanupManager;
// ============================================================================
// Jest Integration Helpers
// ============================================================================
let globalCleanupManager = null;
/**
 * Get or create global cleanup manager for Jest
 */
function getJestCleanupManager() {
    if (!globalCleanupManager) {
        globalCleanupManager = new TestCleanupManager({
            enableAutoCleanup: false, // Disable auto cleanup in tests
            memoryThreshold: 150, // Lower threshold for Jest
            forceGCThreshold: 200,
            emergencyCleanup: {
                enabled: true,
                triggerThresholdMB: 250,
                aggressiveMode: true,
                forceGarbageCollection: true
            }
        });
    }
    return globalCleanupManager;
}
/**
 * Setup Jest hooks for automatic cleanup
 */
function setupJestCleanupHooks() {
    const manager = getJestCleanupManager();
    // Cleanup before each test
    beforeEach(async () => {
        await manager.cleanupTestResources('beforeEach');
    });
    // Cleanup after each test
    afterEach(async () => {
        await manager.cleanupTestResources('afterEach');
        // Check memory usage and cleanup if needed
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        if (memoryUsage > 150) { // 150MB threshold
            await manager.performCleanup('automatic');
        }
    });
    // Final cleanup
    afterAll(async () => {
        if (globalCleanupManager) {
            await globalCleanupManager.destroy();
            globalCleanupManager = null;
        }
    });
}
/**
 * Utility function to wrap tests with cleanup
 */
function withCleanup(testFn, cleanupFn) {
    return async () => {
        const manager = getJestCleanupManager();
        const registry = GlobalCleanupRegistry.getInstance();
        if (cleanupFn) {
            registry.register('test_specific', cleanupFn);
        }
        try {
            const result = await testFn();
            return result;
        }
        finally {
            await manager.cleanupTestResources('test_specific');
            if (cleanupFn) {
                registry.unregister('test_specific');
            }
        }
    };
}
//# sourceMappingURL=test-cleanup-manager.js.map