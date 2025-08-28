/**
 * Performance Bottleneck Optimizer for jaqEdu Testing Suite
 * Implements intelligent optimization strategies to eliminate performance bottlenecks
 */
import { EventEmitter } from 'events';
interface BottleneckAnalysis {
    id: string;
    name: string;
    type: BottleneckType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: PerformanceImpact;
    rootCause: string;
    recommendations: OptimizationRecommendation[];
    detectedAt: number;
}
type BottleneckType = 'execution_sequential' | 'worker_thread_management' | 'memory_leak' | 'connection_pool_saturation' | 'data_generation_overhead' | 'resource_cleanup_delay' | 'cache_inefficiency';
interface PerformanceImpact {
    executionTimeIncrease: number;
    memoryOverhead: number;
    cpuWaste: number;
    resourceUtilization: number;
    estimatedCost: number;
}
interface OptimizationRecommendation {
    strategy: OptimizationStrategy;
    description: string;
    expectedImprovement: PerformanceImpact;
    implementationEffort: 'low' | 'medium' | 'high';
    priority: number;
    dependencies: string[];
}
type OptimizationStrategy = 'parallel_execution' | 'worker_pool_optimization' | 'memory_management' | 'connection_pooling' | 'data_streaming' | 'resource_cleanup' | 'cache_optimization';
export declare class BottleneckOptimizer extends EventEmitter {
    private config;
    private workerPoolManager;
    private resourceManager;
    private analysisHistory;
    private optimizationResults;
    constructor(config: BottleneckOptimizerConfig);
    analyzeBottlenecks(): Promise<BottleneckAnalysis[]>;
    optimizeBottlenecks(bottlenecks: BottleneckAnalysis[]): Promise<OptimizationResult[]>;
    private analyzeExecutionBottlenecks;
    private analyzeWorkerThreadBottlenecks;
    private analyzeMemoryBottlenecks;
    private analyzeConnectionPoolBottlenecks;
    private analyzeCacheBottlenecks;
    private applyOptimizations;
    private optimizeParallelExecution;
    private optimizeWorkerThreads;
    private optimizeMemoryManagement;
    private optimizeConnectionPools;
    private optimizeCacheEfficiency;
    private setupEventHandlers;
    getOptimizationResults(): Map<string, OptimizationResult>;
    getAnalysisHistory(): BottleneckAnalysis[];
    dispose(): Promise<void>;
}
interface ResourceManagerConfig {
    maxIdleTime: number;
    cleanupInterval: number;
    maxResources: number;
}
interface OptimizationResult {
    bottleneckId: string;
    strategy: OptimizationStrategy;
    success: boolean;
    improvements: PerformanceImpact;
    duration: number;
    errors: string[];
}
export interface BottleneckOptimizerConfig {
    enableAutoOptimization: boolean;
    optimizationThresholds: {
        executionTimeIncrease: number;
        memoryOverhead: number;
        cpuWaste: number;
    };
    resourceManager: ResourceManagerConfig;
}
export declare function createBottleneckOptimizer(config?: Partial<BottleneckOptimizerConfig>): BottleneckOptimizer;
export {};
//# sourceMappingURL=bottleneck-optimizer.d.ts.map