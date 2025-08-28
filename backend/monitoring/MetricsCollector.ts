import { register, Counter, Gauge, Histogram, Summary, collectDefaultMetrics } from 'prom-client';
import { EventEmitter } from 'events';
import { Metric, MonitoringConfig, SystemMetrics, WorkflowMetrics, PerformanceMetrics } from './types';

export class MetricsCollector extends EventEmitter {
  private config: MonitoringConfig['prometheus'];
  private counters: Map<string, Counter<string>> = new Map();
  private gauges: Map<string, Gauge<string>> = new Map();
  private histograms: Map<string, Histogram<string>> = new Map();
  private summaries: Map<string, Summary<string>> = new Map();

  // Predefined metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private activeConnections: Gauge<string>;
  private workflowExecutions: Counter<string>;
  private workflowDuration: Histogram<string>;
  private systemMetricsGauge: Gauge<string>;
  private errorTotal: Counter<string>;
  private cacheOperations: Counter<string>;
  private userActions: Counter<string>;

  constructor(config: MonitoringConfig['prometheus']) {
    super();
    this.config = config;

    if (config.collectDefaultMetrics) {
      collectDefaultMetrics({ prefix: config.prefix });
    }

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const prefix = this.config.prefix;

    // HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [register],
    });

    this.activeConnections = new Gauge({
      name: `${prefix}active_connections`,
      help: 'Number of active connections',
      registers: [register],
    });

    // Workflow metrics
    this.workflowExecutions = new Counter({
      name: `${prefix}workflow_executions_total`,
      help: 'Total number of workflow executions',
      labelNames: ['workflow_type', 'status'],
      registers: [register],
    });

    this.workflowDuration = new Histogram({
      name: `${prefix}workflow_duration_seconds`,
      help: 'Duration of workflow executions in seconds',
      labelNames: ['workflow_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600],
      registers: [register],
    });

    // System metrics
    this.systemMetricsGauge = new Gauge({
      name: `${prefix}system_metrics`,
      help: 'System metrics',
      labelNames: ['metric_type'],
      registers: [register],
    });

    // Error metrics
    this.errorTotal = new Counter({
      name: `${prefix}errors_total`,
      help: 'Total number of errors',
      labelNames: ['error_type', 'severity'],
      registers: [register],
    });

    // Cache metrics
    this.cacheOperations = new Counter({
      name: `${prefix}cache_operations_total`,
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
      registers: [register],
    });

    // User metrics
    this.userActions = new Counter({
      name: `${prefix}user_actions_total`,
      help: 'Total number of user actions',
      labelNames: ['action_type', 'user_type'],
      registers: [register],
    });
  }

  // HTTP request metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsTotal.inc({
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
    });

    this.httpRequestDuration.observe(
      { method: method.toUpperCase(), route },
      duration / 1000
    );

    this.emit('metric_recorded', {
      type: 'http_request',
      method,
      route,
      statusCode,
      duration,
    });
  }

  // Workflow metrics
  recordWorkflowExecution(workflowType: string, status: 'success' | 'failure' | 'timeout', duration: number): void {
    this.workflowExecutions.inc({
      workflow_type: workflowType,
      status,
    });

    this.workflowDuration.observe(
      { workflow_type: workflowType },
      duration / 1000
    );

    this.emit('metric_recorded', {
      type: 'workflow_execution',
      workflowType,
      status,
      duration,
    });
  }

  // System metrics
  updateSystemMetrics(metrics: SystemMetrics): void {
    this.systemMetricsGauge.set({ metric_type: 'cpu_usage' }, metrics.cpu_usage);
    this.systemMetricsGauge.set({ metric_type: 'memory_usage' }, metrics.memory_usage);
    this.systemMetricsGauge.set({ metric_type: 'disk_usage' }, metrics.disk_usage);
    this.systemMetricsGauge.set({ metric_type: 'network_io' }, metrics.network_io);
    this.systemMetricsGauge.set({ metric_type: 'error_rate' }, metrics.error_rate);
    
    this.activeConnections.set(metrics.active_connections);

    this.emit('metric_recorded', {
      type: 'system_metrics',
      metrics,
    });
  }

  // Error tracking
  recordError(errorType: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.errorTotal.inc({
      error_type: errorType,
      severity,
    });

    this.emit('error_recorded', { errorType, severity });
  }

  // Cache metrics
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', result: 'success' | 'failure'): void {
    this.cacheOperations.inc({
      operation,
      result,
    });

    this.emit('metric_recorded', {
      type: 'cache_operation',
      operation,
      result,
    });
  }

  // User action metrics
  recordUserAction(actionType: string, userType: 'student' | 'teacher' | 'admin' | 'guest'): void {
    this.userActions.inc({
      action_type: actionType,
      user_type: userType,
    });

    this.emit('metric_recorded', {
      type: 'user_action',
      actionType,
      userType,
    });
  }

  // Custom metric creation
  createCounter(name: string, help: string, labelNames?: string[]): Counter<string> {
    const fullName = `${this.config.prefix}${name}`;
    const counter = new Counter({
      name: fullName,
      help,
      labelNames,
      registers: [register],
    });
    
    this.counters.set(name, counter);
    return counter;
  }

  createGauge(name: string, help: string, labelNames?: string[]): Gauge<string> {
    const fullName = `${this.config.prefix}${name}`;
    const gauge = new Gauge({
      name: fullName,
      help,
      labelNames,
      registers: [register],
    });
    
    this.gauges.set(name, gauge);
    return gauge;
  }

  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string> {
    const fullName = `${this.config.prefix}${name}`;
    const histogram = new Histogram({
      name: fullName,
      help,
      labelNames,
      buckets: buckets || [0.1, 0.5, 1, 2, 5, 10],
      registers: [register],
    });
    
    this.histograms.set(name, histogram);
    return histogram;
  }

  // Generic metric recording
  recordMetric(metric: Metric): void {
    const { name, value, labels, type } = metric;

    switch (type) {
      case 'counter':
        const counter = this.counters.get(name);
        if (counter) {
          counter.inc(labels, value);
        }
        break;

      case 'gauge':
        const gauge = this.gauges.get(name);
        if (gauge) {
          gauge.set(labels, value);
        }
        break;

      case 'histogram':
        const histogram = this.histograms.get(name);
        if (histogram) {
          histogram.observe(labels, value);
        }
        break;

      case 'summary':
        const summary = this.summaries.get(name);
        if (summary) {
          summary.observe(labels, value);
        }
        break;
    }

    this.emit('metric_recorded', metric);
  }

  // Batch metric recording
  recordMetrics(metrics: Metric[]): void {
    metrics.forEach(metric => this.recordMetric(metric));
    this.emit('batch_metrics_recorded', metrics);
  }

  // Get metrics for Prometheus scraping
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Get metric registry
  getRegistry() {
    return register;
  }

  // Reset all metrics
  reset(): void {
    register.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    this.initializeMetrics();
  }

  // Performance monitoring helpers
  startTimer(name: string, labels?: Record<string, string>) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      return histogram.startTimer(labels);
    }
    
    // Fallback timer
    const startTime = Date.now();
    return () => {
      const duration = (Date.now() - startTime) / 1000;
      this.recordMetric({
        name,
        value: duration,
        labels,
        type: 'histogram',
        timestamp: new Date(),
      });
    };
  }

  // Middleware for automatic HTTP metrics
  getHttpMetricsMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.recordHttpRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration
        );
      });

      next();
    };
  }

  // Health check for metrics collector
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const metricsCount = this.counters.size + this.gauges.size + this.histograms.size + this.summaries.size;
      return {
        status: metricsCount > 0 ? 'healthy' : 'unhealthy',
        message: `Metrics collector operational with ${metricsCount} registered metrics`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Metrics collector error: ${error}`,
      };
    }
  }
}