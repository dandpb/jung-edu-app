/**
 * Memory Leak Detection and Monitoring Tests for jaqEdu Platform
 * Comprehensive memory leak detection with heap analysis, garbage collection monitoring,
 * and memory usage pattern analysis
 */
import { EventEmitter } from 'events';
interface MemoryTestConfig {
    name: string;
    description: string;
    testDuration: number;
    samplingInterval: number;
    thresholds: MemoryThresholds;
    leakDetectionSettings: LeakDetectionSettings;
    testScenarios: MemoryTestScenario[];
    gcMonitoring: GCMonitoringConfig;
}
interface MemoryThresholds {
    heapUsed: {
        warning: number;
        critical: number;
    };
    heapTotal: {
        warning: number;
        critical: number;
    };
    rss: {
        warning: number;
        critical: number;
    };
    external: {
        warning: number;
        critical: number;
    };
    leakRate: {
        warning: number;
        critical: number;
    };
    growthRate: {
        warning: number;
        critical: number;
    };
}
interface LeakDetectionSettings {
    enabled: boolean;
    windowSize: number;
    significantGrowth: number;
    consistentGrowthPeriods: number;
    gcEfficiencyThreshold: number;
    stabilizationTime: number;
}
interface MemoryTestScenario {
    name: string;
    type: MemoryScenarioType;
    duration: number;
    intensity: 'low' | 'medium' | 'high' | 'extreme';
    parameters: any;
    expectedBehavior: ExpectedMemoryBehavior;
}
type MemoryScenarioType = 'normal_operations' | 'memory_intensive' | 'object_creation' | 'closure_leaks' | 'event_listener_leaks' | 'timer_leaks' | 'dom_leaks' | 'cache_growth' | 'buffer_accumulation';
interface ExpectedMemoryBehavior {
    pattern: 'stable' | 'sawtooth' | 'growing' | 'spiky';
    maxGrowth: number;
    gcRecoveryRate: number;
    stabilizationTime: number;
}
interface GCMonitoringConfig {
    enabled: boolean;
    trackTypes: GCType[];
    performanceMarks: boolean;
    heapSnapshots: boolean;
    snapshotInterval: number;
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
    efficiency: number;
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
    growthRate: number;
    retainedSize: number;
    confidence: number;
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
    efficiency: number;
    pressure: number;
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
    frequency: number;
    efficiency: number;
    pauseTime: number;
    pressure: number;
}
interface ScenarioAnalysis {
    meetsExpectations: boolean;
    deviations: string[];
    leakRisk: 'low' | 'medium' | 'high';
    stabilityScore: number;
}
interface PerformanceImpact {
    cpuOverhead: number;
    responseTimeImpact: number;
    throughputImpact: number;
    overallScore: number;
}
export declare class MemoryTestEngine extends EventEmitter {
    private config;
    private metrics;
    private monitoringInterval;
    private gcObserver;
    private testActive;
    private workers;
    private heapSnapshots;
    constructor(config: MemoryTestConfig);
    /**
     * Execute comprehensive memory test
     */
    executeMemoryTest(): Promise<MemoryTestResult>;
    /**
     * Execute individual memory scenario
     */
    private executeMemoryScenario;
    /**
     * Normal operations scenario
     */
    private executeNormalOperationsScenario;
    /**
     * Memory intensive scenario
     */
    private executeMemoryIntensiveScenario;
    /**
     * Object creation scenario
     */
    private executeObjectCreationScenario;
    /**
     * Closure leaks scenario
     */
    private executeClosureLeaksScenario;
    /**
     * Event listener leaks scenario
     */
    private executeEventListenerLeaksScenario;
    /**
     * Timer leaks scenario
     */
    private executeTimerLeaksScenario;
    /**
     * Cache growth scenario
     */
    private executeCacheGrowthScenario;
    /**
     * Buffer accumulation scenario
     */
    private executeBufferAccumulationScenario;
    /**
     * Start memory monitoring
     */
    private startMemoryMonitoring;
    /**
     * Start garbage collection monitoring
     */
    private startGCMonitoring;
    /**
     * Capture memory snapshot
     */
    private captureMemorySnapshot;
    /**
     * Capture heap snapshot for detailed analysis
     */
    private captureHeapSnapshot;
    /**
     * Continuous leak detection
     */
    private continuousLeakDetection;
    /**
     * Analyze snapshots for memory leaks
     */
    private analyzeForLeaks;
    /**
     * Analyze growth pattern
     */
    private analyzeGrowthPattern;
    /**
     * Calculate leak severity
     */
    private calculateLeakSeverity;
    private initializeMetrics;
    private createMemoryWorker;
    private createTestObject;
    private createLeakyClosure;
    private sleep;
    private stopMonitoring;
    private cleanup;
    private analyzeObjectCounts;
    private identifyLeakSuspects;
    private checkMemoryThresholds;
    private analyzeObjectLeaks;
    private calculateMemoryImpact;
    private calculateGCBehavior;
    private analyzeScenario;
    private analyzeMemoryPatterns;
    private detectMemoryLeaks;
    private analyzeGCBehavior;
    private generateGCRecommendations;
    private generateMemoryTestResult;
    private calculateThresholdViolations;
    private generateMemoryRecommendations;
    private saveResults;
}
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
//# sourceMappingURL=memory-test.d.ts.map