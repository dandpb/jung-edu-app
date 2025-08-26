/**
 * Workflow Service for jaqEdu Educational Platform
 * CRUD operations, template management, and workflow execution control
 */

import {
  WorkflowDefinition,
  WorkflowExecution,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecutionResponse,
  ListWorkflowsQuery,
  ListExecutionsQuery,
  ExecutionStatus,
  WorkflowCategory,
  WorkflowError,
  WorkflowErrorCode,
  WorkflowServices
} from '../../types/workflow';
import { supabase, createDatabaseQuery } from '../../config/supabase';
import { WorkflowEngine } from './WorkflowEngine';
import { WorkflowStateManager } from './WorkflowStateManager';
import { authService } from '../auth/authService';

/**
 * Workflow template interface
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  template: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
  isSystem: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow execution statistics
 */
export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsByStatus: Record<ExecutionStatus, number>;
  executionsByCategory: Record<WorkflowCategory, number>;
}

/**
 * Workflow Service
 * Main service for managing workflows in the jaqEdu educational platform
 */
export class WorkflowService {
  private engine: WorkflowEngine;
  private stateManager: WorkflowStateManager;
  private services: WorkflowServices;

  constructor(services: WorkflowServices) {
    this.services = services;
    this.engine = new WorkflowEngine(services);
    this.stateManager = new WorkflowStateManager();
  }

  /**
   * Create a new workflow definition
   */
  async createWorkflow(request: CreateWorkflowRequest, userId: string): Promise<WorkflowDefinition> {
    try {
      // Validate user permissions
      const hasPermission = await authService.hasPermission(userId, 'workflows', 'create');
      if (!hasPermission) {
        throw new WorkflowError(
          'Insufficient permissions to create workflow',
          WorkflowErrorCode.AUTHORIZATION_ERROR
        );
      }

      // Create workflow definition
      const workflow: WorkflowDefinition = {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: request.name,
        description: request.description,
        version: '1.0.0',
        category: request.category,
        trigger: request.definition.trigger,
        states: request.definition.states,
        transitions: request.definition.transitions,
        variables: request.definition.variables,
        metadata: {
          ...request.definition.metadata,
          author: userId
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
        is_active: true
      };

      // Validate workflow definition
      this.validateWorkflowDefinition(workflow);

      // Save to database (mocked for development)
      const error = null; // Mock successful insertion

      if (error) {
        throw new WorkflowError(
          `Failed to create workflow: Database error`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          workflow.id,
          error
        );
      }

      return workflow;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to create workflow',
        WorkflowErrorCode.CONFIGURATION_ERROR,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string, userId?: string): Promise<WorkflowDefinition | null> {
    try {
      // Mock workflow retrieval for development
      const data = null; // Mock no workflow found
      const error = null;

      if (error) {
        // Error handling would go here in real implementation
        return null; // Not found
      }

      // For development, return null (no workflows found)
      return null;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error getting workflow',
        WorkflowErrorCode.NETWORK_ERROR,
        undefined,
        workflowId,
        error
      );
    }
  }

  /**
   * Update workflow definition
   */
  async updateWorkflow(
    workflowId: string,
    request: UpdateWorkflowRequest,
    userId: string
  ): Promise<WorkflowDefinition> {
    try {
      // Get existing workflow
      const existing = await this.getWorkflowById(workflowId, userId);
      if (!existing) {
        throw new WorkflowError(
          'Workflow not found',
          WorkflowErrorCode.WORKFLOW_NOT_FOUND,
          undefined,
          workflowId
        );
      }

      // Check permissions
      const hasPermission = await authService.hasPermission(userId, 'workflows', 'update');
      if (!hasPermission && existing.created_by !== userId) {
        throw new WorkflowError(
          'Insufficient permissions to update workflow',
          WorkflowErrorCode.AUTHORIZATION_ERROR,
          undefined,
          workflowId
        );
      }

      // Create updated workflow
      const updated: WorkflowDefinition = {
        ...existing,
        ...request,
        id: workflowId, // Ensure ID doesn't change
        updated_at: new Date()
      };

      // Validate updated workflow
      this.validateWorkflowDefinition(updated);

      // Update in database (mocked for development)
      const error = null; // Mock successful update

      if (error) {
        throw new WorkflowError(
          `Failed to update workflow: Database error`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          workflowId,
          error
        );
      }

      return updated;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to update workflow',
        WorkflowErrorCode.CONFIGURATION_ERROR,
        undefined,
        workflowId,
        error
      );
    }
  }

  /**
   * Delete workflow definition
   */
  async deleteWorkflow(workflowId: string, userId: string): Promise<boolean> {
    try {
      // Get existing workflow
      const existing = await this.getWorkflowById(workflowId, userId);
      if (!existing) {
        return false;
      }

      // Check permissions
      const hasPermission = await authService.hasPermission(userId, 'workflows', 'delete');
      if (!hasPermission && existing.created_by !== userId) {
        throw new WorkflowError(
          'Insufficient permissions to delete workflow',
          WorkflowErrorCode.AUTHORIZATION_ERROR,
          undefined,
          workflowId
        );
      }

      // Check for active executions
      const activeExecutions = await this.stateManager.getExecutionsByStatus('running');
      const hasActiveExecutions = activeExecutions.some(exec => exec.workflow_id === workflowId);
      
      if (hasActiveExecutions) {
        throw new WorkflowError(
          'Cannot delete workflow with active executions',
          WorkflowErrorCode.EXECUTION_FAILED,
          undefined,
          workflowId
        );
      }

      // Soft delete by setting is_active to false (mocked for development)
      const error = null; // Mock successful deletion

      if (error) {
        throw new WorkflowError(
          `Failed to delete workflow: Database error`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          workflowId,
          error
        );
      }

      return true;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to delete workflow',
        WorkflowErrorCode.CONFIGURATION_ERROR,
        undefined,
        workflowId,
        error
      );
    }
  }

  /**
   * List workflows with query parameters
   */
  async listWorkflows(query: ListWorkflowsQuery, userId?: string): Promise<WorkflowDefinition[]> {
    try {
      // Mock workflow list retrieval for development
      const data: any[] = []; // Mock empty list
      const error = null;

      if (error) {
        throw new WorkflowError(
          `Failed to list workflows: Database error`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          undefined,
          error
        );
      }

      // Filter by permissions if user provided
      let workflows = data.map(this.mapRowToWorkflow);

      if (userId) {
        const hasReadPermission = await authService.hasPermission(userId, 'workflows', 'read');
        if (!hasReadPermission) {
          // Only show user's own workflows
          workflows = workflows.filter(wf => wf.created_by === userId);
        }
      }

      return workflows;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to list workflows',
        WorkflowErrorCode.NETWORK_ERROR,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(request: ExecuteWorkflowRequest): Promise<WorkflowExecutionResponse> {
    try {
      // Get workflow definition
      const workflow = await this.getWorkflowById(request.workflowId, request.userId);
      if (!workflow) {
        throw new WorkflowError(
          'Workflow not found',
          WorkflowErrorCode.WORKFLOW_NOT_FOUND,
          undefined,
          request.workflowId
        );
      }

      // Check permissions
      if (request.userId) {
        const hasPermission = await authService.hasPermission(request.userId, 'workflows', 'execute');
        if (!hasPermission) {
          throw new WorkflowError(
            'Insufficient permissions to execute workflow',
            WorkflowErrorCode.AUTHORIZATION_ERROR,
            undefined,
            request.workflowId
          );
        }
      }

      // Create execution record
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflow_id: workflow.id,
        user_id: request.userId,
        status: 'pending',
        variables: {},
        input_data: request.input,
        execution_history: [],
        retry_count: 0,
        correlation_id: request.correlationId,
        created_at: new Date(),
        updated_at: new Date(),
        started_at: new Date()
      };

      // Save initial execution state
      await this.stateManager.saveExecutionState(execution);

      // Execute workflow asynchronously
      this.executeWorkflowAsync(workflow, execution);

      return {
        execution,
        success: true,
        message: 'Workflow execution started'
      };

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to execute workflow',
        WorkflowErrorCode.EXECUTION_FAILED,
        undefined,
        request.workflowId,
        error
      );
    }
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(executionId: string, userId?: string): Promise<WorkflowExecution | null> {
    try {
      const execution = await this.stateManager.loadExecutionState(executionId);
      if (!execution) {
        return null;
      }

      // Check permissions
      if (userId) {
        const hasPermission = await authService.hasPermission(userId, 'workflows', 'read');
        if (!hasPermission && execution.user_id !== userId) {
          return null;
        }
      }

      // Load execution history
      execution.execution_history = await this.stateManager.getExecutionHistory(executionId);

      return execution;

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to get execution',
        WorkflowErrorCode.EXECUTION_NOT_FOUND,
        executionId,
        undefined,
        error
      );
    }
  }

  /**
   * List executions with query parameters
   */
  async listExecutions(query: ListExecutionsQuery, userId?: string): Promise<WorkflowExecution[]> {
    try {
      // Mock executions list for development
      console.log('Mock: listExecutions called', { query, userId });
      return [];

    } catch (error) {
      console.error('Error in listExecutions:', error);
      return [];
    }
  }

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(category?: WorkflowCategory): Promise<WorkflowTemplate[]> {
    try {
      // Mock workflow templates for development
      console.log('Mock: getWorkflowTemplates called', { category });
      return [];

    } catch (error) {
      console.error('Error in getWorkflowTemplates:', error);
      return [];
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(userId?: string): Promise<WorkflowStats> {
    try {
      // This would require more complex queries in a real implementation
      // For now, return basic stats
      const executions = await this.listExecutions({}, userId);

      const stats: WorkflowStats = {
        totalExecutions: executions.length,
        successfulExecutions: executions.filter(e => e.status === 'completed').length,
        failedExecutions: executions.filter(e => e.status === 'failed').length,
        averageExecutionTime: 0,
        executionsByStatus: {
          pending: 0,
          running: 0,
          waiting: 0,
          paused: 0,
          completed: 0,
          failed: 0,
          cancelled: 0
        },
        executionsByCategory: {
          learning_path: 0,
          assessment: 0,
          approval: 0,
          notification: 0,
          analytics: 0,
          content_generation: 0,
          user_onboarding: 0,
          certification: 0,
          progress_tracking: 0,
          adaptive_learning: 0
        }
      };

      // Calculate statistics
      let totalDuration = 0;
      executions.forEach(execution => {
        stats.executionsByStatus[execution.status]++;
        
        if (execution.started_at && execution.completed_at) {
          totalDuration += execution.completed_at.getTime() - execution.started_at.getTime();
        }
      });

      stats.averageExecutionTime = executions.length > 0 ? totalDuration / executions.length : 0;

      return stats;

    } catch (error) {
      throw new WorkflowError(
        'Failed to get workflow statistics',
        WorkflowErrorCode.NETWORK_ERROR,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Execute workflow asynchronously
   */
  private async executeWorkflowAsync(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    try {
      await this.engine.executeWorkflow(workflow, execution, execution.input_data);
      await this.stateManager.saveExecutionState(execution);
    } catch (error) {
      console.error('Workflow execution failed:', error);
      execution.status = 'failed';
      execution.error_message = error instanceof Error ? error.message : String(error);
      await this.stateManager.saveExecutionState(execution);
    }
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflowDefinition(workflow: WorkflowDefinition): void {
    // Check for initial state
    const hasInitialState = workflow.states.some(state => state.isInitial);
    if (!hasInitialState) {
      throw new WorkflowError(
        'Workflow must have at least one initial state',
        WorkflowErrorCode.VALIDATION_ERROR,
        undefined,
        workflow.id
      );
    }

    // Check for final state
    const hasFinalState = workflow.states.some(state => state.isFinal);
    if (!hasFinalState) {
      throw new WorkflowError(
        'Workflow must have at least one final state',
        WorkflowErrorCode.VALIDATION_ERROR,
        undefined,
        workflow.id
      );
    }

    // Validate transitions
    workflow.transitions.forEach(transition => {
      const fromState = workflow.states.find(s => s.id === transition.from);
      const toState = workflow.states.find(s => s.id === transition.to);
      
      if (!fromState) {
        throw new WorkflowError(
          `Invalid transition: from state '${transition.from}' not found`,
          WorkflowErrorCode.VALIDATION_ERROR,
          undefined,
          workflow.id
        );
      }
      
      if (!toState) {
        throw new WorkflowError(
          `Invalid transition: to state '${transition.to}' not found`,
          WorkflowErrorCode.VALIDATION_ERROR,
          undefined,
          workflow.id
        );
      }
    });
  }

  /**
   * Map database row to WorkflowDefinition
   */
  private mapRowToWorkflow(row: any): WorkflowDefinition {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      category: row.category,
      trigger: row.trigger,
      states: row.states,
      transitions: row.transitions,
      variables: row.variables,
      metadata: row.metadata,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      is_active: row.is_active
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.engine.cleanup();
    await this.stateManager.cleanup();
  }
}