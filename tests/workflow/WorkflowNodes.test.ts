/**
 * Comprehensive Unit Tests for WorkflowNode implementations
 * Tests all node types: Task, Condition, Loop, and Parallel nodes
 */

import {
  WorkflowNode,
  TaskNode,
  ConditionNode,
  LoopNode,
  ParallelNode,
  WorkflowNodeFactory,
  NodeExecutionResult,
  ValidationResult,
  NodeEstimate,
  TaskNodeOptions,
  ConditionNodeOptions,
  LoopNodeOptions,
  ParallelNodeOptions
} from '../../src/services/workflow/WorkflowNode';
import {
  ExecutionContext,
  WorkflowServices,
  WorkflowLogger,
  WorkflowAction,
  RetryPolicy
} from '../../src/types/workflow';
import { EventSystem, EventSubscription, EventEmissionResult, EventListener } from '../../src/services/workflow/EventSystem';

// Mock implementations
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

class MockEventSystem extends EventSystem {
  private events: Array<{ type: string; data: any }> = [];

  constructor() {
    super();
  }

  async emit(eventType: string, data: any, metadata?: any): Promise<EventEmissionResult> {
    this.events.push({ type: eventType, data });
    return {
      eventId: `evt_${Date.now()}`,
      listenersNotified: 0,
      errors: [],
      duration: 10
    };
  }

  subscribe(eventType: string | string[], handler: EventListener, options?: any): EventSubscription {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    return {
      id: `sub-${eventTypes.join('-')}-${Date.now()}`,
      eventType: eventTypes.join(','),
      listener: handler,
      options: options || {},
      createdAt: new Date(),
      executionCount: 0
    };
  }

  getEvents(): Array<{ type: string; data: any }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

const mockServices: WorkflowServices = {
  database: {
    query: jest.fn().mockResolvedValue({ success: true })
  } as any,
  notification: {
    send: jest.fn().mockResolvedValue(undefined)
  } as any,
  analytics: {
    track: jest.fn().mockResolvedValue(undefined),
    record: jest.fn().mockResolvedValue(undefined)
  } as any,
  auth: {
    verify: jest.fn().mockResolvedValue({ valid: true }),
    getUser: jest.fn().mockResolvedValue({ id: 'user-1' })
  } as any,
  ai: {
    analyze: jest.fn().mockResolvedValue({ result: 'analyzed' }),
    predict: jest.fn().mockResolvedValue({ prediction: 'positive' })
  } as any,
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(true)
  } as any
};

describe('WorkflowNode', () => {
  let mockContext: ExecutionContext;
  let mockLogger: MockLogger;
  let mockEventSystem: MockEventSystem;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEventSystem = new MockEventSystem();
    
    mockContext = {
      executionId: 'exec-1',
      userId: 'user-1',
      workflowId: 'workflow-1',
      currentState: 'state-1',
      variables: new Map<string, any>([
        ['testVar', 'testValue'],
        ['numVar', 42],
        ['boolVar', true],
        ['arrayVar', [1, 2, 3]]
      ]),
      services: mockServices,
      logger: mockLogger,
      correlationId: 'corr-1'
    };
  });

  describe('TaskNode', () => {
    describe('Basic Functionality', () => {
      it('should create task node with actions', () => {
        const actions: WorkflowAction[] = [
          {
            id: 'action-1',
            name: 'Test Action',
            type: 'wait',
            config: { duration: 100 }
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions);
        
        expect(node.getId()).toBe('task-1');
        expect(node.getName()).toBe('Test Task');
        expect(node.getType()).toBe('task');
      });

      it('should execute actions successfully', async () => {
        const actions: WorkflowAction[] = [
          {
            id: 'action-1',
            name: 'First Action',
            type: 'wait',
            config: { duration: 10 }
          },
          {
            id: 'action-2',
            name: 'Second Action',
            type: 'wait',
            config: { duration: 10 }
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.variables).toBeDefined();
        expect(result.metadata?.actionsExecuted).toBe(2);
      });

      it('should handle action failures', async () => {
        const actions: WorkflowAction[] = [
          {
            id: 'good-action',
            name: 'Good Action',
            type: 'wait',
            config: { duration: 10 }
          },
          {
            id: 'bad-action',
            name: 'Bad Action',
            type: 'script',
            config: {}
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Action 2/2 threw error');
      });

      it('should continue on error when configured', async () => {
        const actions: WorkflowAction[] = [
          {
            id: 'good-action',
            name: 'Good Action', 
            type: 'wait',
            config: { duration: 10 }
          },
          {
            id: 'bad-action',
            name: 'Bad Action',
            type: 'script',
            config: {}
          }
        ];

        const options: TaskNodeOptions = {
          continueOnError: true
        };

        const node = new TaskNode('task-1', 'Test Task', actions, options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true); // Should succeed because continueOnError is true
        expect(result.metadata?.successCount).toBe(1);
        expect(result.metadata?.failedCount).toBe(1);
      });
    });

    describe('Validation', () => {
      it('should validate node with actions', () => {
        const actions: WorkflowAction[] = [
          {
            id: 'action-1',
            name: 'Test Action',
            type: 'wait',
            config: {}
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions);
        const validation = node.validate();

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject node without actions', () => {
        const node = new TaskNode('task-1', 'Test Task', []);
        const validation = node.validate();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Task node must have at least one action');
      });

      it('should validate action properties', () => {
        const actions: WorkflowAction[] = [
          {
            id: '',
            name: '',
            type: 'wait',
            config: {}
          } as WorkflowAction
        ];

        const node = new TaskNode('task-1', 'Test Task', actions);
        const validation = node.validate();

        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('missing required id'))).toBe(true);
        expect(validation.errors.some(e => e.includes('missing required type'))).toBe(true);
      });
    });

    describe('Timeout and Retry', () => {
      it('should handle timeout', async () => {
        const actions: WorkflowAction[] = [
          {
            id: 'action-1',
            name: 'Slow Action',
            type: 'wait',
            config: { duration: 1000 }
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions, {
          timeout: 50
        });

        const result = await node.execute(mockContext);
        
        // Should timeout and fail
        expect(result.success).toBe(false);
        expect(result.error).toContain('timed out');
      });

      it('should retry on failure', async () => {
        const retryPolicy: RetryPolicy = {
          enabled: true,
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 100,
          backoffStrategy: 'fixed',
          retryOn: ['timeout', 'error']
        };

        const actions: WorkflowAction[] = [
          {
            id: 'flaky-action',
            name: 'Flaky Action',
            type: 'wait',
            config: {},
            retryPolicy
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions, {
          retryPolicy
        });

        // Mock the action to fail initially
        let attempts = 0;
        jest.spyOn(node as any, 'executeAction').mockImplementation(async () => {
          attempts++;
          if (attempts <= 2) {
            throw new Error('Simulated failure');
          }
          return { success: true, data: 'Success after retries' };
        });

        const result = await node.execute(mockContext);
        
        expect(result.success).toBe(true);
        expect(attempts).toBe(3);
      });
    });

    describe('Event Emission', () => {
      it('should emit execution events', async () => {
        const actions: WorkflowAction[] = [
          {
            id: 'action-1',
            name: 'Test Action',
            type: 'wait',
            config: { duration: 10 }
          }
        ];

        const node = new TaskNode('task-1', 'Test Task', actions, {
          eventSystem: mockEventSystem
        });

        await node.execute(mockContext);

        const events = mockEventSystem.getEvents();
        expect(events.some(e => e.type === 'node.execution.started')).toBe(true);
        expect(events.some(e => e.type === 'node.execution.completed')).toBe(true);
      });
    });
  });

  describe('ConditionNode', () => {
    describe('Basic Functionality', () => {
      it('should create condition node', () => {
        const node = new ConditionNode('cond-1', 'Test Condition', 'testVar === "testValue"');
        
        expect(node.getId()).toBe('cond-1');
        expect(node.getName()).toBe('Test Condition');
        expect(node.getType()).toBe('condition');
      });

      it('should evaluate true condition', async () => {
        const options: ConditionNodeOptions = {
          trueNodeId: 'true-node',
          falseNodeId: 'false-node'
        };

        const node = new ConditionNode('cond-1', 'Test Condition', 'testVar === "testValue"', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('true-node');
        expect(result.data.conditionResult).toBe(true);
      });

      it('should evaluate false condition', async () => {
        const options: ConditionNodeOptions = {
          trueNodeId: 'true-node',
          falseNodeId: 'false-node'
        };

        const node = new ConditionNode('cond-1', 'Test Condition', 'testVar === "wrongValue"', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('false-node');
        expect(result.data.conditionResult).toBe(false);
      });

      it('should use default node when condition is false and no false path', async () => {
        const options: ConditionNodeOptions = {
          trueNodeId: 'true-node',
          defaultNodeId: 'default-node'
        };

        const node = new ConditionNode('cond-1', 'Test Condition', 'testVar === "wrongValue"', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.nextNodeId).toBe('default-node');
      });

      it('should handle complex conditions', async () => {
        const complexCondition = 'numVar > 40 && boolVar === true && arrayVar.length === 3';
        const node = new ConditionNode('cond-1', 'Complex Condition', complexCondition, {
          trueNodeId: 'success-node'
        });

        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data.conditionResult).toBe(true);
        expect(result.nextNodeId).toBe('success-node');
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid condition syntax', async () => {
        const node = new ConditionNode('cond-1', 'Bad Condition', 'invalid syntax !!!', {
          defaultNodeId: 'default-node'
        });

        const result = await node.execute(mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Condition evaluation failed');
        expect(result.nextNodeId).toBe('default-node');
      });

      it('should handle missing variables gracefully', async () => {
        const node = new ConditionNode('cond-1', 'Missing Var', 'nonExistentVar === true', {
          trueNodeId: 'true-node',
          falseNodeId: 'false-node'
        });

        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data.conditionResult).toBe(false); // Should default to false
      });
    });

    describe('Validation', () => {
      it('should validate valid condition node', () => {
        const node = new ConditionNode('cond-1', 'Test', 'testVar === true', {
          trueNodeId: 'true-node'
        });
        
        const validation = node.validate();
        expect(validation.isValid).toBe(true);
      });

      it('should reject empty condition', () => {
        const node = new ConditionNode('cond-1', 'Test', '', {
          trueNodeId: 'true-node'
        });
        
        const validation = node.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Condition expression is required');
      });

      it('should reject condition without any target nodes', () => {
        const node = new ConditionNode('cond-1', 'Test', 'true');
        
        const validation = node.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('target node'))).toBe(true);
      });
    });
  });

  describe('LoopNode', () => {
    describe('While Loop', () => {
      it('should execute while loop', async () => {
        mockContext.variables.set('counter', 0);
        
        const options: LoopNodeOptions = {
          condition: 'counter < 3',
          iterator: 'counter',
          maxIterations: 5
        };

        const node = new LoopNode('loop-1', 'While Loop', 'while', options);
        const result = await node.execute(mockContext, { counter: 0 });

        expect(result.success).toBe(true);
        expect(result.metadata?.iterations).toBeDefined();
        expect(result.variables?.[`${node.getId()}_iterations`]).toBeDefined();
      });

      it('should respect max iterations limit', async () => {
        const options: LoopNodeOptions = {
          condition: 'true', // Infinite condition
          maxIterations: 3
        };

        const node = new LoopNode('loop-1', 'Infinite Loop', 'while', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3); // Should stop at max iterations
      });
    });

    describe('For Loop', () => {
      it('should execute for loop', async () => {
        const options: LoopNodeOptions = {
          iterator: 'i',
          maxIterations: 5
        };

        const node = new LoopNode('loop-1', 'For Loop', 'for', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(5);
      });
    });

    describe('Foreach Loop', () => {
      it('should execute foreach loop', async () => {
        mockContext.variables.set('items', ['a', 'b', 'c']);
        
        const options: LoopNodeOptions = {
          collection: 'items',
          iterator: 'item',
          maxIterations: 10
        };

        const node = new LoopNode('loop-1', 'Foreach Loop', 'foreach', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3); // Should iterate over 3 items
      });

      it('should handle empty collection', async () => {
        mockContext.variables.set('emptyItems', []);
        
        const options: LoopNodeOptions = {
          collection: 'emptyItems',
          iterator: 'item'
        };

        const node = new LoopNode('loop-1', 'Empty Foreach', 'foreach', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should handle non-array collection', async () => {
        mockContext.variables.set('notArray', 'string');
        
        const options: LoopNodeOptions = {
          collection: 'notArray',
          iterator: 'item'
        };

        const node = new LoopNode('loop-1', 'Invalid Foreach', 'foreach', options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not an array');
      });
    });

    describe('Validation', () => {
      it('should validate while loop', () => {
        const node = new LoopNode('loop-1', 'While Loop', 'while', {
          condition: 'counter < 5'
        });
        
        const validation = node.validate();
        expect(validation.isValid).toBe(true);
      });

      it('should reject while loop without condition', () => {
        const node = new LoopNode('loop-1', 'While Loop', 'while');
        
        const validation = node.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('While loop requires a condition');
      });

      it('should reject foreach without collection', () => {
        const node = new LoopNode('loop-1', 'Foreach Loop', 'foreach', {
          iterator: 'item'
        });
        
        const validation = node.validate();
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Foreach loop requires a collection');
      });

      it('should warn about high max iterations', () => {
        const node = new LoopNode('loop-1', 'High Loop', 'for', {
          maxIterations: 2000
        });
        
        const validation = node.validate();
        expect(validation.warnings.some(w => w.includes('performance issues'))).toBe(true);
      });
    });
  });

  describe('ParallelNode', () => {
    describe('Basic Functionality', () => {
      it('should create parallel node with child nodes', () => {
        const childIds = ['child-1', 'child-2', 'child-3'];
        const node = new ParallelNode('parallel-1', 'Parallel Task', childIds);
        
        expect(node.getId()).toBe('parallel-1');
        expect(node.getName()).toBe('Parallel Task');
        expect(node.getType()).toBe('parallel');
      });

      it('should execute child nodes in parallel', async () => {
        const childIds = ['child-1', 'child-2', 'child-3'];
        const node = new ParallelNode('parallel-1', 'Parallel Task', childIds);
        
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
        expect(result.variables?.[`${node.getId()}_total`]).toBe(3);
        expect(result.variables?.[`${node.getId()}_successful`]).toBeDefined();
      });

      it('should handle mixed success/failure results', async () => {
        const childIds = ['good-child', 'bad-child', 'another-good-child'];
        const options: ParallelNodeOptions = {
          waitForAll: false // Allow partial success
        };
        
        const node = new ParallelNode('parallel-1', 'Mixed Parallel', childIds, options);
        
        // Mock executeChild to simulate mixed results
        jest.spyOn(node as any, 'executeChild')
          .mockImplementation(async (...args: any[]) => {
            const childId = args[0] as string;
            if (childId === 'bad-child') {
              throw new Error('Child failed');
            }
            return {
              success: true,
              data: `${childId} completed`,
              variables: { [`${childId}_result`]: 'success' }
            };
          });

        const result = await node.execute(mockContext);

        expect(result.success).toBe(true); // Should succeed because waitForAll is false
        expect(result.variables?.[`${node.getId()}_failed`]).toBe(1);
        expect(result.variables?.[`${node.getId()}_successful`]).toBe(2);
      });

      it('should fail when waitForAll is true and any child fails', async () => {
        const childIds = ['good-child', 'bad-child'];
        const options: ParallelNodeOptions = {
          waitForAll: true
        };
        
        const node = new ParallelNode('parallel-1', 'All-or-Nothing', childIds, options);
        
        // Mock one child to fail
        jest.spyOn(node as any, 'executeChild')
          .mockImplementation(async (...args: any[]) => {
            const childId = args[0] as string;
            if (childId === 'bad-child') {
              throw new Error('Child failed');
            }
            return { success: true, data: 'success' };
          });

        const result = await node.execute(mockContext);

        expect(result.success).toBe(false); // Should fail because waitForAll is true
      });
    });

    describe('Concurrency Control', () => {
      it('should respect max concurrency limits', async () => {
        const childIds = ['child-1', 'child-2', 'child-3', 'child-4', 'child-5'];
        const options: ParallelNodeOptions = {
          maxConcurrency: 2
        };
        
        const node = new ParallelNode('parallel-1', 'Limited Parallel', childIds, options);
        const result = await node.execute(mockContext);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(5); // All children should complete eventually
      });

      it('should handle child timeouts', async () => {
        const childIds = ['fast-child', 'slow-child'];
        const options: ParallelNodeOptions = {
          timeoutPerChild: 100
        };
        
        const node = new ParallelNode('parallel-1', 'Timeout Parallel', childIds, options);
        
        // Mock slow child to exceed timeout
        jest.spyOn(node as any, 'executeChild')
          .mockImplementation(async (...args: any[]) => {
            const childId = args[0] as string;
            const delay = childId === 'slow-child' ? 200 : 50;
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                if (childId === 'slow-child') {
                  reject(new Error('Child timed out'));
                } else {
                  resolve({ success: true, data: 'fast result' });
                }
              }, delay);
            });
          });

        const result = await node.execute(mockContext);

        // Should handle timeout gracefully
        expect(result).toBeDefined();
      });
    });

    describe('Validation', () => {
      it('should validate node with child nodes', () => {
        const node = new ParallelNode('parallel-1', 'Test', ['child-1', 'child-2']);
        const validation = node.validate();

        expect(validation.isValid).toBe(true);
      });

      it('should reject node without child nodes', () => {
        const node = new ParallelNode('parallel-1', 'Test', []);
        const validation = node.validate();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Parallel node must have at least one child node');
      });

      it('should warn about single child', () => {
        const node = new ParallelNode('parallel-1', 'Test', ['only-child']);
        const validation = node.validate();

        expect(validation.warnings.some(w => w.includes('only one child'))).toBe(true);
      });

      it('should reject duplicate child IDs', () => {
        const node = new ParallelNode('parallel-1', 'Test', ['child-1', 'child-2', 'child-1']);
        const validation = node.validate();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Duplicate child node IDs are not allowed');
      });

      it('should warn about high concurrency', () => {
        const childIds = Array.from({ length: 5 }, (_, i) => `child-${i}`);
        const node = new ParallelNode('parallel-1', 'Test', childIds, {
          maxConcurrency: 15
        });
        
        const validation = node.validate();
        expect(validation.warnings.some(w => w.includes('High concurrency'))).toBe(true);
      });
    });

    describe('Estimation', () => {
      it('should provide realistic estimates for parallel execution', () => {
        const childIds = ['child-1', 'child-2', 'child-3', 'child-4'];
        const options: ParallelNodeOptions = {
          maxConcurrency: 2
        };
        
        const node = new ParallelNode('parallel-1', 'Test', childIds, options);
        const estimate = node.getEstimate();

        expect(estimate.estimatedDuration).toBeGreaterThan(0);
        expect(estimate.resourceIntensive).toBe(false); // 2 <= 3 threshold
        expect(estimate.canParallelize).toBe(true);
        expect(estimate.dependencies).toEqual(childIds);
      });

      it('should identify resource-intensive parallel nodes', () => {
        const childIds = Array.from({ length: 8 }, (_, i) => `child-${i}`);
        const options: ParallelNodeOptions = {
          maxConcurrency: 5
        };
        
        const node = new ParallelNode('parallel-1', 'Heavy Parallel', childIds, options);
        const estimate = node.getEstimate();

        expect(estimate.resourceIntensive).toBe(true); // 5 > 3 threshold
      });
    });
  });

  describe('WorkflowNodeFactory', () => {
    describe('Node Creation', () => {
      it('should create task node', () => {
        const config = {
          actions: [
            {
              id: 'action-1',
              name: 'Test Action',
              type: 'wait',
              config: {}
            }
          ]
        };
        
        const node = WorkflowNodeFactory.create('task', 'node-1', 'Test Node', config);
        
        expect(node).toBeInstanceOf(TaskNode);
        expect(node.getType()).toBe('task');
      });

      it('should create condition node', () => {
        const config = {
          condition: 'testVar === true',
          trueNodeId: 'true-node'
        };
        
        const node = WorkflowNodeFactory.create('condition', 'node-1', 'Test Condition', config);
        
        expect(node).toBeInstanceOf(ConditionNode);
        expect(node.getType()).toBe('condition');
      });

      it('should create loop node', () => {
        const config = {
          loopType: 'while',
          condition: 'counter < 5'
        };
        
        const node = WorkflowNodeFactory.create('loop', 'node-1', 'Test Loop', config);
        
        expect(node).toBeInstanceOf(LoopNode);
        expect(node.getType()).toBe('loop');
      });

      it('should create parallel node', () => {
        const config = {
          childNodeIds: ['child-1', 'child-2']
        };
        
        const node = WorkflowNodeFactory.create('parallel', 'node-1', 'Test Parallel', config);
        
        expect(node).toBeInstanceOf(ParallelNode);
        expect(node.getType()).toBe('parallel');
      });

      it('should throw error for unknown node type', () => {
        expect(() => {
          WorkflowNodeFactory.create('unknown', 'node-1', 'Test', {});
        }).toThrow('Unknown node type: unknown');
      });
    });

    describe('Custom Node Registration', () => {
      it('should register custom node type', () => {
        class CustomNode extends WorkflowNode {
          getType(): string { return 'custom'; }
          async execute(): Promise<NodeExecutionResult> {
            return { success: true, data: 'custom result' };
          }
          validate(): ValidationResult {
            return { isValid: true, errors: [], warnings: [] };
          }
        }

        const customConstructor = (id: string, name: string, config: any, options?: any) => 
          new CustomNode(id, name, options);
        
        WorkflowNodeFactory.register('custom', customConstructor as any);
        
        const node = WorkflowNodeFactory.create('custom', 'custom-1', 'Custom Node', {});
        expect(node).toBeInstanceOf(CustomNode);
      });
    });

    describe('Available Types', () => {
      it('should list available node types', () => {
        const types = WorkflowNodeFactory.getAvailableTypes();
        
        expect(types).toContain('task');
        expect(types).toContain('condition');
        expect(types).toContain('loop');
        expect(types).toContain('parallel');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined execution context', async () => {
      const actions: WorkflowAction[] = [
        { id: 'action-1', name: 'Test', type: 'wait', config: {} }
      ];
      
      const node = new TaskNode('task-1', 'Test', actions);
      
      // Should not crash but may return error result
      await expect(node.execute(null as any)).rejects.toThrow();
    });

    it('should handle empty variable context', async () => {
      const emptyContext = {
        ...mockContext,
        variables: new Map()
      };
      
      const node = new ConditionNode('cond-1', 'Test', 'unknownVar === true', {
        trueNodeId: 'true',
        falseNodeId: 'false'
      });
      
      const result = await node.execute(emptyContext);
      expect(result.success).toBe(true);
      expect(result.data.conditionResult).toBe(false);
    });

    it('should handle malformed input data', async () => {
      const actions: WorkflowAction[] = [
        { id: 'action-1', name: 'Test', type: 'wait', config: {} }
      ];
      
      const node = new TaskNode('task-1', 'Test', actions);
      
      const result = await node.execute(mockContext, { malformed: 'data' });
      expect(result).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should complete node execution within reasonable time', async () => {
      const actions: WorkflowAction[] = [
        { id: 'action-1', name: 'Fast Action', type: 'wait', config: { duration: 10 } }
      ];
      
      const node = new TaskNode('task-1', 'Fast Task', actions);
      
      const startTime = Date.now();
      await node.execute(mockContext);
      const endTime = Date.now();
      
      // Should complete within reasonable time (1 second for safety)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should provide accurate execution estimates', () => {
      const manyActions: WorkflowAction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `action-${i}`,
        name: `Action ${i}`,
        type: 'wait' as const,
        config: {}
      }));
      
      const node = new TaskNode('big-task', 'Big Task', manyActions);
      const estimate = node.getEstimate();
      
      expect(estimate.estimatedDuration).toBe(10000); // 10 actions * 1000ms
      expect(estimate.resourceIntensive).toBe(true); // > 5 actions
    });
  });
});
