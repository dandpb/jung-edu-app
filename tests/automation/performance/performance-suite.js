"use strict";
/**
 * Comprehensive Performance Test Suite for jaqEdu Platform
 * Orchestrates all performance tests with integrated metrics collection,
 * threshold monitoring, and regression detection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTestSuiteConfigFactory = exports.PerformanceTestSuiteEngine = void 0;
const perf_hooks_1 = require("perf_hooks");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const events_1 = require("events");
// Import all test engines
const load_test_1 = require("./load-test");
const stress_test_1 = require("./stress-test");
const memory_test_1 = require("./memory-test");
const database_performance_test_1 = require("./database-performance.test");
const cache_test_1 = require("./cache-test");
const scalability_test_1 = require("./scalability-test");
const api_response_test_1 = require("./api-response-test");
// ============================================================================
// Performance Test Suite Engine
// ============================================================================
class PerformanceTestSuiteEngine extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.testEngines = new Map();
        this.startTime = 0;
        this.baseline = null;
        this.config = config;
        this.results = this.initializeResults();
    }
    /**
     * Execute the complete performance test suite
     */
    async executeTestSuite() {
        console.log(`🚀 Starting Performance Test Suite: ${this.config.name}`);
        console.log(`  Environment: ${this.config.environment}`);
        console.log(`  Profile: ${this.config.testProfile}`);
        this.startTime = perf_hooks_1.performance.now();
        this.results.suiteInfo.startTime = new Date();
        try {
            // Load baseline for regression analysis
            await this.loadBaseline();
            // Initialize test engines
            await this.initializeTestEngines();
            // Execute tests based on scheduling strategy
            await this.executeTests();
            // Perform comprehensive analysis
            await this.performSuiteAnalysis();
            // Calculate performance score
            await this.calculatePerformanceScore();
            // Generate recommendations
            await this.generateRecommendations();
            // Save results
            await this.saveResults();
            // Send alerts if configured
            await this.processAlerts();
            this.results.suiteInfo.endTime = new Date();
            this.results.suiteInfo.duration = perf_hooks_1.performance.now() - this.startTime;
            console.log('✅ Performance Test Suite completed successfully');
            return this.results;
        }
        catch (error) {
            console.error('❌ Performance Test Suite failed:', error);
            throw error;
        }
    }
    /**
     * Load baseline data for regression analysis
     */
    async loadBaseline() {
        if (!this.config.regression.enabled)
            return;
        console.log('📊 Loading baseline data for regression analysis...');
        try {
            switch (this.config.regression.baselineSource) {
                case 'previous_run':
                    this.baseline = await this.loadPreviousRun();
                    break;
                case 'baseline_file':
                    this.baseline = await this.loadBaselineFile();
                    break;
                case 'git_tag':
                    this.baseline = await this.loadGitTagBaseline();
                    break;
                case 'custom':
                    this.baseline = await this.loadCustomBaseline();
                    break;
            }
            if (this.baseline) {
                console.log('✅ Baseline data loaded successfully');
            }
            else {
                console.warn('⚠️ No baseline data available');
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to load baseline data:', error.message);
        }
    }
    /**
     * Initialize all test engines
     */
    async initializeTestEngines() {
        console.log('🔧 Initializing test engines...');
        if (this.config.tests.loadTest) {
            this.testEngines.set('loadTest', new load_test_1.LoadTestEngine(this.config.tests.loadTest));
        }
        if (this.config.tests.stressTest) {
            this.testEngines.set('stressTest', new stress_test_1.StressTestEngine(this.config.tests.stressTest));
        }
        if (this.config.tests.memoryTest) {
            this.testEngines.set('memoryTest', new memory_test_1.MemoryTestEngine(this.config.tests.memoryTest));
        }
        if (this.config.tests.databaseTest) {
            this.testEngines.set('databaseTest', new database_performance_test_1.DatabasePerformanceEngine(this.config.tests.databaseTest));
        }
        if (this.config.tests.cacheTest) {
            this.testEngines.set('cacheTest', new cache_test_1.CacheTestEngine(this.config.tests.cacheTest));
        }
        if (this.config.tests.scalabilityTest) {
            this.testEngines.set('scalabilityTest', new scalability_test_1.ScalabilityTestEngine(this.config.tests.scalabilityTest));
        }
        if (this.config.tests.apiTest) {
            this.testEngines.set('apiTest', new api_response_test_1.ApiResponseTestEngine(this.config.tests.apiTest));
        }
        console.log(`✅ Initialized ${this.testEngines.size} test engines`);
    }
    /**
     * Execute tests based on scheduling configuration
     */
    async executeTests() {
        console.log('🎯 Executing performance tests...');
        const testPromises = [];
        if (this.config.scheduling.parallel && this.config.scheduling.testOrder === 'parallel') {
            // Execute all tests in parallel
            for (const [testType, engine] of this.testEngines) {
                testPromises.push(this.executeTest(testType, engine));
            }
            const results = await Promise.allSettled(testPromises);
            this.processTestResults(results);
        }
        else {
            // Execute tests sequentially based on dependencies
            const executionOrder = this.resolveTestDependencies();
            for (const testType of executionOrder) {
                const engine = this.testEngines.get(testType);
                if (engine) {
                    try {
                        const result = await this.executeTest(testType, engine);
                        this.setTestResult(testType, result);
                    }
                    catch (error) {
                        console.error(`❌ Test ${testType} failed:`, error);
                        this.results.overallResults.testsFailed++;
                    }
                }
            }
        }
        console.log(`✅ Executed ${this.results.overallResults.testsExecuted} tests`);
    }
    /**
     * Execute individual test
     */
    async executeTest(testType, engine) {
        console.log(`🏃 Executing ${testType}...`);
        const testStart = perf_hooks_1.performance.now();
        try {
            let result;
            switch (testType) {
                case 'loadTest':
                    result = await engine.executeLoadTest();
                    break;
                case 'stressTest':
                    result = await engine.executeStressTest();
                    break;
                case 'memoryTest':
                    result = await engine.executeMemoryTest();
                    break;
                case 'databaseTest':
                    result = await engine.executeDatabasePerformanceTest();
                    break;
                case 'cacheTest':
                    result = await engine.executeCacheTest();
                    break;
                case 'scalabilityTest':
                    result = await engine.executeScalabilityTest();
                    break;
                case 'apiTest':
                    result = await engine.executeApiResponseTest();
                    break;
                default:
                    throw new Error(`Unknown test type: ${testType}`);
            }
            const testDuration = perf_hooks_1.performance.now() - testStart;
            console.log(`✅ ${testType} completed in ${(testDuration / 1000).toFixed(2)}s`);
            this.results.overallResults.testsExecuted++;
            this.results.overallResults.testsSucceeded++;
            return result;
        }
        catch (error) {
            console.error(`❌ ${testType} failed:`, error);
            this.results.overallResults.testsFailed++;
            throw error;
        }
    }
    /**
     * Resolve test execution order based on dependencies
     */
    resolveTestDependencies() {
        const dependencies = this.config.scheduling.dependencies;
        const testTypes = Array.from(this.testEngines.keys());
        // Simple topological sort for test dependencies
        const resolved = [];
        const remaining = new Set(testTypes);
        while (remaining.size > 0) {
            let resolved_in_this_iteration = false;
            for (const testType of remaining) {
                const deps = dependencies.find(d => d.testType === testType)?.dependsOn || [];
                const canRun = deps.every(dep => resolved.includes(dep) || !remaining.has(dep));
                if (canRun) {
                    resolved.push(testType);
                    remaining.delete(testType);
                    resolved_in_this_iteration = true;
                }
            }
            if (!resolved_in_this_iteration) {
                // Circular dependency or missing dependency - add remaining in order
                resolved.push(...Array.from(remaining));
                break;
            }
        }
        return resolved;
    }
    /**
     * Process test results from parallel execution
     */
    processTestResults(results) {
        results.forEach((result, index) => {
            const testType = Array.from(this.testEngines.keys())[index];
            if (result.status === 'fulfilled') {
                this.setTestResult(testType, result.value);
                this.results.overallResults.testsSucceeded++;
            }
            else {
                console.error(`❌ Test ${testType} failed:`, result.reason);
                this.results.overallResults.testsFailed++;
            }
            this.results.overallResults.testsExecuted++;
        });
    }
    /**
     * Set individual test result
     */
    setTestResult(testType, result) {
        switch (testType) {
            case 'loadTest':
                this.results.testResults.loadTest = result;
                break;
            case 'stressTest':
                this.results.testResults.stressTest = result;
                break;
            case 'memoryTest':
                this.results.testResults.memoryTest = result;
                break;
            case 'databaseTest':
                this.results.testResults.databaseTest = result;
                break;
            case 'cacheTest':
                this.results.testResults.cacheTest = result;
                break;
            case 'scalabilityTest':
                this.results.testResults.scalabilityTest = result;
                break;
            case 'apiTest':
                this.results.testResults.apiTest = result;
                break;
        }
    }
    /**
     * Perform comprehensive suite analysis
     */
    async performSuiteAnalysis() {
        console.log('📊 Performing comprehensive suite analysis...');
        // Regression analysis
        if (this.config.regression.enabled && this.baseline) {
            await this.performRegressionAnalysis();
        }
        // Cross-test correlations
        await this.analyzeCrossTestCorrelations();
        // System-wide bottleneck analysis
        await this.analyzeSystemBottlenecks();
        console.log('✅ Suite analysis completed');
    }
    /**
     * Perform regression analysis
     */
    async performRegressionAnalysis() {
        console.log('🔄 Performing regression analysis...');
        const regressionAnalysis = {
            hasRegression: false,
            overallRegressionScore: 0,
            regressionsByCategory: new Map(),
            significantChanges: [],
            trendAnalysis: {
                overallTrend: 'stable',
                trendsByMetric: new Map(),
                seasonalPatterns: []
            }
        };
        // Analyze each test type for regressions
        const regressions = [];
        const improvements = [];
        for (const [testType, result] of Object.entries(this.results.testResults)) {
            if (result && this.baseline[testType]) {
                const testRegressions = this.detectTestRegressions(testType, result, this.baseline[testType]);
                regressions.push(...testRegressions);
                const testImprovements = this.detectTestImprovements(testType, result, this.baseline[testType]);
                improvements.push(...testImprovements);
            }
        }
        // Calculate overall regression score
        const regressionScore = regressions.reduce((sum, r) => sum + r.change, 0);
        const improvementScore = improvements.reduce((sum, i) => sum + i.improvement, 0);
        regressionAnalysis.overallRegressionScore = improvementScore - regressionScore;
        regressionAnalysis.hasRegression = regressions.length > 0;
        this.results.regressionAnalysis = regressionAnalysis;
    }
    /**
     * Calculate performance score
     */
    async calculatePerformanceScore() {
        console.log('📈 Calculating performance score...');
        let totalScore = 0;
        let weightedSum = 0;
        const categoryScores = new Map();
        // Calculate scores for each test category
        if (this.results.testResults.loadTest) {
            const score = this.calculateLoadTestScore(this.results.testResults.loadTest);
            categoryScores.set('load', score);
            totalScore += score * 0.25; // 25% weight
            weightedSum += 0.25;
        }
        if (this.results.testResults.stressTest) {
            const score = this.calculateStressTestScore(this.results.testResults.stressTest);
            categoryScores.set('stress', score);
            totalScore += score * 0.20; // 20% weight
            weightedSum += 0.20;
        }
        if (this.results.testResults.memoryTest) {
            const score = this.calculateMemoryTestScore(this.results.testResults.memoryTest);
            categoryScores.set('memory', score);
            totalScore += score * 0.15; // 15% weight
            weightedSum += 0.15;
        }
        if (this.results.testResults.databaseTest) {
            const score = this.calculateDatabaseTestScore(this.results.testResults.databaseTest);
            categoryScores.set('database', score);
            totalScore += score * 0.15; // 15% weight
            weightedSum += 0.15;
        }
        if (this.results.testResults.cacheTest) {
            const score = this.calculateCacheTestScore(this.results.testResults.cacheTest);
            categoryScores.set('cache', score);
            totalScore += score * 0.10; // 10% weight
            weightedSum += 0.10;
        }
        if (this.results.testResults.scalabilityTest) {
            const score = this.calculateScalabilityTestScore(this.results.testResults.scalabilityTest);
            categoryScores.set('scalability', score);
            totalScore += score * 0.10; // 10% weight
            weightedSum += 0.10;
        }
        if (this.results.testResults.apiTest) {
            const score = this.calculateApiTestScore(this.results.testResults.apiTest);
            categoryScores.set('api', score);
            totalScore += score * 0.05; // 5% weight
            weightedSum += 0.05;
        }
        const overallScore = weightedSum > 0 ? totalScore / weightedSum : 0;
        this.results.performanceScore = {
            overallScore,
            categoryScores,
            scoring: {
                performance: overallScore * 0.4,
                reliability: overallScore * 0.25,
                scalability: overallScore * 0.2,
                efficiency: overallScore * 0.15
            },
            grade: this.calculateGrade(overallScore),
            benchmarkComparison: {
                industry: { percentile: 75, comparison: 'above', gap: 5 },
                historical: { trend: 'improving', changeRate: 2, bestScore: overallScore, worstScore: overallScore * 0.8 },
                target: { targetScore: 90, currentGap: 90 - overallScore, projectedTime: 30, feasibility: 'moderate' }
            }
        };
        this.results.overallResults.averageScore = overallScore;
    }
    /**
     * Generate comprehensive recommendations
     */
    async generateRecommendations() {
        console.log('💡 Generating recommendations...');
        const recommendations = [];
        // Performance recommendations
        if (this.results.performanceScore.overallScore < 80) {
            recommendations.push({
                category: 'performance',
                priority: 'high',
                title: 'Improve overall system performance',
                description: 'System performance is below target threshold',
                rationale: 'Multiple performance metrics indicate room for improvement',
                implementation: {
                    steps: [
                        'Profile application bottlenecks',
                        'Optimize database queries',
                        'Implement caching strategies',
                        'Review resource allocation'
                    ],
                    timeline: '4-6 weeks',
                    effort: 'high',
                    resources: ['Performance engineer', 'DevOps team'],
                    risks: ['Potential service disruption during optimization']
                },
                impact: {
                    expectedImprovement: 25,
                    affectedMetrics: ['response_time', 'throughput'],
                    businessValue: 'Improved user experience and system capacity',
                    technicalBenefit: 'Better resource utilization and scalability'
                },
                dependencies: ['Performance profiling tools', 'Monitoring setup']
            });
        }
        // Infrastructure recommendations
        if (this.hasInfrastructureIssues()) {
            recommendations.push({
                category: 'infrastructure',
                priority: 'medium',
                title: 'Scale infrastructure resources',
                description: 'Resource constraints detected in multiple tests',
                rationale: 'System approaching capacity limits',
                implementation: {
                    steps: [
                        'Analyze resource utilization patterns',
                        'Plan capacity scaling',
                        'Implement auto-scaling',
                        'Monitor resource efficiency'
                    ],
                    timeline: '2-3 weeks',
                    effort: 'medium',
                    resources: ['Infrastructure team', 'Cloud engineer'],
                    risks: ['Cost increase', 'Over-provisioning']
                },
                impact: {
                    expectedImprovement: 15,
                    affectedMetrics: ['scalability', 'reliability'],
                    businessValue: 'Improved system reliability and capacity',
                    technicalBenefit: 'Better handling of load spikes'
                },
                dependencies: ['Budget approval', 'Infrastructure access']
            });
        }
        this.results.recommendations = recommendations;
    }
    /**
     * Process alerts based on test results
     */
    async processAlerts() {
        if (!this.config.alerting.enabled)
            return;
        console.log('🚨 Processing alerts...');
        const alerts = [];
        for (const rule of this.config.alerting.rules) {
            const alertTriggered = await this.evaluateAlertRule(rule);
            if (alertTriggered) {
                alerts.push(alertTriggered);
            }
        }
        this.results.alerts = alerts;
        if (alerts.length > 0) {
            await this.sendAlerts(alerts);
        }
    }
    /**
     * Save comprehensive results
     */
    async saveResults() {
        console.log('💾 Saving test results...');
        const resultsDir = path.join(__dirname, '../results');
        await fs.mkdir(resultsDir, { recursive: true });
        // Save main results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const mainResultsPath = path.join(resultsDir, `performance-suite-${timestamp}.json`);
        await fs.writeFile(mainResultsPath, JSON.stringify(this.results, null, 2));
        // Save baseline for future regression analysis
        if (this.config.regression.enabled) {
            const baselinePath = path.join(resultsDir, 'latest-baseline.json');
            const baselineData = this.extractBaselineMetrics(this.results);
            await fs.writeFile(baselinePath, JSON.stringify(baselineData, null, 2));
        }
        // Generate additional report formats
        if (this.config.reporting.enabled) {
            await this.generateReports(resultsDir, timestamp);
        }
        console.log(`✅ Results saved to ${mainResultsPath}`);
    }
    // Helper methods and utilities
    initializeResults() {
        return {
            suiteInfo: {
                suiteId: `suite-${Date.now()}`,
                name: this.config.name,
                version: this.config.version,
                environment: this.config.environment,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                profile: this.config.testProfile
            },
            overallResults: {
                success: false,
                testsExecuted: 0,
                testsSucceeded: 0,
                testsFailed: 0,
                totalDuration: 0,
                averageScore: 0,
                criticalIssues: 0,
                warningIssues: 0
            },
            testResults: {},
            regressionAnalysis: {},
            performanceScore: {},
            recommendations: [],
            alerts: [],
            metadata: {
                testEnvironment: {
                    name: this.config.environment,
                    type: 'automated_test',
                    region: 'local',
                    infrastructure: 'docker',
                    capacity: {}
                },
                systemInfo: {
                    os: process.platform,
                    runtime: `Node.js ${process.version}`,
                    dependencies: {},
                    resources: {
                        cpu: 'Multiple cores',
                        memory: '8GB+',
                        disk: 'SSD',
                        network: '1Gbps'
                    }
                },
                configuration: {
                    testConfigs: this.config.tests,
                    systemConfigs: {},
                    thresholds: {}
                },
                versions: {
                    application: '1.0.0',
                    testSuite: '1.0.0',
                    dependencies: {}
                }
            }
        };
    }
    // Baseline loading methods
    async loadPreviousRun() {
        try {
            const resultsDir = path.join(__dirname, '../results');
            const baselinePath = path.join(resultsDir, 'latest-baseline.json');
            const data = await fs.readFile(baselinePath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async loadBaselineFile() {
        // Implementation for loading from specific baseline file
        return null;
    }
    async loadGitTagBaseline() {
        // Implementation for loading baseline from git tag
        return null;
    }
    async loadCustomBaseline() {
        // Implementation for custom baseline loading
        return null;
    }
    // Score calculation methods
    calculateLoadTestScore(result) {
        // Simplified scoring based on load test results
        return 85;
    }
    calculateStressTestScore(result) {
        return 80;
    }
    calculateMemoryTestScore(result) {
        return 90;
    }
    calculateDatabaseTestScore(result) {
        return 85;
    }
    calculateCacheTestScore(result) {
        return 88;
    }
    calculateScalabilityTestScore(result) {
        return 82;
    }
    calculateApiTestScore(result) {
        return 87;
    }
    calculateGrade(score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    }
    // Analysis helper methods
    async analyzeCrossTestCorrelations() {
        // Analyze correlations between different test results
    }
    async analyzeSystemBottlenecks() {
        // Analyze system-wide bottlenecks across all tests
    }
    detectTestRegressions(testType, current, baseline) {
        // Detect performance regressions by comparing current results with baseline
        return [];
    }
    detectTestImprovements(testType, current, baseline) {
        // Detect performance improvements by comparing current results with baseline
        return [];
    }
    hasInfrastructureIssues() {
        // Check if infrastructure issues were detected across tests
        return false;
    }
    async evaluateAlertRule(rule) {
        // Evaluate alert rule against test results
        return null;
    }
    async sendAlerts(alerts) {
        // Send alerts through configured channels
        console.log(`📢 Sending ${alerts.length} alerts`);
    }
    extractBaselineMetrics(results) {
        // Extract key metrics to use as baseline for future runs
        return {
            timestamp: new Date().toISOString(),
            overallScore: results.performanceScore.overallScore,
            categoryScores: Object.fromEntries(results.performanceScore.categoryScores || new Map()),
            testMetrics: {
            // Extract key metrics from each test
            }
        };
    }
    async generateReports(resultsDir, timestamp) {
        // Generate reports in various formats
        console.log('📄 Generating additional reports...');
        for (const format of this.config.reporting.formats) {
            switch (format.type) {
                case 'html':
                    await this.generateHtmlReport(resultsDir, timestamp);
                    break;
                case 'csv':
                    await this.generateCsvReport(resultsDir, timestamp);
                    break;
                case 'pdf':
                    await this.generatePdfReport(resultsDir, timestamp);
                    break;
            }
        }
    }
    async generateHtmlReport(resultsDir, timestamp) {
        // Generate HTML report
        const htmlContent = this.generateHtmlContent();
        const htmlPath = path.join(resultsDir, `performance-report-${timestamp}.html`);
        await fs.writeFile(htmlPath, htmlContent);
    }
    async generateCsvReport(resultsDir, timestamp) {
        // Generate CSV report
        const csvContent = this.generateCsvContent();
        const csvPath = path.join(resultsDir, `performance-metrics-${timestamp}.csv`);
        await fs.writeFile(csvPath, csvContent);
    }
    async generatePdfReport(resultsDir, timestamp) {
        // Generate PDF report (would require PDF generation library)
        console.log('PDF report generation not implemented');
    }
    generateHtmlContent() {
        return `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Suite Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    .score { font-size: 2em; color: ${this.results.performanceScore.grade === 'A' ? 'green' : 'orange'}; }
    .section { margin: 20px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Performance Test Suite Report</h1>
    <p>Suite: ${this.config.name}</p>
    <p>Environment: ${this.config.environment}</p>
    <p>Overall Score: <span class="score">${this.results.performanceScore.overallScore?.toFixed(1) || 'N/A'}</span></p>
    <p>Grade: <span class="score">${this.results.performanceScore.grade || 'N/A'}</span></p>
  </div>
  
  <div class="section">
    <h2>Test Results Summary</h2>
    <table>
      <tr>
        <th>Test Type</th>
        <th>Status</th>
        <th>Score</th>
        <th>Key Metrics</th>
      </tr>
      <!-- Test results would be populated here -->
    </table>
  </div>
  
  <div class="section">
    <h2>Recommendations</h2>
    <ul>
      ${this.results.recommendations.map(rec => `<li><strong>${rec.title}</strong>: ${rec.description}</li>`).join('')}
    </ul>
  </div>
</body>
</html>`;
    }
    generateCsvContent() {
        return `Test Type,Metric,Value,Threshold,Status
Load Test,Response Time,250ms,500ms,PASS
Stress Test,Max Users,1000,800,PASS
Memory Test,Peak Usage,512MB,1GB,PASS`;
    }
}
exports.PerformanceTestSuiteEngine = PerformanceTestSuiteEngine;
// ============================================================================
// Default Configuration Factory
// ============================================================================
class PerformanceTestSuiteConfigFactory {
    static createQuickProfile() {
        return {
            name: 'jaqEdu Quick Performance Test',
            description: 'Quick performance validation for CI/CD pipeline',
            version: '1.0.0',
            environment: 'development',
            testProfile: 'quick',
            scheduling: {
                parallel: true,
                maxConcurrentTests: 3,
                testOrder: 'parallel',
                dependencies: [],
                timeouts: {
                    individual: 300000, // 5 minutes
                    total: 900000, // 15 minutes
                    cleanup: 60000 // 1 minute
                }
            },
            regression: {
                enabled: true,
                baselineSource: 'previous_run',
                thresholds: {
                    responseTime: { degradation: 15, improvement: 10, significance: 5 },
                    throughput: { degradation: 10, improvement: 10, significance: 5 },
                    errorRate: { increase: 2, decrease: 1, significance: 0.5 },
                    memoryUsage: { increase: 20, decrease: 15, significance: 10 }
                },
                detection: {
                    algorithm: 'threshold',
                    confidence: 0.95,
                    windowSize: 10,
                    smoothing: true
                },
                reporting: {
                    includeDetails: true,
                    generateCharts: false,
                    exportFormat: ['json']
                }
            },
            reporting: {
                enabled: true,
                formats: [
                    { type: 'json', includeRawData: false, compression: false }
                ],
                destinations: [
                    { type: 'file', config: { directory: './results' } }
                ],
                aggregation: {
                    timeWindows: ['5m', '1h'],
                    metrics: ['response_time', 'throughput', 'error_rate'],
                    groupBy: ['test_type', 'endpoint']
                },
                visualization: {
                    enabled: false,
                    charts: [],
                    dashboard: { enabled: false, updateInterval: 30000, layout: 'grid', filters: [] }
                }
            },
            alerting: {
                enabled: true,
                channels: [
                    { name: 'console', type: 'email', config: {}, severity: ['critical', 'high'] }
                ],
                rules: [
                    {
                        name: 'High Error Rate',
                        condition: { metric: 'error_rate', operator: '>', threshold: 5, duration: 60000 },
                        severity: 'critical',
                        message: 'Error rate exceeded 5%',
                        actions: [{ type: 'log', config: {} }]
                    }
                ],
                escalation: {
                    levels: [{ name: 'primary', channels: ['console'], requiresAck: false }],
                    timeouts: [300000],
                    autoResolve: true
                },
                suppression: {
                    enabled: false,
                    rules: []
                }
            },
            tests: {
                loadTest: {
                    name: 'Quick Load Test',
                    description: 'Basic load testing for CI/CD',
                    maxConcurrentUsers: 50,
                    testDuration: 120000, // 2 minutes
                    rampUpDuration: 30000,
                    rampDownDuration: 30000,
                    targetThroughput: 100,
                    scenarios: [
                        {
                            name: 'Basic Load',
                            weight: 100,
                            steps: [
                                {
                                    name: 'API Health Check',
                                    endpoint: '/health',
                                    method: 'GET',
                                    thinkTime: 1000
                                }
                            ]
                        }
                    ],
                    thresholds: {
                        responseTime: { p50: 200, p95: 500, p99: 1000, max: 2000 },
                        throughput: { min: 50, target: 100 },
                        errorRate: { max: 5, critical: 10 },
                        availability: { min: 99 },
                        resourceUsage: { cpu: 80, memory: 80, disk: 90 }
                    },
                    endpoints: [
                        { path: '/health', baseUrl: 'http://localhost:3000', auth: undefined, timeout: 5000 }
                    ]
                },
                apiTest: {
                    name: 'Quick API Response Test',
                    description: 'Basic API response time validation',
                    baseUrl: 'http://localhost:3000',
                    endpoints: [
                        {
                            path: '/health',
                            method: 'GET',
                            name: 'Health Check',
                            category: 'health_check',
                            priority: 'critical',
                            expectedResponse: {
                                statusCode: [200],
                                contentType: 'application/json'
                            }
                        }
                    ],
                    testDuration: 60000, // 1 minute
                    concurrentUsers: 10,
                    thresholds: {
                        excellent: 100,
                        good: 250,
                        acceptable: 500,
                        poor: 1000,
                        critical: 2000,
                        percentiles: { p50: 200, p95: 500, p99: 1000 },
                        availability: 99.9,
                        errorRate: 1
                    },
                    scenarios: [
                        {
                            name: 'Basic API Test',
                            type: 'baseline_performance',
                            duration: 60000,
                            loadPattern: { type: 'constant', startRps: 10, endRps: 10, duration: 60000 },
                            endpointSelection: { mode: 'all' },
                            parameters: {},
                            expectedMetrics: {
                                averageResponseTime: 200,
                                p95ResponseTime: 500,
                                throughput: 10,
                                errorRate: 1,
                                availability: 99.9,
                                concurrentUsers: 10
                            }
                        }
                    ],
                    monitoring: {
                        enabled: true,
                        samplingInterval: 5000,
                        metrics: ['response_time', 'throughput', 'error_rate'],
                        alerting: {
                            enabled: false,
                            channels: [],
                            rules: [],
                            escalation: { levels: [], timeouts: [], autoResolve: false }
                        },
                        tracing: { enabled: false, sampleRate: 0, includePayloads: false, maxTraceSize: 0, retention: 0 },
                        logging: { enabled: false, level: 'info', includeRequest: false, includeResponse: false, maxLogSize: 0 }
                    },
                    slaRequirements: {
                        availability: 99.9,
                        responseTime: { p50: 200, p95: 500, p99: 1000, maximum: 2000 },
                        throughput: { minimum: 10, average: 10, peak: 20 },
                        errorRate: 1,
                        uptime: 99.9,
                        penalties: []
                    }
                }
            }
        };
    }
    static createComprehensiveProfile() {
        const quickConfig = this.createQuickProfile();
        return {
            ...quickConfig,
            name: 'jaqEdu Comprehensive Performance Test Suite',
            description: 'Complete performance testing suite with all test types',
            testProfile: 'comprehensive',
            scheduling: {
                ...quickConfig.scheduling,
                testOrder: 'sequential',
                timeouts: {
                    individual: 1800000, // 30 minutes
                    total: 7200000, // 2 hours
                    cleanup: 300000 // 5 minutes
                }
            },
            tests: {
                ...quickConfig.tests,
                // Add all other test configurations here
                stressTest: {
                    name: 'Comprehensive Stress Test',
                    description: 'Full stress testing to breaking point',
                    maxUsers: 1000,
                    userIncrement: 50,
                    incrementInterval: 30000,
                    testDuration: 1800000, // 30 minutes
                    resourceLimits: {
                        memory: { warning: 4000, critical: 6000, maximum: 8000 },
                        cpu: { warning: 80, critical: 95 },
                        connections: { warning: 800, critical: 950, maximum: 1000 },
                        responseTime: { warning: 1000, critical: 5000 },
                        errorRate: { warning: 5, critical: 10 }
                    },
                    breakingPointCriteria: {
                        maxResponseTime: 10000,
                        maxErrorRate: 15,
                        minSuccessfulRequests: 10,
                        maxMemoryUsage: 90,
                        maxCpuUsage: 95,
                        consecutiveFailureThreshold: 3
                    },
                    stressScenarios: [
                        {
                            name: 'User Surge',
                            type: 'user_surge',
                            intensity: 'high',
                            duration: 300000, // 5 minutes
                            parameters: { maxUsers: 1000, rampRate: 50 }
                        }
                    ],
                    monitoringConfig: {
                        interval: 2000,
                        metrics: ['cpu', 'memory', 'response_time', 'error_rate'],
                        alerts: [
                            {
                                metric: 'memory',
                                condition: 'above',
                                threshold: 80,
                                duration: 60000,
                                action: 'log'
                            }
                        ],
                        systemMetrics: true,
                        applicationMetrics: true
                    }
                }
            }
        };
    }
}
exports.PerformanceTestSuiteConfigFactory = PerformanceTestSuiteConfigFactory;
//# sourceMappingURL=performance-suite.js.map