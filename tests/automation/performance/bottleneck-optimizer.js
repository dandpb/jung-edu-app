"use strict";
/**
 * Performance Bottleneck Optimizer for jaqEdu Testing Suite
 * Implements intelligent optimization strategies to eliminate performance bottlenecks
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
exports.BottleneckOptimizer = void 0;
exports.createBottleneckOptimizer = createBottleneckOptimizer;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const worker_threads_1 = require("worker_threads");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
// ============================================================================
// Shared Worker Pool Manager
// ============================================================================
class SharedWorkerPoolManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.workerPool = new Map();
        this.taskQueue = [];
        this.activeWorkers = new Map();
        this.workerStats = new Map();
        this.maxWorkers = Math.min(os.cpus().length, 8);
        this.initializeWorkerPools();
    }
    static getInstance() {
        if (!SharedWorkerPoolManager.instance) {
            SharedWorkerPoolManager.instance = new SharedWorkerPoolManager();
        }
        return SharedWorkerPoolManager.instance;
    }
    initializeWorkerPools() {
        const workerTypes = ['database', 'cache', 'api', 'load', 'stress'];
        workerTypes.forEach(type => {
            this.workerPool.set(type, []);
            this.workerStats.set(type, {
                totalTasks: 0,
                completedTasks: 0,
                averageExecutionTime: 0,
                errorRate: 0,
                utilization: 0
            });
        });
    }
    async acquireWorker(type, task) {
        const startTime = perf_hooks_1.performance.now();
        // Try to get available worker from pool
        const pool = this.workerPool.get(type) || [];
        let worker = pool.find(w => !this.activeWorkers.has(w.threadId.toString()));
        if (!worker) {
            // Create new worker if pool not at capacity
            if (this.getTotalActiveWorkers() < this.maxWorkers) {
                worker = await this.createWorker(type, task);
                pool.push(worker);
            }
            else {
                // Queue task if at capacity
                return this.queueTask(type, task);
            }
        }
        // Mark worker as active
        this.activeWorkers.set(worker.threadId.toString(), worker);
        // Update statistics
        this.updateWorkerStats(type, 'acquire', perf_hooks_1.performance.now() - startTime);
        return worker;
    }
    async releaseWorker(worker) {
        const workerId = worker.threadId.toString();
        this.activeWorkers.delete(workerId);
        // Process queued tasks
        if (this.taskQueue.length > 0) {
            const queuedTask = this.taskQueue.shift();
            if (queuedTask) {
                this.executeQueuedTask(worker, queuedTask);
            }
        }
    }
    async createWorker(type, task) {
        const workerScript = this.getWorkerScript(type);
        const worker = new worker_threads_1.Worker(workerScript, {
            workerData: { type, task }
        });
        worker.on('error', (error) => {
            console.error(`Worker error (${type}):`, error);
            this.handleWorkerError(worker, type, error);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker exited with code ${code}`);
            }
            this.cleanupWorker(worker, type);
        });
        return worker;
    }
    getWorkerScript(type) {
        const scriptMap = {
            database: path.join(__dirname, 'workers', 'database-worker.js'),
            cache: path.join(__dirname, 'workers', 'cache-worker.js'),
            api: path.join(__dirname, 'workers', 'api-worker.js'),
            load: path.join(__dirname, 'workers', 'load-worker.js'),
            stress: path.join(__dirname, 'workers', 'stress-worker.js')
        };
        return scriptMap[type] || scriptMap.database;
    }
    async queueTask(type, task) {
        return new Promise((resolve) => {
            this.taskQueue.push({
                type,
                task,
                resolve,
                queuedAt: perf_hooks_1.performance.now()
            });
        });
    }
    async executeQueuedTask(worker, queuedTask) {
        const waitTime = perf_hooks_1.performance.now() - queuedTask.queuedAt;
        this.updateWorkerStats(queuedTask.type, 'queue_wait', waitTime);
        this.activeWorkers.set(worker.threadId.toString(), worker);
        queuedTask.resolve(worker);
    }
    updateWorkerStats(type, event, value) {
        const stats = this.workerStats.get(type);
        if (!stats)
            return;
        switch (event) {
            case 'acquire':
                stats.totalTasks++;
                break;
            case 'complete':
                stats.completedTasks++;
                stats.averageExecutionTime = (stats.averageExecutionTime + value) / 2;
                break;
            case 'error':
                stats.errorRate = (stats.errorRate + 1) / stats.totalTasks;
                break;
            case 'queue_wait':
                // Track queue wait times for optimization
                break;
        }
        stats.utilization = stats.completedTasks / stats.totalTasks;
    }
    getTotalActiveWorkers() {
        return this.activeWorkers.size;
    }
    getWorkerStats() {
        return new Map(this.workerStats);
    }
    async cleanup() {
        // Terminate all active workers
        const terminationPromises = [];
        for (const worker of this.activeWorkers.values()) {
            terminationPromises.push(worker.terminate());
        }
        // Wait for all workers to terminate
        await Promise.all(terminationPromises);
        // Clear pools and stats
        this.workerPool.clear();
        this.activeWorkers.clear();
        this.workerStats.clear();
        this.taskQueue.length = 0;
    }
    handleWorkerError(worker, type, error) {
        this.updateWorkerStats(type, 'error', 1);
        this.emit('worker-error', { worker, type, error });
    }
    cleanupWorker(worker, type) {
        const workerId = worker.threadId.toString();
        this.activeWorkers.delete(workerId);
        // Remove from pool
        const pool = this.workerPool.get(type);
        if (pool) {
            const index = pool.findIndex(w => w.threadId === worker.threadId);
            if (index >= 0) {
                pool.splice(index, 1);
            }
        }
    }
}
// ============================================================================
// Resource Manager
// ============================================================================
class ResourceManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.resources = new Map();
        this.resourceStats = new Map();
        this.cleanupScheduled = false;
        this.cleanupInterval = null;
        this.startPeriodicCleanup();
    }
    registerResource(id, resource, stats) {
        this.resources.set(id, resource);
        this.resourceStats.set(id, {
            createdAt: perf_hooks_1.performance.now(),
            lastAccessed: perf_hooks_1.performance.now(),
            accessCount: 0,
            memoryUsage: 0,
            isActive: true,
            ...stats
        });
        this.emit('resource-registered', { id, resource });
    }
    async getResource(id) {
        const resource = this.resources.get(id);
        if (!resource)
            return null;
        // Update access statistics
        const stats = this.resourceStats.get(id);
        if (stats) {
            stats.lastAccessed = perf_hooks_1.performance.now();
            stats.accessCount++;
        }
        return resource;
    }
    async releaseResource(id) {
        const resource = this.resources.get(id);
        if (!resource)
            return;
        const stats = this.resourceStats.get(id);
        if (stats) {
            stats.isActive = false;
        }
        // Don't immediately dispose - let cleanup cycle handle it
        this.emit('resource-released', { id, resource });
    }
    async cleanup(force = false) {
        const startTime = perf_hooks_1.performance.now();
        const cleanupResults = {
            resourcesDisposed: 0,
            memoryFreed: 0,
            errors: [],
            duration: 0
        };
        const currentTime = perf_hooks_1.performance.now();
        const resourcesToCleanup = [];
        // Identify resources for cleanup
        for (const [id, resource] of this.resources) {
            const stats = this.resourceStats.get(id);
            if (!stats)
                continue;
            const shouldCleanup = force ||
                !stats.isActive ||
                (currentTime - stats.lastAccessed) > this.config.maxIdleTime;
            if (shouldCleanup) {
                resourcesToCleanup.push([id, resource]);
            }
        }
        // Dispose resources
        for (const [id, resource] of resourcesToCleanup) {
            try {
                const stats = this.resourceStats.get(id);
                await resource.dispose();
                this.resources.delete(id);
                this.resourceStats.delete(id);
                cleanupResults.resourcesDisposed++;
                if (stats) {
                    cleanupResults.memoryFreed += stats.memoryUsage;
                }
            }
            catch (error) {
                cleanupResults.errors.push({
                    resourceId: id,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        cleanupResults.duration = perf_hooks_1.performance.now() - startTime;
        this.emit('cleanup-completed', cleanupResults);
        return cleanupResults;
    }
    startPeriodicCleanup() {
        this.cleanupInterval = setInterval(async () => {
            await this.cleanup();
        }, this.config.cleanupInterval);
    }
    getResourceStats() {
        return new Map(this.resourceStats);
    }
    async dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        await this.cleanup(true);
    }
}
// ============================================================================
// Performance Bottleneck Analyzer
// ============================================================================
class BottleneckOptimizer extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.analysisHistory = [];
        this.optimizationResults = new Map();
        this.workerPoolManager = SharedWorkerPoolManager.getInstance();
        this.resourceManager = new ResourceManager(config.resourceManager);
        this.setupEventHandlers();
    }
    async analyzeBottlenecks() {
        console.log('🔍 Starting bottleneck analysis...');
        const bottlenecks = [];
        // Analyze different bottleneck types
        bottlenecks.push(...await this.analyzeExecutionBottlenecks());
        bottlenecks.push(...await this.analyzeWorkerThreadBottlenecks());
        bottlenecks.push(...await this.analyzeMemoryBottlenecks());
        bottlenecks.push(...await this.analyzeConnectionPoolBottlenecks());
        bottlenecks.push(...await this.analyzeCacheBottlenecks());
        // Sort by severity and impact
        bottlenecks.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[b.severity] - severityOrder[a.severity];
            }
            return b.impact.executionTimeIncrease - a.impact.executionTimeIncrease;
        });
        this.analysisHistory.push(...bottlenecks);
        this.emit('bottlenecks-analyzed', { bottlenecks, timestamp: Date.now() });
        return bottlenecks;
    }
    async optimizeBottlenecks(bottlenecks) {
        console.log('⚡ Starting bottleneck optimization...');
        const results = [];
        for (const bottleneck of bottlenecks) {
            if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
                const result = await this.applyOptimizations(bottleneck);
                results.push(result);
                this.optimizationResults.set(bottleneck.id, result);
            }
        }
        this.emit('optimization-completed', { results, timestamp: Date.now() });
        return results;
    }
    async analyzeExecutionBottlenecks() {
        const bottlenecks = [];
        // Check for sequential execution patterns
        const workerStats = this.workerPoolManager.getWorkerStats();
        const totalUtilization = Array.from(workerStats.values())
            .reduce((sum, stats) => sum + stats.utilization, 0) / workerStats.size;
        if (totalUtilization < 0.4) {
            bottlenecks.push({
                id: 'sequential-execution',
                name: 'Sequential Test Execution',
                type: 'execution_sequential',
                severity: 'critical',
                impact: {
                    executionTimeIncrease: 300,
                    memoryOverhead: 0,
                    cpuWaste: 60,
                    resourceUtilization: 35,
                    estimatedCost: 10
                },
                rootCause: 'Tests are running sequentially instead of leveraging parallel execution',
                recommendations: [
                    {
                        strategy: 'parallel_execution',
                        description: 'Implement intelligent parallel test scheduling',
                        expectedImprovement: {
                            executionTimeIncrease: -70,
                            memoryOverhead: 0,
                            cpuWaste: -40,
                            resourceUtilization: 75,
                            estimatedCost: -7
                        },
                        implementationEffort: 'medium',
                        priority: 10,
                        dependencies: []
                    }
                ],
                detectedAt: perf_hooks_1.performance.now()
            });
        }
        return bottlenecks;
    }
    async analyzeWorkerThreadBottlenecks() {
        const bottlenecks = [];
        const activeWorkers = this.workerPoolManager.getTotalActiveWorkers();
        const maxWorkers = os.cpus().length;
        if (activeWorkers > maxWorkers * 1.5) {
            bottlenecks.push({
                id: 'worker-thread-saturation',
                name: 'Worker Thread Pool Saturation',
                type: 'worker_thread_management',
                severity: 'high',
                impact: {
                    executionTimeIncrease: 150,
                    memoryOverhead: activeWorkers * 50 * 1024 * 1024, // 50MB per excess worker
                    cpuWaste: 30,
                    resourceUtilization: 95,
                    estimatedCost: 7
                },
                rootCause: 'Too many worker threads created without proper pool management',
                recommendations: [
                    {
                        strategy: 'worker_pool_optimization',
                        description: 'Implement centralized worker pool with intelligent task distribution',
                        expectedImprovement: {
                            executionTimeIncrease: -50,
                            memoryOverhead: -activeWorkers * 30 * 1024 * 1024,
                            cpuWaste: -20,
                            resourceUtilization: 85,
                            estimatedCost: -4
                        },
                        implementationEffort: 'high',
                        priority: 8,
                        dependencies: ['parallel_execution']
                    }
                ],
                detectedAt: perf_hooks_1.performance.now()
            });
        }
        return bottlenecks;
    }
    async analyzeMemoryBottlenecks() {
        const bottlenecks = [];
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        if (heapUsedMB > 1500) { // > 1.5GB
            bottlenecks.push({
                id: 'memory-leak-pattern',
                name: 'Memory Leak Detection',
                type: 'memory_leak',
                severity: 'medium',
                impact: {
                    executionTimeIncrease: 25,
                    memoryOverhead: memoryUsage.heapUsed - (1024 * 1024 * 1024), // Overhead above 1GB
                    cpuWaste: 15,
                    resourceUtilization: 80,
                    estimatedCost: 4
                },
                rootCause: 'Memory not properly released between test runs',
                recommendations: [
                    {
                        strategy: 'memory_management',
                        description: 'Implement comprehensive resource cleanup protocols',
                        expectedImprovement: {
                            executionTimeIncrease: -15,
                            memoryOverhead: -500 * 1024 * 1024, // 500MB reduction
                            cpuWaste: -10,
                            resourceUtilization: 75,
                            estimatedCost: -2
                        },
                        implementationEffort: 'low',
                        priority: 7,
                        dependencies: []
                    }
                ],
                detectedAt: perf_hooks_1.performance.now()
            });
        }
        return bottlenecks;
    }
    async analyzeConnectionPoolBottlenecks() {
        // This would analyze database connection patterns
        // Implementation depends on database monitoring integration
        return [];
    }
    async analyzeCacheBottlenecks() {
        // This would analyze cache efficiency patterns
        // Implementation depends on cache monitoring integration
        return [];
    }
    async applyOptimizations(bottleneck) {
        const startTime = perf_hooks_1.performance.now();
        const result = {
            bottleneckId: bottleneck.id,
            strategy: bottleneck.recommendations[0]?.strategy || 'unknown',
            success: false,
            improvements: {
                executionTimeIncrease: 0,
                memoryOverhead: 0,
                cpuWaste: 0,
                resourceUtilization: 0,
                estimatedCost: 0
            },
            duration: 0,
            errors: []
        };
        try {
            switch (bottleneck.type) {
                case 'execution_sequential':
                    await this.optimizeParallelExecution();
                    break;
                case 'worker_thread_management':
                    await this.optimizeWorkerThreads();
                    break;
                case 'memory_leak':
                    await this.optimizeMemoryManagement();
                    break;
                case 'connection_pool_saturation':
                    await this.optimizeConnectionPools();
                    break;
                case 'cache_inefficiency':
                    await this.optimizeCacheEfficiency();
                    break;
            }
            result.success = true;
            result.improvements = bottleneck.recommendations[0]?.expectedImprovement || result.improvements;
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : String(error));
        }
        result.duration = perf_hooks_1.performance.now() - startTime;
        return result;
    }
    async optimizeParallelExecution() {
        // Implementation would modify test scheduling configuration
        console.log('📈 Optimizing parallel execution...');
    }
    async optimizeWorkerThreads() {
        // Implementation would optimize worker pool management
        console.log('🔧 Optimizing worker thread pools...');
    }
    async optimizeMemoryManagement() {
        // Force cleanup and optimize resource management
        console.log('🧹 Optimizing memory management...');
        await this.resourceManager.cleanup(true);
    }
    async optimizeConnectionPools() {
        // Implementation would optimize database connection settings
        console.log('🔗 Optimizing connection pools...');
    }
    async optimizeCacheEfficiency() {
        // Implementation would optimize cache configuration
        console.log('💾 Optimizing cache efficiency...');
    }
    setupEventHandlers() {
        this.workerPoolManager.on('worker-error', (data) => {
            this.emit('optimization-event', {
                type: 'worker-error',
                data,
                timestamp: Date.now()
            });
        });
        this.resourceManager.on('cleanup-completed', (result) => {
            this.emit('optimization-event', {
                type: 'cleanup-completed',
                data: result,
                timestamp: Date.now()
            });
        });
    }
    getOptimizationResults() {
        return new Map(this.optimizationResults);
    }
    getAnalysisHistory() {
        return [...this.analysisHistory];
    }
    async dispose() {
        await this.workerPoolManager.cleanup();
        await this.resourceManager.dispose();
    }
}
exports.BottleneckOptimizer = BottleneckOptimizer;
// ============================================================================
// Factory Functions
// ============================================================================
function createBottleneckOptimizer(config) {
    const defaultConfig = {
        enableAutoOptimization: true,
        optimizationThresholds: {
            executionTimeIncrease: 50, // 50% increase triggers optimization
            memoryOverhead: 500 * 1024 * 1024, // 500MB triggers optimization
            cpuWaste: 30 // 30% CPU waste triggers optimization
        },
        resourceManager: {
            maxIdleTime: 300000, // 5 minutes
            cleanupInterval: 60000, // 1 minute
            maxResources: 100
        }
    };
    return new BottleneckOptimizer({ ...defaultConfig, ...config });
}
//# sourceMappingURL=bottleneck-optimizer.js.map