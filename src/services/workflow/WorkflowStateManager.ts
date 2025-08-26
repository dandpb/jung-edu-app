/**
 * Workflow State Manager for jaqEdu Educational Platform
 * Handles state persistence using Supabase with real-time updates
 */

import {
  WorkflowExecution,
  ExecutionEvent,
  ExecutionStatus,
  WorkflowError,
  WorkflowErrorCode
} from '../../types/workflow';
import { supabase, createDatabaseQuery } from '../../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * State change event interface
 */
export interface StateChangeEvent {
  executionId: string;
  oldState?: string;
  newState: string;
  timestamp: Date;
  userId?: string;
  data?: any;
}

/**
 * State change listener type
 */
export type StateChangeListener = (event: StateChangeEvent) => void;

/**
 * Workflow State Manager
 * Manages workflow execution state with Supabase persistence and WebSocket real-time updates
 */
export class WorkflowStateManager {
  private realtimeChannel?: RealtimeChannel;
  private stateChangeListeners = new Set<StateChangeListener>();
  private progressUpdateListeners = new Map<string, Set<(progress: StudentProgressUpdate) => void>>();

  constructor() {
    this.initializeRealtime();
  }

  /**
   * Initialize real-time subscriptions
   */
  private async initializeRealtime(): Promise<void> {
    try {
      this.realtimeChannel = supabase.channel('workflow_state_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'workflow_executions'
          },
          (payload) => this.handleStateChange(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'execution_events'
          },
          (payload) => this.handleExecutionEvent(payload)
        )
        .subscribe();

    } catch (error) {
      console.error('Failed to initialize real-time subscriptions:', error);
    }
  }

  /**
   * Save workflow execution state to database
   */
  async saveExecutionState(execution: WorkflowExecution): Promise<void> {
    try {
      // Mock save execution state for development
      console.log('Mock: saveExecutionState called', execution.id);

    } catch (error) {
      console.error('Error in saveExecutionState:', error);
    }
  }

  /**
   * Load workflow execution state from database
   */
  async loadExecutionState(executionId: string): Promise<WorkflowExecution | null> {
    try {
      // Mock load execution state for development
      console.log('Mock: loadExecutionState called', executionId);
      return null;

    } catch (error) {
      console.error('Error in loadExecutionState:', error);
      return null;
    }
  }

  /**
   * Update execution state
   */
  async updateExecutionState(
    executionId: string,
    updates: Partial<WorkflowExecution>
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map WorkflowExecution fields to database columns
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.current_state !== undefined) updateData.current_state = updates.current_state;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.output_data !== undefined) updateData.output_data = updates.output_data;
      if (updates.error_message !== undefined) updateData.error_message = updates.error_message;
      if (updates.retry_count !== undefined) updateData.retry_count = updates.retry_count;
      if (updates.completed_at !== undefined) {
        updateData.completed_at = updates.completed_at.toISOString();
      }

      const { error } = await supabase
        .from('workflow_executions')
        .update(updateData)
        .eq('id', executionId);

      if (error) {
        throw new WorkflowError(
          `Failed to update execution state: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          executionId,
          undefined,
          error
        );
      }

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error updating execution state',
        WorkflowErrorCode.NETWORK_ERROR,
        executionId,
        undefined,
        error
      );
    }
  }

  /**
   * Record execution event
   */
  async recordExecutionEvent(event: ExecutionEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('execution_events')
        .insert({
          id: event.id,
          execution_id: event.execution_id,
          event_type: event.event_type,
          state_id: event.state_id,
          action_id: event.action_id,
          event_data: event.event_data,
          correlation_id: event.correlation_id,
          causation_id: event.causation_id,
          duration_ms: event.duration_ms,
          timestamp: event.timestamp.toISOString()
        });

      if (error) {
        throw new WorkflowError(
          `Failed to record execution event: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          event.execution_id,
          undefined,
          error
        );
      }

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      // Don't throw on event recording errors - log and continue
      console.error('Failed to record execution event:', error);
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(executionId: string): Promise<ExecutionEvent[]> {
    try {
      const { data, error } = await supabase
        .from('execution_events')
        .select('*')
        .eq('execution_id', executionId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new WorkflowError(
          `Failed to load execution history: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          executionId,
          undefined,
          error
        );
      }

      return data.map(row => ({
        id: row.id,
        execution_id: row.execution_id,
        event_type: row.event_type,
        state_id: row.state_id,
        action_id: row.action_id,
        event_data: (row.event_data as Record<string, any>) || {},
        correlation_id: row.correlation_id,
        causation_id: row.causation_id,
        duration_ms: row.duration_ms,
        timestamp: new Date(row.timestamp)
      })) as ExecutionEvent[];

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error loading execution history',
        WorkflowErrorCode.NETWORK_ERROR,
        executionId,
        undefined,
        error
      );
    }
  }

  /**
   * Get executions by status
   */
  async getExecutionsByStatus(status: ExecutionStatus): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('status', status as any)
        .order('created_at', { ascending: false });

      if (error) {
        throw new WorkflowError(
          `Failed to load executions by status: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          undefined,
          error
        );
      }

      return data.map(this.mapRowToExecution);

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error loading executions by status',
        WorkflowErrorCode.NETWORK_ERROR,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Get user executions with progress tracking
   */
  async getUserExecutions(userId: string): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new WorkflowError(
          `Failed to load user executions: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          undefined,
          undefined,
          error
        );
      }

      return data.map(this.mapRowToExecution);

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error loading user executions',
        WorkflowErrorCode.NETWORK_ERROR,
        undefined,
        undefined,
        error
      );
    }
  }

  /**
   * Update student progress for educational milestones
   */
  async updateStudentProgress(progressUpdate: StudentProgressUpdate): Promise<void> {
    try {
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: progressUpdate.userId,
          module_id: progressUpdate.moduleId,
          workflow_execution_id: progressUpdate.executionId,
          progress_percentage: progressUpdate.progress,
          time_spent_minutes: progressUpdate.timeSpent,
          completed_sections: progressUpdate.completedSections,
          current_section: progressUpdate.currentSection,
          achievements: progressUpdate.achievements,
          performance_metrics: progressUpdate.performanceMetrics,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new WorkflowError(
          `Failed to update student progress: ${error.message}`,
          WorkflowErrorCode.CONFIGURATION_ERROR,
          progressUpdate.executionId,
          undefined,
          error
        );
      }

      // Notify progress listeners
      this.notifyProgressListeners(progressUpdate.userId, progressUpdate);

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Database error updating student progress',
        WorkflowErrorCode.NETWORK_ERROR,
        progressUpdate.executionId,
        undefined,
        error
      );
    }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  /**
   * Subscribe to progress updates
   */
  onProgressUpdate(
    userId: string, 
    listener: (progress: StudentProgressUpdate) => void
  ): () => void {
    if (!this.progressUpdateListeners.has(userId)) {
      this.progressUpdateListeners.set(userId, new Set());
    }
    this.progressUpdateListeners.get(userId)!.add(listener);

    return () => {
      const userListeners = this.progressUpdateListeners.get(userId);
      if (userListeners) {
        userListeners.delete(listener);
        if (userListeners.size === 0) {
          this.progressUpdateListeners.delete(userId);
        }
      }
    };
  }

  /**
   * Handle real-time state change events
   */
  private handleStateChange(payload: any): void {
    const event: StateChangeEvent = {
      executionId: payload.new.id,
      oldState: payload.old?.current_state,
      newState: payload.new.current_state,
      timestamp: new Date(payload.new.updated_at),
      userId: payload.new.user_id,
      data: payload.new
    };

    this.stateChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('State change listener error:', error);
      }
    });
  }

  /**
   * Handle real-time execution events
   */
  private handleExecutionEvent(payload: any): void {
    // Process execution events for analytics or notifications
    console.debug('Execution event received:', payload.new);
  }

  /**
   * Notify progress listeners
   */
  private notifyProgressListeners(userId: string, progress: StudentProgressUpdate): void {
    const listeners = this.progressUpdateListeners.get(userId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(progress);
        } catch (error) {
          console.error('Progress update listener error:', error);
        }
      });
    }
  }

  /**
   * Map database row to WorkflowExecution
   */
  private mapRowToExecution(row: any): WorkflowExecution {
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      user_id: row.user_id,
      status: row.status as ExecutionStatus,
      current_state: row.current_state,
      variables: row.variables || {},
      input_data: row.input_data,
      output_data: row.output_data,
      execution_history: [], // Loaded separately
      error_message: row.error_message,
      retry_count: row.retry_count || 0,
      parent_execution_id: row.parent_execution_id,
      correlation_id: row.correlation_id,
      started_at: row.started_at ? new Date(row.started_at) : new Date(),
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  /**
   * Update execution variables (method expected by EducationalWorkflowService)
   */
  async updateExecutionVariables(
    executionId: string,
    variables: Record<string, any>
  ): Promise<void> {
    try {
      const execution = await this.loadExecutionState(executionId);
      if (!execution) {
        throw new WorkflowError(
          `Execution not found: ${executionId}`,
          WorkflowErrorCode.EXECUTION_NOT_FOUND,
          executionId
        );
      }

      const updatedVariables = {
        ...execution.variables,
        ...variables
      };

      await this.updateExecutionState(executionId, {
        variables: updatedVariables,
        updated_at: new Date()
      });

    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        'Failed to update execution variables',
        WorkflowErrorCode.CONFIGURATION_ERROR,
        executionId,
        undefined,
        error
      );
    }
  }

  /**
   * Get execution (alias for loadExecutionState to match expected interface)
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    return await this.loadExecutionState(executionId);
  }

  /**
   * Update execution (alias for updateExecutionState to match expected interface)
   */
  async updateExecution(
    executionId: string,
    updates: Partial<WorkflowExecution>
  ): Promise<WorkflowExecution> {
    await this.updateExecutionState(executionId, updates);
    const updated = await this.loadExecutionState(executionId);
    if (!updated) {
      throw new WorkflowError(
        `Failed to retrieve updated execution: ${executionId}`,
        WorkflowErrorCode.EXECUTION_NOT_FOUND,
        executionId
      );
    }
    return updated;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.realtimeChannel) {
      await this.realtimeChannel.unsubscribe();
    }
    this.stateChangeListeners.clear();
    this.progressUpdateListeners.clear();
  }
}

/**
 * Student progress update interface for educational workflows
 */
export interface StudentProgressUpdate {
  userId: string;
  moduleId: string;
  executionId: string;
  progress: number;
  timeSpent: number;
  completedSections: string[];
  currentSection?: string;
  achievements?: any[];
  performanceMetrics?: any;
}