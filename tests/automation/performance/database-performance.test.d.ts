/**
 * Database Performance Testing Suite for jaqEdu Platform
 * Comprehensive database performance testing with query optimization analysis,
 * connection pool monitoring, and SQL performance profiling
 */
import { EventEmitter } from 'events';
interface DatabasePerformanceConfig {
    name: string;
    description: string;
    database: DatabaseConfig;
    testDuration: number;
    connectionPoolSize: number;
    concurrentConnections: number;
    queries: QueryTestConfig[];
    thresholds: DatabaseThresholds;
    scenarios: DatabaseScenario[];
    monitoring: DatabaseMonitoring;
}
interface DatabaseConfig {
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionTimeout: number;
    queryTimeout: number;
}
interface QueryTestConfig {
    name: string;
    type: QueryType;
    sql: string;
    parameters?: any[];
    expectedRows?: number;
    complexity: QueryComplexity;
    frequency: number;
    validation?: QueryValidation;
}
type QueryType = 'select' | 'insert' | 'update' | 'delete' | 'complex_join' | 'aggregation' | 'full_text_search' | 'analytical' | 'transaction';
type QueryComplexity = 'simple' | 'medium' | 'complex' | 'very_complex';
interface QueryValidation {
    expectedResultCount?: number;
    expectedFields?: string[];
    customValidator?: (results: any[]) => boolean;
}
interface DatabaseThresholds {
    queryTime: {
        simple: number;
        medium: number;
        complex: number;
        very_complex: number;
    };
    connectionTime: {
        warning: number;
        critical: number;
    };
    throughput: {
        minimum: number;
        target: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
    connectionPool: {
        utilizationWarning: number;
        utilizationCritical: number;
        queueDepthWarning: number;
        queueDepthCritical: number;
    };
}
interface DatabaseScenario {
    name: string;
    type: ScenarioType;
    duration: number;
    intensity: 'light' | 'moderate' | 'heavy' | 'extreme';
    parameters: any;
    expectedMetrics: ExpectedScenarioMetrics;
}
type ScenarioType = 'read_heavy' | 'write_heavy' | 'mixed_workload' | 'bulk_operations' | 'long_running_queries' | 'connection_stress' | 'deadlock_simulation' | 'index_analysis' | 'transaction_load';
interface ExpectedScenarioMetrics {
    averageQueryTime: number;
    maxQueryTime: number;
    throughput: number;
    errorRate: number;
    connectionUtilization: number;
}
interface DatabaseMonitoring {
    enabled: boolean;
    samplingInterval: number;
    metrics: MonitoredDatabaseMetric[];
    profiling: ProfilingConfig;
    indexAnalysis: boolean;
    lockAnalysis: boolean;
}
interface MonitoredDatabaseMetric {
    name: string;
    query?: string;
    threshold: number;
    critical: number;
}
interface ProfilingConfig {
    enabled: boolean;
    slowQueryThreshold: number;
    explainQueries: boolean;
    captureStackTraces: boolean;
}
interface DatabaseTestMetrics {
    testId: string;
    startTime: Date;
    endTime?: Date;
    queryMetrics: QueryMetrics[];
    connectionMetrics: ConnectionMetrics[];
    throughputMetrics: ThroughputMetrics[];
    errorMetrics: ErrorMetrics[];
    scenarioResults: DatabaseScenarioResult[];
    systemMetrics: DatabaseSystemMetrics[];
    indexAnalysis?: IndexAnalysisResult[];
    lockAnalysis?: LockAnalysisResult[];
}
interface QueryMetrics {
    queryId: string;
    queryName: string;
    queryType: QueryType;
    executionTime: number;
    rowsAffected: number;
    planningTime?: number;
    executionPlan?: any;
    timestamp: number;
    connectionId?: string;
    cacheHit?: boolean;
    indexesUsed?: string[];
}
interface ConnectionMetrics {
    timestamp: number;
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    queueDepth: number;
    connectionTime: number;
    connectionErrors: number;
    utilization: number;
}
interface ThroughputMetrics {
    timestamp: number;
    queriesPerSecond: number;
    transactionsPerSecond: number;
    dataTransferRate: number;
    queryTypes: Map<QueryType, number>;
}
interface ErrorMetrics {
    timestamp: number;
    errorType: string;
    errorCount: number;
    errorRate: number;
    queryType?: QueryType;
    errorMessage?: string;
}
interface DatabaseScenarioResult {
    scenario: string;
    type: ScenarioType;
    startTime: Date;
    endTime: Date;
    success: boolean;
    metrics: ScenarioMetrics;
    performance: ScenarioPerformance;
    issues: DatabaseIssue[];
}
interface ScenarioMetrics {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    p95QueryTime: number;
    p99QueryTime: number;
    throughput: number;
}
interface ScenarioPerformance {
    meetsExpectations: boolean;
    performanceScore: number;
    bottlenecks: string[];
    optimizationSuggestions: string[];
}
interface DatabaseIssue {
    type: 'warning' | 'error' | 'critical';
    category: 'performance' | 'connection' | 'query' | 'index' | 'lock';
    message: string;
    impact: 'low' | 'medium' | 'high';
    suggestion?: string;
    timestamp: number;
}
interface DatabaseSystemMetrics {
    timestamp: number;
    cpu: number;
    memory: number;
    diskIO: DiskIOMetrics;
    networkIO: NetworkIOMetrics;
    cacheMetrics: CacheMetrics;
}
interface DiskIOMetrics {
    readsPerSecond: number;
    writesPerSecond: number;
    readBytesPerSecond: number;
    writeBytesPerSecond: number;
    averageIOTime: number;
}
interface NetworkIOMetrics {
    connectionsPerSecond: number;
    bytesReceivedPerSecond: number;
    bytesSentPerSecond: number;
    packetsPerSecond: number;
}
interface CacheMetrics {
    bufferCacheHitRatio: number;
    sharedBuffersSize: number;
    effectiveCacheSize: number;
    cacheEvictions: number;
}
interface IndexAnalysisResult {
    tableName: string;
    indexName: string;
    indexType: string;
    usage: IndexUsage;
    performance: IndexPerformance;
    recommendations: string[];
}
interface IndexUsage {
    scans: number;
    tupleReads: number;
    tupleFetches: number;
    lastUsed?: Date;
    neverUsed: boolean;
}
interface IndexPerformance {
    selectivity: number;
    size: number;
    buildTime?: number;
    maintenanceCost: number;
}
interface LockAnalysisResult {
    timestamp: number;
    lockType: string;
    objectName: string;
    lockMode: string;
    waitTime: number;
    blockingQuery?: string;
    blockedQuery?: string;
    impact: 'low' | 'medium' | 'high';
}
export declare class DatabasePerformanceEngine extends EventEmitter {
    private config;
    private metrics;
    private workers;
    private monitoringInterval;
    private testActive;
    private connectionPool;
    constructor(config: DatabasePerformanceConfig);
    /**
     * Execute comprehensive database performance test
     */
    executeDatabasePerformanceTest(): Promise<DatabaseTestResult>;
    /**
     * Initialize database connection and setup
     */
    private initializeDatabase;
    /**
     * Execute warm-up phase to stabilize performance
     */
    private executeWarmupPhase;
    /**
     * Execute cool-down phase to capture final metrics
     */
    private executeCooldownPhase;
    /**
     * Execute database performance scenario
     */
    private executeDatabaseScenario;
    /**
     * Execute read-heavy scenario
     */
    private executeReadHeavyScenario;
    /**
     * Execute write-heavy scenario
     */
    private executeWriteHeavyScenario;
    /**
     * Execute mixed workload scenario
     */
    private executeMixedWorkloadScenario;
    /**
     * Execute bulk operations scenario
     */
    private executeBulkOperationsScenario;
    /**
     * Execute long running queries scenario
     */
    private executeLongRunningQueriesScenario;
    /**
     * Execute connection stress scenario
     */
    private executeConnectionStressScenario;
    /**
     * Execute deadlock simulation scenario
     */
    private executeDeadlockSimulationScenario;
    /**
     * Execute transaction load scenario
     */
    private executeTransactionLoadScenario;
    /**
     * Start database monitoring
     */
    private startDatabaseMonitoring;
    /**
     * Stop database monitoring
     */
    private stopMonitoring;
    /**
     * Spawn query workers
     */
    private spawnQueryWorkers;
    /**
     * Create individual query worker
     */
    private createQueryWorker;
    /**
     * Handle messages from worker threads
     */
    private handleWorkerMessage;
    /**
     * Execute query with metrics collection
     */
    private executeQuery;
    private initializeMetrics;
    private determineQueryType;
    private extractIndexesUsed;
    private recordQueryMetrics;
    private recordConnectionEvent;
    private recordDatabaseError;
    private captureConnectionMetrics;
    private captureThroughputMetrics;
    private captureSystemMetrics;
    private getRecentQueryMetrics;
    private aggregateQueryTypes;
    private calculatePercentile;
    private sleep;
    private waitForWorkers;
    private collectWorkerMetrics;
    private aggregateScenarioMetrics;
    private evaluateScenarioPerformance;
    private calculatePerformanceScore;
    private identifyBottlenecks;
    private generateOptimizationSuggestions;
    private stressConnection;
    private spawnDeadlockWorkers;
    private spawnTransactionWorkers;
    private checkDatabaseThresholds;
    private analyzeQueryPerformance;
    private analyzeConnectionPerformance;
    private analyzeIndexUsage;
    private analyzeLockContention;
    private generateDatabaseTestResult;
    private calculateOverallMetrics;
    private analyzeOverallPerformance;
    private calculatePerformanceGrade;
    private identifySystemBottlenecks;
    private analyzeTrends;
    private analyzeQueryPatterns;
    private analyzeConnectionPatterns;
    private generateDatabaseRecommendations;
    private saveResults;
    private cleanup;
}
interface DatabaseTestResult {
    testInfo: {
        testId: string;
        name: string;
        duration: number;
        startTime: Date;
        endTime: Date;
        databaseType: string;
    };
    overallMetrics: any;
    performanceAnalysis: any;
    scenarioResults: DatabaseScenarioResult[];
    queryAnalysis: any;
    connectionAnalysis: any;
    indexAnalysis: IndexAnalysisResult[];
    lockAnalysis: LockAnalysisResult[];
    recommendations: string[];
    rawMetrics: DatabaseTestMetrics;
}
export { DatabasePerformanceEngine, DatabasePerformanceConfig, DatabaseTestResult };
//# sourceMappingURL=database-performance.test.d.ts.map