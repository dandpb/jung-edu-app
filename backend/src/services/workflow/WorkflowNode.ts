/**
 * Workflow Node Base Class and Concrete Implementations for jaqEdu
 * Defines the node hierarchy for workflow execution with educational context
 */

import {
  WorkflowAction,
  ExecutionContext,
  PluginResult,
  WorkflowError,
  WorkflowErrorCode,
  RetryPolicy
} from '../../types/workflow';
import { EventSystem } from './EventSystem';

// ============================================================================
// Base WorkflowNode Abstract Class
// ============================================================================

/**
 * Abstract base class for all workflow nodes
 * Implements common functionality and defines the contract for node execution
 */
export abstract class WorkflowNode {
  protected id: string;
  protected name: string;
  protected description?: string;
  protected timeout?: number;
  protected retryPolicy?: RetryPolicy;
  protected metadata: Record<string, any> = {};
  protected eventSystem?: EventSystem;

  constructor(
    id: string, 
    name: string, 
    options: WorkflowNodeOptions = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = options.description;
    this.timeout = options.timeout;
    this.retryPolicy = options.retryPolicy;
    this.metadata = options.metadata || {};
    this.eventSystem = options.eventSystem;
  }

  /**
   * Abstract method that must be implemented by concrete node types
   */
  abstract execute(
    context: ExecutionContext,
    input?: any
  ): Promise<NodeExecutionResult>;

  /**
   * Validate node configuration
   */
  abstract validate(): ValidationResult;

  /**
   * Get node type identifier
   */
  abstract getType(): string;

  /**
   * Get node execution estimate
   */
  getEstimate(): NodeEstimate {
    return {
      estimatedDuration: this.timeout || 30000,
      resourceIntensive: false,
      canParallelize: true,
      dependencies: []
    };
  }

  /**
   * Execute with timeout and retry logic
   */
  protected async executeWithTimeout(
    executor: () => Promise<NodeExecutionResult>,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const timeoutMs = this.timeout || 30000;
    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = this.retryPolicy?.maxAttempts || 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        this.emitEvent('node.execution.started', {
          nodeId: this.id,
          nodeName: this.name,
          attempt: attempts
        });

        const result = await Promise.race([
          executor(),
          this.createTimeoutPromise(timeoutMs)
        ]);

        this.emitEvent('node.execution.completed', {
          nodeId: this.id,
          success: result.success,
          attempt: attempts
        });

        return result;

      } catch (error) {
        lastError = error as Error;
        
        this.emitEvent('node.execution.failed', {
          nodeId: this.id,
          error: lastError.message,
          attempt: attempts
        });

        if (attempts < maxAttempts && this.retryPolicy?.enabled) {
          const delay = this.calculateRetryDelay(attempts);
          context.logger.warn(
            `Node ${this.name} failed, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`,
            lastError
          );
          await this.sleep(delay);
        }
      }
    }

    throw new WorkflowError(
      `Node ${this.name} failed after ${attempts} attempts: ${lastError?.message}`,
      WorkflowErrorCode.PLUGIN_ERROR,
      context.executionId,
      context.workflowId,
      lastError
    );
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<NodeExecutionResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new WorkflowError(
          `Node ${this.name} timed out after ${timeoutMs}ms`,
          WorkflowErrorCode.TIMEOUT_ERROR
        ));
      }, timeoutMs);
    });
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(attempt: number): number {
    if (!this.retryPolicy) return 1000;

    const { backoffStrategy, initialDelay, maxDelay } = this.retryPolicy;
    let delay = initialDelay;

    switch (backoffStrategy) {
      case 'exponential':
        delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        break;
      case 'linear':
        delay = Math.min(initialDelay * attempt, maxDelay);
        break;
      case 'fixed':
      default:
        delay = initialDelay;
        break;
    }

    return delay;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Emit event through event system
   */
  protected emitEvent(eventType: string, data: any): void {
    if (this.eventSystem) {
      this.eventSystem.emit(eventType, {
        nodeId: this.id,
        nodeName: this.name,
        nodeType: this.getType(),
        ...data
      });
    }
  }

  // Getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string | undefined { return this.description; }
  getMetadata(): Record<string, any> { return { ...this.metadata }; }
}

// ============================================================================
// Node Configuration and Result Interfaces
// ============================================================================

export interface WorkflowNodeOptions {
  description?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  metadata?: Record<string, any>;
  eventSystem?: EventSystem;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodeId?: string;
  shouldWait?: boolean;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NodeEstimate {
  estimatedDuration: number;
  resourceIntensive: boolean;
  canParallelize: boolean;
  dependencies: string[];
}

// ============================================================================
// Task Node - Executes Actions
// ============================================================================

/**
 * Task node executes a series of actions sequentially
 * Most common node type for business logic execution
 */
export class TaskNode extends WorkflowNode {
  private actions: WorkflowAction[];
  private continueOnError: boolean;

  constructor(
    id: string,
    name: string,
    actions: WorkflowAction[],
    options: TaskNodeOptions = {}
  ) {
    super(id, name, options);
    this.actions = actions;
    this.continueOnError = options.continueOnError || false;
  }

  getType(): string {
    return 'task';
  }

  async execute(context: ExecutionContext, input?: any): Promise<NodeExecutionResult> {
    return this.executeWithTimeout(async () => {
      const results: PluginResult[] = [];
      const variables: Record<string, any> = {};
      let shouldWait = false;

      context.logger.info(`Executing task node: ${this.name}`, {
        actionCount: this.actions.length
      });

      for (const [index, action] of this.actions.entries()) {
        try {
          const result = await this.executeAction(action, context, input);
          results.push(result);

          // Merge variables from action result
          if (result.variables) {
            Object.assign(variables, result.variables);
          }

          // Check if we should wait
          if (result.shouldWait) {
            shouldWait = true;
            break;
          }

          // Stop on failure if not configured to continue
          if (!result.success && !this.continueOnError) {
            return {
              success: false,
              error: `Action ${index + 1}/${this.actions.length} failed: ${result.error}`,
              data: results
            };
          }

        } catch (error) {
          const errorMessage = `Action ${index + 1}/${this.actions.length} threw error: ${error instanceof Error ? error.message : String(error)}`;
          
          if (!this.continueOnError) {
            return {
              success: false,
              error: errorMessage,
              data: results
            };
          }

          context.logger.warn(errorMessage, error as Error);
          results.push({
            success: false,
            error: errorMessage
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const isSuccess = this.continueOnError ? successCount > 0 : results.every(r => r.success);

      return {
        success: isSuccess,
        data: results,
        variables,
        shouldWait,
        metadata: {
          actionsExecuted: results.length,
          successCount,
          failedCount: results.length - successCount
        }
      };
    }, context);
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.actions.length === 0) {
      errors.push('Task node must have at least one action');
    }

    // Validate each action
    this.actions.forEach((action, index) => {
      if (!action.id) {
        errors.push(`Action ${index + 1} missing required id`);
      }
      if (!action.type) {
        errors.push(`Action ${index + 1} missing required type`);
      }
      if (!action.name) {
        warnings.push(`Action ${index + 1} missing name (recommended)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getEstimate(): NodeEstimate {
    const actionDuration = this.actions.length * 1000; // 1s per action estimate
    return {
      estimatedDuration: actionDuration,
      resourceIntensive: this.actions.length > 5,
      canParallelize: false, // Actions within task are sequential
      dependencies: this.actions.map(a => a.plugin).filter(Boolean) as string[]
    };
  }

  private async executeAction(
    action: WorkflowAction,
    context: ExecutionContext,
    input?: any
  ): Promise<PluginResult> {
    // Mock action execution - in production this would integrate with the plugin system
    context.logger.debug(`Executing action: ${action.name}`, { type: action.type });
    
    await this.sleep(100); // Simulate work
    
    return {
      success: true,
      data: `${action.name} completed`,
      variables: {
        [`${action.id}_result`]: `Action ${action.name} executed successfully`
      }
    };
  }

}

export interface TaskNodeOptions extends WorkflowNodeOptions {
  continueOnError?: boolean;
}

// ============================================================================
// Condition Node - Decision Making
// ============================================================================

/**
 * Condition node evaluates expressions and routes workflow accordingly
 * Implements conditional logic and branching
 */
export class ConditionNode extends WorkflowNode {
  private condition: string;
  private trueNodeId?: string;
  private falseNodeId?: string;
  private defaultNodeId?: string;

  constructor(
    id: string,
    name: string,
    condition: string,
    options: ConditionNodeOptions = {}
  ) {
    super(id, name, options);
    this.condition = condition;
    this.trueNodeId = options.trueNodeId;
    this.falseNodeId = options.falseNodeId;
    this.defaultNodeId = options.defaultNodeId;
  }

  getType(): string {
    return 'condition';
  }

  async execute(context: ExecutionContext, input?: any): Promise<NodeExecutionResult> {
    return this.executeWithTimeout(async () => {
      context.logger.info(`Evaluating condition: ${this.condition}`);

      try {
        const result = this.evaluateCondition(this.condition, context, input);
        const nextNodeId = result ? this.trueNodeId : this.falseNodeId || this.defaultNodeId;

        this.emitEvent('condition.evaluated', {
          condition: this.condition,
          result,
          nextNodeId
        });

        return {
          success: true,
          data: { conditionResult: result, condition: this.condition },
          nextNodeId,
          variables: {
            [`${this.id}_result`]: result,
            [`${this.id}_condition`]: this.condition
          }
        };

      } catch (error) {
        context.logger.error(`Condition evaluation failed: ${this.condition}`, error as Error);
        
        return {
          success: false,
          error: `Condition evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
          nextNodeId: this.defaultNodeId
        };
      }
    }, context);
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.condition || this.condition.trim() === '') {
      errors.push('Condition expression is required');
    }

    if (!this.trueNodeId && !this.falseNodeId && !this.defaultNodeId) {
      errors.push('At least one target node (true, false, or default) must be specified');
    }

    if (!this.trueNodeId && this.falseNodeId) {
      warnings.push('No true path specified - condition may lead to dead ends');
    }

    // Basic syntax validation
    try {
      new Function('return ' + this.condition);
    } catch (error) {
      errors.push(`Invalid condition syntax: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getEstimate(): NodeEstimate {
    return {
      estimatedDuration: 100, // Very fast
      resourceIntensive: false,
      canParallelize: true,
      dependencies: []
    };
  }

  private evaluateCondition(
    condition: string,
    context: ExecutionContext,
    input?: any
  ): boolean {
    try {
      // Create evaluation context with variables and input
      const evalContext: Record<string, any> = {
        input: input || {},
        // Add context variables
        ...Object.fromEntries(context.variables),
        // Add utility functions
        Math,
        Date,
        now: () => new Date(),
        isEmpty: (value: any) => value == null || value === '' || (Array.isArray(value) && value.length === 0),
        isNotEmpty: (value: any) => !this.isEmpty(value)
      };

      // Replace variables in condition string
      let evaluableCondition = condition;
      Object.entries(evalContext).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (typeof value === 'string') {
          evaluableCondition = evaluableCondition.replace(regex, `"${value}"`);
        } else {
          evaluableCondition = evaluableCondition.replace(regex, JSON.stringify(value));
        }
      });

      // Use Function constructor for safer evaluation than eval
      const result = new Function(`
        with (arguments[0]) {
          return ${condition};
        }
      `)(evalContext);

      return Boolean(result);

    } catch (error) {
      context.logger.warn(`Condition evaluation error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private isEmpty(value: any): boolean {
    return value == null || value === '' || (Array.isArray(value) && value.length === 0);
  }
}

export interface ConditionNodeOptions extends WorkflowNodeOptions {
  trueNodeId?: string;
  falseNodeId?: string;
  defaultNodeId?: string;
}

// ============================================================================
// Loop Node - Iteration Logic
// ============================================================================

/**
 * Loop node executes child nodes repeatedly based on conditions
 * Supports while, for, and foreach loop patterns
 */
export class LoopNode extends WorkflowNode {
  private loopType: 'while' | 'for' | 'foreach';
  private condition?: string;
  private iterator?: string;
  private collection?: string;
  private maxIterations: number;
  private childNodeId?: string;

  constructor(
    id: string,
    name: string,
    loopType: 'while' | 'for' | 'foreach',
    options: LoopNodeOptions = {}
  ) {
    super(id, name, options);
    this.loopType = loopType;
    this.condition = options.condition;
    this.iterator = options.iterator;
    this.collection = options.collection;
    this.maxIterations = options.maxIterations || 100; // Safety limit
    this.childNodeId = options.childNodeId;
  }

  getType(): string {
    return 'loop';
  }

  async execute(context: ExecutionContext, input?: any): Promise<NodeExecutionResult> {
    return this.executeWithTimeout(async () => {
      context.logger.info(`Starting ${this.loopType} loop: ${this.name}`);

      const results: any[] = [];
      const variables: Record<string, any> = {};
      let iterations = 0;

      try {
        switch (this.loopType) {
          case 'while':
            results.push(...await this.executeWhileLoop(context, input, iterations));
            break;
          case 'for':
            results.push(...await this.executeForLoop(context, input));
            break;
          case 'foreach':
            results.push(...await this.executeForeachLoop(context, input));
            break;
        }

        variables[`${this.id}_iterations`] = iterations;
        variables[`${this.id}_results`] = results;

        return {
          success: true,
          data: results,
          variables,
          metadata: {
            loopType: this.loopType,
            iterations,
            resultCount: results.length
          }
        };

      } catch (error) {
        return {
          success: false,
          error: `Loop execution failed: ${error instanceof Error ? error.message : String(error)}`,
          data: results,
          variables
        };
      }
    }, context);
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (this.loopType) {
      case 'while':
        if (!this.condition) {
          errors.push('While loop requires a condition');
        }
        break;
      case 'foreach':
        if (!this.collection) {
          errors.push('Foreach loop requires a collection');
        }
        if (!this.iterator) {
          errors.push('Foreach loop requires an iterator variable name');
        }
        break;
    }

    if (this.maxIterations > 1000) {
      warnings.push('High maxIterations may cause performance issues');
    }

    if (!this.childNodeId) {
      warnings.push('No child node specified - loop will not execute anything');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getEstimate(): NodeEstimate {
    const estimatedIterations = Math.min(this.maxIterations, 10); // Conservative estimate
    return {
      estimatedDuration: estimatedIterations * 1000, // 1s per iteration
      resourceIntensive: estimatedIterations > 20,
      canParallelize: false, // Loop iterations are inherently sequential
      dependencies: this.childNodeId ? [this.childNodeId] : []
    };
  }

  private async executeWhileLoop(
    context: ExecutionContext,
    input: any,
    iterations: number
  ): Promise<any[]> {
    const results: any[] = [];

    while (iterations < this.maxIterations) {
      const conditionResult = this.evaluateCondition(this.condition!, context, input);
      if (!conditionResult) break;

      const result = await this.executeIteration(context, input, iterations);
      results.push(result);
      iterations++;

      // Update loop variable in context
      context.variables.set(`${this.iterator || 'i'}`, iterations);
    }

    return results;
  }

  private async executeForLoop(context: ExecutionContext, input: any): Promise<any[]> {
    const results: any[] = [];
    
    // For simplicity, treat for loop like a while loop with counter
    for (let i = 0; i < this.maxIterations; i++) {
      context.variables.set(this.iterator || 'i', i);
      
      if (this.condition && !this.evaluateCondition(this.condition, context, input)) {
        break;
      }
      
      const result = await this.executeIteration(context, input, i);
      results.push(result);
    }

    return results;
  }

  private async executeForeachLoop(context: ExecutionContext, input: any): Promise<any[]> {
    const results: any[] = [];
    
    // Get collection from context or input
    const collection = this.getCollectionValue(context, input);
    if (!Array.isArray(collection)) {
      throw new Error(`Collection '${this.collection}' is not an array`);
    }

    for (let index = 0; index < collection.length && index < this.maxIterations; index++) {
      const item = collection[index];
      context.variables.set(this.iterator!, item);
      context.variables.set(`${this.iterator!}_index`, index);

      const result = await this.executeIteration(context, { ...input, currentItem: item }, index);
      results.push(result);
    }

    return results;
  }

  private async executeIteration(
    context: ExecutionContext,
    input: any,
    index: number
  ): Promise<any> {
    // Mock iteration execution - in production this would execute the child node
    context.logger.debug(`Loop iteration ${index + 1}`, {
      loopType: this.loopType,
      childNodeId: this.childNodeId
    });

    await this.sleep(100); // Simulate work

    return {
      iteration: index,
      success: true,
      data: `Iteration ${index + 1} completed`
    };
  }

  private evaluateCondition(
    condition: string,
    context: ExecutionContext,
    input: any
  ): boolean {
    // Reuse condition evaluation logic from ConditionNode
    try {
      const evalContext: Record<string, any> = {
        input: input || {},
        ...Object.fromEntries(context.variables)
      };

      return new Function(`
        with (arguments[0]) {
          return ${condition};
        }
      `)(evalContext);
    } catch (error) {
      return false;
    }
  }

  private getCollectionValue(context: ExecutionContext, input: any): any {
    if (!this.collection) return [];
    
    // Try to get from context variables first
    if (context.variables.has(this.collection)) {
      return context.variables.get(this.collection);
    }
    
    // Try to get from input
    if (input && input[this.collection]) {
      return input[this.collection];
    }
    
    throw new Error(`Collection '${this.collection}' not found in context or input`);
  }

}

export interface LoopNodeOptions extends WorkflowNodeOptions {
  condition?: string;
  iterator?: string;
  collection?: string;
  maxIterations?: number;
  childNodeId?: string;
}

// ============================================================================
// Parallel Node - Concurrent Execution
// ============================================================================

/**
 * Parallel node executes multiple child nodes concurrently
 * Implements fan-out and fan-in patterns
 */
export class ParallelNode extends WorkflowNode {
  private childNodeIds: string[];
  private waitForAll: boolean;
  private maxConcurrency: number;
  private timeoutPerChild?: number;

  constructor(
    id: string,
    name: string,
    childNodeIds: string[],
    options: ParallelNodeOptions = {}
  ) {
    super(id, name, options);
    this.childNodeIds = childNodeIds;
    this.waitForAll = options.waitForAll !== false; // Default true
    this.maxConcurrency = options.maxConcurrency || childNodeIds.length;
    this.timeoutPerChild = options.timeoutPerChild;
  }

  getType(): string {
    return 'parallel';
  }

  async execute(context: ExecutionContext, input?: any): Promise<NodeExecutionResult> {
    return this.executeWithTimeout(async () => {
      context.logger.info(`Starting parallel execution: ${this.name}`, {
        childCount: this.childNodeIds.length,
        waitForAll: this.waitForAll,
        maxConcurrency: this.maxConcurrency
      });

      const results: ParallelExecutionResult[] = [];
      const batches = this.createBatches(this.childNodeIds, this.maxConcurrency);

      try {
        for (const batch of batches) {
          const batchResults = await this.executeBatch(batch, context, input);
          results.push(...batchResults);

          // If not waiting for all and we have at least one success, we could potentially exit early
          if (!this.waitForAll && results.some(r => r.success)) {
            context.logger.info('Parallel node completing early - at least one child succeeded');
          }
        }

        const successCount = results.filter(r => r.success).length;
        const isSuccess = this.waitForAll ? 
          results.length === successCount : 
          successCount > 0;

        const variables: Record<string, any> = {
          [`${this.id}_total`]: results.length,
          [`${this.id}_successful`]: successCount,
          [`${this.id}_failed`]: results.length - successCount
        };

        // Merge variables from successful executions
        results
          .filter(r => r.success && r.variables)
          .forEach(r => Object.assign(variables, r.variables));

        return {
          success: isSuccess,
          data: results,
          variables,
          metadata: {
            parallelResults: results,
            waitForAll: this.waitForAll,
            successRate: results.length > 0 ? successCount / results.length : 0
          }
        };

      } catch (error) {
        return {
          success: false,
          error: `Parallel execution failed: ${error instanceof Error ? error.message : String(error)}`,
          data: results
        };
      }
    }, context);
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.childNodeIds.length === 0) {
      errors.push('Parallel node must have at least one child node');
    }

    if (this.childNodeIds.length === 1) {
      warnings.push('Parallel node with only one child - consider using a task node instead');
    }

    if (this.maxConcurrency > this.childNodeIds.length) {
      warnings.push('maxConcurrency is greater than child count - will be automatically limited');
    }

    if (this.maxConcurrency > 10) {
      warnings.push('High concurrency may cause resource contention');
    }

    // Check for duplicate child IDs
    const uniqueIds = new Set(this.childNodeIds);
    if (uniqueIds.size !== this.childNodeIds.length) {
      errors.push('Duplicate child node IDs are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getEstimate(): NodeEstimate {
    const childCount = this.childNodeIds.length;
    const concurrency = Math.min(this.maxConcurrency, childCount);
    
    // Estimate based on sequential execution time divided by concurrency
    const sequentialTime = childCount * 2000; // 2s per child estimate
    const parallelTime = Math.ceil(childCount / concurrency) * 2000;
    
    return {
      estimatedDuration: parallelTime,
      resourceIntensive: concurrency > 3,
      canParallelize: true,
      dependencies: this.childNodeIds
    };
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async executeBatch(
    childIds: string[],
    context: ExecutionContext,
    input: any
  ): Promise<ParallelExecutionResult[]> {
    const promises = childIds.map(childId => 
      this.executeChild(childId, context, input)
    );

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      const childId = childIds[index];
      
      if (result.status === 'fulfilled') {
        return {
          childId,
          success: true,
          data: result.value.data,
          variables: result.value.variables
        };
      } else {
        return {
          childId,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });
  }

  private async executeChild(
    childId: string,
    context: ExecutionContext,
    input: any
  ): Promise<NodeExecutionResult> {
    // Mock child execution - in production this would execute the actual child node
    context.logger.debug(`Executing parallel child: ${childId}`);

    const childTimeout = this.timeoutPerChild || 10000;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Child ${childId} timed out after ${childTimeout}ms`));
      }, childTimeout);

      // Simulate child execution
      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          success: true,
          data: `Child ${childId} completed`,
          variables: { [`${childId}_result`]: 'success' }
        });
      }, Math.random() * 2000 + 500); // Random delay 0.5-2.5s
    });
  }
}

interface ParallelExecutionResult {
  childId: string;
  success: boolean;
  data?: any;
  error?: string;
  variables?: Record<string, any>;
}

export interface ParallelNodeOptions extends WorkflowNodeOptions {
  waitForAll?: boolean;
  maxConcurrency?: number;
  timeoutPerChild?: number;
}

// ============================================================================
// Node Factory
// ============================================================================

/**
 * Factory for creating workflow nodes
 */
export class WorkflowNodeFactory {
  private static nodeTypes = new Map<string, NodeConstructor>([
    ['task', TaskNode as NodeConstructor],
    ['condition', ConditionNode as NodeConstructor],
    ['loop', LoopNode as NodeConstructor],
    ['parallel', ParallelNode as NodeConstructor]
  ]);

  /**
   * Create a workflow node by type
   */
  static create(
    type: string,
    id: string,
    name: string,
    config: any,
    options?: WorkflowNodeOptions
  ): WorkflowNode {
    const constructor = this.nodeTypes.get(type.toLowerCase());
    if (!constructor) {
      throw new WorkflowError(
        `Unknown node type: ${type}`,
        WorkflowErrorCode.CONFIGURATION_ERROR
      );
    }

    // Create node with type-specific configuration
    switch (type.toLowerCase()) {
      case 'task':
        return new TaskNode(id, name, config.actions || [], options);
      case 'condition':
        return new ConditionNode(id, name, config.condition, { ...options, ...config });
      case 'loop':
        return new LoopNode(id, name, config.loopType, { ...options, ...config });
      case 'parallel':
        return new ParallelNode(id, name, config.childNodeIds || [], { ...options, ...config });
      default:
        throw new WorkflowError(
          `Unsupported node type for factory: ${type}`,
          WorkflowErrorCode.CONFIGURATION_ERROR
        );
    }
  }

  /**
   * Register a custom node type
   */
  static register(type: string, constructor: NodeConstructor): void {
    this.nodeTypes.set(type.toLowerCase(), constructor);
  }

  /**
   * Get all available node types
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.nodeTypes.keys());
  }
}

type NodeConstructor = new (
  id: string,
  name: string,
  config: any,
  options?: WorkflowNodeOptions
) => WorkflowNode;