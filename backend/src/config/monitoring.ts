/**
 * Monitoring and Alerting Configuration
 * Comprehensive monitoring, metrics collection, and alerting system
 * @fileoverview Configures monitoring infrastructure for jaqEdu platform
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Metric types enumeration
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Alert status states
 */
export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
  ACKNOWLEDGED = 'acknowledged'
}

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  PUSH = 'push',
  DISCORD = 'discord'
}

/**
 * Metric configuration schema
 */
const MetricConfigSchema = z.object({
  name: z.string().min(1, 'Metric name is required'),
  type: z.nativeEnum(MetricType),
  description: z.string().optional(),
  unit: z.string().optional(),
  labels: z.array(z.string()).default([]),
  buckets: z.array(z.number()).optional(), // For histograms
  percentiles: z.array(z.number()).optional(), // For summaries
  enabled: z.boolean().default(true),
});

/**
 * Threshold configuration schema
 */
const ThresholdConfigSchema = z.object({
  operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
  value: z.number(),
  duration: z.number().int().min(1).default(60), // seconds
  severity: z.nativeEnum(AlertSeverity).default(AlertSeverity.MEDIUM),
});

/**
 * Alert rule configuration schema
 */
const AlertRuleConfigSchema = z.object({
  id: z.string().min(1, 'Alert rule ID is required'),
  name: z.string().min(1, 'Alert rule name is required'),
  description: z.string().optional(),
  metric: z.string().min(1, 'Metric name is required'),
  query: z.string().optional(), // Advanced query for complex conditions
  labels: z.record(z.string()).optional(),
  thresholds: z.array(ThresholdConfigSchema).min(1),
  enabled: z.boolean().default(true),
  cooldownPeriod: z.number().int().min(0).default(300), // seconds
  maxAlerts: z.number().int().min(1).default(10),
  groupBy: z.array(z.string()).default([]),
  annotations: z.record(z.string()).optional(),
});

/**
 * Notification channel configuration schema
 */
const NotificationChannelConfigSchema = z.object({
  id: z.string().min(1, 'Channel ID is required'),
  name: z.string().min(1, 'Channel name is required'),
  type: z.nativeEnum(NotificationChannel),
  enabled: z.boolean().default(true),
  config: z.object({
    // Email configuration
    recipients: z.array(z.string().email()).optional(),
    subject: z.string().optional(),
    template: z.string().optional(),
    
    // Slack configuration
    webhookUrl: z.string().url().optional(),
    channel: z.string().optional(),
    username: z.string().optional(),
    
    // Webhook configuration
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT']).optional(),
    headers: z.record(z.string()).optional(),
    
    // SMS configuration
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    phoneNumbers: z.array(z.string()).optional(),
    
    // Discord configuration
    botToken: z.string().optional(),
    channelId: z.string().optional(),
  }).optional(),
  filters: z.object({
    severities: z.array(z.nativeEnum(AlertSeverity)).optional(),
    metrics: z.array(z.string()).optional(),
    labels: z.record(z.string()).optional(),
  }).optional(),
});

/**
 * Dashboard configuration schema
 */
const DashboardConfigSchema = z.object({
  id: z.string().min(1, 'Dashboard ID is required'),
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  panels: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(['graph', 'stat', 'table', 'heatmap', 'gauge']),
    metrics: z.array(z.string()).min(1),
    position: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      width: z.number().int().min(1).max(24),
      height: z.number().int().min(1).max(12),
    }),
    options: z.record(z.any()).optional(),
  })).default([]),
  refreshInterval: z.number().int().min(5).default(30), // seconds
  timeRange: z.object({
    from: z.string().default('now-1h'),
    to: z.string().default('now'),
  }).default({}),
});

/**
 * Health check configuration schema
 */
const HealthCheckConfigSchema = z.object({
  name: z.string().min(1, 'Health check name is required'),
  type: z.enum(['http', 'tcp', 'database', 'custom']),
  interval: z.number().int().min(1).default(30), // seconds
  timeout: z.number().int().min(1).default(5), // seconds
  retries: z.number().int().min(0).default(3),
  enabled: z.boolean().default(true),
  config: z.object({
    // HTTP health check
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'HEAD']).optional(),
    headers: z.record(z.string()).optional(),
    expectedStatus: z.number().int().optional(),
    expectedBody: z.string().optional(),
    
    // TCP health check
    host: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    
    // Database health check
    connectionString: z.string().optional(),
    query: z.string().optional(),
    
    // Custom health check
    script: z.string().optional(),
    command: z.string().optional(),
  }).optional(),
  alerting: z.object({
    enabled: z.boolean().default(true),
    failureThreshold: z.number().int().min(1).default(3),
    recoveryThreshold: z.number().int().min(1).default(1),
    channels: z.array(z.string()).default([]),
  }).default({}),
});

/**
 * Main monitoring configuration schema
 */
const MonitoringConfigSchema = z.object({
  // General settings
  enabled: z.boolean().default(true),
  namespace: z.string().default('jaqedu'),
  environment: z.string().default('development'),
  
  // Metrics collection
  metrics: z.object({
    enabled: z.boolean().default(true),
    collectInterval: z.number().int().min(1).default(15), // seconds
    retentionPeriod: z.number().int().min(1).default(7), // days
    batchSize: z.number().int().min(1).default(100),
    compression: z.boolean().default(true),
    definitions: z.array(MetricConfigSchema).default([]),
  }).default({}),
  
  // Alerting system
  alerting: z.object({
    enabled: z.boolean().default(true),
    evaluationInterval: z.number().int().min(1).default(15), // seconds
    maxConcurrentAlerts: z.number().int().min(1).default(100),
    defaultSeverity: z.nativeEnum(AlertSeverity).default(AlertSeverity.MEDIUM),
    rules: z.array(AlertRuleConfigSchema).default([]),
    channels: z.array(NotificationChannelConfigSchema).default([]),
    escalation: z.object({
      enabled: z.boolean().default(false),
      levels: z.array(z.object({
        duration: z.number().int().min(1), // seconds
        channels: z.array(z.string()),
        severity: z.nativeEnum(AlertSeverity),
      })).default([]),
    }).default({}),
  }).default({}),
  
  // Dashboards
  dashboards: z.array(DashboardConfigSchema).default([]),
  
  // Health checks
  healthChecks: z.array(HealthCheckConfigSchema).default([]),
  
  // Data sources
  dataSources: z.object({
    prometheus: z.object({
      enabled: z.boolean().default(false),
      url: z.string().url().optional(),
      basicAuth: z.object({
        username: z.string(),
        password: z.string(),
      }).optional(),
    }).optional(),
    
    grafana: z.object({
      enabled: z.boolean().default(false),
      url: z.string().url().optional(),
      apiKey: z.string().optional(),
    }).optional(),
    
    elasticsearch: z.object({
      enabled: z.boolean().default(false),
      nodes: z.array(z.string()).default([]),
      auth: z.object({
        username: z.string(),
        password: z.string(),
      }).optional(),
      index: z.string().default('jaqedu-metrics'),
    }).optional(),
  }).default({}),
  
  // Storage configuration
  storage: z.object({
    type: z.enum(['memory', 'file', 'database', 'external']).default('memory'),
    config: z.object({
      // File storage
      directory: z.string().optional(),
      maxFileSize: z.number().int().optional(),
      
      // Database storage
      table: z.string().optional(),
      connectionString: z.string().optional(),
      
      // External storage
      url: z.string().url().optional(),
      apiKey: z.string().optional(),
    }).optional(),
  }).default({}),
});

/**
 * Monitoring configuration type
 */
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type MetricConfig = z.infer<typeof MetricConfigSchema>;
export type AlertRuleConfig = z.infer<typeof AlertRuleConfigSchema>;
export type NotificationChannelConfig = z.infer<typeof NotificationChannelConfigSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: Partial<MonitoringConfig> = {
  enabled: true,
  namespace: 'jaqedu',
  environment: process.env.NODE_ENV || 'development',
  
  metrics: {
    enabled: true,
    collectInterval: 15,
    retentionPeriod: 7,
    batchSize: 100,
    compression: true,
    definitions: [
      {
        name: 'http_requests_total',
        type: MetricType.COUNTER,
        description: 'Total number of HTTP requests',
        labels: ['method', 'status', 'endpoint'],
      },
      {
        name: 'http_request_duration_seconds',
        type: MetricType.HISTOGRAM,
        description: 'HTTP request duration in seconds',
        unit: 'seconds',
        labels: ['method', 'status', 'endpoint'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      },
      {
        name: 'active_users',
        type: MetricType.GAUGE,
        description: 'Number of currently active users',
        unit: 'count',
      },
      {
        name: 'database_connections',
        type: MetricType.GAUGE,
        description: 'Number of active database connections',
        unit: 'count',
      },
      {
        name: 'memory_usage_bytes',
        type: MetricType.GAUGE,
        description: 'Memory usage in bytes',
        unit: 'bytes',
        labels: ['type'],
      },
      {
        name: 'cpu_usage_percent',
        type: MetricType.GAUGE,
        description: 'CPU usage percentage',
        unit: 'percent',
      },
      {
        name: 'quiz_completions_total',
        type: MetricType.COUNTER,
        description: 'Total number of quiz completions',
        labels: ['quiz_id', 'user_type'],
      },
      {
        name: 'module_views_total',
        type: MetricType.COUNTER,
        description: 'Total number of module views',
        labels: ['module_id', 'user_type'],
      },
    ],
  },
  
  alerting: {
    enabled: true,
    evaluationInterval: 15,
    maxConcurrentAlerts: 100,
    defaultSeverity: AlertSeverity.MEDIUM,
    rules: [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'HTTP error rate is above 5%',
        metric: 'http_requests_total',
        query: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
        thresholds: [
          {
            operator: '>',
            value: 5,
            duration: 60,
            severity: AlertSeverity.HIGH,
          },
          {
            operator: '>',
            value: 10,
            duration: 30,
            severity: AlertSeverity.CRITICAL,
          },
        ],
        cooldownPeriod: 300,
        enabled: true,
      },
      {
        id: 'high_response_time',
        name: 'High Response Time',
        description: 'HTTP response time is above normal',
        metric: 'http_request_duration_seconds',
        thresholds: [
          {
            operator: '>',
            value: 2,
            duration: 120,
            severity: AlertSeverity.MEDIUM,
          },
          {
            operator: '>',
            value: 5,
            duration: 60,
            severity: AlertSeverity.HIGH,
          },
        ],
        cooldownPeriod: 300,
        enabled: true,
      },
      {
        id: 'database_connection_limit',
        name: 'Database Connection Limit',
        description: 'Database connections approaching limit',
        metric: 'database_connections',
        thresholds: [
          {
            operator: '>',
            value: 80,
            duration: 60,
            severity: AlertSeverity.HIGH,
          },
        ],
        cooldownPeriod: 300,
        enabled: true,
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage is above 80%',
        metric: 'memory_usage_bytes',
        thresholds: [
          {
            operator: '>',
            value: 0.8,
            duration: 300,
            severity: AlertSeverity.MEDIUM,
          },
          {
            operator: '>',
            value: 0.9,
            duration: 120,
            severity: AlertSeverity.HIGH,
          },
        ],
        cooldownPeriod: 300,
        enabled: true,
      },
    ],
    channels: [
      {
        id: 'email_admins',
        name: 'Email Administrators',
        type: NotificationChannel.EMAIL,
        enabled: true,
        config: {
          recipients: ['admin@jaqedu.com'],
          subject: '[jaqEdu Alert] {{alertName}}',
          template: 'alert_email_template',
        },
        filters: {
          severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL],
        },
      },
      {
        id: 'slack_general',
        name: 'Slack General Channel',
        type: NotificationChannel.SLACK,
        enabled: false,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#general',
          username: 'jaqEdu Monitoring',
        },
      },
    ],
  },
  
  healthChecks: [
    {
      name: 'database',
      type: 'database',
      interval: 30,
      timeout: 5,
      retries: 3,
      config: {
        query: 'SELECT 1',
      },
      alerting: {
        enabled: true,
        failureThreshold: 3,
        channels: ['email_admins'],
      },
    },
    {
      name: 'api_health',
      type: 'http',
      interval: 60,
      timeout: 10,
      retries: 2,
      config: {
        url: '/health',
        method: 'GET',
        expectedStatus: 200,
      },
      alerting: {
        enabled: true,
        failureThreshold: 2,
        channels: ['email_admins'],
      },
    },
  ],
  
  dashboards: [
    {
      id: 'overview',
      name: 'System Overview',
      description: 'High-level system metrics and health indicators',
      tags: ['system', 'overview'],
      panels: [
        {
          id: 'request_rate',
          title: 'Request Rate',
          type: 'graph',
          metrics: ['http_requests_total'],
          position: { x: 0, y: 0, width: 12, height: 8 },
        },
        {
          id: 'response_time',
          title: 'Response Time',
          type: 'graph',
          metrics: ['http_request_duration_seconds'],
          position: { x: 12, y: 0, width: 12, height: 8 },
        },
        {
          id: 'active_users',
          title: 'Active Users',
          type: 'stat',
          metrics: ['active_users'],
          position: { x: 0, y: 8, width: 6, height: 4 },
        },
        {
          id: 'memory_usage',
          title: 'Memory Usage',
          type: 'gauge',
          metrics: ['memory_usage_bytes'],
          position: { x: 6, y: 8, width: 6, height: 4 },
        },
      ],
      refreshInterval: 30,
    },
    {
      id: 'educational',
      name: 'Educational Metrics',
      description: 'Learning and engagement metrics',
      tags: ['education', 'analytics'],
      panels: [
        {
          id: 'quiz_completions',
          title: 'Quiz Completions',
          type: 'graph',
          metrics: ['quiz_completions_total'],
          position: { x: 0, y: 0, width: 12, height: 8 },
        },
        {
          id: 'module_views',
          title: 'Module Views',
          type: 'graph',
          metrics: ['module_views_total'],
          position: { x: 12, y: 0, width: 12, height: 8 },
        },
      ],
      refreshInterval: 60,
    },
  ],
};

/**
 * Alert manager class
 */
export class AlertManager extends EventEmitter {
  private config: MonitoringConfig['alerting'];
  private activeAlerts: Map<string, any> = new Map();
  private suppressedAlerts: Set<string> = new Set();

  constructor(config: MonitoringConfig['alerting']) {
    super();
    this.config = config || defaultMonitoringConfig.alerting!;
  }

  /**
   * Evaluate alert rules
   */
  async evaluateRules(): Promise<void> {
    if (!this.config.enabled) return;

    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        this.emit('rule-evaluation-error', { rule, error });
      }
    }
  }

  /**
   * Evaluate single alert rule
   */
  private async evaluateRule(rule: AlertRuleConfig): Promise<void> {
    // This would integrate with your metrics system
    // For now, this is a placeholder implementation
    const metricValue = await this.getMetricValue(rule.metric, rule.labels);
    
    for (const threshold of rule.thresholds) {
      const alertId = `${rule.id}_${threshold.severity}`;
      const isTriggered = this.evaluateThreshold(metricValue, threshold);
      
      if (isTriggered && !this.activeAlerts.has(alertId)) {
        await this.triggerAlert(rule, threshold, metricValue);
      } else if (!isTriggered && this.activeAlerts.has(alertId)) {
        await this.resolveAlert(alertId);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    rule: AlertRuleConfig,
    threshold: z.infer<typeof ThresholdConfigSchema>,
    value: number
  ): Promise<void> {
    const alertId = `${rule.id}_${threshold.severity}`;
    const alert = {
      id: alertId,
      rule: rule.id,
      name: rule.name,
      description: rule.description,
      severity: threshold.severity,
      value,
      threshold: threshold.value,
      triggeredAt: new Date(),
      status: AlertStatus.ACTIVE,
    };

    this.activeAlerts.set(alertId, alert);
    this.emit('alert-triggered', alert);

    // Send notifications
    await this.sendNotifications(alert);
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    
    this.activeAlerts.delete(alertId);
    this.emit('alert-resolved', alert);

    // Send resolution notifications
    await this.sendNotifications(alert);
  }

  /**
   * Send alert notifications
   */
  private async sendNotifications(alert: any): Promise<void> {
    for (const channel of this.config.channels) {
      if (!channel.enabled) continue;
      
      // Apply filters
      if (channel.filters?.severities && 
          !channel.filters.severities.includes(alert.severity)) {
        continue;
      }

      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        this.emit('notification-error', { channel, alert, error });
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(
    channel: NotificationChannelConfig,
    alert: any
  ): Promise<void> {
    // This would integrate with your notification system
    // Implementation depends on the channel type
    console.log(`Sending ${channel.type} notification for alert ${alert.id}`);
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(
    value: number,
    threshold: z.infer<typeof ThresholdConfigSchema>
  ): boolean {
    switch (threshold.operator) {
      case '>': return value > threshold.value;
      case '<': return value < threshold.value;
      case '>=': return value >= threshold.value;
      case '<=': return value <= threshold.value;
      case '==': return value === threshold.value;
      case '!=': return value !== threshold.value;
      default: return false;
    }
  }

  /**
   * Get metric value (placeholder - integrate with your metrics system)
   */
  private async getMetricValue(metric: string, labels?: Record<string, string>): Promise<number> {
    // This would query your metrics system (Prometheus, etc.)
    return Math.random() * 100; // Placeholder
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): any[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      this.emit('alert-acknowledged', alert);
    }
  }

  /**
   * Suppress alert
   */
  suppressAlert(alertId: string, duration?: number): void {
    this.suppressedAlerts.add(alertId);
    if (duration) {
      setTimeout(() => {
        this.suppressedAlerts.delete(alertId);
      }, duration * 1000);
    }
  }
}

/**
 * Validate monitoring configuration
 */
export function validateMonitoringConfig(config: any): MonitoringConfig {
  return MonitoringConfigSchema.parse(config);
}

/**
 * Create monitoring configuration from environment
 */
export function createMonitoringConfig(): MonitoringConfig {
  const envConfig = {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    namespace: process.env.MONITORING_NAMESPACE || 'jaqedu',
    environment: process.env.NODE_ENV || 'development',
  };

  return MonitoringConfigSchema.parse({
    ...defaultMonitoringConfig,
    ...envConfig,
  });
}

export default createMonitoringConfig;