/**
 * Type definitions for the Self-Healing Architecture
 */

// Core system types
export interface SystemFailure {
  id: string;
  type: FailureType;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: FailureImpact;
  timestamp: number;
  metrics: FailureMetrics;
  dependencies?: string[];
  rootCause?: string;
  description: string;
}

export enum FailureType {
  SERVICE_UNAVAILABLE = 'service_unavailable',
  HIGH_ERROR_RATE = 'high_error_rate',
  HIGH_LATENCY = 'high_latency',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  DEPENDENCY_FAILURE = 'dependency_failure',
  CONFIGURATION_ERROR = 'configuration_error',
  SECURITY_BREACH = 'security_breach',
  DATA_CORRUPTION = 'data_corruption'
}

export interface FailureImpact {
  affectedUsers: number;
  affectedServices: string[];
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  estimatedRevenueLoss?: number;
  slaViolation: boolean;
}

export interface FailureMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  availability: number;
  resourceUtilization: ResourceUtilization;
  custom?: Record<string, number>;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
}

// Health monitoring types
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: number;
  details: HealthDetails;
  score: number; // 0-100
}

export interface HealthDetails {
  checks: HealthCheck[];
  dependencies: DependencyHealth[];
  metrics: HealthMetrics;
  alerts: HealthAlert[];
}

export interface HealthCheck {
  name: string;
  type: 'liveness' | 'readiness' | 'startup' | 'business';
  status: boolean;
  responseTime: number;
  message?: string;
  lastCheck: number;
}

export interface DependencyHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: number;
  criticalPath: boolean;
}

export interface HealthMetrics {
  uptime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  availability: number;
}

export interface HealthAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metric?: string;
  threshold?: number;
  value?: number;
}

// Recovery types
export interface RecoveryAction {
  id: string;
  service: string;
  strategy: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  failure: SystemFailure;
  rollbackId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  applicableFailures: FailureType[];
  priority: number;
  estimatedRecoveryTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  postActions: string[];
}

export interface RecoveryResult {
  success: boolean;
  recoveryId: string;
  strategy: string;
  duration: number;
  actions: string[];
  rollbackId?: string;
  error?: string;
}

// Rollback types
export interface RollbackRequest {
  deploymentId?: string;
  service: string;
  trigger: 'manual' | 'health_degradation' | 'failure_recovery';
  automatic: boolean;
  startTime: number;
  reason?: string;
}

export interface RollbackResult {
  success: boolean;
  rollbackId: string;
  rollbackType: 'blue_green' | 'canary' | 'database' | 'configuration';
  previousState: any;
  currentState: any;
  duration: number;
  stepsExecuted?: RollbackStep[];
}

export interface RollbackStep {
  name: string;
  type: string;
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
}

// Predictive analytics types
export interface PredictionAlert {
  id: string;
  type: 'failure_prediction' | 'capacity_warning' | 'anomaly_detected' | 'trend_change';
  service: string;
  probability: number;
  timeToFailure?: number; // seconds
  confidence: number;
  riskFactors: RiskFactor[];
  recommendedActions?: PreventiveAction[];
  timestamp: number;
}

export interface RiskFactor {
  factor: string;
  importance: number;
  direction: 'increases' | 'decreases';
  value: number;
  threshold?: number;
}

export interface PreventiveAction {
  type: 'scale_resources' | 'adjust_thresholds' | 'schedule_maintenance' | 'update_config';
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedImpact: string;
  parameters?: Record<string, any>;
}

export interface AnomalyScore {
  score: number;
  confidence: number;
  isAnomaly: boolean;
  features: AnomalyFeature[];
  timestamp: number;
}

export interface AnomalyFeature {
  name: string;
  value: number;
  expectedRange: [number, number];
  contribution: number;
}

// Configuration types
export interface OrchestratorConfig {
  startTime?: number;
  monitoringInterval: number; // milliseconds
  recoveryTimeout: number; // milliseconds
  preventiveActionThreshold: number; // 0-1
  healthMonitor: HealthMonitorConfig;
  faultDetector: FaultDetectorConfig;
  recoveryManager: RecoveryManagerConfig;
  predictiveAnalytics: PredictiveAnalyticsConfig;
  rollbackManager: RollbackManagerConfig;
}

export interface HealthMonitorConfig {
  checkInterval: number;
  timeout: number;
  retries: number;
  thresholds: HealthThresholds;
}

export interface HealthThresholds {
  errorRate: number;
  responseTime: number;
  availability: number;
  resourceUtilization: ResourceThresholds;
}

export interface ResourceThresholds {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
}

export interface FaultDetectorConfig {
  correlationWindow: number; // milliseconds
  anomalyThreshold: number;
  minimumSamples: number;
  models: ModelConfig[];
}

export interface ModelConfig {
  name: string;
  type: 'isolation_forest' | 'one_class_svm' | 'autoencoder' | 'lstm';
  parameters: Record<string, any>;
  weight: number;
}

export interface RecoveryManagerConfig {
  strategies: RecoveryStrategy[];
  circuitBreaker: CircuitBreakerConfig;
  bulkhead: BulkheadConfig;
  timeout: TimeoutConfig;
  retry: RetryConfig;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  halfOpenMaxCalls: number;
}

export interface BulkheadConfig {
  threadPools: ThreadPoolConfig[];
  connectionPools: ConnectionPoolConfig[];
  resourceLimits: ResourceLimits;
}

export interface ThreadPoolConfig {
  name: string;
  coreSize: number;
  maxSize: number;
  queueCapacity: number;
  keepAliveTime: number;
}

export interface ConnectionPoolConfig {
  name: string;
  minConnections: number;
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
}

export interface ResourceLimits {
  maxMemory: number;
  maxCpu: number;
  maxConnections: number;
}

export interface TimeoutConfig {
  defaultTimeout: number;
  minTimeout: number;
  maxTimeout: number;
  adaptiveEnabled: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

export interface PredictiveAnalyticsConfig {
  models: MLModelConfig[];
  features: FeatureConfig;
  training: TrainingConfig;
  inference: InferenceConfig;
}

export interface MLModelConfig {
  name: string;
  type: 'gradient_boosting' | 'random_forest' | 'lstm' | 'prophet';
  parameters: Record<string, any>;
  updateFrequency: number; // milliseconds
  minTrainingData: number;
}

export interface FeatureConfig {
  timeWindows: number[]; // seconds
  aggregations: string[];
  businessMetrics: string[];
  technicalMetrics: string[];
}

export interface TrainingConfig {
  validationSplit: number;
  crossValidation: number;
  hyperparameterTuning: boolean;
  earlyStoppingPatience: number;
}

export interface InferenceConfig {
  batchSize: number;
  maxLatency: number; // milliseconds
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
}

export interface RollbackManagerConfig {
  strategies: RollbackStrategy[];
  safetyChecks: SafetyCheck[];
  stateManagement: StateManagementConfig;
}

export interface RollbackStrategy {
  name: string;
  type: 'blue_green' | 'canary' | 'database' | 'configuration';
  triggers: string[];
  safetyLevel: 'low' | 'medium' | 'high';
  maxRollbackTime: number; // milliseconds
}

export interface SafetyCheck {
  name: string;
  type: 'data_integrity' | 'dependency_validation' | 'resource_availability';
  timeout: number;
  required: boolean;
}

export interface StateManagementConfig {
  snapshotRetention: number; // days
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupLocation: string;
}

// Metrics and monitoring types
export interface SystemMetrics {
  timestamp: number;
  services: ServiceMetrics[];
  infrastructure: InfrastructureMetrics;
  business: BusinessMetrics;
}

export interface ServiceMetrics {
  name: string;
  instances: number;
  requestRate: number;
  errorRate: number;
  responseTime: number;
  availability: number;
  resourceUtilization: ResourceUtilization;
  dependencies: DependencyMetrics[];
}

export interface DependencyMetrics {
  service: string;
  responseTime: number;
  errorRate: number;
  circuitBreakerState: string;
}

export interface InfrastructureMetrics {
  nodes: NodeMetrics[];
  network: NetworkMetrics;
  storage: StorageMetrics;
}

export interface NodeMetrics {
  id: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: string;
}

export interface NetworkMetrics {
  latency: number;
  throughput: number;
  packetLoss: number;
  connections: number;
}

export interface StorageMetrics {
  iops: number;
  throughput: number;
  utilization: number;
  latency: number;
}

export interface BusinessMetrics {
  activeUsers: number;
  transactionRate: number;
  conversionRate: number;
  revenue: number;
  customerSatisfaction: number;
}