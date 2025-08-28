/**
 * Real-time Performance Dashboard for jaqEdu Testing Suite
 * Provides live monitoring, visualization, and alerting for performance tests
 */
import { EventEmitter } from 'events';
interface PerformanceDashboardConfig {
    name: string;
    port: number;
    refreshInterval: number;
    dataRetentionPeriod: number;
    alerting: DashboardAlertingConfig;
    visualization: VisualizationConfig;
    metrics: DashboardMetricsConfig;
    export: ExportConfig;
}
interface DashboardAlertingConfig {
    enabled: boolean;
    thresholds: AlertThresholds;
    channels: AlertChannel[];
    cooldownPeriod: number;
}
interface AlertThresholds {
    responseTime: {
        warning: number;
        critical: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
    memoryUsage: {
        warning: number;
        critical: number;
    };
    cpuUsage: {
        warning: number;
        critical: number;
    };
    throughput: {
        warning: number;
        critical: number;
    };
}
type AlertChannel = 'console' | 'webhook' | 'email' | 'slack';
interface VisualizationConfig {
    charts: ChartConfig[];
    realTimeUpdates: boolean;
    historicalData: boolean;
    maxDataPoints: number;
    colorScheme: 'light' | 'dark' | 'auto';
}
interface ChartConfig {
    id: string;
    type: ChartType;
    title: string;
    metrics: string[];
    refreshRate: number;
    position: {
        row: number;
        col: number;
        width: number;
        height: number;
    };
}
type ChartType = 'line' | 'bar' | 'gauge' | 'heatmap' | 'scatter' | 'area';
interface DashboardMetricsConfig {
    performance: PerformanceMetricDefinition[];
    system: SystemMetricDefinition[];
    custom: CustomMetricDefinition[];
}
interface PerformanceMetricDefinition {
    id: string;
    name: string;
    unit: string;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
    threshold: {
        warning: number;
        critical: number;
    };
}
export declare class PerformanceDashboard extends EventEmitter {
    private config;
    private server;
    private wsServer;
    private dataStore;
    private metricsCollector;
    private alertManager;
    private isRunning;
    private clients;
    constructor(config: PerformanceDashboardConfig);
    private initializeComponents;
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupWebSocketHandlers;
    private handleHttpRequest;
    private generateDashboardHTML;
    private getDashboardCSS;
    private generateChartsHTML;
    private getDashboardJavaScript;
    private generateChartInitializationJS;
    private getChartColor;
    private sendInitialDashboardState;
    private handleClientMessage;
    private sendHistoricalData;
    private getCurrentMetrics;
    private handleDataExport;
    private setupEventHandlers;
    private broadcastToClients;
    reportMetric(name: string, value: number, timestamp?: number): void;
    triggerAlert(severity: 'warning' | 'critical', message: string): void;
    getActiveClients(): number;
}
interface SystemMetricDefinition {
    id: string;
    name: string;
    unit: string;
    collector: () => Promise<number>;
}
interface CustomMetricDefinition {
    id: string;
    name: string;
    unit: string;
    calculation: (data: any) => number;
}
interface ExportConfig {
    formats: ('json' | 'csv' | 'xlsx')[];
    includeCharts: boolean;
    includeAlerts: boolean;
}
export declare function createPerformanceDashboard(config?: Partial<PerformanceDashboardConfig>): PerformanceDashboard;
export {};
//# sourceMappingURL=performance-dashboard.d.ts.map