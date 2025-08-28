"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testExecutionManager = exports.TestExecutionManager = void 0;
const events_1 = require("events");
const worker_threads_1 = require("worker_threads");
const os_1 = require("os");
const unified_test_config_1 = require("../config/unified-test.config");
const logger_1 = require("../utils/logger");
// Test execution manager
class TestExecutionManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
        this.executions = new Map();
        this.pendingExecutions = [];
        this.runningExecutions = new Set();
        this.completedExecutions = new Map();
        this.executionQueue = [];
        this.logger = new logger_1.Logger('TestExecutionManager');
        this.maxWorkers = process.env.CI ? 2 : Math.max(1, (0, os_1.cpus)().length - 1);
        this.resourceMonitor = new ResourceMonitor();
        // Set up resource monitoring
        this.resourceMonitor.on('resource-warning', (warning) => {
            this.handleResourceWarning(warning);
        });
    }
    /**
     * Plan test execution
     */
    async planExecution(suites) {
        this.logger.info(`Planning execution for ${suites.length} test suites`);
        // Sort suites by priority and dependencies
        const sortedSuites = this.sortSuitesByPriority(suites);
        const dependencyGraph = this.buildDependencyGraph(sortedSuites);
        // Create execution phases
        const phases = this.createExecutionPhases(sortedSuites, dependencyGraph);
        // Calculate resource requirements
        const resourceAllocation = this.calculateResourceAllocation(phases);
        // Estimate total duration
        const estimatedDuration = this.estimateExecutionDuration(phases);
        const plan = {
            totalSuites: suites.length,
            estimatedDuration,
            phases,
            dependencies: dependencyGraph,
            resourceAllocation
        };
        this.emit('execution-planned', plan);
        return plan;
    }
    /**
     * Execute test suites according to plan
     */
    async executeTests(plan) {
        this.logger.info(`Starting test execution with ${plan.totalSuites} suites`);
        try {
            // Initialize workers
            await this.initializeWorkers(plan.resourceAllocation.totalWorkers);
            // Start resource monitoring
            await this.resourceMonitor.start();
            // Execute phases sequentially, but suites within phases in parallel
            for (const phase of plan.phases) {
                await this.executePhase(phase);
            }
            // Wait for all executions to complete
            await this.waitForAllExecutions();
            // Generate final results
            const results = this.generateFinalResults();
            this.emit('execution-completed', results);
            return results;
        }
        catch (error) {
            this.logger.error('Test execution failed', error);
            this.emit('execution-failed', error);
            throw error;
        }
        finally {
            // Cleanup
            await this.cleanup();
        }
    }
    /**
     * Execute a single test suite
     */
    async executeSuite(suite) {
        const execution = {
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            suiteId: suite.id,
            status: 'pending',
            logs: [],
            metrics: this.createEmptyMetrics()
        };
        this.executions.set(execution.id, execution);
        this.emit('execution-started', execution);
        try {
            // Find available worker
            const worker = await this.assignWorker(execution);
            // Update execution status
            execution.status = 'running';
            execution.startTime = new Date();
            execution.workerId = worker.id;
            // Execute the suite
            const results = await this.runSuiteInWorker(worker, suite, execution);
            // Update execution with results
            execution.status = 'completed';
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
            execution.results = results;
            this.completedExecutions.set(suite.id, results);
            this.emit('execution-completed', execution);
            return results;
        }
        catch (error) {
            execution.status = 'failed';
            execution.error = error;
            execution.endTime = new Date();
            this.logger.error(`Suite execution failed: ${suite.name}`, error);
            this.emit('execution-failed', execution);
            throw error;
        }
        finally {
            // Release worker
            if (execution.workerId) {
                this.releaseWorker(execution.workerId);
            }
            this.runningExecutions.delete(execution.id);
        }
    }
    /**
     * Cancel running executions
     */
    async cancelExecution(executionId) {
        if (executionId) {
            // Cancel specific execution
            const execution = this.executions.get(executionId);
            if (execution && execution.status === 'running') {
                execution.status = 'cancelled';
                if (execution.workerId) {
                    await this.terminateWorker(execution.workerId);
                }
                this.emit('execution-cancelled', execution);
            }
        }
        else {
            // Cancel all running executions
            const runningIds = Array.from(this.runningExecutions);
            for (const id of runningIds) {
                await this.cancelExecution(id);
            }
        }
    }
    /**
     * Get execution status
     */
    getExecutionStatus(executionId) {
        if (executionId) {
            return this.executions.get(executionId);
        }
        else {
            return Array.from(this.executions.values());
        }
    }
    /**
     * Get worker status
     */
    getWorkerStatus() {
        return Array.from(this.workers.values());
    }
    /**
     * Get execution metrics
     */
    getExecutionMetrics() {
        const executions = Array.from(this.executions.values());
        const completed = executions.filter(e => e.status === 'completed');
        const failed = executions.filter(e => e.status === 'failed');
        return {
            total: executions.length,
            completed: completed.length,
            failed: failed.length,
            running: this.runningExecutions.size,
            pending: this.pendingExecutions.length,
            averageDuration: completed.length > 0 ?
                completed.reduce((sum, e) => sum + (e.duration || 0), 0) / completed.length : 0,
            successRate: executions.length > 0 ? completed.length / executions.length : 0,
            workers: {
                total: this.workers.size,
                active: Array.from(this.workers.values()).filter(w => w.status === 'busy').length,
                idle: Array.from(this.workers.values()).filter(w => w.status === 'idle').length
            }
        };
    }
    /**
     * Initialize worker pool
     */
    async initializeWorkers(workerCount) {
        this.logger.info(`Initializing ${workerCount} workers`);
        const promises = Array.from({ length: workerCount }, (_, i) => this.createWorker(`worker_${i}`));
        await Promise.all(promises);
        this.logger.info(`Successfully initialized ${this.workers.size} workers`);
    }
    /**
     * Create a new worker
     */
    async createWorker(workerId) {
        const workerScript = require.resolve('../workers/test-worker.js');
        const worker = new worker_threads_1.Worker(workerScript, {
            workerData: {
                workerId,
                config: unified_test_config_1.testConfig
            }
        });
        const workerInfo = {
            id: workerId,
            pid: worker.threadId,
            status: 'idle',
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            uptime: Date.now(),
            memoryUsage: 0,
            cpuUsage: 0
        };
        // Set up worker event handlers
        worker.on('message', (message) => {
            this.handleWorkerMessage(workerId, message);
        });
        worker.on('error', (error) => {
            this.handleWorkerError(workerId, error);
        });
        worker.on('exit', (code) => {
            this.handleWorkerExit(workerId, code);
        });
        this.workers.set(workerId, workerInfo);
        return workerInfo;
    }
    /**
     * Handle worker messages
     */
    handleWorkerMessage(workerId, message) {
        const worker = this.workers.get(workerId);
        if (!worker)
            return;
        switch (message.type) {
            case 'execution-progress':
                this.emit('execution-progress', {
                    workerId,
                    executionId: message.executionId,
                    progress: message.progress
                });
                break;
            case 'execution-log':
                const execution = this.executions.get(message.executionId);
                if (execution) {
                    execution.logs.push(message.log);
                }
                break;
            case 'worker-stats':
                worker.memoryUsage = message.memoryUsage;
                worker.cpuUsage = message.cpuUsage;
                break;
        }
    }
    /**
     * Handle worker errors
     */
    handleWorkerError(workerId, error) {
        this.logger.error(`Worker ${workerId} error`, error);
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.status = 'error';
            if (worker.currentExecution) {
                const execution = this.executions.get(worker.currentExecution);
                if (execution) {
                    execution.status = 'failed';
                    execution.error = error;
                }
            }
        }
    }
    /**
     * Handle worker exit
     */
    handleWorkerExit(workerId, code) {
        this.logger.info(`Worker ${workerId} exited with code ${code}`);
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.status = 'terminated';
        }
        this.workers.delete(workerId);
    }
    // ... Additional private methods for execution planning, resource management, etc.
    /**
     * Sort suites by priority and dependencies
     */
    sortSuitesByPriority(suites) {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return suites.sort((a, b) => {
            // First sort by priority
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            // Then by estimated duration (shorter first for better parallelization)
            return a.estimatedDuration - b.estimatedDuration;
        });
    }
    /**
     * Build dependency graph
     */
    buildDependencyGraph(suites) {
        const graph = new Map();
        for (const suite of suites) {
            graph.set(suite.id, suite.dependencies);
        }
        return graph;
    }
    /**
     * Create execution phases
     */
    createExecutionPhases(suites, dependencies) {
        const phases = [];
        const processed = new Set();
        while (processed.size < suites.length) {
            const currentPhase = [];
            // Find suites with no unprocessed dependencies
            for (const suite of suites) {
                if (processed.has(suite.id))
                    continue;
                const deps = dependencies.get(suite.id) || [];
                const unresolvedDeps = deps.filter(dep => !processed.has(dep));
                if (unresolvedDeps.length === 0) {
                    currentPhase.push(suite);
                }
            }
            if (currentPhase.length === 0) {
                throw new Error('Circular dependency detected in test suites');
            }
            // Create phase
            const phase = {
                name: `Phase ${phases.length + 1}`,
                suites: currentPhase.map(s => s.id),
                parallel: currentPhase.every(s => s.configuration.parallel),
                estimatedDuration: Math.max(...currentPhase.map(s => s.estimatedDuration)),
                requiredResources: this.aggregateResourceRequirements(currentPhase.map(s => s.resourceRequirements))
            };
            phases.push(phase);
            // Mark suites as processed
            for (const suite of currentPhase) {
                processed.add(suite.id);
            }
        }
        return phases;
    }
    /**
     * Additional helper methods...
     */
    calculateResourceAllocation(phases) {
        // Implementation for resource allocation calculation
        return {
            totalWorkers: this.maxWorkers,
            workersByType: new Map(),
            memoryPerWorker: 512, // MB
            reservedResources: {
                memory: 256,
                cpu: 10,
                disk: 100,
                network: true,
                database: true,
                redis: true
            }
        };
    }
    estimateExecutionDuration(phases) {
        // Implementation for duration estimation
        return phases.reduce((total, phase) => total + phase.estimatedDuration, 0);
    }
    createEmptyMetrics() {
        return {
            memoryUsage: 0,
            cpuUsage: 0,
            diskUsage: 0,
            networkRequests: 0,
            databaseQueries: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    aggregateResourceRequirements(requirements) {
        // Implementation for aggregating resource requirements
        return requirements.reduce((agg, req) => ({
            memory: agg.memory + req.memory,
            cpu: Math.max(agg.cpu, req.cpu),
            disk: agg.disk + req.disk,
            network: agg.network || req.network,
            database: agg.database || req.database,
            redis: agg.redis || req.redis
        }), {
            memory: 0,
            cpu: 0,
            disk: 0,
            network: false,
            database: false,
            redis: false
        });
    }
    // Placeholder implementations for other private methods
    async executePhase(phase) {
        this.logger.info(`Executing phase: ${phase.name}`);
        // Implementation for phase execution
    }
    async waitForAllExecutions() {
        // Implementation for waiting for all executions to complete
    }
    generateFinalResults() {
        return this.completedExecutions;
    }
    async assignWorker(execution) {
        // Implementation for worker assignment
        const idleWorker = Array.from(this.workers.values()).find(w => w.status === 'idle');
        if (idleWorker) {
            idleWorker.status = 'busy';
            idleWorker.currentExecution = execution.id;
            return idleWorker;
        }
        throw new Error('No available workers');
    }
    async runSuiteInWorker(worker, suite, execution) {
        // Implementation for running suite in worker
        return {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            flaky: 0,
            artifacts: []
        };
    }
    releaseWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.status = 'idle';
            worker.currentExecution = undefined;
        }
    }
    async terminateWorker(workerId) {
        // Implementation for worker termination
        this.workers.delete(workerId);
    }
    handleResourceWarning(warning) {
        this.logger.warn('Resource warning', warning);
        // Implementation for handling resource warnings
    }
    async cleanup() {
        // Stop resource monitoring
        await this.resourceMonitor.stop();
        // Terminate all workers
        const workerIds = Array.from(this.workers.keys());
        for (const workerId of workerIds) {
            await this.terminateWorker(workerId);
        }
        this.logger.info('Test execution manager cleanup completed');
    }
}
exports.TestExecutionManager = TestExecutionManager;
// Resource monitor class
class ResourceMonitor extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.monitoring = false;
    }
    async start() {
        if (this.monitoring)
            return;
        this.monitoring = true;
        this.interval = setInterval(() => {
            this.checkResources();
        }, 5000); // Check every 5 seconds
    }
    async stop() {
        this.monitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    checkResources() {
        // Implementation for resource monitoring
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        // Emit warnings if thresholds exceeded
        if (memoryUsage.heapUsed > unified_test_config_1.testConfig.performance.maxMemoryUsage) {
            this.emit('resource-warning', {
                type: 'memory',
                current: memoryUsage.heapUsed,
                threshold: unified_test_config_1.testConfig.performance.maxMemoryUsage
            });
        }
    }
}
// Export singleton instance
exports.testExecutionManager = new TestExecutionManager();
//# sourceMappingURL=test-execution-manager.js.map