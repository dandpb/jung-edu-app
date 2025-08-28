export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // Percentage
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number; // Bytes
    used: number;
    free: number;
    cached?: number;
    available?: number;
  };
  disk: {
    total: number; // Bytes
    used: number;
    free: number;
    path: string;
  };
  network: {
    latency: number; // Milliseconds
    bytesIn: number;
    bytesOut: number;
    packetsIn?: number;
    packetsOut?: number;
  };
  custom?: Record<string, number>;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: {
    warning: number;
    critical: number;
  };
  timestamp: Date;
  message: string;
  error?: string;
}

export interface MonitoringConfig {
  checkInterval: number; // Milliseconds
  thresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    disk: { warning: number; critical: number };
    network: { warning: number; critical: number };
  };
  metrics: {
    enabled: boolean;
    collection: {
      system: boolean;
      application: boolean;
      custom: boolean;
    };
    retention: number; // Days
  };
  storage: {
    type: 'memory' | 'file' | 'database';
    config: any;
  };
}

export interface AnomalyResult {
  metric: string;
  value: number;
  expectedRange: {
    min: number;
    max: number;
  };
  anomalyScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  model: string;
  description: string;
}

export interface AnomalyModel {
  type: 'statistical' | 'seasonal' | 'trend' | 'ml';
  metric: string;
  model: any; // Model-specific data
  lastTrained: Date;
  accuracy: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
  escalationLevel: number;
  acknowledgedBy: string | null;
  acknowledgedAt?: Date;
  resolvedAt: Date | null;
  resolution?: string;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds?: {
    cpu?: { warning: number; critical: number };
    memory?: { warning: number; critical: number };
    disk?: { warning: number; critical: number };
    network?: { warning: number; critical: number };
  };
  notifications: {
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
    };
  };
}

export interface EscalationLevel {
  level: number;
  delay: number; // Minutes
  channels: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
}

export interface DashboardConfig {
  refreshInterval: number; // Milliseconds
  charts: ChartConfig[];
  alerts: {
    showActive: boolean;
    showHistory: boolean;
    maxItems: number;
  };
  metrics: {
    timeRange: string; // e.g., '1h', '24h', '7d'
    aggregation: 'avg' | 'min' | 'max' | 'sum';
  };
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'area' | 'bar' | 'gauge' | 'number';
  metrics: string[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  options: {
    yAxis?: {
      min?: number;
      max?: number;
      label?: string;
    };
    colors?: string[];
    thresholds?: Array<{
      value: number;
      color: string;
      label?: string;
    }>;
  };
}

export interface DashboardData {
  timestamp: Date;
  metrics: SystemMetrics;
  alerts: Alert[];
  anomalies: AnomalyResult[];
  healthStatus: {
    overall: 'healthy' | 'warning' | 'critical';
    services: HealthCheckResult[];
  };
}

export interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeHorizon: number; // Minutes into the future
  trend: 'increasing' | 'decreasing' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  customMetrics?: Record<string, number>;
}

export interface StorageMetrics {
  reads: number;
  writes: number;
  errors: number;
  latency: number;
  cacheHits?: number;
  cacheMisses?: number;
}