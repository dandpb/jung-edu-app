import { Pool, PoolClient } from 'pg';
import { createClient } from 'redis';
import { StateStore, StateStoreConfig } from '../../../src/services/workflow/StateStore';
import { 
  WorkflowState, 
  WorkflowStatus, 
  WorkflowCheckpoint,
  StateOperation
} from '../../../src/services/workflow/WorkflowStateManager';
import { Logger } from '../../../src/utils/Logger';

// Mock dependencies
jest.mock('pg');
jest.mock('redis');
jest.mock('../../../src/utils/Logger');

describe('StateStore', () => {
  let stateStore: StateStore;
  let mockPgPool: jest.Mocked<Pool>;
  let mockPgClient: jest.Mocked<PoolClient>;
  let mockRedisClient: any;
  let mockLogger: jest.Mocked<Logger>;

  const createMockConfig = (): StateStoreConfig => ({
    postgresql: {
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'testuser',
      password: 'testpass',
      ssl: false,
      poolSize: 10
    },
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'redispass',
      database: 0,
      keyPrefix: 'workflow:state:'
    },
    caching: {
      enabled: true,
      ttl: 3600,
      maxKeys: 1000
    },
    logger: mockLogger
  });

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
    // Mock PostgreSQL
    mockPgClient = {
      query: jest.fn(),
      release: jest.fn()
    } as any;

    mockPgPool = {
      connect: jest.fn().mockResolvedValue(mockPgClient),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    } as unknown as jest.Mocked<Pool>;

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPgPool);

    // Mock Redis
    mockRedisClient = {
      connect: jest.fn(),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
      on: jest.fn()
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLogLevel: jest.fn(),
      log: jest.fn(),
      getLogs: jest.fn(),
      clearLogs: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    const config = createMockConfig();
    stateStore = new StateStore(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);

      await stateStore.initialize();

      expect(mockPgPool.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('StateStore initialized successfully');
    });

    it('should handle initialization errors', async () => {
      mockPgPool.query.mockRejectedValue(new Error('Connection failed'));

      await expect(stateStore.initialize()).rejects.toThrow('StateStore initialization failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should create database schema during initialization', async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);

      await stateStore.initialize();

      expect(mockPgClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS workflow_states')
      );
      expect(mockPgClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS workflow_checkpoints')
      );
    });
  });

  describe('saveState', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should save state successfully', async () => {
      const state = createMockState();
      mockPgClient.query.mockResolvedValue({ rowCount: 1 } as any);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await stateStore.saveState(state);

      expect(mockPgClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockPgClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workflow_states'),
        expect.arrayContaining([
          state.id,
          state.workflowId,
          state.status,
          state.currentStep,
          JSON.stringify(state.data)
        ])
      );
      expect(mockPgClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should handle save errors and rollback', async () => {
      const state = createMockState();
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Insert failed')); // INSERT

      await expect(stateStore.saveState(state)).rejects.toThrow('Insert failed');
      expect(mockPgClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should update cache when saving state', async () => {
      const state = createMockState();
      mockPgClient.query.mockResolvedValue({ rowCount: 1 } as any);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await stateStore.saveState(state);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'workflow:state:test-state-1',
        3600,
        JSON.stringify(state)
      );
    });
  });

  describe('getState', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should retrieve state from cache first', async () => {
      const state = createMockState();
      mockRedisClient.get.mockResolvedValue(JSON.stringify(state));

      const result = await stateStore.getState('test-state-1');

      expect(result).toEqual(state);
      expect(mockRedisClient.get).toHaveBeenCalledWith('workflow:state:test-state-1');
      expect(mockPgPool.query).not.toHaveBeenCalled();
    });

    it('should retrieve state from database when not in cache', async () => {
      const state = createMockState();
      const dbRow = {
        id: state.id,
        workflow_id: state.workflowId,
        status: state.status,
        current_step: state.currentStep,
        data: JSON.stringify(state.data),
        created_at: state.metadata.createdAt,
        updated_at: state.metadata.updatedAt,
        version: state.metadata.version,
        created_by: state.metadata.createdBy,
        updated_by: state.metadata.updatedBy,
        history: JSON.stringify(state.history),
        checkpoint_id: null
      };

      mockRedisClient.get.mockResolvedValue(null);
      mockPgPool.query.mockResolvedValue({ rows: [dbRow] } as any);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await stateStore.getState('test-state-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe(state.id);
      expect(result!.workflowId).toBe(state.workflowId);
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test-state-1']
      );
      expect(mockRedisClient.setEx).toHaveBeenCalled(); // Update cache
    });

    it('should return null for non-existent state', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockPgPool.query.mockResolvedValue({ rows: [] } as any);

      const result = await stateStore.getState('non-existent');

      expect(result).toBeNull();
    });

    it('should handle cache errors gracefully', async () => {
      const state = createMockState();
      const dbRow = {
        id: state.id,
        workflow_id: state.workflowId,
        status: state.status,
        current_step: state.currentStep,
        data: JSON.stringify(state.data),
        created_at: state.metadata.createdAt,
        updated_at: state.metadata.updatedAt,
        version: state.metadata.version,
        created_by: state.metadata.createdBy,
        updated_by: state.metadata.updatedBy,
        history: JSON.stringify(state.history),
        checkpoint_id: null
      };

      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      mockPgPool.query.mockResolvedValue({ rows: [dbRow] } as any);

      const result = await stateStore.getState('test-state-1');

      expect(result).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cache get failed for state test-state-1:',
        expect.any(Error)
      );
    });
  });

  describe('getStatesByWorkflow', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should retrieve all states for a workflow', async () => {
      const states = [
        createMockState({ id: 'state-1' }),
        createMockState({ id: 'state-2' })
      ];

      const dbRows = states.map(state => ({
        id: state.id,
        workflow_id: state.workflowId,
        status: state.status,
        current_step: state.currentStep,
        data: JSON.stringify(state.data),
        created_at: state.metadata.createdAt,
        updated_at: state.metadata.updatedAt,
        version: state.metadata.version,
        created_by: state.metadata.createdBy,
        updated_by: state.metadata.updatedBy,
        history: JSON.stringify(state.history),
        checkpoint_id: null
      }));

      mockPgPool.query.mockResolvedValue({ rows: dbRows } as any);

      const result = await stateStore.getStatesByWorkflow('test-workflow-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('state-1');
      expect(result[1].id).toBe('state-2');
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE workflow_id = $1'),
        ['test-workflow-1']
      );
    });
  });

  describe('deleteState', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should delete state successfully', async () => {
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      mockRedisClient.del.mockResolvedValue(1);

      await stateStore.deleteState('test-state-1');

      expect(mockPgClient.query).toHaveBeenCalledWith(
        'DELETE FROM workflow_states WHERE id = $1',
        ['test-state-1']
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith('workflow:state:test-state-1');
    });

    it('should throw error when state not found', async () => {
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }); // DELETE (no rows affected)

      await expect(stateStore.deleteState('non-existent')).rejects.toThrow(
        'State not found: non-existent'
      );
      expect(mockPgClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('checkpoint operations', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should save checkpoint successfully', async () => {
      const checkpoint: WorkflowCheckpoint = {
        id: 'checkpoint-1',
        stateId: 'test-state-1',
        snapshot: createMockState(),
        createdAt: new Date(),
        description: 'Test checkpoint'
      };

      mockPgPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await stateStore.saveCheckpoint(checkpoint);

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workflow_checkpoints'),
        expect.arrayContaining([
          checkpoint.id,
          checkpoint.stateId,
          JSON.stringify(checkpoint.snapshot),
          checkpoint.createdAt,
          checkpoint.description
        ])
      );
    });

    it('should retrieve checkpoint successfully', async () => {
      const checkpoint: WorkflowCheckpoint = {
        id: 'checkpoint-1',
        stateId: 'test-state-1',
        snapshot: createMockState(),
        createdAt: new Date(),
        description: 'Test checkpoint'
      };

      const dbRow = {
        id: checkpoint.id,
        state_id: checkpoint.stateId,
        snapshot: JSON.stringify(checkpoint.snapshot),
        created_at: checkpoint.createdAt,
        description: checkpoint.description
      };

      mockPgPool.query.mockResolvedValue({ rows: [dbRow] } as any);

      const result = await stateStore.getCheckpoint('checkpoint-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe(checkpoint.id);
      expect(result!.stateId).toBe(checkpoint.stateId);
      expect(result!.snapshot).toEqual(checkpoint.snapshot);
    });
  });

  describe('transaction operations', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should execute transaction successfully', async () => {
      const operations: StateOperation[] = [
        {
          type: 'create',
          stateId: 'state-1',
          data: createMockState({ id: 'state-1' }),
          timestamp: new Date()
        },
        {
          type: 'update',
          stateId: 'state-2',
          data: createMockState({ id: 'state-2', status: WorkflowStatus.RUNNING }),
          timestamp: new Date()
        }
      ];

      mockPgClient.query.mockResolvedValue({ rowCount: 1 } as any);

      await stateStore.executeTransaction(operations);

      expect(mockPgClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockPgClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockPgClient.query).toHaveBeenCalledTimes(4); // BEGIN + 2 operations + COMMIT
    });

    it('should rollback transaction on error', async () => {
      const operations: StateOperation[] = [
        {
          type: 'create',
          stateId: 'state-1',
          data: createMockState({ id: 'state-1' }),
          timestamp: new Date()
        }
      ];

      mockPgClient.query.mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Operation failed')); // First operation

      await expect(stateStore.executeTransaction(operations)).rejects.toThrow('Operation failed');
      expect(mockPgClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should handle rollback transaction', async () => {
      const operations: StateOperation[] = [
        {
          type: 'create',
          stateId: 'state-1',
          data: createMockState({ id: 'state-1' }),
          timestamp: new Date()
        }
      ];

      mockPgClient.query.mockResolvedValue({ rowCount: 1 } as any);

      await stateStore.rollbackTransaction(operations);

      expect(mockPgClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockPgClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockPgClient.query).toHaveBeenCalledWith(
        'DELETE FROM workflow_states WHERE id = $1',
        ['state-1']
      );
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      await stateStore.initialize();
    });

    it('should get database statistics', async () => {
      mockPgPool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // Total states
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // Total checkpoints
        .mockResolvedValueOnce({ rows: [
          { status: 'pending', count: '3' },
          { status: 'running', count: '4' },
          { status: 'completed', count: '3' }
        ]}) // Status stats
        .mockResolvedValueOnce({ rows: [{
          oldest: new Date('2024-01-01'),
          newest: new Date('2024-01-02')
        }]}); // Date range

      const stats = await stateStore.getStats();

      expect(stats.totalStates).toBe(10);
      expect(stats.totalCheckpoints).toBe(5);
      expect(stats.statesByStatus.pending).toBe(3);
      expect(stats.statesByStatus.running).toBe(4);
      expect(stats.statesByStatus.completed).toBe(3);
      expect(stats.oldestState).toEqual(new Date('2024-01-01'));
      expect(stats.newestState).toEqual(new Date('2024-01-02'));
    });
  });

  describe('connection management', () => {
    it('should close connections properly', async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      
      await stateStore.initialize();
      
      mockRedisClient.quit.mockResolvedValue('OK');
      mockPgPool.end.mockResolvedValue(undefined);

      await stateStore.close();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockPgPool.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('StateStore connections closed');
    });

    it('should handle connection errors during close', async () => {
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      
      await stateStore.initialize();

      mockRedisClient.quit.mockRejectedValue(new Error('Redis close error'));

      await expect(stateStore.close()).rejects.toThrow('Redis close error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should setup event handlers for connection errors', () => {
      expect(mockPgPool.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should throw error when operating on uninitialized store', async () => {
      await expect(stateStore.getState('test-state-1')).rejects.toThrow(
        'StateStore not initialized. Call initialize() first.'
      );
    });
  });

  describe('cache configuration', () => {
    it('should work without caching when disabled', async () => {
      const configWithoutCache = createMockConfig();
      configWithoutCache.caching.enabled = false;
      
      const storeWithoutCache = new StateStore(configWithoutCache);
      
      mockPgPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any);
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockPgClient.query.mockResolvedValue({ rows: [] } as any);
      
      await storeWithoutCache.initialize();

      const state = createMockState();
      mockPgClient.query.mockResolvedValue({ rowCount: 1 } as any);

      await storeWithoutCache.saveState(state);

      // Should not interact with Redis when caching is disabled
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });
  });
});