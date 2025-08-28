export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout';
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  uptime: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  output?: any;
  tags?: string[];
}

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved' | 'suppressed';
  message: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  generatorURL?: string;
}

export interface AlertRule {
  name: string;
  query: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: Alert['severity'];
  annotations: Record<string, string>;
  labels: Record<string, string>;
}

export interface DashboardData {
  timestamp: Date;
  metrics: {
    system: SystemMetrics;
    workflow: WorkflowMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
  };
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  error_rate: number;
}

export interface WorkflowMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration: number;
  active_workflows: number;
  queued_workflows: number;
}

export interface PerformanceMetrics {
  response_time_p50: number;
  response_time_p95: number;
  response_time_p99: number;
  throughput: number;
  error_count: number;
  cache_hit_rate: number;
}

export interface BusinessMetrics {
  active_users: number;
  course_completions: number;
  quiz_submissions: number;
  user_engagement: number;
  content_views: number;
  learning_progress: number;
}

export interface MonitoringConfig {
  prometheus: {
    enabled: boolean;
    port: number;
    path: string;
    collectDefaultMetrics: boolean;
    prefix: string;
  };
  tracing: {
    enabled: boolean;
    serviceName: string;
    endpoint: string;
    samplingRate: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    output: 'console' | 'file' | 'both';
    filePath?: string;
  };
  health: {
    enabled: boolean;
    endpoint: string;
    interval: number;
    timeout: number;
  };
  alerts: {
    enabled: boolean;
    webhook?: string;
    email?: {
      smtp: string;
      from: string;
      to: string[];
    };
    slack?: {
      webhook: string;
      channel: string;
    };
  };
}