/**
 * Comprehensive Unit Tests for WorkflowEngine
 * Tests core workflow execution, plugin system, error handling, and strategy integration
 */

import { WorkflowEngine, WorkflowEngineOptions } from '../../src/services/workflow/WorkflowEngine';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowState,
  WorkflowTransition,
  WorkflowAction,
  ExecutionStatus,
  WorkflowServices,
  WorkflowPlugin,
  WorkflowError,
  WorkflowErrorCode
} from '../../src/types/workflow';
import { ExecutionStrategy, SequentialExecutionStrategy } from '../../src/services/workflow/ExecutionStrategy';
import { EventSystem } from '../../src/services/workflow/EventSystem';

// Mock implementations
class MockDatabaseService {
  async query(sql: string, params: any[]): Promise<any> {
    return { success: true, data: [] };
  }
}

class MockNotificationService {
  async send(notification: any): Promise<void> {
    return Promise.resolve();
  }
}

class MockEventSystem implements EventSystem {
  private listeners: Map<string, Function[]> = new Map();

  async emit(eventType: string, data: any): Promise<void> {
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(listener => listener(data));
  }

  subscribe(eventType: string, handler: Function, options?: any): string {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
    return `sub-${eventType}-${Date.now()}`;
  }

  unsubscribe(subscriptionId: string): void {}

  async waitFor<T>(eventType: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = timeout ? setTimeout(() => reject(new Error('Timeout')), timeout) : null;
      const handler = (data: T) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      };
      this.subscribe(eventType, handler);
    });
  }

  async shutdown(): Promise<void> {
    this.listeners.clear();
  }
}

class MockExecutionStrategy implements ExecutionStrategy {
  readonly name = 'mock';
  readonly description = 'Mock strategy for testing';
  readonly supportsConcurrency = false;

  async execute(workflow: WorkflowDefinition, execution: WorkflowExecution, context: any, eventSystem: EventSystem): Promise<any> {
    return {
      status: 'completed' as ExecutionStatus,
      outputData: { mockResult: true },
      executionStats: {
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        statesExecuted: workflow.states.length,
        actionsExecuted: 5,
        retries: 0
      },
      stateHistory: []
    };
  }

  canExecute(workflow: WorkflowDefinition): boolean {
    return true;
  }

  estimate(workflow: WorkflowDefinition): any {
    return {
      estimatedDuration: 5000,
      estimatedMemory: 1024,
      complexity: 'low',
      parallelizable: false,
      resourceRequirements: ['cpu']
    };
  }
}

class MockPlugin implements WorkflowPlugin {
  readonly name = 'mockPlugin';
  readonly version = '1.0.0';

  async initialize(config: any): Promise<void> {
    return Promise.resolve();
  }

  async execute(context: any): Promise<any> {
    return {
      success: true,
      data: 'Mock plugin executed'
    };
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let mockServices: WorkflowServices;
  let mockEventSystem: MockEventSystem;
  let sampleWorkflow: WorkflowDefinition;
  let sampleExecution: WorkflowExecution;

  beforeEach(() => {
    mockServices = {
      database: new MockDatabaseService() as any,
      notification: new MockNotificationService() as any
    };

    mockEventSystem = new MockEventSystem();

    const options: WorkflowEngineOptions = {
      maxConcurrentExecutions: 5,
      eventSystem: mockEventSystem,
      executionStrategy: new MockExecutionStrategy()
    };

    engine = new WorkflowEngine(mockServices, options);

    sampleWorkflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      version: '1.0.0',
      states: [
        {
          id: 'state-1',
          name: 'Initial State',
          type: 'task',
          isInitial: true,
          isFinal: false,
          actions: [
            {
              id: 'action-1',
              name: 'Test Action',
              type: 'wait',
              config: { duration: 100 }
            }
          ]
        },
        {
          id: 'state-2',
          name: 'Final State',
          type: 'task',
          isInitial: false,
          isFinal: true,
          actions: []
        }
      ],
      transitions: [
        {
          id: 'trans-1',
          from: 'state-1',
          to: 'state-2',
          priority: 1
        }
      ],
      variables: [
        {
          name: 'testVar',
          type: 'string',
          defaultValue: 'test'
        }
      ],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    sampleExecution = {
      id: 'exec-1',
      user_id: 'user-1',
      workflow_id: 'workflow-1',
      status: 'pending',
      current_state: 'state-1',
      correlation_id: 'corr-1'
    };
  });

  afterEach(async () => {
    await engine.cleanup();
  });

  describe('Constructor and Initialization', () => {
    it('should create engine with default options', () => {
      const basicEngine = new WorkflowEngine(mockServices);
      expect(basicEngine).toBeInstanceOf(WorkflowEngine);
    });

    it('should accept custom execution strategy', () => {
      const customStrategy = new SequentialExecutionStrategy();
      const customEngine = new WorkflowEngine(mockServices, {
        executionStrategy: customStrategy
      });
      expect(customEngine.getExecutionStrategy()).toBe(customStrategy);
    });

    it('should set max concurrent executions', () => {
      const engine = new WorkflowEngine(mockServices, { maxConcurrentExecutions: 3 });
      expect(engine.getActiveExecutions()).toHaveLength(0);
    });
  });

  describe('Plugin Management', () => {
    it('should register plugin successfully', async () => {
      const plugin = new MockPlugin();
      await expect(engine.registerPlugin(plugin)).resolves.not.toThrow();
    });

    it('should handle plugin registration failure', async () => {
      const failingPlugin = {
        name: 'failingPlugin',
        version: '1.0.0',
        initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
        execute: jest.fn(),
        cleanup: jest.fn()
      };

      await expect(engine.registerPlugin(failingPlugin)).rejects.toThrow(WorkflowError);
    });

    it('should handle plugin with same name', async () => {
      const plugin1 = new MockPlugin();
      const plugin2 = new MockPlugin();
      
      await engine.registerPlugin(plugin1);
      await engine.registerPlugin(plugin2); // Should overwrite
      
      // No error should be thrown
    });
  });

  describe('Workflow Validation', () => {
    it('should validate workflow with states', async () => {
      await expect(engine.executeWorkflow(sampleWorkflow, sampleExecution))
        .resolves.toBeDefined();
    });

    it('should reject workflow without states', async () => {
      const invalidWorkflow = { ...sampleWorkflow, states: [] };
      
      await expect(engine.executeWorkflow(invalidWorkflow, sampleExecution))
        .rejects.toThrow('Workflow must have at least one state');
    });

    it('should reject workflow without initial state', async () => {
      const invalidWorkflow = {
        ...sampleWorkflow,
        states: sampleWorkflow.states.map(s => ({ ...s, isInitial: false }))
      };
      
      await expect(engine.executeWorkflow(invalidWorkflow, sampleExecution))
        .rejects.toThrow('Workflow must have at least one initial state');
    });

    it('should reject workflow without final state', async () => {
      const invalidWorkflow = {
        ...sampleWorkflow,
        states: sampleWorkflow.states.map(s => ({ ...s, isFinal: false }))
      };
      
      await expect(engine.executeWorkflow(invalidWorkflow, sampleExecution))
        .rejects.toThrow('Workflow must have at least one final state');
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow successfully', async () => {
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.started_at).toBeInstanceOf(Date);
      expect(result.completed_at).toBeInstanceOf(Date);
    });

    it('should handle input data', async () => {
      const inputData = { testInput: 'value' };
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution, inputData);
      
      expect(result.input_data).toEqual(inputData);
    });

    it('should respect concurrent execution limit', async () => {
      const limitedEngine = new WorkflowEngine(mockServices, { maxConcurrentExecutions: 1 });
      
      // Start first execution
      const execution1 = { ...sampleExecution, id: 'exec-1' };
      const execution2 = { ...sampleExecution, id: 'exec-2' };
      
      // Mock long-running execution
      const longStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({
            status: 'completed',
            outputData: {},
            executionStats: {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1000,
              statesExecuted: 1,
              actionsExecuted: 1,
              retries: 0
            },
            stateHistory: []
          }), 100)
        ))
      };
      
      limitedEngine.setExecutionStrategy(longStrategy);
      
      const promise1 = limitedEngine.executeWorkflow(sampleWorkflow, execution1);
      
      // Second execution should be rejected due to limit
      await expect(limitedEngine.executeWorkflow(sampleWorkflow, execution2))
        .rejects.toThrow('Maximum concurrent executions reached');
      
      await promise1;
      await limitedEngine.cleanup();
    });

    it('should handle execution failure', async () => {
      const failingStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockRejectedValue(new Error('Execution failed'))
      };
      
      engine.setExecutionStrategy(failingStrategy);
      
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('Execution failed');
      expect(result.completed_at).toBeInstanceOf(Date);
    });
  });

  describe('Event System Integration', () => {
    it('should emit workflow events', async () => {
      const eventPromise = mockEventSystem.waitFor('workflow.failed', 1000);
      
      const failingStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockRejectedValue(new Error('Test failure'))
      };
      
      engine.setExecutionStrategy(failingStrategy);
      
      try {
        await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      } catch (error) {
        // Expected to fail
      }
      
      const eventData = await eventPromise;
      expect(eventData).toBeDefined();
    });

    it('should allow event subscription', () => {
      const handler = jest.fn();
      engine.on('test.event', handler);
      
      mockEventSystem.emit('test.event', { test: 'data' });
      
      expect(handler).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should support waiting for events', async () => {
      const eventPromise = engine.waitForEvent('test.event', 1000);
      
      setTimeout(() => {
        mockEventSystem.emit('test.event', { result: 'success' });
      }, 50);
      
      const result = await eventPromise;
      expect(result).toEqual({ result: 'success' });
    });
  });

  describe('Execution Strategy Management', () => {
    it('should allow strategy changes', () => {
      const newStrategy = new SequentialExecutionStrategy();
      engine.setExecutionStrategy(newStrategy);
      
      expect(engine.getExecutionStrategy()).toBe(newStrategy);
    });

    it('should create strategy from string', () => {
      engine.setExecutionStrategy('sequential');
      
      expect(engine.getExecutionStrategy()).toBeInstanceOf(SequentialExecutionStrategy);
    });

    it('should get execution estimates', () => {
      const estimate = engine.getExecutionEstimate(sampleWorkflow);
      
      expect(estimate).toBeDefined();
      expect(estimate.estimatedDuration).toBeGreaterThan(0);
    });

    it('should check if workflow can be executed', () => {
      const canExecute = engine.canExecuteWorkflow(sampleWorkflow);
      expect(canExecute).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should track active executions', async () => {
      expect(engine.getActiveExecutions()).toHaveLength(0);
      
      const longStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({
            status: 'completed',
            outputData: {},
            executionStats: {
              startTime: new Date(),
              endTime: new Date(),
              duration: 1000,
              statesExecuted: 1,
              actionsExecuted: 1,
              retries: 0
            },
            stateHistory: []
          }), 50)
        ))
      };
      
      engine.setExecutionStrategy(longStrategy);
      
      const promise = engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      // Check that execution is tracked
      expect(engine.getActiveExecutions()).toContain(sampleExecution.id);
      
      await promise;
      
      // Check that execution is removed after completion
      expect(engine.getActiveExecutions()).not.toContain(sampleExecution.id);
    });

    it('should cleanup resources properly', async () => {
      const mockPlugin = new MockPlugin();
      const cleanupSpy = jest.spyOn(mockPlugin, 'cleanup');
      
      await engine.registerPlugin(mockPlugin);
      await engine.cleanup();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const failingPlugin = {
        name: 'failingPlugin',
        version: '1.0.0',
        initialize: jest.fn(),
        execute: jest.fn(),
        cleanup: jest.fn().mockRejectedValue(new Error('Cleanup failed'))
      };
      
      await engine.registerPlugin(failingPlugin);
      
      // Should not throw despite plugin cleanup failure
      await expect(engine.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle WorkflowError properly', async () => {
      const errorStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockRejectedValue(
          new WorkflowError(
            'Custom workflow error',
            WorkflowErrorCode.EXECUTION_FAILED,
            'exec-1',
            'workflow-1'
          )
        )
      };
      
      engine.setExecutionStrategy(errorStrategy);
      
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('Custom workflow error');
    });

    it('should handle generic errors', async () => {
      const errorStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockRejectedValue(new Error('Generic error'))
      };
      
      engine.setExecutionStrategy(errorStrategy);
      
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('Generic error');
    });

    it('should handle non-error exceptions', async () => {
      const errorStrategy = {
        ...new MockExecutionStrategy(),
        execute: jest.fn().mockRejectedValue('String error')
      };
      
      engine.setExecutionStrategy(errorStrategy);
      
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('String error');
    });
  });

  describe('Metadata and Context', () => {
    it('should preserve execution metadata', async () => {
      const result = await engine.executeWorkflow(sampleWorkflow, sampleExecution);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionStats).toBeDefined();
      expect(result.metadata.stateHistory).toBeDefined();
    });

    it('should handle workflow variables', async () => {
      const workflowWithVars = {
        ...sampleWorkflow,
        variables: [
          { name: 'var1', type: 'string', defaultValue: 'default1' },
          { name: 'var2', type: 'number', defaultValue: 42 }
        ]
      };
      
      const inputData = { var1: 'overridden', var3: 'new' };
      
      const result = await engine.executeWorkflow(workflowWithVars, sampleExecution, inputData);
      
      expect(result.input_data).toEqual(inputData);
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle workflow with multiple states', async () => {
      const complexWorkflow: WorkflowDefinition = {
        ...sampleWorkflow,
        states: [
          {
            id: 'start',
            name: 'Start',
            type: 'task',
            isInitial: true,
            isFinal: false,
            actions: [{ id: 'a1', name: 'Init', type: 'wait', config: {} }]
          },
          {
            id: 'middle',
            name: 'Middle',
            type: 'task',
            isInitial: false,
            isFinal: false,
            actions: [{ id: 'a2', name: 'Process', type: 'wait', config: {} }]
          },
          {
            id: 'end',
            name: 'End',
            type: 'task',
            isInitial: false,
            isFinal: true,
            actions: [{ id: 'a3', name: 'Finish', type: 'wait', config: {} }]
          }
        ],
        transitions: [
          { id: 't1', from: 'start', to: 'middle', priority: 1 },
          { id: 't2', from: 'middle', to: 'end', priority: 1 }
        ]
      };
      
      const result = await engine.executeWorkflow(complexWorkflow, sampleExecution);
      
      expect(result.status).toBe('completed');
    });

    it('should handle workflow with conditional transitions', async () => {
      const conditionalWorkflow: WorkflowDefinition = {
        ...sampleWorkflow,
        transitions: [
          {
            id: 'conditional-trans',
            from: 'state-1',
            to: 'state-2',
            priority: 1,
            condition: 'testVar === "test"'
          }
        ]
      };
      
      const result = await engine.executeWorkflow(conditionalWorkflow, sampleExecution);
      
      expect(result.status).toBe('completed');
    });
  });
});
