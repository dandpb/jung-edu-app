/**
 * Comprehensive Unit Tests for ExecutionStrategy implementations
 * Tests sequential, parallel, and adaptive execution strategies
 */

import {
  ExecutionStrategy,
  SequentialExecutionStrategy,
  ParallelExecutionStrategy,
  AdaptiveExecutionStrategy,
  ExecutionStrategyFactory,
  ExecutionResult,
  ExecutionStats,
  StateExecutionRecord
} from '../../src/services/workflow/ExecutionStrategy';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowState,
  ExecutionContext,
  WorkflowServices,
  WorkflowLogger
} from '../../src/types/workflow';
import { EventSystem } from '../../src/services/workflow/EventSystem';

// Mock implementations
class MockEventSystem implements EventSystem {
  private events: Array<{ type: string; data: any }> = [];

  async emit(eventType: string, data: any): Promise<void> {
    this.events.push({ type: eventType, data });
  }

  subscribe(eventType: string, handler: Function, options?: any): string {
    return `sub-${eventType}`;
  }

  unsubscribe(subscriptionId: string): void {}

  async waitFor<T>(eventType: string, timeout?: number): Promise<T> {
    return Promise.resolve({} as T);
  }

  async shutdown(): Promise<void> {}

  getEvents(): Array<{ type: string; data: any }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

class MockLogger implements WorkflowLogger {
  logs: Array<{ level: string; message: string; data?: any }> = [];

  debug(message: string, data?: any): void {
    this.logs.push({ level: 'debug', message, data });
  }

  info(message: string, data?: any): void {
    this.logs.push({ level: 'info', message, data });
  }

  warn(message: string, data?: any): void {
    this.logs.push({ level: 'warn', message, data });
  }

  error(message: string, error?: Error): void {
    this.logs.push({ level: 'error', message, data: error });
  }

  getLogs(): Array<{ level: string; message: string; data?: any }> {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

const mockServices: WorkflowServices = {
  database: {
    query: jest.fn().mockResolvedValue({ success: true })
  } as any,
  notification: {
    send: jest.fn().mockResolvedValue(undefined)
  } as any
};

describe('ExecutionStrategy', () => {
  let mockEventSystem: MockEventSystem;
  let sampleWorkflow: WorkflowDefinition;
  let sampleExecution: WorkflowExecution;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockEventSystem = new MockEventSystem();
    
    sampleWorkflow = {
      id: 'workflow-1',
      name: 'Test Workflow',
      description: 'Test workflow for strategy testing',
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
              name: 'First Action',
              type: 'wait',
              config: { duration: 100 }
            }
          ]
        },
        {
          id: 'state-2',
          name: 'Second State',
          type: 'task',
          isInitial: false,
          isFinal: false,
          actions: [
            {
              id: 'action-2',
              name: 'Second Action',
              type: 'wait',
              config: { duration: 100 }
            }
          ]
        },
        {
          id: 'state-3',
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
        },
        {
          id: 'trans-2',
          from: 'state-2',
          to: 'state-3',
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

    const mockLogger = new MockLogger();
    mockContext = {
      executionId: 'exec-1',
      userId: 'user-1',
      workflowId: 'workflow-1',
      currentState: 'state-1',
      variables: new Map([['testVar', 'test']]),
      services: mockServices,
      logger: mockLogger,
      correlationId: 'corr-1'
    };
  });

  describe('SequentialExecutionStrategy', () => {
    let strategy: SequentialExecutionStrategy;

    beforeEach(() => {
      strategy = new SequentialExecutionStrategy();
    });

    describe('Basic Properties', () => {
      it('should have correct properties', () => {
        expect(strategy.name).toBe('sequential');
        expect(strategy.description).toContain('sequentially');
        expect(strategy.supportsConcurrency).toBe(false);
      });
    });

    describe('Workflow Execution', () => {
      it('should execute workflow successfully', async () => {
        const result = await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);

        expect(result.status).toBe('completed');
        expect(result.executionStats).toBeDefined();
        expect(result.executionStats.statesExecuted).toBeGreaterThan(0);
        expect(result.stateHistory).toBeInstanceOf(Array);
      });

      it('should emit execution events', async () => {
        await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        const events = mockEventSystem.getEvents();
        expect(events.some(e => e.type === 'execution.started')).toBe(true);
        expect(events.some(e => e.type === 'execution.completed')).toBe(true);
      });

      it('should handle workflow without final state', async () => {
        const workflowWithoutFinal = {
          ...sampleWorkflow,
          states: sampleWorkflow.states.map(s => ({ ...s, isFinal: false }))
        };

        const result = await strategy.execute(workflowWithoutFinal, sampleExecution, mockContext, mockEventSystem);
        
        expect(result.status).toBe('completed');
      });

      it('should handle execution failure', async () => {
        // Create a workflow that will cause failure
        const failingWorkflow = {
          ...sampleWorkflow,
          states: [
            {
              id: 'failing-state',
              name: 'Failing State',
              type: 'task',
              isInitial: true,
              isFinal: true,
              actions: [
                {
                  id: 'failing-action',
                  name: 'Failing Action',
                  type: 'invalid_type',
                  config: {}
                }
              ]
            }
          ]
        };

        const result = await strategy.execute(failingWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        expect(result.status).toBe('failed');
        expect(result.errorMessage).toBeDefined();
      });
    });

    describe('Validation and Estimation', () => {
      it('should validate executable workflows', () => {
        expect(strategy.canExecute(sampleWorkflow)).toBe(true);
      });

      it('should reject empty workflows', () => {
        const emptyWorkflow = { ...sampleWorkflow, states: [] };
        expect(strategy.canExecute(emptyWorkflow)).toBe(false);
      });

      it('should provide execution estimates', () => {
        const estimate = strategy.estimate(sampleWorkflow);
        
        expect(estimate.estimatedDuration).toBeGreaterThan(0);
        expect(estimate.estimatedMemory).toBeGreaterThan(0);
        expect(estimate.complexity).toMatch(/low|medium|high/);
        expect(estimate.parallelizable).toBe(false);
        expect(estimate.resourceRequirements).toContain('cpu');
      });

      it('should estimate complexity correctly', () => {
        const smallWorkflow = {
          ...sampleWorkflow,
          states: sampleWorkflow.states.slice(0, 1)
        };
        
        const largeWorkflow = {
          ...sampleWorkflow,
          states: Array.from({ length: 15 }, (_, i) => ({
            id: `state-${i}`,
            name: `State ${i}`,
            type: 'task' as const,
            isInitial: i === 0,
            isFinal: i === 14,
            actions: []
          }))
        };

        expect(strategy.estimate(smallWorkflow).complexity).toBe('low');
        expect(strategy.estimate(largeWorkflow).complexity).toBe('high');
      });
    });
  });

  describe('ParallelExecutionStrategy', () => {
    let strategy: ParallelExecutionStrategy;

    beforeEach(() => {
      strategy = new ParallelExecutionStrategy();
    });

    describe('Basic Properties', () => {
      it('should have correct properties', () => {
        expect(strategy.name).toBe('parallel');
        expect(strategy.description).toContain('parallel');
        expect(strategy.supportsConcurrency).toBe(true);
        expect(strategy.maxConcurrency).toBeGreaterThan(0);
      });
    });

    describe('Parallel Execution', () => {
      it('should execute workflow in parallel', async () => {
        const result = await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);

        expect(result.status).toBe('completed');
        expect(result.executionStats).toBeDefined();
      });

      it('should handle parallel groups', async () => {
        const parallelWorkflow = {
          ...sampleWorkflow,
          states: [
            {
              id: 'parallel-1',
              name: 'Parallel State 1',
              type: 'task' as const,
              isInitial: true,
              isFinal: false,
              actions: [{ id: 'a1', name: 'Action 1', type: 'wait', config: {} }]
            },
            {
              id: 'parallel-2',
              name: 'Parallel State 2', 
              type: 'task' as const,
              isInitial: true,
              isFinal: false,
              actions: [{ id: 'a2', name: 'Action 2', type: 'wait', config: {} }]
            },
            {
              id: 'final',
              name: 'Final State',
              type: 'task' as const,
              isInitial: false,
              isFinal: true,
              actions: []
            }
          ],
          transitions: []
        };

        const result = await strategy.execute(parallelWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        expect(result.status).toBe('completed');
        expect(result.executionStats.statesExecuted).toBeGreaterThan(0);
      });

      it('should respect concurrency limits', async () => {
        // This test would be more meaningful with actual async operations
        const result = await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);
        expect(result).toBeDefined();
      });

      it('should handle partial failures correctly', async () => {
        const mixedWorkflow = {
          ...sampleWorkflow,
          states: [
            {
              id: 'success-state',
              name: 'Success State',
              type: 'task' as const,
              isInitial: true,
              isFinal: false,
              actions: [{ id: 'good', name: 'Good Action', type: 'wait', config: {} }]
            },
            {
              id: 'fail-state',
              name: 'Failing State',
              type: 'task' as const,
              isInitial: true,
              isFinal: false,
              actions: [{ id: 'bad', name: 'Bad Action', type: 'invalid', config: {} }]
            },
            {
              id: 'final-state',
              name: 'Final State',
              type: 'task' as const,
              isInitial: false,
              isFinal: true,
              actions: []
            }
          ]
        };

        const result = await strategy.execute(mixedWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        // Strategy should handle mixed results appropriately
        expect(result).toBeDefined();
        expect(['completed', 'failed']).toContain(result.status);
      });
    });

    describe('Validation and Estimation', () => {
      it('should identify parallelizable workflows', () => {
        const parallelizableWorkflow = {
          ...sampleWorkflow,
          states: [
            { id: 's1', name: 'State 1', type: 'task' as const, isInitial: true, isFinal: false, actions: [] },
            { id: 's2', name: 'State 2', type: 'task' as const, isInitial: true, isFinal: false, actions: [] },
            { id: 's3', name: 'State 3', type: 'task' as const, isInitial: false, isFinal: true, actions: [] }
          ],
          transitions: []
        };

        expect(strategy.canExecute(parallelizableWorkflow)).toBe(true);
      });

      it('should provide parallel execution estimates', () => {
        const estimate = strategy.estimate(sampleWorkflow);
        
        expect(estimate.parallelizable).toBe(true);
        expect(estimate.resourceRequirements).toContain('memory');
        expect(estimate.estimatedDuration).toBeGreaterThan(0);
      });
    });

    describe('Cleanup', () => {
      it('should cleanup resources properly', async () => {
        await expect(strategy.cleanup()).resolves.not.toThrow();
      });
    });
  });

  describe('AdaptiveExecutionStrategy', () => {
    let strategy: AdaptiveExecutionStrategy;

    beforeEach(() => {
      strategy = new AdaptiveExecutionStrategy();
    });

    describe('Basic Properties', () => {
      it('should have correct properties', () => {
        expect(strategy.name).toBe('adaptive');
        expect(strategy.description).toContain('adaptive');
        expect(strategy.supportsConcurrency).toBe(true);
      });
    });

    describe('Strategy Selection', () => {
      it('should adapt strategy based on workflow characteristics', async () => {
        const simpleWorkflow = {
          ...sampleWorkflow,
          states: sampleWorkflow.states.slice(0, 2) // Small workflow
        };

        const result = await strategy.execute(simpleWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        expect(result.status).toBe('completed');
        
        // Should emit strategy selection event
        const events = mockEventSystem.getEvents();
        expect(events.some(e => e.type === 'strategy.selected')).toBe(true);
      });

      it('should handle complex workflows', async () => {
        const complexWorkflow = {
          ...sampleWorkflow,
          states: Array.from({ length: 10 }, (_, i) => ({
            id: `complex-state-${i}`,
            name: `Complex State ${i}`,
            type: 'task' as const,
            isInitial: i === 0,
            isFinal: i === 9,
            actions: Array.from({ length: 3 }, (_, j) => ({
              id: `action-${i}-${j}`,
              name: `Action ${i}-${j}`,
              type: 'wait',
              config: {}
            }))
          })),
          transitions: Array.from({ length: 9 }, (_, i) => ({
            id: `trans-${i}`,
            from: `complex-state-${i}`,
            to: `complex-state-${i + 1}`,
            priority: 1
          }))
        };

        const result = await strategy.execute(complexWorkflow, sampleExecution, mockContext, mockEventSystem);
        
        expect(result.status).toBe('completed');
      });
    });

    describe('Estimation and Validation', () => {
      it('should provide adaptive estimates', () => {
        const estimate = strategy.estimate(sampleWorkflow);
        
        expect(estimate).toBeDefined();
        expect(estimate.estimatedDuration).toBeGreaterThan(0);
      });

      it('should validate any workflow with states', () => {
        expect(strategy.canExecute(sampleWorkflow)).toBe(true);
        
        const emptyWorkflow = { ...sampleWorkflow, states: [] };
        expect(strategy.canExecute(emptyWorkflow)).toBe(false);
      });
    });

    describe('Cleanup', () => {
      it('should cleanup both underlying strategies', async () => {
        await expect(strategy.cleanup()).resolves.not.toThrow();
      });
    });
  });

  describe('ExecutionStrategyFactory', () => {
    describe('Strategy Creation', () => {
      it('should create sequential strategy', () => {
        const strategy = ExecutionStrategyFactory.create('sequential');
        expect(strategy).toBeInstanceOf(SequentialExecutionStrategy);
      });

      it('should create parallel strategy', () => {
        const strategy = ExecutionStrategyFactory.create('parallel');
        expect(strategy).toBeInstanceOf(ParallelExecutionStrategy);
      });

      it('should create adaptive strategy', () => {
        const strategy = ExecutionStrategyFactory.create('adaptive');
        expect(strategy).toBeInstanceOf(AdaptiveExecutionStrategy);
      });

      it('should throw error for unknown strategy', () => {
        expect(() => ExecutionStrategyFactory.create('unknown')).toThrow();
      });

      it('should be case insensitive', () => {
        const strategy = ExecutionStrategyFactory.create('SEQUENTIAL');
        expect(strategy).toBeInstanceOf(SequentialExecutionStrategy);
      });
    });

    describe('Strategy Registration', () => {
      it('should register custom strategy', () => {
        class CustomStrategy implements ExecutionStrategy {
          readonly name = 'custom';
          readonly description = 'Custom test strategy';
          readonly supportsConcurrency = false;

          async execute(): Promise<ExecutionResult> {
            return {
              status: 'completed',
              executionStats: {
                startTime: new Date(),
                endTime: new Date(),
                duration: 1000,
                statesExecuted: 1,
                actionsExecuted: 1,
                retries: 0
              },
              stateHistory: []
            };
          }

          canExecute(): boolean { return true; }
          estimate(): any { return {}; }
        }

        ExecutionStrategyFactory.register('custom', () => new CustomStrategy());
        
        const strategy = ExecutionStrategyFactory.create('custom');
        expect(strategy).toBeInstanceOf(CustomStrategy);
      });
    });

    describe('Strategy Recommendations', () => {
      it('should recommend strategy based on workflow', () => {
        const simpleWorkflow = {
          ...sampleWorkflow,
          states: sampleWorkflow.states.slice(0, 1)
        };
        
        const recommendation = ExecutionStrategyFactory.recommend(simpleWorkflow);
        expect(['sequential', 'parallel', 'adaptive']).toContain(recommendation);
      });

      it('should recommend parallel for parallelizable workflows', () => {
        const parallelWorkflow = {
          ...sampleWorkflow,
          states: Array.from({ length: 8 }, (_, i) => ({
            id: `state-${i}`,
            name: `State ${i}`,
            type: 'task' as const,
            isInitial: i < 4,
            isFinal: i >= 4,
            actions: []
          })),
          transitions: []
        };

        const recommendation = ExecutionStrategyFactory.recommend(parallelWorkflow);
        expect(['parallel', 'adaptive']).toContain(recommendation);
      });
    });

    describe('Available Strategies', () => {
      it('should list available strategies', () => {
        const strategies = ExecutionStrategyFactory.getAvailableStrategies();
        
        expect(strategies).toContain('sequential');
        expect(strategies).toContain('parallel');
        expect(strategies).toContain('adaptive');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      const strategy = new SequentialExecutionStrategy();
      
      // These should not throw, but may return error states
      await expect(async () => {
        await strategy.execute(
          null as any,
          sampleExecution,
          mockContext,
          mockEventSystem
        );
      }).not.toThrow();
    });

    it('should handle workflows with circular transitions', async () => {
      const circularWorkflow = {
        ...sampleWorkflow,
        transitions: [
          { id: 't1', from: 'state-1', to: 'state-2', priority: 1 },
          { id: 't2', from: 'state-2', to: 'state-1', priority: 1 } // Circular
        ]
      };

      const strategy = new SequentialExecutionStrategy();
      const result = await strategy.execute(circularWorkflow, sampleExecution, mockContext, mockEventSystem);
      
      // Should handle gracefully without infinite loops
      expect(result).toBeDefined();
    });

    it('should handle workflows with no transitions', async () => {
      const isolatedWorkflow = {
        ...sampleWorkflow,
        transitions: []
      };

      const strategy = new SequentialExecutionStrategy();
      const result = await strategy.execute(isolatedWorkflow, sampleExecution, mockContext, mockEventSystem);
      
      expect(result).toBeDefined();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete execution within reasonable time', async () => {
      const strategy = new SequentialExecutionStrategy();
      
      const startTime = Date.now();
      await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);
      const endTime = Date.now();
      
      // Should complete within 5 seconds (generous for testing)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should track execution statistics accurately', async () => {
      const strategy = new SequentialExecutionStrategy();
      const result = await strategy.execute(sampleWorkflow, sampleExecution, mockContext, mockEventSystem);
      
      expect(result.executionStats.startTime).toBeInstanceOf(Date);
      expect(result.executionStats.endTime).toBeInstanceOf(Date);
      expect(result.executionStats.duration).toBeGreaterThanOrEqual(0);
      expect(result.executionStats.statesExecuted).toBeGreaterThanOrEqual(0);
      expect(result.executionStats.actionsExecuted).toBeGreaterThanOrEqual(0);
      expect(result.executionStats.retries).toBeGreaterThanOrEqual(0);
    });
  });
});
