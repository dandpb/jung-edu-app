import { EventEmitter } from 'events';
export interface TestSuite {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
    files: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    dependencies: string[];
    configuration: TestSuiteConfig;
    estimatedDuration: number;
    resourceRequirements: ResourceRequirements;
}
export interface TestSuiteConfig {
    parallel: boolean;
    maxWorkers?: number;
    timeout: number;
    retries: number;
    environment: Record<string, string>;
    setup?: string[];
    teardown?: string[];
}
export interface ResourceRequirements {
    memory: number;
    cpu: number;
    disk: number;
    network: boolean;
    database: boolean;
    redis: boolean;
}
export interface TestExecution {
    id: string;
    suiteId: string;
    workerId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    results?: TestResults;
    error?: Error;
    logs: string[];
    metrics: ExecutionMetrics;
}
export interface TestResults {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    coverage?: CoverageReport;
    artifacts: TestArtifact[];
}
export interface CoverageReport {
    lines: {
        total: number;
        covered: number;
        percentage: number;
    };
    branches: {
        total: number;
        covered: number;
        percentage: number;
    };
    functions: {
        total: number;
        covered: number;
        percentage: number;
    };
    statements: {
        total: number;
        covered: number;
        percentage: number;
    };
}
export interface TestArtifact {
    type: 'screenshot' | 'video' | 'report' | 'log' | 'coverage' | 'performance';
    name: string;
    path: string;
    size: number;
    metadata?: Record<string, any>;
}
export interface ExecutionMetrics {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkRequests: number;
    databaseQueries: number;
    cacheHits: number;
    cacheMisses: number;
}
export interface WorkerInfo {
    id: string;
    pid: number;
    status: 'idle' | 'busy' | 'error' | 'terminated';
    currentExecution?: string;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface ExecutionPlan {
    totalSuites: number;
    estimatedDuration: number;
    phases: ExecutionPhase[];
    dependencies: Map<string, string[]>;
    resourceAllocation: ResourceAllocation;
}
export interface ExecutionPhase {
    name: string;
    suites: string[];
    parallel: boolean;
    estimatedDuration: number;
    requiredResources: ResourceRequirements;
}
export interface ResourceAllocation {
    totalWorkers: number;
    workersByType: Map<string, number>;
    memoryPerWorker: number;
    reservedResources: ResourceRequirements;
}
export declare class TestExecutionManager extends EventEmitter {
    private workers;
    private executions;
    private pendingExecutions;
    private runningExecutions;
    private completedExecutions;
    private executionQueue;
    private logger;
    private maxWorkers;
    private resourceMonitor;
    constructor();
    /**
     * Plan test execution
     */
    planExecution(suites: TestSuite[]): Promise<ExecutionPlan>;
    /**
     * Execute test suites according to plan
     */
    executeTests(plan: ExecutionPlan): Promise<Map<string, TestResults>>;
    /**
     * Execute a single test suite
     */
    executeSuite(suite: TestSuite): Promise<TestResults>;
    /**
     * Cancel running executions
     */
    cancelExecution(executionId?: string): Promise<void>;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId?: string): TestExecution | TestExecution[];
    /**
     * Get worker status
     */
    getWorkerStatus(): WorkerInfo[];
    /**
     * Get execution metrics
     */
    getExecutionMetrics(): any;
    /**
     * Initialize worker pool
     */
    private initializeWorkers;
    /**
     * Create a new worker
     */
    private createWorker;
    /**
     * Handle worker messages
     */
    private handleWorkerMessage;
    /**
     * Handle worker errors
     */
    private handleWorkerError;
    /**
     * Handle worker exit
     */
    private handleWorkerExit;
    /**
     * Sort suites by priority and dependencies
     */
    private sortSuitesByPriority;
    /**
     * Build dependency graph
     */
    private buildDependencyGraph;
    /**
     * Create execution phases
     */
    private createExecutionPhases;
    /**
     * Additional helper methods...
     */
    private calculateResourceAllocation;
    private estimateExecutionDuration;
    private createEmptyMetrics;
    private aggregateResourceRequirements;
    private executePhase;
    private waitForAllExecutions;
    private generateFinalResults;
    private assignWorker;
    private runSuiteInWorker;
    private releaseWorker;
    private terminateWorker;
    private handleResourceWarning;
    private cleanup;
}
export declare const testExecutionManager: TestExecutionManager;
//# sourceMappingURL=test-execution-manager.d.ts.map