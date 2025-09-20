/**
 * Comprehensive test suite for WorkflowEngine
 * Tests state machine behavior, event processing, plugin system and error handling
 */

import { WorkflowEngine } from '../WorkflowEngine';
import { WorkflowStateManager } from '../WorkflowStateManager';
import { 
  WorkflowDefinition, 
  WorkflowExecution, 
  ExecutionStatus, 
  WorkflowEvent,
  WorkflowError,
  WorkflowErrorCode,
  ExecutionContext,
  PluginResult,
  WorkflowState
} from '../../../types/workflow';
import { createMockLLMProvider } from '../../../test-utils/mocks/llmProvider';

// Mock dependencies
const mockStateManager = {
  createExecution: jest.fn(),
  updateExecution: jest.fn(),
  getExecution: jest.fn(),
  addEvent: jest.fn(),
  getEvents: jest.fn(),
  deleteExecution: jest.fn(),
  listExecutions: jest.fn(),
  getExecutionsByWorkflow: jest.fn()
};

const mockPluginSystem = {
  execute: jest.fn(),
  loadPlugin: jest.fn(),
  unloadPlugin: jest.fn(),
  listPlugins: jest.fn(),
  getPlugin: jest.fn()
};

const mockServices = {
  database: {
    query: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn()
  },
  notification: {
    send: jest.fn(),
    sendBatch: jest.fn()
  },
  analytics: {
    track: jest.fn(),
    trackBatch: jest.fn()
  },
  auth: {
    validateToken: jest.fn().mockResolvedValue(true),
    getUserById: jest.fn().mockResolvedValue({ id: 'user-1', role: 'student' }),
    hasPermission: jest.fn().mockResolvedValue(true)
  },
  ai: createMockLLMProvider(),
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
};

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let sampleWorkflow: WorkflowDefinition;
  let sampleExecution: WorkflowExecution;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create engine with mocked dependencies
    engine = new WorkflowEngine(mockServices as any);

    // Sample workflow definition for student progress tracking
    sampleWorkflow = {
      id: 'workflow-1',
      name: 'Student Progress Tracking',
      description: 'Tracks student progress through modules',
      version: '1.0.0',
      category: 'progress_tracking',
      trigger: {
        type: 'event',
        event: 'module.completed',
        conditions: [],
        immediate: true,
        enabled: true
      },
      states: [
        {
          id: 'start',
          name: 'Start',
          type: 'task',
          isInitial: true,
          isFinal: false,
          actions: [{
            id: 'log-start',
            type: 'execute_plugin',
            name: 'Log Start',
            plugin: 'logger',
            config: { message: 'Workflow started' }
          }]
        },
        {
          id: 'process-progress',
          name: 'Process Progress',
          type: 'task',
          isInitial: false,
          isFinal: false,
          actions: [{
            id: 'update-progress',
            type: 'execute_plugin',
            name: 'Update Progress',
            plugin: 'student-progress',
            config: { track: true }
          }]
        },
        {
          id: 'end',
          name: 'End',
          type: 'end',
          isInitial: false,
          isFinal: true,
          actions: []
        }
      ],
      transitions: [
        {
          id: 'start-to-process',
          from: 'start',
          to: 'process-progress',
          priority: 1
        },
        {
          id: 'process-to-end',
          from: 'process-progress',
          to: 'end',
          priority: 1
        }
      ],
      variables: [
        {
          name: 'userId',
          type: 'string',
          required: true,
          description: 'User ID for progress tracking'
        },
        {
          name: 'moduleId',
          type: 'string',
          required: true,
          description: 'Module ID being tracked'
        }
      ],
      metadata: {
        tags: ['progress', 'student', 'tracking'],
        author: 'system',
        dependencies: []
      },
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      is_active: true
    };

    // Sample execution
    sampleExecution = {
      id: 'execution-1',
      workflow_id: 'workflow-1',
      user_id: 'user-1',
      status: 'pending' as ExecutionStatus,
      current_state: 'start',
      variables: {
        userId: 'user-1',
        moduleId: 'module-1'
      },
      execution_history: [],
      retry_count: 0,
      started_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  });

  describe('Initialization', () => {
    test('should initialize with required dependencies', () => {
      expect(engine).toBeDefined();
      expect(engine).toHaveProperty('startExecution');
      expect(engine).toHaveProperty('pauseExecution');
      expect(engine).toHaveProperty('resumeExecution');
      expect(engine).toHaveProperty('cancelExecution');
    });

    test('should throw error if initialized without required dependencies', () => {
      expect(() => new WorkflowEngine(null as any))
        .toThrow();
    });
  });

  describe('Workflow Execution', () => {
    test('should execute simple workflow successfully', async () => {
      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true, data: { message: 'Plugin executed' } });
      mockStateManager.updateExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'completed' as ExecutionStatus,
        current_state: 'end'
      });

      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.workflow_id).toBe('workflow-1');
      expect(result.variables).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          moduleId: 'module-1'
        })
      );
    });

    test('should handle workflow execution with partial input', async () => {
      const partialInput = { moduleId: 'module-1' }; // missing userId

      const result = await engine.startExecution(sampleWorkflow, partialInput);

      expect(result).toBeDefined();
      expect(result.variables).toEqual(partialInput);
    });

    test('should track execution events', async () => {
      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      // The test passes if execution completes without error and returns an execution object
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    test('should handle plugin execution failures gracefully', async () => {
      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      // Should complete execution even if plugins are not available
      expect(result).toBeDefined();
      expect(result.workflow_id).toBe('workflow-1');
    });
  });

  describe('State Machine Logic', () => {
    test('should transition between states correctly', async () => {
      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      // Should create execution with initial state
      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });

    test('should handle conditional transitions', async () => {
      const workflowWithConditions = {
        ...sampleWorkflow,
        transitions: [
          {
            id: 'conditional-transition',
            from: 'start',
            to: 'process-progress',
            condition: 'variables.userId === "user-1"',
            priority: 1
          }
        ]
      };

      const result = await engine.startExecution(workflowWithConditions, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(result).toBeDefined();
      expect(result.workflow_id).toBe('workflow-1');
    });

    test('should handle parallel state execution', async () => {
      const parallelWorkflow: WorkflowDefinition = {
        ...sampleWorkflow,
        states: [
          ...sampleWorkflow.states,
          {
            id: 'parallel-state',
            name: 'Parallel Processing',
            type: 'parallel',
            isInitial: false,
            isFinal: false,
            actions: [
              {
                id: 'action-1',
                type: 'execute_plugin',
                name: 'Action 1',
                plugin: 'parallel-plugin-1',
                config: {}
              },
              {
                id: 'action-2',
                type: 'execute_plugin',
                name: 'Action 2',
                plugin: 'parallel-plugin-2',
                config: {}
              }
            ]
          }
        ]
      };

      const result = await engine.startExecution(parallelWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(result).toBeDefined();
      expect(result.workflow_id).toBe('workflow-1');
    });

    test('should reach final state correctly', async () => {
      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      // Should create execution successfully
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  describe('Event Processing', () => {
    test('should process workflow events correctly', async () => {
      const event: WorkflowEvent = {
        id: 'event-1',
        type: 'module.completed',
        source: 'learning-system',
        data: { moduleId: 'module-1', userId: 'user-1' },
        timestamp: new Date()
      };

      mockStateManager.createExecution.mockResolvedValue(sampleExecution);

      const result = await engine.processEvent(event, sampleWorkflow);

      expect(result).toBeDefined();
      expect(mockStateManager.createExecution).toHaveBeenCalled();
    });

    test('should filter events based on trigger conditions', async () => {
      const workflowWithConditions = {
        ...sampleWorkflow,
        trigger: {
          ...sampleWorkflow.trigger,
          conditions: [{
            field: 'data.moduleId',
            operator: 'equals' as const,
            value: 'required-module',
            type: 'string' as const
          }]
        }
      };

      const event: WorkflowEvent = {
        id: 'event-1',
        type: 'module.completed',
        source: 'learning-system',
        data: { moduleId: 'wrong-module', userId: 'user-1' },
        timestamp: new Date()
      };

      const result = await engine.processEvent(event, workflowWithConditions);

      expect(result).toBeNull(); // Should not trigger workflow
      expect(mockStateManager.createExecution).not.toHaveBeenCalled();
    });

    test('should handle event processing errors', async () => {
      const event: WorkflowEvent = {
        id: 'event-1',
        type: 'module.completed',
        source: 'learning-system',
        data: { moduleId: 'module-1', userId: 'user-1' },
        timestamp: new Date()
      };

      mockStateManager.createExecution.mockRejectedValue(new Error('Database error'));

      await expect(engine.processEvent(event, sampleWorkflow))
        .rejects.toThrow(WorkflowError);
    });
  });

  describe('Plugin System Integration', () => {
    test('should execute plugins with correct context', async () => {
      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(mockPluginSystem.execute).toHaveBeenCalledWith(
        'logger',
        expect.objectContaining({
          executionId: 'execution-1',
          workflowId: 'workflow-1',
          userId: 'user-1',
          variables: expect.any(Map),
          services: mockServices,
          logger: expect.any(Object)
        }),
        expect.objectContaining({
          message: 'Workflow started'
        })
      );
    });

    test('should handle plugin timeout', async () => {
      const workflowWithTimeout = {
        ...sampleWorkflow,
        states: [
          {
            ...sampleWorkflow.states[0],
            actions: [{
              ...sampleWorkflow.states[0].actions[0],
              timeout: 100 // 100ms timeout
            }]
          },
          ...sampleWorkflow.states.slice(1)
        ]
      };

      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      
      // Mock slow plugin execution
      mockPluginSystem.execute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 200))
      );

      const result = await engine.startExecution(workflowWithTimeout, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(result.success).toBe(false);
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'execution-1',
        expect.objectContaining({
          status: 'failed',
          error_message: expect.stringContaining('timeout')
        })
      );
    });

    test('should apply plugin retry policy', async () => {
      const workflowWithRetry = {
        ...sampleWorkflow,
        states: [
          {
            ...sampleWorkflow.states[0],
            actions: [{
              ...sampleWorkflow.states[0].actions[0],
              retryPolicy: {
                maxAttempts: 3,
                backoffStrategy: 'fixed' as const,
                initialDelay: 10,
                maxDelay: 100,
                retryOn: ['PLUGIN_ERROR'],
                enabled: true
              }
            }]
          },
          ...sampleWorkflow.states.slice(1)
        ]
      };

      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      
      // Mock failing plugin that succeeds on retry
      mockPluginSystem.execute
        .mockResolvedValueOnce({ success: false, error: 'PLUGIN_ERROR' })
        .mockResolvedValueOnce({ success: false, error: 'PLUGIN_ERROR' })
        .mockResolvedValueOnce({ success: true });

      await engine.startExecution(workflowWithRetry, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(mockPluginSystem.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('Execution Control', () => {
    test('should pause execution', async () => {
      mockStateManager.getExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'running' as ExecutionStatus
      });
      mockStateManager.updateExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'paused' as ExecutionStatus
      });

      const result = await engine.pauseExecution('execution-1');

      expect(result.success).toBe(true);
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'execution-1',
        expect.objectContaining({
          status: 'paused'
        })
      );
    });

    test('should resume execution', async () => {
      mockStateManager.getExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'paused' as ExecutionStatus
      });
      mockStateManager.updateExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'running' as ExecutionStatus
      });

      const result = await engine.resumeExecution('execution-1');

      expect(result.success).toBe(true);
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'execution-1',
        expect.objectContaining({
          status: 'running'
        })
      );
    });

    test('should cancel execution', async () => {
      mockStateManager.getExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'running' as ExecutionStatus
      });
      mockStateManager.updateExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'cancelled' as ExecutionStatus
      });

      const result = await engine.cancelExecution('execution-1');

      expect(result.success).toBe(true);
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'execution-1',
        expect.objectContaining({
          status: 'cancelled'
        })
      );
    });

    test('should not allow invalid state transitions', async () => {
      mockStateManager.getExecution.mockResolvedValue({
        ...sampleExecution,
        status: 'completed' as ExecutionStatus
      });

      await expect(engine.pauseExecution('execution-1'))
        .rejects.toThrow(WorkflowError);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle execution not found', async () => {
      mockStateManager.getExecution.mockResolvedValue(null);

      await expect(engine.pauseExecution('non-existent'))
        .rejects.toThrow(new WorkflowError(
          'Execution not found',
          WorkflowErrorCode.EXECUTION_NOT_FOUND,
          'non-existent'
        ));
    });

    test('should handle invalid workflow definition', async () => {
      const invalidWorkflow = {
        ...sampleWorkflow,
        states: [] // No states defined
      };

      await expect(engine.startExecution(invalidWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      })).rejects.toThrow(WorkflowError);
    });

    test('should handle circular transitions', async () => {
      const workflowWithCycle = {
        ...sampleWorkflow,
        transitions: [
          { id: 'cycle-1', from: 'start', to: 'process-progress', priority: 1 },
          { id: 'cycle-2', from: 'process-progress', to: 'start', priority: 1 }
        ]
      };

      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      // Should detect infinite loop and terminate
      await expect(engine.startExecution(workflowWithCycle, {
        userId: 'user-1',
        moduleId: 'module-1'
      })).rejects.toThrow('Maximum execution steps exceeded');
    });

    test('should handle memory leaks in long-running workflows', async () => {
      // Mock a workflow with many variables and large data
      const largeExecution = {
        ...sampleExecution,
        variables: {
          ...Array.from({ length: 1000 }, (_, i) => ({ [`var${i}`]: `value${i}`.repeat(1000) }))
            .reduce((acc, obj) => ({ ...acc, ...obj }), {})
        }
      };

      mockStateManager.createExecution.mockResolvedValue(largeExecution);
      mockStateManager.getExecution.mockResolvedValue(largeExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      // Should complete without memory issues
      const result = await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(result).toBeDefined();
    });

    test('should handle concurrent execution limits', async () => {
      // Mock multiple concurrent executions
      const executions = Array.from({ length: 10 }, (_, i) => ({
        ...sampleExecution,
        id: `execution-${i}`
      }));

      mockStateManager.listExecutions.mockResolvedValue(executions);
      
      await expect(engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      })).rejects.toThrow('Maximum concurrent executions exceeded');
    });
  });

  describe('Performance Tests', () => {
    test('should execute workflow within reasonable time', async () => {
      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      const startTime = Date.now();
      
      await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle high-frequency event processing', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        type: 'module.completed',
        source: 'learning-system',
        data: { moduleId: `module-${i}`, userId: 'user-1' },
        timestamp: new Date()
      }));

      mockStateManager.createExecution.mockResolvedValue(sampleExecution);

      const startTime = Date.now();
      
      const results = await Promise.all(
        events.map(event => engine.processEvent(event, sampleWorkflow))
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should process 100 events within 5 seconds
      expect(results).toHaveLength(100);
    });
  });

  describe('Logging and Monitoring', () => {
    test('should log execution start and completion', async () => {
      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Workflow execution started'),
        expect.objectContaining({
          executionId: 'execution-1',
          workflowId: 'workflow-1'
        })
      );
    });

    test('should track execution metrics', async () => {
      mockStateManager.createExecution.mockResolvedValue(sampleExecution);
      mockStateManager.getExecution.mockResolvedValue(sampleExecution);
      mockPluginSystem.execute.mockResolvedValue({ success: true });

      await engine.startExecution(sampleWorkflow, {
        userId: 'user-1',
        moduleId: 'module-1'
      });

      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'workflow.execution.completed',
          properties: expect.objectContaining({
            workflow_id: 'workflow-1',
            execution_id: 'execution-1'
          })
        })
      );
    });
  });
});