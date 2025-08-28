import { Pool, PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../../utils/Logger';
import { WorkflowState, WorkflowCheckpoint, StateOperation } from './WorkflowStateManager';

export interface StateStoreConfig {
  postgresql: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    poolSize?: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix?: string;
  };
  caching: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
    maxKeys: number;
  };
  logger?: Logger;
}

export class StateStore {
  private readonly pgPool: Pool;
  private readonly redisClient: RedisClientType;
  private readonly logger: Logger;
  private readonly cacheConfig: StateStoreConfig['caching'];
  private readonly keyPrefix: string;
  private isInitialized: boolean = false;

  constructor(config: StateStoreConfig) {
    this.logger = config.logger || new Logger('StateStore');
    this.cacheConfig = config.caching;
    this.keyPrefix = config.redis.keyPrefix || 'workflow:state:';

    // Initialize PostgreSQL pool
    this.pgPool = new Pool({
      host: config.postgresql.host,
      port: config.postgresql.port,
      database: config.postgresql.database,
      user: config.postgresql.username,
      password: config.postgresql.password,
      ssl: config.postgresql.ssl,
      max: config.postgresql.poolSize || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis client
    this.redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.database || 0,
    }) as RedisClientType;

    this.setupEventHandlers();
  }

  /**
   * Initialize the state store
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing StateStore');

      // Test PostgreSQL connection
      await this.pgPool.query('SELECT 1');
      this.logger.info('PostgreSQL connection established');

      // Connect to Redis
      await this.redisClient.connect();
      this.logger.info('Redis connection established');

      // Create database schema
      await this.createSchema();

      this.isInitialized = true;
      this.logger.info('StateStore initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize StateStore:', error);
      throw new Error(`StateStore initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save workflow state
   */
  async saveState(state: WorkflowState): Promise<void> {
    this.ensureInitialized();

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // Insert or update state
      const query = `
        INSERT INTO workflow_states (
          id, workflow_id, status, current_step, data, 
          created_at, updated_at, version, created_by, updated_by, 
          history, checkpoint_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) 
        DO UPDATE SET
          status = EXCLUDED.status,
          current_step = EXCLUDED.current_step,
          data = EXCLUDED.data,
          updated_at = EXCLUDED.updated_at,
          version = EXCLUDED.version,
          updated_by = EXCLUDED.updated_by,
          history = EXCLUDED.history,
          checkpoint_id = EXCLUDED.checkpoint_id
      `;

      const values = [
        state.id,
        state.workflowId,
        state.status,
        state.currentStep,
        JSON.stringify(state.data),
        state.metadata.createdAt,
        state.metadata.updatedAt,
        state.metadata.version,
        state.metadata.createdBy,
        state.metadata.updatedBy,
        JSON.stringify(state.history),
        state.checkpoint?.id || null
      ];

      await client.query(query, values);
      await client.query('COMMIT');

      // Update cache
      if (this.cacheConfig.enabled) {
        await this.setCacheState(state);
      }

      this.logger.debug(`State saved: ${state.id}`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to save state ${state.id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get workflow state by ID
   */
  async getState(stateId: string): Promise<WorkflowState | null> {
    this.ensureInitialized();

    // Try cache first
    if (this.cacheConfig.enabled) {
      const cachedState = await this.getCacheState(stateId);
      if (cachedState) {
        this.logger.debug(`State retrieved from cache: ${stateId}`);
        return cachedState;
      }
    }

    // Fetch from database
    try {
      const query = `
        SELECT 
          id, workflow_id, status, current_step, data,
          created_at, updated_at, version, created_by, updated_by,
          history, checkpoint_id
        FROM workflow_states 
        WHERE id = $1
      `;

      const result = await this.pgPool.query(query, [stateId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const state = this.mapRowToState(row);

      // Update cache
      if (this.cacheConfig.enabled) {
        await this.setCacheState(state);
      }

      this.logger.debug(`State retrieved from database: ${stateId}`);
      return state;

    } catch (error) {
      this.logger.error(`Failed to get state ${stateId}:`, error);
      throw error;
    }
  }

  /**
   * Get states by workflow ID
   */
  async getStatesByWorkflow(workflowId: string): Promise<WorkflowState[]> {
    this.ensureInitialized();

    try {
      const query = `
        SELECT 
          id, workflow_id, status, current_step, data,
          created_at, updated_at, version, created_by, updated_by,
          history, checkpoint_id
        FROM workflow_states 
        WHERE workflow_id = $1
        ORDER BY created_at DESC
      `;

      const result = await this.pgPool.query(query, [workflowId]);
      const states = result.rows.map(row => this.mapRowToState(row));

      this.logger.debug(`Retrieved ${states.length} states for workflow ${workflowId}`);
      return states;

    } catch (error) {
      this.logger.error(`Failed to get states for workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Delete workflow state
   */
  async deleteState(stateId: string): Promise<void> {
    this.ensureInitialized();

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // Delete state
      const query = 'DELETE FROM workflow_states WHERE id = $1';
      const result = await client.query(query, [stateId]);

      if (result.rowCount === 0) {
        throw new Error(`State not found: ${stateId}`);
      }

      await client.query('COMMIT');

      // Remove from cache
      if (this.cacheConfig.enabled) {
        await this.deleteCacheState(stateId);
      }

      this.logger.debug(`State deleted: ${stateId}`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to delete state ${stateId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save checkpoint
   */
  async saveCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    this.ensureInitialized();

    try {
      const query = `
        INSERT INTO workflow_checkpoints (
          id, state_id, snapshot, created_at, description
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) 
        DO UPDATE SET
          snapshot = EXCLUDED.snapshot,
          description = EXCLUDED.description
      `;

      const values = [
        checkpoint.id,
        checkpoint.stateId,
        JSON.stringify(checkpoint.snapshot),
        checkpoint.createdAt,
        checkpoint.description
      ];

      await this.pgPool.query(query, values);
      this.logger.debug(`Checkpoint saved: ${checkpoint.id}`);

    } catch (error) {
      this.logger.error(`Failed to save checkpoint ${checkpoint.id}:`, error);
      throw error;
    }
  }

  /**
   * Get checkpoint by ID
   */
  async getCheckpoint(checkpointId: string): Promise<WorkflowCheckpoint | null> {
    this.ensureInitialized();

    try {
      const query = `
        SELECT id, state_id, snapshot, created_at, description
        FROM workflow_checkpoints 
        WHERE id = $1
      `;

      const result = await this.pgPool.query(query, [checkpointId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        stateId: row.state_id,
        snapshot: JSON.parse(row.snapshot),
        createdAt: row.created_at,
        description: row.description
      };

    } catch (error) {
      this.logger.error(`Failed to get checkpoint ${checkpointId}:`, error);
      throw error;
    }
  }

  /**
   * Execute transaction with multiple operations
   */
  async executeTransaction(operations: StateOperation[]): Promise<void> {
    this.ensureInitialized();

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      for (const operation of operations) {
        await this.executeOperation(client, operation);
      }

      await client.query('COMMIT');
      this.logger.info(`Transaction executed with ${operations.length} operations`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction execution failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback transaction operations
   */
  async rollbackTransaction(operations: StateOperation[]): Promise<void> {
    this.ensureInitialized();

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // Execute rollback operations in reverse order
      for (let i = operations.length - 1; i >= 0; i--) {
        await this.executeRollbackOperation(client, operations[i]);
      }

      await client.query('COMMIT');
      this.logger.info(`Transaction rolled back with ${operations.length} operations`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rollback failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalStates: number;
    totalCheckpoints: number;
    statesByStatus: Record<string, number>;
    oldestState: Date | null;
    newestState: Date | null;
  }> {
    this.ensureInitialized();

    try {
      const [
        totalStatesResult,
        totalCheckpointsResult,
        statusStatsResult,
        dateRangeResult
      ] = await Promise.all([
        this.pgPool.query('SELECT COUNT(*) as count FROM workflow_states'),
        this.pgPool.query('SELECT COUNT(*) as count FROM workflow_checkpoints'),
        this.pgPool.query(`
          SELECT status, COUNT(*) as count 
          FROM workflow_states 
          GROUP BY status
        `),
        this.pgPool.query(`
          SELECT 
            MIN(created_at) as oldest,
            MAX(created_at) as newest
          FROM workflow_states
        `)
      ]);

      const statesByStatus: Record<string, number> = {};
      statusStatsResult.rows.forEach(row => {
        statesByStatus[row.status] = parseInt(row.count);
      });

      return {
        totalStates: parseInt(totalStatesResult.rows[0].count),
        totalCheckpoints: parseInt(totalCheckpointsResult.rows[0].count),
        statesByStatus,
        oldestState: dateRangeResult.rows[0].oldest,
        newestState: dateRangeResult.rows[0].newest
      };

    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    this.logger.info('Closing StateStore connections');

    try {
      await this.redisClient.quit();
      await this.pgPool.end();
      this.isInitialized = false;
      this.logger.info('StateStore connections closed');
    } catch (error) {
      this.logger.error('Error closing StateStore connections:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('StateStore not initialized. Call initialize() first.');
    }
  }

  private setupEventHandlers(): void {
    this.pgPool.on('error', (error) => {
      this.logger.error('PostgreSQL pool error:', error);
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis client error:', error);
    });
  }

  private async createSchema(): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      // Create states table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_states (
          id VARCHAR(255) PRIMARY KEY,
          workflow_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          current_step VARCHAR(255) NOT NULL,
          data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_by VARCHAR(255),
          updated_by VARCHAR(255),
          history JSONB NOT NULL DEFAULT '[]',
          checkpoint_id VARCHAR(255),
          CONSTRAINT fk_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES workflow_checkpoints(id)
        )
      `);

      // Create checkpoints table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_checkpoints (
          id VARCHAR(255) PRIMARY KEY,
          state_id VARCHAR(255) NOT NULL,
          snapshot JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          description TEXT
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_workflow_states_workflow_id ON workflow_states(workflow_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_workflow_states_status ON workflow_states(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_workflow_states_updated_at ON workflow_states(updated_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_state_id ON workflow_checkpoints(state_id)');

      this.logger.info('Database schema created/updated');

    } finally {
      client.release();
    }
  }

  private mapRowToState(row: any): WorkflowState {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      status: row.status,
      currentStep: row.current_step,
      data: JSON.parse(row.data || '{}'),
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        createdBy: row.created_by,
        updatedBy: row.updated_by
      },
      history: JSON.parse(row.history || '[]'),
      checkpoint: row.checkpoint_id ? { id: row.checkpoint_id } as any : undefined
    };
  }

  private async executeOperation(client: PoolClient, operation: StateOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
      case 'update':
        const state = operation.data as WorkflowState;
        const query = `
          INSERT INTO workflow_states (
            id, workflow_id, status, current_step, data, 
            created_at, updated_at, version, created_by, updated_by, 
            history, checkpoint_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) 
          DO UPDATE SET
            status = EXCLUDED.status,
            current_step = EXCLUDED.current_step,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at,
            version = EXCLUDED.version,
            updated_by = EXCLUDED.updated_by,
            history = EXCLUDED.history,
            checkpoint_id = EXCLUDED.checkpoint_id
        `;

        const values = [
          state.id,
          state.workflowId,
          state.status,
          state.currentStep,
          JSON.stringify(state.data),
          state.metadata.createdAt,
          state.metadata.updatedAt,
          state.metadata.version,
          state.metadata.createdBy,
          state.metadata.updatedBy,
          JSON.stringify(state.history),
          state.checkpoint?.id || null
        ];

        await client.query(query, values);
        break;

      case 'delete':
        await client.query('DELETE FROM workflow_states WHERE id = $1', [operation.stateId]);
        break;

      case 'checkpoint':
        const checkpoint = operation.data as WorkflowCheckpoint;
        await client.query(
          'INSERT INTO workflow_checkpoints (id, state_id, snapshot, created_at, description) VALUES ($1, $2, $3, $4, $5)',
          [checkpoint.id, checkpoint.stateId, JSON.stringify(checkpoint.snapshot), checkpoint.createdAt, checkpoint.description]
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeRollbackOperation(client: PoolClient, operation: StateOperation): Promise<void> {
    // For now, rollback operations are simplified
    // In a more sophisticated implementation, you'd maintain operation logs
    switch (operation.type) {
      case 'create':
        await client.query('DELETE FROM workflow_states WHERE id = $1', [operation.stateId]);
        break;
      case 'delete':
        // Would require restoring from backup/log
        this.logger.warn(`Cannot rollback delete operation for state ${operation.stateId}`);
        break;
      case 'update':
        // Would require restoring previous version
        this.logger.warn(`Cannot rollback update operation for state ${operation.stateId}`);
        break;
    }
  }

  // Cache management methods
  private async getCacheState(stateId: string): Promise<WorkflowState | null> {
    try {
      const key = `${this.keyPrefix}${stateId}`;
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.warn(`Cache get failed for state ${stateId}:`, error);
      return null;
    }
  }

  private async setCacheState(state: WorkflowState): Promise<void> {
    try {
      const key = `${this.keyPrefix}${state.id}`;
      await this.redisClient.setEx(key, this.cacheConfig.ttl, JSON.stringify(state));
    } catch (error) {
      this.logger.warn(`Cache set failed for state ${state.id}:`, error);
    }
  }

  private async deleteCacheState(stateId: string): Promise<void> {
    try {
      const key = `${this.keyPrefix}${stateId}`;
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete failed for state ${stateId}:`, error);
    }
  }
}