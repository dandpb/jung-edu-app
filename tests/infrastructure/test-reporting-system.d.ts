import { EventEmitter } from 'events';
import { TestResults, TestArtifact, ExecutionMetrics, CoverageReport } from './test-execution-manager';
export interface TestReport {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'summary';
    executionId: string;
    timestamp: Date;
    duration: number;
    results: TestResults;
    metrics: ExecutionMetrics;
    environment: EnvironmentInfo;
    artifacts: TestArtifact[];
    coverage?: CoverageReport;
    metadata: ReportMetadata;
}
export interface EnvironmentInfo {
    platform: string;
    nodeVersion: string;
    testEnvironment: string;
    database: string;
    redis: string;
    externalServices: Record<string, boolean>;
}
export interface ReportMetadata {
    version: string;
    generator: string;
    format: string;
    tags: string[];
    customFields: Record<string, any>;
}
export interface ReportingConfig {
    outputDirectory: string;
    formats: ReportFormat[];
    compression: boolean;
    retention: {
        days: number;
        maxSize: number;
    };
    streaming: boolean;
    realTime: boolean;
    notifications: NotificationConfig[];
}
export interface ReportFormat {
    type: 'html' | 'json' | 'xml' | 'csv' | 'junit' | 'allure' | 'custom';
    template?: string;
    options?: Record<string, any>;
}
export interface NotificationConfig {
    type: 'email' | 'slack' | 'webhook' | 'file';
    config: Record<string, any>;
    triggers: NotificationTrigger[];
}
export interface NotificationTrigger {
    condition: 'test_failure' | 'coverage_threshold' | 'performance_degradation' | 'completion';
    threshold?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface ReportAggregation {
    period: 'daily' | 'weekly' | 'monthly';
    metrics: AggregatedMetrics;
    trends: TrendAnalysis[];
    comparisons: ComparisonData[];
}
export interface AggregatedMetrics {
    totalTests: number;
    passRate: number;
    averageDuration: number;
    coveragePercentage: number;
    flakyTestRate: number;
    performanceMetrics: Record<string, number>;
}
export interface TrendAnalysis {
    metric: string;
    direction: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    significance: 'low' | 'medium' | 'high';
}
export interface ComparisonData {
    baseline: string;
    current: string;
    differences: Record<string, number>;
}
export declare class TestReportingSystem extends EventEmitter {
    private logger;
    private config;
    private reports;
    private streams;
    private artifactStorage;
    private notificationManager;
    constructor(config?: Partial<ReportingConfig>);
    /**
     * Initialize the reporting system
     */
    initialize(): Promise<void>;
    /**
     * Start a new test report
     */
    startReport(executionId: string, name: string, type: TestReport['type']): Promise<TestReport>;
    /**
     * Update test report with new results
     */
    updateReport(reportId: string, updates: Partial<TestResults>): Promise<void>;
    /**
     * Add artifact to report
     */
    addArtifact(reportId: string, artifact: TestArtifact): Promise<void>;
    /**
     * Complete test report
     */
    completeReport(reportId: string, finalMetrics?: ExecutionMetrics): Promise<TestReport>;
    /**
     * Generate report in specific format
     */
    generateReport(reportId: string, format: ReportFormat): Promise<string>;
    /**
     * Get report aggregation for period
     */
    getReportAggregation(period: 'daily' | 'weekly' | 'monthly'): Promise<ReportAggregation>;
    /**
     * Export report data
     */
    exportReports(filter?: ReportFilter): Promise<string>;
    /**
     * Generate HTML report
     */
    private generateHtmlReport;
    /**
     * Generate JSON report
     */
    private generateJsonReport;
    /**
     * Generate XML/JUnit report
     */
    private generateXmlReport;
    /**
     * Generate CSV report
     */
    private generateCsvReport;
    /**
     * Generate Allure report
     */
    private generateAllureReport;
    private createEmptyMetrics;
    private collectEnvironmentInfo;
    private createDirectories;
    private cleanupOldReports;
    private initializeReportStream;
    private streamReportUpdate;
    private closeReportStream;
    private generateCoverageReport;
    private generateReportFormats;
    private getReportsForPeriod;
    private calculateAggregatedMetrics;
    private calculateTrends;
    private calculateComparisons;
    private filterReports;
    private getHtmlStyles;
    private getHtmlScripts;
    private generateSummarySection;
    private generateResultsSection;
    private generateCoverageSection;
    private generateMetricsSection;
    private generateArtifactsSection;
    private generateTestCases;
}
interface ReportFilter {
    type?: string;
    executionId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    status?: string;
}
export declare const testReportingSystem: TestReportingSystem;
export {};
//# sourceMappingURL=test-reporting-system.d.ts.map