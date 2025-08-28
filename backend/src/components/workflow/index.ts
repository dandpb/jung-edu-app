/**
 * Workflow Components Export Index
 * Centralized exports for all workflow-related components
 */

export { default as WorkflowTemplateBuilder } from './WorkflowTemplateBuilder';

// Re-export types for convenience
export type {
  WorkflowTemplate,
  WorkflowTemplateBuilder as BuilderState,
  TemplateNode,
  TemplateConnection,
  TemplateVariable,
  WorkflowTemplateCategory,
  EducationalNodeContext
} from '../../types/workflow';