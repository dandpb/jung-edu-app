/**
 * Load Testing with Concurrent Failure Scenarios
 * Tests system behavior under stress with simultaneous failures
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

class LoadTester extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxConcurrentUsers: 1000,
      rampUpDuration: 30000, // 30 seconds
      testDuration: 300000, // 5 minutes
      failureInjectionRate: 0.1, // 10% of requests trigger failures
      targetThroughput: 100, // requests per second
      responseTimeThreshold: 2000, // ms
      errorRateThreshold: 5, // percentage
      ...options
    };

    this.workers = [];
    this.testResults = {};
    this.activeTests = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errorRates: [],
      throughput: []
    };
  }

  /**
   * Execute load test with concurrent failure injection
   */
  async executeLoadTest(testConfig) {
    console.log(`🚀 Starting load test: ${testConfig.name}`);
    console.log(`  Users: ${testConfig.users || this.options.maxConcurrentUsers}`);
    console.log(`  Duration: ${testConfig.duration || this.options.testDuration}ms`);
    console.log(`  Failure rate: ${testConfig.failureRate || this.options.failureInjectionRate * 100}%`);

    const testId = `load-test-${Date.now()}`;
    const testStart = performance.now();

    const test = {
      id: testId,
      config: testConfig,
      startTime: new Date().toISOString(),
      status: 'running',
      phases: {
        rampUp: null,
        sustainedLoad: null,
        rampDown: null,
        failureRecovery: null
      },
      metrics: this.createEmptyMetrics()
    };

    this.activeTests.set(testId, test);

    try {
      // Phase 1: Ramp up users gradually
      test.phases.rampUp = await this.executeRampUp(testConfig);
      
      // Phase 2: Sustained load with failure injection
      test.phases.sustainedLoad = await this.executeSustainedLoad(testConfig);
      
      // Phase 3: Failure injection during peak load
      test.phases.failureInjection = await this.executeFailureInjection(testConfig);
      
      // Phase 4: Recovery validation under load
      test.phases.failureRecovery = await this.validateRecoveryUnderLoad(testConfig);
      
      // Phase 5: Gradual ramp down
      test.phases.rampDown = await this.executeRampDown(testConfig);

      test.totalDuration = performance.now() - testStart;
      test.status = 'completed';
      test.success = this.evaluateTestSuccess(test);

    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.totalDuration = performance.now() - testStart;
    }

    this.testResults[testId] = test;
    return test;
  }

  /**
   * Execute gradual user ramp up
   */
  async executeRampUp(config) {
    console.log('📈 Phase 1: Ramping up users...');
    
    const rampUpStart = performance.now();
    const targetUsers = config.users || this.options.maxConcurrentUsers;
    const rampUpDuration = config.rampUpDuration || this.options.rampUpDuration;
    const rampUpSteps = 10;
    const usersPerStep = Math.ceil(targetUsers / rampUpSteps);
    const stepDuration = rampUpDuration / rampUpSteps;

    const rampUpMetrics = {
      steps: [],
      finalUserCount: 0,
      averageResponseTime: [],
      errorRates: []
    };

    for (let step = 1; step <= rampUpSteps; step++) {
      const stepStart = performance.now();
      const currentUsers = Math.min(step * usersPerStep, targetUsers);
      
      console.log(`  Step ${step}/${rampUpSteps}: ${currentUsers} concurrent users`);
      
      // Spawn workers for this step
      const newWorkers = await this.spawnWorkers(currentUsers - rampUpMetrics.finalUserCount, {
        ...config,
        stepDuration: stepDuration,
        step: step
      });

      // Monitor performance during this step
      const stepMetrics = await this.monitorStep(stepDuration);
      
      rampUpMetrics.steps.push({
        step,
        users: currentUsers,
        duration: performance.now() - stepStart,
        metrics: stepMetrics
      });

      rampUpMetrics.finalUserCount = currentUsers;
      rampUpMetrics.averageResponseTime.push(stepMetrics.averageResponseTime);
      rampUpMetrics.errorRates.push(stepMetrics.errorRate);
    }

    return {
      duration: performance.now() - rampUpStart,
      finalUsers: rampUpMetrics.finalUserCount,
      steps: rampUpMetrics.steps,
      success: rampUpMetrics.errorRates.every(rate => rate < this.options.errorRateThreshold)
    };
  }

  /**
   * Execute sustained load phase
   */
  async executeSustainedLoad(config) {
    console.log('⚡ Phase 2: Sustained load testing...');
    
    const sustainedStart = performance.now();
    const duration = config.sustainedDuration || 120000; // 2 minutes default
    const monitoringInterval = 5000; // 5 second intervals
    
    const sustainedMetrics = {
      intervals: [],
      averageMetrics: {},
      stability: {}
    };

    const monitoringPromise = this.startContinuousMonitoring(duration, monitoringInterval);
    
    // Let the test run for the sustained period
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const intervalMetrics = await monitoringPromise;
    sustainedMetrics.intervals = intervalMetrics;
    sustainedMetrics.averageMetrics = this.calculateAverageMetrics(intervalMetrics);
    sustainedMetrics.stability = this.analyzeStability(intervalMetrics);

    return {
      duration: performance.now() - sustainedStart,
      intervalCount: intervalMetrics.length,
      metrics: sustainedMetrics,
      stable: sustainedMetrics.stability.coefficient < 0.2 // 20% variation threshold
    };
  }

  /**
   * Execute failure injection during load
   */
  async executeFailureInjection(config) {
    console.log('💥 Phase 3: Injecting failures during load...');
    
    const injectionStart = performance.now();
    const failureScenarios = config.failureScenarios || this.getDefaultFailureScenarios();
    const injectionResults = [];

    // Execute multiple failure scenarios concurrently
    const concurrentFailures = failureScenarios.map(async (scenario, index) => {
      // Stagger failure injection
      await new Promise(resolve => setTimeout(resolve, index * 5000));
      
      console.log(`  💣 Injecting failure: ${scenario.type}`);
      const failureStart = performance.now();
      
      try {
        // Inject the failure
        const injectionResult = await this.injectFailureDuringLoad(scenario);
        
        // Monitor impact
        const impactMetrics = await this.monitorFailureImpact(scenario, 30000);
        
        return {
          scenario: scenario.type,
          injectionTime: performance.now() - failureStart,
          injectionResult,
          impact: impactMetrics,
          success: true
        };
        
      } catch (error) {
        return {
          scenario: scenario.type,
          injectionTime: performance.now() - failureStart,
          error: error.message,
          success: false
        };
      }
    });

    const results = await Promise.all(concurrentFailures);
    injectionResults.push(...results);

    return {
      duration: performance.now() - injectionStart,
      failuresInjected: failureScenarios.length,
      successfulInjections: results.filter(r => r.success).length,
      results: injectionResults,
      overallImpact: this.calculateOverallImpact(results)
    };
  }

  /**
   * Validate recovery under continued load
   */
  async validateRecoveryUnderLoad(config) {
    console.log('🔄 Phase 4: Validating recovery under load...');
    
    const recoveryStart = performance.now();
    const maxRecoveryTime = config.maxRecoveryTime || 60000; // 1 minute
    const recoveryMetrics = [];

    // Continue monitoring while system recovers
    const recoveryPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const elapsed = performance.now() - recoveryStart;
        
        try {
          const currentMetrics = await this.captureCurrentMetrics();
          recoveryMetrics.push({
            timestamp: elapsed,
            ...currentMetrics
          });

          // Check if system has recovered
          const hasRecovered = this.checkRecoveryStatus(currentMetrics);
          
          if (hasRecovered) {
            clearInterval(checkInterval);
            resolve({
              recovered: true,
              recoveryTime: elapsed,
              metrics: recoveryMetrics
            });
          } else if (elapsed > maxRecoveryTime) {
            clearInterval(checkInterval);
            resolve({
              recovered: false,
              recoveryTime: elapsed,
              metrics: recoveryMetrics,
              timeout: true
            });
          }
        } catch (error) {
          // Continue monitoring
        }
      }, 1000);
    });

    const recoveryResult = await recoveryPromise;

    return {
      duration: performance.now() - recoveryStart,
      recovery: recoveryResult,
      sustainedThroughput: this.calculateSustainedThroughput(recoveryMetrics),
      performanceImpact: this.calculatePerformanceImpact(recoveryMetrics)
    };
  }

  /**
   * Execute gradual ramp down
   */
  async executeRampDown(config) {
    console.log('📉 Phase 5: Ramping down users...');
    
    const rampDownStart = performance.now();
    const rampDownDuration = config.rampDownDuration || 30000;
    const currentWorkers = this.workers.length;
    const rampDownSteps = 5;
    const workersPerStep = Math.ceil(currentWorkers / rampDownSteps);
    const stepDuration = rampDownDuration / rampDownSteps;

    const rampDownMetrics = [];

    for (let step = 1; step <= rampDownSteps; step++) {
      const stepStart = performance.now();
      const workersToStop = Math.min(workersPerStep, this.workers.length);
      
      // Stop workers for this step
      await this.stopWorkers(workersToStop);
      
      // Monitor during ramp down
      const stepMetrics = await this.monitorStep(stepDuration);
      rampDownMetrics.push({
        step,
        remainingWorkers: this.workers.length,
        metrics: stepMetrics,
        duration: performance.now() - stepStart
      });

      console.log(`  Step ${step}/${rampDownSteps}: ${this.workers.length} workers remaining`);
    }

    // Stop all remaining workers
    await this.stopAllWorkers();

    return {
      duration: performance.now() - rampDownStart,
      steps: rampDownMetrics,
      gracefulShutdown: true
    };
  }

  /**
   * Spawn worker threads for load generation
   */
  async spawnWorkers(count, config) {
    const newWorkers = [];
    
    for (let i = 0; i < count; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: `worker-${Date.now()}-${i}`,
          config: config,
          isWorker: true
        }
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });

      worker.on('error', (error) => {
        console.error(`Worker error:`, error);
      });

      newWorkers.push(worker);
      this.workers.push(worker);
    }

    return newWorkers;
  }

  /**
   * Handle messages from worker threads
   */
  handleWorkerMessage(worker, message) {
    switch (message.type) {
      case 'metrics':
        this.updateMetrics(message.data);
        break;
      case 'error':
        this.handleWorkerError(worker, message.error);
        break;
      case 'request-complete':
        this.metrics.totalRequests++;
        if (message.success) {
          this.metrics.successfulRequests++;
          this.metrics.responseTimes.push(message.responseTime);
        } else {
          this.metrics.failedRequests++;
        }
        break;
    }
  }

  /**
   * Monitor system during a test step
   */
  async monitorStep(duration) {
    const monitorStart = performance.now();
    const measurements = [];
    const monitoringInterval = 1000; // 1 second

    return new Promise((resolve) => {
      const monitorInterval = setInterval(async () => {
        const measurement = await this.takeMeasurement();
        measurements.push(measurement);

        if (performance.now() - monitorStart >= duration) {
          clearInterval(monitorInterval);
          resolve(this.aggregateMeasurements(measurements));
        }
      }, monitoringInterval);
    });
  }

  /**
   * Start continuous monitoring
   */
  async startContinuousMonitoring(duration, interval) {
    const measurements = [];
    const monitorStart = performance.now();

    return new Promise((resolve) => {
      const monitorInterval = setInterval(async () => {
        const measurement = await this.takeMeasurement();
        measurements.push(measurement);

        if (performance.now() - monitorStart >= duration) {
          clearInterval(monitorInterval);
          resolve(measurements);
        }
      }, interval);
    });
  }

  /**
   * Inject failure during active load test
   */
  async injectFailureDuringLoad(scenario) {
    // Simulate different failure types
    switch (scenario.type) {
      case 'service-overload':
        return await this.simulateServiceOverload(scenario);
      case 'memory-pressure':
        return await this.simulateMemoryPressure(scenario);
      case 'network-congestion':
        return await this.simulateNetworkCongestion(scenario);
      case 'database-slowdown':
        return await this.simulateDatabaseSlowdown(scenario);
      case 'cascading-failure':
        return await this.simulateCascadingFailure(scenario);
      default:
        throw new Error(`Unknown failure type: ${scenario.type}`);
    }
  }

  /**
   * Generate comprehensive load test report
   */
  generateLoadTestReport(testId) {
    const test = this.testResults[testId];
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const report = {
      testSummary: {
        id: testId,
        duration: test.totalDuration,
        status: test.status,
        success: test.success
      },
      performanceMetrics: {
        totalRequests: this.metrics.totalRequests,
        successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100,
        averageResponseTime: this.calculateAverage(this.metrics.responseTimes),
        p95ResponseTime: this.calculatePercentile(this.metrics.responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(this.metrics.responseTimes, 99),
        peakThroughput: Math.max(...this.metrics.throughput)
      },
      phaseAnalysis: {
        rampUp: this.analyzePhase(test.phases.rampUp),
        sustainedLoad: this.analyzePhase(test.phases.sustainedLoad),
        failureInjection: this.analyzePhase(test.phases.failureInjection),
        recovery: this.analyzePhase(test.phases.failureRecovery),
        rampDown: this.analyzePhase(test.phases.rampDown)
      },
      failureAnalysis: this.analyzeFailureScenarios(test.phases.failureInjection),
      recommendations: this.generateLoadTestRecommendations(test)
    };

    return report;
  }

  // Helper methods and utilities
  createEmptyMetrics() {
    return {
      requests: 0,
      responses: 0,
      errors: 0,
      averageResponseTime: 0,
      throughput: 0
    };
  }

  getDefaultFailureScenarios() {
    return [
      { type: 'service-overload', severity: 'medium', duration: 30000 },
      { type: 'memory-pressure', severity: 'high', duration: 20000 },
      { type: 'network-congestion', severity: 'low', duration: 45000 },
      { type: 'database-slowdown', severity: 'medium', duration: 25000 }
    ];
  }

  async takeMeasurement() {
    return {
      timestamp: performance.now(),
      activeConnections: this.workers.length,
      responseTime: this.getAverageResponseTime(),
      errorRate: this.getCurrentErrorRate(),
      throughput: this.getCurrentThroughput(),
      systemLoad: await this.getSystemLoad()
    };
  }

  getAverageResponseTime() {
    const recentResponses = this.metrics.responseTimes.slice(-100);
    return recentResponses.length > 0 
      ? recentResponses.reduce((sum, rt) => sum + rt, 0) / recentResponses.length 
      : 0;
  }

  getCurrentErrorRate() {
    const total = this.metrics.totalRequests;
    const failed = this.metrics.failedRequests;
    return total > 0 ? (failed / total) * 100 : 0;
  }

  getCurrentThroughput() {
    // Calculate requests per second over last 10 seconds
    return this.metrics.totalRequests / 10; // Simplified calculation
  }

  async getSystemLoad() {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 100
    };
  }

  // Statistical utility methods
  calculateAverage(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Simulation methods (to be implemented based on environment)
  async simulateServiceOverload(scenario) {
    return { type: 'service-overload', simulated: true, severity: scenario.severity };
  }

  async simulateMemoryPressure(scenario) {
    return { type: 'memory-pressure', simulated: true, severity: scenario.severity };
  }

  async simulateNetworkCongestion(scenario) {
    return { type: 'network-congestion', simulated: true, severity: scenario.severity };
  }

  async simulateDatabaseSlowdown(scenario) {
    return { type: 'database-slowdown', simulated: true, severity: scenario.severity };
  }

  async simulateCascadingFailure(scenario) {
    return { type: 'cascading-failure', simulated: true, severity: scenario.severity };
  }

  // Additional helper methods
  async stopWorkers(count) {
    const workersToStop = this.workers.splice(0, count);
    await Promise.all(workersToStop.map(worker => worker.terminate()));
  }

  async stopAllWorkers() {
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
  }

  updateMetrics(data) {
    // Update aggregate metrics from worker data
    Object.keys(data).forEach(key => {
      if (typeof this.metrics[key] === 'number') {
        this.metrics[key] += data[key];
      } else if (Array.isArray(this.metrics[key])) {
        this.metrics[key].push(...data[key]);
      }
    });
  }

  handleWorkerError(worker, error) {
    console.error(`Worker error: ${error}`);
    // Remove failed worker
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
  }

  evaluateTestSuccess(test) {
    // Define success criteria
    const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
    const avgResponseTime = this.calculateAverage(this.metrics.responseTimes);
    
    return errorRate < this.options.errorRateThreshold && 
           avgResponseTime < this.options.responseTimeThreshold;
  }

  aggregateMeasurements(measurements) {
    return {
      count: measurements.length,
      averageResponseTime: this.calculateAverage(measurements.map(m => m.responseTime)),
      errorRate: this.calculateAverage(measurements.map(m => m.errorRate)),
      throughput: this.calculateAverage(measurements.map(m => m.throughput))
    };
  }

  calculateAverageMetrics(intervals) {
    return {
      responseTime: this.calculateAverage(intervals.map(i => i.responseTime)),
      errorRate: this.calculateAverage(intervals.map(i => i.errorRate)),
      throughput: this.calculateAverage(intervals.map(i => i.throughput))
    };
  }

  analyzeStability(intervals) {
    const responseTimes = intervals.map(i => i.responseTime);
    const avg = this.calculateAverage(responseTimes);
    const variance = responseTimes.reduce((sum, rt) => sum + Math.pow(rt - avg, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      coefficient: stdDev / avg, // Coefficient of variation
      stable: (stdDev / avg) < 0.2
    };
  }

  async monitorFailureImpact(scenario, duration) {
    const impact = [];
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const impactInterval = setInterval(async () => {
        const measurement = await this.takeMeasurement();
        impact.push({
          elapsed: performance.now() - startTime,
          ...measurement
        });

        if (performance.now() - startTime >= duration) {
          clearInterval(impactInterval);
          resolve(impact);
        }
      }, 1000);
    });
  }

  calculateOverallImpact(results) {
    const impacts = results.filter(r => r.impact).map(r => r.impact);
    // Analyze cumulative impact across all failures
    return {
      totalDuration: Math.max(...impacts.map(i => Math.max(...i.map(m => m.elapsed)))),
      peakErrorRate: Math.max(...impacts.flatMap(i => i.map(m => m.errorRate))),
      averageResponseTimeIncrease: this.calculateAverage(impacts.flatMap(i => i.map(m => m.responseTime)))
    };
  }

  async captureCurrentMetrics() {
    return await this.takeMeasurement();
  }

  checkRecoveryStatus(metrics) {
    return metrics.errorRate < this.options.errorRateThreshold && 
           metrics.responseTime < this.options.responseTimeThreshold;
  }

  calculateSustainedThroughput(metrics) {
    return this.calculateAverage(metrics.map(m => m.throughput));
  }

  calculatePerformanceImpact(metrics) {
    const baselineResponseTime = metrics[0]?.responseTime || 0;
    const peakResponseTime = Math.max(...metrics.map(m => m.responseTime));
    
    return {
      baselineResponseTime,
      peakResponseTime,
      degradationPercent: ((peakResponseTime - baselineResponseTime) / baselineResponseTime) * 100
    };
  }

  analyzePhase(phase) {
    if (!phase) return { status: 'not executed' };
    
    return {
      duration: phase.duration,
      success: phase.success || phase.recovered,
      keyMetrics: phase.metrics || phase.recovery || {}
    };
  }

  analyzeFailureScenarios(failurePhase) {
    if (!failurePhase || !failurePhase.results) {
      return { analysis: 'No failure scenarios executed' };
    }

    return {
      totalScenarios: failurePhase.results.length,
      successfulInjections: failurePhase.results.filter(r => r.success).length,
      mostImpactfulFailure: failurePhase.results.reduce((max, current) => 
        (current.impact?.peakErrorRate || 0) > (max.impact?.peakErrorRate || 0) ? current : max
      ),
      averageRecoveryTime: this.calculateAverage(
        failurePhase.results
          .filter(r => r.impact)
          .map(r => r.impact.reduce((max, m) => Math.max(max, m.elapsed), 0))
      )
    };
  }

  generateLoadTestRecommendations(test) {
    const recommendations = [];
    const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;

    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: `Error rate of ${errorRate.toFixed(2)}% exceeds threshold`,
        suggestion: 'Implement circuit breakers and improve error handling'
      });
    }

    if (test.phases.failureRecovery && !test.phases.failureRecovery.recovery.recovered) {
      recommendations.push({
        type: 'recovery',
        priority: 'critical',
        message: 'System failed to recover under load',
        suggestion: 'Implement more aggressive healing mechanisms and load shedding'
      });
    }

    return recommendations;
  }
}

// Worker thread implementation
if (!isMainThread && workerData?.isWorker) {
  const { workerId, config } = workerData;
  
  // Worker implementation for load generation
  class LoadWorker {
    constructor(id, config) {
      this.id = id;
      this.config = config;
      this.active = true;
      this.requestCount = 0;
    }

    async start() {
      console.log(`Worker ${this.id} started`);
      
      while (this.active) {
        try {
          const startTime = performance.now();
          
          // Simulate request
          await this.simulateRequest();
          
          const responseTime = performance.now() - startTime;
          this.requestCount++;
          
          // Report to main thread
          parentPort.postMessage({
            type: 'request-complete',
            success: Math.random() > (this.config.failureRate || 0.1),
            responseTime,
            workerId: this.id
          });

          // Wait before next request
          await this.sleep(Math.random() * 1000);
          
        } catch (error) {
          parentPort.postMessage({
            type: 'error',
            error: error.message,
            workerId: this.id
          });
        }
      }
    }

    async simulateRequest() {
      // Simulate HTTP request with variable latency
      const baseLatency = 100;
      const variableLatency = Math.random() * 500;
      await this.sleep(baseLatency + variableLatency);
    }

    async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
      this.active = false;
    }
  }

  const worker = new LoadWorker(workerId, config);
  worker.start().catch(console.error);
}

module.exports = { LoadTester };