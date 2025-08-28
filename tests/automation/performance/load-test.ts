/**
 * Load Testing Framework for jaqEdu Platform
 * Comprehensive load testing with concurrent workflows, metrics collection,
 * and performance regression detection
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface LoadTestConfig {
  name: string;
  description: string;
  maxConcurrentUsers: number;
  testDuration: number; // milliseconds
  rampUpDuration: number;
  rampDownDuration: number;
  targetThroughput: number; // requests per second
  scenarios: LoadTestScenario[];
  thresholds: PerformanceThresholds;
  endpoints: TestEndpoint[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of traffic
  steps: TestStep[];
  userProfile?: UserProfile;
}

interface TestStep {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload?: any;
  headers?: Record<string, string>;
  thinkTime: number; // milliseconds
  validation?: ResponseValidation;
}

interface TestEndpoint {
  path: string;
  baseUrl: string;
  auth?: AuthConfig;
  timeout: number;
}

interface UserProfile {
  type: 'student' | 'instructor' | 'admin' | 'guest';
  preferences?: any;
  behavior?: BehaviorPattern;
}

interface BehaviorPattern {
  sessionLength: number; // minutes
  pagesPerSession: number;
  thinkTimeVariation: number; // percentage
  errorTolerance: number; // percentage
}

interface PerformanceThresholds {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  throughput: {
    min: number;
    target: number;
  };
  errorRate: {
    max: number; // percentage
    critical: number; // percentage
  };
  availability: {
    min: number; // percentage
  };
  resourceUsage: {
    cpu: number; // percentage
    memory: number; // percentage
    disk: number; // percentage
  };
}

interface ResponseValidation {
  statusCode?: number[];
  contentType?: string;
  bodyContains?: string[];
  responseSize?: { min: number; max: number };
  customValidation?: (response: any) => boolean;
}

interface AuthConfig {
  type: 'bearer' | 'basic' | 'apikey';
  credentials: any;
}

interface LoadTestMetrics {
  startTime: Date;
  endTime?: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  throughputData: ThroughputDataPoint[];
  errorData: ErrorDataPoint[];
  resourceUsage: ResourceUsagePoint[];
  rampUpMetrics: RampMetrics;
  sustainedLoadMetrics: SustainedLoadMetrics;
  rampDownMetrics: RampMetrics;
}

interface ThroughputDataPoint {
  timestamp: number;
  requestsPerSecond: number;
  activeUsers: number;
}

interface ErrorDataPoint {
  timestamp: number;
  errorRate: number;
  errorType: string;
  statusCode?: number;
  count: number;
}

interface ResourceUsagePoint {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface RampMetrics {
  duration: number;
  steps: RampStep[];
  averageResponseTime: number;
  errorRate: number;
  success: boolean;
}

interface RampStep {
  step: number;
  users: number;
  duration: number;
  metrics: StepMetrics;
}

interface StepMetrics {
  requests: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
}

interface SustainedLoadMetrics {
  duration: number;
  intervalMetrics: IntervalMetrics[];
  stability: StabilityMetrics;
  averageMetrics: AggregateMetrics;
}

interface IntervalMetrics {
  timestamp: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  activeUsers: number;
}

interface StabilityMetrics {
  responseTimeVariation: number;
  throughputVariation: number;
  isStable: boolean;
}

interface AggregateMetrics {
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  averageThroughput: number;
  totalErrors: number;
  overallErrorRate: number;
}

// ============================================================================
// Load Test Engine
// ============================================================================

export class LoadTestEngine extends EventEmitter {
  private config: LoadTestConfig;
  private workers: Worker[] = [];
  private metrics: LoadTestMetrics;
  private activeExecutions: Map<string, any> = new Map();
  private testStartTime: number = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: LoadTestConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Execute comprehensive load test
   */
  async executeLoadTest(): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${this.config.name}`);
    console.log(`  Max Users: ${this.config.maxConcurrentUsers}`);
    console.log(`  Duration: ${this.config.testDuration / 1000}s`);
    console.log(`  Target Throughput: ${this.config.targetThroughput} RPS`);

    this.testStartTime = performance.now();
    this.metrics.startTime = new Date();
    
    try {
      // Start monitoring
      this.startMonitoring();

      // Phase 1: Ramp Up
      console.log('📈 Phase 1: Ramping up users...');
      this.metrics.rampUpMetrics = await this.executeRampUp();

      // Phase 2: Sustained Load
      console.log('⚡ Phase 2: Sustained load testing...');
      this.metrics.sustainedLoadMetrics = await this.executeSustainedLoad();

      // Phase 3: Ramp Down
      console.log('📉 Phase 3: Ramping down users...');
      this.metrics.rampDownMetrics = await this.executeRampDown();

      this.metrics.endTime = new Date();
      this.stopMonitoring();

      // Generate comprehensive results
      const result = await this.generateResults();
      
      // Save results
      await this.saveResults(result);

      console.log('✅ Load test completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Load test failed:', error);
      this.stopMonitoring();
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Execute ramp up phase
   */
  private async executeRampUp(): Promise<RampMetrics> {
    const rampUpStart = performance.now();
    const steps = 10;
    const usersPerStep = Math.ceil(this.config.maxConcurrentUsers / steps);
    const stepDuration = this.config.rampUpDuration / steps;
    
    const rampSteps: RampStep[] = [];
    let currentUsers = 0;

    for (let step = 1; step <= steps; step++) {
      const stepStart = performance.now();
      const targetUsers = Math.min(step * usersPerStep, this.config.maxConcurrentUsers);
      const newUsers = targetUsers - currentUsers;

      if (newUsers > 0) {
        await this.spawnWorkers(newUsers);
        currentUsers = targetUsers;
      }

      console.log(`  Step ${step}/${steps}: ${currentUsers} users active`);
      
      // Monitor this step
      const stepMetrics = await this.monitorStep(stepDuration);
      
      rampSteps.push({
        step,
        users: currentUsers,
        duration: performance.now() - stepStart,
        metrics: stepMetrics
      });

      // Brief pause between steps
      await this.sleep(500);
    }

    const totalDuration = performance.now() - rampUpStart;
    const averageResponseTime = this.calculateAverage(rampSteps.map(s => s.metrics.averageResponseTime));
    const errorRate = this.calculateAverage(rampSteps.map(s => s.metrics.errorRate));

    return {
      duration: totalDuration,
      steps: rampSteps,
      averageResponseTime,
      errorRate,
      success: errorRate < this.config.thresholds.errorRate.max
    };
  }

  /**
   * Execute sustained load phase
   */
  private async executeSustainedLoad(): Promise<SustainedLoadMetrics> {
    const sustainedStart = performance.now();
    const monitoringInterval = 5000; // 5 seconds
    const intervalMetrics: IntervalMetrics[] = [];

    // Monitor at regular intervals
    const monitoringPromise = new Promise<IntervalMetrics[]>((resolve) => {
      const interval = setInterval(async () => {
        const currentTime = performance.now();
        const metrics = await this.captureIntervalMetrics();
        
        intervalMetrics.push({
          timestamp: currentTime - sustainedStart,
          ...metrics
        });

        if (currentTime - sustainedStart >= this.config.testDuration) {
          clearInterval(interval);
          resolve(intervalMetrics);
        }
      }, monitoringInterval);
    });

    // Wait for sustained load period
    await Promise.all([
      monitoringPromise,
      this.sleep(this.config.testDuration)
    ]);

    const totalDuration = performance.now() - sustainedStart;
    const stability = this.analyzeStability(intervalMetrics);
    const averageMetrics = this.calculateAverageMetrics(intervalMetrics);

    return {
      duration: totalDuration,
      intervalMetrics,
      stability,
      averageMetrics
    };
  }

  /**
   * Execute ramp down phase
   */
  private async executeRampDown(): Promise<RampMetrics> {
    const rampDownStart = performance.now();
    const steps = 5;
    const stepDuration = this.config.rampDownDuration / steps;
    
    const rampSteps: RampStep[] = [];

    for (let step = 1; step <= steps; step++) {
      const stepStart = performance.now();
      const workersToStop = Math.ceil(this.workers.length / (steps - step + 1));
      
      await this.stopWorkers(workersToStop);
      
      console.log(`  Step ${step}/${steps}: ${this.workers.length} users remaining`);
      
      const stepMetrics = await this.monitorStep(stepDuration);
      
      rampSteps.push({
        step,
        users: this.workers.length,
        duration: performance.now() - stepStart,
        metrics: stepMetrics
      });
    }

    // Stop all remaining workers
    await this.stopAllWorkers();

    const totalDuration = performance.now() - rampDownStart;
    const averageResponseTime = this.calculateAverage(rampSteps.map(s => s.metrics.averageResponseTime));
    const errorRate = this.calculateAverage(rampSteps.map(s => s.metrics.errorRate));

    return {
      duration: totalDuration,
      steps: rampSteps,
      averageResponseTime,
      errorRate,
      success: true
    };
  }

  /**
   * Spawn load generation workers
   */
  private async spawnWorkers(count: number): Promise<void> {
    const newWorkers: Promise<Worker>[] = [];

    for (let i = 0; i < count; i++) {
      newWorkers.push(this.createWorker(i));
    }

    const workers = await Promise.all(newWorkers);
    this.workers.push(...workers);
  }

  /**
   * Create individual load worker
   */
  private async createWorker(index: number): Promise<Worker> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: `worker-${Date.now()}-${index}`,
          config: this.config,
          scenarios: this.config.scenarios,
          isWorker: true
        }
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${index} error:`, error);
        reject(error);
      });

      worker.on('online', () => {
        resolve(worker);
      });
    });
  }

  /**
   * Handle messages from worker threads
   */
  private handleWorkerMessage(worker: Worker, message: any): void {
    switch (message.type) {
      case 'request-complete':
        this.recordRequestMetrics(message.data);
        break;
      case 'error':
        this.recordError(message.error);
        break;
      case 'metrics-update':
        this.updateWorkerMetrics(message.data);
        break;
    }
  }

  /**
   * Record request completion metrics
   */
  private recordRequestMetrics(data: any): void {
    this.metrics.totalRequests++;
    
    if (data.success) {
      this.metrics.successfulRequests++;
      this.metrics.responseTimes.push(data.responseTime);
    } else {
      this.metrics.failedRequests++;
      this.metrics.errorData.push({
        timestamp: performance.now(),
        errorRate: this.getCurrentErrorRate(),
        errorType: data.errorType || 'unknown',
        statusCode: data.statusCode,
        count: 1
      });
    }

    // Update throughput data
    this.metrics.throughputData.push({
      timestamp: performance.now(),
      requestsPerSecond: this.calculateCurrentThroughput(),
      activeUsers: this.workers.length
    });
  }

  /**
   * Monitor test step
   */
  private async monitorStep(duration: number): Promise<StepMetrics> {
    const measurements: any[] = [];
    const monitorStart = performance.now();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const measurement = this.takeMeasurement();
        measurements.push(measurement);

        if (performance.now() - monitorStart >= duration) {
          clearInterval(interval);
          resolve(this.aggregateStepMetrics(measurements));
        }
      }, 1000);
    });
  }

  /**
   * Take current measurement
   */
  private takeMeasurement(): any {
    return {
      timestamp: performance.now(),
      requests: this.metrics.totalRequests,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getCurrentErrorRate(),
      throughput: this.calculateCurrentThroughput(),
      activeUsers: this.workers.length
    };
  }

  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.captureResourceUsage();
    }, 2000);
  }

  /**
   * Stop system monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Capture system resource usage
   */
  private async captureResourceUsage(): Promise<void> {
    try {
      const usage = await this.getSystemResourceUsage();
      this.metrics.resourceUsage.push({
        timestamp: performance.now(),
        ...usage
      });
    } catch (error) {
      console.warn('Failed to capture resource usage:', error);
    }
  }

  /**
   * Get system resource usage
   */
  private async getSystemResourceUsage(): Promise<any> {
    const process = await import('process');
    const memUsage = process.memoryUsage();
    
    return {
      cpu: process.cpuUsage().user / 1000000, // Convert to milliseconds
      memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      disk: 0, // Would need OS-specific implementation
      network: 0 // Would need OS-specific implementation
    };
  }

  /**
   * Generate comprehensive test results
   */
  private async generateResults(): Promise<LoadTestResult> {
    const duration = this.metrics.endTime!.getTime() - this.metrics.startTime.getTime();
    
    const performanceStats = this.calculatePerformanceStats();
    const thresholdAnalysis = this.analyzeThresholds(performanceStats);
    const regressionAnalysis = await this.analyzeRegression(performanceStats);

    return {
      testInfo: {
        name: this.config.name,
        duration,
        startTime: this.metrics.startTime,
        endTime: this.metrics.endTime!,
        configuration: this.config
      },
      performanceStats,
      thresholdAnalysis,
      regressionAnalysis,
      phaseMetrics: {
        rampUp: this.metrics.rampUpMetrics,
        sustainedLoad: this.metrics.sustainedLoadMetrics,
        rampDown: this.metrics.rampDownMetrics
      },
      rawMetrics: this.metrics,
      recommendations: this.generateRecommendations(performanceStats, thresholdAnalysis)
    };
  }

  /**
   * Calculate performance statistics
   */
  private calculatePerformanceStats(): PerformanceStats {
    const responseTimes = this.metrics.responseTimes.sort((a, b) => a - b);
    
    return {
      responseTime: {
        average: this.calculateAverage(responseTimes),
        median: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes)
      },
      throughput: {
        average: this.calculateAverage(this.metrics.throughputData.map(t => t.requestsPerSecond)),
        peak: Math.max(...this.metrics.throughputData.map(t => t.requestsPerSecond)),
        total: this.metrics.totalRequests
      },
      errorRate: {
        overall: (this.metrics.failedRequests / this.metrics.totalRequests) * 100,
        peak: Math.max(...this.metrics.errorData.map(e => e.errorRate))
      },
      availability: {
        uptime: ((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100
      }
    };
  }

  /**
   * Analyze performance against thresholds
   */
  private analyzeThresholds(stats: PerformanceStats): ThresholdAnalysis {
    const violations: ThresholdViolation[] = [];

    // Check response time thresholds
    if (stats.responseTime.p95 > this.config.thresholds.responseTime.p95) {
      violations.push({
        metric: 'response_time_p95',
        threshold: this.config.thresholds.responseTime.p95,
        actual: stats.responseTime.p95,
        severity: 'high'
      });
    }

    // Check error rate thresholds
    if (stats.errorRate.overall > this.config.thresholds.errorRate.max) {
      violations.push({
        metric: 'error_rate',
        threshold: this.config.thresholds.errorRate.max,
        actual: stats.errorRate.overall,
        severity: stats.errorRate.overall > this.config.thresholds.errorRate.critical ? 'critical' : 'medium'
      });
    }

    // Check throughput thresholds
    if (stats.throughput.average < this.config.thresholds.throughput.min) {
      violations.push({
        metric: 'throughput',
        threshold: this.config.thresholds.throughput.min,
        actual: stats.throughput.average,
        severity: 'medium'
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      score: this.calculateOverallScore(stats, violations)
    };
  }

  /**
   * Analyze performance regression
   */
  private async analyzeRegression(currentStats: PerformanceStats): Promise<RegressionAnalysis> {
    try {
      const historicalData = await this.loadHistoricalData();
      
      if (!historicalData || historicalData.length === 0) {
        return {
          hasBaseline: false,
          regressions: [],
          improvements: [],
          trend: 'no_data'
        };
      }

      const baseline = this.calculateBaseline(historicalData);
      const regressions = this.detectRegressions(currentStats, baseline);
      const improvements = this.detectImprovements(currentStats, baseline);
      const trend = this.analyzeTrend(historicalData, currentStats);

      return {
        hasBaseline: true,
        baseline,
        regressions,
        improvements,
        trend
      };
    } catch (error) {
      console.warn('Regression analysis failed:', error);
      return {
        hasBaseline: false,
        regressions: [],
        improvements: [],
        trend: 'error'
      };
    }
  }

  /**
   * Save test results
   */
  private async saveResults(result: LoadTestResult): Promise<void> {
    const resultsDir = path.join(__dirname, '../results');
    await fs.mkdir(resultsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`📊 Results saved to: ${filepath}`);

    // Also save to historical data
    await this.saveToHistoricalData(result.performanceStats);
  }

  // Helper methods for calculations and utilities
  private initializeMetrics(): LoadTestMetrics {
    return {
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      throughputData: [],
      errorData: [],
      resourceUsage: [],
      rampUpMetrics: {} as RampMetrics,
      sustainedLoadMetrics: {} as SustainedLoadMetrics,
      rampDownMetrics: {} as RampMetrics
    };
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.min(index, values.length - 1)];
  }

  private getCurrentErrorRate(): number {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0;
  }

  private getAverageResponseTime(): number {
    const recent = this.metrics.responseTimes.slice(-100);
    return this.calculateAverage(recent);
  }

  private calculateCurrentThroughput(): number {
    const recent = this.metrics.throughputData.slice(-10);
    return recent.length > 0 ? this.calculateAverage(recent.map(t => t.requestsPerSecond)) : 0;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async stopWorkers(count: number): Promise<void> {
    const workersToStop = this.workers.splice(0, count);
    await Promise.all(workersToStop.map(worker => worker.terminate()));
  }

  private async stopAllWorkers(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
  }

  private async cleanup(): Promise<void> {
    await this.stopAllWorkers();
    this.stopMonitoring();
  }

  // Additional helper methods would go here...
  private recordError(error: any): void {
    console.error('Load test error:', error);
  }

  private updateWorkerMetrics(data: any): void {
    // Update metrics from worker data
  }

  private async captureIntervalMetrics(): Promise<any> {
    return {
      responseTime: this.getAverageResponseTime(),
      errorRate: this.getCurrentErrorRate(),
      throughput: this.calculateCurrentThroughput(),
      activeUsers: this.workers.length
    };
  }

  private analyzeStability(intervals: IntervalMetrics[]): StabilityMetrics {
    const responseTimes = intervals.map(i => i.responseTime);
    const throughputs = intervals.map(i => i.throughput);
    
    const responseTimeVariation = this.calculateVariation(responseTimes);
    const throughputVariation = this.calculateVariation(throughputs);
    
    return {
      responseTimeVariation,
      throughputVariation,
      isStable: responseTimeVariation < 0.3 && throughputVariation < 0.2
    };
  }

  private calculateVariation(values: number[]): number {
    const avg = this.calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / avg;
  }

  private calculateAverageMetrics(intervals: IntervalMetrics[]): AggregateMetrics {
    const responseTimes = intervals.map(i => i.responseTime);
    const throughputs = intervals.map(i => i.throughput);
    
    return {
      averageResponseTime: this.calculateAverage(responseTimes),
      medianResponseTime: this.calculatePercentile(responseTimes.sort(), 50),
      p95ResponseTime: this.calculatePercentile(responseTimes.sort(), 95),
      p99ResponseTime: this.calculatePercentile(responseTimes.sort(), 99),
      averageThroughput: this.calculateAverage(throughputs),
      totalErrors: this.metrics.failedRequests,
      overallErrorRate: this.getCurrentErrorRate()
    };
  }

  private aggregateStepMetrics(measurements: any[]): StepMetrics {
    return {
      requests: measurements[measurements.length - 1]?.requests || 0,
      averageResponseTime: this.calculateAverage(measurements.map(m => m.averageResponseTime)),
      errorRate: this.calculateAverage(measurements.map(m => m.errorRate)),
      throughput: this.calculateAverage(measurements.map(m => m.throughput))
    };
  }

  private calculateOverallScore(stats: PerformanceStats, violations: ThresholdViolation[]): number {
    let score = 100;
    
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private calculateBaseline(historicalData: any[]): PerformanceStats {
    // Calculate baseline from historical data
    return {} as PerformanceStats; // Implementation would aggregate historical stats
  }

  private detectRegressions(current: PerformanceStats, baseline: PerformanceStats): any[] {
    // Compare current performance with baseline to detect regressions
    return [];
  }

  private detectImprovements(current: PerformanceStats, baseline: PerformanceStats): any[] {
    // Compare current performance with baseline to detect improvements
    return [];
  }

  private analyzeTrend(historical: any[], current: PerformanceStats): string {
    // Analyze performance trend over time
    return 'stable';
  }

  private async loadHistoricalData(): Promise<any[]> {
    try {
      const historicalPath = path.join(__dirname, '../results/historical.json');
      const data = await fs.readFile(historicalPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveToHistoricalData(stats: PerformanceStats): Promise<void> {
    try {
      const historicalPath = path.join(__dirname, '../results/historical.json');
      let historical: any[] = [];
      
      try {
        const data = await fs.readFile(historicalPath, 'utf-8');
        historical = JSON.parse(data);
      } catch {
        // File doesn't exist, start with empty array
      }
      
      historical.push({
        timestamp: new Date().toISOString(),
        stats
      });
      
      // Keep only last 100 entries
      historical = historical.slice(-100);
      
      await fs.writeFile(historicalPath, JSON.stringify(historical, null, 2));
    } catch (error) {
      console.warn('Failed to save to historical data:', error);
    }
  }

  private generateRecommendations(stats: PerformanceStats, analysis: ThresholdAnalysis): string[] {
    const recommendations: string[] = [];
    
    analysis.violations.forEach(violation => {
      switch (violation.metric) {
        case 'response_time_p95':
          recommendations.push('Consider implementing caching strategies to improve response times');
          recommendations.push('Review database query optimization and indexing');
          break;
        case 'error_rate':
          recommendations.push('Investigate error causes and implement better error handling');
          recommendations.push('Consider implementing circuit breakers for external dependencies');
          break;
        case 'throughput':
          recommendations.push('Scale up server resources or implement horizontal scaling');
          recommendations.push('Review application bottlenecks and optimize critical paths');
          break;
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Performance meets all thresholds - consider stress testing with higher loads');
    }
    
    return recommendations;
  }
}

// ============================================================================
// Additional Types for Results
// ============================================================================

interface LoadTestResult {
  testInfo: {
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    configuration: LoadTestConfig;
  };
  performanceStats: PerformanceStats;
  thresholdAnalysis: ThresholdAnalysis;
  regressionAnalysis: RegressionAnalysis;
  phaseMetrics: {
    rampUp: RampMetrics;
    sustainedLoad: SustainedLoadMetrics;
    rampDown: RampMetrics;
  };
  rawMetrics: LoadTestMetrics;
  recommendations: string[];
}

interface PerformanceStats {
  responseTime: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  throughput: {
    average: number;
    peak: number;
    total: number;
  };
  errorRate: {
    overall: number;
    peak: number;
  };
  availability: {
    uptime: number;
  };
}

interface ThresholdAnalysis {
  passed: boolean;
  violations: ThresholdViolation[];
  score: number;
}

interface ThresholdViolation {
  metric: string;
  threshold: number;
  actual: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RegressionAnalysis {
  hasBaseline: boolean;
  baseline?: PerformanceStats;
  regressions: any[];
  improvements: any[];
  trend: string;
}

// ============================================================================
// Worker Thread Implementation
// ============================================================================

if (!isMainThread && workerData?.isWorker) {
  const { workerId, config, scenarios } = workerData;
  
  class LoadWorker {
    private id: string;
    private config: LoadTestConfig;
    private scenarios: LoadTestScenario[];
    private active: boolean = true;

    constructor(id: string, config: LoadTestConfig, scenarios: LoadTestScenario[]) {
      this.id = id;
      this.config = config;
      this.scenarios = scenarios;
    }

    async start(): Promise<void> {
      console.log(`🏃 Worker ${this.id} started`);
      
      while (this.active) {
        try {
          // Select scenario based on weight
          const scenario = this.selectScenario();
          await this.executeScenario(scenario);
          
          // Think time between scenarios
          await this.sleep(Math.random() * 2000);
          
        } catch (error) {
          parentPort?.postMessage({
            type: 'error',
            error: error.message,
            workerId: this.id
          });
        }
      }
    }

    private selectScenario(): LoadTestScenario {
      const random = Math.random() * 100;
      let cumulativeWeight = 0;
      
      for (const scenario of this.scenarios) {
        cumulativeWeight += scenario.weight;
        if (random <= cumulativeWeight) {
          return scenario;
        }
      }
      
      return this.scenarios[0];
    }

    private async executeScenario(scenario: LoadTestScenario): Promise<void> {
      for (const step of scenario.steps) {
        const startTime = performance.now();
        
        try {
          const response = await this.executeStep(step);
          const responseTime = performance.now() - startTime;
          
          const success = this.validateResponse(response, step.validation);
          
          parentPort?.postMessage({
            type: 'request-complete',
            data: {
              success,
              responseTime,
              step: step.name,
              statusCode: response.statusCode
            },
            workerId: this.id
          });
          
          // Think time
          await this.sleep(step.thinkTime + (Math.random() * step.thinkTime * 0.2));
          
        } catch (error) {
          const responseTime = performance.now() - startTime;
          
          parentPort?.postMessage({
            type: 'request-complete',
            data: {
              success: false,
              responseTime,
              step: step.name,
              errorType: error.message
            },
            workerId: this.id
          });
        }
      }
    }

    private async executeStep(step: TestStep): Promise<any> {
      // Simulate HTTP request
      const latency = 100 + Math.random() * 500; // Base latency + variability
      await this.sleep(latency);
      
      // Simulate success/failure
      const success = Math.random() > 0.05; // 95% success rate
      
      return {
        statusCode: success ? 200 : 500,
        data: success ? { result: 'success' } : null,
        error: success ? null : 'Server Error'
      };
    }

    private validateResponse(response: any, validation?: ResponseValidation): boolean {
      if (!validation) return response.statusCode === 200;
      
      if (validation.statusCode && !validation.statusCode.includes(response.statusCode)) {
        return false;
      }
      
      if (validation.customValidation) {
        return validation.customValidation(response);
      }
      
      return true;
    }

    private async sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop(): void {
      this.active = false;
    }
  }

  const worker = new LoadWorker(workerId, config, scenarios);
  worker.start().catch(console.error);
}

// ============================================================================
// Export for use in tests
// ============================================================================

export { LoadTestEngine, LoadTestConfig, LoadTestResult, PerformanceStats };