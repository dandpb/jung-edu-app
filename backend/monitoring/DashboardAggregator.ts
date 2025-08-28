import { EventEmitter } from 'events';
import { 
  DashboardData, 
  SystemMetrics, 
  WorkflowMetrics, 
  PerformanceMetrics, 
  BusinessMetrics,
  MonitoringConfig 
} from './types';
import { MetricsCollector } from './MetricsCollector';
import { HealthChecker } from './HealthChecker';

interface AggregationConfig {
  interval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  maxDataPoints: number;
}

interface DataPoint<T = any> {
  timestamp: Date;
  data: T;
}

export class DashboardAggregator extends EventEmitter {
  private config: AggregationConfig;
  private metricsCollector?: MetricsCollector;
  private healthChecker?: HealthChecker;
  
  // Data storage
  private systemMetricsHistory: DataPoint<SystemMetrics>[] = [];
  private workflowMetricsHistory: DataPoint<WorkflowMetrics>[] = [];
  private performanceMetricsHistory: DataPoint<PerformanceMetrics>[] = [];
  private businessMetricsHistory: DataPoint<BusinessMetrics>[] = [];
  private dashboardDataHistory: DataPoint<DashboardData>[] = [];

  // Aggregation intervals
  private aggregationInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Real-time metrics cache
  private currentSystemMetrics: SystemMetrics = {
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_io: 0,
    active_connections: 0,
    error_rate: 0,
  };

  private currentWorkflowMetrics: WorkflowMetrics = {
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    average_duration: 0,
    active_workflows: 0,
    queued_workflows: 0,
  };

  private currentPerformanceMetrics: PerformanceMetrics = {
    response_time_p50: 0,
    response_time_p95: 0,
    response_time_p99: 0,
    throughput: 0,
    error_count: 0,
    cache_hit_rate: 0,
  };

  private currentBusinessMetrics: BusinessMetrics = {
    active_users: 0,
    course_completions: 0,
    quiz_submissions: 0,
    user_engagement: 0,
    content_views: 0,
    learning_progress: 0,
  };

  constructor(config: Partial<AggregationConfig> = {}) {
    super();
    
    this.config = {
      interval: config.interval || 30000, // 30 seconds
      retentionPeriod: config.retentionPeriod || 86400000, // 24 hours
      maxDataPoints: config.maxDataPoints || 2880, // 24 hours at 30-second intervals
    };

    this.startAggregation();
    this.startCleanup();
  }

  // Set dependencies
  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
    this.setupMetricsListeners();
  }

  setHealthChecker(healthChecker: HealthChecker): void {
    this.healthChecker = healthChecker;
    this.setupHealthListeners();
  }

  // Setup listeners for metrics updates
  private setupMetricsListeners(): void {
    if (!this.metricsCollector) return;

    this.metricsCollector.on('metric_recorded', (event) => {
      this.handleMetricUpdate(event);
    });

    this.metricsCollector.on('system_metrics', (metrics: SystemMetrics) => {
      this.updateSystemMetrics(metrics);
    });
  }

  // Setup listeners for health updates
  private setupHealthListeners(): void {
    if (!this.healthChecker) return;

    this.healthChecker.on('health_check_completed', (health) => {
      this.handleHealthUpdate(health);
    });
  }

  // Handle metric updates
  private handleMetricUpdate(event: any): void {
    switch (event.type) {
      case 'http_request':
        this.updatePerformanceFromHttpRequest(event);
        break;
      case 'workflow_execution':
        this.updateWorkflowFromExecution(event);
        break;
      case 'system_metrics':
        this.updateSystemMetrics(event.metrics);
        break;
      case 'user_action':
        this.updateBusinessFromUserAction(event);
        break;
      case 'cache_operation':
        this.updatePerformanceFromCache(event);
        break;
    }
  }

  // Update system metrics
  updateSystemMetrics(metrics: SystemMetrics): void {
    this.currentSystemMetrics = { ...metrics };
    this.addDataPoint(this.systemMetricsHistory, metrics);
    this.emit('system_metrics_updated', metrics);
  }

  // Update workflow metrics from execution
  private updateWorkflowFromExecution(event: any): void {
    const { status, duration } = event;
    
    this.currentWorkflowMetrics.total_executions++;
    
    if (status === 'success') {
      this.currentWorkflowMetrics.successful_executions++;
    } else {
      this.currentWorkflowMetrics.failed_executions++;
    }

    // Update average duration (simple moving average)
    const totalSuccessful = this.currentWorkflowMetrics.successful_executions;
    if (totalSuccessful > 0) {
      this.currentWorkflowMetrics.average_duration = 
        (this.currentWorkflowMetrics.average_duration * (totalSuccessful - 1) + duration) / totalSuccessful;
    }

    this.addDataPoint(this.workflowMetricsHistory, { ...this.currentWorkflowMetrics });
    this.emit('workflow_metrics_updated', this.currentWorkflowMetrics);
  }

  // Update performance metrics from HTTP requests
  private updatePerformanceFromHttpRequest(event: any): void {
    const { statusCode, duration } = event;
    
    // Update error count
    if (statusCode >= 400) {
      this.currentPerformanceMetrics.error_count++;
    }

    // Update response times (simplified percentile calculation)
    this.updateResponseTimePercentiles(duration);
    
    // Update throughput (requests per second)
    this.updateThroughput();

    this.addDataPoint(this.performanceMetricsHistory, { ...this.currentPerformanceMetrics });
    this.emit('performance_metrics_updated', this.currentPerformanceMetrics);
  }

  // Update business metrics from user actions
  private updateBusinessFromUserAction(event: any): void {
    const { actionType, userType } = event;

    switch (actionType) {
      case 'course_completion':
        this.currentBusinessMetrics.course_completions++;
        break;
      case 'quiz_submission':
        this.currentBusinessMetrics.quiz_submissions++;
        break;
      case 'content_view':
        this.currentBusinessMetrics.content_views++;
        break;
      case 'user_login':
        if (userType !== 'guest') {
          this.currentBusinessMetrics.active_users++;
        }
        break;
      case 'learning_progress':
        this.currentBusinessMetrics.learning_progress++;
        break;
      default:
        this.currentBusinessMetrics.user_engagement++;
    }

    this.addDataPoint(this.businessMetricsHistory, { ...this.currentBusinessMetrics });
    this.emit('business_metrics_updated', this.currentBusinessMetrics);
  }

  // Update performance metrics from cache operations
  private updatePerformanceFromCache(event: any): void {
    const { operation, result } = event;
    
    if (operation === 'hit' || operation === 'miss') {
      // Calculate cache hit rate (simple moving average)
      const isHit = operation === 'hit';
      const currentRate = this.currentPerformanceMetrics.cache_hit_rate;
      
      // Simple exponential moving average with alpha = 0.1
      this.currentPerformanceMetrics.cache_hit_rate = 
        0.9 * currentRate + 0.1 * (isHit ? 1 : 0);
    }
  }

  // Update response time percentiles (simplified)
  private updateResponseTimePercentiles(duration: number): void {
    const current = this.currentPerformanceMetrics;
    const alpha = 0.1; // Smoothing factor

    // Exponential moving average for percentiles
    current.response_time_p50 = alpha * duration + (1 - alpha) * current.response_time_p50;
    current.response_time_p95 = alpha * Math.max(duration, current.response_time_p95) + 
                                (1 - alpha) * current.response_time_p95;
    current.response_time_p99 = alpha * Math.max(duration, current.response_time_p99) + 
                                (1 - alpha) * current.response_time_p99;
  }

  // Update throughput calculation
  private updateThroughput(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Count requests in the last second
    const recentRequests = this.performanceMetricsHistory
      .filter(point => point.timestamp.getTime() > oneSecondAgo)
      .length;
    
    this.currentPerformanceMetrics.throughput = recentRequests;
  }

  // Handle health updates
  private handleHealthUpdate(health: any): void {
    // Extract system metrics from health checks
    const systemCheck = health.checks.find((check: any) => check.name === 'memory');
    if (systemCheck && systemCheck.output?.memoryUsageMB) {
      this.currentSystemMetrics.memory_usage = systemCheck.output.memoryUsageMB / 1024; // Convert to percentage
    }

    // Update error rate from failed checks
    const failedChecks = health.checks.filter((check: any) => check.status === 'fail');
    this.currentSystemMetrics.error_rate = failedChecks.length / health.checks.length;
  }

  // Add data point with timestamp
  private addDataPoint<T>(history: DataPoint<T>[], data: T): void {
    const dataPoint: DataPoint<T> = {
      timestamp: new Date(),
      data: { ...data },
    };

    history.push(dataPoint);

    // Maintain max data points
    if (history.length > this.config.maxDataPoints) {
      history.shift();
    }
  }

  // Start aggregation process
  private startAggregation(): void {
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.interval);

    this.emit('aggregation_started', { interval: this.config.interval });
  }

  // Aggregate all metrics into dashboard data
  private aggregateMetrics(): void {
    const dashboardData: DashboardData = {
      timestamp: new Date(),
      metrics: {
        system: { ...this.currentSystemMetrics },
        workflow: { ...this.currentWorkflowMetrics },
        performance: { ...this.currentPerformanceMetrics },
        business: { ...this.currentBusinessMetrics },
      },
    };

    this.addDataPoint(this.dashboardDataHistory, dashboardData);
    this.emit('dashboard_data_aggregated', dashboardData);
  }

  // Start cleanup process
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Cleanup every 5 minutes

    this.emit('cleanup_started', { interval: 300000 });
  }

  // Cleanup old data points
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    const cleanupHistory = <T>(history: DataPoint<T>[]): number => {
      const initialLength = history.length;
      const filtered = history.filter(point => point.timestamp.getTime() > cutoff);
      history.length = 0;
      history.push(...filtered);
      return initialLength - filtered.length;
    };

    const cleaned = {
      system: cleanupHistory(this.systemMetricsHistory),
      workflow: cleanupHistory(this.workflowMetricsHistory),
      performance: cleanupHistory(this.performanceMetricsHistory),
      business: cleanupHistory(this.businessMetricsHistory),
      dashboard: cleanupHistory(this.dashboardDataHistory),
    };

    this.emit('cleanup_completed', {
      pointsCleaned: Object.values(cleaned).reduce((a, b) => a + b, 0),
      breakdown: cleaned,
    });
  }

  // Get current dashboard data
  getCurrentDashboardData(): DashboardData {
    return {
      timestamp: new Date(),
      metrics: {
        system: { ...this.currentSystemMetrics },
        workflow: { ...this.currentWorkflowMetrics },
        performance: { ...this.currentPerformanceMetrics },
        business: { ...this.currentBusinessMetrics },
      },
    };
  }

  // Get historical data
  getHistoricalData(
    type: 'system' | 'workflow' | 'performance' | 'business' | 'dashboard',
    limit?: number,
    fromTime?: Date,
    toTime?: Date
  ): DataPoint<any>[] {
    let history: DataPoint<any>[];

    switch (type) {
      case 'system':
        history = this.systemMetricsHistory;
        break;
      case 'workflow':
        history = this.workflowMetricsHistory;
        break;
      case 'performance':
        history = this.performanceMetricsHistory;
        break;
      case 'business':
        history = this.businessMetricsHistory;
        break;
      case 'dashboard':
        history = this.dashboardDataHistory;
        break;
      default:
        return [];
    }

    let filtered = history;

    // Filter by time range
    if (fromTime || toTime) {
      filtered = history.filter(point => {
        const time = point.timestamp.getTime();
        const afterFrom = !fromTime || time >= fromTime.getTime();
        const beforeTo = !toTime || time <= toTime.getTime();
        return afterFrom && beforeTo;
      });
    }

    // Apply limit
    if (limit && limit > 0) {
      filtered = filtered.slice(-limit);
    }

    return filtered.map(point => ({ ...point })); // Deep copy
  }

  // Get aggregated statistics
  getStatistics(
    type: 'system' | 'workflow' | 'performance' | 'business',
    timeRange?: { from: Date; to: Date }
  ): {
    min: any;
    max: any;
    avg: any;
    current: any;
    trend: 'up' | 'down' | 'stable';
  } {
    const history = this.getHistoricalData(type, undefined, timeRange?.from, timeRange?.to);
    
    if (history.length === 0) {
      return {
        min: {},
        max: {},
        avg: {},
        current: {},
        trend: 'stable',
      };
    }

    const data = history.map(point => point.data);
    const keys = Object.keys(data[0] || {});
    
    const stats = {
      min: {} as any,
      max: {} as any,
      avg: {} as any,
      current: data[data.length - 1] || {},
      trend: this.calculateTrend(data) as 'up' | 'down' | 'stable',
    };

    // Calculate min, max, avg for each metric
    keys.forEach(key => {
      const values = data.map(d => d[key]).filter(v => typeof v === 'number');
      
      if (values.length > 0) {
        stats.min[key] = Math.min(...values);
        stats.max[key] = Math.max(...values);
        stats.avg[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    return stats;
  }

  // Calculate trend direction
  private calculateTrend(data: any[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    const first = data[0];
    const last = data[data.length - 1];
    const keys = Object.keys(first || {});
    
    let upCount = 0;
    let downCount = 0;

    keys.forEach(key => {
      if (typeof first[key] === 'number' && typeof last[key] === 'number') {
        if (last[key] > first[key]) upCount++;
        else if (last[key] < first[key]) downCount++;
      }
    });

    if (upCount > downCount) return 'up';
    if (downCount > upCount) return 'down';
    return 'stable';
  }

  // Get real-time metrics summary
  getRealTimeMetrics(): {
    system: SystemMetrics;
    workflow: WorkflowMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
    timestamp: Date;
  } {
    return {
      system: { ...this.currentSystemMetrics },
      workflow: { ...this.currentWorkflowMetrics },
      performance: { ...this.currentPerformanceMetrics },
      business: { ...this.currentBusinessMetrics },
      timestamp: new Date(),
    };
  }

  // Export data for external systems
  exportData(format: 'json' | 'csv' = 'json', timeRange?: { from: Date; to: Date }): string {
    const data = this.getHistoricalData('dashboard', undefined, timeRange?.from, timeRange?.to);
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        if (data.length === 0) return '';
        
        const headers = ['timestamp'];
        const firstMetrics = data[0].data.metrics;
        
        // Build CSV headers
        Object.keys(firstMetrics).forEach(category => {
          Object.keys(firstMetrics[category]).forEach(metric => {
            headers.push(`${category}_${metric}`);
          });
        });
        
        // Build CSV rows
        const rows = data.map(point => {
          const row = [point.timestamp.toISOString()];
          
          Object.keys(point.data.metrics).forEach(category => {
            Object.values(point.data.metrics[category]).forEach(value => {
              row.push(String(value));
            });
          });
          
          return row.join(',');
        });
        
        return [headers.join(','), ...rows].join('\n');
      
      default:
        return JSON.stringify(data);
    }
  }

  // Health check for dashboard aggregator
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const totalDataPoints = 
        this.systemMetricsHistory.length +
        this.workflowMetricsHistory.length +
        this.performanceMetricsHistory.length +
        this.businessMetricsHistory.length +
        this.dashboardDataHistory.length;

      return {
        status: 'healthy',
        message: `Dashboard aggregator operational with ${totalDataPoints} data points`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Dashboard aggregator error: ${error}`,
      };
    }
  }

  // Cleanup and destroy
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear all data
    this.systemMetricsHistory.length = 0;
    this.workflowMetricsHistory.length = 0;
    this.performanceMetricsHistory.length = 0;
    this.businessMetricsHistory.length = 0;
    this.dashboardDataHistory.length = 0;

    this.removeAllListeners();
    this.emit('destroyed');
  }
}