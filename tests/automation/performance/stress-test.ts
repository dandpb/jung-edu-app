/**
 * Stress Testing Framework for jaqEdu Platform
 * Comprehensive stress testing with maximum capacity limits, resource exhaustion
 * scenarios, and system breaking point analysis
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface StressTestConfig {
  name: string;
  description: string;
  maxUsers: number;
  userIncrement: number;
  incrementInterval: number; // milliseconds
  testDuration: number;
  resourceLimits: ResourceLimits;
  breakingPointCriteria: BreakingPointCriteria;
  stressScenarios: StressScenario[];
  monitoringConfig: MonitoringConfig;
}

interface ResourceLimits {
  memory: {
    warning: number; // MB
    critical: number; // MB
    maximum: number; // MB
  };
  cpu: {
    warning: number; // percentage
    critical: number; // percentage
  };
  connections: {
    warning: number;
    critical: number;
    maximum: number;
  };
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

interface BreakingPointCriteria {
  maxResponseTime: number; // ms
  maxErrorRate: number; // percentage
  minSuccessfulRequests: number; // per second
  maxMemoryUsage: number; // percentage
  maxCpuUsage: number; // percentage
  consecutiveFailureThreshold: number;
}

interface StressScenario {
  name: string;
  type: StressType;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  duration: number; // milliseconds
  parameters: any;
}

type StressType = 
  | 'user_surge'
  | 'memory_exhaustion'
  | 'cpu_intensive'
  | 'database_overload'
  | 'network_saturation'
  | 'concurrent_operations'
  | 'resource_starvation'
  | 'cascading_failures';

interface MonitoringConfig {
  interval: number; // milliseconds
  metrics: MonitoredMetric[];
  alerts: AlertConfig[];
  systemMetrics: boolean;
  applicationMetrics: boolean;
}

interface MonitoredMetric {
  name: string;
  type: 'gauge' | 'counter' | 'histogram';
  thresholds: {
    warning: number;
    critical: number;
  };
}

interface AlertConfig {
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  duration: number; // milliseconds
  action: AlertAction;
}

type AlertAction = 'log' | 'stop_test' | 'scale_down' | 'notify';

interface StressTestMetrics {
  testId: string;
  startTime: Date;
  endTime?: Date;
  breakingPoint?: BreakingPoint;
  maxUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeSeriesMetrics: TimeSeriesMetrics[];
  resourceUsage: ResourceUsageSnapshot[];
  systemEvents: SystemEvent[];
  stressScenarioResults: StressScenarioResult[];
}

interface BreakingPoint {
  users: number;
  time: Date;
  trigger: string;
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface TimeSeriesMetrics {
  timestamp: number;
  users: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  successfulRequests: number;
  failedRequests: number;
}

interface ResourceUsageSnapshot {
  timestamp: number;
  memory: MemoryUsage;
  cpu: CpuUsage;
  network: NetworkUsage;
  disk: DiskUsage;
  connections: ConnectionStats;
}

interface MemoryUsage {
  used: number; // MB
  available: number; // MB
  percentage: number;
  heapUsed: number; // MB
  heapTotal: number; // MB
  rss: number; // MB
}

interface CpuUsage {
  percentage: number;
  loadAverage: number[];
  user: number;
  system: number;
}

interface NetworkUsage {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connections: number;
}

interface DiskUsage {
  readBytes: number;
  writeBytes: number;
  readOperations: number;
  writeOperations: number;
  usagePercentage: number;
}

interface ConnectionStats {
  active: number;
  waiting: number;
  idle: number;
  total: number;
}

interface SystemEvent {
  timestamp: number;
  type: 'warning' | 'error' | 'critical' | 'recovery';
  source: string;
  message: string;
  metadata?: any;
}

interface StressScenarioResult {
  scenario: string;
  type: StressType;
  startTime: Date;
  endTime: Date;
  success: boolean;
  impact: ScenarioImpact;
  metrics: any;
  events: SystemEvent[];
}

interface ScenarioImpact {
  responseTimeDegradation: number; // percentage
  throughputReduction: number; // percentage
  errorRateIncrease: number; // percentage
  resourceUsageIncrease: any;
  recoveryTime: number; // milliseconds
}

// ============================================================================
// Stress Test Engine
// ============================================================================

export class StressTestEngine extends EventEmitter {
  private config: StressTestConfig;
  private metrics: StressTestMetrics;
  private workers: Worker[] = [];
  private monitoring: NodeJS.Timeout | null = null;
  private testActive: boolean = false;
  private breakingPointReached: boolean = false;
  private testStartTime: number = 0;

  constructor(config: StressTestConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Execute comprehensive stress test
   */
  async executeStressTest(): Promise<StressTestResult> {
    console.log(`🔥 Starting stress test: ${this.config.name}`);
    console.log(`  Max Users: ${this.config.maxUsers}`);
    console.log(`  User Increment: ${this.config.userIncrement}`);
    console.log(`  Test Duration: ${this.config.testDuration / 1000}s`);

    this.testActive = true;
    this.testStartTime = performance.now();
    this.metrics.startTime = new Date();

    try {
      // Start system monitoring
      this.startMonitoring();

      // Execute stress scenarios in parallel
      const scenarioPromises = this.config.stressScenarios.map(scenario => 
        this.executeStressScenario(scenario)
      );

      // Start progressive user ramp up
      const rampUpPromise = this.executeProgressiveRampUp();

      // Monitor for breaking point
      const monitoringPromise = this.monitorBreakingPoint();

      // Execute all scenarios and monitoring in parallel
      const [scenarioResults] = await Promise.all([
        Promise.allSettled(scenarioPromises),
        rampUpPromise,
        monitoringPromise
      ]);

      this.metrics.stressScenarioResults = scenarioResults
        .filter((result): result is PromiseFulfilledResult<StressScenarioResult> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      this.metrics.endTime = new Date();
      
      // Generate comprehensive results
      const result = await this.generateStressTestResult();
      
      // Save results
      await this.saveResults(result);

      console.log('✅ Stress test completed');
      return result;

    } catch (error) {
      console.error('❌ Stress test failed:', error);
      throw error;
    } finally {
      this.testActive = false;
      this.stopMonitoring();
      await this.cleanup();
    }
  }

  /**
   * Execute progressive user ramp up until breaking point
   */
  private async executeProgressiveRampUp(): Promise<void> {
    let currentUsers = 0;
    
    while (this.testActive && !this.breakingPointReached && currentUsers < this.config.maxUsers) {
      // Add users incrementally
      const usersToAdd = Math.min(this.config.userIncrement, this.config.maxUsers - currentUsers);
      
      if (usersToAdd > 0) {
        await this.addUsers(usersToAdd);
        currentUsers += usersToAdd;
        this.metrics.maxUsers = Math.max(this.metrics.maxUsers, currentUsers);
        
        console.log(`📈 Users: ${currentUsers}/${this.config.maxUsers}`);
        
        // Check for breaking point after each increment
        await this.checkBreakingPoint();
        
        // Wait before next increment
        await this.sleep(this.config.incrementInterval);
      }
    }

    if (this.breakingPointReached) {
      console.log('💥 Breaking point reached!');
    } else {
      console.log('🏁 Maximum users reached without breaking point');
    }
  }

  /**
   * Execute individual stress scenario
   */
  private async executeStressScenario(scenario: StressScenario): Promise<StressScenarioResult> {
    console.log(`🎯 Executing stress scenario: ${scenario.name}`);
    
    const startTime = new Date();
    const preMetrics = await this.captureCurrentMetrics();
    const events: SystemEvent[] = [];

    try {
      // Execute scenario based on type
      switch (scenario.type) {
        case 'memory_exhaustion':
          await this.executeMemoryExhaustionScenario(scenario);
          break;
        case 'cpu_intensive':
          await this.executeCpuIntensiveScenario(scenario);
          break;
        case 'database_overload':
          await this.executeDatabaseOverloadScenario(scenario);
          break;
        case 'network_saturation':
          await this.executeNetworkSaturationScenario(scenario);
          break;
        case 'concurrent_operations':
          await this.executeConcurrentOperationsScenario(scenario);
          break;
        case 'resource_starvation':
          await this.executeResourceStarvationScenario(scenario);
          break;
        case 'cascading_failures':
          await this.executeCascadingFailuresScenario(scenario);
          break;
        default:
          throw new Error(`Unknown stress scenario type: ${scenario.type}`);
      }

      const endTime = new Date();
      const postMetrics = await this.captureCurrentMetrics();
      
      return {
        scenario: scenario.name,
        type: scenario.type,
        startTime,
        endTime,
        success: true,
        impact: this.calculateScenarioImpact(preMetrics, postMetrics),
        metrics: { pre: preMetrics, post: postMetrics },
        events
      };

    } catch (error) {
      console.error(`❌ Stress scenario failed: ${scenario.name}`, error);
      
      events.push({
        timestamp: performance.now(),
        type: 'error',
        source: 'stress_scenario',
        message: `Scenario ${scenario.name} failed: ${error.message}`
      });

      return {
        scenario: scenario.name,
        type: scenario.type,
        startTime,
        endTime: new Date(),
        success: false,
        impact: {} as ScenarioImpact,
        metrics: {},
        events
      };
    }
  }

  /**
   * Memory exhaustion stress scenario
   */
  private async executeMemoryExhaustionScenario(scenario: StressScenario): Promise<void> {
    console.log('🧠 Memory exhaustion scenario starting...');
    
    const memoryHogs: any[] = [];
    const targetMemory = scenario.parameters.targetMemoryMB || 1000; // MB
    const chunkSize = 10; // MB per chunk
    
    const startTime = performance.now();
    
    while (performance.now() - startTime < scenario.duration) {
      // Allocate memory chunks
      for (let i = 0; i < chunkSize; i++) {
        memoryHogs.push(new Array(1024 * 1024).fill('memory_hog')); // 1MB chunk
      }
      
      const memoryUsage = process.memoryUsage();
      const usedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      if (usedMB >= targetMemory) {
        console.log(`🎯 Target memory usage reached: ${usedMB.toFixed(2)}MB`);
        break;
      }
      
      // Brief pause
      await this.sleep(100);
    }
    
    // Gradually release memory
    console.log('🧹 Releasing memory...');
    memoryHogs.splice(0, memoryHogs.length);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * CPU intensive stress scenario
   */
  private async executeCpuIntensiveScenario(scenario: StressScenario): Promise<void> {
    console.log('⚡ CPU intensive scenario starting...');
    
    const workers = scenario.parameters.workers || os.cpus().length;
    const cpuWorkers: Worker[] = [];
    
    // Spawn CPU-intensive workers
    for (let i = 0; i < workers; i++) {
      const worker = await this.createCpuIntensiveWorker(scenario.duration);
      cpuWorkers.push(worker);
    }
    
    // Wait for scenario duration
    await this.sleep(scenario.duration);
    
    // Terminate CPU workers
    await Promise.all(cpuWorkers.map(worker => worker.terminate()));
  }

  /**
   * Database overload stress scenario
   */
  private async executeDatabaseOverloadScenario(scenario: StressScenario): Promise<void> {
    console.log('🗄️ Database overload scenario starting...');
    
    const queryWorkers: Promise<void>[] = [];
    const concurrentQueries = scenario.parameters.concurrentQueries || 100;
    const queriesPerWorker = scenario.parameters.queriesPerWorker || 1000;
    
    for (let i = 0; i < concurrentQueries; i++) {
      queryWorkers.push(this.executeDatabaseQueries(queriesPerWorker, scenario.duration));
    }
    
    await Promise.all(queryWorkers);
  }

  /**
   * Network saturation stress scenario
   */
  private async executeNetworkSaturationScenario(scenario: StressScenario): Promise<void> {
    console.log('🌐 Network saturation scenario starting...');
    
    const connections = scenario.parameters.connections || 1000;
    const payloadSize = scenario.parameters.payloadSizeMB || 1; // MB
    
    const networkWorkers: Promise<void>[] = [];
    
    for (let i = 0; i < connections; i++) {
      networkWorkers.push(this.generateNetworkTraffic(payloadSize, scenario.duration));
    }
    
    await Promise.all(networkWorkers);
  }

  /**
   * Concurrent operations stress scenario
   */
  private async executeConcurrentOperationsScenario(scenario: StressScenario): Promise<void> {
    console.log('🔄 Concurrent operations scenario starting...');
    
    const operations = scenario.parameters.operations || 1000;
    const operationType = scenario.parameters.type || 'mixed';
    
    const operationPromises: Promise<void>[] = [];
    
    for (let i = 0; i < operations; i++) {
      operationPromises.push(this.executeOperation(operationType, i));
    }
    
    await Promise.all(operationPromises);
  }

  /**
   * Resource starvation stress scenario
   */
  private async executeResourceStarvationScenario(scenario: StressScenario): Promise<void> {
    console.log('💾 Resource starvation scenario starting...');
    
    // Create resource contention
    const fileHandles: any[] = [];
    const maxFiles = scenario.parameters.maxFiles || 1000;
    
    try {
      for (let i = 0; i < maxFiles; i++) {
        const filename = `/tmp/stress_test_${i}_${Date.now()}.tmp`;
        const handle = await fs.open(filename, 'w');
        fileHandles.push({ handle, filename });
        
        // Brief pause to avoid overwhelming the system instantly
        if (i % 100 === 0) {
          await this.sleep(10);
        }
      }
      
      // Keep resources locked for scenario duration
      await this.sleep(scenario.duration);
      
    } finally {
      // Cleanup file handles
      for (const { handle, filename } of fileHandles) {
        try {
          await handle.close();
          await fs.unlink(filename);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Cascading failures stress scenario
   */
  private async executeCascadingFailuresScenario(scenario: StressScenario): Promise<void> {
    console.log('🌊 Cascading failures scenario starting...');
    
    // Simulate cascading failures by introducing delays and errors
    const services = scenario.parameters.services || ['auth', 'database', 'cache', 'api'];
    const failureRate = scenario.parameters.failureRate || 0.1; // 10%
    
    const failurePromises = services.map(async (service, index) => {
      // Stagger failures
      await this.sleep(index * 5000);
      
      console.log(`💥 Simulating failure in ${service} service`);
      
      // Simulate service degradation
      await this.simulateServiceFailure(service, failureRate, scenario.duration - (index * 5000));
    });
    
    await Promise.all(failurePromises);
  }

  /**
   * Monitor for breaking point conditions
   */
  private async monitorBreakingPoint(): Promise<void> {
    const checkInterval = 5000; // 5 seconds
    let consecutiveFailures = 0;
    
    while (this.testActive && !this.breakingPointReached) {
      try {
        const metrics = await this.captureCurrentMetrics();
        const violations = this.checkBreakingPointCriteria(metrics);
        
        if (violations.length > 0) {
          consecutiveFailures++;
          
          this.metrics.systemEvents.push({
            timestamp: performance.now(),
            type: 'warning',
            source: 'breaking_point_monitor',
            message: `Breaking point violations detected: ${violations.join(', ')}`
          });
          
          if (consecutiveFailures >= this.config.breakingPointCriteria.consecutiveFailureThreshold) {
            await this.recordBreakingPoint(violations, metrics);
            break;
          }
        } else {
          consecutiveFailures = 0;
        }
        
        await this.sleep(checkInterval);
        
      } catch (error) {
        console.error('Error monitoring breaking point:', error);
        await this.sleep(checkInterval);
      }
    }
  }

  /**
   * Check breaking point criteria
   */
  private checkBreakingPointCriteria(metrics: any): string[] {
    const violations: string[] = [];
    const criteria = this.config.breakingPointCriteria;
    
    if (metrics.responseTime > criteria.maxResponseTime) {
      violations.push(`Response time: ${metrics.responseTime}ms > ${criteria.maxResponseTime}ms`);
    }
    
    if (metrics.errorRate > criteria.maxErrorRate) {
      violations.push(`Error rate: ${metrics.errorRate}% > ${criteria.maxErrorRate}%`);
    }
    
    if (metrics.throughput < criteria.minSuccessfulRequests) {
      violations.push(`Throughput: ${metrics.throughput} RPS < ${criteria.minSuccessfulRequests} RPS`);
    }
    
    if (metrics.memoryUsage > criteria.maxMemoryUsage) {
      violations.push(`Memory usage: ${metrics.memoryUsage}% > ${criteria.maxMemoryUsage}%`);
    }
    
    if (metrics.cpuUsage > criteria.maxCpuUsage) {
      violations.push(`CPU usage: ${metrics.cpuUsage}% > ${criteria.maxCpuUsage}%`);
    }
    
    return violations;
  }

  /**
   * Record breaking point information
   */
  private async recordBreakingPoint(violations: string[], metrics: any): Promise<void> {
    this.breakingPointReached = true;
    
    this.metrics.breakingPoint = {
      users: this.workers.length,
      time: new Date(),
      trigger: violations.join('; '),
      metrics: {
        responseTime: metrics.responseTime,
        errorRate: metrics.errorRate,
        throughput: metrics.throughput,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage
      }
    };
    
    this.metrics.systemEvents.push({
      timestamp: performance.now(),
      type: 'critical',
      source: 'breaking_point_detector',
      message: `Breaking point reached with ${this.workers.length} users: ${violations.join('; ')}`
    });
    
    console.log(`💥 Breaking point reached with ${this.workers.length} users`);
    console.log(`   Triggers: ${violations.join('; ')}`);
  }

  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    this.monitoring = setInterval(async () => {
      try {
        const resourceUsage = await this.captureResourceUsage();
        this.metrics.resourceUsage.push(resourceUsage);
        
        const timeSeriesMetrics = await this.captureTimeSeriesMetrics();
        this.metrics.timeSeriesMetrics.push(timeSeriesMetrics);
        
        // Check for alerts
        await this.checkAlerts(resourceUsage, timeSeriesMetrics);
        
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, this.config.monitoringConfig.interval);
  }

  /**
   * Stop system monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoring) {
      clearInterval(this.monitoring);
      this.monitoring = null;
    }
  }

  // Helper methods for resource monitoring and worker management
  private async captureResourceUsage(): Promise<ResourceUsageSnapshot> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAverage = os.loadavg();
    
    return {
      timestamp: performance.now(),
      memory: {
        used: memUsage.heapUsed / 1024 / 1024,
        available: (os.totalmem() - memUsage.rss) / 1024 / 1024,
        percentage: (memUsage.rss / os.totalmem()) * 100,
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        rss: memUsage.rss / 1024 / 1024
      },
      cpu: {
        percentage: loadAverage[0] * 100 / os.cpus().length,
        loadAverage,
        user: cpuUsage.user / 1000000, // Convert to milliseconds
        system: cpuUsage.system / 1000000
      },
      network: {
        bytesIn: 0, // Would need OS-specific implementation
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        connections: this.workers.length
      },
      disk: {
        readBytes: 0, // Would need OS-specific implementation
        writeBytes: 0,
        readOperations: 0,
        writeOperations: 0,
        usagePercentage: 0
      },
      connections: {
        active: this.workers.length,
        waiting: 0,
        idle: 0,
        total: this.workers.length
      }
    };
  }

  private async captureTimeSeriesMetrics(): Promise<TimeSeriesMetrics> {
    const recentRequests = this.getRecentRequests();
    const recentResponseTimes = this.getRecentResponseTimes();
    
    return {
      timestamp: performance.now(),
      users: this.workers.length,
      requestsPerSecond: recentRequests.length,
      averageResponseTime: this.calculateAverage(recentResponseTimes),
      p95ResponseTime: this.calculatePercentile(recentResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(recentResponseTimes, 99),
      errorRate: this.calculateCurrentErrorRate(),
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests
    };
  }

  private async captureCurrentMetrics(): Promise<any> {
    const resource = await this.captureResourceUsage();
    const timeSeries = await this.captureTimeSeriesMetrics();
    
    return {
      responseTime: timeSeries.averageResponseTime,
      errorRate: timeSeries.errorRate,
      throughput: timeSeries.requestsPerSecond,
      memoryUsage: resource.memory.percentage,
      cpuUsage: resource.cpu.percentage,
      activeUsers: this.workers.length
    };
  }

  // Additional helper methods...
  private initializeMetrics(): StressTestMetrics {
    return {
      testId: `stress-test-${Date.now()}`,
      startTime: new Date(),
      maxUsers: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeSeriesMetrics: [],
      resourceUsage: [],
      systemEvents: [],
      stressScenarioResults: []
    };
  }

  private async addUsers(count: number): Promise<void> {
    // Implementation similar to LoadTestEngine
    const newWorkers: Promise<Worker>[] = [];

    for (let i = 0; i < count; i++) {
      newWorkers.push(this.createStressWorker(i));
    }

    const workers = await Promise.all(newWorkers);
    this.workers.push(...workers);
  }

  private async createStressWorker(index: number): Promise<Worker> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: `stress-worker-${Date.now()}-${index}`,
          config: this.config,
          isStressWorker: true
        }
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', reject);
      worker.on('online', () => resolve(worker));
    });
  }

  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'request-complete':
        this.metrics.totalRequests++;
        if (message.success) {
          this.metrics.successfulRequests++;
        } else {
          this.metrics.failedRequests++;
        }
        break;
      case 'error':
        this.metrics.systemEvents.push({
          timestamp: performance.now(),
          type: 'error',
          source: 'worker',
          message: message.error
        });
        break;
    }
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.min(index, sorted.length - 1)];
  }

  private calculateCurrentErrorRate(): number {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0;
  }

  private getRecentRequests(): any[] {
    // Return requests from last 10 seconds
    const cutoff = performance.now() - 10000;
    return this.metrics.timeSeriesMetrics.filter(m => m.timestamp > cutoff);
  }

  private getRecentResponseTimes(): number[] {
    // Would track response times in real implementation
    return [];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkBreakingPoint(): Promise<void> {
    // Check if current metrics violate breaking point criteria
    const metrics = await this.captureCurrentMetrics();
    const violations = this.checkBreakingPointCriteria(metrics);
    
    if (violations.length > 0) {
      await this.recordBreakingPoint(violations, metrics);
    }
  }

  private calculateScenarioImpact(preMetrics: any, postMetrics: any): ScenarioImpact {
    return {
      responseTimeDegradation: ((postMetrics.responseTime - preMetrics.responseTime) / preMetrics.responseTime) * 100,
      throughputReduction: ((preMetrics.throughput - postMetrics.throughput) / preMetrics.throughput) * 100,
      errorRateIncrease: postMetrics.errorRate - preMetrics.errorRate,
      resourceUsageIncrease: {
        memory: postMetrics.memoryUsage - preMetrics.memoryUsage,
        cpu: postMetrics.cpuUsage - preMetrics.cpuUsage
      },
      recoveryTime: 0 // Would be calculated by monitoring recovery
    };
  }

  private async createCpuIntensiveWorker(duration: number): Promise<Worker> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          type: 'cpu_intensive',
          duration,
          isCpuWorker: true
        }
      });

      worker.on('error', reject);
      worker.on('online', () => resolve(worker));
    });
  }

  private async executeDatabaseQueries(queryCount: number, duration: number): Promise<void> {
    // Simulate database queries
    const endTime = performance.now() + duration;
    let queries = 0;
    
    while (performance.now() < endTime && queries < queryCount) {
      // Simulate query
      await this.sleep(Math.random() * 100);
      queries++;
    }
  }

  private async generateNetworkTraffic(payloadSizeMB: number, duration: number): Promise<void> {
    // Simulate network traffic
    const endTime = performance.now() + duration;
    const payload = new Array(payloadSizeMB * 1024 * 1024).fill('x').join('');
    
    while (performance.now() < endTime) {
      // Simulate network operation
      await this.sleep(Math.random() * 1000);
    }
  }

  private async executeOperation(type: string, index: number): Promise<void> {
    // Simulate various operations
    switch (type) {
      case 'cpu':
        // CPU intensive operation
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sqrt(i);
        }
        break;
      case 'memory':
        // Memory intensive operation
        const data = new Array(1000000).fill(index);
        break;
      case 'io':
        // I/O intensive operation
        await this.sleep(Math.random() * 100);
        break;
      default:
        // Mixed operations
        await this.executeOperation(['cpu', 'memory', 'io'][index % 3], index);
    }
  }

  private async simulateServiceFailure(service: string, failureRate: number, duration: number): Promise<void> {
    const endTime = performance.now() + duration;
    
    while (performance.now() < endTime) {
      // Randomly inject failures
      if (Math.random() < failureRate) {
        this.metrics.systemEvents.push({
          timestamp: performance.now(),
          type: 'error',
          source: `service_${service}`,
          message: `Simulated failure in ${service} service`
        });
      }
      
      await this.sleep(1000);
    }
  }

  private async checkAlerts(resource: ResourceUsageSnapshot, timeSeries: TimeSeriesMetrics): Promise<void> {
    for (const alert of this.config.monitoringConfig.alerts) {
      let value: number;
      
      switch (alert.metric) {
        case 'memory':
          value = resource.memory.percentage;
          break;
        case 'cpu':
          value = resource.cpu.percentage;
          break;
        case 'response_time':
          value = timeSeries.averageResponseTime;
          break;
        case 'error_rate':
          value = timeSeries.errorRate;
          break;
        default:
          continue;
      }
      
      const triggered = alert.condition === 'above' ? value > alert.threshold : value < alert.threshold;
      
      if (triggered) {
        await this.handleAlert(alert, value);
      }
    }
  }

  private async handleAlert(alert: AlertConfig, value: number): Promise<void> {
    const alertEvent: SystemEvent = {
      timestamp: performance.now(),
      type: 'warning',
      source: 'alert_system',
      message: `Alert triggered: ${alert.metric} is ${alert.condition} ${alert.threshold} (current: ${value})`
    };
    
    this.metrics.systemEvents.push(alertEvent);
    
    switch (alert.action) {
      case 'log':
        console.warn(`⚠️ ${alertEvent.message}`);
        break;
      case 'stop_test':
        console.error(`🛑 Stopping test due to alert: ${alertEvent.message}`);
        this.testActive = false;
        break;
      case 'scale_down':
        console.warn(`📉 Scaling down due to alert: ${alertEvent.message}`);
        await this.scaleDownWorkers(Math.ceil(this.workers.length * 0.1));
        break;
      case 'notify':
        // Would send notification in real implementation
        console.log(`📢 Notification: ${alertEvent.message}`);
        break;
    }
  }

  private async scaleDownWorkers(count: number): Promise<void> {
    const workersToRemove = this.workers.splice(0, count);
    await Promise.all(workersToRemove.map(worker => worker.terminate()));
  }

  private async generateStressTestResult(): Promise<StressTestResult> {
    const duration = this.metrics.endTime!.getTime() - this.metrics.startTime.getTime();
    
    return {
      testInfo: {
        testId: this.metrics.testId,
        name: this.config.name,
        duration,
        startTime: this.metrics.startTime,
        endTime: this.metrics.endTime!
      },
      breakingPoint: this.metrics.breakingPoint,
      maxUsersAchieved: this.metrics.maxUsers,
      performanceDegradation: this.calculatePerformanceDegradation(),
      resourceUtilization: this.calculateResourceUtilization(),
      scenarioResults: this.metrics.stressScenarioResults,
      systemEvents: this.metrics.systemEvents,
      recommendations: this.generateStressTestRecommendations(),
      rawMetrics: this.metrics
    };
  }

  private calculatePerformanceDegradation(): any {
    // Calculate how performance degraded during the test
    return {};
  }

  private calculateResourceUtilization(): any {
    // Calculate peak resource utilization
    return {};
  }

  private generateStressTestRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.breakingPoint) {
      recommendations.push(`Breaking point reached at ${this.metrics.breakingPoint.users} users`);
      recommendations.push(`Consider scaling infrastructure to handle peak loads`);
    } else {
      recommendations.push('No breaking point found - system handled maximum test load');
      recommendations.push('Consider increasing test intensity for more comprehensive stress testing');
    }
    
    return recommendations;
  }

  private async saveResults(result: StressTestResult): Promise<void> {
    const resultsDir = path.join(__dirname, '../results');
    await fs.mkdir(resultsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `stress-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`📊 Stress test results saved to: ${filepath}`);
  }

  private async cleanup(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
  }
}

// ============================================================================
// Worker Thread Implementations
// ============================================================================

if (!isMainThread && workerData?.isStressWorker) {
  const { workerId, config } = workerData;
  
  class StressWorker {
    private id: string;
    private config: StressTestConfig;
    private active: boolean = true;

    constructor(id: string, config: StressTestConfig) {
      this.id = id;
      this.config = config;
    }

    async start(): Promise<void> {
      while (this.active) {
        try {
          const startTime = performance.now();
          
          // Simulate high-intensity requests
          await this.executeStressRequest();
          
          const responseTime = performance.now() - startTime;
          const success = Math.random() > 0.1; // 90% success rate under stress
          
          parentPort?.postMessage({
            type: 'request-complete',
            success,
            responseTime,
            workerId: this.id
          });
          
          // Brief pause
          await this.sleep(Math.random() * 100);
          
        } catch (error) {
          parentPort?.postMessage({
            type: 'error',
            error: error.message,
            workerId: this.id
          });
        }
      }
    }

    private async executeStressRequest(): Promise<void> {
      // Simulate stress request with higher resource usage
      const operations = Math.floor(Math.random() * 1000);
      let result = 0;
      
      for (let i = 0; i < operations; i++) {
        result += Math.sqrt(Math.random() * 1000);
      }
      
      // Simulate network latency under stress
      await this.sleep(50 + Math.random() * 200);
    }

    private async sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop(): void {
      this.active = false;
    }
  }

  const worker = new StressWorker(workerId, config);
  worker.start().catch(console.error);
}

if (!isMainThread && workerData?.isCpuWorker) {
  const { duration } = workerData;
  
  // CPU intensive worker
  const endTime = performance.now() + duration;
  
  while (performance.now() < endTime) {
    // Intensive CPU operations
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(Math.sin(Math.cos(i)) * Math.random());
    }
  }
}

// ============================================================================
// Additional Types for Results
// ============================================================================

interface StressTestResult {
  testInfo: {
    testId: string;
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  };
  breakingPoint?: BreakingPoint;
  maxUsersAchieved: number;
  performanceDegradation: any;
  resourceUtilization: any;
  scenarioResults: StressScenarioResult[];
  systemEvents: SystemEvent[];
  recommendations: string[];
  rawMetrics: StressTestMetrics;
}

export { StressTestEngine, StressTestConfig, StressTestResult };