/**
 * Optimized Database Performance Tests - Memory Efficient Version
 * Lightweight database performance tests with controlled data sizes
 */

import { performance } from 'perf_hooks';
import {
  OptimizedTestRunner,
  OptimizedDataFactory,
  MemoryManager,
  measureExecution
} from './memory-efficient-test-utils';

// ============================================================================
// Optimized Database Test Configuration
// ============================================================================

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

// ============================================================================
// Mock Database Connection Pool
// ============================================================================

class OptimizedConnectionPool {
  private maxConnections: number;
  private activeConnections: number = 0;
  private connectionQueue: Array<() => void> = [];
  private connections: MockConnection[] = [];

  constructor(maxConnections: number = 5) {
    this.maxConnections = maxConnections;
  }

  async getConnection(): Promise<MockConnection> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      const connection = new MockConnection(this.activeConnections);
      this.connections.push(connection);
      return connection;
    }

    return new Promise((resolve) => {
      this.connectionQueue.push(() => {
        this.activeConnections++;
        const connection = new MockConnection(this.activeConnections);
        this.connections.push(connection);
        resolve(connection);
      });
    });
  }

  releaseConnection(connection: MockConnection): void {
    const index = this.connections.indexOf(connection);
    if (index > -1) {
      this.connections.splice(index, 1);
      this.activeConnections--;
      
      if (this.connectionQueue.length > 0) {
        const next = this.connectionQueue.shift();
        if (next) next();
      }
    }
  }

  getStats(): { active: number; max: number; queued: number } {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      queued: this.connectionQueue.length
    };
  }

  close(): void {
    this.connections.forEach(conn => conn.close());
    this.connections = [];
    this.activeConnections = 0;
    this.connectionQueue = [];
  }
}

class MockConnection {
  private id: number;
  private connected: boolean = true;

  constructor(id: number) {
    this.id = id;
  }

  async query(sql: string, params: any[] = []): Promise<MockQueryResult> {
    if (!this.connected) {
      throw new Error('Connection closed');
    }

    // Simulate query execution time based on complexity
    const complexity = this.analyzeQueryComplexity(sql);
    const executionTime = this.getSimulatedExecutionTime(complexity, params.length);
    
    await this.sleep(executionTime);

    return {
      rows: this.generateMockRows(sql, params),
      rowCount: this.getExpectedRowCount(sql),
      executionTime,
      queryPlan: `Mock execution plan for: ${sql.substring(0, 50)}...`
    };
  }

  private analyzeQueryComplexity(sql: string): 'simple' | 'medium' | 'complex' {
    const upperSql = sql.toUpperCase();
    
    if (upperSql.includes('JOIN') && upperSql.includes('WHERE')) {
      return 'complex';
    } else if (upperSql.includes('JOIN') || upperSql.includes('GROUP BY') || upperSql.includes('ORDER BY')) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  private getSimulatedExecutionTime(complexity: 'simple' | 'medium' | 'complex', paramCount: number): number {
    let baseTime = 5;
    
    switch (complexity) {
      case 'simple':
        baseTime = 5;
        break;
      case 'medium':
        baseTime = 15;
        break;
      case 'complex':
        baseTime = 30;
        break;
    }

    // Add parameter processing time
    baseTime += paramCount * 2;
    
    // Add random variation (±20%)
    const variation = baseTime * 0.2 * (Math.random() - 0.5);
    return Math.max(1, baseTime + variation);
  }

  private generateMockRows(sql: string, params: any[]): any[] {
    const upperSql = sql.toUpperCase();
    
    if (upperSql.includes('SELECT')) {
      return this.generateSelectResults(sql);
    } else if (upperSql.includes('INSERT')) {
      return [{ insertedId: Math.floor(Math.random() * 1000) + 1 }];
    } else if (upperSql.includes('UPDATE')) {
      return [{ affectedRows: Math.floor(Math.random() * 10) + 1 }];
    } else if (upperSql.includes('DELETE')) {
      return [{ deletedRows: Math.floor(Math.random() * 5) + 1 }];
    }
    
    return [];
  }

  private generateSelectResults(sql: string): any[] {
    // Generate small result sets to avoid memory issues
    const maxRows = 20;
    const rowCount = Math.floor(Math.random() * maxRows) + 1;
    
    return Array.from({ length: rowCount }, (_, i) => ({
      id: i + 1,
      name: `Test Row ${i + 1}`,
      created_at: new Date().toISOString(),
      value: Math.random() * 100
    }));
  }

  private getExpectedRowCount(sql: string): number {
    const upperSql = sql.toUpperCase();
    
    if (upperSql.includes('SELECT')) {
      return Math.floor(Math.random() * 20) + 1;
    }
    return 1;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  close(): void {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

interface MockQueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  queryPlan: string;
}

// ============================================================================
// Optimized Database Performance Test Engine
// ============================================================================

export class OptimizedDatabaseTests {
  private config: OptimizedDatabaseConfig;
  private testRunner: OptimizedTestRunner;
  private dataFactory: OptimizedDataFactory;
  private memoryManager: MemoryManager;
  private connectionPool: OptimizedConnectionPool;

  constructor(config?: Partial<OptimizedDatabaseConfig>) {
    this.config = {
      name: 'Optimized Database Performance Tests',
      maxConnections: 3, // Reduced from typical 10-20
      queryTimeout: 5000, // 5 seconds
      maxDataSize: 50, // Max 50 rows per test
      batchSize: 10, // Process in small batches
      memoryThreshold: 200, // 200MB threshold
      ...config
    };

    this.testRunner = new OptimizedTestRunner(this.config.memoryThreshold);
    this.dataFactory = OptimizedDataFactory.getInstance();
    this.memoryManager = new MemoryManager(this.config.memoryThreshold);
    this.connectionPool = new OptimizedConnectionPool(this.config.maxConnections);
  }

  /**
   * Run optimized database performance tests
   */
  async runDatabasePerformanceTests(): Promise<DatabaseTestResult> {
    console.log('🗄️ Starting Optimized Database Performance Tests');
    console.log(`  Max Connections: ${this.config.maxConnections}`);
    console.log(`  Max Data Size: ${this.config.maxDataSize} rows`);
    console.log(`  Memory Threshold: ${this.config.memoryThreshold}MB`);

    const startTime = performance.now();
    const startMemory = this.memoryManager.checkMemoryUsage();

    try {
      // Define optimized test queries
      const queries = this.getOptimizedQueries();
      const queryResults: OptimizedQueryResult[] = [];

      // Execute queries sequentially to control memory usage
      for (const query of queries) {
        const result = await this.executeOptimizedQuery(query);
        queryResults.push(result);

        // Cleanup between queries
        if (global.gc) {
          global.gc();
        }
        
        // Brief pause to allow memory stabilization
        await this.sleep(100);
      }

      const endTime = performance.now();
      const endMemory = this.memoryManager.checkMemoryUsage();
      const peakMemory = Math.max(startMemory, endMemory);

      const testResult: DatabaseTestResult = {
        testName: this.config.name,
        success: queryResults.every(r => r.success),
        duration: endTime - startTime,
        queriesExecuted: queryResults.length,
        averageQueryTime: queryResults.reduce((sum, r) => sum + r.executionTime, 0) / queryResults.length,
        maxQueryTime: Math.max(...queryResults.map(r => r.executionTime)),
        memoryUsage: {
          start: startMemory,
          peak: peakMemory,
          end: endMemory,
          growth: endMemory - startMemory
        },
        queryResults,
        recommendations: this.generateRecommendations(queryResults, {
          start: startMemory,
          peak: peakMemory,
          end: endMemory,
          growth: endMemory - startMemory
        })
      };

      console.log(`✅ Database tests completed in ${(testResult.duration / 1000).toFixed(2)}s`);
      console.log(`📊 ${queryResults.filter(r => r.success).length}/${queryResults.length} queries passed`);

      return testResult;

    } catch (error) {
      console.error('❌ Database performance tests failed:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Get optimized test queries with small data requirements
   */
  private getOptimizedQueries(): OptimizedQueryTest[] {
    return [
      {
        name: 'Simple User Select',
        type: 'SELECT',
        complexity: 'simple',
        maxRows: 10,
        expectedTimeMs: 20,
        query: 'SELECT id, name, email FROM users LIMIT 10'
      },
      {
        name: 'Course with Modules Join',
        type: 'JOIN',
        complexity: 'medium',
        maxRows: 15,
        expectedTimeMs: 40,
        query: `SELECT c.title, m.name 
                FROM courses c 
                JOIN modules m ON c.id = m.course_id 
                LIMIT 15`
      },
      {
        name: 'User Count Aggregation',
        type: 'SELECT',
        complexity: 'medium',
        maxRows: 1,
        expectedTimeMs: 30,
        query: 'SELECT COUNT(*) as user_count FROM users'
      },
      {
        name: 'Recent Activity Query',
        type: 'SELECT',
        complexity: 'medium',
        maxRows: 20,
        expectedTimeMs: 35,
        query: `SELECT u.name, ua.action, ua.created_at 
                FROM users u 
                JOIN user_activities ua ON u.id = ua.user_id 
                WHERE ua.created_at > NOW() - INTERVAL 1 DAY 
                ORDER BY ua.created_at DESC 
                LIMIT 20`
      },
      {
        name: 'Simple Insert',
        type: 'INSERT',
        complexity: 'simple',
        maxRows: 1,
        expectedTimeMs: 15,
        query: 'INSERT INTO test_table (name, value) VALUES (?, ?)',
        parameters: ['test_record', 42]
      }
    ];
  }

  /**
   * Execute an optimized query test
   */
  private async executeOptimizedQuery(queryTest: OptimizedQueryTest): Promise<OptimizedQueryResult> {
    console.log(`  🔍 Testing: ${queryTest.name}`);

    const { duration, memoryGrowth, result } = await measureExecution(
      `query_${queryTest.name}`,
      async () => {
        const connection = await this.connectionPool.getConnection();
        
        try {
          const queryResult = await connection.query(queryTest.query, queryTest.parameters || []);
          
          // Validate result size
          if (queryResult.rows.length > queryTest.maxRows * 2) {
            throw new Error(`Query returned too many rows: ${queryResult.rows.length}`);
          }

          return queryResult;
        } finally {
          this.connectionPool.releaseConnection(connection);
        }
      }
    );

    const success = result && duration <= queryTest.expectedTimeMs * 2; // 100% tolerance
    const withinThreshold = duration <= queryTest.expectedTimeMs * 1.5; // 50% tolerance

    return {
      queryName: queryTest.name,
      type: queryTest.type,
      complexity: queryTest.complexity,
      executionTime: duration,
      rowsAffected: result?.rowCount || 0,
      success: !!success,
      memoryImpact: memoryGrowth,
      withinThreshold
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    queryResults: OptimizedQueryResult[],
    memoryUsage: { start: number; peak: number; end: number; growth: number }
  ): string[] {
    const recommendations: string[] = [];

    // Query performance analysis
    const slowQueries = queryResults.filter(r => !r.withinThreshold);
    if (slowQueries.length > 0) {
      recommendations.push(
        `${slowQueries.length} queries exceeded expected execution time. Consider query optimization.`
      );
    }

    // Memory usage analysis
    if (memoryUsage.growth > 50) {
      recommendations.push(
        `Memory growth of ${memoryUsage.growth.toFixed(2)}MB detected. Review query result handling.`
      );
    }

    if (memoryUsage.peak > this.config.memoryThreshold * 0.8) {
      recommendations.push(
        'Peak memory usage approaching threshold. Consider reducing batch sizes.'
      );
    }

    // Connection pool analysis
    const poolStats = this.connectionPool.getStats();
    if (poolStats.queued > 0) {
      recommendations.push(
        'Connection pool queue detected. Consider increasing pool size or optimizing query duration.'
      );
    }

    // Complex query analysis
    const complexQueries = queryResults.filter(r => r.complexity === 'complex');
    if (complexQueries.some(q => q.executionTime > 100)) {
      recommendations.push(
        'Complex queries taking over 100ms. Review indexes and query plans.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All database performance metrics are within acceptable ranges.');
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.connectionPool.close();
    this.memoryManager.stopMonitoring();
    this.dataFactory.clearCache();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Jest Integration
// ============================================================================

/**
 * Jest test function for optimized database performance
 */
export async function runOptimizedDatabaseTests(): Promise<DatabaseTestResult> {
  const dbTests = new OptimizedDatabaseTests();
  return await dbTests.runDatabasePerformanceTests();
}

/**
 * Create lightweight database test suite
 */
export function createOptimizedDatabaseTestSuite(): OptimizedDatabaseTests {
  return new OptimizedDatabaseTests({
    maxConnections: 2, // Minimal connections for Jest
    maxDataSize: 25,   // Even smaller dataset
    batchSize: 5,      // Smaller batches
    memoryThreshold: 150 // Lower threshold for Jest
  });
}

// ============================================================================
// Export Types and Classes
// ============================================================================

export {
  OptimizedDatabaseTests,
  OptimizedConnectionPool,
  MockConnection
};

export type {
  OptimizedDatabaseConfig,
  OptimizedQueryTest,
  DatabaseTestResult,
  OptimizedQueryResult,
  MockQueryResult
};