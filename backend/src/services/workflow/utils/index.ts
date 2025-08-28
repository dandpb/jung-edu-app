/**
 * Workflow Utilities for jaqEdu Educational Platform
 * Helper functions and utilities for workflow management
 */

import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowVariable,
  ExecutionStatus,
  WorkflowCategory,
  StateType,
  ActionType
} from '../../../types/workflow';

/**
 * Workflow definition builder for creating workflows programmatically
 */
export class WorkflowBuilder {
  private definition: Partial<WorkflowDefinition>;

  constructor(name: string, description: string, category: WorkflowCategory) {
    this.definition = {
      name,
      description,
      category,
      version: '1.0.0',
      states: [],
      transitions: [],
      variables: [],
      metadata: {
        tags: [],
        author: '',
        dependencies: [],
        permissions_required: []
      },
      is_active: true
    };
  }

  /**
   * Add a state to the workflow
   */
  addState(
    id: string,
    name: string,
    type: StateType,
    options: {
      isInitial?: boolean;
      isFinal?: boolean;
      actions?: any[];
      timeout?: number;
    } = {}
  ): WorkflowBuilder {
    this.definition.states!.push({
      id,
      name,
      type,
      isInitial: options.isInitial || false,
      isFinal: options.isFinal || false,
      actions: options.actions || [],
      timeout: options.timeout
    });
    return this;
  }

  /**
   * Add a transition between states
   */
  addTransition(
    id: string,
    from: string,
    to: string,
    options: {
      condition?: string;
      guard?: string;
      actions?: any[];
      priority?: number;
    } = {}
  ): WorkflowBuilder {
    this.definition.transitions!.push({
      id,
      from,
      to,
      condition: options.condition,
      guard: options.guard,
      actions: options.actions,
      priority: options.priority || 0
    });
    return this;
  }

  /**
   * Add a variable to the workflow
   */
  addVariable(
    name: string,
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'json',
    options: {
      defaultValue?: any;
      required?: boolean;
      description?: string;
    } = {}
  ): WorkflowBuilder {
    this.definition.variables!.push({
      name,
      type,
      defaultValue: options.defaultValue,
      required: options.required || false,
      description: options.description
    });
    return this;
  }

  /**
   * Set trigger configuration
   */
  setTrigger(
    type: 'event' | 'schedule' | 'manual' | 'webhook' | 'database_change' | 'user_action',
    event: string,
    options: {
      conditions?: any[];
      schedule?: any;
      immediate?: boolean;
      enabled?: boolean;
    } = {}
  ): WorkflowBuilder {
    this.definition.trigger = {
      type,
      event,
      conditions: options.conditions || [],
      schedule: options.schedule,
      immediate: options.immediate || false,
      enabled: options.enabled !== false
    };
    return this;
  }

  /**
   * Add metadata
   */
  addMetadata(metadata: Partial<any>): WorkflowBuilder {
    this.definition.metadata = {
      ...this.definition.metadata,
      ...metadata
    };
    return this;
  }

  /**
   * Build the workflow definition
   */
  build(): Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'> {
    // Validate required fields
    if (!this.definition.name) {
      throw new Error('Workflow name is required');
    }
    if (!this.definition.states || this.definition.states.length === 0) {
      throw new Error('Workflow must have at least one state');
    }

    const hasInitial = this.definition.states.some(s => s.isInitial);
    if (!hasInitial) {
      throw new Error('Workflow must have an initial state');
    }

    const hasFinal = this.definition.states.some(s => s.isFinal);
    if (!hasFinal) {
      throw new Error('Workflow must have a final state');
    }

    return this.definition as Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
  }
}

/**
 * Educational workflow templates
 */
export class EducationalWorkflowTemplates {
  /**
   * Create a student progress tracking workflow
   */
  static createProgressTrackingWorkflow(): WorkflowBuilder {
    return new WorkflowBuilder(
      'Student Progress Tracking',
      'Tracks student progress through educational modules',
      'progress_tracking'
    )
    .setTrigger('user_action', 'module_started', { immediate: true })
    .addVariable('userId', 'string', { required: true })
    .addVariable('moduleId', 'string', { required: true })
    .addVariable('currentProgress', 'number', { defaultValue: 0 })
    .addState('start', 'Initialize Tracking', 'task', { 
      isInitial: true,
      actions: [{
        id: 'init_progress',
        type: 'execute_plugin' as ActionType,
        name: 'Initialize Progress',
        plugin: 'student-progress',
        config: { action: 'initialize' }
      }]
    })
    .addState('track_sections', 'Track Section Progress', 'task', {
      actions: [{
        id: 'update_section_progress',
        type: 'execute_plugin' as ActionType,
        name: 'Update Section Progress',
        plugin: 'student-progress',
        config: { action: 'update_section' }
      }]
    })
    .addState('check_completion', 'Check Module Completion', 'decision', {
      actions: [{
        id: 'check_progress',
        type: 'condition_check' as ActionType,
        name: 'Check if Module Complete',
        config: { condition: 'currentProgress >= 100' }
      }]
    })
    .addState('complete', 'Mark Complete', 'task', {
      isFinal: true,
      actions: [{
        id: 'mark_complete',
        type: 'execute_plugin' as ActionType,
        name: 'Mark Module Complete',
        plugin: 'student-progress',
        config: { action: 'complete' }
      }]
    })
    .addTransition('start_to_track', 'start', 'track_sections')
    .addTransition('track_to_check', 'track_sections', 'check_completion')
    .addTransition('check_to_track', 'check_completion', 'track_sections', {
      condition: 'currentProgress < 100'
    })
    .addTransition('check_to_complete', 'check_completion', 'complete', {
      condition: 'currentProgress >= 100'
    });
  }

  /**
   * Create an adaptive learning workflow
   */
  static createAdaptiveLearningWorkflow(): WorkflowBuilder {
    return new WorkflowBuilder(
      'Adaptive Learning Path',
      'Adjusts learning content based on student performance',
      'adaptive_learning'
    )
    .setTrigger('user_action', 'learning_session_started')
    .addVariable('userId', 'string', { required: true })
    .addVariable('currentPerformance', 'number', { defaultValue: 0 })
    .addVariable('learningStyle', 'object')
    .addState('assess_performance', 'Assess Current Performance', 'task', {
      isInitial: true,
      actions: [{
        id: 'analyze_performance',
        type: 'execute_plugin' as ActionType,
        name: 'Analyze Performance',
        plugin: 'adaptive-content',
        config: { action: 'analyze' }
      }]
    })
    .addState('select_content', 'Select Adaptive Content', 'task', {
      actions: [{
        id: 'choose_content',
        type: 'execute_plugin' as ActionType,
        name: 'Choose Content Variant',
        plugin: 'adaptive-content',
        config: { action: 'select' }
      }]
    })
    .addState('deliver_content', 'Deliver Content', 'task', {
      actions: [{
        id: 'present_content',
        type: 'user_task' as ActionType,
        name: 'Present Content to Student',
        config: { waitForCompletion: true }
      }]
    })
    .addState('evaluate_understanding', 'Evaluate Understanding', 'task', {
      actions: [{
        id: 'quick_assessment',
        type: 'execute_plugin' as ActionType,
        name: 'Quick Assessment',
        plugin: 'assessment',
        config: { type: 'comprehension_check' }
      }]
    })
    .addState('complete', 'Session Complete', 'end', { isFinal: true })
    .addTransition('assess_to_select', 'assess_performance', 'select_content')
    .addTransition('select_to_deliver', 'select_content', 'deliver_content')
    .addTransition('deliver_to_evaluate', 'deliver_content', 'evaluate_understanding')
    .addTransition('evaluate_to_complete', 'evaluate_understanding', 'complete', {
      condition: 'understanding_score >= 70'
    })
    .addTransition('evaluate_to_select', 'evaluate_understanding', 'select_content', {
      condition: 'understanding_score < 70'
    });
  }

  /**
   * Create an assessment workflow
   */
  static createAssessmentWorkflow(): WorkflowBuilder {
    return new WorkflowBuilder(
      'Educational Assessment',
      'Manages quizzes and assessments with adaptive difficulty',
      'assessment'
    )
    .setTrigger('user_action', 'assessment_started')
    .addVariable('userId', 'string', { required: true })
    .addVariable('assessmentId', 'string', { required: true })
    .addVariable('currentScore', 'number', { defaultValue: 0 })
    .addVariable('questionIndex', 'number', { defaultValue: 0 })
    .addState('start_assessment', 'Start Assessment', 'task', {
      isInitial: true,
      actions: [{
        id: 'init_assessment',
        type: 'execute_plugin' as ActionType,
        name: 'Initialize Assessment',
        plugin: 'assessment',
        config: { action: 'start' }
      }]
    })
    .addState('present_question', 'Present Question', 'task', {
      actions: [{
        id: 'show_question',
        type: 'execute_plugin' as ActionType,
        name: 'Show Question',
        plugin: 'assessment',
        config: { action: 'present_question' }
      }]
    })
    .addState('process_answer', 'Process Answer', 'task', {
      actions: [{
        id: 'evaluate_answer',
        type: 'execute_plugin' as ActionType,
        name: 'Evaluate Answer',
        plugin: 'assessment',
        config: { action: 'process_answer' }
      }]
    })
    .addState('check_completion', 'Check Assessment Completion', 'decision')
    .addState('calculate_results', 'Calculate Final Results', 'task', {
      actions: [{
        id: 'final_score',
        type: 'execute_plugin' as ActionType,
        name: 'Calculate Final Score',
        plugin: 'assessment',
        config: { action: 'calculate_score' }
      }]
    })
    .addState('complete', 'Assessment Complete', 'end', { isFinal: true })
    .addTransition('start_to_question', 'start_assessment', 'present_question')
    .addTransition('question_to_process', 'present_question', 'process_answer')
    .addTransition('process_to_check', 'process_answer', 'check_completion')
    .addTransition('check_to_question', 'check_completion', 'present_question', {
      condition: 'hasMoreQuestions === true'
    })
    .addTransition('check_to_results', 'check_completion', 'calculate_results', {
      condition: 'hasMoreQuestions === false'
    })
    .addTransition('results_to_complete', 'calculate_results', 'complete');
  }
}

/**
 * Workflow execution utilities
 */
export class WorkflowExecutionUtils {
  /**
   * Format execution duration
   */
  static formatDuration(startTime: Date, endTime?: Date): string {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / (1000 * 60)) % 60;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Calculate execution success rate
   */
  static calculateSuccessRate(executions: WorkflowExecution[]): number {
    if (executions.length === 0) return 0;
    
    const successful = executions.filter(exec => exec.status === 'completed').length;
    return (successful / executions.length) * 100;
  }

  /**
   * Get execution status summary
   */
  static getExecutionSummary(executions: WorkflowExecution[]): Record<ExecutionStatus, number> {
    const summary: Record<ExecutionStatus, number> = {
      pending: 0,
      running: 0,
      waiting: 0,
      paused: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    executions.forEach(exec => {
      summary[exec.status]++;
    });

    return summary;
  }

  /**
   * Find bottleneck states in workflow executions
   */
  static findBottleneckStates(executions: WorkflowExecution[]): Array<{ state: string; avgDuration: number; count: number }> {
    const stateDurations = new Map<string, number[]>();

    executions.forEach(exec => {
      exec.execution_history.forEach(event => {
        if (event.event_type === 'state.entered' && event.duration_ms) {
          if (!stateDurations.has(event.state_id!)) {
            stateDurations.set(event.state_id!, []);
          }
          stateDurations.get(event.state_id!)!.push(event.duration_ms);
        }
      });
    });

    const bottlenecks: Array<{ state: string; avgDuration: number; count: number }> = [];

    stateDurations.forEach((durations, state) => {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      bottlenecks.push({
        state,
        avgDuration,
        count: durations.length
      });
    });

    return bottlenecks.sort((a, b) => b.avgDuration - a.avgDuration);
  }
}

/**
 * Workflow validation utilities
 */
export class WorkflowValidator {
  /**
   * Validate workflow definition structure
   */
  static validateDefinition(workflow: WorkflowDefinition): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!workflow.name?.trim()) {
      errors.push('Workflow name is required');
    }

    if (!workflow.states || workflow.states.length === 0) {
      errors.push('Workflow must have at least one state');
    }

    // Check for initial state
    const initialStates = workflow.states?.filter(s => s.isInitial) || [];
    if (initialStates.length === 0) {
      errors.push('Workflow must have exactly one initial state');
    } else if (initialStates.length > 1) {
      errors.push('Workflow must have exactly one initial state');
    }

    // Check for final state
    const finalStates = workflow.states?.filter(s => s.isFinal) || [];
    if (finalStates.length === 0) {
      errors.push('Workflow must have at least one final state');
    }

    // Validate transitions
    workflow.transitions?.forEach((transition, index) => {
      const fromState = workflow.states?.find(s => s.id === transition.from);
      const toState = workflow.states?.find(s => s.id === transition.to);

      if (!fromState) {
        errors.push(`Transition ${index}: From state '${transition.from}' not found`);
      }
      if (!toState) {
        errors.push(`Transition ${index}: To state '${transition.to}' not found`);
      }
    });

    // Validate variables
    workflow.variables?.forEach((variable, index) => {
      if (!variable.name?.trim()) {
        errors.push(`Variable ${index}: Name is required`);
      }
      if (!variable.type) {
        errors.push(`Variable ${index}: Type is required`);
      }
    });

    return errors;
  }

  /**
   * Check if workflow is reachable (all states can be reached)
   */
  static validateReachability(workflow: WorkflowDefinition): string[] {
    const errors: string[] = [];
    const reachableStates = new Set<string>();
    const initialState = workflow.states?.find(s => s.isInitial);

    if (!initialState) {
      return ['No initial state found'];
    }

    // Depth-first search to find reachable states
    const stack = [initialState.id];
    reachableStates.add(initialState.id);

    while (stack.length > 0) {
      const currentState = stack.pop()!;
      const transitions = workflow.transitions?.filter(t => t.from === currentState) || [];

      transitions.forEach(transition => {
        if (!reachableStates.has(transition.to)) {
          reachableStates.add(transition.to);
          stack.push(transition.to);
        }
      });
    }

    // Check for unreachable states
    workflow.states?.forEach(state => {
      if (!reachableStates.has(state.id)) {
        errors.push(`State '${state.name}' (${state.id}) is unreachable`);
      }
    });

    return errors;
  }
}

// Export utility classes
export {
  WorkflowBuilder,
  EducationalWorkflowTemplates,
  WorkflowExecutionUtils,
  WorkflowValidator
};