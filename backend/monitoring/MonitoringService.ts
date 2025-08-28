import { EventEmitter } from 'events';
import { MonitoringConfig } from './types';
import { MetricsCollector } from './MetricsCollector';
import { TracingService } from './TracingService';
import { HealthChecker } from './HealthChecker';
import { AlertManager } from './AlertManager';
import { DashboardAggregator } from './DashboardAggregator';
import { Logger } from './Logger';

export class MonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private metricsCollector: MetricsCollector;
  private tracingService: TracingService;
  private healthChecker: HealthChecker;
  private alertManager: AlertManager;
  private dashboardAggregator: DashboardAggregator;
  private logger: Logger;
  
  private initialized: boolean = false;
  private server?: any; // HTTP server for endpoints

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;

    // Initialize logger first
    this.logger = new Logger({
      ...config.logging,
      serviceName: 'monitoring-service',
    });

    // Initialize components
    this.metricsCollector = new MetricsCollector(config.prometheus);
    this.tracingService = new TracingService(config.tracing);
    this.healthChecker = new HealthChecker(config.health);
    this.alertManager = new AlertManager(config.alerts);
    this.dashboardAggregator = new DashboardAggregator();

    this.setupIntegrations();
    this.setupEventListeners();
  }

  // Setup integrations between components
  private setupIntegrations(): void {
    // Connect dashboard aggregator with other services
    this.dashboardAggregator.setMetricsCollector(this.metricsCollector);
    this.dashboardAggregator.setHealthChecker(this.healthChecker);

    // Connect alert manager with metrics collector
    this.metricsCollector.on('metric_recorded', (event) => {
      if (event.type === 'system_metrics') {
        this.alertManager.evaluateMetric('error_rate', event.metrics.error_rate);
        this.alertManager.evaluateMetric('memory_usage', event.metrics.memory_usage);
        this.alertManager.evaluateMetric('cpu_usage', event.metrics.cpu_usage);
      }
    });

    // Connect alert manager with metrics for performance alerts
    this.metricsCollector.on('metric_recorded', (event) => {
      if (event.type === 'http_request') {
        this.alertManager.evaluateMetric('response_time_p95', event.duration);
      }
    });

    // Register health checks for all components
    this.healthChecker.registerCheck('metrics_collector', async () => {
      const status = this.metricsCollector.getHealthStatus();
      return {
        name: 'metrics_collector',
        status: status.status === 'healthy' ? 'pass' : 'fail',
        message: status.message,
        duration: 0,
        tags: ['monitoring', 'metrics'],
      };
    });

    this.healthChecker.registerCheck('tracing_service', async () => {
      const status = this.tracingService.getHealthStatus();
      return {
        name: 'tracing_service',
        status: status.status === 'healthy' ? 'pass' : 'fail',
        message: status.message,
        duration: 0,
        tags: ['monitoring', 'tracing'],
      };
    });

    this.healthChecker.registerCheck('alert_manager', async () => {
      const status = this.alertManager.getHealthStatus();
      return {
        name: 'alert_manager',
        status: status.status === 'healthy' ? 'pass' : 'fail',
        message: status.message,
        duration: 0,
        tags: ['monitoring', 'alerts'],
      };
    });

    this.healthChecker.registerCheck('dashboard_aggregator', async () => {
      const status = this.dashboardAggregator.getHealthStatus();
      return {
        name: 'dashboard_aggregator',
        status: status.status === 'healthy' ? 'pass' : 'fail',
        message: status.message,
        duration: 0,
        tags: ['monitoring', 'dashboard'],
      };
    });

    this.healthChecker.registerCheck('logger', async () => {
      const status = this.logger.getHealthStatus();
      return {
        name: 'logger',
        status: status.status === 'healthy' ? 'pass' : 'fail',
        message: status.message,
        duration: 0,
        tags: ['monitoring', 'logging'],
      };
    });
  }

  // Setup event listeners for cross-component communication
  private setupEventListeners(): void {
    // Log all alerts
    this.alertManager.on('alert_fired', (alert) => {
      this.logger.warn(`Alert fired: ${alert.name}`, {
        alert: {
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          labels: alert.labels,
        },
      });
    });

    this.alertManager.on('alert_resolved', (alert) => {
      this.logger.info(`Alert resolved: ${alert.name}`, {
        alert: {
          id: alert.id,
          duration: alert.endsAt && alert.startsAt 
            ? alert.endsAt.getTime() - alert.startsAt.getTime()
            : 0,
        },
      });
    });

    // Log health check failures
    this.healthChecker.on('check_failed', ({ name, error }) => {
      this.logger.error(`Health check failed: ${name}`, error, {
        health_check: { name },
      });
    });

    // Log tracing errors
    this.tracingService.on('span_export_error', ({ span, error }) => {
      this.logger.error(`Failed to export span: ${span.operationName}`, error, {
        tracing: {
          trace_id: span.traceId,
          span_id: span.spanId,
          operation: span.operationName,
        },
      });
    });

    // Log metrics collector errors
    this.metricsCollector.on('error_recorded', ({ errorType, severity }) => {
      this.logger.error(`Application error recorded: ${errorType}`, undefined, {
        metrics: { error_type: errorType, severity },
      });
    });
  }

  // Initialize monitoring service
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing monitoring service...');

    try {
      // Start HTTP server for endpoints if needed
      if (this.config.prometheus.enabled || this.config.health.enabled) {
        await this.startServer();
      }

      this.initialized = true;
      this.logger.info('Monitoring service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring service', error);
      throw error;
    }
  }

  // Start HTTP server for monitoring endpoints
  private async startServer(): Promise<void> {
    const express = require('express');
    const app = express();

    // Metrics endpoint
    if (this.config.prometheus.enabled) {
      app.get(this.config.prometheus.path || '/metrics', async (req: any, res: any) => {
        try {
          const metrics = await this.metricsCollector.getMetrics();
          res.set('Content-Type', 'text/plain');
          res.send(metrics);
        } catch (error) {
          this.logger.error('Error serving metrics', error);
          res.status(500).send('Error retrieving metrics');
        }
      });
    }

    // Health check endpoints
    if (this.config.health.enabled) {
      app.get(this.config.health.endpoint || '/health', 
        this.healthChecker.getHealthEndpointMiddleware()
      );
      
      app.get('/health/ready', this.healthChecker.getReadinessCheck());
      app.get('/health/live', this.healthChecker.getLivenessCheck());
    }

    // Dashboard data endpoint
    app.get('/api/dashboard/current', (req: any, res: any) => {
      try {
        const data = this.dashboardAggregator.getCurrentDashboardData();
        res.json(data);
      } catch (error) {
        this.logger.error('Error serving dashboard data', error);
        res.status(500).json({ error: 'Error retrieving dashboard data' });
      }
    });

    // Historical data endpoint
    app.get('/api/dashboard/history/:type', (req: any, res: any) => {
      try {
        const { type } = req.params;
        const { limit, from, to } = req.query;
        
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;
        
        const data = this.dashboardAggregator.getHistoricalData(
          type, 
          limitNumber, 
          fromDate, 
          toDate
        );
        
        res.json(data);
      } catch (error) {
        this.logger.error('Error serving historical data', error);
        res.status(500).json({ error: 'Error retrieving historical data' });
      }
    });

    // Statistics endpoint
    app.get('/api/dashboard/stats/:type', (req: any, res: any) => {
      try {
        const { type } = req.params;
        const { from, to } = req.query;
        
        const timeRange = from && to ? {
          from: new Date(from),
          to: new Date(to),
        } : undefined;
        
        const stats = this.dashboardAggregator.getStatistics(type, timeRange);
        res.json(stats);
      } catch (error) {
        this.logger.error('Error serving statistics', error);
        res.status(500).json({ error: 'Error retrieving statistics' });
      }
    });

    // Alerts endpoint
    app.get('/api/alerts', (req: any, res: any) => {
      try {
        const activeAlerts = this.alertManager.getActiveAlerts();
        const alertStats = this.alertManager.getAlertStats();
        
        res.json({
          active: activeAlerts,
          stats: alertStats,
        });
      } catch (error) {
        this.logger.error('Error serving alerts data', error);
        res.status(500).json({ error: 'Error retrieving alerts' });
      }
    });

    // Trace search endpoint
    app.get('/api/traces/:traceId', (req: any, res: any) => {
      try {
        const { traceId } = req.params;
        const spans = this.tracingService.getTraceSpans(traceId);
        res.json(spans);
      } catch (error) {
        this.logger.error('Error serving trace data', error);
        res.status(500).json({ error: 'Error retrieving trace' });
      }
    });

    // Start server
    const port = this.config.prometheus.port || 3001;
    this.server = app.listen(port, () => {
      this.logger.info(`Monitoring server started on port ${port}`);
    });
  }

  // Get middleware for Express applications
  getMiddleware() {
    return {
      // Metrics middleware
      metrics: this.metricsCollector.getHttpMetricsMiddleware(),
      
      // Tracing middleware
      tracing: this.tracingService.getTracingMiddleware(),
      
      // Logging middleware
      logging: this.logger.getMiddleware(),
      
      // Combined middleware
      combined: (req: any, res: any, next: any) => {
        // Apply all middleware in sequence
        this.metricsCollector.getHttpMetricsMiddleware()(req, res, (err1?: any) => {
          if (err1) return next(err1);
          
          this.tracingService.getTracingMiddleware()(req, res, (err2?: any) => {
            if (err2) return next(err2);
            
            this.logger.getMiddleware()(req, res, next);
          });
        });
      },
    };
  }

  // Workflow integration methods
  async traceWorkflow<T>(workflowName: string, workflowId: string, execution: () => Promise<T>): Promise<T> {
    return this.tracingService.traceWorkflowExecution(workflowName, workflowId, execution);
  }

  recordWorkflowMetric(workflowType: string, status: 'success' | 'failure' | 'timeout', duration: number): void {
    this.metricsCollector.recordWorkflowExecution(workflowType, status, duration);
  }

  logWorkflow(workflowId: string, event: string, status: string, metadata?: Record<string, any>): void {
    this.logger.logWorkflowEvent(workflowId, event, status, metadata);
  }

  // Database integration methods
  async traceDatabase<T>(operation: string, table: string, query: string, execution: () => Promise<T>): Promise<T> {
    return this.tracingService.traceDatabaseOperation(operation, table, query, execution);
  }

  logDatabase(operation: string, table: string, duration: number, rowsAffected?: number, error?: Error): void {
    this.logger.logDatabaseOperation(operation, table, duration, rowsAffected, error);
  }

  // Cache integration methods
  async traceCache<T>(operation: string, key: string, execution: () => Promise<T>): Promise<T> {
    return this.tracingService.traceCacheOperation(operation, key, execution);
  }

  recordCacheMetric(operation: 'hit' | 'miss' | 'set' | 'delete', result: 'success' | 'failure'): void {
    this.metricsCollector.recordCacheOperation(operation, result);
  }

  logCache(operation: string, key: string, hit: boolean, duration: number): void {
    this.logger.logCacheOperation(operation, key, hit, duration);
  }

  // User action tracking
  recordUserAction(actionType: string, userType: 'student' | 'teacher' | 'admin' | 'guest'): void {
    this.metricsCollector.recordUserAction(actionType, userType);
  }

  // Error tracking
  recordError(errorType: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.metricsCollector.recordError(errorType, severity);
  }

  // System metrics updates
  updateSystemMetrics(metrics: any): void {
    this.metricsCollector.updateSystemMetrics(metrics);
  }

  // Get comprehensive status
  async getStatus(): Promise<{
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
    metrics: any;
    traces: any;
    alerts: any;
    timestamp: Date;
  }> {
    const healthStatus = await this.healthChecker.runAllChecks();
    const alertStats = this.alertManager.getAlertStats();
    const traceStats = this.tracingService.getTraceStats();
    const dashboardData = this.dashboardAggregator.getCurrentDashboardData();

    return {
      service: 'jaqEdu Monitoring Service',
      status: healthStatus.status,
      components: {
        metrics_collector: this.metricsCollector.getHealthStatus(),
        tracing_service: this.tracingService.getHealthStatus(),
        health_checker: healthStatus,
        alert_manager: this.alertManager.getHealthStatus(),
        dashboard_aggregator: this.dashboardAggregator.getHealthStatus(),
        logger: this.logger.getHealthStatus(),
      },
      metrics: dashboardData.metrics,
      traces: traceStats,
      alerts: {
        active: this.alertManager.getActiveAlerts().length,
        stats: alertStats,
      },
      timestamp: new Date(),
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down monitoring service...');

    try {
      // Stop server if running
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => resolve());
        });
      }

      // Stop all components
      this.alertManager.destroy();
      this.healthChecker.destroy();
      this.tracingService.cleanup();
      this.dashboardAggregator.destroy();
      await this.logger.destroy();

      this.initialized = false;
      this.logger.info('Monitoring service shut down successfully');
      this.emit('shutdown');
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      throw error;
    }
  }
}