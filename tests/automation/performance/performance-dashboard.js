"use strict";
/**
 * Real-time Performance Dashboard for jaqEdu Testing Suite
 * Provides live monitoring, visualization, and alerting for performance tests
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
exports.PerformanceDashboard = void 0;
exports.createPerformanceDashboard = createPerformanceDashboard;
const events_1 = require("events");
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
// ============================================================================
// Performance Dashboard
// ============================================================================
class PerformanceDashboard extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.isRunning = false;
        this.clients = new Set();
        this.initializeComponents();
    }
    initializeComponents() {
        this.dataStore = new DashboardDataStore({
            retentionPeriod: this.config.dataRetentionPeriod,
            maxDataPoints: this.config.visualization.maxDataPoints
        });
        this.metricsCollector = new MetricsCollector({
            refreshInterval: this.config.refreshInterval,
            metrics: this.config.metrics
        });
        this.alertManager = new AlertManager(this.config.alerting);
        this.setupEventHandlers();
    }
    async start() {
        console.log(`🎯 Starting Performance Dashboard on port ${this.config.port}...`);
        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        // Create WebSocket server
        this.wsServer = new WebSocket.Server({ server: this.server });
        this.setupWebSocketHandlers();
        // Start metrics collection
        await this.metricsCollector.start();
        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`✅ Performance Dashboard running at http://localhost:${this.config.port}`);
            this.isRunning = true;
            this.emit('dashboard-started', { port: this.config.port });
        });
    }
    async stop() {
        console.log('🛑 Stopping Performance Dashboard...');
        this.isRunning = false;
        // Stop metrics collection
        await this.metricsCollector.stop();
        // Close WebSocket connections
        this.clients.forEach(client => {
            client.close();
        });
        this.clients.clear();
        // Close servers
        if (this.wsServer) {
            this.wsServer.close();
        }
        if (this.server) {
            this.server.close();
        }
        console.log('✅ Performance Dashboard stopped');
        this.emit('dashboard-stopped');
    }
    setupWebSocketHandlers() {
        this.wsServer.on('connection', (ws) => {
            console.log('📡 New dashboard client connected');
            this.clients.add(ws);
            // Send initial dashboard state
            this.sendInitialDashboardState(ws);
            ws.on('close', () => {
                console.log('📡 Dashboard client disconnected');
                this.clients.delete(ws);
            });
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleClientMessage(ws, message);
                }
                catch (error) {
                    console.error('❌ Invalid client message:', error);
                }
            });
        });
    }
    async handleHttpRequest(req, res) {
        const url = req.url || '/';
        try {
            switch (url) {
                case '/':
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(await this.generateDashboardHTML());
                    break;
                case '/api/metrics':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(await this.getCurrentMetrics()));
                    break;
                case '/api/alerts':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.alertManager.getActiveAlerts()));
                    break;
                case '/api/export':
                    await this.handleDataExport(req, res);
                    break;
                default:
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
            }
        }
        catch (error) {
            console.error('❌ HTTP request error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }
    async generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.name} - Performance Dashboard</title>
    <style>
        ${this.getDashboardCSS()}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="${this.config.visualization.colorScheme}">
    <div id="dashboard-container">
        <header class="dashboard-header">
            <h1>🎯 ${this.config.name}</h1>
            <div class="dashboard-status">
                <span class="status-indicator" id="connection-status">🟢 Connected</span>
                <span class="timestamp" id="last-update">Loading...</span>
            </div>
        </header>

        <div class="dashboard-alerts" id="alert-container" style="display: none;">
            <!-- Alerts will be populated here -->
        </div>

        <div class="dashboard-grid" id="charts-container">
            ${this.generateChartsHTML()}
        </div>

        <div class="dashboard-footer">
            <div class="metrics-summary" id="metrics-summary">
                <!-- Summary metrics -->
            </div>
            <div class="dashboard-controls">
                <button onclick="exportData()">📊 Export Data</button>
                <button onclick="toggleHistorical()">📈 Historical</button>
                <button onclick="resetCharts()">🔄 Reset</button>
            </div>
        </div>
    </div>

    <script>
        ${this.getDashboardJavaScript()}
    </script>
</body>
</html>`;
    }
    getDashboardCSS() {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }
        
        .light {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --text-primary: #333333;
            --text-secondary: #666666;
            --border-color: #e0e0e0;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --error-color: #dc3545;
        }
        
        .dark {
            --bg-primary: #1a1a1a;
            --bg-secondary: #2a2a2a;
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --border-color: #444444;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --error-color: #dc3545;
        }
        
        .dashboard-header {
            background: var(--bg-secondary);
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .dashboard-header h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .dashboard-status {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .status-indicator {
            font-size: 0.9rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            background: var(--bg-primary);
        }
        
        .dashboard-alerts {
            background: var(--error-color);
            color: white;
            padding: 0.5rem 2rem;
            margin-bottom: 1rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1rem;
            padding: 2rem;
            min-height: calc(100vh - 200px);
        }
        
        .chart-container {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            padding: 1rem;
            display: flex;
            flex-direction: column;
        }
        
        .chart-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        
        .chart-canvas {
            flex: 1;
            min-height: 200px;
        }
        
        .dashboard-footer {
            background: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .metrics-summary {
            display: flex;
            gap: 2rem;
        }
        
        .metric-item {
            text-align: center;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--success-color);
        }
        
        .metric-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
        
        .dashboard-controls {
            display: flex;
            gap: 0.5rem;
        }
        
        button {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        button:hover {
            background: var(--border-color);
        }
        
        .alert-item {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 0.25rem;
            padding: 0.5rem 1rem;
            margin: 0.25rem 0;
        }
    `;
    }
    generateChartsHTML() {
        return this.config.visualization.charts.map(chart => `
        <div class="chart-container" 
             style="grid-column: span ${chart.position.width}; grid-row: span ${chart.position.height};">
            <div class="chart-title">${chart.title}</div>
            <canvas class="chart-canvas" id="chart-${chart.id}"></canvas>
        </div>
    `).join('');
    }
    getDashboardJavaScript() {
        return `
        let socket;
        let charts = {};
        let historicalMode = false;
        
        function initializeDashboard() {
            // Connect WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(protocol + '//' + window.location.host);
            
            socket.onopen = () => {
                document.getElementById('connection-status').innerHTML = '🟢 Connected';
            };
            
            socket.onclose = () => {
                document.getElementById('connection-status').innerHTML = '🔴 Disconnected';
            };
            
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleDashboardUpdate(data);
            };
            
            // Initialize charts
            initializeCharts();
        }
        
        function initializeCharts() {
            ${this.generateChartInitializationJS()}
        }
        
        function handleDashboardUpdate(data) {
            if (data.type === 'metrics') {
                updateMetrics(data.metrics);
            } else if (data.type === 'alerts') {
                updateAlerts(data.alerts);
            }
            
            document.getElementById('last-update').textContent = 
                'Last update: ' + new Date().toLocaleTimeString();
        }
        
        function updateMetrics(metrics) {
            // Update charts with new data
            Object.keys(charts).forEach(chartId => {
                const chart = charts[chartId];
                const chartConfig = ${JSON.stringify(this.config.visualization.charts)}.find(c => c.id === chartId);
                
                if (chartConfig && metrics) {
                    updateChart(chart, chartConfig, metrics);
                }
            });
            
            // Update summary metrics
            updateMetricsSummary(metrics);
        }
        
        function updateChart(chart, config, metrics) {
            // Implementation for chart updates
            const now = new Date();
            
            config.metrics.forEach(metricName => {
                if (metrics[metricName] !== undefined) {
                    const dataset = chart.data.datasets.find(d => d.label === metricName);
                    if (dataset) {
                        dataset.data.push({
                            x: now,
                            y: metrics[metricName]
                        });
                        
                        // Keep only recent data points
                        if (dataset.data.length > ${this.config.visualization.maxDataPoints}) {
                            dataset.data.shift();
                        }
                    }
                }
            });
            
            chart.update('none');
        }
        
        function updateAlerts(alerts) {
            const container = document.getElementById('alert-container');
            
            if (alerts.length > 0) {
                container.style.display = 'block';
                container.innerHTML = '<h4>🚨 Active Alerts</h4>' +
                    alerts.map(alert => 
                        '<div class="alert-item">' + 
                        '<strong>' + alert.severity + '</strong>: ' + alert.message +
                        '</div>'
                    ).join('');
            } else {
                container.style.display = 'none';
            }
        }
        
        function updateMetricsSummary(metrics) {
            // Implementation for metrics summary update
            const summary = document.getElementById('metrics-summary');
            // Update summary display
        }
        
        function exportData() {
            window.open('/api/export', '_blank');
        }
        
        function toggleHistorical() {
            historicalMode = !historicalMode;
            // Implement historical data toggle
        }
        
        function resetCharts() {
            Object.values(charts).forEach(chart => {
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            });
        }
        
        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    `;
    }
    generateChartInitializationJS() {
        return this.config.visualization.charts.map(chart => `
        charts['${chart.id}'] = new Chart(document.getElementById('chart-${chart.id}'), {
            type: '${chart.type}',
            data: {
                datasets: ${JSON.stringify(chart.metrics.map(metric => ({
            label: metric,
            data: [],
            borderColor: this.getChartColor(metric),
            backgroundColor: this.getChartColor(metric, 0.2),
            tension: 0.1
        })))}
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                second: 'HH:mm:ss'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                animation: false
            }
        });
    `).join('\n');
    }
    getChartColor(metric, alpha = 1) {
        const colors = {
            'response_time': `rgba(75, 192, 192, ${alpha})`,
            'throughput': `rgba(255, 99, 132, ${alpha})`,
            'error_rate': `rgba(255, 205, 86, ${alpha})`,
            'memory_usage': `rgba(54, 162, 235, ${alpha})`,
            'cpu_utilization': `rgba(153, 102, 255, ${alpha})`
        };
        return colors[metric] || `rgba(128, 128, 128, ${alpha})`;
    }
    async sendInitialDashboardState(ws) {
        const initialState = {
            type: 'initial',
            metrics: await this.getCurrentMetrics(),
            alerts: this.alertManager.getActiveAlerts(),
            config: {
                charts: this.config.visualization.charts,
                refreshInterval: this.config.refreshInterval
            }
        };
        ws.send(JSON.stringify(initialState));
    }
    handleClientMessage(ws, message) {
        switch (message.type) {
            case 'request_historical':
                this.sendHistoricalData(ws, message.params);
                break;
            case 'subscribe_metric':
                // Implementation for metric subscription
                break;
            default:
                console.warn('Unknown client message type:', message.type);
        }
    }
    async sendHistoricalData(ws, params) {
        const historicalData = await this.dataStore.getHistoricalData(params);
        ws.send(JSON.stringify({
            type: 'historical',
            data: historicalData
        }));
    }
    async getCurrentMetrics() {
        return this.metricsCollector.getCurrentMetrics();
    }
    async handleDataExport(req, res) {
        const exportData = await this.dataStore.exportData();
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="performance-data-${Date.now()}.json"`
        });
        res.end(JSON.stringify(exportData, null, 2));
    }
    setupEventHandlers() {
        this.metricsCollector.on('metrics-collected', (metrics) => {
            this.dataStore.storeMetrics(metrics);
            this.alertManager.checkThresholds(metrics);
            this.broadcastToClients({
                type: 'metrics',
                metrics,
                timestamp: Date.now()
            });
        });
        this.alertManager.on('alert-triggered', (alert) => {
            this.broadcastToClients({
                type: 'alert',
                alert,
                timestamp: Date.now()
            });
        });
    }
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
    // Public methods for integration
    reportMetric(name, value, timestamp = Date.now()) {
        this.metricsCollector.recordMetric(name, value, timestamp);
    }
    triggerAlert(severity, message) {
        this.alertManager.triggerAlert(severity, message);
    }
    getActiveClients() {
        return this.clients.size;
    }
}
exports.PerformanceDashboard = PerformanceDashboard;
// ============================================================================
// Supporting Classes
// ============================================================================
class DashboardDataStore {
    constructor(config) {
        this.config = config;
        this.metricsBuffer = new Map();
    }
    storeMetrics(metrics) {
        const timestamp = Date.now();
        Object.entries(metrics).forEach(([name, value]) => {
            if (!this.metricsBuffer.has(name)) {
                this.metricsBuffer.set(name, []);
            }
            const dataPoints = this.metricsBuffer.get(name);
            dataPoints.push({ timestamp, value: value });
            // Remove old data points
            const cutoff = timestamp - this.config.retentionPeriod;
            const validIndex = dataPoints.findIndex(dp => dp.timestamp >= cutoff);
            if (validIndex > 0) {
                dataPoints.splice(0, validIndex);
            }
        });
    }
    async getHistoricalData(params) {
        // Implementation for historical data retrieval
        return {};
    }
    async exportData() {
        return Object.fromEntries(this.metricsBuffer);
    }
}
class MetricsCollector extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.interval = null;
        this.currentMetrics = {};
    }
    async start() {
        this.interval = setInterval(() => {
            this.collectMetrics();
        }, this.config.refreshInterval);
    }
    async stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    async collectMetrics() {
        // Collect system metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        this.currentMetrics = {
            memory_usage: memUsage.heapUsed,
            memory_total: memUsage.heapTotal,
            cpu_user: cpuUsage.user,
            cpu_system: cpuUsage.system,
            timestamp: Date.now(),
            // Add more metrics as needed
        };
        this.emit('metrics-collected', this.currentMetrics);
    }
    recordMetric(name, value, timestamp) {
        this.currentMetrics[name] = value;
    }
    getCurrentMetrics() {
        return { ...this.currentMetrics };
    }
}
class AlertManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.activeAlerts = new Map();
        this.lastAlertTimes = new Map();
    }
    checkThresholds(metrics) {
        if (!this.config.enabled)
            return;
        Object.entries(this.config.thresholds).forEach(([metricName, thresholds]) => {
            const value = metrics[metricName];
            if (value === undefined)
                return;
            const alertKey = `${metricName}_threshold`;
            const lastAlertTime = this.lastAlertTimes.get(alertKey) || 0;
            const now = Date.now();
            if (now - lastAlertTime < this.config.cooldownPeriod) {
                return; // Still in cooldown
            }
            let severity = null;
            if (value >= thresholds.critical) {
                severity = 'critical';
            }
            else if (value >= thresholds.warning) {
                severity = 'warning';
            }
            if (severity) {
                this.triggerAlert(severity, `${metricName} threshold exceeded: ${value}`);
                this.lastAlertTimes.set(alertKey, now);
            }
        });
    }
    triggerAlert(severity, message) {
        const alertId = `${severity}_${Date.now()}`;
        const alert = {
            id: alertId,
            severity,
            message,
            timestamp: Date.now(),
            acknowledged: false
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert-triggered', alert);
        // Auto-acknowledge after some time for warnings
        if (severity === 'warning') {
            setTimeout(() => {
                this.acknowledgeAlert(alertId);
            }, 60000); // 1 minute
        }
    }
    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            this.activeAlerts.delete(alertId);
            this.emit('alert-acknowledged', alert);
        }
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
function createPerformanceDashboard(config) {
    const defaultConfig = {
        name: 'jaqEdu Performance Dashboard',
        port: 3000,
        refreshInterval: 1000, // 1 second
        dataRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
        alerting: {
            enabled: true,
            thresholds: {
                responseTime: { warning: 1000, critical: 5000 },
                errorRate: { warning: 0.05, critical: 0.1 },
                memoryUsage: { warning: 1024 * 1024 * 1024, critical: 2048 * 1024 * 1024 },
                cpuUsage: { warning: 0.8, critical: 0.95 },
                throughput: { warning: 100, critical: 50 }
            },
            channels: ['console'],
            cooldownPeriod: 300000 // 5 minutes
        },
        visualization: {
            charts: [
                {
                    id: 'response-time',
                    type: 'line',
                    title: 'Response Time (ms)',
                    metrics: ['response_time'],
                    refreshRate: 1000,
                    position: { row: 1, col: 1, width: 6, height: 2 }
                },
                {
                    id: 'throughput',
                    type: 'line',
                    title: 'Throughput (req/s)',
                    metrics: ['throughput'],
                    refreshRate: 1000,
                    position: { row: 1, col: 7, width: 6, height: 2 }
                },
                {
                    id: 'system-metrics',
                    type: 'line',
                    title: 'System Metrics',
                    metrics: ['memory_usage', 'cpu_utilization'],
                    refreshRate: 1000,
                    position: { row: 3, col: 1, width: 12, height: 2 }
                }
            ],
            realTimeUpdates: true,
            historicalData: true,
            maxDataPoints: 100,
            colorScheme: 'dark'
        },
        metrics: {
            performance: [
                { id: 'response_time', name: 'Response Time', unit: 'ms', aggregation: 'avg', threshold: { warning: 1000, critical: 5000 } },
                { id: 'throughput', name: 'Throughput', unit: 'req/s', aggregation: 'avg', threshold: { warning: 100, critical: 50 } },
                { id: 'error_rate', name: 'Error Rate', unit: '%', aggregation: 'avg', threshold: { warning: 5, critical: 10 } }
            ],
            system: [],
            custom: []
        },
        export: {
            formats: ['json', 'csv'],
            includeCharts: false,
            includeAlerts: true
        }
    };
    return new PerformanceDashboard({ ...defaultConfig, ...config });
}
//# sourceMappingURL=performance-dashboard.js.map