/**
 * Comprehensive Performance Test Suite for jaqEdu Platform
 * Orchestrates all performance tests with integrated metrics collection,
 * threshold monitoring, and regression detection
 */
import { EventEmitter } from 'events';
import { LoadTestConfig, LoadTestResult } from './load-test';
import { StressTestConfig, StressTestResult } from './stress-test';
import { MemoryTestConfig, MemoryTestResult } from './memory-test';
import { DatabasePerformanceConfig, DatabaseTestResult } from './database-performance.test';
import { CacheTestConfig, CacheTestResult } from './cache-test';
import { ScalabilityTestConfig, ScalabilityTestResult } from './scalability-test';
import { ApiResponseTestConfig, ApiTestResult } from './api-response-test';
interface PerformanceTestSuiteConfig {
    name: string;
    description: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    testProfile: TestProfile;
    scheduling: TestScheduling;
    regression: RegressionConfig;
    reporting: ReportingConfig;
    alerting: AlertingConfig;
    tests: TestSuiteConfiguration;
}
type TestProfile = 'quick' | 'comprehensive' | 'regression' | 'stress' | 'custom';
interface TestScheduling {
    parallel: boolean;
    maxConcurrentTests: number;
    testOrder: TestOrderStrategy;
    dependencies: TestDependency[];
    timeouts: TestTimeouts;
}
type TestOrderStrategy = 'parallel' | 'sequential' | 'priority' | 'dependency';
interface TestDependency {
    testType: string;
    dependsOn: string[];
    required: boolean;
}
interface TestTimeouts {
    individual: number;
    total: number;
    cleanup: number;
}
interface RegressionConfig {
    enabled: boolean;
    baselineSource: BaselineSource;
    thresholds: RegressionThresholds;
    detection: RegressionDetection;
    reporting: RegressionReporting;
}
type BaselineSource = 'previous_run' | 'baseline_file' | 'git_tag' | 'custom';
interface RegressionThresholds {
    responseTime: {
        degradation: number;
        improvement: number;
        significance: number;
    };
    throughput: {
        degradation: number;
        improvement: number;
        significance: number;
    };
    errorRate: {
        increase: number;
        decrease: number;
        significance: number;
    };
    memoryUsage: {
        increase: number;
        decrease: number;
        significance: number;
    };
}
interface RegressionDetection {
    algorithm: 'statistical' | 'threshold' | 'trend' | 'hybrid';
    confidence: number;
    windowSize: number;
    smoothing: boolean;
}
interface RegressionReporting {
    includeDetails: boolean;
    generateCharts: boolean;
    exportFormat: ('json' | 'html' | 'pdf' | 'csv')[];
}
interface ReportingConfig {
    enabled: boolean;
    formats: ReportFormat[];
    destinations: ReportDestination[];
    aggregation: ReportAggregation;
    visualization: VisualizationConfig;
}
interface ReportFormat {
    type: 'json' | 'html' | 'pdf' | 'excel' | 'csv';
    template?: string;
    includeRawData: boolean;
    compression: boolean;
}
interface ReportDestination {
    type: 'file' | 's3' | 'database' | 'webhook' | 'email';
    config: any;
    filter?: ReportFilter;
}
interface ReportFilter {
    severity: ('low' | 'medium' | 'high' | 'critical')[];
    categories: string[];
    testTypes: string[];
}
interface ReportAggregation {
    timeWindows: string[];
    metrics: string[];
    groupBy: string[];
}
interface VisualizationConfig {
    enabled: boolean;
    charts: ChartConfig[];
    dashboard: DashboardConfig;
}
interface ChartConfig {
    type: 'line' | 'bar' | 'scatter' | 'histogram' | 'heatmap';
    metrics: string[];
    timeRange: string;
    grouping: string;
}
interface DashboardConfig {
    enabled: boolean;
    updateInterval: number;
    layout: string;
    filters: string[];
}
interface AlertingConfig {
    enabled: boolean;
    channels: AlertChannel[];
    rules: AlertRule[];
    escalation: EscalationConfig;
    suppression: SuppressionConfig;
}
interface AlertChannel {
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';
    config: any;
    severity: ('low' | 'medium' | 'high' | 'critical')[];
}
interface AlertRule {
    name: string;
    condition: AlertCondition;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    actions: AlertAction[];
}
interface AlertCondition {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    threshold: number;
    duration: number;
    testTypes?: string[];
}
interface AlertAction {
    type: 'notify' | 'stop_tests' | 'scale_resources' | 'log';
    config: any;
}
interface EscalationConfig {
    levels: EscalationLevel[];
    timeouts: number[];
    autoResolve: boolean;
}
interface EscalationLevel {
    name: string;
    channels: string[];
    requiresAck: boolean;
}
interface SuppressionConfig {
    enabled: boolean;
    rules: SuppressionRule[];
}
interface SuppressionRule {
    condition: string;
    duration: number;
    reason: string;
}
interface TestSuiteConfiguration {
    loadTest?: LoadTestConfig;
    stressTest?: StressTestConfig;
    memoryTest?: MemoryTestConfig;
    databaseTest?: DatabasePerformanceConfig;
    cacheTest?: CacheTestConfig;
    scalabilityTest?: ScalabilityTestConfig;
    apiTest?: ApiResponseTestConfig;
}
interface PerformanceTestSuiteResult {
    suiteInfo: SuiteInfo;
    overallResults: OverallResults;
    testResults: TestResults;
    regressionAnalysis: SuiteRegressionAnalysis;
    performanceScore: PerformanceScore;
    recommendations: SuiteRecommendation[];
    alerts: AlertEvent[];
    metadata: SuiteMetadata;
}
interface SuiteInfo {
    suiteId: string;
    name: string;
    version: string;
    environment: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    profile: TestProfile;
}
interface OverallResults {
    success: boolean;
    testsExecuted: number;
    testsSucceeded: number;
    testsFailed: number;
    totalDuration: number;
    averageScore: number;
    criticalIssues: number;
    warningIssues: number;
}
interface TestResults {
    loadTest?: LoadTestResult;
    stressTest?: StressTestResult;
    memoryTest?: MemoryTestResult;
    databaseTest?: DatabaseTestResult;
    cacheTest?: CacheTestResult;
    scalabilityTest?: ScalabilityTestResult;
    apiTest?: ApiTestResult;
}
interface SuiteRegressionAnalysis {
    hasRegression: boolean;
    overallRegressionScore: number;
    regressionsByCategory: Map<string, CategoryRegression>;
    significantChanges: SignificantChange[];
    trendAnalysis: TrendAnalysis;
}
interface CategoryRegression {
    category: string;
    regressionScore: number;
    regressions: PerformanceRegression[];
    improvements: PerformanceImprovement[];
}
interface PerformanceRegression {
    metric: string;
    testType: string;
    currentValue: number;
    baselineValue: number;
    change: number;
    significance: 'low' | 'medium' | 'high';
    confidence: number;
}
interface PerformanceImprovement {
    metric: string;
    testType: string;
    currentValue: number;
    baselineValue: number;
    improvement: number;
    significance: 'low' | 'medium' | 'high';
}
interface SignificantChange {
    metric: string;
    testType: string;
    change: number;
    direction: 'improvement' | 'regression';
    confidence: number;
    impact: 'low' | 'medium' | 'high';
}
interface TrendAnalysis {
    overallTrend: 'improving' | 'stable' | 'degrading';
    trendsByMetric: Map<string, MetricTrend>;
    seasonalPatterns: SeasonalPattern[];
}
interface MetricTrend {
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    slope: number;
    correlation: number;
    volatility: number;
}
interface SeasonalPattern {
    pattern: string;
    strength: number;
    period: string;
    metrics: string[];
}
interface PerformanceScore {
    overallScore: number;
    categoryScores: Map<string, number>;
    scoring: ScoreBreakdown;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    benchmarkComparison: BenchmarkComparison;
}
interface ScoreBreakdown {
    performance: number;
    reliability: number;
    scalability: number;
    efficiency: number;
}
interface BenchmarkComparison {
    industry: IndustryBenchmark;
    historical: HistoricalBenchmark;
    target: TargetBenchmark;
}
interface IndustryBenchmark {
    percentile: number;
    comparison: 'above' | 'at' | 'below';
    gap: number;
}
interface HistoricalBenchmark {
    trend: 'improving' | 'stable' | 'degrading';
    changeRate: number;
    bestScore: number;
    worstScore: number;
}
interface TargetBenchmark {
    targetScore: number;
    currentGap: number;
    projectedTime: number;
    feasibility: 'easy' | 'moderate' | 'difficult' | 'unrealistic';
}
interface SuiteRecommendation {
    category: 'performance' | 'infrastructure' | 'process' | 'monitoring';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    rationale: string;
    implementation: ImplementationPlan;
    impact: ImpactAssessment;
    dependencies: string[];
}
interface ImplementationPlan {
    steps: string[];
    timeline: string;
    effort: 'low' | 'medium' | 'high';
    resources: string[];
    risks: string[];
}
interface ImpactAssessment {
    expectedImprovement: number;
    affectedMetrics: string[];
    businessValue: string;
    technicalBenefit: string;
}
interface AlertEvent {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    testType: string;
    metric: string;
    threshold: number;
    actualValue: number;
    message: string;
    acknowledged: boolean;
    resolved: boolean;
    resolutionTime?: Date;
}
interface SuiteMetadata {
    testEnvironment: EnvironmentInfo;
    systemInfo: SystemInfo;
    configuration: ConfigurationSnapshot;
    versions: VersionInfo;
}
interface EnvironmentInfo {
    name: string;
    type: string;
    region: string;
    infrastructure: string;
    capacity: any;
}
interface SystemInfo {
    os: string;
    runtime: string;
    dependencies: Record<string, string>;
    resources: ResourceInfo;
}
interface ResourceInfo {
    cpu: string;
    memory: string;
    disk: string;
    network: string;
}
interface ConfigurationSnapshot {
    testConfigs: any;
    systemConfigs: any;
    thresholds: any;
}
interface VersionInfo {
    application: string;
    testSuite: string;
    dependencies: Record<string, string>;
}
export declare class PerformanceTestSuiteEngine extends EventEmitter {
    private config;
    private results;
    private testEngines;
    private startTime;
    private baseline;
    constructor(config: PerformanceTestSuiteConfig);
    /**
     * Execute the complete performance test suite
     */
    executeTestSuite(): Promise<PerformanceTestSuiteResult>;
    /**
     * Load baseline data for regression analysis
     */
    private loadBaseline;
    /**
     * Initialize all test engines
     */
    private initializeTestEngines;
    /**
     * Execute tests based on scheduling configuration
     */
    private executeTests;
    /**
     * Execute individual test
     */
    private executeTest;
    /**
     * Resolve test execution order based on dependencies
     */
    private resolveTestDependencies;
    /**
     * Process test results from parallel execution
     */
    private processTestResults;
    /**
     * Set individual test result
     */
    private setTestResult;
    /**
     * Perform comprehensive suite analysis
     */
    private performSuiteAnalysis;
    /**
     * Perform regression analysis
     */
    private performRegressionAnalysis;
    /**
     * Calculate performance score
     */
    private calculatePerformanceScore;
    /**
     * Generate comprehensive recommendations
     */
    private generateRecommendations;
    /**
     * Process alerts based on test results
     */
    private processAlerts;
    /**
     * Save comprehensive results
     */
    private saveResults;
    private initializeResults;
    private loadPreviousRun;
    private loadBaselineFile;
    private loadGitTagBaseline;
    private loadCustomBaseline;
    private calculateLoadTestScore;
    private calculateStressTestScore;
    private calculateMemoryTestScore;
    private calculateDatabaseTestScore;
    private calculateCacheTestScore;
    private calculateScalabilityTestScore;
    private calculateApiTestScore;
    private calculateGrade;
    private analyzeCrossTestCorrelations;
    private analyzeSystemBottlenecks;
    private detectTestRegressions;
    private detectTestImprovements;
    private hasInfrastructureIssues;
    private evaluateAlertRule;
    private sendAlerts;
    private extractBaselineMetrics;
    private generateReports;
    private generateHtmlReport;
    private generateCsvReport;
    private generatePdfReport;
    private generateHtmlContent;
    private generateCsvContent;
}
export declare class PerformanceTestSuiteConfigFactory {
    static createQuickProfile(): PerformanceTestSuiteConfig;
    static createComprehensiveProfile(): PerformanceTestSuiteConfig;
}
export { PerformanceTestSuiteEngine, PerformanceTestSuiteConfig, PerformanceTestSuiteResult, PerformanceTestSuiteConfigFactory };
//# sourceMappingURL=performance-suite.d.ts.map