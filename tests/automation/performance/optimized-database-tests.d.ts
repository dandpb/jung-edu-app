/**
 * Optimized Database Performance Tests - Memory Efficient Version
 * Lightweight database performance tests with controlled data sizes
 */
interface OptimizedDatabaseConfig {
    name: string;
    maxConnections: number;
    queryTimeout: number;
    maxDataSize: number;
    batchSize: number;
    memoryThreshold: number;
}
interface OptimizedQueryTest {
    name: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'JOIN';
    complexity: 'simple' | 'medium' | 'complex';
    maxRows: number;
    expectedTimeMs: number;
    query: string;
    parameters?: any[];
}
interface DatabaseTestResult {
    testName: string;
    success: boolean;
    duration: number;
    queriesExecuted: number;
    averageQueryTime: number;
    maxQueryTime: number;
    memoryUsage: {
        start: number;
        peak: number;
        end: number;
        growth: number;
    };
    queryResults: OptimizedQueryResult[];
    recommendations: string[];
}
interface OptimizedQueryResult {
    queryName: string;
    type: string;
    complexity: string;
    executionTime: number;
    rowsAffected: number;
    success: boolean;
    memoryImpact: number;
    withinThreshold: boolean;
}
declare class OptimizedConnectionPool {
    private maxConnections;
    private activeConnections;
    private connectionQueue;
    private connections;
    constructor(maxConnections?: number);
    getConnection(): Promise<MockConnection>;
    releaseConnection(connection: MockConnection): void;
    getStats(): {
        active: number;
        max: number;
        queued: number;
    };
    close(): void;
}
declare class MockConnection {
    private id;
    private connected;
    constructor(id: number);
    query(sql: string, params?: any[]): Promise<MockQueryResult>;
    private analyzeQueryComplexity;
    private getSimulatedExecutionTime;
    private generateMockRows;
    private generateSelectResults;
    private getExpectedRowCount;
    private sleep;
    close(): void;
    isConnected(): boolean;
}
interface MockQueryResult {
    rows: any[];
    rowCount: number;
    executionTime: number;
    queryPlan: string;
}
export declare class OptimizedDatabaseTests {
    private config;
    private testRunner;
    private dataFactory;
    private memoryManager;
    private connectionPool;
    constructor(config?: Partial<OptimizedDatabaseConfig>);
    /**
     * Run optimized database performance tests
     */
    runDatabasePerformanceTests(): Promise<DatabaseTestResult>;
    /**
     * Get optimized test queries with small data requirements
     */
    private getOptimizedQueries;
    /**
     * Execute an optimized query test
     */
    private executeOptimizedQuery;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    /**
     * Cleanup resources
     */
    private cleanup;
    private sleep;
}
/**
 * Jest test function for optimized database performance
 */
export declare function runOptimizedDatabaseTests(): Promise<DatabaseTestResult>;
/**
 * Create lightweight database test suite
 */
export declare function createOptimizedDatabaseTestSuite(): OptimizedDatabaseTests;
export { OptimizedDatabaseTests, OptimizedConnectionPool, MockConnection };
export type { OptimizedDatabaseConfig, OptimizedQueryTest, DatabaseTestResult, OptimizedQueryResult, MockQueryResult };
//# sourceMappingURL=optimized-database-tests.d.ts.map