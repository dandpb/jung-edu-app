/**
 * Optimized Performance Test Suite for Educational Platform
 * Memory-efficient, scalable performance testing with educational domain focus
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { EventEmitter } = require('events');

class OptimizedPerformanceTestSuite extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Memory constraints
      maxMemoryUsage: options.maxMemoryUsage || 512 * 1024 * 1024, // 512MB
      memoryCheckInterval: options.memoryCheckInterval || 5000,
      gcThreshold: options.gcThreshold || 0.8,
      
      // Performance thresholds
      responseTimeThreshold: options.responseTimeThreshold || 2000, // 2s
      throughputThreshold: options.throughputThreshold || 100, // req/s
      errorRateThreshold: options.errorRateThreshold || 0.01, // 1%
      
      // Test configuration
      maxConcurrentUsers: options.maxConcurrentUsers || 100,
      testDuration: options.testDuration || 60000, // 1 minute
      rampUpTime: options.rampUpTime || 10000, // 10 seconds
      
      // Educational domain specific
      moduleLoadThreshold: options.moduleLoadThreshold || 1500, // 1.5s
      quizGenerationThreshold: options.quizGenerationThreshold || 3000, // 3s
      contentProcessingThreshold: options.contentProcessingThreshold || 5000, // 5s
      
      ...options
    };

    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimes: []
      },
      memory: {
        peak: 0,
        samples: [],
        gcEvents: 0
      },
      cpu: {
        samples: [],
        peak: 0
      },
      educational: {
        moduleLoads: [],
        quizGenerations: [],
        contentProcessing: [],
        userSessions: []
      },
      errors: [],
      warnings: []
    };

    this.performanceObserver = null;
    this.workers = [];
    this.testState = 'idle';
  }

  async initialize() {
    console.log('🚀 Initializing Optimized Performance Test Suite');
    
    // Setup performance monitoring
    this.setupPerformanceObserver();
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
    
    // Setup process monitoring
    this.setupProcessMonitoring();
    
    console.log(`📊 Performance thresholds configured:`);
    console.log(`   Response Time: ${this.config.responseTimeThreshold}ms`);
    console.log(`   Throughput: ${this.config.throughputThreshold} req/s`);
    console.log(`   Memory Limit: ${Math.round(this.config.maxMemoryUsage / 1024 / 1024)}MB`);
    console.log(`   Max Users: ${this.config.maxConcurrentUsers}`);
  }

  setupPerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.recordPerformanceEntry(entry);
        }
      });
    });
    
    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  setupMemoryMonitoring() {{
    this.memoryMonitorInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memory.samples.push({
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      });

      // Track peak memory usage
      if (memUsage.heapUsed > this.metrics.memory.peak) {
        this.metrics.memory.peak = memUsage.heapUsed;
      }

      // Check memory threshold
      const memoryUsageRatio = memUsage.heapUsed / this.config.maxMemoryUsage;
      if (memoryUsageRatio > this.config.gcThreshold) {
        this.emit('memoryWarning', {
          usage: memUsage.heapUsed,
          limit: this.config.maxMemoryUsage,
          ratio: memoryUsageRatio
        });

        // Force garbage collection if available
        if (global.gc) {
          console.log('🗑️ Forcing garbage collection due to memory pressure');
          global.gc();
          this.metrics.memory.gcEvents++;
        }
      }
    }, this.config.memoryCheckInterval);
  }

  setupProcessMonitoring() {
    // Monitor CPU usage
    this.cpuMonitorInterval = setInterval(() => {
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      this.metrics.cpu.samples.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: cpuPercent
      });

      if (cpuPercent > this.metrics.cpu.peak) {
        this.metrics.cpu.peak = cpuPercent;
      }
    }, this.config.memoryCheckInterval);
  }

  async runEducationalLoadTest() {
    console.log('📚 Starting Educational Platform Load Test');
    
    this.testState = 'running';
    const testStartTime = Date.now();
    
    try {
      // Phase 1: Student Authentication Load
      await this.runPhase('authentication', async () => {
        return await this.testAuthenticationLoad();
      });

      // Phase 2: Module Loading Performance
      await this.runPhase('module-loading', async () => {
        return await this.testModuleLoadingPerformance();
      });

      // Phase 3: Quiz Generation Load
      await this.runPhase('quiz-generation', async () => {
        return await this.testQuizGenerationLoad();
      });

      // Phase 4: Content Processing Performance
      await this.runPhase('content-processing', async () => {
        return await this.testContentProcessingPerformance();
      });

      // Phase 5: Mixed Workload Simulation
      await this.runPhase('mixed-workload', async () => {
        return await this.testMixedEducationalWorkload();
      });

      const testEndTime = Date.now();
      const totalTestTime = testEndTime - testStartTime;

      console.log(`✅ Educational Load Test completed in ${totalTestTime}ms`);
      return this.generatePerformanceReport();

    } catch (error) {
      console.error('❌ Educational Load Test failed:', error);
      throw error;
    } finally {
      this.testState = 'completed';
      this.cleanup();
    }
  }

  async runPhase(phaseName, phaseFunction) {
    console.log(`  🔍 Phase: ${phaseName}`);
    
    const phaseStart = performance.now();
    performance.mark(`${phaseName}-start`);
    
    try {
      const result = await phaseFunction();
      
      performance.mark(`${phaseName}-end`);
      performance.measure(`${phaseName}-duration`, `${phaseName}-start`, `${phaseName}-end`);
      
      const phaseDuration = performance.now() - phaseStart;
      console.log(`  ✅ Phase ${phaseName} completed in ${Math.round(phaseDuration)}ms`);
      
      return result;
    } catch (error) {
      console.error(`  ❌ Phase ${phaseName} failed:`, error.message);
      this.metrics.errors.push({
        phase: phaseName,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  async testAuthenticationLoad() {
    const concurrentLogins = Math.min(this.config.maxConcurrentUsers / 2, 50);
    const loginPromises = [];

    for (let i = 0; i < concurrentLogins; i++) {
      const loginTest = this.createWorkerTask('authentication', {
        userIndex: i,
        iterations: 10
      });
      loginPromises.push(loginTest);
    }

    const results = await Promise.all(loginPromises);
    return this.aggregateResults(results, 'authentication');
  }

  async testModuleLoadingPerformance() {
    const concurrentUsers = Math.min(this.config.maxConcurrentUsers, 100);
    const moduleLoadPromises = [];

    // Test different module types and sizes
    const moduleTypes = [
      { type: 'text-heavy', expectedLoadTime: 1000 },
      { type: 'multimedia', expectedLoadTime: 2000 },
      { type: 'interactive', expectedLoadTime: 1500 }
    ];

    for (let i = 0; i < concurrentUsers; i++) {
      const moduleType = moduleTypes[i % moduleTypes.length];
      const moduleLoadTest = this.createWorkerTask('moduleLoad', {
        userIndex: i,
        moduleType: moduleType.type,
        expectedLoadTime: moduleType.expectedLoadTime
      });
      moduleLoadPromises.push(moduleLoadTest);
    }

    const results = await Promise.all(moduleLoadPromises);
    
    // Record educational metrics
    results.forEach(result => {
      if (result.moduleLoadTimes) {
        this.metrics.educational.moduleLoads.push(...result.moduleLoadTimes);
      }
    });

    return this.aggregateResults(results, 'moduleLoading');
  }

  async testQuizGenerationLoad() {
    const concurrentGenerations = Math.min(this.config.maxConcurrentUsers / 4, 25);
    const quizPromises = [];

    // Test different quiz complexity levels
    const complexityLevels = [
      { level: 'basic', questionCount: 5, expectedTime: 2000 },
      { level: 'intermediate', questionCount: 10, expectedTime: 4000 },
      { level: 'advanced', questionCount: 15, expectedTime: 6000 }
    ];

    for (let i = 0; i < concurrentGenerations; i++) {
      const complexity = complexityLevels[i % complexityLevels.length];
      const quizTest = this.createWorkerTask('quizGeneration', {
        userIndex: i,
        complexity: complexity.level,
        questionCount: complexity.questionCount,
        expectedTime: complexity.expectedTime
      });
      quizPromises.push(quizTest);
    }

    const results = await Promise.all(quizPromises);
    
    // Record educational metrics
    results.forEach(result => {
      if (result.quizGenerationTimes) {
        this.metrics.educational.quizGenerations.push(...result.quizGenerationTimes);
      }
    });

    return this.aggregateResults(results, 'quizGeneration');
  }

  async testContentProcessingPerformance() {
    const concurrentProcessing = Math.min(this.config.maxConcurrentUsers / 8, 12);
    const processingPromises = [];

    // Test different content types
    const contentTypes = [
      { type: 'markdown', size: 'small', expectedTime: 1000 },
      { type: 'pdf', size: 'medium', expectedTime: 3000 },
      { type: 'video-transcript', size: 'large', expectedTime: 8000 }
    ];

    for (let i = 0; i < concurrentProcessing; i++) {
      const contentType = contentTypes[i % contentTypes.length];
      const processingTest = this.createWorkerTask('contentProcessing', {
        userIndex: i,
        contentType: contentType.type,
        contentSize: contentType.size,
        expectedTime: contentType.expectedTime
      });
      processingPromises.push(processingTest);
    }

    const results = await Promise.all(processingPromises);
    
    // Record educational metrics
    results.forEach(result => {
      if (result.processingTimes) {
        this.metrics.educational.contentProcessing.push(...result.processingTimes);
      }
    });

    return this.aggregateResults(results, 'contentProcessing');
  }

  async testMixedEducationalWorkload() {
    console.log('    🎯 Running mixed educational workload simulation');
    
    const totalUsers = this.config.maxConcurrentUsers;
    const workloadDistribution = {
      browsing: Math.floor(totalUsers * 0.4), // 40% browsing content
      studying: Math.floor(totalUsers * 0.3), // 30% active studying
      quizzing: Math.floor(totalUsers * 0.2), // 20% taking quizzes
      creating: Math.floor(totalUsers * 0.1)  // 10% creating content
    };

    const workloadPromises = [];

    // Browsing users (lightweight operations)
    for (let i = 0; i < workloadDistribution.browsing; i++) {
      workloadPromises.push(this.createWorkerTask('browsing', {
        userIndex: i,
        duration: this.config.testDuration,
        actionsPerMinute: 20
      }));
    }

    // Studying users (moderate operations)
    for (let i = 0; i < workloadDistribution.studying; i++) {
      workloadPromises.push(this.createWorkerTask('studying', {
        userIndex: i + workloadDistribution.browsing,
        duration: this.config.testDuration,
        actionsPerMinute: 10
      }));
    }

    // Quizzing users (intensive operations)
    for (let i = 0; i < workloadDistribution.quizzing; i++) {
      workloadPromises.push(this.createWorkerTask('quizzing', {
        userIndex: i + workloadDistribution.browsing + workloadDistribution.studying,
        duration: this.config.testDuration,
        actionsPerMinute: 5
      }));
    }

    // Creating users (most intensive operations)
    for (let i = 0; i < workloadDistribution.creating; i++) {
      workloadPromises.push(this.createWorkerTask('creating', {
        userIndex: i + workloadDistribution.browsing + workloadDistribution.studying + workloadDistribution.quizzing,
        duration: this.config.testDuration,
        actionsPerMinute: 2
      }));
    }

    console.log(`    👥 Simulating workload: ${workloadDistribution.browsing} browsing, ${workloadDistribution.studying} studying, ${workloadDistribution.quizzing} quizzing, ${workloadDistribution.creating} creating`);

    const results = await Promise.all(workloadPromises);
    return this.aggregateResults(results, 'mixedWorkload');
  }

  createWorkerTask(taskType, taskData) {
    return new Promise((resolve, reject) => {
      if (isMainThread) {
        // Create worker thread for CPU-intensive tasks
        const worker = new Worker(__filename, {
          workerData: { taskType, taskData }
        });

        worker.on('message', (result) => {
          this.recordWorkerMetrics(result);
          resolve(result);
        });

        worker.on('error', reject);
        
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        this.workers.push(worker);
      }
    });
  }

  recordWorkerMetrics(workerResult) {
    if (workerResult.requests) {
      this.metrics.requests.total += workerResult.requests.total || 0;
      this.metrics.requests.successful += workerResult.requests.successful || 0;
      this.metrics.requests.failed += workerResult.requests.failed || 0;
      
      if (workerResult.requests.responseTimes) {
        this.metrics.requests.responseTimes.push(...workerResult.requests.responseTimes);
      }
    }

    if (workerResult.errors) {
      this.metrics.errors.push(...workerResult.errors);
    }
  }

  recordPerformanceEntry(entry) {
    if (entry.name.includes('educational')) {
      const category = entry.name.split('-')[0];
      if (!this.metrics.educational[category]) {
        this.metrics.educational[category] = [];
      }
      this.metrics.educational[category].push({
        duration: entry.duration,
        timestamp: entry.startTime
      });
    }
  }

  aggregateResults(results, phase) {
    const aggregated = {
      phase,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      throughput: 0,
      errorRate: 0
    };

    let totalResponseTime = 0;
    const allResponseTimes = [];

    results.forEach(result => {
      if (result.requests) {
        aggregated.totalRequests += result.requests.total || 0;
        aggregated.successfulRequests += result.requests.successful || 0;
        aggregated.failedRequests += result.requests.failed || 0;
        
        if (result.requests.responseTimes) {
          allResponseTimes.push(...result.requests.responseTimes);
        }
      }
    });

    if (allResponseTimes.length > 0) {
      allResponseTimes.forEach(time => {
        totalResponseTime += time;
        if (time < aggregated.minResponseTime) aggregated.minResponseTime = time;
        if (time > aggregated.maxResponseTime) aggregated.maxResponseTime = time;
      });

      aggregated.avgResponseTime = totalResponseTime / allResponseTimes.length;
      aggregated.throughput = allResponseTimes.length / (this.config.testDuration / 1000);
    }

    if (aggregated.totalRequests > 0) {
      aggregated.errorRate = aggregated.failedRequests / aggregated.totalRequests;
    }

    return aggregated;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: this.config,
      overallMetrics: this.calculateOverallMetrics(),
      memoryAnalysis: this.analyzeMemoryUsage(),
      cpuAnalysis: this.analyzeCPUUsage(),
      educationalMetrics: this.analyzeEducationalMetrics(),
      thresholdCompliance: this.checkThresholdCompliance(),
      recommendations: this.generateRecommendations(),
      detailedBreakdown: this.metrics
    };

    return report;
  }

  calculateOverallMetrics() {
    const responseTimes = this.metrics.requests.responseTimes;
    let overallMetrics = {
      totalRequests: this.metrics.requests.total,
      successRate: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      peakMemoryUsage: this.metrics.memory.peak,
      peakCPUUsage: this.metrics.cpu.peak
    };

    if (this.metrics.requests.total > 0) {
      overallMetrics.successRate = (this.metrics.requests.successful / this.metrics.requests.total) * 100;
    }

    if (responseTimes.length > 0) {
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
      
      overallMetrics.avgResponseTime = totalTime / responseTimes.length;
      overallMetrics.p95ResponseTime = sortedTimes[Math.floor(responseTimes.length * 0.95)];
      overallMetrics.p99ResponseTime = sortedTimes[Math.floor(responseTimes.length * 0.99)];
      overallMetrics.throughput = responseTimes.length / (this.config.testDuration / 1000);
    }

    return overallMetrics;
  }

  analyzeMemoryUsage() {
    const memSamples = this.metrics.memory.samples;
    if (memSamples.length === 0) return { analysis: 'No memory samples collected' };

    const peakUsage = Math.max(...memSamples.map(s => s.heapUsed));
    const avgUsage = memSamples.reduce((sum, s) => sum + s.heapUsed, 0) / memSamples.length;
    const memoryEfficiency = (avgUsage / this.config.maxMemoryUsage) * 100;

    return {
      peakUsage: Math.round(peakUsage / 1024 / 1024), // MB
      avgUsage: Math.round(avgUsage / 1024 / 1024), // MB
      efficiency: Math.round(memoryEfficiency),
      gcEvents: this.metrics.memory.gcEvents,
      recommendation: memoryEfficiency > 80 ? 'Consider increasing memory limit' : 'Memory usage within acceptable range'
    };
  }

  analyzeCPUUsage() {
    const cpuSamples = this.metrics.cpu.samples;
    if (cpuSamples.length === 0) return { analysis: 'No CPU samples collected' };

    const avgCPU = cpuSamples.reduce((sum, s) => sum + s.percent, 0) / cpuSamples.length;
    
    return {
      peakUsage: Math.round(this.metrics.cpu.peak * 100) / 100,
      avgUsage: Math.round(avgCPU * 100) / 100,
      recommendation: avgCPU > 80 ? 'High CPU usage detected - consider optimization' : 'CPU usage within acceptable range'
    };
  }

  analyzeEducationalMetrics() {
    const edu = this.metrics.educational;
    
    const moduleLoadAnalysis = this.analyzeResponseTimes(edu.moduleLoads, this.config.moduleLoadThreshold, 'Module Loading');
    const quizGenAnalysis = this.analyzeResponseTimes(edu.quizGenerations, this.config.quizGenerationThreshold, 'Quiz Generation');
    const contentProcAnalysis = this.analyzeResponseTimes(edu.contentProcessing, this.config.contentProcessingThreshold, 'Content Processing');

    return {
      moduleLoading: moduleLoadAnalysis,
      quizGeneration: quizGenAnalysis,
      contentProcessing: contentProcAnalysis,
      overallEducationalPerformance: this.calculateEducationalScore([moduleLoadAnalysis, quizGenAnalysis, contentProcAnalysis])
    };
  }

  analyzeResponseTimes(times, threshold, operation) {
    if (!times || times.length === 0) {
      return { operation, analysis: 'No data collected', score: 0 };
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const withinThreshold = times.filter(time => time <= threshold).length;
    const complianceRate = (withinThreshold / times.length) * 100;

    return {
      operation,
      avgResponseTime: Math.round(avgTime),
      threshold,
      complianceRate: Math.round(complianceRate),
      totalOperations: times.length,
      score: complianceRate >= 95 ? 'excellent' : complianceRate >= 80 ? 'good' : 'needs_improvement'
    };
  }

  calculateEducationalScore(analyses) {
    const scores = analyses.map(analysis => {
      switch (analysis.score) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'needs_improvement': return 60;
        default: return 0;
      }
    });

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return {
      score: Math.round(avgScore),
      grade: avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F'
    };
  }

  checkThresholdCompliance() {
    const compliance = {
      responseTime: false,
      throughput: false,
      errorRate: false,
      memoryUsage: false,
      educationalMetrics: false
    };

    const overallMetrics = this.calculateOverallMetrics();
    
    compliance.responseTime = overallMetrics.avgResponseTime <= this.config.responseTimeThreshold;
    compliance.throughput = overallMetrics.throughput >= this.config.throughputThreshold;
    compliance.errorRate = (this.metrics.requests.failed / this.metrics.requests.total) <= this.config.errorRateThreshold;
    compliance.memoryUsage = (overallMetrics.peakMemoryUsage / this.config.maxMemoryUsage) <= 1.0;
    
    const eduMetrics = this.analyzeEducationalMetrics();
    compliance.educationalMetrics = eduMetrics.overallEducationalPerformance.score >= 80;

    const overallCompliance = Object.values(compliance).filter(Boolean).length / Object.keys(compliance).length;

    return {
      individual: compliance,
      overall: Math.round(overallCompliance * 100),
      passing: overallCompliance >= 0.8
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const metrics = this.calculateOverallMetrics();
    const compliance = this.checkThresholdCompliance();

    if (!compliance.individual.responseTime) {
      recommendations.push(`Response time ${metrics.avgResponseTime}ms exceeds threshold ${this.config.responseTimeThreshold}ms - consider caching or optimization`);
    }

    if (!compliance.individual.throughput) {
      recommendations.push(`Throughput ${metrics.throughput} req/s below threshold ${this.config.throughputThreshold} req/s - consider horizontal scaling`);
    }

    if (!compliance.individual.memoryUsage) {
      recommendations.push(`Memory usage ${Math.round(metrics.peakMemoryUsage / 1024 / 1024)}MB approaching limit - consider memory optimization or increased allocation`);
    }

    if (!compliance.individual.educationalMetrics) {
      recommendations.push('Educational-specific operations underperforming - review quiz generation and content processing algorithms');
    }

    if (this.metrics.memory.gcEvents > 10) {
      recommendations.push('Frequent garbage collection detected - review object lifecycle and memory patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance metrics within acceptable thresholds - system performing well');
    }

    return recommendations;
  }

  cleanup() {
    // Clean up intervals
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    if (this.cpuMonitorInterval) {
      clearInterval(this.cpuMonitorInterval);
    }

    // Clean up performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Terminate worker threads
    this.workers.forEach(worker => {
      worker.terminate();
    });

    console.log('🧹 Performance test cleanup completed');
  }
}

// Worker thread implementation for CPU-intensive tasks
if (!isMainThread) {
  const { taskType, taskData } = workerData;
  
  const executeTask = async () => {
    const result = {
      taskType,
      userIndex: taskData.userIndex,
      requests: { total: 0, successful: 0, failed: 0, responseTimes: [] },
      errors: []
    };

    try {
      switch (taskType) {
        case 'authentication':
          await simulateAuthentication(taskData, result);
          break;
        case 'moduleLoad':
          await simulateModuleLoad(taskData, result);
          break;
        case 'quizGeneration':
          await simulateQuizGeneration(taskData, result);
          break;
        case 'contentProcessing':
          await simulateContentProcessing(taskData, result);
          break;
        case 'browsing':
        case 'studying':
        case 'quizzing':
        case 'creating':
          await simulateUserWorkload(taskType, taskData, result);
          break;
      }
    } catch (error) {
      result.errors.push({
        message: error.message,
        timestamp: Date.now()
      });
    }

    parentPort.postMessage(result);
  };

  const simulateAuthentication = async (taskData, result) => {
    for (let i = 0; i < taskData.iterations; i++) {
      const start = Date.now();
      
      // Simulate authentication work
      await simulateWork(100 + Math.random() * 200); // 100-300ms
      
      const duration = Date.now() - start;
      result.requests.total++;
      result.requests.successful++;
      result.requests.responseTimes.push(duration);
      
      // Small delay between iterations
      await simulateWork(50);
    }
  };

  const simulateModuleLoad = async (taskData, result) => {
    const start = Date.now();
    
    // Simulate module loading based on type
    let loadTime = 1000; // Base load time
    switch (taskData.moduleType) {
      case 'multimedia':
        loadTime = 1500 + Math.random() * 1000; // 1.5-2.5s
        break;
      case 'interactive':
        loadTime = 1200 + Math.random() * 600; // 1.2-1.8s
        break;
      default:
        loadTime = 800 + Math.random() * 400; // 0.8-1.2s
    }
    
    await simulateWork(loadTime);
    
    const duration = Date.now() - start;
    result.requests.total++;
    
    if (duration <= taskData.expectedLoadTime * 1.5) {
      result.requests.successful++;
    } else {
      result.requests.failed++;
    }
    
    result.requests.responseTimes.push(duration);
    result.moduleLoadTimes = [duration];
  };

  const simulateQuizGeneration = async (taskData, result) => {
    const start = Date.now();
    
    // Simulate quiz generation complexity
    let generationTime = taskData.questionCount * 200; // Base: 200ms per question
    
    switch (taskData.complexity) {
      case 'advanced':
        generationTime *= 1.5;
        break;
      case 'intermediate':
        generationTime *= 1.2;
        break;
    }
    
    generationTime += Math.random() * 1000; // Add variability
    
    await simulateWork(generationTime);
    
    const duration = Date.now() - start;
    result.requests.total++;
    
    if (duration <= taskData.expectedTime * 1.2) {
      result.requests.successful++;
    } else {
      result.requests.failed++;
    }
    
    result.requests.responseTimes.push(duration);
    result.quizGenerationTimes = [duration];
  };

  const simulateContentProcessing = async (taskData, result) => {
    const start = Date.now();
    
    // Simulate content processing based on type and size
    let processingTime = 2000; // Base processing time
    
    switch (taskData.contentType) {
      case 'video-transcript':
        processingTime = 5000 + Math.random() * 3000;
        break;
      case 'pdf':
        processingTime = 2000 + Math.random() * 2000;
        break;
      case 'markdown':
        processingTime = 500 + Math.random() * 500;
        break;
    }
    
    // Size multiplier
    switch (taskData.contentSize) {
      case 'large':
        processingTime *= 2;
        break;
      case 'medium':
        processingTime *= 1.5;
        break;
    }
    
    await simulateWork(processingTime);
    
    const duration = Date.now() - start;
    result.requests.total++;
    
    if (duration <= taskData.expectedTime * 1.3) {
      result.requests.successful++;
    } else {
      result.requests.failed++;
    }
    
    result.requests.responseTimes.push(duration);
    result.processingTimes = [duration];
  };

  const simulateUserWorkload = async (workloadType, taskData, result) => {
    const endTime = Date.now() + taskData.duration;
    const actionInterval = 60000 / taskData.actionsPerMinute; // ms between actions
    
    while (Date.now() < endTime) {
      const start = Date.now();
      
      // Simulate action based on workload type
      let actionTime = 500; // Base action time
      
      switch (workloadType) {
        case 'browsing':
          actionTime = 200 + Math.random() * 300; // Light operations
          break;
        case 'studying':
          actionTime = 800 + Math.random() * 700; // Moderate operations
          break;
        case 'quizzing':
          actionTime = 2000 + Math.random() * 1500; // Heavy operations
          break;
        case 'creating':
          actionTime = 3000 + Math.random() * 2000; // Very heavy operations
          break;
      }
      
      await simulateWork(actionTime);
      
      const duration = Date.now() - start;
      result.requests.total++;
      result.requests.successful++;
      result.requests.responseTimes.push(duration);
      
      // Wait for next action
      const waitTime = Math.max(0, actionInterval - duration);
      if (waitTime > 0) {
        await simulateWork(waitTime);
      }
    }
  };

  const simulateWork = (duration) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  executeTask();
}

module.exports = { OptimizedPerformanceTestSuite };

// Test runner
if (require.main === module) {
  const performanceTest = new OptimizedPerformanceTestSuite({
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    maxConcurrentUsers: 200,
    testDuration: 120000, // 2 minutes
    responseTimeThreshold: 1500,
    throughputThreshold: 150
  });

  performanceTest.initialize()
    .then(() => performanceTest.runEducationalLoadTest())
    .then(report => {
      console.log('📊 Performance Test Report:');
      console.log(JSON.stringify(report, null, 2));
      
      const compliance = report.thresholdCompliance;
      console.log(`\n🎯 Overall Compliance: ${compliance.overall}% (${compliance.passing ? 'PASSED' : 'FAILED'})`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      process.exit(compliance.passing ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}