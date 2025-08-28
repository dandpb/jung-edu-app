/**
 * Execution Strategy Interface and Implementations for jaqEdu Workflow Engine
 * Defines different strategies for executing workflows with pluggable architecture
 */

import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowState,
  ExecutionContext,
  PluginResult,
  WorkflowError,
  WorkflowErrorCode,
  ExecutionStatus
} from '../../types/workflow';
import { WorkflowNode } from './WorkflowNode';
import { EventSystem } from './EventSystem';

// ============================================================================
// Core Execution Strategy Interface
// ============================================================================

/**
 * Base interface for all execution strategies
 */
export interface ExecutionStrategy {
  readonly name: string;
  readonly description: string;
  readonly supportsConcurrency: boolean;
  readonly maxConcurrency?: number;

  /**
   * Execute the workflow with this strategy
   */
  execute(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<ExecutionResult>;

  /**
   * Validate if this strategy can handle the workflow
   */
  canExecute(workflow: WorkflowDefinition): boolean;

  /**
   * Estimate execution time and resources
   */
  estimate(workflow: WorkflowDefinition): ExecutionEstimate;

  /**
   * Cleanup strategy resources
   */
  cleanup?(): Promise<void>;
}

/**
 * Result of execution strategy
 */
export interface ExecutionResult {
  status: ExecutionStatus;
  outputData?: any;
  errorMessage?: string;
  executionStats: ExecutionStats;
  stateHistory: StateExecutionRecord[];
}

/**
 * Execution performance statistics
 */
export interface ExecutionStats {
  startTime: Date;
  endTime: Date;
  duration: number;
  statesExecuted: number;
  actionsExecuted: number;
  retries: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Execution time and resource estimation
 */
export interface ExecutionEstimate {
  estimatedDuration: number; // milliseconds
  estimatedMemory: number; // bytes
  complexity: 'low' | 'medium' | 'high';
  parallelizable: boolean;
  resourceRequirements: string[];
}

/**
 * State execution record for audit trail
 */
export interface StateExecutionRecord {
  stateId: string;
  stateName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'skipped';
  actionResults: PluginResult[];
  errorMessage?: string;
}

// ============================================================================
// Sequential Execution Strategy
// ============================================================================

/**
 * Sequential execution strategy - executes states one by one
 * Best for simple workflows where order matters
 */
export class SequentialExecutionStrategy implements ExecutionStrategy {
  readonly name = 'sequential';
  readonly description = 'Executes workflow states sequentially, one at a time';
  readonly supportsConcurrency = false;

  /**
   * Execute workflow states sequentially
   */
  async execute(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<ExecutionResult> {
    const stats: ExecutionStats = {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      statesExecuted: 0,
      actionsExecuted: 0,
      retries: 0
    };

    const stateHistory: StateExecutionRecord[] = [];
    let currentState = this.findInitialState(workflow);
    let outputData: any = null;

    try {
      eventSystem.emit('execution.started', {
        executionId: execution.id,
        strategy: this.name,
        workflowId: workflow.id
      });

      while (currentState && !currentState.isFinal) {
        const stateRecord = await this.executeStateSequentially(
          currentState,
          workflow,
          execution,
          context,
          eventSystem
        );

        stateHistory.push(stateRecord);
        stats.statesExecuted++;
        stats.actionsExecuted += stateRecord.actionResults.length;

        if (stateRecord.status === 'failed') {
          throw new WorkflowError(
            `State execution failed: ${stateRecord.errorMessage}`,
            WorkflowErrorCode.EXECUTION_FAILED,
            execution.id,
            workflow.id
          );
        }

        // Find next state based on transitions
        currentState = this.findNextState(workflow, currentState, context, stateRecord.actionResults);
      }

      // Execute final state if reached
      if (currentState && currentState.isFinal) {
        const finalStateRecord = await this.executeStateSequentially(
          currentState,
          workflow,
          execution,
          context,
          eventSystem
        );

        stateHistory.push(finalStateRecord);
        stats.statesExecuted++;
        stats.actionsExecuted += finalStateRecord.actionResults.length;

        outputData = finalStateRecord.actionResults
          .map(r => r.data)
          .filter(d => d !== undefined);
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      eventSystem.emit('execution.completed', {
        executionId: execution.id,
        duration: stats.duration,
        statesExecuted: stats.statesExecuted
      });

      return {
        status: 'completed',
        outputData,
        executionStats: stats,
        stateHistory
      };

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      eventSystem.emit('execution.failed', {
        executionId: execution.id,
        error: error instanceof Error ? error.message : String(error),
        duration: stats.duration
      });

      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
        executionStats: stats,
        stateHistory
      };
    }
  }

  /**
   * Execute a single state sequentially
   */
  private async executeStateSequentially(
    state: WorkflowState,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<StateExecutionRecord> {
    const startTime = new Date();
    const actionResults: PluginResult[] = [];

    try {
      eventSystem.emit('state.entered', {
        executionId: execution.id,
        stateId: state.id,
        stateName: state.name
      });

      // Execute each action in sequence
      for (const action of state.actions) {
        const result = await this.executeAction(action, context, eventSystem);
        actionResults.push(result);

        if (!result.success && !action.retryPolicy?.enabled) {
          throw new WorkflowError(
            `Action failed: ${result.error}`,
            WorkflowErrorCode.PLUGIN_ERROR,
            execution.id,
            workflow.id
          );
        }
      }

      const endTime = new Date();
      const record: StateExecutionRecord = {
        stateId: state.id,
        stateName: state.name,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        status: 'completed',
        actionResults
      };

      eventSystem.emit('state.completed', {
        executionId: execution.id,
        stateId: state.id,
        duration: record.duration
      });

      return record;

    } catch (error) {
      const endTime = new Date();
      return {
        stateId: state.id,
        stateName: state.name,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        status: 'failed',
        actionResults,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  canExecute(workflow: WorkflowDefinition): boolean {
    // Sequential strategy can execute any workflow
    return workflow.states.length > 0;
  }

  estimate(workflow: WorkflowDefinition): ExecutionEstimate {
    const stateCount = workflow.states.length;
    const actionCount = workflow.states.reduce((sum, state) => sum + state.actions.length, 0);

    return {
      estimatedDuration: (stateCount * 1000) + (actionCount * 500), // rough estimate
      estimatedMemory: (stateCount + actionCount) * 1024, // KB per state/action
      complexity: stateCount > 10 ? 'high' : stateCount > 5 ? 'medium' : 'low',
      parallelizable: false,
      resourceRequirements: ['cpu']
    };
  }

  private findInitialState(workflow: WorkflowDefinition): WorkflowState | null {
    return workflow.states.find(state => state.isInitial) || null;
  }

  private findNextState(
    workflow: WorkflowDefinition,
    currentState: WorkflowState,
    context: ExecutionContext,
    actionResults: PluginResult[]
  ): WorkflowState | null {
    const transitions = workflow.transitions
      .filter(t => t.from === currentState.id)
      .sort((a, b) => b.priority - a.priority);

    for (const transition of transitions) {
      if (this.evaluateTransitionCondition(transition.condition, context, actionResults)) {
        return workflow.states.find(s => s.id === transition.to) || null;
      }
    }

    return null;
  }

  private evaluateTransitionCondition(
    condition: string | undefined,
    context: ExecutionContext,
    actionResults: PluginResult[]
  ): boolean {
    if (!condition) return true;

    try {
      // Simple condition evaluation - in production, use a more secure parser
      const variables: Record<string, any> = {};
      context.variables.forEach((value, key) => {
        variables[key] = value;
      });

      // Add action results to evaluation context
      variables.lastActionSuccess = actionResults.length > 0 ? actionResults[actionResults.length - 1].success : true;
      variables.actionResults = actionResults;

      return new Function('variables', `with(variables) { return ${condition}; }`)(variables);
    } catch (error) {
      context.logger.warn(`Condition evaluation failed: ${condition}`, error as Error);
      return false;
    }
  }

  private async executeAction(
    action: any,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<PluginResult> {
    // This would integrate with the actual plugin execution system
    // For now, return a mock success result
    return { success: true, data: `Action ${action.name} executed` };
  }
}

// ============================================================================
// Parallel Execution Strategy
// ============================================================================

/**
 * Parallel execution strategy - executes independent states concurrently
 * Best for workflows with parallel branches
 */
export class ParallelExecutionStrategy implements ExecutionStrategy {
  readonly name = 'parallel';
  readonly description = 'Executes independent workflow states in parallel';
  readonly supportsConcurrency = true;
  readonly maxConcurrency = 5;

  private semaphore: number = 0;

  async execute(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<ExecutionResult> {
    const stats: ExecutionStats = {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      statesExecuted: 0,
      actionsExecuted: 0,
      retries: 0
    };

    const stateHistory: StateExecutionRecord[] = [];

    try {
      eventSystem.emit('execution.started', {
        executionId: execution.id,
        strategy: this.name,
        workflowId: workflow.id
      });

      // Identify parallel execution groups
      const executionGroups = this.identifyParallelGroups(workflow);
      let outputData: any = null;

      for (const group of executionGroups) {
        if (group.length === 1) {
          // Single state - execute normally
          const stateRecord = await this.executeStateSequentially(
            group[0],
            workflow,
            execution,
            context,
            eventSystem
          );
          stateHistory.push(stateRecord);
          stats.statesExecuted++;
        } else {
          // Multiple states - execute in parallel
          const parallelResults = await Promise.allSettled(
            group.map(state => 
              this.executeStateWithLimit(
                state,
                workflow,
                execution,
                context,
                eventSystem
              )
            )
          );

          parallelResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              stateHistory.push(result.value);
              stats.statesExecuted++;
            } else {
              const failedState = group[index];
              stateHistory.push({
                stateId: failedState.id,
                stateName: failedState.name,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                status: 'failed',
                actionResults: [],
                errorMessage: result.reason instanceof Error ? result.reason.message : String(result.reason)
              });
            }
          });
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      stats.actionsExecuted = stateHistory.reduce((sum, record) => sum + record.actionResults.length, 0);

      eventSystem.emit('execution.completed', {
        executionId: execution.id,
        duration: stats.duration,
        statesExecuted: stats.statesExecuted
      });

      // Check if any states failed
      const failedStates = stateHistory.filter(record => record.status === 'failed');
      if (failedStates.length > 0) {
        return {
          status: 'failed',
          errorMessage: `${failedStates.length} states failed`,
          executionStats: stats,
          stateHistory
        };
      }

      outputData = stateHistory
        .flatMap(record => record.actionResults)
        .map(result => result.data)
        .filter(d => d !== undefined);

      return {
        status: 'completed',
        outputData,
        executionStats: stats,
        stateHistory
      };

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      eventSystem.emit('execution.failed', {
        executionId: execution.id,
        error: error instanceof Error ? error.message : String(error),
        duration: stats.duration
      });

      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
        executionStats: stats,
        stateHistory
      };
    }
  }

  canExecute(workflow: WorkflowDefinition): boolean {
    // Check if workflow has parallel potential
    return this.identifyParallelGroups(workflow).some(group => group.length > 1);
  }

  estimate(workflow: WorkflowDefinition): ExecutionEstimate {
    const groups = this.identifyParallelGroups(workflow);
    const maxGroupSize = Math.max(...groups.map(g => g.length));
    const totalActions = workflow.states.reduce((sum, state) => sum + state.actions.length, 0);

    // Parallel execution reduces time but increases memory usage
    return {
      estimatedDuration: (groups.length * 1000) + (totalActions * 300),
      estimatedMemory: maxGroupSize * 2048, // More memory for concurrency
      complexity: groups.length > 5 ? 'high' : 'medium',
      parallelizable: true,
      resourceRequirements: ['cpu', 'memory']
    };
  }

  private identifyParallelGroups(workflow: WorkflowDefinition): WorkflowState[][] {
    // Simplified parallel group identification
    // In production, this would use graph analysis to find independent branches
    const groups: WorkflowState[][] = [];
    const processed = new Set<string>();
    
    for (const state of workflow.states) {
      if (!processed.has(state.id)) {
        const group = [state];
        processed.add(state.id);
        
        // Find states that can run in parallel (no dependencies)
        const parallelCandidates = workflow.states.filter(s => 
          !processed.has(s.id) && 
          !this.hasDependency(workflow, state, s) &&
          !this.hasDependency(workflow, s, state)
        );
        
        group.push(...parallelCandidates.slice(0, this.maxConcurrency - 1));
        parallelCandidates.forEach(s => processed.add(s.id));
        
        groups.push(group);
      }
    }
    
    return groups;
  }

  private hasDependency(
    workflow: WorkflowDefinition,
    from: WorkflowState,
    to: WorkflowState
  ): boolean {
    return workflow.transitions.some(t => t.from === from.id && t.to === to.id);
  }

  private async executeStateWithLimit(
    state: WorkflowState,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<StateExecutionRecord> {
    // Implement semaphore to limit concurrent executions
    while (this.semaphore >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.semaphore++;
    
    try {
      return await this.executeStateSequentially(state, workflow, execution, context, eventSystem);
    } finally {
      this.semaphore--;
    }
  }

  private async executeStateSequentially(
    state: WorkflowState,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<StateExecutionRecord> {
    // Reuse sequential execution logic for individual states
    const sequential = new SequentialExecutionStrategy();
    return (sequential as any).executeStateSequentially(state, workflow, execution, context, eventSystem);
  }

  async cleanup(): Promise<void> {
    // Wait for all pending executions to complete
    while (this.semaphore > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// ============================================================================
// Adaptive Execution Strategy
// ============================================================================

/**
 * Adaptive execution strategy - dynamically chooses between sequential and parallel
 * Based on workflow characteristics and runtime conditions
 */
export class AdaptiveExecutionStrategy implements ExecutionStrategy {
  readonly name = 'adaptive';
  readonly description = 'Dynamically adapts execution strategy based on workflow characteristics';
  readonly supportsConcurrency = true;
  readonly maxConcurrency = 10;

  private sequentialStrategy = new SequentialExecutionStrategy();
  private parallelStrategy = new ParallelExecutionStrategy();

  async execute(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    context: ExecutionContext,
    eventSystem: EventSystem
  ): Promise<ExecutionResult> {
    // Analyze workflow to choose best strategy
    const strategy = this.selectOptimalStrategy(workflow, context);
    
    eventSystem.emit('strategy.selected', {
      executionId: execution.id,
      selectedStrategy: strategy.name,
      reason: this.getSelectionReason(workflow)
    });
    
    return await strategy.execute(workflow, execution, context, eventSystem);
  }

  canExecute(workflow: WorkflowDefinition): boolean {
    // Adaptive strategy can handle any workflow
    return workflow.states.length > 0;
  }

  estimate(workflow: WorkflowDefinition): ExecutionEstimate {
    const sequentialEstimate = this.sequentialStrategy.estimate(workflow);
    const parallelEstimate = this.parallelStrategy.estimate(workflow);
    
    // Return the better estimate based on workflow characteristics
    const strategy = this.selectOptimalStrategy(workflow, null);
    return strategy === this.parallelStrategy ? parallelEstimate : sequentialEstimate;
  }

  private selectOptimalStrategy(
    workflow: WorkflowDefinition, 
    context: ExecutionContext | null
  ): ExecutionStrategy {
    const metrics = this.analyzeWorkflow(workflow);
    
    // Decision criteria:
    // 1. If high parallelizability and sufficient resources -> Parallel
    // 2. If complex dependencies -> Sequential  
    // 3. If small workflow -> Sequential
    // 4. Default -> Sequential
    
    if (metrics.parallelizability > 0.6 && 
        metrics.stateCount > 5 && 
        (!context || this.hasAdequateResources(context))) {
      return this.parallelStrategy;
    }
    
    return this.sequentialStrategy;
  }

  private analyzeWorkflow(workflow: WorkflowDefinition): WorkflowMetrics {
    const stateCount = workflow.states.length;
    const transitionCount = workflow.transitions.length;
    const actionCount = workflow.states.reduce((sum, state) => sum + state.actions.length, 0);
    
    // Calculate parallelizability score (0-1)
    const independentStates = workflow.states.filter(state => {
      const hasIncoming = workflow.transitions.some(t => t.to === state.id);
      const hasOutgoing = workflow.transitions.some(t => t.from === state.id);
      return !hasIncoming || !hasOutgoing;
    }).length;
    
    const parallelizability = stateCount > 0 ? independentStates / stateCount : 0;
    
    // Calculate complexity score
    const complexity = (transitionCount * 2 + actionCount) / stateCount;
    
    return {
      stateCount,
      transitionCount,
      actionCount,
      parallelizability,
      complexity,
      avgActionsPerState: stateCount > 0 ? actionCount / stateCount : 0
    };
  }

  private hasAdequateResources(context: ExecutionContext): boolean {
    // In a real implementation, this would check system resources
    // For now, assume resources are adequate if we're not at the limit
    return true; // Simplified assumption
  }

  private getSelectionReason(workflow: WorkflowDefinition): string {
    const metrics = this.analyzeWorkflow(workflow);
    
    if (metrics.parallelizability > 0.6) {
      return `High parallelizability (${(metrics.parallelizability * 100).toFixed(1)}%)`;
    }
    
    if (metrics.stateCount <= 5) {
      return 'Small workflow - sequential execution more efficient';
    }
    
    if (metrics.complexity > 3) {
      return 'High complexity - sequential execution safer';
    }
    
    return 'Default sequential strategy selected';
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.sequentialStrategy.cleanup?.(),
      this.parallelStrategy.cleanup?.()
    ]);
  }
}

/**
 * Workflow analysis metrics
 */
interface WorkflowMetrics {
  stateCount: number;
  transitionCount: number;
  actionCount: number;
  parallelizability: number; // 0-1 score
  complexity: number;
  avgActionsPerState: number;
}

// ============================================================================
// Strategy Factory
// ============================================================================

/**
 * Factory for creating execution strategies
 */
export class ExecutionStrategyFactory {
  private static strategies = new Map<string, () => ExecutionStrategy>([
    ['sequential', () => new SequentialExecutionStrategy()],
    ['parallel', () => new ParallelExecutionStrategy()],
    ['adaptive', () => new AdaptiveExecutionStrategy()]
  ]);

  /**
   * Create an execution strategy by name
   */
  static create(strategyName: string): ExecutionStrategy {
    const creator = this.strategies.get(strategyName.toLowerCase());
    if (!creator) {
      throw new WorkflowError(
        `Unknown execution strategy: ${strategyName}`,
        WorkflowErrorCode.CONFIGURATION_ERROR
      );
    }
    return creator();
  }

  /**
   * Register a custom execution strategy
   */
  static register(name: string, creator: () => ExecutionStrategy): void {
    this.strategies.set(name.toLowerCase(), creator);
  }

  /**
   * Get all available strategy names
   */
  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get recommended strategy for a workflow
   */
  static recommend(workflow: WorkflowDefinition): string {
    const adaptive = new AdaptiveExecutionStrategy();
    const estimate = adaptive.estimate(workflow);
    
    if (estimate.parallelizable && estimate.complexity !== 'low') {
      return 'parallel';
    }
    
    if (estimate.complexity === 'high') {
      return 'adaptive';
    }
    
    return 'sequential';
  }
}