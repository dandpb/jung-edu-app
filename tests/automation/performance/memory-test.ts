/**
 * Memory Leak Detection and Monitoring Tests for jaqEdu Platform
 * Comprehensive memory leak detection with heap analysis, garbage collection monitoring,
 * and memory usage pattern analysis
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface MemoryTestConfig {
  name: string;
  description: string;
  testDuration: number; // milliseconds
  samplingInterval: number; // milliseconds
  thresholds: MemoryThresholds;
  leakDetectionSettings: LeakDetectionSettings;
  testScenarios: MemoryTestScenario[];
  gcMonitoring: GCMonitoringConfig;
}

interface MemoryThresholds {
  heapUsed: {
    warning: number; // MB
    critical: number; // MB
  };
  heapTotal: {
    warning: number; // MB
    critical: number; // MB
  };
  rss: {
    warning: number; // MB
    critical: number; // MB
  };
  external: {
    warning: number; // MB
    critical: number; // MB
  };
  leakRate: {
    warning: number; // MB per minute
    critical: number; // MB per minute
  };
  growthRate: {
    warning: number; // percentage per minute
    critical: number; // percentage per minute
  };
}

interface LeakDetectionSettings {
  enabled: boolean;
  windowSize: number; // number of samples
  significantGrowth: number; // MB
  consistentGrowthPeriods: number;
  gcEfficiencyThreshold: number; // percentage
  stabilizationTime: number; // milliseconds
}

interface MemoryTestScenario {
  name: string;
  type: MemoryScenarioType;
  duration: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  parameters: any;
  expectedBehavior: ExpectedMemoryBehavior;
}

type MemoryScenarioType = 
  | 'normal_operations'
  | 'memory_intensive'
  | 'object_creation'
  | 'closure_leaks'
  | 'event_listener_leaks'
  | 'timer_leaks'
  | 'dom_leaks'
  | 'cache_growth'
  | 'buffer_accumulation';

interface ExpectedMemoryBehavior {
  pattern: 'stable' | 'sawtooth' | 'growing' | 'spiky';
  maxGrowth: number; // MB
  gcRecoveryRate: number; // percentage
  stabilizationTime: number; // milliseconds
}

interface GCMonitoringConfig {
  enabled: boolean;
  trackTypes: GCType[];
  performanceMarks: boolean;
  heapSnapshots: boolean;
  snapshotInterval: number; // milliseconds
}

type GCType = 'scavenge' | 'mark-sweep' | 'incremental-marking' | 'weak-callback';

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  gcEvents: GCEvent[];
  objectCounts?: ObjectTypeCount[];
  leakSuspects?: LeakSuspect[];
}

interface GCEvent {
  timestamp: number;
  type: string;
  duration: number;
  heapBefore: number;
  heapAfter: number;
  reclaimed: number;
  efficiency: number; // percentage
}

interface ObjectTypeCount {
  type: string;
  count: number;
  totalSize: number;
  avgSize: number;
}

interface LeakSuspect {
  type: string;
  location?: string;
  growthRate: number; // objects per minute
  retainedSize: number; // bytes
  confidence: number; // 0-1
}

interface MemoryTestMetrics {
  testId: string;
  startTime: Date;
  endTime?: Date;
  snapshots: MemorySnapshot[];
  leakDetections: LeakDetection[];
  gcAnalysis: GCAnalysis;
  scenarioResults: MemoryScenarioResult[];
  performanceImpact: PerformanceImpact;
  recommendations: string[];
}

interface LeakDetection {
  timestamp: number;
  type: 'potential' | 'confirmed' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  growthRate: number;
  totalSize: number;
  confidence: number;
  pattern: LeakPattern;
}

interface LeakPattern {
  type: 'linear' | 'exponential' | 'periodic' | 'stepped';
  slope: number;
  correlation: number;
  duration: number;
}

interface GCAnalysis {
  totalEvents: number;
  eventsByType: Map<string, number>;
  averageDuration: number;
  totalPauseTime: number;
  efficiency: number; // average
  pressure: number; // frequency indicator
  recommendations: string[];
}

interface MemoryScenarioResult {
  scenario: string;
  type: MemoryScenarioType;
  startTime: Date;
  endTime: Date;
  success: boolean;
  memoryImpact: MemoryImpact;
  leaksDetected: LeakDetection[];
  gcBehavior: GCBehavior;
  analysis: ScenarioAnalysis;
}

interface MemoryImpact {
  startMemory: number;
  endMemory: number;
  peakMemory: number;
  averageMemory: number;
  totalGrowth: number;
  netGrowth: number;
  volatility: number;
}

interface GCBehavior {
  frequency: number; // events per minute
  efficiency: number; // average percentage
  pauseTime: number; // total milliseconds
  pressure: number; // 0-1 scale
}

interface ScenarioAnalysis {
  meetsExpectations: boolean;
  deviations: string[];
  leakRisk: 'low' | 'medium' | 'high';
  stabilityScore: number; // 0-100
}

interface PerformanceImpact {
  cpuOverhead: number; // percentage
  responseTimeImpact: number; // percentage
  throughputImpact: number; // percentage
  overallScore: number; // 0-100
}

// ============================================================================
// Memory Test Engine
// ============================================================================

export class MemoryTestEngine extends EventEmitter {
  private config: MemoryTestConfig;
  private metrics: MemoryTestMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcObserver: PerformanceObserver | null = null;
  private testActive: boolean = false;
  private workers: Worker[] = [];
  private heapSnapshots: any[] = [];

  constructor(config: MemoryTestConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Execute comprehensive memory test
   */
  async executeMemoryTest(): Promise<MemoryTestResult> {
    console.log(`🧠 Starting memory test: ${this.config.name}`);
    console.log(`  Duration: ${this.config.testDuration / 1000}s`);
    console.log(`  Sampling Interval: ${this.config.samplingInterval}ms`);

    this.testActive = true;
    this.metrics.startTime = new Date();

    try {
      // Force initial garbage collection for clean baseline
      if (global.gc) {
        global.gc();
        await this.sleep(1000);
      }

      // Start monitoring systems
      this.startMemoryMonitoring();
      this.startGCMonitoring();

      // Capture baseline
      const baseline = await this.captureMemorySnapshot();
      this.metrics.snapshots.push(baseline);

      // Execute memory test scenarios
      const scenarioPromises = this.config.testScenarios.map(scenario =>
        this.executeMemoryScenario(scenario)
      );

      await Promise.allSettled(scenarioPromises);

      // Final stabilization period
      console.log('🔄 Allowing memory stabilization...');
      await this.sleep(this.config.leakDetectionSettings.stabilizationTime);

      // Force final GC and capture final state
      if (global.gc) {
        global.gc();
        await this.sleep(1000);
      }

      const finalSnapshot = await this.captureMemorySnapshot();
      this.metrics.snapshots.push(finalSnapshot);

      this.metrics.endTime = new Date();

      // Analyze results
      await this.analyzeMemoryPatterns();
      await this.detectMemoryLeaks();
      await this.analyzeGCBehavior();

      // Generate comprehensive results
      const result = await this.generateMemoryTestResult();

      // Save results
      await this.saveResults(result);

      console.log('✅ Memory test completed');
      return result;

    } catch (error) {
      console.error('❌ Memory test failed:', error);
      throw error;
    } finally {
      this.testActive = false;
      this.stopMonitoring();
      await this.cleanup();
    }
  }

  /**
   * Execute individual memory scenario
   */
  private async executeMemoryScenario(scenario: MemoryTestScenario): Promise<MemoryScenarioResult> {
    console.log(`🎯 Executing memory scenario: ${scenario.name}`);
    
    const startTime = new Date();
    const startSnapshot = await this.captureMemorySnapshot();
    const initialLeaks = [...this.metrics.leakDetections];

    try {
      // Execute scenario based on type
      switch (scenario.type) {
        case 'normal_operations':
          await this.executeNormalOperationsScenario(scenario);
          break;
        case 'memory_intensive':
          await this.executeMemoryIntensiveScenario(scenario);
          break;
        case 'object_creation':
          await this.executeObjectCreationScenario(scenario);
          break;
        case 'closure_leaks':
          await this.executeClosureLeaksScenario(scenario);
          break;
        case 'event_listener_leaks':
          await this.executeEventListenerLeaksScenario(scenario);
          break;
        case 'timer_leaks':
          await this.executeTimerLeaksScenario(scenario);
          break;
        case 'cache_growth':
          await this.executeCacheGrowthScenario(scenario);
          break;
        case 'buffer_accumulation':
          await this.executeBufferAccumulationScenario(scenario);
          break;
        default:
          throw new Error(`Unknown scenario type: ${scenario.type}`);
      }

      const endTime = new Date();
      const endSnapshot = await this.captureMemorySnapshot();
      const newLeaks = this.metrics.leakDetections.slice(initialLeaks.length);

      return {
        scenario: scenario.name,
        type: scenario.type,
        startTime,
        endTime,
        success: true,
        memoryImpact: this.calculateMemoryImpact(startSnapshot, endSnapshot),
        leaksDetected: newLeaks,
        gcBehavior: this.calculateGCBehavior(startTime, endTime),
        analysis: this.analyzeScenario(scenario, startSnapshot, endSnapshot, newLeaks)
      };

    } catch (error) {
      console.error(`❌ Scenario failed: ${scenario.name}`, error);
      
      return {
        scenario: scenario.name,
        type: scenario.type,
        startTime,
        endTime: new Date(),
        success: false,
        memoryImpact: {} as MemoryImpact,
        leaksDetected: [],
        gcBehavior: {} as GCBehavior,
        analysis: {
          meetsExpectations: false,
          deviations: [`Scenario execution failed: ${error.message}`],
          leakRisk: 'high',
          stabilityScore: 0
        }
      };
    }
  }

  /**
   * Normal operations scenario
   */
  private async executeNormalOperationsScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('📊 Normal operations scenario starting...');
    
    const operations = scenario.parameters.operations || 10000;
    const workers = scenario.parameters.workers || 5;
    
    // Spawn workers for normal operations
    const normalWorkers: Worker[] = [];
    for (let i = 0; i < workers; i++) {
      const worker = await this.createMemoryWorker('normal', { operations: operations / workers });
      normalWorkers.push(worker);
    }
    
    this.workers.push(...normalWorkers);
    
    // Wait for scenario duration
    await this.sleep(scenario.duration);
    
    // Clean up workers
    await Promise.all(normalWorkers.map(worker => worker.terminate()));
    this.workers = this.workers.filter(w => !normalWorkers.includes(w));
  }

  /**
   * Memory intensive scenario
   */
  private async executeMemoryIntensiveScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('💾 Memory intensive scenario starting...');
    
    const allocations: any[] = [];
    const chunkSizeMB = scenario.parameters.chunkSizeMB || 50;
    const maxAllocations = scenario.parameters.maxAllocations || 20;
    
    const allocationInterval = setInterval(() => {
      if (allocations.length < maxAllocations) {
        // Allocate large chunks of memory
        const chunk = new Array(chunkSizeMB * 1024 * 1024 / 8).fill(Math.random());
        allocations.push(chunk);
        console.log(`  Allocated ${chunkSizeMB}MB chunk (${allocations.length}/${maxAllocations})`);
      }
    }, 1000);
    
    // Wait for scenario duration
    await this.sleep(scenario.duration);
    
    clearInterval(allocationInterval);
    
    // Gradually release memory
    console.log('🧹 Releasing allocated memory...');
    const releaseInterval = setInterval(() => {
      if (allocations.length > 0) {
        allocations.shift();
      } else {
        clearInterval(releaseInterval);
      }
    }, 500);
    
    // Wait for cleanup
    await this.sleep(5000);
  }

  /**
   * Object creation scenario
   */
  private async executeObjectCreationScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('🏗️ Object creation scenario starting...');
    
    const objectTypes = scenario.parameters.objectTypes || ['simple', 'complex', 'nested'];
    const objectsPerSecond = scenario.parameters.objectsPerSecond || 1000;
    const keepAlivePercentage = scenario.parameters.keepAlivePercentage || 10;
    
    const objects: any[] = [];
    let objectCounter = 0;
    
    const creationInterval = setInterval(() => {
      for (let i = 0; i < objectsPerSecond / 10; i++) { // 100ms interval
        const type = objectTypes[objectCounter % objectTypes.length];
        const obj = this.createTestObject(type, objectCounter++);
        
        // Keep some objects alive to test retention
        if (Math.random() * 100 < keepAlivePercentage) {
          objects.push(obj);
        }
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(creationInterval);
    
    // Cleanup retained objects
    objects.splice(0, objects.length);
  }

  /**
   * Closure leaks scenario
   */
  private async executeClosureLeaksScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('🔗 Closure leaks scenario starting...');
    
    const leakyClosures: any[] = [];
    const closuresPerSecond = scenario.parameters.closuresPerSecond || 100;
    
    const leakInterval = setInterval(() => {
      for (let i = 0; i < closuresPerSecond / 10; i++) {
        const closure = this.createLeakyClosure(i);
        leakyClosures.push(closure);
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(leakInterval);
    
    // Cleanup (in real leak scenario, these might not be properly cleaned)
    leakyClosures.splice(0, leakyClosures.length);
  }

  /**
   * Event listener leaks scenario
   */
  private async executeEventListenerLeaksScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('👂 Event listener leaks scenario starting...');
    
    const emitters: EventEmitter[] = [];
    const listenersPerSecond = scenario.parameters.listenersPerSecond || 50;
    
    const leakInterval = setInterval(() => {
      for (let i = 0; i < listenersPerSecond / 10; i++) {
        const emitter = new EventEmitter();
        const listener = () => { /* leak */ };
        
        emitter.on('test', listener);
        emitters.push(emitter);
        
        // Simulate forgetting to remove listeners
        if (Math.random() > 0.8) { // 20% chance of proper cleanup
          emitter.removeListener('test', listener);
        }
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(leakInterval);
    
    // Cleanup remaining emitters
    emitters.forEach(emitter => emitter.removeAllListeners());
    emitters.splice(0, emitters.length);
  }

  /**
   * Timer leaks scenario
   */
  private async executeTimerLeaksScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('⏱️ Timer leaks scenario starting...');
    
    const timers: NodeJS.Timeout[] = [];
    const timersPerSecond = scenario.parameters.timersPerSecond || 20;
    
    const leakInterval = setInterval(() => {
      for (let i = 0; i < timersPerSecond / 10; i++) {
        const timer = setTimeout(() => {
          // Timer callback that holds references
        }, Math.random() * 10000);
        
        timers.push(timer);
        
        // Simulate forgetting to clear timers
        if (Math.random() > 0.7) { // 30% chance of proper cleanup
          clearTimeout(timer);
        }
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(leakInterval);
    
    // Cleanup remaining timers
    timers.forEach(timer => clearTimeout(timer));
    timers.splice(0, timers.length);
  }

  /**
   * Cache growth scenario
   */
  private async executeCacheGrowthScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('🗄️ Cache growth scenario starting...');
    
    const cache = new Map<string, any>();
    const cacheGrowthRate = scenario.parameters.growthRate || 1000; // items per second
    const maxCacheSize = scenario.parameters.maxSize || 100000;
    
    let itemCounter = 0;
    
    const growthInterval = setInterval(() => {
      for (let i = 0; i < cacheGrowthRate / 10 && cache.size < maxCacheSize; i++) {
        const key = `item_${itemCounter++}`;
        const value = this.createTestObject('complex', itemCounter);
        cache.set(key, value);
      }
      
      // Occasional cleanup (LRU simulation)
      if (cache.size > maxCacheSize * 0.8 && Math.random() > 0.9) {
        const keys = Array.from(cache.keys());
        const toDelete = keys.slice(0, Math.floor(keys.length * 0.1));
        toDelete.forEach(key => cache.delete(key));
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(growthInterval);
    
    // Cleanup cache
    cache.clear();
  }

  /**
   * Buffer accumulation scenario
   */
  private async executeBufferAccumulationScenario(scenario: MemoryTestScenario): Promise<void> {
    console.log('📦 Buffer accumulation scenario starting...');
    
    const buffers: Buffer[] = [];
    const bufferSizeKB = scenario.parameters.bufferSizeKB || 100;
    const buffersPerSecond = scenario.parameters.buffersPerSecond || 50;
    
    const accumInterval = setInterval(() => {
      for (let i = 0; i < buffersPerSecond / 10; i++) {
        const buffer = Buffer.alloc(bufferSizeKB * 1024, 'buffer data');
        buffers.push(buffer);
        
        // Simulate buffer processing delay
        if (buffers.length > 1000) {
          buffers.shift(); // Remove oldest buffer
        }
      }
    }, 100);
    
    await this.sleep(scenario.duration);
    clearInterval(accumInterval);
    
    // Cleanup buffers
    buffers.splice(0, buffers.length);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    console.log('📊 Starting memory monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const snapshot = await this.captureMemorySnapshot();
        this.metrics.snapshots.push(snapshot);
        
        // Check for memory threshold violations
        await this.checkMemoryThresholds(snapshot);
        
        // Continuous leak detection
        await this.continuousLeakDetection();
        
      } catch (error) {
        console.error('Memory monitoring error:', error);
      }
    }, this.config.samplingInterval);
  }

  /**
   * Start garbage collection monitoring
   */
  private startGCMonitoring(): void {
    if (!this.config.gcMonitoring.enabled) return;
    
    console.log('🗑️ Starting GC monitoring...');
    
    this.gcObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'gc') {
          const gcEvent: GCEvent = {
            timestamp: entry.startTime,
            type: (entry as any).kind || 'unknown',
            duration: entry.duration,
            heapBefore: 0, // Would be available in real GC info
            heapAfter: 0,
            reclaimed: 0,
            efficiency: 0
          };
          
          // Add to most recent snapshot
          if (this.metrics.snapshots.length > 0) {
            const lastSnapshot = this.metrics.snapshots[this.metrics.snapshots.length - 1];
            lastSnapshot.gcEvents.push(gcEvent);
          }
        }
      });
    });
    
    this.gcObserver.observe({ entryTypes: ['gc'], buffered: false });
    
    // Take heap snapshots periodically if enabled
    if (this.config.gcMonitoring.heapSnapshots) {
      setInterval(() => {
        this.captureHeapSnapshot();
      }, this.config.gcMonitoring.snapshotInterval);
    }
  }

  /**
   * Capture memory snapshot
   */
  private async captureMemorySnapshot(): Promise<MemorySnapshot> {
    const memUsage = process.memoryUsage();
    
    return {
      timestamp: performance.now(),
      heapUsed: memUsage.heapUsed / 1024 / 1024, // Convert to MB
      heapTotal: memUsage.heapTotal / 1024 / 1024,
      external: memUsage.external / 1024 / 1024,
      rss: memUsage.rss / 1024 / 1024,
      arrayBuffers: memUsage.arrayBuffers / 1024 / 1024,
      gcEvents: [],
      objectCounts: await this.analyzeObjectCounts(),
      leakSuspects: await this.identifyLeakSuspects()
    };
  }

  /**
   * Capture heap snapshot for detailed analysis
   */
  private async captureHeapSnapshot(): Promise<void> {
    try {
      // In real implementation, would use v8.writeHeapSnapshot()
      const snapshot = {
        timestamp: performance.now(),
        heapSize: process.memoryUsage().heapUsed,
        objects: 'heap_snapshot_data' // Placeholder
      };
      
      this.heapSnapshots.push(snapshot);
      
      // Keep only recent snapshots
      if (this.heapSnapshots.length > 10) {
        this.heapSnapshots.shift();
      }
    } catch (error) {
      console.warn('Failed to capture heap snapshot:', error);
    }
  }

  /**
   * Continuous leak detection
   */
  private async continuousLeakDetection(): Promise<void> {
    if (!this.config.leakDetectionSettings.enabled) return;
    
    const windowSize = this.config.leakDetectionSettings.windowSize;
    if (this.metrics.snapshots.length < windowSize) return;
    
    const recentSnapshots = this.metrics.snapshots.slice(-windowSize);
    const leaks = await this.analyzeForLeaks(recentSnapshots);
    
    leaks.forEach(leak => {
      this.metrics.leakDetections.push(leak);
      console.warn(`🚨 Memory leak detected: ${leak.type} (${leak.severity})`);
    });
  }

  /**
   * Analyze snapshots for memory leaks
   */
  private async analyzeForLeaks(snapshots: MemorySnapshot[]): Promise<LeakDetection[]> {
    const leaks: LeakDetection[] = [];
    
    if (snapshots.length < 2) return leaks;
    
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const timeSpan = (last.timestamp - first.timestamp) / 60000; // minutes
    
    // Analyze heap growth
    const heapGrowth = last.heapUsed - first.heapUsed;
    const growthRate = heapGrowth / timeSpan; // MB per minute
    
    if (growthRate > this.config.leakDetectionSettings.significantGrowth) {
      const pattern = this.analyzeGrowthPattern(snapshots.map(s => s.heapUsed));
      
      leaks.push({
        timestamp: performance.now(),
        type: pattern.type === 'linear' ? 'confirmed' : 'potential',
        severity: this.calculateLeakSeverity(growthRate),
        growthRate,
        totalSize: heapGrowth,
        confidence: pattern.correlation,
        pattern
      });
    }
    
    // Analyze object count patterns
    const objectLeaks = await this.analyzeObjectLeaks(snapshots);
    leaks.push(...objectLeaks);
    
    return leaks;
  }

  /**
   * Analyze growth pattern
   */
  private analyzeGrowthPattern(values: number[]): LeakPattern {
    if (values.length < 2) {
      return {
        type: 'linear',
        slope: 0,
        correlation: 0,
        duration: 0
      };
    }
    
    // Simple linear regression
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xSum = xValues.reduce((sum, x) => sum + x, 0);
    const ySum = values.reduce((sum, y) => sum + y, 0);
    const xySum = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const xSquaredSum = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    
    // Calculate correlation coefficient
    const xMean = xSum / n;
    const yMean = ySum / n;
    
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
    const denomX = Math.sqrt(xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0));
    const denomY = Math.sqrt(values.reduce((sum, y) => sum + (y - yMean) ** 2, 0));
    
    const correlation = numerator / (denomX * denomY);
    
    return {
      type: Math.abs(correlation) > 0.8 ? 'linear' : 'periodic',
      slope,
      correlation: Math.abs(correlation),
      duration: n
    };
  }

  /**
   * Calculate leak severity
   */
  private calculateLeakSeverity(growthRate: number): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = this.config.thresholds.leakRate;
    
    if (growthRate >= thresholds.critical) return 'critical';
    if (growthRate >= thresholds.warning) return 'high';
    if (growthRate >= thresholds.warning * 0.5) return 'medium';
    return 'low';
  }

  // Helper methods and utilities
  private initializeMetrics(): MemoryTestMetrics {
    return {
      testId: `memory-test-${Date.now()}`,
      startTime: new Date(),
      snapshots: [],
      leakDetections: [],
      gcAnalysis: {
        totalEvents: 0,
        eventsByType: new Map(),
        averageDuration: 0,
        totalPauseTime: 0,
        efficiency: 0,
        pressure: 0,
        recommendations: []
      },
      scenarioResults: [],
      performanceImpact: {
        cpuOverhead: 0,
        responseTimeImpact: 0,
        throughputImpact: 0,
        overallScore: 0
      },
      recommendations: []
    };
  }

  private async createMemoryWorker(type: string, params: any): Promise<Worker> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          type,
          params,
          isMemoryWorker: true
        }
      });

      worker.on('error', reject);
      worker.on('online', () => resolve(worker));
    });
  }

  private createTestObject(type: string, id: number): any {
    switch (type) {
      case 'simple':
        return { id, value: Math.random(), timestamp: Date.now() };
      case 'complex':
        return {
          id,
          data: new Array(100).fill(Math.random()),
          nested: { deep: { value: id } },
          timestamp: Date.now()
        };
      case 'nested':
        const obj: any = { id };
        let current = obj;
        for (let i = 0; i < 10; i++) {
          current.next = { level: i, data: Math.random() };
          current = current.next;
        }
        return obj;
      default:
        return { id };
    }
  }

  private createLeakyClosure(id: number): any {
    const largeData = new Array(1000).fill(Math.random());
    
    return function() {
      // Closure that retains reference to largeData
      return largeData[id % largeData.length];
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = null;
    }
  }

  private async cleanup(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
  }

  // Analysis methods (simplified implementations)
  private async analyzeObjectCounts(): Promise<ObjectTypeCount[]> {
    // Would use heap profiling in real implementation
    return [];
  }

  private async identifyLeakSuspects(): Promise<LeakSuspect[]> {
    // Would analyze object retention in real implementation
    return [];
  }

  private async checkMemoryThresholds(snapshot: MemorySnapshot): Promise<void> {
    const thresholds = this.config.thresholds;
    
    if (snapshot.heapUsed > thresholds.heapUsed.critical) {
      console.warn(`🚨 Critical heap usage: ${snapshot.heapUsed.toFixed(2)}MB`);
    }
    
    if (snapshot.rss > thresholds.rss.critical) {
      console.warn(`🚨 Critical RSS usage: ${snapshot.rss.toFixed(2)}MB`);
    }
  }

  private async analyzeObjectLeaks(snapshots: MemorySnapshot[]): Promise<LeakDetection[]> {
    // Would analyze object count growth patterns
    return [];
  }

  private calculateMemoryImpact(start: MemorySnapshot, end: MemorySnapshot): MemoryImpact {
    return {
      startMemory: start.heapUsed,
      endMemory: end.heapUsed,
      peakMemory: Math.max(start.heapUsed, end.heapUsed),
      averageMemory: (start.heapUsed + end.heapUsed) / 2,
      totalGrowth: end.heapUsed - start.heapUsed,
      netGrowth: end.heapUsed - start.heapUsed,
      volatility: 0 // Would calculate from snapshots
    };
  }

  private calculateGCBehavior(startTime: Date, endTime: Date): GCBehavior {
    const duration = endTime.getTime() - startTime.getTime();
    const gcEvents = this.metrics.snapshots
      .flatMap(s => s.gcEvents)
      .filter(e => e.timestamp >= startTime.getTime() && e.timestamp <= endTime.getTime());
    
    return {
      frequency: (gcEvents.length / duration) * 60000, // per minute
      efficiency: gcEvents.length > 0 ? gcEvents.reduce((sum, e) => sum + e.efficiency, 0) / gcEvents.length : 0,
      pauseTime: gcEvents.reduce((sum, e) => sum + e.duration, 0),
      pressure: Math.min(1, gcEvents.length / 100) // normalized pressure
    };
  }

  private analyzeScenario(scenario: MemoryTestScenario, start: MemorySnapshot, end: MemorySnapshot, leaks: LeakDetection[]): ScenarioAnalysis {
    const growth = end.heapUsed - start.heapUsed;
    const meetsExpected = growth <= scenario.expectedBehavior.maxGrowth;
    
    return {
      meetsExpectations: meetsExpected && leaks.length === 0,
      deviations: meetsExpected ? [] : [`Memory growth ${growth.toFixed(2)}MB exceeds expected ${scenario.expectedBehavior.maxGrowth}MB`],
      leakRisk: leaks.length > 0 ? 'high' : growth > scenario.expectedBehavior.maxGrowth ? 'medium' : 'low',
      stabilityScore: Math.max(0, 100 - (growth / scenario.expectedBehavior.maxGrowth) * 50)
    };
  }

  private async analyzeMemoryPatterns(): Promise<void> {
    // Analyze memory usage patterns across all snapshots
  }

  private async detectMemoryLeaks(): Promise<void> {
    // Comprehensive leak detection analysis
  }

  private async analyzeGCBehavior(): Promise<void> {
    const allGCEvents = this.metrics.snapshots.flatMap(s => s.gcEvents);
    
    this.metrics.gcAnalysis = {
      totalEvents: allGCEvents.length,
      eventsByType: new Map(),
      averageDuration: allGCEvents.length > 0 ? allGCEvents.reduce((sum, e) => sum + e.duration, 0) / allGCEvents.length : 0,
      totalPauseTime: allGCEvents.reduce((sum, e) => sum + e.duration, 0),
      efficiency: allGCEvents.length > 0 ? allGCEvents.reduce((sum, e) => sum + e.efficiency, 0) / allGCEvents.length : 0,
      pressure: Math.min(1, allGCEvents.length / 1000),
      recommendations: this.generateGCRecommendations(allGCEvents)
    };
  }

  private generateGCRecommendations(gcEvents: GCEvent[]): string[] {
    const recommendations: string[] = [];
    
    if (gcEvents.length > 100) {
      recommendations.push('High GC frequency detected - consider optimizing object allocation patterns');
    }
    
    const avgEfficiency = gcEvents.length > 0 ? gcEvents.reduce((sum, e) => sum + e.efficiency, 0) / gcEvents.length : 0;
    if (avgEfficiency < 50) {
      recommendations.push('Low GC efficiency - objects may be retained longer than necessary');
    }
    
    return recommendations;
  }

  private async generateMemoryTestResult(): Promise<MemoryTestResult> {
    const duration = this.metrics.endTime!.getTime() - this.metrics.startTime.getTime();
    
    return {
      testInfo: {
        testId: this.metrics.testId,
        name: this.config.name,
        duration,
        startTime: this.metrics.startTime,
        endTime: this.metrics.endTime!
      },
      memoryAnalysis: {
        baselineMemory: this.metrics.snapshots[0]?.heapUsed || 0,
        peakMemory: Math.max(...this.metrics.snapshots.map(s => s.heapUsed)),
        finalMemory: this.metrics.snapshots[this.metrics.snapshots.length - 1]?.heapUsed || 0,
        averageMemory: this.metrics.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.metrics.snapshots.length,
        memoryGrowth: (this.metrics.snapshots[this.metrics.snapshots.length - 1]?.heapUsed || 0) - (this.metrics.snapshots[0]?.heapUsed || 0)
      },
      leakDetections: this.metrics.leakDetections,
      gcAnalysis: this.metrics.gcAnalysis,
      scenarioResults: this.metrics.scenarioResults,
      performanceImpact: this.metrics.performanceImpact,
      thresholdViolations: this.calculateThresholdViolations(),
      recommendations: this.generateMemoryRecommendations(),
      rawMetrics: this.metrics
    };
  }

  private calculateThresholdViolations(): any[] {
    // Calculate threshold violations from snapshots
    return [];
  }

  private generateMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.leakDetections.length > 0) {
      recommendations.push(`${this.metrics.leakDetections.length} potential memory leaks detected`);
      recommendations.push('Review object lifecycle management and cleanup procedures');
    }
    
    const peakMemory = Math.max(...this.metrics.snapshots.map(s => s.heapUsed));
    if (peakMemory > this.config.thresholds.heapUsed.warning) {
      recommendations.push('Peak memory usage exceeds warning threshold');
      recommendations.push('Consider implementing memory pooling or object reuse strategies');
    }
    
    return recommendations;
  }

  private async saveResults(result: MemoryTestResult): Promise<void> {
    const resultsDir = path.join(__dirname, '../results');
    await fs.mkdir(resultsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `memory-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`📊 Memory test results saved to: ${filepath}`);
  }
}

// ============================================================================
// Worker Thread Implementation
// ============================================================================

if (!isMainThread && workerData?.isMemoryWorker) {
  const { type, params } = workerData;
  
  class MemoryWorker {
    private type: string;
    private params: any;
    private active: boolean = true;

    constructor(type: string, params: any) {
      this.type = type;
      this.params = params;
    }

    async start(): Promise<void> {
      switch (this.type) {
        case 'normal':
          await this.executeNormalOperations();
          break;
        case 'intensive':
          await this.executeIntensiveOperations();
          break;
        default:
          throw new Error(`Unknown worker type: ${this.type}`);
      }
    }

    private async executeNormalOperations(): Promise<void> {
      const operations = this.params.operations || 1000;
      const objects: any[] = [];
      
      for (let i = 0; i < operations && this.active; i++) {
        // Simulate normal object operations
        const obj = {
          id: i,
          data: Math.random(),
          timestamp: Date.now()
        };
        
        objects.push(obj);
        
        // Periodic cleanup
        if (objects.length > 100) {
          objects.shift();
        }
        
        // Brief pause
        await this.sleep(10);
      }
    }

    private async executeIntensiveOperations(): Promise<void> {
      const allocations: any[] = [];
      const maxAllocations = this.params.maxAllocations || 100;
      
      while (this.active && allocations.length < maxAllocations) {
        // Intensive memory allocation
        const allocation = new Array(10000).fill(Math.random());
        allocations.push(allocation);
        
        await this.sleep(100);
      }
    }

    private async sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop(): void {
      this.active = false;
    }
  }

  const worker = new MemoryWorker(type, params);
  worker.start().catch(console.error);
}

// ============================================================================
// Additional Types for Results
// ============================================================================

interface MemoryTestResult {
  testInfo: {
    testId: string;
    name: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  };
  memoryAnalysis: {
    baselineMemory: number;
    peakMemory: number;
    finalMemory: number;
    averageMemory: number;
    memoryGrowth: number;
  };
  leakDetections: LeakDetection[];
  gcAnalysis: GCAnalysis;
  scenarioResults: MemoryScenarioResult[];
  performanceImpact: PerformanceImpact;
  thresholdViolations: any[];
  recommendations: string[];
  rawMetrics: MemoryTestMetrics;
}

export { MemoryTestEngine, MemoryTestConfig, MemoryTestResult };