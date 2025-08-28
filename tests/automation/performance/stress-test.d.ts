/**
 * Stress Testing Framework for jaqEdu Platform
 * Comprehensive stress testing with maximum capacity limits, resource exhaustion
 * scenarios, and system breaking point analysis
 */
import { EventEmitter } from 'events';
interface StressTestConfig {
    name: string;
    description: string;
    maxUsers: number;
    userIncrement: number;
    incrementInterval: number;
    testDuration: number;
    resourceLimits: ResourceLimits;
    breakingPointCriteria: BreakingPointCriteria;
    stressScenarios: StressScenario[];
    monitoringConfig: MonitoringConfig;
}
interface ResourceLimits {
    memory: {
        warning: number;
        critical: number;
        maximum: number;
    };
    cpu: {
        warning: number;
        critical: number;
    };
    connections: {
        warning: number;
        critical: number;
        maximum: number;
    };
    responseTime: {
        warning: number;
        critical: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
}
interface BreakingPointCriteria {
    maxResponseTime: number;
    maxErrorRate: number;
    minSuccessfulRequests: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
    consecutiveFailureThreshold: number;
}
interface StressScenario {
    name: string;
    type: StressType;
    intensity: 'low' | 'medium' | 'high' | 'extreme';
    duration: number;
    parameters: any;
}
type StressType = 'user_surge' | 'memory_exhaustion' | 'cpu_intensive' | 'database_overload' | 'network_saturation' | 'concurrent_operations' | 'resource_starvation' | 'cascading_failures';
interface MonitoringConfig {
    interval: number;
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
    duration: number;
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
    used: number;
    available: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    rss: number;
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
    responseTimeDegradation: number;
    throughputReduction: number;
    errorRateIncrease: number;
    resourceUsageIncrease: any;
    recoveryTime: number;
}
export declare class StressTestEngine extends EventEmitter {
    private config;
    private metrics;
    private workers;
    private monitoring;
    private testActive;
    private breakingPointReached;
    private testStartTime;
    constructor(config: StressTestConfig);
    /**
     * Execute comprehensive stress test
     */
    executeStressTest(): Promise<StressTestResult>;
    /**
     * Execute progressive user ramp up until breaking point
     */
    private executeProgressiveRampUp;
    /**
     * Execute individual stress scenario
     */
    private executeStressScenario;
    /**
     * Memory exhaustion stress scenario
     */
    private executeMemoryExhaustionScenario;
    /**
     * CPU intensive stress scenario
     */
    private executeCpuIntensiveScenario;
    /**
     * Database overload stress scenario
     */
    private executeDatabaseOverloadScenario;
    /**
     * Network saturation stress scenario
     */
    private executeNetworkSaturationScenario;
    /**
     * Concurrent operations stress scenario
     */
    private executeConcurrentOperationsScenario;
    /**
     * Resource starvation stress scenario
     */
    private executeResourceStarvationScenario;
    /**
     * Cascading failures stress scenario
     */
    private executeCascadingFailuresScenario;
    /**
     * Monitor for breaking point conditions
     */
    private monitorBreakingPoint;
    /**
     * Check breaking point criteria
     */
    private checkBreakingPointCriteria;
    /**
     * Record breaking point information
     */
    private recordBreakingPoint;
    /**
     * Start system monitoring
     */
    private startMonitoring;
    /**
     * Stop system monitoring
     */
    private stopMonitoring;
    private captureResourceUsage;
    private captureTimeSeriesMetrics;
    private captureCurrentMetrics;
    private initializeMetrics;
    private addUsers;
    private createStressWorker;
    private handleWorkerMessage;
    private calculateAverage;
    private calculatePercentile;
    private calculateCurrentErrorRate;
    private getRecentRequests;
    private getRecentResponseTimes;
    private sleep;
    private checkBreakingPoint;
    private calculateScenarioImpact;
    private createCpuIntensiveWorker;
    private executeDatabaseQueries;
    private generateNetworkTraffic;
    private executeOperation;
    private simulateServiceFailure;
    private checkAlerts;
    private handleAlert;
    private scaleDownWorkers;
    private generateStressTestResult;
    private calculatePerformanceDegradation;
    private calculateResourceUtilization;
    private generateStressTestRecommendations;
    private saveResults;
    private cleanup;
}
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
//# sourceMappingURL=stress-test.d.ts.map