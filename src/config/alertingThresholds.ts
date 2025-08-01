/**
 * Alerting Rules and Performance Thresholds Configuration
 * Defines system monitoring thresholds, alert rules, and notification settings
 */

// System Performance Thresholds
export interface SystemThresholds {
  cpu: {
    warning: number;    // 70%
    critical: number;   // 85%
    sustained: number;  // Duration in minutes
  };
  memory: {
    warning: number;    // 80%
    critical: number;   // 90%
    sustained: number;  // Duration in minutes
  };
  disk: {
    warning: number;    // 80%
    critical: number;   // 90%
    ioWait: number;     // I/O wait percentage
  };
  network: {
    latency: number;    // Response time in ms
    throughput: number; // MB/s
    errorRate: number;  // Percentage
  };
}

// Application Performance Thresholds
export interface ApplicationThresholds {
  pipeline: {
    errorRate: number;              // 10%
    averageProcessingTime: number;  // 5 minutes in ms
    qualityScore: number;           // 60%
    queueDepth: number;            // Maximum queued modules
  };
  api: {
    responseTime: number;          // 2 seconds in ms
    errorRate: number;            // 5%
    throughput: number;           // Requests per second
  };
  database: {
    connectionPool: number;       // 80% utilization
    queryTime: number;           // 1 second in ms
    deadlocks: number;           // Per hour
  };
  websocket: {
    connectionCount: number;      // Maximum connections
    messageLatency: number;       // ms
    dropRate: number;            // Percentage
  };
}

// Alert Severity Levels
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Alert Categories
export type AlertCategory = 
  | 'system'      // CPU, memory, disk, network
  | 'application' // Pipeline, API, database
  | 'security'    // Authentication, authorization
  | 'business'    // User experience, SLA
  | 'infrastructure'; // Service availability

// Default System Thresholds
export const DEFAULT_SYSTEM_THRESHOLDS: SystemThresholds = {
  cpu: {
    warning: 70,    // 70% CPU usage
    critical: 85,   // 85% CPU usage
    sustained: 5    // 5 minutes
  },
  memory: {
    warning: 80,    // 80% memory usage
    critical: 90,   // 90% memory usage
    sustained: 3    // 3 minutes
  },
  disk: {
    warning: 80,    // 80% disk usage
    critical: 90,   // 90% disk usage
    ioWait: 30      // 30% I/O wait
  },
  network: {
    latency: 500,   // 500ms response time
    throughput: 10, // 10 MB/s minimum
    errorRate: 5    // 5% error rate
  }
};

// Default Application Thresholds
export const DEFAULT_APPLICATION_THRESHOLDS: ApplicationThresholds = {
  pipeline: {
    errorRate: 0.1,              // 10%
    averageProcessingTime: 300000, // 5 minutes
    qualityScore: 0.6,           // 60%
    queueDepth: 50               // 50 modules
  },
  api: {
    responseTime: 2000,          // 2 seconds
    errorRate: 0.05,             // 5%
    throughput: 100              // 100 requests/second
  },
  database: {
    connectionPool: 0.8,         // 80% utilization
    queryTime: 1000,             // 1 second
    deadlocks: 5                 // 5 per hour
  },
  websocket: {
    connectionCount: 1000,       // 1000 connections
    messageLatency: 100,         // 100ms
    dropRate: 0.01              // 1%
  }
};

// Alert Rule Definition
export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  description: string;
  condition: string;          // SQL-like condition
  threshold: number | string;
  evaluationWindow: number;   // Minutes
  cooldownPeriod: number;     // Minutes before re-alerting
  enabled: boolean;
  tags: string[];
  notificationChannels: string[];
  runbook?: string;          // Link to incident response guide
}

// Comprehensive Alert Rules
export const ALERT_RULES: AlertRule[] = [
  // === SYSTEM ALERTS ===
  {
    id: 'sys-cpu-high',
    name: 'High CPU Usage',
    category: 'system',
    severity: 'high',
    description: 'CPU usage exceeds critical threshold',
    condition: 'avg(cpu_usage_percent) > threshold',
    threshold: 85,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['cpu', 'performance'],
    notificationChannels: ['email', 'webhook', 'in-app'],
    runbook: '/runbooks/high-cpu-usage'
  },
  {
    id: 'sys-cpu-warning',
    name: 'Elevated CPU Usage',
    category: 'system',
    severity: 'medium',
    description: 'CPU usage above warning threshold',
    condition: 'avg(cpu_usage_percent) > threshold',
    threshold: 70,
    evaluationWindow: 10,
    cooldownPeriod: 30,
    enabled: true,
    tags: ['cpu', 'performance'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/elevated-cpu-usage'
  },
  {
    id: 'sys-memory-critical',
    name: 'Critical Memory Usage',
    category: 'system',
    severity: 'critical',
    description: 'Memory usage critically high',
    condition: 'avg(memory_usage_percent) > threshold',
    threshold: 90,
    evaluationWindow: 3,
    cooldownPeriod: 10,
    enabled: true,
    tags: ['memory', 'critical'],
    notificationChannels: ['email', 'webhook', 'in-app', 'sms'],
    runbook: '/runbooks/critical-memory-usage'
  },
  {
    id: 'sys-disk-space',
    name: 'Low Disk Space',
    category: 'system',
    severity: 'high',
    description: 'Disk space running low',
    condition: 'min(disk_free_percent) < threshold',
    threshold: 20,
    evaluationWindow: 5,
    cooldownPeriod: 60,
    enabled: true,
    tags: ['disk', 'storage'],
    notificationChannels: ['email', 'webhook'],
    runbook: '/runbooks/low-disk-space'
  },
  {
    id: 'sys-io-wait',
    name: 'High I/O Wait',
    category: 'system',
    severity: 'medium',
    description: 'High I/O wait time detected',
    condition: 'avg(io_wait_percent) > threshold',
    threshold: 30,
    evaluationWindow: 10,
    cooldownPeriod: 20,
    enabled: true,
    tags: ['disk', 'io', 'performance'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/high-io-wait'
  },
  {
    id: 'sys-network-latency',
    name: 'High Network Latency',
    category: 'system',
    severity: 'medium',
    description: 'Network response time high',
    condition: 'avg(network_latency_ms) > threshold',
    threshold: 500,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['network', 'latency'],
    notificationChannels: ['in-app', 'webhook'],
    runbook: '/runbooks/high-network-latency'
  },

  // === APPLICATION ALERTS ===
  {
    id: 'app-pipeline-error-rate',
    name: 'High Pipeline Error Rate',
    category: 'application',
    severity: 'high',
    description: 'Pipeline error rate exceeds threshold',
    condition: 'avg(pipeline_error_rate) > threshold',
    threshold: 0.1,
    evaluationWindow: 10,
    cooldownPeriod: 30,
    enabled: true,
    tags: ['pipeline', 'errors'],
    notificationChannels: ['email', 'webhook', 'in-app'],
    runbook: '/runbooks/pipeline-errors'
  },
  {
    id: 'app-pipeline-slow',
    name: 'Slow Pipeline Processing',
    category: 'application',
    severity: 'medium',
    description: 'Pipeline processing time exceeds threshold',
    condition: 'avg(pipeline_processing_time_ms) > threshold',
    threshold: 300000,
    evaluationWindow: 15,
    cooldownPeriod: 30,
    enabled: true,
    tags: ['pipeline', 'performance'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/slow-pipeline'
  },
  {
    id: 'app-quality-degraded',
    name: 'Quality Score Degraded',
    category: 'application',
    severity: 'medium',
    description: 'Resource quality score below threshold',
    condition: 'avg(quality_score) < threshold',
    threshold: 0.6,
    evaluationWindow: 20,
    cooldownPeriod: 60,
    enabled: true,
    tags: ['quality', 'resources'],
    notificationChannels: ['email', 'in-app'],
    runbook: '/runbooks/quality-degradation'
  },
  {
    id: 'app-queue-depth',
    name: 'High Queue Depth',
    category: 'application',
    severity: 'medium',
    description: 'Pipeline queue depth exceeds threshold',
    condition: 'max(queue_depth) > threshold',
    threshold: 50,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['pipeline', 'queue'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/high-queue-depth'
  },
  {
    id: 'app-api-response-time',
    name: 'High API Response Time',
    category: 'application',
    severity: 'medium',
    description: 'API response time exceeds threshold',
    condition: 'avg(api_response_time_ms) > threshold',
    threshold: 2000,
    evaluationWindow: 5,
    cooldownPeriod: 10,
    enabled: true,
    tags: ['api', 'performance'],
    notificationChannels: ['in-app', 'webhook'],
    runbook: '/runbooks/slow-api'
  },
  {
    id: 'app-api-error-rate',
    name: 'High API Error Rate',
    category: 'application',
    severity: 'high',
    description: 'API error rate exceeds threshold',
    condition: 'avg(api_error_rate) > threshold',
    threshold: 0.05,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['api', 'errors'],
    notificationChannels: ['email', 'webhook', 'in-app'],
    runbook: '/runbooks/api-errors'
  },

  // === DATABASE ALERTS ===
  {
    id: 'db-connection-pool',
    name: 'High Database Connection Usage',
    category: 'application',
    severity: 'medium',
    description: 'Database connection pool utilization high',
    condition: 'avg(db_connection_usage) > threshold',
    threshold: 0.8,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['database', 'connections'],
    notificationChannels: ['in-app', 'webhook'],
    runbook: '/runbooks/db-connections'
  },
  {
    id: 'db-slow-queries',
    name: 'Slow Database Queries',
    category: 'application',
    severity: 'medium',
    description: 'Database queries taking too long',
    condition: 'avg(db_query_time_ms) > threshold',
    threshold: 1000,
    evaluationWindow: 10,
    cooldownPeriod: 20,
    enabled: true,
    tags: ['database', 'performance'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/slow-queries'
  },
  {
    id: 'db-deadlocks',
    name: 'Database Deadlocks',
    category: 'application',
    severity: 'medium',
    description: 'Database deadlocks detected',
    condition: 'count(db_deadlocks) > threshold',
    threshold: 5,
    evaluationWindow: 60,
    cooldownPeriod: 30,
    enabled: true,
    tags: ['database', 'deadlocks'],
    notificationChannels: ['email', 'in-app'],
    runbook: '/runbooks/db-deadlocks'
  },

  // === WEBSOCKET ALERTS ===
  {
    id: 'ws-connection-limit',
    name: 'WebSocket Connection Limit',
    category: 'application',
    severity: 'medium',
    description: 'WebSocket connections approaching limit',
    condition: 'max(websocket_connections) > threshold',
    threshold: 800,
    evaluationWindow: 5,
    cooldownPeriod: 15,
    enabled: true,
    tags: ['websocket', 'connections'],
    notificationChannels: ['in-app', 'webhook'],
    runbook: '/runbooks/websocket-limits'
  },
  {
    id: 'ws-message-latency',
    name: 'High WebSocket Latency',
    category: 'application',
    severity: 'low',
    description: 'WebSocket message latency high',
    condition: 'avg(websocket_latency_ms) > threshold',
    threshold: 100,
    evaluationWindow: 10,
    cooldownPeriod: 20,
    enabled: true,
    tags: ['websocket', 'latency'],
    notificationChannels: ['in-app'],
    runbook: '/runbooks/websocket-latency'
  },

  // === SECURITY ALERTS ===
  {
    id: 'sec-failed-logins',
    name: 'Multiple Failed Login Attempts',
    category: 'security',
    severity: 'high',
    description: 'Unusual number of failed login attempts',
    condition: 'count(failed_logins) > threshold',
    threshold: 10,
    evaluationWindow: 5,
    cooldownPeriod: 30,
    enabled: true,
    tags: ['security', 'authentication'],
    notificationChannels: ['email', 'webhook', 'in-app'],
    runbook: '/runbooks/failed-logins'
  },
  {
    id: 'sec-unusual-traffic',
    name: 'Unusual Traffic Pattern',
    category: 'security',
    severity: 'medium',
    description: 'Abnormal traffic patterns detected',
    condition: 'anomaly_detection(request_rate) > threshold',
    threshold: '3_sigma',
    evaluationWindow: 15,
    cooldownPeriod: 60,
    enabled: true,
    tags: ['security', 'traffic'],
    notificationChannels: ['email', 'in-app'],
    runbook: '/runbooks/unusual-traffic'
  },

  // === BUSINESS ALERTS ===
  {
    id: 'biz-user-satisfaction',
    name: 'Low User Satisfaction',
    category: 'business',
    severity: 'medium',
    description: 'User satisfaction metrics below threshold',
    condition: 'avg(user_satisfaction_score) < threshold',
    threshold: 7.0,
    evaluationWindow: 60,
    cooldownPeriod: 120,
    enabled: true,
    tags: ['business', 'satisfaction'],
    notificationChannels: ['email'],
    runbook: '/runbooks/user-satisfaction'
  },
  {
    id: 'biz-conversion-rate',
    name: 'Low Conversion Rate',
    category: 'business',
    severity: 'low',
    description: 'Conversion rate below expected threshold',
    condition: 'avg(conversion_rate) < threshold',
    threshold: 0.15,
    evaluationWindow: 120,
    cooldownPeriod: 240,
    enabled: true,
    tags: ['business', 'conversion'],
    notificationChannels: ['email'],
    runbook: '/runbooks/conversion-rate'
  },

  // === INFRASTRUCTURE ALERTS ===
  {
    id: 'infra-service-down',
    name: 'Service Unavailable',
    category: 'infrastructure',
    severity: 'critical',
    description: 'Critical service is not responding',
    condition: 'service_availability < threshold',
    threshold: 1.0,
    evaluationWindow: 1,
    cooldownPeriod: 5,
    enabled: true,
    tags: ['infrastructure', 'availability'],
    notificationChannels: ['email', 'webhook', 'in-app', 'sms'],
    runbook: '/runbooks/service-down'
  },
  {
    id: 'infra-health-check',
    name: 'Health Check Failure',
    category: 'infrastructure',
    severity: 'high',
    description: 'Service health check failing',
    condition: 'health_check_success_rate < threshold',
    threshold: 0.95,
    evaluationWindow: 3,
    cooldownPeriod: 10,
    enabled: true,
    tags: ['infrastructure', 'health'],
    notificationChannels: ['email', 'webhook', 'in-app'],
    runbook: '/runbooks/health-check-failure'
  }
];

// Alert Rule Groups for easier management
export const ALERT_RULE_GROUPS = {
  system: ALERT_RULES.filter(rule => rule.category === 'system'),
  application: ALERT_RULES.filter(rule => rule.category === 'application'),
  security: ALERT_RULES.filter(rule => rule.category === 'security'),
  business: ALERT_RULES.filter(rule => rule.category === 'business'),
  infrastructure: ALERT_RULES.filter(rule => rule.category === 'infrastructure'),
  critical: ALERT_RULES.filter(rule => rule.severity === 'critical'),
  high: ALERT_RULES.filter(rule => rule.severity === 'high'),
  medium: ALERT_RULES.filter(rule => rule.severity === 'medium'),
  low: ALERT_RULES.filter(rule => rule.severity === 'low')
};

// Threshold tuning recommendations
export const THRESHOLD_TUNING_GUIDELINES = {
  principles: [
    'Start with conservative thresholds and adjust based on baseline metrics',
    'Consider seasonal and time-of-day patterns in your data',
    'Use percentile-based thresholds rather than simple averages when possible',
    'Implement alert suppression during known maintenance windows',
    'Review and adjust thresholds monthly based on alert frequency and accuracy'
  ],
  recommendations: [
    'CPU: 70% warning, 85% critical for sustained periods (5+ minutes)',
    'Memory: 80% warning, 90% critical for sustained periods (3+ minutes)',
    'Disk: 80% warning, 90% critical, consider growth rate for early warning',
    'Response Time: P95 < 2s for good user experience',
    'Error Rate: < 1% for excellent, < 5% for acceptable service quality',
    'Queue Depth: Based on processing capacity and acceptable wait times'
  ]
};

export default {
  DEFAULT_SYSTEM_THRESHOLDS,
  DEFAULT_APPLICATION_THRESHOLDS,
  ALERT_RULES,
  ALERT_RULE_GROUPS,
  THRESHOLD_TUNING_GUIDELINES
};