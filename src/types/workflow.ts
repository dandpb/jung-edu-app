/**
 * Workflow System Type Definitions for jaqEdu
 * Comprehensive TypeScript interfaces for the educational workflow system
 */

// ============================================================================
// Core Workflow Types
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: WorkflowCategory;
  trigger: WorkflowTrigger;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  variables: WorkflowVariable[];
  metadata: WorkflowMetadata;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  is_active: boolean;
}

export type WorkflowCategory = 
  | 'learning_path'
  | 'assessment'
  | 'approval'
  | 'notification'
  | 'analytics'
  | 'content_generation'
  | 'user_onboarding'
  | 'certification'
  | 'progress_tracking'
  | 'adaptive_learning';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id?: string;
  status: ExecutionStatus;
  current_state?: string;
  variables: Record<string, any>;
  input_data?: any;
  output_data?: any;
  execution_history: ExecutionEvent[];
  error_message?: string;
  retry_count: number;
  parent_execution_id?: string;
  correlation_id?: string;
  started_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type ExecutionStatus = 
  | 'pending'
  | 'running' 
  | 'waiting'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ============================================================================
// Workflow Structure Types
// ============================================================================

export interface WorkflowState {
  id: string;
  name: string;
  type: StateType;
  isInitial: boolean;
  isFinal: boolean;
  actions: WorkflowAction[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
  compensationActions?: WorkflowAction[];
}

export type StateType = 
  | 'task'
  | 'decision'
  | 'parallel'
  | 'wait'
  | 'subprocess'
  | 'end';

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  plugin?: string;
  config: Record<string, any>;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  condition?: string;
}

export type ActionType =
  | 'execute_plugin'
  | 'send_notification'
  | 'update_database'
  | 'call_api'
  | 'wait'
  | 'condition_check'
  | 'parallel_execution'
  | 'subprocess'
  | 'user_task'
  | 'timer'
  | 'script';

export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  guard?: string;
  actions?: WorkflowAction[];
  priority: number;
}

export interface WorkflowTrigger {
  type: TriggerType;
  event: string;
  conditions: TriggerCondition[];
  schedule?: CronExpression;
  immediate: boolean;
  enabled: boolean;
}

export type TriggerType = 
  | 'event'
  | 'schedule'
  | 'manual'
  | 'webhook'
  | 'database_change'
  | 'user_action';

export interface TriggerCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in_array'
  | 'not_in_array'
  | 'regex_match'
  | 'is_null'
  | 'is_not_null';

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: VariableValidation;
}

export type VariableType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'json';

export interface VariableValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  required?: boolean;
}

export interface WorkflowMetadata {
  tags: string[];
  author: string;
  documentation?: string;
  version_notes?: string;
  dependencies?: string[];
  permissions_required?: string[];
}

// ============================================================================
// Execution and Event Types
// ============================================================================

export interface ExecutionEvent {
  id: string;
  execution_id: string;
  event_type: string;
  state_id?: string;
  action_id?: string;
  event_data: Record<string, any>;
  correlation_id?: string;
  causation_id?: string;
  duration_ms?: number;
  timestamp: Date;
}

export interface WorkflowEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionContext {
  executionId: string;
  userId?: string;
  workflowId: string;
  currentState: string;
  variables: Map<string, any>;
  services: WorkflowServices;
  logger: WorkflowLogger;
  timeout?: number;
  correlationId?: string;
}

export interface WorkflowServices {
  database: DatabaseService;
  notification: NotificationService;
  analytics: AnalyticsService;
  auth: AuthenticationService;
  ai: AIService;
  cache: CacheService;
}

// ============================================================================
// Educational Workflow Specific Types
// ============================================================================

export interface StudentProgressWorkflowData {
  userId: string;
  moduleId: string;
  progress: number;
  timeSpent: number;
  completedSections: string[];
  currentSection?: string;
  achievements?: Achievement[];
  performanceMetrics: PerformanceMetrics;
}

export interface LearningPathWorkflowData {
  userId: string;
  pathId: string;
  currentModule: string;
  completedModules: string[];
  recommendedModules: string[];
  adaptationTriggers: AdaptationTrigger[];
  personalizations: Personalization[];
}

export interface AssessmentWorkflowData {
  userId: string;
  assessmentId: string;
  sessionId: string;
  questions: AssessmentQuestion[];
  currentQuestion: number;
  answers: AssessmentAnswer[];
  timeLimit?: number;
  startTime: Date;
  settings: AssessmentSettings;
}

export interface ApprovalWorkflowData {
  contentId: string;
  contentType: 'module' | 'quiz' | 'assignment' | 'video';
  authorId: string;
  approverId?: string;
  reviewers: string[];
  status: ApprovalStatus;
  priority: ApprovalPriority;
  dueDate?: Date;
  feedback?: ApprovalFeedback[];
  metadata: ApprovalMetadata;
}

export interface AdaptiveContentWorkflowData {
  userId: string;
  topicId: string;
  learnerProfile: LearnerProfile;
  contentVariants: ContentVariant[];
  selectedVariant?: ContentVariant;
  adaptationRules: AdaptationRule[];
  performanceData: PerformanceData;
}

// ============================================================================
// Educational Domain Types
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  requirements: AchievementRequirement[];
}

export type AchievementCategory = 
  | 'progress'
  | 'knowledge'
  | 'engagement'
  | 'social'
  | 'exploration'
  | 'mastery';

export interface AchievementRequirement {
  type: 'complete_modules' | 'quiz_score' | 'time_spent' | 'consecutive_days' | 'forum_posts';
  value: number;
  operator: '>=' | '<=' | '=' | '>' | '<';
}

export interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  consistency: number;
  engagement: number;
  retention: number;
  difficulty_preference: number;
}

export interface AdaptationTrigger {
  type: 'performance' | 'time' | 'preference' | 'behavior';
  condition: string;
  threshold: number;
  action: AdaptationAction;
}

export interface AdaptationAction {
  type: 'show_variant' | 'adjust_difficulty' | 'suggest_review' | 'provide_help' | 'skip_content';
  parameters: Record<string, any>;
}

export interface Personalization {
  aspect: 'difficulty' | 'content_type' | 'pace' | 'examples' | 'format';
  value: any;
  confidence: number;
  source: 'explicit' | 'inferred' | 'ai_generated';
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: AssessmentOption[];
  correctAnswer: any;
  points: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number;
  hints?: string[];
  explanation: string;
}

export type QuestionType = 
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false'
  | 'fill-in-blank'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'ranking'
  | 'drag-drop'
  | 'interactive';

export interface AssessmentOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  feedback?: string;
  mediaUrl?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  attempts: number;
  confidence?: number;
}

export interface AssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowRetries: boolean;
  maxRetries: number;
  showFeedback: 'immediate' | 'after_question' | 'after_completion' | 'never';
  showScore: boolean;
  allowReview: boolean;
  proctoring: boolean;
}

export interface ApprovalStatus {
  current: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_required';
  history: ApprovalStatusChange[];
}

export interface ApprovalStatusChange {
  status: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  notes?: string;
}

export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ApprovalFeedback {
  reviewerId: string;
  rating: number;
  comments: string;
  suggestions: string[];
  requirements: string[];
  timestamp: Date;
}

export interface ApprovalMetadata {
  category: string;
  estimatedReviewTime: number;
  contentLength: number;
  complexity: 'simple' | 'moderate' | 'complex';
  requiredExpertise: string[];
}

export interface LearnerProfile {
  userId: string;
  learningStyle: LearningStyle;
  difficultyPreference: number;
  pacePreference: 'slow' | 'medium' | 'fast';
  contentPreferences: ContentPreference[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  background: string[];
  adaptationHistory: AdaptationHistory[];
}

export interface LearningStyle {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

export interface ContentPreference {
  type: 'video' | 'text' | 'interactive' | 'audio' | 'simulation';
  preference: number;
}

export interface ContentVariant {
  id: string;
  targetAudience: string;
  difficulty: number;
  format: 'video' | 'text' | 'interactive' | 'audio' | 'mixed';
  estimatedTime: number;
  prerequisites: string[];
  content: any;
  effectiveness: number;
}

export interface AdaptationRule {
  id: string;
  trigger: AdaptationTrigger;
  action: AdaptationAction;
  priority: number;
  conditions: string[];
  enabled: boolean;
}

export interface PerformanceData {
  accuracy: number;
  completionTime: number;
  engagementScore: number;
  retentionScore: number;
  difficultyRating: number;
  lastAssessment: Date;
}

export interface AdaptationHistory {
  timestamp: Date;
  trigger: string;
  action: string;
  parameters: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  impact: number;
}

// ============================================================================
// Plugin and Service Types
// ============================================================================

export interface WorkflowPlugin {
  name: string;
  version: string;
  description: string;
  initialize(config: any): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
  cleanup?(): Promise<void>;
}

export interface PluginContext {
  executionId: string;
  workflowId: string;
  userId?: string;
  input: any;
  variables: Map<string, any>;
  services: WorkflowServices;
  logger: WorkflowLogger;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  nextState?: string;
  shouldWait?: boolean;
  shouldRetry?: boolean;
  variables?: Record<string, any>;
}

export interface WorkflowLogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error): void;
}

// ============================================================================
// API and Request/Response Types
// ============================================================================

export interface CreateWorkflowRequest {
  name: string;
  description: string;
  category: WorkflowCategory;
  definition: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  definition?: Partial<WorkflowDefinition>;
  is_active?: boolean;
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  input?: any;
  userId?: string;
  correlationId?: string;
}

export interface WorkflowExecutionResponse {
  execution: WorkflowExecution;
  success: boolean;
  message?: string;
}

export interface ListWorkflowsQuery {
  category?: WorkflowCategory;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  tags?: string[];
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface ListExecutionsQuery {
  workflowId?: string;
  userId?: string;
  status?: ExecutionStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

// ============================================================================
// Utility and Configuration Types
// ============================================================================

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryOn: string[];
  enabled: boolean;
}

export interface CronExpression {
  expression: string;
  timezone: string;
  description?: string;
}

export interface WorkflowConfiguration {
  engine: {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    retryPolicy: RetryPolicy;
    enableMetrics: boolean;
    enableAuditLog: boolean;
  };
  plugins: {
    loadPath: string[];
    autoLoad: boolean;
    enableSandbox: boolean;
  };
  scheduler: {
    enabled: boolean;
    intervalMs: number;
    maxJobs: number;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
  };
}

export interface WorkflowHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  lastCheck: Date;
  uptime: number;
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageWaitTime: number;
  activeExecutions: number;
  queuedExecutions: number;
  errorRate: number;
}

// ============================================================================
// Workflow Template Types
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: WorkflowTemplateCategory;
  icon: string;
  tags: string[];
  isPublic: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  definition: WorkflowDefinition;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  usage_count: number;
  rating?: number;
  reviews?: TemplateReview[];
}

export type WorkflowTemplateCategory = 
  | 'enrollment'
  | 'assessment' 
  | 'progress_tracking'
  | 'certification'
  | 'communication'
  | 'jung_psychology'
  | 'content_delivery'
  | 'adaptive_learning'
  | 'gamification'
  | 'analytics';

export interface TemplateVariable {
  name: string;
  type: VariableType;
  displayName: string;
  description: string;
  defaultValue?: any;
  required: boolean;
  validation?: VariableValidation;
  options?: TemplateVariableOption[];
  group?: string;
  order: number;
}

export interface TemplateVariableOption {
  label: string;
  value: any;
  description?: string;
}

export interface TemplateMetadata {
  tags: string[];
  author: string;
  authorEmail?: string;
  documentation?: string;
  version_notes?: string;
  dependencies?: string[];
  permissions_required?: string[];
  preview_image?: string;
  tutorial_url?: string;
  examples?: TemplateExample[];
  use_cases: string[];
  integration_points?: string[];
}

export interface TemplateExample {
  title: string;
  description: string;
  variables: Record<string, any>;
  expected_outcome: string;
}

export interface TemplateReview {
  id: string;
  user_id: string;
  user_name: string;
  rating: number; // 1-5 stars
  comment: string;
  created_at: Date;
  helpful_count: number;
}

export interface TemplateInstantiation {
  template_id: string;
  instance_id: string;
  variables: Record<string, any>;
  workflow_execution_id?: string;
  created_by: string;
  created_at: Date;
  status: 'draft' | 'active' | 'completed' | 'failed';
}

export interface WorkflowTemplateBuilder {
  nodes: TemplateNode[];
  connections: TemplateConnection[];
  layout: TemplateLayout;
  settings: TemplateBuilderSettings;
}

export interface TemplateNode {
  id: string;
  type: 'start' | 'end' | 'task' | 'decision' | 'parallel' | 'wait' | 'notification' | 'approval';
  position: { x: number; y: number };
  data: TemplateNodeData;
  style?: Record<string, any>;
}

export interface TemplateNodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  validation?: NodeValidation;
  educational_context?: EducationalNodeContext;
}

export interface EducationalNodeContext {
  learning_objectives?: string[];
  assessment_criteria?: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  time_estimate?: number;
  resources_required?: string[];
  jung_concepts?: string[];
}

export interface NodeValidation {
  required_fields: string[];
  custom_validation?: string; // JavaScript function as string
  error_messages: Record<string, string>;
}

export interface TemplateConnection {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
  style?: Record<string, any>;
}

export interface TemplateLayout {
  direction: 'horizontal' | 'vertical';
  spacing: { x: number; y: number };
  alignment: 'left' | 'center' | 'right';
}

export interface TemplateBuilderSettings {
  grid_enabled: boolean;
  snap_to_grid: boolean;
  zoom_level: number;
  auto_save: boolean;
  validation_enabled: boolean;
}

// Educational Workflow Template Specific Types
export interface CourseEnrollmentTemplateData {
  course_id: string;
  student_id: string;
  enrollment_type: 'full' | 'audit' | 'premium';
  prerequisites_check: boolean;
  payment_required: boolean;
  notification_preferences: NotificationPreferences;
}

export interface AssignmentWorkflowTemplateData {
  assignment_id: string;
  course_id: string;
  due_date: Date;
  submission_type: 'file' | 'text' | 'quiz' | 'peer_review';
  grading_criteria: GradingCriteria;
  auto_grading_enabled: boolean;
  peer_review_required: boolean;
}

export interface ProgressTrackingTemplateData {
  student_id: string;
  course_id: string;
  module_id?: string;
  tracking_frequency: 'real_time' | 'daily' | 'weekly';
  milestone_notifications: boolean;
  parent_notifications: boolean;
  achievement_tracking: boolean;
}

export interface JungModuleTemplateData {
  module_type: 'archetype' | 'dream_analysis' | 'individuation' | 'shadow_work' | 'active_imagination';
  difficulty_adaptation: boolean;
  personalization_enabled: boolean;
  self_reflection_prompts: boolean;
  integration_exercises: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  in_app: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly';
}

export interface GradingCriteria {
  rubric_id?: string;
  auto_grade_percentage: number;
  manual_review_required: boolean;
  feedback_required: boolean;
  grade_scale: 'points' | 'percentage' | 'letter';
}

// ============================================================================
// Error Types
// ============================================================================

export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: WorkflowErrorCode,
    public executionId?: string,
    public workflowId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export enum WorkflowErrorCode {
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  EXECUTION_NOT_FOUND = 'EXECUTION_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// ============================================================================
// Database Service Interfaces
// ============================================================================

export interface DatabaseService {
  query(sql: string, params?: any[]): Promise<any[]>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface Transaction {
  query(sql: string, params?: any[]): Promise<any[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface NotificationService {
  send(notification: Notification): Promise<void>;
  sendBatch(notifications: Notification[]): Promise<void>;
}

export interface Notification {
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): Promise<void>;
  trackBatch(events: AnalyticsEvent[]): Promise<void>;
}

export interface AnalyticsEvent {
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface AuthenticationService {
  validateToken(token: string): Promise<boolean>;
  getUserById(id: string): Promise<any>;
  hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
}

export interface AIService {
  generateContent(prompt: string, parameters?: any): Promise<string>;
  analyzePerformance(data: any): Promise<PerformanceAnalysis>;
  recommendContent(profile: LearnerProfile, available: any[]): Promise<any[]>;
}

export interface PerformanceAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  difficulty_adjustment: number;
  confidence: number;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}