/**
 * Optimized Test Runner for jaqEdu Performance Suite
 * Integrates bottleneck analysis and optimization with intelligent test scheduling
 */
import { EventEmitter } from 'events';
import { PerformanceTestSuiteConfig } from './performance-suite';
interface OptimizedTestRunnerConfig {
    name: string;
    optimization: OptimizationSettings;
    scheduling: AdvancedSchedulingConfig;
    monitoring: RealTimeMonitoring;
    regression: RegressionDetectionConfig;
    reporting: EnhancedReporting;
    testSuite: PerformanceTestSuiteConfig;
}
interface OptimizationSettings {
    enabled: boolean;
    autoOptimize: boolean;
    bottleneckDetection: {
        threshold: number;
        analysisFrequency: number;
        maxOptimizationAttempts: number;
    };
    resourceManagement: {
        enableSharedWorkerPool: boolean;
        maxWorkerThreads: number;
        memoryCleanupInterval: number;
        connectionPoolOptimization: boolean;
    };
}
interface AdvancedSchedulingConfig {
    strategy: SchedulingStrategy;
    parallelization: ParallelizationConfig;
    dependencies: TestDependencyMap;
    resourceAllocation: ResourceAllocationStrategy;
    adaptiveScheduling: boolean;
}
type SchedulingStrategy = 'dependency_aware_parallel' | 'resource_optimized' | 'latency_minimized' | 'throughput_maximized' | 'balanced_hybrid';
interface ParallelizationConfig {
    maxConcurrentTests: number;
    testGrouping: TestGroupingStrategy;
    resourceIsolation: boolean;
    dynamicLoadBalancing: boolean;
}
type TestGroupingStrategy = 'by_resource_type' | 'by_execution_time' | 'by_dependency_chain' | 'by_priority_level';
interface TestDependencyMap {
    [testId: string]: {
        dependsOn: string[];
        blockedBy: string[];
        resourceRequirements: ResourceRequirement[];
        priority: number;
    };
}
interface ResourceRequirement {
    type: 'cpu' | 'memory' | 'network' | 'database' | 'cache';
    amount: number;
    exclusive: boolean;
}
type ResourceAllocationStrategy = 'fair_share' | 'priority_based' | 'load_adaptive' | 'resource_aware';
interface RealTimeMonitoring {
    enabled: boolean;
    metrics: MonitoringMetrics;
    alerting: AlertingConfig;
    dashboard: DashboardConfig;
}
interface MonitoringMetrics {
    performance: PerformanceMetricConfig[];
    resources: ResourceMetricConfig[];
    bottlenecks: BottleneckMetricConfig[];
}
export declare class OptimizedTestRunner extends EventEmitter {
    private config;
    private bottleneckOptimizer;
    private testEngines;
    private executionContext;
    private performanceBaseline;
    private realTimeMetrics;
    constructor(config: OptimizedTestRunnerConfig);
    private initializeComponents;
    private initializeTestEngines;
    executeOptimizedTestSuite(): Promise<OptimizedTestResult>;
    private establishPerformanceBaseline;
    private generateOptimizedSchedule;
    private executeScheduledTests;
    private performRuntimeOptimizations;
    private performFinalAnalysis;
    private generateOptimizedResult;
    private setupEventHandlers;
    private collectSystemMetrics;
    private createBaselineTestConfig;
    private extractMetric;
    private extractTestCases;
    private buildDependencyGraph;
    private analyzeResourceRequirements;
    private startPhaseMonitoring;
    private handleTestProgress;
    private checkForRuntimeBottlenecks;
    private collectCurrentMetrics;
    private detectPerformanceDegradations;
    private applyRuntimeOptimization;
    private calculateOverallPerformance;
    private summarizeBottlenecks;
    private calculateOptimizationImpact;
    private generateRecommendations;
    private performTrendAnalysis;
    private calculatePerformanceImprovement;
    private calculatePerformanceDegradation;
    private calculateStabilityScore;
    private cleanup;
}
interface PerformanceBaseline {
    timestamp: number;
    systemMetrics: SystemMetrics;
    testMetrics: TestMetrics;
    establishmentDuration: number;
}
interface SystemMetrics {
    memory: {
        used: number;
        total: number;
        external: number;
    };
    cpu: {
        user: number;
        system: number;
    };
    timestamp: number;
}
interface TestMetrics {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUtilization: number;
}
interface TestExecutionResult {
    testId: string;
    success: boolean;
    duration: number;
    metrics: any;
    errors?: string[];
}
interface RuntimeOptimization {
    type: string;
    applied: boolean;
    success: boolean;
    impact: any;
    duration: number;
}
interface FinalAnalysis {
    overallPerformance: OverallPerformance;
    bottlenecksSummary: BottlenecksSummary;
    optimizationImpact: OptimizationImpact;
    recommendations: Recommendation[];
    trendAnalysis: TrendAnalysis;
}
interface OptimizedTestResult {
    summary: any;
    baseline: PerformanceBaseline;
    testResults: TestExecutionResult[];
    bottleneckAnalysis: any;
    optimizations: RuntimeOptimization[];
    performance: any;
    finalAnalysis: FinalAnalysis;
    recommendations: Recommendation[];
    metadata: any;
}
type OverallPerformance = any;
type BottlenecksSummary = any;
type OptimizationImpact = any;
type Recommendation = any;
type TrendAnalysis = any;
export declare function createOptimizedTestRunner(config: OptimizedTestRunnerConfig): OptimizedTestRunner;
export {};
//# sourceMappingURL=optimized-test-runner.d.ts.map