import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import { testConfig } from '../setup/test-config';
import { APITestClient } from '../utils/api-client';
import { WebSocketTestClient } from '../utils/websocket-client';
import { timeHelpers } from '../utils/test-helpers';

/**
 * Performance Testing Framework for jaqEdu Platform
 * Provides comprehensive performance testing utilities
 */

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export interface LoadTestConfig {
  concurrent: number;
  requests: number;
  duration?: number; // in seconds
  rampUp?: number; // in seconds
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errors: { message: string; count: number }[];
}

export class PerformanceTester {
  private apiClient: APITestClient;
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  
  constructor(baseURL?: string) {
    this.apiClient = new APITestClient(baseURL);
  }
  
  async authenticate(role: 'student' | 'teacher' | 'admin' = 'student'): Promise<void> {
    await this.apiClient.authenticateAsTestUser(role);
  }
  
  startMonitoring(): void {
    this.startTime = performance.now();
    this.metrics = [];
  }
  
  recordMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metric: PerformanceMetrics = {
      responseTime: performance.now() - this.startTime,
      throughput: 0, // Will be calculated later
      errorRate: 0, // Will be calculated later
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpuUsage: {
        user: cpuUsage.user / 1000, // Convert to milliseconds
        system: cpuUsage.system / 1000
      }
    };
    
    this.metrics.push(metric);
    return metric;
  }
  
  async measureSingleRequest(requestFn: () => Promise<any>): Promise<{ result: any; duration: number; memory: number }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const start = performance.now();
    
    try {
      const result = await requestFn();
      const duration = performance.now() - start;
      const finalMemory = process.memoryUsage().heapUsed;
      
      return {
        result,
        duration,
        memory: finalMemory - initialMemory
      };
    } catch (error) {
      const duration = performance.now() - start;
      throw { error, duration };
    }
  }
  
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const results: Array<{ success: boolean; duration: number; error?: string }> = [];
    const startTime = performance.now();
    
    console.log(`Starting load test: ${config.concurrent} concurrent users, ${config.requests} requests`);
    
    // Create worker function for concurrent requests
    const makeRequest = async (): Promise<{ success: boolean; duration: number; error?: string }> => {
      try {
        const requestStart = performance.now();
        
        let response;
        switch (config.method) {
          case 'GET':
            response = await this.apiClient.get(config.endpoint, { headers: config.headers });
            break;
          case 'POST':
            response = await this.apiClient.post(config.endpoint, config.payload, { headers: config.headers });
            break;
          case 'PUT':
            response = await this.apiClient.put(config.endpoint, config.payload, { headers: config.headers });
            break;
          case 'DELETE':
            response = await this.apiClient.delete(config.endpoint, { headers: config.headers });
            break;
        }
        
        const duration = performance.now() - requestStart;
        return { success: response.status < 400, duration };
        
      } catch (error: any) {
        const duration = performance.now() - requestStart;
        return { 
          success: false, 
          duration, 
          error: error.response?.statusText || error.message 
        };
      }
    };
    
    // Execute requests with controlled concurrency
    const batches = Math.ceil(config.requests / config.concurrent);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(config.concurrent, config.requests - batch * config.concurrent);
      const promises = Array(batchSize).fill(null).map(() => makeRequest());
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      // Ramp up delay
      if (config.rampUp && batch < batches - 1) {
        await timeHelpers.sleep((config.rampUp * 1000) / batches);
      }
    }
    
    const totalDuration = performance.now() - startTime;
    
    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    
    const errorCounts: Record<string, number> = {};
    failedResults.forEach(result => {
      const error = result.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    
    const errors = Object.entries(errorCounts).map(([message, count]) => ({ message, count }));
    
    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minResponseTime: durations[0] || 0,
      maxResponseTime: durations[durations.length - 1] || 0,
      requestsPerSecond: (results.length / totalDuration) * 1000,
      errorRate: (failedResults.length / results.length) * 100,
      percentiles: {
        p50: durations[Math.floor(durations.length * 0.5)] || 0,
        p75: durations[Math.floor(durations.length * 0.75)] || 0,
        p90: durations[Math.floor(durations.length * 0.9)] || 0,
        p95: durations[Math.floor(durations.length * 0.95)] || 0,
        p99: durations[Math.floor(durations.length * 0.99)] || 0
      },
      errors
    };
  }
  
  async runStressTest(config: Omit<LoadTestConfig, 'concurrent'>, maxConcurrent: number = 100, step: number = 10): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];
    
    for (let concurrent = step; concurrent <= maxConcurrent; concurrent += step) {
      console.log(`Running stress test with ${concurrent} concurrent users...`);
      
      const testConfig: LoadTestConfig = {
        ...config,
        concurrent,
        requests: concurrent * 10 // Scale requests with concurrency
      };
      
      try {
        const result = await this.runLoadTest(testConfig);
        results.push(result);
        
        // Break if error rate is too high
        if (result.errorRate > 50) {
          console.log(`Breaking stress test at ${concurrent} concurrent users due to high error rate`);
          break;
        }
        
      } catch (error) {
        console.error(`Stress test failed at ${concurrent} concurrent users:`, error);
        break;
      }
      
      // Cool down period
      await timeHelpers.sleep(2000);
    }
    
    return results;
  }
  
  async measureEndpointPerformance(endpoint: string, samples: number = 100): Promise<{
    average: number;
    min: number;
    max: number;
    percentiles: { p50: number; p75: number; p90: number; p95: number; p99: number };
    successRate: number;
  }> {
    const measurements: number[] = [];
    let successes = 0;
    
    for (let i = 0; i < samples; i++) {
      try {
        const { duration } = await this.measureSingleRequest(() => this.apiClient.get(endpoint));
        measurements.push(duration);
        successes++;
      } catch (error) {
        console.warn(`Request ${i + 1} failed:`, error);
      }
      
      // Small delay to avoid overwhelming the server
      await timeHelpers.sleep(10);
    }
    
    measurements.sort((a, b) => a - b);
    
    return {
      average: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
      min: measurements[0] || 0,
      max: measurements[measurements.length - 1] || 0,
      percentiles: {
        p50: measurements[Math.floor(measurements.length * 0.5)] || 0,
        p75: measurements[Math.floor(measurements.length * 0.75)] || 0,
        p90: measurements[Math.floor(measurements.length * 0.9)] || 0,
        p95: measurements[Math.floor(measurements.length * 0.95)] || 0,
        p99: measurements[Math.floor(measurements.length * 0.99)] || 0
      },
      successRate: (successes / samples) * 100
    };
  }
  
  async testWebSocketPerformance(concurrent: number = 10, messagesPerConnection: number = 100): Promise<{
    averageLatency: number;
    maxLatency: number;
    messagesPerSecond: number;
    connectionSuccessRate: number;
  }> {
    const clients: WebSocketTestClient[] = [];
    const latencies: number[] = [];
    let successfulConnections = 0;
    let totalMessages = 0;
    
    const startTime = performance.now();
    
    try {
      // Create concurrent connections
      for (let i = 0; i < concurrent; i++) {
        try {
          const client = new WebSocketTestClient();
          await client.connectWithAuth('student');
          clients.push(client);
          successfulConnections++;
        } catch (error) {
          console.warn(`Failed to connect client ${i + 1}:`, error);
        }
      }
      
      // Send messages and measure latency
      const messagePromises = clients.map(async (client, clientIndex) => {
        for (let msgIndex = 0; msgIndex < messagesPerConnection; msgIndex++) {
          try {
            const msgStart = performance.now();
            await client.sendAndWait({
              type: 'test_message',
              data: { clientIndex, msgIndex }
            });
            const latency = performance.now() - msgStart;
            latencies.push(latency);
            totalMessages++;
          } catch (error) {
            console.warn(`Message failed for client ${clientIndex}:`, error);
          }
          
          // Small delay between messages
          await timeHelpers.sleep(10);
        }
      });
      
      await Promise.all(messagePromises);
      
      const totalTime = performance.now() - startTime;
      
      return {
        averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        maxLatency: Math.max(...latencies),
        messagesPerSecond: (totalMessages / totalTime) * 1000,
        connectionSuccessRate: (successfulConnections / concurrent) * 100
      };
      
    } finally {
      // Cleanup connections
      clients.forEach(client => client.disconnect());
    }
  }
  
  async runEnduranceTest(endpoint: string, duration: number = 300000): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    memoryLeak: boolean;
    memoryIncrease: number;
  }> {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let totalResponseTime = 0;
    const memorySnapshots: number[] = [];
    
    console.log(`Starting endurance test for ${duration / 1000} seconds...`);
    
    while (performance.now() < endTime) {
      try {
        const { duration: responseTime } = await this.measureSingleRequest(() => 
          this.apiClient.get(endpoint)
        );
        
        totalRequests++;
        successfulRequests++;
        totalResponseTime += responseTime;
        
        // Take memory snapshot every 100 requests
        if (totalRequests % 100 === 0) {
          memorySnapshots.push(process.memoryUsage().heapUsed);
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
        
      } catch (error) {
        totalRequests++;
        console.warn(`Request ${totalRequests} failed:`, error);
      }
      
      // Short delay to avoid overwhelming
      await timeHelpers.sleep(100);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - startMemory;
    
    // Check for memory leak (> 50MB increase after GC)
    const memoryLeak = memoryIncrease > 50 * 1024 * 1024;
    
    return {
      totalRequests,
      averageResponseTime: totalResponseTime / successfulRequests,
      errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
      memoryLeak,
      memoryIncrease
    };
  }
  
  generatePerformanceReport(results: LoadTestResult[]): string {
    let report = '\n=== PERFORMANCE TEST REPORT ===\n\n';
    
    results.forEach((result, index) => {
      report += `Test ${index + 1}:\n`;
      report += `  Total Requests: ${result.totalRequests}\n`;
      report += `  Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)\n`;
      report += `  Failed: ${result.failedRequests} (${result.errorRate.toFixed(2)}%)\n`;
      report += `  Average Response Time: ${result.averageResponseTime.toFixed(2)}ms\n`;
      report += `  Min/Max Response Time: ${result.minResponseTime.toFixed(2)}ms / ${result.maxResponseTime.toFixed(2)}ms\n`;
      report += `  Requests/Second: ${result.requestsPerSecond.toFixed(2)}\n`;
      report += `  Percentiles:\n`;
      report += `    50th: ${result.percentiles.p50.toFixed(2)}ms\n`;
      report += `    75th: ${result.percentiles.p75.toFixed(2)}ms\n`;
      report += `    90th: ${result.percentiles.p90.toFixed(2)}ms\n`;
      report += `    95th: ${result.percentiles.p95.toFixed(2)}ms\n`;
      report += `    99th: ${result.percentiles.p99.toFixed(2)}ms\n`;
      
      if (result.errors.length > 0) {
        report += `  Errors:\n`;
        result.errors.forEach(error => {
          report += `    ${error.message}: ${error.count}\n`;
        });
      }
      
      report += '\n';
    });
    
    return report;
  }
}

// Performance test assertions
export const performanceAssertions = {
  expectFastResponse: (duration: number, maxDuration: number = testConfig.performance.maxResponseTime): void => {
    expect(duration).toBeLessThan(maxDuration);
  },
  
  expectHighThroughput: (requestsPerSecond: number, minThroughput: number = 100): void => {
    expect(requestsPerSecond).toBeGreaterThanOrEqual(minThroughput);
  },
  
  expectLowErrorRate: (errorRate: number, maxErrorRate: number = 1): void => {
    expect(errorRate).toBeLessThanOrEqual(maxErrorRate);
  },
  
  expectStableMemory: (memoryIncrease: number, maxIncrease: number = testConfig.performance.maxMemoryUsage): void => {
    expect(memoryIncrease).toBeLessThan(maxIncrease);
  },
  
  expectAcceptableLatency: (averageLatency: number, maxLatency: number = 100): void => {
    expect(averageLatency).toBeLessThan(maxLatency);
  },
  
  expectReliableConnections: (successRate: number, minSuccessRate: number = 95): void => {
    expect(successRate).toBeGreaterThanOrEqual(minSuccessRate);
  }
};

// Utility functions
export const performanceUtils = {
  createTester: (baseURL?: string): PerformanceTester => {
    return new PerformanceTester(baseURL);
  },
  
  benchmark: async <T>(fn: () => Promise<T>, iterations: number = 100): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    results: T[];
  }> => {
    const times: number[] = [];
    const results: T[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;
      
      times.push(duration);
      results.push(result);
    }
    
    return {
      averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((sum, t) => sum + t, 0),
      results
    };
  }
};

export default {
  PerformanceTester,
  performanceAssertions,
  performanceUtils
};
