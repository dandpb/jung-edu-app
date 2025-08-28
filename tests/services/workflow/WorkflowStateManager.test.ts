import { EventEmitter } from 'events';
import { 
  WorkflowStateManager, 
  WorkflowState, 
  WorkflowStatus,
  StateTransition,
  WorkflowStateManagerConfig
} from '../../../src/services/workflow/WorkflowStateManager';
import { StateStore } from '../../../src/services/workflow/StateStore';
import { StateValidator, createDefaultStateValidator } from '../../../src/services/workflow/StateValidator';
import { Logger } from '../../../src/utils/Logger';

// Mock dependencies
jest.mock('../../../src/services/workflow/StateStore');
jest.mock('../../../src/utils/Logger');

describe('WorkflowStateManager', () => {
  let stateManager: WorkflowStateManager;
  let mockStateStore: jest.Mocked<StateStore>;
  let mockValidator: StateValidator;
  let mockEventEmitter: EventEmitter;
  let mockLogger: jest.Mocked<Logger>;

  const createMockState = (overrides: Partial<WorkflowState> = {}): WorkflowState => ({
    id: 'test-state-1',
    workflowId: 'test-workflow-1',
    status: WorkflowStatus.PENDING,
    currentStep: 'start',
    data: { testData: 'value' },
    metadata: {
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      version: 1,
      createdBy: 'test-user',
      updatedBy: 'test-user'
    },
    history: [],
    ...overrides
  });

  beforeEach(() => {
    mockStateStore = {
      initialize: jest.fn(),
      saveState: jest.fn(),
      getState: jest.fn(),
      deleteState: jest.fn(),
      getStatesByWorkflow: jest.fn(),
      saveCheckpoint: jest.fn(),
      getCheckpoint: jest.fn(),
      executeTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      getStats: jest.fn(),
      close: jest.fn()
    } as any;

    mockValidator = createDefaultStateValidator();
    mockEventEmitter = new EventEmitter();
    mockLogger = {
      info: jest.fn() as jest.MockedFunction<(message: string, context?: string, data?: any) => void>,
      debug: jest.fn() as jest.MockedFunction<(message: string, context?: string, data?: any) => void>,
      warn: jest.fn() as jest.MockedFunction<(message: string, context?: string, data?: any) => void>,
      error: jest.fn() as jest.MockedFunction<(message: string, context?: string, data?: any) => void>,
      setLogLevel: jest.fn(),
      log: jest.fn(),
      getLogs: jest.fn(),
      clearLogs: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    const config: WorkflowStateManagerConfig = {
      stateStore: mockStateStore,
      validator: mockValidator,
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      transactionTimeout: 5000,
      maxHistoryEntries: 10,
      enableSnapshots: true
    };

    stateManager = new WorkflowStateManager(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createState', () => {
    it('should create a new workflow state', async () => {
      const mockState = createMockState();
      mockStateStore.saveState.mockResolvedValue(undefined);
      mockStateStore.saveCheckpoint.mockResolvedValue(undefined);

      const result = await stateManager.createState(
        'test-workflow-1',
        WorkflowStatus.PENDING,
        'start',
        { testData: 'value' },
        'test-user'
      );

      expect(result).toBeDefined();
      expect(result.workflowId).toBe('test-workflow-1');
      expect(result.status).toBe(WorkflowStatus.PENDING);
      expect(result.currentStep).toBe('start');
      expect(result.data).toEqual({ testData: 'value' });
      expect(result.metadata.createdBy).toBe('test-user');
      expect(mockStateStore.saveState).toHaveBeenCalledWith(expect.objectContaining({
        workflowId: 'test-workflow-1',
        status: WorkflowStatus.PENDING
      }));
    });

    it('should emit state:created event', async () => {
      mockStateStore.saveState.mockResolvedValue(undefined);
      mockStateStore.saveCheckpoint.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('state:created', eventSpy);

      await stateManager.createState('test-workflow-1');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        state: expect.any(Object),
        timestamp: expect.any(Date)
      }));
    });

    it('should handle state creation errors', async () => {
      mockStateStore.saveState.mockRejectedValue(new Error('Database error'));

      await expect(stateManager.createState('test-workflow-1')).rejects.toThrow('State creation failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should retrieve an existing state', async () => {
      const mockState = createMockState();
      mockStateStore.getState.mockResolvedValue(mockState);

      const result = await stateManager.getState('test-state-1');

      expect(result).toEqual(mockState);
      expect(mockStateStore.getState).toHaveBeenCalledWith('test-state-1');
    });

    it('should return null for non-existent state', async () => {
      mockStateStore.getState.mockResolvedValue(null);

      const result = await stateManager.getState('non-existent');

      expect(result).toBeNull();
      expect(mockStateStore.getState).toHaveBeenCalledWith('non-existent');
    });

    it('should emit state:retrieved event when state is found', async () => {
      const mockState = createMockState();
      mockStateStore.getState.mockResolvedValue(mockState);

      const eventSpy = jest.fn();
      mockEventEmitter.on('state:retrieved', eventSpy);

      await stateManager.getState('test-state-1');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        stateId: 'test-state-1',
        timestamp: expect.any(Date)
      }));
    });
  });

  describe('updateState', () => {
    it('should update an existing state', async () => {
      const mockState = createMockState();
      const updatedState = { ...mockState, status: WorkflowStatus.RUNNING };
      
      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const result = await stateManager.updateState(
        'test-state-1',
        { status: WorkflowStatus.RUNNING },
        'test-user',
        'Starting workflow'
      );

      expect(result.status).toBe(WorkflowStatus.RUNNING);
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.updatedBy).toBe('test-user');
      expect(result.history).toHaveLength(1);
      expect(result.history[0].reason).toBe('Starting workflow');
      expect(mockStateStore.saveState).toHaveBeenCalled();
    });

    it('should emit state:updated event', async () => {
      const mockState = createMockState();
      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('state:updated', eventSpy);

      await stateManager.updateState('test-state-1', { status: WorkflowStatus.RUNNING });

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        previousState: mockState,
        newState: expect.any(Object),
        updates: { status: WorkflowStatus.RUNNING },
        timestamp: expect.any(Date)
      }));
    });

    it('should throw error for non-existent state', async () => {
      mockStateStore.getState.mockResolvedValue(null);

      await expect(stateManager.updateState('non-existent', { status: WorkflowStatus.RUNNING }))
        .rejects.toThrow('State not found: non-existent');
    });

    it('should trim history when max entries exceeded', async () => {
      const mockState = createMockState({
        history: Array(12).fill(null).map((_, i) => ({
          id: `hist-${i}`,
          previousStatus: WorkflowStatus.PENDING,
          newStatus: WorkflowStatus.RUNNING,
          previousStep: 'start',
          newStep: 'process',
          timestamp: new Date(),
          triggeredBy: 'test-user'
        }))
      });

      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const result = await stateManager.updateState('test-state-1', { status: WorkflowStatus.COMPLETED });

      expect(result.history.length).toBe(10); // maxHistoryEntries
    });
  });

  describe('transitionState', () => {
    it('should transition state successfully', async () => {
      const mockState = createMockState({ status: WorkflowStatus.PENDING });
      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        step: 'process',
        triggeredBy: 'test-user',
        reason: 'Start processing'
      };

      const result = await stateManager.transitionState('test-state-1', transition);

      expect(result.status).toBe(WorkflowStatus.RUNNING);
      expect(result.currentStep).toBe('process');
    });

    it('should throw error for invalid current status', async () => {
      const mockState = createMockState({ status: WorkflowStatus.RUNNING });
      mockStateStore.getState.mockResolvedValue(mockState);

      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.COMPLETED
      };

      await expect(stateManager.transitionState('test-state-1', transition))
        .rejects.toThrow('Invalid transition: expected pending, got running');
    });
  });

  describe('createCheckpoint', () => {
    it('should create a checkpoint', async () => {
      const mockState = createMockState();
      const mockCheckpoint = {
        id: 'checkpoint-1',
        stateId: 'test-state-1',
        snapshot: mockState,
        createdAt: new Date(),
        description: 'Test checkpoint'
      };

      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveCheckpoint.mockResolvedValue(undefined);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const result = await stateManager.createCheckpoint('test-state-1', 'Test checkpoint');

      expect(result).toBeDefined();
      expect(result.stateId).toBe('test-state-1');
      expect(result.description).toBe('Test checkpoint');
      expect(mockStateStore.saveCheckpoint).toHaveBeenCalled();
    });

    it('should emit checkpoint:created event', async () => {
      const mockState = createMockState();
      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.saveCheckpoint.mockResolvedValue(undefined);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('checkpoint:created', eventSpy);

      await stateManager.createCheckpoint('test-state-1');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        checkpoint: expect.any(Object),
        timestamp: expect.any(Date)
      }));
    });
  });

  describe('restoreFromCheckpoint', () => {
    it('should restore state from checkpoint', async () => {
      const mockState = createMockState();
      const mockCheckpoint = {
        id: 'checkpoint-1',
        stateId: 'test-state-1',
        snapshot: mockState,
        createdAt: new Date(),
        description: 'Test checkpoint'
      };

      mockStateStore.getCheckpoint.mockResolvedValue(mockCheckpoint);
      mockStateStore.saveState.mockResolvedValue(undefined);

      const result = await stateManager.restoreFromCheckpoint('checkpoint-1', 'test-user');

      expect(result).toBeDefined();
      expect(result.metadata.version).toBe(2); // Version incremented
      expect(result.metadata.updatedBy).toBe('test-user');
      expect(result.history.length).toBe(1); // Restoration entry added
      expect(result.history[0].reason).toContain('checkpoint-1');
    });

    it('should throw error for non-existent checkpoint', async () => {
      mockStateStore.getCheckpoint.mockResolvedValue(null);

      await expect(stateManager.restoreFromCheckpoint('non-existent'))
        .rejects.toThrow('Checkpoint not found: non-existent');
    });
  });

  describe('transaction management', () => {
    it('should start and manage transactions', async () => {
      const transactionId = await stateManager.startTransaction();

      expect(transactionId).toBeDefined();
      expect(typeof transactionId).toBe('string');
      expect(transactionId.startsWith('txn_')).toBe(true);
    });

    it('should commit transaction successfully', async () => {
      const transactionId = await stateManager.startTransaction();
      mockStateStore.executeTransaction.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('transaction:committed', eventSpy);

      await expect(stateManager.commitTransaction(transactionId)).resolves.not.toThrow();
      expect(mockStateStore.executeTransaction).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const transactionId = await stateManager.startTransaction();
      mockStateStore.executeTransaction.mockRejectedValue(new Error('Transaction error'));
      mockStateStore.rollbackTransaction.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('transaction:rolledback', eventSpy);

      await expect(stateManager.commitTransaction(transactionId)).rejects.toThrow();
      expect(mockStateStore.rollbackTransaction).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should handle transaction timeout', async () => {
      jest.useFakeTimers();
      mockStateStore.rollbackTransaction.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('transaction:rolledback', eventSpy);

      const transactionId = await stateManager.startTransaction(1000);

      // Fast-forward time beyond timeout
      jest.advanceTimersByTime(1100);

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        transactionId,
        reason: 'Transaction timeout'
      }));

      jest.useRealTimers();
    });
  });

  describe('getStatesByWorkflow', () => {
    it('should retrieve all states for a workflow', async () => {
      const mockStates = [
        createMockState({ id: 'state-1' }),
        createMockState({ id: 'state-2' })
      ];
      mockStateStore.getStatesByWorkflow.mockResolvedValue(mockStates);

      const result = await stateManager.getStatesByWorkflow('test-workflow-1');

      expect(result).toEqual(mockStates);
      expect(mockStateStore.getStatesByWorkflow).toHaveBeenCalledWith('test-workflow-1');
    });
  });

  describe('deleteState', () => {
    it('should delete a state', async () => {
      const mockState = createMockState();
      mockStateStore.getState.mockResolvedValue(mockState);
      mockStateStore.deleteState.mockResolvedValue(undefined);

      const eventSpy = jest.fn();
      mockEventEmitter.on('state:deleted', eventSpy);

      await stateManager.deleteState('test-state-1', 'test-user');

      expect(mockStateStore.deleteState).toHaveBeenCalledWith('test-state-1');
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        stateId: 'test-state-1',
        workflowId: 'test-workflow-1',
        deletedBy: 'test-user'
      }));
    });

    it('should throw error for non-existent state', async () => {
      mockStateStore.getState.mockResolvedValue(null);

      await expect(stateManager.deleteState('non-existent'))
        .rejects.toThrow('State not found: non-existent');
    });
  });

  describe('getStateHistory', () => {
    it('should return state history in reverse order', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          previousStatus: WorkflowStatus.PENDING,
          newStatus: WorkflowStatus.RUNNING,
          previousStep: 'start',
          newStep: 'process',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          triggeredBy: 'test-user'
        },
        {
          id: 'hist-2',
          previousStatus: WorkflowStatus.RUNNING,
          newStatus: WorkflowStatus.COMPLETED,
          previousStep: 'process',
          newStep: 'end',
          timestamp: new Date('2024-01-01T01:00:00Z'),
          triggeredBy: 'test-user'
        }
      ];

      const mockState = createMockState({ history: mockHistory });
      mockStateStore.getState.mockResolvedValue(mockState);

      const result = await stateManager.getStateHistory('test-state-1', 5);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('hist-2'); // Most recent first
      expect(result[1].id).toBe('hist-1');
    });

    it('should limit history results', async () => {
      const mockHistory = Array(10).fill(null).map((_, i) => ({
        id: `hist-${i}`,
        previousStatus: WorkflowStatus.PENDING,
        newStatus: WorkflowStatus.RUNNING,
        previousStep: 'start',
        newStep: 'process',
        timestamp: new Date(),
        triggeredBy: 'test-user'
      }));

      const mockState = createMockState({ history: mockHistory });
      mockStateStore.getState.mockResolvedValue(mockState);

      const result = await stateManager.getStateHistory('test-state-1', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('close', () => {
    it('should close all resources and rollback active transactions', async () => {
      const transactionId1 = await stateManager.startTransaction();
      const transactionId2 = await stateManager.startTransaction();

      mockStateStore.rollbackTransaction.mockResolvedValue(undefined);
      mockStateStore.close.mockResolvedValue(undefined);

      await stateManager.close();

      expect(mockStateStore.rollbackTransaction).toHaveBeenCalledTimes(2);
      expect(mockStateStore.close).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle validation errors during state creation', async () => {
      // Mock validator to throw an error
      const mockValidateState = jest.spyOn(mockValidator, 'validateState');
      mockValidateState.mockResolvedValue({
        isValid: false,
        errors: [{ code: 'INVALID_DATA', message: 'Invalid data', severity: 'error' }],
        warnings: []
      });

      await expect(stateManager.createState('test-workflow-1'))
        .rejects.toThrow('State creation failed');
    });

    it('should handle storage errors gracefully', async () => {
      mockStateStore.getState.mockRejectedValue(new Error('Storage error'));

      await expect(stateManager.getState('test-state-1'))
        .rejects.toThrow('State retrieval failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve state test-state-1:',
        expect.any(Error)
      );
    });
  });
});