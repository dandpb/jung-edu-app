import { jest } from '@jest/globals';
import { StateManagementEngine } from '../../src/engines/StateManagementEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { StateManager } from '../../src/managers/StateManager';
import { StateTransitionValidator } from '../../src/validators/StateTransitionValidator';
import { StatePersistenceService } from '../../src/services/StatePersistenceService';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { EventEmitter } from '../../src/events/EventEmitter';
import {
  WorkflowState,
  StateTransition,
  StateSnapshot,
  StateValidationResult,
  StateMachineConfiguration,
  TransitionContext
} from '../../src/types/State';

// London School TDD - Focus on state management behavior and transitions
describe('Workflow State Management', () => {
  let stateEngine: StateManagementEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockStateManager: jest.Mocked<StateManager>;
  let mockStateTransitionValidator: jest.Mocked<StateTransitionValidator>;
  let mockStatePersistenceService: jest.Mocked<StatePersistenceService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const initialWorkflowState: WorkflowState = {
    id: 'workflow-state-123',
    workflowId: 'workflow-123',
    status: 'initialized',
    currentStep: null,
    variables: new Map([
      ['input', { type: 'string', value: 'test-input' }],
      ['counter', { type: 'number', value: 0 }]
    ]),
    executionHistory: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    version: 1
  };

  const stateMachineConfig: StateMachineConfiguration = {
    id: 'workflow-state-machine',
    initialState: 'initialized',
    states: {
      initialized: {
        transitions: [
          { to: 'running', trigger: 'start', conditions: [] },
          { to: 'cancelled', trigger: 'cancel', conditions: [] }
        ]
      },
      running: {
        transitions: [
          { to: 'paused', trigger: 'pause', conditions: [] },
          { to: 'completed', trigger: 'complete', conditions: ['all_steps_completed'] },
          { to: 'failed', trigger: 'error', conditions: [] }
        ]
      },
      paused: {
        transitions: [
          { to: 'running', trigger: 'resume', conditions: [] },
          { to: 'cancelled', trigger: 'cancel', conditions: [] }
        ]
      },
      completed: {
        transitions: []
      },
      failed: {
        transitions: [
          { to: 'running', trigger: 'retry', conditions: ['retry_limit_not_exceeded'] }
        ]
      },
      cancelled: {
        transitions: []
      }
    }
  };

  beforeEach(() => {
    mockWorkflowRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByStatus: jest.fn(),
      getWorkflowHistory: jest.fn()
    } as jest.Mocked<WorkflowRepository>;

    mockStateManager = {
      initializeState: jest.fn(),
      transitionState: jest.fn(),
      updateVariables: jest.fn(),
      getState: jest.fn(),
      setState: jest.fn(),
      mergeState: jest.fn(),
      resetState: jest.fn(),
      cloneState: jest.fn()
    } as jest.Mocked<StateManager>;

    mockStateTransitionValidator = {
      validateTransition: jest.fn(),
      validateConditions: jest.fn(),
      canTransition: jest.fn(),
      getValidTransitions: jest.fn(),
      validateStateMachine: jest.fn()
    } as jest.Mocked<StateTransitionValidator>;

    mockStatePersistenceService = {
      saveState: jest.fn(),
      loadState: jest.fn(),
      createSnapshot: jest.fn(),
      restoreSnapshot: jest.fn(),
      deleteState: jest.fn(),
      getStateHistory: jest.fn(),
      compactHistory: jest.fn()
    } as jest.Mocked<StatePersistenceService>;

    mockExecutionContext = {
      getWorkflowId: jest.fn(),
      getCurrentStep: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn(),
      getExecutionState: jest.fn(),
      updateState: jest.fn(),
      addError: jest.fn(),
      getErrors: jest.fn(),
      clone: jest.fn(),
      reset: jest.fn()
    } as jest.Mocked<ExecutionContext>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    stateEngine = new StateManagementEngine(
      mockWorkflowRepository,
      mockStateManager,
      mockStateTransitionValidator,
      mockStatePersistenceService,
      mockExecutionContext,
      mockEventEmitter
    );
  });

  describe('State Initialization', () => {
    it('should initialize workflow state with proper validation', async () => {
      // Arrange
      mockStateManager.initializeState.mockResolvedValue(initialWorkflowState);
      mockStateTransitionValidator.validateStateMachine.mockResolvedValue({
        valid: true,
        errors: []
      });
      mockStatePersistenceService.saveState.mockResolvedValue({
        success: true,
        stateId: 'workflow-state-123'
      });

      // Act
      const result = await stateEngine.initializeWorkflowState(
        'workflow-123',
        stateMachineConfig,
        { input: 'test-input', counter: 0 }
      );

      // Assert - Verify initialization interactions
      expect(mockStateTransitionValidator.validateStateMachine).toHaveBeenCalledWith(
        stateMachineConfig
      );
      
      expect(mockStateManager.initializeState).toHaveBeenCalledWith(
        'workflow-123',
        stateMachineConfig,
        expect.objectContaining({
          input: 'test-input',
          counter: 0
        })
      );

      expect(mockStatePersistenceService.saveState).toHaveBeenCalledWith(
        initialWorkflowState
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.initialized',
        expect.objectContaining({
          workflowId: 'workflow-123',
          initialState: 'initialized',
          stateId: 'workflow-state-123'
        })
      );

      expect(result.success).toBe(true);
      expect(result.state).toEqual(initialWorkflowState);
    });

    it('should reject invalid state machine configurations', async () => {
      // Arrange
      const invalidStateMachine = {
        ...stateMachineConfig,
        states: {
          // Missing required 'initialized' state
          running: { transitions: [] }
        }
      };

      mockStateTransitionValidator.validateStateMachine.mockResolvedValue({
        valid: false,
        errors: [
          { field: 'initialState', message: 'Initial state "initialized" not found in states' }
        ]
      });

      // Act
      const result = await stateEngine.initializeWorkflowState(
        'workflow-123',
        invalidStateMachine,
        {}
      );

      // Assert - Verify validation interaction
      expect(mockStateTransitionValidator.validateStateMachine).toHaveBeenCalledWith(
        invalidStateMachine
      );
      expect(mockStateManager.initializeState).not.toHaveBeenCalled();
      expect(mockStatePersistenceService.saveState).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'initialState' })
      );
    });
  });

  describe('State Transitions', () => {
    it('should execute valid state transitions with proper validation', async () => {
      // Arrange
      const runningState: WorkflowState = {
        ...initialWorkflowState,
        status: 'running',
        currentStep: 'step-1',
        updatedAt: new Date('2024-01-01T01:00:00Z'),
        version: 2
      };

      mockStateManager.getState.mockResolvedValue(initialWorkflowState);
      mockStateTransitionValidator.canTransition.mockResolvedValue(true);
      mockStateTransitionValidator.validateTransition.mockResolvedValue({
        valid: true,
        errors: []
      } as StateValidationResult);

      mockStateManager.transitionState.mockResolvedValue(runningState);
      mockStatePersistenceService.saveState.mockResolvedValue({
        success: true,
        stateId: 'workflow-state-123'
      });

      const transitionContext: TransitionContext = {
        trigger: 'start',
        timestamp: new Date('2024-01-01T01:00:00Z'),
        metadata: { initiatedBy: 'user-123' }
      };

      // Act
      const result = await stateEngine.transitionState(
        'workflow-state-123',
        'running',
        transitionContext
      );

      // Assert - Verify transition interactions
      expect(mockStateManager.getState).toHaveBeenCalledWith('workflow-state-123');
      
      expect(mockStateTransitionValidator.canTransition).toHaveBeenCalledWith(
        'initialized', // from state
        'running',     // to state
        'start',       // trigger
        stateMachineConfig
      );

      expect(mockStateTransitionValidator.validateTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'initialized',
          to: 'running',
          trigger: 'start'
        }),
        mockExecutionContext
      );

      expect(mockStateManager.transitionState).toHaveBeenCalledWith(
        initialWorkflowState,
        'running',
        transitionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.transition.completed',
        expect.objectContaining({
          workflowId: 'workflow-123',
          fromState: 'initialized',
          toState: 'running',
          trigger: 'start'
        })
      );

      expect(result.success).toBe(true);
      expect(result.state?.status).toBe('running');
    });

    it('should reject invalid state transitions', async () => {
      // Arrange
      const completedState: WorkflowState = {
        ...initialWorkflowState,
        status: 'completed'
      };

      mockStateManager.getState.mockResolvedValue(completedState);
      mockStateTransitionValidator.canTransition.mockResolvedValue(false);
      mockStateTransitionValidator.getValidTransitions.mockResolvedValue([]);

      // Act
      const result = await stateEngine.transitionState(
        'workflow-state-123',
        'running', // Invalid: can't go from completed to running
        { trigger: 'start', timestamp: new Date() }
      );

      // Assert - Verify rejection interactions
      expect(mockStateTransitionValidator.canTransition).toHaveBeenCalledWith(
        'completed',
        'running',
        'start',
        expect.any(Object)
      );
      expect(mockStateTransitionValidator.getValidTransitions).toHaveBeenCalledWith(
        'completed',
        expect.any(Object)
      );
      expect(mockStateManager.transitionState).not.toHaveBeenCalled();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.transition.rejected',
        expect.objectContaining({
          fromState: 'completed',
          toState: 'running',
          reason: 'Invalid transition'
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transition');
    });

    it('should handle conditional state transitions', async () => {
      // Arrange
      const runningState: WorkflowState = {
        ...initialWorkflowState,
        status: 'running',
        variables: new Map([
          ['completedSteps', { type: 'array', value: ['step-1', 'step-2', 'step-3'] }],
          ['totalSteps', { type: 'number', value: 3 }]
        ])
      };

      mockStateManager.getState.mockResolvedValue(runningState);
      mockStateTransitionValidator.canTransition.mockResolvedValue(true);

      // Mock condition evaluation for 'all_steps_completed'
      mockStateTransitionValidator.validateConditions.mockResolvedValue({
        'all_steps_completed': {
          result: true,
          expression: 'completedSteps.length === totalSteps',
          evaluatedValues: { completedSteps: 3, totalSteps: 3 }
        }
      });

      mockStateTransitionValidator.validateTransition.mockResolvedValue({
        valid: true,
        errors: [],
        conditionsEvaluated: { 'all_steps_completed': true }
      });

      const completedState: WorkflowState = {
        ...runningState,
        status: 'completed',
        version: runningState.version + 1
      };

      mockStateManager.transitionState.mockResolvedValue(completedState);
      mockStatePersistenceService.saveState.mockResolvedValue({ success: true });

      // Act
      const result = await stateEngine.transitionState(
        'workflow-state-123',
        'completed',
        { trigger: 'complete', timestamp: new Date() }
      );

      // Assert - Verify conditional transition handling
      expect(mockStateTransitionValidator.validateConditions).toHaveBeenCalledWith(
        ['all_steps_completed'],
        runningState,
        mockExecutionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.conditions.evaluated',
        expect.objectContaining({
          conditions: expect.objectContaining({
            'all_steps_completed': expect.objectContaining({ result: true })
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.state?.status).toBe('completed');
    });
  });

  describe('State Variable Management', () => {
    it('should update state variables with validation', async () => {
      // Arrange
      mockStateManager.getState.mockResolvedValue(initialWorkflowState);
      
      const updatedState: WorkflowState = {
        ...initialWorkflowState,
        variables: new Map([
          ['input', { type: 'string', value: 'updated-input' }],
          ['counter', { type: 'number', value: 5 }],
          ['newVariable', { type: 'boolean', value: true }]
        ]),
        updatedAt: new Date('2024-01-01T02:00:00Z'),
        version: 2
      };

      mockStateManager.updateVariables.mockResolvedValue(updatedState);
      mockStatePersistenceService.saveState.mockResolvedValue({ success: true });

      const variableUpdates = {
        input: 'updated-input',
        counter: 5,
        newVariable: true
      };

      // Act
      const result = await stateEngine.updateStateVariables(
        'workflow-state-123',
        variableUpdates
      );

      // Assert - Verify variable update interactions
      expect(mockStateManager.getState).toHaveBeenCalledWith('workflow-state-123');
      expect(mockStateManager.updateVariables).toHaveBeenCalledWith(
        initialWorkflowState,
        variableUpdates
      );
      expect(mockStatePersistenceService.saveState).toHaveBeenCalledWith(updatedState);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.variables.updated',
        expect.objectContaining({
          stateId: 'workflow-state-123',
          updatedVariables: ['input', 'counter', 'newVariable']
        })
      );

      expect(result.success).toBe(true);
      expect(result.state?.variables.get('counter')?.value).toBe(5);
    });

    it('should merge state variables from multiple sources', async () => {
      // Arrange
      const sourceState1: WorkflowState = {
        ...initialWorkflowState,
        variables: new Map([
          ['shared', { type: 'string', value: 'from-source1' }],
          ['unique1', { type: 'number', value: 1 }]
        ])
      };

      const sourceState2: WorkflowState = {
        ...initialWorkflowState,
        variables: new Map([
          ['shared', { type: 'string', value: 'from-source2' }], // Conflict
          ['unique2', { type: 'number', value: 2 }]
        ])
      };

      mockStateManager.getState.mockResolvedValue(initialWorkflowState);

      const mergedState: WorkflowState = {
        ...initialWorkflowState,
        variables: new Map([
          ['input', { type: 'string', value: 'test-input' }], // Original
          ['counter', { type: 'number', value: 0 }], // Original
          ['shared', { type: 'string', value: 'from-source2' }], // Source2 wins
          ['unique1', { type: 'number', value: 1 }], // From source1
          ['unique2', { type: 'number', value: 2 }] // From source2
        ])
      };

      mockStateManager.mergeState.mockResolvedValue(mergedState);
      mockStatePersistenceService.saveState.mockResolvedValue({ success: true });

      // Act
      const result = await stateEngine.mergeStateVariables(
        'workflow-state-123',
        [sourceState1, sourceState2],
        { conflictResolution: 'last-wins' }
      );

      // Assert - Verify state merging interactions
      expect(mockStateManager.mergeState).toHaveBeenCalledWith(
        initialWorkflowState,
        [sourceState1, sourceState2],
        expect.objectContaining({ conflictResolution: 'last-wins' })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.merge.completed',
        expect.objectContaining({
          mergedVariables: ['shared', 'unique1', 'unique2'],
          conflicts: ['shared']
        })
      );

      expect(result.success).toBe(true);
      expect(result.state?.variables.get('shared')?.value).toBe('from-source2');
    });
  });

  describe('State Snapshots and Recovery', () => {
    it('should create and restore state snapshots', async () => {
      // Arrange
      const currentState: WorkflowState = {
        ...initialWorkflowState,
        status: 'running',
        currentStep: 'step-2',
        variables: new Map([
          ['processed', { type: 'array', value: ['item1', 'item2'] }]
        ])
      };

      mockStateManager.getState.mockResolvedValue(currentState);

      const snapshot: StateSnapshot = {
        id: 'snapshot-123',
        stateId: 'workflow-state-123',
        workflowId: 'workflow-123',
        state: currentState,
        createdAt: new Date('2024-01-01T03:00:00Z'),
        metadata: {
          reason: 'checkpoint',
          createdBy: 'system'
        }
      };

      mockStatePersistenceService.createSnapshot.mockResolvedValue(snapshot);
      mockStatePersistenceService.restoreSnapshot.mockResolvedValue(currentState);

      // Act - Create snapshot
      const createResult = await stateEngine.createStateSnapshot(
        'workflow-state-123',
        { reason: 'checkpoint', createdBy: 'system' }
      );

      // Act - Restore snapshot
      const restoreResult = await stateEngine.restoreStateSnapshot('snapshot-123');

      // Assert - Verify snapshot interactions
      expect(mockStatePersistenceService.createSnapshot).toHaveBeenCalledWith(
        currentState,
        expect.objectContaining({ reason: 'checkpoint' })
      );

      expect(mockStatePersistenceService.restoreSnapshot).toHaveBeenCalledWith('snapshot-123');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.snapshot.created',
        expect.objectContaining({
          snapshotId: 'snapshot-123',
          stateId: 'workflow-state-123'
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.snapshot.restored',
        expect.objectContaining({
          snapshotId: 'snapshot-123',
          restoredState: expect.objectContaining({ status: 'running' })
        })
      );

      expect(createResult.success).toBe(true);
      expect(restoreResult.success).toBe(true);
    });

    it('should handle state rollback on failure', async () => {
      // Arrange
      const stableState: WorkflowState = {
        ...initialWorkflowState,
        status: 'running',
        currentStep: 'step-1',
        version: 2
      };

      const corruptedState: WorkflowState = {
        ...stableState,
        status: 'failed',
        currentStep: 'step-2',
        version: 3,
        variables: new Map() // Corrupted - lost all variables
      };

      mockStateManager.getState.mockResolvedValue(corruptedState);
      mockStatePersistenceService.getStateHistory.mockResolvedValue([
        { state: corruptedState, version: 3 },
        { state: stableState, version: 2 }, // Last stable state
        { state: initialWorkflowState, version: 1 }
      ]);

      mockStateManager.setState.mockResolvedValue(stableState);
      mockStatePersistenceService.saveState.mockResolvedValue({ success: true });

      // Act
      const result = await stateEngine.rollbackState(
        'workflow-state-123',
        { strategy: 'last-stable' }
      );

      // Assert - Verify rollback interactions
      expect(mockStatePersistenceService.getStateHistory).toHaveBeenCalledWith(
        'workflow-state-123',
        expect.objectContaining({ limit: expect.any(Number) })
      );

      expect(mockStateManager.setState).toHaveBeenCalledWith(
        'workflow-state-123',
        stableState
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.rollback.completed',
        expect.objectContaining({
          stateId: 'workflow-state-123',
          rolledBackFrom: 3,
          rolledBackTo: 2,
          strategy: 'last-stable'
        })
      );

      expect(result.success).toBe(true);
      expect(result.state?.version).toBe(2);
    });
  });

  describe('State Persistence and History', () => {
    it('should manage state history with proper cleanup', async () => {
      // Arrange
      const stateHistory = [
        { state: { ...initialWorkflowState, version: 3 }, version: 3 },
        { state: { ...initialWorkflowState, version: 2 }, version: 2 },
        { state: { ...initialWorkflowState, version: 1 }, version: 1 }
      ];

      mockStatePersistenceService.getStateHistory.mockResolvedValue(stateHistory);
      mockStatePersistenceService.compactHistory.mockResolvedValue({
        compacted: true,
        originalCount: 3,
        compactedCount: 2,
        preservedVersions: [3, 2]
      });

      // Act
      const historyResult = await stateEngine.getStateHistory(
        'workflow-state-123',
        { limit: 10 }
      );

      const compactResult = await stateEngine.compactStateHistory(
        'workflow-state-123',
        { keepLatest: 2, strategy: 'version-based' }
      );

      // Assert - Verify history management interactions
      expect(mockStatePersistenceService.getStateHistory).toHaveBeenCalledWith(
        'workflow-state-123',
        expect.objectContaining({ limit: 10 })
      );

      expect(mockStatePersistenceService.compactHistory).toHaveBeenCalledWith(
        'workflow-state-123',
        expect.objectContaining({ keepLatest: 2, strategy: 'version-based' })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.history.compacted',
        expect.objectContaining({
          stateId: 'workflow-state-123',
          originalCount: 3,
          compactedCount: 2
        })
      );

      expect(historyResult.success).toBe(true);
      expect(historyResult.history?.length).toBe(3);
      expect(compactResult.success).toBe(true);
    });
  });

  describe('Concurrent State Management', () => {
    it('should handle concurrent state modifications with conflict resolution', async () => {
      // Arrange
      const baseState: WorkflowState = {
        ...initialWorkflowState,
        version: 1
      };

      // Two concurrent updates
      const update1 = { counter: 5 };
      const update2 = { counter: 10, newField: 'added' };

      mockStateManager.getState.mockResolvedValue(baseState);

      // First update succeeds
      mockStateManager.updateVariables
        .mockResolvedValueOnce({
          ...baseState,
          variables: new Map([...baseState.variables, ['counter', { type: 'number', value: 5 }]]),
          version: 2
        })
        // Second update detects conflict (version mismatch)
        .mockRejectedValueOnce(new Error('Version conflict: expected 1, got 2'));

      mockStatePersistenceService.saveState.mockResolvedValue({ success: true });

      // Act - Simulate concurrent updates
      const promise1 = stateEngine.updateStateVariables('workflow-state-123', update1);
      const promise2 = stateEngine.updateStateVariables('workflow-state-123', update2);

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // Assert - Verify conflict handling
      expect(mockStateManager.updateVariables).toHaveBeenCalledTimes(2);
      
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'state.conflict.detected',
        expect.objectContaining({
          stateId: 'workflow-state-123',
          conflictType: 'version_mismatch'
        })
      );

      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');
    });
  });
});