"use strict";
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
exports.testReportingSystem = exports.TestReportingSystem = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const unified_test_config_1 = require("../config/unified-test.config");
// Test reporting system
class TestReportingSystem extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.reports = new Map();
        this.streams = new Map();
        this.logger = new logger_1.Logger('TestReportingSystem');
        this.config = {
            outputDirectory: path.join(process.cwd(), 'test-reports'),
            formats: [
                { type: 'html', options: { theme: 'modern' } },
                { type: 'json', options: { pretty: true } },
                { type: 'junit', options: { testSuitesAsClassNames: true } }
            ],
            compression: true,
            retention: {
                days: 30,
                maxSize: 1024 // 1GB
            },
            streaming: true,
            realTime: true,
            notifications: [],
            ...config
        };
        this.artifactStorage = new ArtifactStorage(this.config.outputDirectory);
        this.notificationManager = new NotificationManager(this.config.notifications);
    }
    /**
     * Initialize the reporting system
     */
    async initialize() {
        try {
            // Create output directories
            await this.createDirectories();
            // Initialize artifact storage
            await this.artifactStorage.initialize();
            // Initialize notification manager
            await this.notificationManager.initialize();
            // Clean up old reports based on retention policy
            await this.cleanupOldReports();
            this.logger.info('Test reporting system initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize test reporting system', error);
            throw error;
        }
    }
    /**
     * Start a new test report
     */
    async startReport(executionId, name, type) {
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type,
            executionId,
            timestamp: new Date(),
            duration: 0,
            results: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                flaky: 0,
                artifacts: []
            },
            metrics: this.createEmptyMetrics(),
            environment: await this.collectEnvironmentInfo(),
            artifacts: [],
            metadata: {
                version: '1.0.0',
                generator: 'jaqEdu Test System',
                format: 'json',
                tags: [],
                customFields: {}
            }
        };
        this.reports.set(report.id, report);
        // Initialize streaming if enabled
        if (this.config.streaming) {
            await this.initializeReportStream(report);
        }
        this.emit('report-started', report);
        return report;
    }
    /**
     * Update test report with new results
     */
    async updateReport(reportId, updates) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }
        // Merge updates
        Object.assign(report.results, updates);
        // Update timestamp
        report.duration = Date.now() - report.timestamp.getTime();
        // Stream update if enabled
        if (this.config.streaming && this.config.realTime) {
            await this.streamReportUpdate(report);
        }
        this.emit('report-updated', report);
    }
    /**
     * Add artifact to report
     */
    async addArtifact(reportId, artifact) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }
        // Store artifact
        const storedArtifact = await this.artifactStorage.storeArtifact(artifact);
        report.artifacts.push(storedArtifact);
        this.emit('artifact-added', { reportId, artifact: storedArtifact });
    }
    /**
     * Complete test report
     */
    async completeReport(reportId, finalMetrics) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }
        // Update final metrics
        if (finalMetrics) {
            report.metrics = finalMetrics;
        }
        // Calculate final duration
        report.duration = Date.now() - report.timestamp.getTime();
        // Generate coverage report if available
        report.coverage = await this.generateCoverageReport(report);
        // Generate all configured report formats
        await this.generateReportFormats(report);
        // Close streaming if enabled
        if (this.config.streaming) {
            await this.closeReportStream(report.id);
        }
        // Trigger notifications
        await this.notificationManager.processReport(report);
        this.emit('report-completed', report);
        return report;
    }
    /**
     * Generate report in specific format
     */
    async generateReport(reportId, format) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }
        switch (format.type) {
            case 'html':
                return await this.generateHtmlReport(report, format.options);
            case 'json':
                return await this.generateJsonReport(report, format.options);
            case 'xml':
            case 'junit':
                return await this.generateXmlReport(report, format.options);
            case 'csv':
                return await this.generateCsvReport(report, format.options);
            case 'allure':
                return await this.generateAllureReport(report, format.options);
            default:
                throw new Error(`Unsupported report format: ${format.type}`);
        }
    }
    /**
     * Get report aggregation for period
     */
    async getReportAggregation(period) {
        const reports = this.getReportsForPeriod(period);
        const metrics = this.calculateAggregatedMetrics(reports);
        const trends = this.calculateTrends(reports, period);
        const comparisons = this.calculateComparisons(reports);
        return {
            period,
            metrics,
            trends,
            comparisons
        };
    }
    /**
     * Export report data
     */
    async exportReports(filter) {
        const reports = this.filterReports(filter);
        const exportData = {
            timestamp: new Date().toISOString(),
            totalReports: reports.length,
            reports: reports.map(report => ({
                ...report,
                artifacts: report.artifacts.map(a => ({
                    ...a,
                    content: undefined // Exclude large content
                }))
            }))
        };
        const exportPath = path.join(this.config.outputDirectory, 'exports', `export_${Date.now()}.json`);
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        return exportPath;
    }
    /**
     * Generate HTML report
     */
    async generateHtmlReport(report, options = {}) {
        const template = options.template || 'default';
        const theme = options.theme || 'modern';
        const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Report - ${report.name}</title>
        <style>
            ${this.getHtmlStyles(theme)}
        </style>
    </head>
    <body>
        <header class="report-header">
            <h1>Test Report: ${report.name}</h1>
            <div class="metadata">
                <span>Execution ID: ${report.executionId}</span>
                <span>Generated: ${report.timestamp.toISOString()}</span>
                <span>Duration: ${report.duration}ms</span>
            </div>
        </header>

        <main class="report-content">
            ${this.generateSummarySection(report)}
            ${this.generateResultsSection(report)}
            ${this.generateCoverageSection(report)}
            ${this.generateMetricsSection(report)}
            ${this.generateArtifactsSection(report)}
        </main>

        <script>
            ${this.getHtmlScripts()}
        </script>
    </body>
    </html>
    `;
        const outputPath = path.join(this.config.outputDirectory, 'html', `${report.id}.html`);
        await fs.writeFile(outputPath, htmlContent);
        return outputPath;
    }
    /**
     * Generate JSON report
     */
    async generateJsonReport(report, options = {}) {
        const pretty = options.pretty !== false;
        const jsonContent = pretty ?
            JSON.stringify(report, null, 2) :
            JSON.stringify(report);
        const outputPath = path.join(this.config.outputDirectory, 'json', `${report.id}.json`);
        await fs.writeFile(outputPath, jsonContent);
        return outputPath;
    }
    /**
     * Generate XML/JUnit report
     */
    async generateXmlReport(report, options = {}) {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <testsuites name="${report.name}" tests="${report.results.total}" failures="${report.results.failed}" time="${report.duration / 1000}">
        <testsuite name="${report.name}" tests="${report.results.total}" failures="${report.results.failed}" time="${report.duration / 1000}">
            ${this.generateTestCases(report)}
        </testsuite>
    </testsuites>`;
        const outputPath = path.join(this.config.outputDirectory, 'junit', `${report.id}.xml`);
        await fs.writeFile(outputPath, xmlContent);
        return outputPath;
    }
    /**
     * Generate CSV report
     */
    async generateCsvReport(report, options = {}) {
        const csvContent = [
            'Type,Total,Passed,Failed,Skipped,Pass Rate,Duration',
            `${report.type},${report.results.total},${report.results.passed},${report.results.failed},${report.results.skipped},${(report.results.passed / report.results.total * 100).toFixed(2)}%,${report.duration}`
        ].join('\n');
        const outputPath = path.join(this.config.outputDirectory, 'csv', `${report.id}.csv`);
        await fs.writeFile(outputPath, csvContent);
        return outputPath;
    }
    /**
     * Generate Allure report
     */
    async generateAllureReport(report, options = {}) {
        const allureData = {
            uuid: report.id,
            name: report.name,
            status: report.results.failed > 0 ? 'failed' : 'passed',
            start: report.timestamp.getTime(),
            stop: report.timestamp.getTime() + report.duration,
            labels: [
                { name: 'type', value: report.type },
                { name: 'environment', value: report.environment.testEnvironment }
            ]
        };
        const outputPath = path.join(this.config.outputDirectory, 'allure-results', `${report.id}-result.json`);
        await fs.writeFile(outputPath, JSON.stringify(allureData, null, 2));
        return outputPath;
    }
    // Helper methods for report generation...
    createEmptyMetrics() {
        return {
            memoryUsage: 0,
            cpuUsage: 0,
            diskUsage: 0,
            networkRequests: 0,
            databaseQueries: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    async collectEnvironmentInfo() {
        return {
            platform: process.platform,
            nodeVersion: process.version,
            testEnvironment: process.env.TEST_ENV || 'local',
            database: `PostgreSQL ${unified_test_config_1.testConfig.database.host}:${unified_test_config_1.testConfig.database.port}`,
            redis: `Redis ${unified_test_config_1.testConfig.redis.host}:${unified_test_config_1.testConfig.redis.port}`,
            externalServices: {
                openai: !!unified_test_config_1.testConfig.external.openai.apiKey,
                supabase: !!unified_test_config_1.testConfig.external.supabase.url,
                youtube: !!unified_test_config_1.testConfig.external.youtube.apiKey
            }
        };
    }
    async createDirectories() {
        const dirs = [
            this.config.outputDirectory,
            path.join(this.config.outputDirectory, 'html'),
            path.join(this.config.outputDirectory, 'json'),
            path.join(this.config.outputDirectory, 'junit'),
            path.join(this.config.outputDirectory, 'csv'),
            path.join(this.config.outputDirectory, 'allure-results'),
            path.join(this.config.outputDirectory, 'artifacts'),
            path.join(this.config.outputDirectory, 'exports')
        ];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    // Additional private methods...
    async cleanupOldReports() {
        // Implementation for cleaning up old reports based on retention policy
    }
    async initializeReportStream(report) {
        // Implementation for initializing report streaming
    }
    async streamReportUpdate(report) {
        // Implementation for streaming report updates
    }
    async closeReportStream(reportId) {
        // Implementation for closing report stream
    }
    async generateCoverageReport(report) {
        // Implementation for generating coverage reports
        return undefined;
    }
    async generateReportFormats(report) {
        for (const format of this.config.formats) {
            await this.generateReport(report.id, format);
        }
    }
    getReportsForPeriod(period) {
        // Implementation for getting reports for a specific period
        return Array.from(this.reports.values());
    }
    calculateAggregatedMetrics(reports) {
        // Implementation for calculating aggregated metrics
        return {
            totalTests: 0,
            passRate: 0,
            averageDuration: 0,
            coveragePercentage: 0,
            flakyTestRate: 0,
            performanceMetrics: {}
        };
    }
    calculateTrends(reports, period) {
        // Implementation for trend analysis
        return [];
    }
    calculateComparisons(reports) {
        // Implementation for comparison data
        return [];
    }
    filterReports(filter) {
        // Implementation for filtering reports
        return Array.from(this.reports.values());
    }
    getHtmlStyles(theme) {
        // Implementation for HTML styles
        return `
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .report-header { border-bottom: 1px solid #ccc; padding-bottom: 20px; }
      .metadata { margin-top: 10px; }
      .metadata span { margin-right: 20px; color: #666; }
      .report-content { margin-top: 20px; }
    `;
    }
    getHtmlScripts() {
        // Implementation for HTML scripts
        return `
      console.log('Test report loaded');
    `;
    }
    generateSummarySection(report) {
        return `<section class="summary">
      <h2>Summary</h2>
      <div class="stats">
        <div class="stat">Total: ${report.results.total}</div>
        <div class="stat">Passed: ${report.results.passed}</div>
        <div class="stat">Failed: ${report.results.failed}</div>
        <div class="stat">Skipped: ${report.results.skipped}</div>
      </div>
    </section>`;
    }
    generateResultsSection(report) {
        return `<section class="results">
      <h2>Test Results</h2>
      <p>Pass Rate: ${(report.results.passed / report.results.total * 100).toFixed(2)}%</p>
    </section>`;
    }
    generateCoverageSection(report) {
        if (!report.coverage)
            return '';
        return `<section class="coverage">
      <h2>Coverage</h2>
      <div class="coverage-stats">
        <div>Lines: ${report.coverage.lines.percentage}%</div>
        <div>Branches: ${report.coverage.branches.percentage}%</div>
        <div>Functions: ${report.coverage.functions.percentage}%</div>
      </div>
    </section>`;
    }
    generateMetricsSection(report) {
        return `<section class="metrics">
      <h2>Performance Metrics</h2>
      <div class="metric">Memory Usage: ${report.metrics.memoryUsage} MB</div>
      <div class="metric">CPU Usage: ${report.metrics.cpuUsage}%</div>
    </section>`;
    }
    generateArtifactsSection(report) {
        return `<section class="artifacts">
      <h2>Artifacts (${report.artifacts.length})</h2>
      <ul>
        ${report.artifacts.map(a => `<li><a href="${a.path}">${a.name}</a> (${a.type})</li>`).join('')}
      </ul>
    </section>`;
    }
    generateTestCases(report) {
        // Generate XML test cases for JUnit format
        return Array.from({ length: report.results.total }, (_, i) => `<testcase name="Test ${i + 1}" classname="${report.name}" time="0.001"></testcase>`).join('\n');
    }
}
exports.TestReportingSystem = TestReportingSystem;
// Artifact storage class
class ArtifactStorage {
    constructor(baseDirectory) {
        this.logger = new logger_1.Logger('ArtifactStorage');
        this.baseDirectory = path.join(baseDirectory, 'artifacts');
    }
    async initialize() {
        await fs.mkdir(this.baseDirectory, { recursive: true });
    }
    async storeArtifact(artifact) {
        const storagePath = path.join(this.baseDirectory, artifact.name);
        // Copy artifact to storage location
        if (artifact.path !== storagePath) {
            await fs.copyFile(artifact.path, storagePath);
        }
        return {
            ...artifact,
            path: storagePath
        };
    }
}
// Notification manager class
class NotificationManager {
    constructor(configs) {
        this.logger = new logger_1.Logger('NotificationManager');
        this.configs = configs;
    }
    async initialize() {
        // Initialize notification channels
    }
    async processReport(report) {
        for (const config of this.configs) {
            for (const trigger of config.triggers) {
                if (this.shouldTrigger(report, trigger)) {
                    await this.sendNotification(config, report, trigger);
                }
            }
        }
    }
    shouldTrigger(report, trigger) {
        switch (trigger.condition) {
            case 'test_failure':
                return report.results.failed > 0;
            case 'completion':
                return true;
            case 'coverage_threshold':
                return report.coverage ?
                    report.coverage.lines.percentage < (trigger.threshold || 80) : false;
            default:
                return false;
        }
    }
    async sendNotification(config, report, trigger) {
        this.logger.info(`Sending ${config.type} notification for report ${report.id}`);
        // Implementation for sending notifications
    }
}
// Export singleton instance
exports.testReportingSystem = new TestReportingSystem();
//# sourceMappingURL=test-reporting-system.js.map