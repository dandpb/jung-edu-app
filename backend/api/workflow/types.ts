export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  metadata?: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
  conditions?: ExecutionCondition[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  currentStep?: string;
  stepExecutions: StepExecution[];
  variables: Record<string, any>;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
  error?: ExecutionError;
}

export interface StepExecution {
  stepId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: ExecutionError;
  retryCount: number;
}

export interface ExecutionLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  stepId?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionMetrics {
  totalDuration?: number;
  stepDurations: Record<string, number>;
  resourceUsage?: ResourceUsage;
  throughput?: number;
  errorRate?: number;
}

export interface ResourceUsage {
  cpuUsage?: number;
  memoryUsage?: number;
  networkIO?: number;
  diskIO?: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: any;
  stepId?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  backoffMultiplier?: number;
  maxBackoffTime?: number;
}

export interface ExecutionCondition {
  type: ConditionType;
  expression: string;
  description?: string;
}

export interface WorkflowMetadata {
  tags: string[];
  owner: string;
  priority: Priority;
  timeout?: number;
  schedule?: ScheduleConfig;
  notifications?: NotificationConfig[];
}

export interface ScheduleConfig {
  cron?: string;
  interval?: number;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export interface NotificationConfig {
  type: NotificationType;
  recipients: string[];
  events: NotificationEvent[];
  template?: string;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  pagination: PaginationInfo;
  filters: FilterInfo;
}

export interface ExecutionListResponse {
  executions: WorkflowExecution[];
  pagination: PaginationInfo;
  filters: FilterInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterInfo {
  status?: WorkflowStatus[];
  owner?: string;
  tags?: string[];
  dateRange?: DateRange;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface AuthContext {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
}

// Enums
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum StepType {
  HTTP_REQUEST = 'http_request',
  SCRIPT = 'script',
  APPROVAL = 'approval',
  DELAY = 'delay',
  CONDITION = 'condition',
  LOOP = 'loop',
  PARALLEL = 'parallel',
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  DATABASE = 'database'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum BackoffStrategy {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed'
}

export enum ConditionType {
  EXPRESSION = 'expression',
  SCRIPT = 'script',
  WEBHOOK = 'webhook'
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum NotificationType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}

export enum NotificationEvent {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  CANCELLED = 'cancelled'
}

// Request/Response types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
  variables?: Record<string, any>;
  metadata?: Partial<WorkflowMetadata>;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  steps?: Omit<WorkflowStep, 'id'>[];
  variables?: Record<string, any>;
  metadata?: Partial<WorkflowMetadata>;
  version?: string;
}

export interface ExecuteWorkflowRequest {
  variables?: Record<string, any>;
  priority?: Priority;
  timeout?: number;
  notifications?: NotificationConfig[];
}

export interface WorkflowQueryParams {
  page?: number;
  limit?: number;
  status?: WorkflowStatus[];
  owner?: string;
  tags?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ExecutionQueryParams {
  page?: number;
  limit?: number;
  status?: ExecutionStatus[];
  workflowId?: string;
  startedAfter?: Date;
  startedBefore?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}