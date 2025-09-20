/**
 * Comprehensive test suite for WorkflowStateManager
 * Tests state persistence, real-time updates, progress tracking and concurrent modifications
 */

// Mock Supabase first before any imports
jest.mock('@supabase/supabase-js', () => {
  const mockRealtimeChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    send: jest.fn()
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    channel: jest.fn(() => mockRealtimeChannel),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn()
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient)
  };
});

import { WorkflowStateManager } from '../WorkflowStateManager';
import {
  WorkflowExecution,
  ExecutionStatus,
  ExecutionEvent,
  ListExecutionsQuery,
  WorkflowEvent
} from '../../../types/workflow';
import { createClient } from '@supabase/supabase-js';

// Access the mocked client for test assertions
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
let mockSupabaseClient: any;

describe('WorkflowStateManager', () => {
  let stateManager: WorkflowStateManager;
  let sampleExecution: WorkflowExecution;
  let sampleEvent: ExecutionEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock client instance
    mockSupabaseClient = mockCreateClient();
    stateManager = new WorkflowStateManager();

    sampleExecution = {
      id: 'execution-1',
      workflow_id: 'workflow-1',
      user_id: 'user-1',
      status: 'pending' as ExecutionStatus,
      current_state: 'start',
      variables: {
        userId: 'user-1',
        moduleId: 'module-1',
        progress: 0
      },
      input_data: { moduleId: 'module-1' },
      execution_history: [],
      retry_count: 0,
      started_at: new Date('2024-01-01T10:00:00Z'),
      created_at: new Date('2024-01-01T10:00:00Z'),
      updated_at: new Date('2024-01-01T10:00:00Z')
    };

    sampleEvent = {
      id: 'event-1',
      execution_id: 'execution-1',
      event_type: 'workflow.started',
      event_data: { message: 'Workflow started successfully' },
      timestamp: new Date('2024-01-01T10:00:00Z')
    };
  });

  describe('Execution Management', () => {
    describe('createExecution', () => {
      test('should create new execution successfully', async () => {
        const executionData = {
          workflow_id: 'workflow-1',
          user_id: 'user-1',
          status: 'pending' as ExecutionStatus,
          variables: { userId: 'user-1', moduleId: 'module-1' },
          input_data: { moduleId: 'module-1' }
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: sampleExecution,
          error: null
        });

        const result = await stateManager.createExecution(executionData);

        expect(result).toEqual(sampleExecution);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            workflow_id: 'workflow-1',
            user_id: 'user-1',
            status: 'pending',
            variables: { userId: 'user-1', moduleId: 'module-1' }
          })
        ]);
      });

      test('should handle creation errors', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        });

        await expect(stateManager.createExecution({
          workflow_id: 'workflow-1',
          status: 'pending' as ExecutionStatus
        })).rejects.toThrow('Failed to create execution: Database connection failed');
      });

      test('should validate required fields', async () => {
        await expect(stateManager.createExecution({} as any))
          .rejects.toThrow('workflow_id is required');
      });

      test('should set default values correctly', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: { ...sampleExecution, retry_count: 0 },
          error: null
        });

        await stateManager.createExecution({
          workflow_id: 'workflow-1',
          status: 'pending' as ExecutionStatus
        });

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            retry_count: 0,
            execution_history: [],
            variables: {}
          })
        ]);
      });
    });

    describe('getExecution', () => {
      test('should retrieve execution by ID', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: sampleExecution,
          error: null
        });

        const result = await stateManager.getExecution('execution-1');

        expect(result).toEqual(sampleExecution);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'execution-1');
      });

      test('should return null for non-existent execution', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // Not found
        });

        const result = await stateManager.getExecution('non-existent');

        expect(result).toBeNull();
      });

      test('should handle database errors', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        });

        await expect(stateManager.getExecution('execution-1'))
          .rejects.toThrow('Failed to get execution: Database error');
      });
    });

    describe('updateExecution', () => {
      test('should update execution successfully', async () => {
        const updates = {
          status: 'running' as ExecutionStatus,
          current_state: 'process-step',
          variables: { progress: 50 }
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: { ...sampleExecution, ...updates },
          error: null
        });

        const result = await stateManager.updateExecution('execution-1', updates);

        expect(result.status).toBe('running');
        expect(result.current_state).toBe('process-step');
        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining(updates)
        );
      });

      test('should handle concurrent updates', async () => {
        const update1 = { variables: { progress: 25 } };
        const update2 = { variables: { progress: 75 } };

        mockSupabaseClient.single
          .mockResolvedValueOnce({
            data: { ...sampleExecution, ...update1 },
            error: null
          })
          .mockResolvedValueOnce({
            data: { ...sampleExecution, ...update2 },
            error: null
          });

        // Simulate concurrent updates
        const [result1, result2] = await Promise.all([
          stateManager.updateExecution('execution-1', update1),
          stateManager.updateExecution('execution-1', update2)
        ]);

        expect(mockSupabaseClient.update).toHaveBeenCalledTimes(2);
        expect(result1.variables.progress).toBe(25);
        expect(result2.variables.progress).toBe(75);
      });

      test('should merge variables instead of replacing', async () => {
        const existingExecution = {
          ...sampleExecution,
          variables: { userId: 'user-1', moduleId: 'module-1', score: 85 }
        };

        const updates = {
          variables: { progress: 75, completed: true }
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: {
            ...existingExecution,
            variables: { ...existingExecution.variables, ...updates.variables }
          },
          error: null
        });

        const result = await stateManager.updateExecution('execution-1', updates);

        expect(result.variables).toEqual({
          userId: 'user-1',
          moduleId: 'module-1',
          score: 85,
          progress: 75,
          completed: true
        });
      });

      test('should append to execution history', async () => {
        const historyEntry = {
          timestamp: new Date(),
          action: 'state_changed',
          from: 'start',
          to: 'process-step'
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: {
            ...sampleExecution,
            execution_history: [historyEntry]
          },
          error: null
        });

        await stateManager.updateExecution('execution-1', {
          execution_history: [historyEntry]
        });

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            execution_history: [historyEntry]
          })
        );
      });
    });

    describe('deleteExecution', () => {
      test('should delete execution and related data', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: { id: 'execution-1' },
          error: null
        });

        const result = await stateManager.deleteExecution('execution-1');

        expect(result).toBe(true);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'execution-1');
      });

      test('should handle deletion of non-existent execution', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: null
        });

        const result = await stateManager.deleteExecution('non-existent');

        expect(result).toBe(false);
      });

      test('should cascade delete related events', async () => {
        // Mock successful execution deletion
        mockSupabaseClient.single
          .mockResolvedValueOnce({ data: { id: 'execution-1' }, error: null })
          .mockResolvedValueOnce({ data: [], error: null });

        await stateManager.deleteExecution('execution-1');

        // Should also delete related events through cascade
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
      });
    });
  });

  describe('Execution Queries', () => {
    describe('listExecutions', () => {
      test('should list executions with pagination', async () => {
        const executions = [sampleExecution, { ...sampleExecution, id: 'execution-2' }];
        const query: ListExecutionsQuery = {
          limit: 10,
          offset: 0
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: executions,
          error: null
        });

        const result = await stateManager.listExecutions(query);

        expect(result).toEqual(executions);
        expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10);
        expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9);
      });

      test('should filter by status', async () => {
        const query: ListExecutionsQuery = {
          status: 'running'
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleExecution],
          error: null
        });

        await stateManager.listExecutions(query);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'running');
      });

      test('should filter by user ID', async () => {
        const query: ListExecutionsQuery = {
          userId: 'user-1'
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleExecution],
          error: null
        });

        await stateManager.listExecutions(query);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1');
      });

      test('should filter by date range', async () => {
        const query: ListExecutionsQuery = {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          }
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleExecution],
          error: null
        });

        await stateManager.listExecutions(query);

        expect(mockSupabaseClient.gte).toHaveBeenCalledWith('started_at', '2024-01-01T00:00:00.000Z');
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith('started_at', '2024-01-31T00:00:00.000Z');
      });

      test('should order by creation date descending by default', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleExecution],
          error: null
        });

        await stateManager.listExecutions({});

        expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });
    });

    describe('getExecutionsByWorkflow', () => {
      test('should retrieve executions for specific workflow', async () => {
        const executions = [sampleExecution, { ...sampleExecution, id: 'execution-2' }];
        
        mockSupabaseClient.single.mockResolvedValue({
          data: executions,
          error: null
        });

        const result = await stateManager.getExecutionsByWorkflow('workflow-1');

        expect(result).toEqual(executions);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('workflow_id', 'workflow-1');
      });

      test('should filter by status when provided', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleExecution],
          error: null
        });

        await stateManager.getExecutionsByWorkflow('workflow-1', 'completed');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('workflow_id', 'workflow-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'completed');
      });
    });
  });

  describe('Event Management', () => {
    describe('addEvent', () => {
      test('should add execution event successfully', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: sampleEvent,
          error: null
        });

        const result = await stateManager.addEvent(sampleEvent);

        expect(result).toEqual(sampleEvent);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_events');
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            execution_id: 'execution-1',
            event_type: 'workflow.started',
            event_data: { message: 'Workflow started successfully' }
          })
        ]);
      });

      test('should auto-generate event ID', async () => {
        const eventWithoutId = {
          execution_id: 'execution-1',
          event_type: 'workflow.started',
          event_data: { message: 'Test' },
          timestamp: new Date()
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: { ...eventWithoutId, id: 'generated-id' },
          error: null
        });

        const result = await stateManager.addEvent(eventWithoutId as any);

        expect(result.id).toBe('generated-id');
      });

      test('should handle event creation errors', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'Constraint violation' }
        });

        await expect(stateManager.addEvent(sampleEvent))
          .rejects.toThrow('Failed to add event: Constraint violation');
      });
    });

    describe('getEvents', () => {
      test('should retrieve events for execution', async () => {
        const events = [sampleEvent, { ...sampleEvent, id: 'event-2' }];
        
        mockSupabaseClient.single.mockResolvedValue({
          data: events,
          error: null
        });

        const result = await stateManager.getEvents('execution-1');

        expect(result).toEqual(events);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_events');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('execution_id', 'execution-1');
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: true });
      });

      test('should filter by event type', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleEvent],
          error: null
        });

        await stateManager.getEvents('execution-1', 'workflow.started');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('event_type', 'workflow.started');
      });

      test('should limit results when specified', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: [sampleEvent],
          error: null
        });

        await stateManager.getEvents('execution-1', undefined, 5);

        expect(mockSupabaseClient.limit).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('Real-time Updates', () => {
    test('should subscribe to execution updates', () => {
      const callback = jest.fn();
      
      stateManager.subscribeToExecution('execution-1', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('execution-execution-1');
      expect(mockRealtimeChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions',
          filter: 'id=eq.execution-1'
        },
        expect.any(Function)
      );
      expect(mockRealtimeChannel.subscribe).toHaveBeenCalled();
    });

    test('should handle real-time execution updates', () => {
      const callback = jest.fn();
      let realtimeCallback: Function;

      mockRealtimeChannel.on.mockImplementation((event, filter, cb) => {
        realtimeCallback = cb;
        return mockRealtimeChannel;
      });

      stateManager.subscribeToExecution('execution-1', callback);

      // Simulate real-time update
      const payload = {
        eventType: 'UPDATE',
        new: { ...sampleExecution, status: 'running' },
        old: sampleExecution
      };

      realtimeCallback!(payload);

      expect(callback).toHaveBeenCalledWith({
        type: 'UPDATE',
        execution: payload.new
      });
    });

    test('should subscribe to execution events', () => {
      const callback = jest.fn();
      
      stateManager.subscribeToExecutionEvents('execution-1', callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('events-execution-1');
      expect(mockRealtimeChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_events',
          filter: 'execution_id=eq.execution-1'
        },
        expect.any(Function)
      );
    });

    test('should unsubscribe from updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = stateManager.subscribeToExecution('execution-1', callback);
      unsubscribe();

      expect(mockRealtimeChannel.unsubscribe).toHaveBeenCalled();
    });

    test('should handle subscription errors gracefully', () => {
      const callback = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      mockRealtimeChannel.subscribe.mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      expect(() => stateManager.subscribeToExecution('execution-1', callback))
        .not.toThrow();

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to subscribe to execution updates:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('Progress Tracking', () => {
    test('should calculate execution progress', async () => {
      const executionWithHistory = {
        ...sampleExecution,
        execution_history: [
          { step: 'start', timestamp: '2024-01-01T10:00:00Z' },
          { step: 'process', timestamp: '2024-01-01T10:05:00Z' },
          { step: 'validate', timestamp: '2024-01-01T10:10:00Z' }
        ]
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: executionWithHistory,
        error: null
      });

      const progress = await stateManager.getExecutionProgress('execution-1');

      expect(progress).toEqual({
        executionId: 'execution-1',
        currentStep: 3,
        totalSteps: expect.any(Number),
        percentage: expect.any(Number),
        timeElapsed: expect.any(Number),
        estimatedTimeRemaining: expect.any(Number)
      });
    });

    test('should track step durations', async () => {
      const executionWithTiming = {
        ...sampleExecution,
        execution_history: [
          { step: 'start', timestamp: '2024-01-01T10:00:00Z', duration: 1000 },
          { step: 'process', timestamp: '2024-01-01T10:05:00Z', duration: 5000 }
        ]
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: executionWithTiming,
        error: null
      });

      const metrics = await stateManager.getExecutionMetrics('execution-1');

      expect(metrics).toEqual({
        averageStepDuration: 3000,
        totalDuration: 6000,
        slowestStep: { step: 'process', duration: 5000 },
        fastestStep: { step: 'start', duration: 1000 }
      });
    });
  });

  describe('Concurrent Access', () => {
    test('should handle concurrent execution updates', async () => {
      const updates = [
        { status: 'running' as ExecutionStatus },
        { variables: { progress: 50 } },
        { current_state: 'processing' }
      ];

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: { ...sampleExecution, status: 'running' }, error: null })
        .mockResolvedValueOnce({ data: { ...sampleExecution, variables: { progress: 50 } }, error: null })
        .mockResolvedValueOnce({ data: { ...sampleExecution, current_state: 'processing' }, error: null });

      const results = await Promise.all(
        updates.map(update => stateManager.updateExecution('execution-1', update))
      );

      expect(results).toHaveLength(3);
      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(3);
    });

    test('should handle concurrent event additions', async () => {
      const events = [
        { ...sampleEvent, id: 'event-1', event_type: 'step.started' },
        { ...sampleEvent, id: 'event-2', event_type: 'step.completed' },
        { ...sampleEvent, id: 'event-3', event_type: 'step.failed' }
      ];

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: events[0], error: null })
        .mockResolvedValueOnce({ data: events[1], error: null })
        .mockResolvedValueOnce({ data: events[2], error: null });

      const results = await Promise.all(
        events.map(event => stateManager.addEvent(event))
      );

      expect(results).toHaveLength(3);
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(3);
    });

    test('should prevent race conditions in state updates', async () => {
      // Mock optimistic locking scenario
      let updateCount = 0;
      mockSupabaseClient.single.mockImplementation(() => {
        updateCount++;
        if (updateCount === 1) {
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'Concurrent update detected' }
          });
        }
        return Promise.resolve({
          data: { ...sampleExecution, status: 'running', retry_count: 1 },
          error: null
        });
      });

      // Should retry on concurrent update
      const result = await stateManager.updateExecution('execution-1', { 
        status: 'running' as ExecutionStatus 
      });

      expect(result.retry_count).toBe(1);
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Cleanup', () => {
    test('should batch multiple event insertions', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        ...sampleEvent,
        id: `event-${i}`,
        event_type: `event.type.${i}`
      }));

      mockSupabaseClient.single.mockResolvedValue({
        data: events,
        error: null
      });

      const result = await stateManager.addEventsBatch(events);

      expect(result).toHaveLength(100);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(events);
    });

    test('should cleanup old executions', async () => {
      const oldExecutions = [
        { id: 'old-1', status: 'completed' },
        { id: 'old-2', status: 'failed' }
      ];

      mockSupabaseClient.single.mockResolvedValue({
        data: oldExecutions,
        error: null
      });

      const deleted = await stateManager.cleanupOldExecutions(30); // 30 days

      expect(deleted).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    test('should archive completed executions', async () => {
      const completedExecutions = [sampleExecution];
      
      mockSupabaseClient.single.mockResolvedValue({
        data: completedExecutions,
        error: null
      });

      const archived = await stateManager.archiveCompletedExecutions();

      expect(archived).toBe(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions_archive');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection failures', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Connection timeout'));

      await expect(stateManager.getExecution('execution-1'))
        .rejects.toThrow('Connection timeout');
    });

    test('should handle malformed execution data', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...sampleExecution, variables: 'invalid-json' },
        error: null
      });

      // Should handle gracefully or throw specific error
      const result = await stateManager.getExecution('execution-1');
      expect(result).toBeDefined();
    });

    test('should handle transaction rollbacks', async () => {
      const transactionMock = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      mockSupabaseClient.rpc = transactionMock;

      await expect(stateManager.createExecutionWithEvents('execution-1', [sampleEvent]))
        .rejects.toThrow('Transaction failed');
    });
  });

  describe('Migration and Compatibility', () => {
    test('should handle legacy execution format', async () => {
      const legacyExecution = {
        ...sampleExecution,
        variables: JSON.stringify({ userId: 'user-1' }) // Legacy string format
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: legacyExecution,
        error: null
      });

      const result = await stateManager.getExecution('execution-1');

      expect(typeof result?.variables).toBe('object');
      expect(result?.variables.userId).toBe('user-1');
    });

    test('should migrate old event format', async () => {
      const legacyEvent = {
        ...sampleEvent,
        event_data: JSON.stringify({ message: 'legacy' })
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: legacyEvent,
        error: null
      });

      const events = await stateManager.getEvents('execution-1');

      expect(events[0].event_data).toEqual({ message: 'legacy' });
    });
  });
});