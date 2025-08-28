/**
 * API Response Time Monitoring Tests for jaqEdu Platform
 * Comprehensive API performance monitoring with response time analysis,
 * endpoint benchmarking, and SLA compliance validation
 */
import { EventEmitter } from 'events';
interface ApiResponseTestConfig {
    name: string;
    description: string;
    baseUrl: string;
    endpoints: ApiEndpointConfig[];
    testDuration: number;
    concurrentUsers: number;
    thresholds: ResponseTimeThresholds;
    scenarios: ApiTestScenario[];
    monitoring: ApiMonitoring;
    slaRequirements: SlaRequirements;
}
interface ApiEndpointConfig {
    path: string;
    method: HttpMethod;
    name: string;
    category: EndpointCategory;
    priority: 'low' | 'medium' | 'high' | 'critical';
    authentication?: AuthConfig;
    payload?: any;
    headers?: Record<string, string>;
    expectedResponse?: ResponseExpectation;
    dependencies?: string[];
}
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type EndpointCategory = 'authentication' | 'user_management' | 'content_delivery' | 'course_management' | 'progress_tracking' | 'assessment' | 'analytics' | 'file_upload' | 'search' | 'health_check';
interface AuthConfig {
    type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
    credentials?: any;
    refreshEndpoint?: string;
    tokenExpiry?: number;
}
interface ResponseExpectation {
    statusCode: number[];
    contentType: string;
    minSize?: number;
    maxSize?: number;
    requiredFields?: string[];
    customValidation?: (response: any) => boolean;
}
interface ResponseTimeThresholds {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
    critical: number;
    percentiles: {
        p50: number;
        p95: number;
        p99: number;
    };
    availability: number;
    errorRate: number;
}
interface ApiTestScenario {
    name: string;
    type: ApiScenarioType;
    duration: number;
    loadPattern: LoadPattern;
    endpointSelection: EndpointSelection;
    parameters: ScenarioParameters;
    expectedMetrics: ExpectedApiMetrics;
}
type ApiScenarioType = 'baseline_performance' | 'load_testing' | 'spike_testing' | 'endurance_testing' | 'error_handling' | 'security_testing' | 'dependency_testing' | 'sla_validation' | 'regression_testing' | 'geographic_distribution';
interface LoadPattern {
    type: 'constant' | 'ramp_up' | 'spike' | 'step' | 'sine_wave' | 'random';
    startRps: number;
    endRps: number;
    duration: number;
    parameters?: any;
}
interface EndpointSelection {
    mode: 'all' | 'weighted' | 'priority' | 'category' | 'custom';
    weights?: Record<string, number>;
    categories?: EndpointCategory[];
    priorities?: ('low' | 'medium' | 'high' | 'critical')[];
    customSelection?: string[];
}
interface ScenarioParameters {
    warmupDuration?: number;
    thinkTime?: number;
    sessionDuration?: number;
    dataVariation?: boolean;
    cacheControl?: 'no-cache' | 'normal' | 'aggressive';
    retryPolicy?: RetryPolicy;
    timeoutConfig?: TimeoutConfig;
}
interface RetryPolicy {
    enabled: boolean;
    maxRetries: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    initialDelay: number;
    maxDelay: number;
    retryableStatuses: number[];
}
interface TimeoutConfig {
    connection: number;
    request: number;
    total: number;
}
interface ExpectedApiMetrics {
    averageResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    concurrentUsers: number;
}
interface ApiMonitoring {
    enabled: boolean;
    samplingInterval: number;
    metrics: ApiMetricType[];
    alerting: ApiAlerting;
    tracing: TracingConfig;
    logging: LoggingConfig;
}
type ApiMetricType = 'response_time' | 'throughput' | 'error_rate' | 'availability' | 'concurrent_users' | 'payload_size' | 'network_metrics' | 'cache_metrics';
interface ApiAlerting {
    enabled: boolean;
    channels: AlertChannel[];
    rules: AlertRule[];
    escalation: EscalationPolicy;
}
interface AlertChannel {
    type: 'email' | 'slack' | 'webhook' | 'sms';
    endpoint: string;
    severity: AlertSeverity[];
}
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
interface AlertRule {
    metric: ApiMetricType;
    condition: 'above' | 'below' | 'equals';
    threshold: number;
    duration: number;
    severity: AlertSeverity;
    message: string;
}
interface EscalationPolicy {
    levels: EscalationLevel[];
    timeouts: number[];
}
interface EscalationLevel {
    channels: string[];
    requiresAck: boolean;
    autoResolve: boolean;
}
interface TracingConfig {
    enabled: boolean;
    sampleRate: number;
    includePayloads: boolean;
    maxTraceSize: number;
    retention: number;
}
interface LoggingConfig {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeRequest: boolean;
    includeResponse: boolean;
    maxLogSize: number;
}
interface SlaRequirements {
    availability: number;
    responseTime: SlaResponseTime;
    throughput: SlaThroughput;
    errorRate: number;
    uptime: number;
    penalties: SlaPenalty[];
}
interface SlaResponseTime {
    p50: number;
    p95: number;
    p99: number;
    maximum: number;
}
interface SlaThroughput {
    minimum: number;
    average: number;
    peak: number;
}
interface SlaPenalty {
    metric: string;
    threshold: number;
    penalty: string;
    severity: 'minor' | 'major' | 'critical';
}
interface ApiTestMetrics {
    testId: string;
    startTime: Date;
    endTime?: Date;
    requestMetrics: ApiRequestMetrics[];
    endpointMetrics: Map<string, EndpointMetrics>;
    scenarioResults: ApiScenarioResult[];
    performanceAnalysis: ApiPerformanceAnalysis;
    slaCompliance: SlaComplianceResult;
    alertsTriggered: AlertEvent[];
    regressionAnalysis: RegressionAnalysis;
}
interface ApiRequestMetrics {
    requestId: string;
    timestamp: number;
    endpoint: string;
    method: HttpMethod;
    responseTime: number;
    statusCode: number;
    payloadSize: number;
    responseSize: number;
    success: boolean;
    error?: string;
    retryCount: number;
    cacheHit?: boolean;
    geographic?: string;
    userId?: string;
    traceId?: string;
}
interface EndpointMetrics {
    endpoint: string;
    method: HttpMethod;
    category: EndpointCategory;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    responseTimeStats: ResponseTimeStats;
    throughputStats: ThroughputStats;
    errorAnalysis: ErrorAnalysis;
    availabilityStats: AvailabilityStats;
    performanceTrends: PerformanceTrend[];
}
interface ResponseTimeStats {
    minimum: number;
    maximum: number;
    average: number;
    median: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    standardDeviation: number;
    distribution: ResponseTimeDistribution[];
}
interface ResponseTimeDistribution {
    range: string;
    count: number;
    percentage: number;
}
interface ThroughputStats {
    averageRps: number;
    peakRps: number;
    sustainedRps: number;
    throughputTrend: 'increasing' | 'stable' | 'decreasing';
}
interface ErrorAnalysis {
    totalErrors: number;
    errorRate: number;
    errorsByStatus: Map<number, number>;
    errorsByType: Map<string, number>;
    errorPattern: ErrorPattern;
    topErrors: TopError[];
}
interface ErrorPattern {
    type: 'random' | 'burst' | 'sustained' | 'intermittent';
    frequency: number;
    correlation: string[];
}
interface TopError {
    message: string;
    count: number;
    percentage: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    affectedEndpoints: string[];
}
interface AvailabilityStats {
    uptime: number;
    downtime: number;
    incidents: AvailabilityIncident[];
    mttr: number;
    mtbf: number;
}
interface AvailabilityIncident {
    startTime: Date;
    endTime?: Date;
    duration: number;
    affectedEndpoints: string[];
    severity: 'minor' | 'major' | 'critical';
    cause: string;
    resolution: string;
}
interface PerformanceTrend {
    timestamp: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    concurrent: number;
}
interface ApiScenarioResult {
    scenario: string;
    type: ApiScenarioType;
    startTime: Date;
    endTime: Date;
    success: boolean;
    metrics: ScenarioApiMetrics;
    analysis: ScenarioApiAnalysis;
    issues: ApiIssue[];
}
interface ScenarioApiMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    peakConcurrency: number;
}
interface ScenarioApiAnalysis {
    meetsExpectations: boolean;
    performanceScore: number;
    bottlenecks: ApiBottleneck[];
    regressions: ApiRegression[];
    improvements: ApiImprovement[];
    recommendations: string[];
}
interface ApiBottleneck {
    type: 'response_time' | 'throughput' | 'error_rate' | 'concurrency';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedEndpoints: string[];
    impact: string;
    recommendations: string[];
}
interface ApiRegression {
    metric: string;
    currentValue: number;
    baselineValue: number;
    degradation: number;
    significance: 'low' | 'medium' | 'high';
    endpoints: string[];
}
interface ApiImprovement {
    metric: string;
    currentValue: number;
    baselineValue: number;
    improvement: number;
    endpoints: string[];
}
interface ApiIssue {
    timestamp: number;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'performance' | 'reliability' | 'security' | 'compliance';
    title: string;
    description: string;
    affectedEndpoints: string[];
    impact: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
}
interface ApiPerformanceAnalysis {
    overallScore: number;
    categoryScores: Map<EndpointCategory, number>;
    performanceSummary: PerformanceSummary;
    reliabilityAnalysis: ReliabilityAnalysis;
    scalabilityAssessment: ScalabilityAssessment;
    securityAnalysis: SecurityAnalysis;
    recommendations: ApiRecommendation[];
}
interface PerformanceSummary {
    fastestEndpoint: string;
    slowestEndpoint: string;
    averageResponseTime: number;
    responseTimeVariability: number;
    performanceStability: number;
    hotspots: PerformanceHotspot[];
}
interface PerformanceHotspot {
    endpoint: string;
    metric: string;
    value: number;
    impact: 'low' | 'medium' | 'high';
}
interface ReliabilityAnalysis {
    overallReliability: number;
    errorPatterns: ErrorPattern[];
    availabilityTrends: AvailabilityTrend[];
    failurePoints: FailurePoint[];
    recoveryMetrics: RecoveryMetrics;
}
interface AvailabilityTrend {
    period: string;
    availability: number;
    incidents: number;
    trend: 'improving' | 'stable' | 'degrading';
}
interface FailurePoint {
    endpoint: string;
    failureRate: number;
    commonCauses: string[];
    impact: string;
}
interface RecoveryMetrics {
    averageRecoveryTime: number;
    p95RecoveryTime: number;
    successfulRecoveries: number;
    failedRecoveries: number;
}
interface ScalabilityAssessment {
    currentCapacity: CapacityMetrics;
    scalabilityLimits: ScalabilityLimits;
    performanceDegradation: PerformanceDegradation;
    recommendedCapacity: RecommendedCapacity;
}
interface CapacityMetrics {
    maxSustainedRps: number;
    peakRps: number;
    concurrentUserLimit: number;
    resourceUtilization: number;
}
interface ScalabilityLimits {
    responseTimeLimit: number;
    throughputLimit: number;
    concurrencyLimit: number;
    bottleneckType: string;
}
interface PerformanceDegradation {
    degradationPoint: number;
    degradationRate: number;
    criticalPoint: number;
}
interface RecommendedCapacity {
    optimalRps: number;
    safeRps: number;
    maxRecommendedRps: number;
    reserveCapacity: number;
}
interface SecurityAnalysis {
    vulnerabilities: SecurityVulnerability[];
    authenticationAnalysis: AuthenticationAnalysis;
    rateLimitingEffectiveness: RateLimitingAnalysis;
    dataExposureRisks: DataExposureRisk[];
}
interface SecurityVulnerability {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedEndpoints: string[];
    recommendation: string;
}
interface AuthenticationAnalysis {
    authenticationLatency: number;
    tokenValidationTime: number;
    sessionManagement: string;
    securityScore: number;
}
interface RateLimitingAnalysis {
    rateLimitActive: boolean;
    rateLimitEffective: boolean;
    bypassAttempts: number;
    recommendedLimits: Record<string, number>;
}
interface DataExposureRisk {
    endpoint: string;
    riskLevel: 'low' | 'medium' | 'high';
    exposedFields: string[];
    recommendation: string;
}
interface ApiRecommendation {
    category: 'performance' | 'reliability' | 'security' | 'monitoring';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    implementation: string;
    expectedBenefit: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
}
interface SlaComplianceResult {
    overallCompliance: boolean;
    complianceScore: number;
    violations: SlaViolation[];
    complianceByMetric: Map<string, ComplianceMetric>;
    riskAssessment: RiskAssessment;
}
interface SlaViolation {
    metric: string;
    threshold: number;
    actualValue: number;
    deviation: number;
    duration: number;
    severity: 'minor' | 'major' | 'critical';
    penalty: string;
    timestamp: Date;
}
interface ComplianceMetric {
    metric: string;
    required: number;
    actual: number;
    compliance: number;
    trend: 'improving' | 'stable' | 'degrading';
}
interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: RiskFactor[];
    mitigation: string[];
    monitoringRecommendations: string[];
}
interface RiskFactor {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    description: string;
}
interface AlertEvent {
    alertId: string;
    timestamp: Date;
    severity: AlertSeverity;
    metric: string;
    threshold: number;
    actualValue: number;
    message: string;
    endpoints: string[];
    acknowledged: boolean;
    resolved: boolean;
    resolutionTime?: Date;
}
interface RegressionAnalysis {
    hasRegression: boolean;
    regressionScore: number;
    regressions: ApiRegression[];
    improvements: ApiImprovement[];
    baselineComparison: BaselineComparison;
}
interface BaselineComparison {
    baselineDate: Date;
    comparisonPeriod: string;
    overallChange: number;
    significantChanges: SignificantChange[];
}
interface SignificantChange {
    endpoint: string;
    metric: string;
    change: number;
    significance: 'low' | 'medium' | 'high';
    isRegression: boolean;
}
export declare class ApiResponseTestEngine extends EventEmitter {
    private config;
    private metrics;
    private workers;
    private monitoringInterval;
    private testActive;
    private authTokens;
    constructor(config: ApiResponseTestConfig);
    /**
     * Execute comprehensive API response time test
     */
    executeApiResponseTest(): Promise<ApiTestResult>;
    /**
     * Initialize authentication tokens
     */
    private initializeAuthentication;
    /**
     * Initialize endpoint metrics
     */
    private initializeEndpointMetrics;
    /**
     * Execute API test scenario
     */
    private executeApiScenario;
    /**
     * Execute baseline performance scenario
     */
    private executeBaselinePerformanceScenario;
    /**
     * Execute load testing scenario
     */
    private executeLoadTestingScenario;
    /**
     * Execute spike testing scenario
     */
    private executeSpikeTestingScenario;
    /**
     * Execute endurance testing scenario
     */
    private executeEnduranceTestingScenario;
    /**
     * Execute error handling scenario
     */
    private executeErrorHandlingScenario;
    /**
     * Execute security testing scenario
     */
    private executeSecurityTestingScenario;
    private executeDependencyTestingScenario;
    private executeSlaValidationScenario;
    private executeRegressionTestingScenario;
    private executeGeographicDistributionScenario;
    /**
     * Start API monitoring
     */
    private startApiMonitoring;
    /**
     * Stop API monitoring
     */
    private stopMonitoring;
    private initializeMetrics;
    private acquireAuthToken;
    private selectEndpoints;
    private spawnApiWorkers;
    private createApiWorker;
    private spawnErrorTestWorkers;
    private spawnSecurityTestWorkers;
    private handleWorkerMessage;
    private recordApiRequest;
    private recordApiError;
    private updateEndpointMetrics;
    private collectApiWorkerResults;
    private aggregateScenarioMetrics;
    private createDefaultScenarioMetrics;
    private analyzeScenario;
    private calculateScenarioPerformanceScore;
    private generateScenarioRecommendations;
    private monitorEnduranceMetrics;
    private captureApiMetrics;
    private checkAlertRules;
    private updatePerformanceTrends;
    private analyzeApiPerformance;
    private validateSlaCompliance;
    private performRegressionAnalysis;
    private generateApiTestResult;
    private generateEndpointAnalysis;
    private generateApiRecommendations;
    private saveResults;
    private cleanup;
    private sleep;
}
interface ApiTestResult {
    testInfo: {
        testId: string;
        name: string;
        duration: number;
        startTime: Date;
        endTime: Date;
        baseUrl: string;
        endpointsTested: number;
    };
    performanceAnalysis: ApiPerformanceAnalysis;
    scenarioResults: ApiScenarioResult[];
    endpointAnalysis: any;
    slaCompliance: SlaComplianceResult;
    regressionAnalysis: RegressionAnalysis;
    alertsTriggered: AlertEvent[];
    recommendations: ApiRecommendation[];
    rawMetrics: ApiTestMetrics;
}
export { ApiResponseTestEngine, ApiResponseTestConfig, ApiTestResult };
//# sourceMappingURL=api-response-test.d.ts.map