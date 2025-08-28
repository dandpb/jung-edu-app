/**
 * Workflow Services Export Index
 * Centralized exports for all workflow-related services and components
 */

// Core workflow services
export { WorkflowEngine, type WorkflowEngineOptions } from './WorkflowEngine';
export { WorkflowService } from './WorkflowService';
export { WorkflowStateManager } from './WorkflowStateManager';
export { WorkflowTemplateEngine } from './WorkflowTemplateEngine';
export { WorkflowTemplateManager } from './WorkflowTemplateManager';

// Execution strategies
export { 
  SequentialExecutionStrategy,
  ParallelExecutionStrategy,
  AdaptiveExecutionStrategy,
  ExecutionStrategyFactory,
  type ExecutionStrategy,
  type ExecutionResult,
  type ExecutionStats,
  type ExecutionEstimate,
  type StateExecutionRecord
} from './ExecutionStrategy';

// Workflow nodes
export {
  WorkflowNode,
  TaskNode,
  ConditionNode,
  LoopNode,
  ParallelNode,
  WorkflowNodeFactory,
  type WorkflowNodeOptions,
  type NodeExecutionResult,
  type ValidationResult,
  type NodeEstimate,
  type TaskNodeOptions,
  type ConditionNodeOptions,
  type LoopNodeOptions,
  type ParallelNodeOptions
} from './WorkflowNode';

// Event system
export {
  EventSystem,
  EducationalEventSystem,
  EventSystemFactory,
  type EventListener,
  type AsyncEventListener,
  type EventSubscriptionOptions,
  type EventSubscription,
  type WorkflowEvent,
  type EventEmissionResult,
  type EventError,
  type EventStats,
  type EventSystemOptions,
  type EventFilter,
  type EventTransformer,
  type StudentProgressEvent,
  type AssessmentEvent,
  type LearningPathEvent,
  type ContentAdaptationEvent
} from './EventSystem';

// Template manager types
export type {
  TemplateSearchFilters,
  TemplatePaginationOptions,
  TemplatePermission,
  TemplateAnalytics,
  TemplateUsageStats
} from './WorkflowTemplateManager';

// Utility exports for common workflow patterns
export const WorkflowUtils = {
  /**
   * Create a basic educational workflow engine
   */
  createEducationalEngine: (services: any, options: any = {}) => {
    const eventSystem = EventSystemFactory.create('educational', 'main');
    return new WorkflowEngine(services, {
      ...options,
      eventSystem,
      executionStrategy: options.executionStrategy || 'adaptive'
    });
  },

  /**
   * Create a high-performance workflow engine
   */
  createPerformanceEngine: (services: any, options: any = {}) => {
    return new WorkflowEngine(services, {
      ...options,
      executionStrategy: 'parallel',
      maxConcurrentExecutions: options.maxConcurrentExecutions || 20
    });
  },

  /**
   * Get recommended execution strategy for workflow
   */
  getRecommendedStrategy: (workflow: any) => {
    return ExecutionStrategyFactory.recommend(workflow);
  }
};