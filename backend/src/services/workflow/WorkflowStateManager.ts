import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { StateStore } from './StateStore';
import { StateValidator } from './StateValidator';

export interface WorkflowState {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStep: string;
  data: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    createdBy?: string;
    updatedBy?: string;
  };
  history: StateHistoryEntry[];
  checkpoint?: WorkflowCheckpoint;
}

export interface StateHistoryEntry {
  id: string;
  previousStatus: WorkflowStatus;
  newStatus: WorkflowStatus;
  previousStep: string;
  newStep: string;
  timestamp: Date;
  triggeredBy?: string;
  reason?: string;
  data?: Record<string, any>;
}

export interface WorkflowCheckpoint {
  id: string;
  stateId: string;
  snapshot: WorkflowState;
  createdAt: Date;
  description?: string;
}

export interface StateTransition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  step?: string;
  data?: Record<string, any>;
  triggeredBy?: string;
  reason?: string;
}

export interface TransactionContext {
  id: string;
  states: Map<string, WorkflowState>;
  operations: StateOperation[];
  startTime: Date;
  timeout: number;
}

export interface StateOperation {
  type: 'create' | 'update' | 'delete' | 'checkpoint';
  stateId: string;
  data: any;
  timestamp: Date;
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  ROLLBACK = 'rollback'
}

export interface WorkflowStateManagerConfig {
  stateStore: StateStore;
  validator: StateValidator;
  logger?: Logger;
  eventEmitter?: EventEmitter;
  transactionTimeout?: number;
  maxHistoryEntries?: number;
  enableSnapshots?: boolean;
}

export class WorkflowStateManager {
  private readonly stateStore: StateStore;
  private readonly validator: StateValidator;
  private readonly logger: Logger;
  private readonly eventEmitter: EventEmitter;
  private readonly transactionTimeout: number;
  private readonly maxHistoryEntries: number;
  private readonly enableSnapshots: boolean;
  private readonly activeTransactions: Map<string, TransactionContext>;

  constructor(config: WorkflowStateManagerConfig) {
    this.stateStore = config.stateStore;
    this.validator = config.validator;
    this.logger = config.logger || new Logger('WorkflowStateManager');
    this.eventEmitter = config.eventEmitter || new EventEmitter();
    this.transactionTimeout = config.transactionTimeout || 30000; // 30 seconds
    this.maxHistoryEntries = config.maxHistoryEntries || 100;
    this.enableSnapshots = config.enableSnapshots ?? true;
    this.activeTransactions = new Map();

    this.setupEventHandlers();
    this.startTransactionCleanup();
  }

  /**
   * Create a new workflow state
   */
  async createState(
    workflowId: string,
    initialStatus: WorkflowStatus = WorkflowStatus.PENDING,
    initialStep: string = 'start',
    initialData: Record<string, any> = {},
    createdBy?: string
  ): Promise<WorkflowState> {
    try {
      this.logger.info(`Creating new state for workflow ${workflowId}`);

      const state: WorkflowState = {
        id: this.generateStateId(),
        workflowId,
        status: initialStatus,
        currentStep: initialStep,
        data: { ...initialData },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          createdBy,
          updatedBy: createdBy
        },
        history: []
      };

      // Validate initial state
      await this.validator.validateState(state);

      // Store state
      await this.stateStore.saveState(state);

      // Create initial checkpoint if enabled
      if (this.enableSnapshots) {
        await this.createCheckpoint(state.id, 'Initial state');
      }

      // Emit event
      this.eventEmitter.emit('state:created', {
        state,
        timestamp: new Date()
      });

      this.logger.info(`State created successfully: ${state.id}`);
      return state;

    } catch (error) {
      this.logger.error(`Failed to create state for workflow ${workflowId}:`, error);
      throw new Error(`State creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workflow state by ID
   */
  async getState(stateId: string): Promise<WorkflowState | null> {
    try {
      this.logger.debug(`Retrieving state: ${stateId}`);
      const state = await this.stateStore.getState(stateId);
      
      if (state) {
        this.eventEmitter.emit('state:retrieved', {
          stateId,
          timestamp: new Date()
        });
      }

      return state;

    } catch (error) {
      this.logger.error(`Failed to retrieve state ${stateId}:`, error);
      throw new Error(`State retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update workflow state with validation
   */
  async updateState(
    stateId: string,
    updates: Partial<Pick<WorkflowState, 'status' | 'currentStep' | 'data'>>,
    updatedBy?: string,
    reason?: string
  ): Promise<WorkflowState> {
    try {
      this.logger.info(`Updating state: ${stateId}`);

      const currentState = await this.getState(stateId);
      if (!currentState) {
        throw new Error(`State not found: ${stateId}`);
      }

      // Create updated state
      const updatedState: WorkflowState = {
        ...currentState,
        ...updates,
        metadata: {
          ...currentState.metadata,
          updatedAt: new Date(),
          version: currentState.metadata.version + 1,
          updatedBy
        }
      };

      // Validate transition if status changed
      if (updates.status && updates.status !== currentState.status) {
        const transition: StateTransition = {
          from: currentState.status,
          to: updates.status,
          step: updates.currentStep,
          data: updates.data,
          triggeredBy: updatedBy,
          reason
        };
        await this.validator.validateTransition(currentState, transition);
      }

      // Validate updated state
      await this.validator.validateState(updatedState);

      // Add history entry
      if (updates.status !== currentState.status || updates.currentStep !== currentState.currentStep) {
        const historyEntry: StateHistoryEntry = {
          id: this.generateHistoryId(),
          previousStatus: currentState.status,
          newStatus: updatedState.status,
          previousStep: currentState.currentStep,
          newStep: updatedState.currentStep,
          timestamp: new Date(),
          triggeredBy: updatedBy,
          reason,
          data: updates.data
        };

        updatedState.history = [...currentState.history, historyEntry];

        // Trim history if needed
        if (updatedState.history.length > this.maxHistoryEntries) {
          updatedState.history = updatedState.history.slice(-this.maxHistoryEntries);
        }
      }

      // Save state
      await this.stateStore.saveState(updatedState);

      // Emit event
      this.eventEmitter.emit('state:updated', {
        previousState: currentState,
        newState: updatedState,
        updates,
        timestamp: new Date()
      });

      this.logger.info(`State updated successfully: ${stateId}`);
      return updatedState;

    } catch (error) {
      this.logger.error(`Failed to update state ${stateId}:`, error);
      throw new Error(`State update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transition workflow state
   */
  async transitionState(
    stateId: string,
    transition: StateTransition
  ): Promise<WorkflowState> {
    try {
      this.logger.info(`Transitioning state ${stateId} from ${transition.from} to ${transition.to}`);

      const currentState = await this.getState(stateId);
      if (!currentState) {
        throw new Error(`State not found: ${stateId}`);
      }

      if (currentState.status !== transition.from) {
        throw new Error(`Invalid transition: expected ${transition.from}, got ${currentState.status}`);
      }

      return await this.updateState(
        stateId,
        {
          status: transition.to,
          currentStep: transition.step || currentState.currentStep,
          data: transition.data ? { ...currentState.data, ...transition.data } : currentState.data
        },
        transition.triggeredBy,
        transition.reason
      );

    } catch (error) {
      this.logger.error(`Failed to transition state ${stateId}:`, error);
      throw error;
    }
  }

  /**
   * Create state checkpoint
   */
  async createCheckpoint(stateId: string, description?: string): Promise<WorkflowCheckpoint> {
    try {
      this.logger.info(`Creating checkpoint for state: ${stateId}`);

      const state = await this.getState(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      const checkpoint: WorkflowCheckpoint = {
        id: this.generateCheckpointId(),
        stateId,
        snapshot: { ...state },
        createdAt: new Date(),
        description
      };

      await this.stateStore.saveCheckpoint(checkpoint);

      // Update state with checkpoint reference
      const updatedState = { ...state, checkpoint };
      await this.stateStore.saveState(updatedState);

      this.eventEmitter.emit('checkpoint:created', {
        checkpoint,
        timestamp: new Date()
      });

      this.logger.info(`Checkpoint created: ${checkpoint.id}`);
      return checkpoint;

    } catch (error) {
      this.logger.error(`Failed to create checkpoint for state ${stateId}:`, error);
      throw new Error(`Checkpoint creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore state from checkpoint
   */
  async restoreFromCheckpoint(checkpointId: string, restoredBy?: string): Promise<WorkflowState> {
    try {
      this.logger.info(`Restoring from checkpoint: ${checkpointId}`);

      const checkpoint = await this.stateStore.getCheckpoint(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      const restoredState: WorkflowState = {
        ...checkpoint.snapshot,
        metadata: {
          ...checkpoint.snapshot.metadata,
          updatedAt: new Date(),
          version: checkpoint.snapshot.metadata.version + 1,
          updatedBy: restoredBy
        }
      };

      // Add history entry for restoration
      const historyEntry: StateHistoryEntry = {
        id: this.generateHistoryId(),
        previousStatus: checkpoint.snapshot.status,
        newStatus: checkpoint.snapshot.status,
        previousStep: checkpoint.snapshot.currentStep,
        newStep: checkpoint.snapshot.currentStep,
        timestamp: new Date(),
        triggeredBy: restoredBy,
        reason: `Restored from checkpoint: ${checkpointId}`
      };

      restoredState.history = [...checkpoint.snapshot.history, historyEntry];

      await this.stateStore.saveState(restoredState);

      this.eventEmitter.emit('state:restored', {
        checkpoint,
        restoredState,
        timestamp: new Date()
      });

      this.logger.info(`State restored from checkpoint: ${checkpointId}`);
      return restoredState;

    } catch (error) {
      this.logger.error(`Failed to restore from checkpoint ${checkpointId}:`, error);
      throw new Error(`Checkpoint restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start transaction
   */
  async startTransaction(timeout?: number): Promise<string> {
    const transactionId = this.generateTransactionId();
    const context: TransactionContext = {
      id: transactionId,
      states: new Map(),
      operations: [],
      startTime: new Date(),
      timeout: timeout || this.transactionTimeout
    };

    this.activeTransactions.set(transactionId, context);
    
    this.logger.info(`Transaction started: ${transactionId}`);
    
    // Set timeout for transaction
    setTimeout(() => {
      if (this.activeTransactions.has(transactionId)) {
        this.rollbackTransaction(transactionId, 'Transaction timeout');
      }
    }, context.timeout);

    return transactionId;
  }

  /**
   * Add operation to transaction
   */
  async addToTransaction(
    transactionId: string,
    operation: StateOperation
  ): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    context.operations.push(operation);
    this.logger.debug(`Operation added to transaction ${transactionId}: ${operation.type}`);
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    try {
      const context = this.activeTransactions.get(transactionId);
      if (!context) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      this.logger.info(`Committing transaction: ${transactionId}`);

      // Execute all operations atomically
      await this.stateStore.executeTransaction(context.operations);

      // Clean up
      this.activeTransactions.delete(transactionId);

      this.eventEmitter.emit('transaction:committed', {
        transactionId,
        operationCount: context.operations.length,
        timestamp: new Date()
      });

      this.logger.info(`Transaction committed: ${transactionId}`);

    } catch (error) {
      this.logger.error(`Failed to commit transaction ${transactionId}:`, error);
      await this.rollbackTransaction(transactionId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId: string, reason?: string): Promise<void> {
    try {
      const context = this.activeTransactions.get(transactionId);
      if (!context) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      this.logger.warn(`Rolling back transaction: ${transactionId}, reason: ${reason}`);

      // Rollback operations
      await this.stateStore.rollbackTransaction(context.operations);

      // Clean up
      this.activeTransactions.delete(transactionId);

      this.eventEmitter.emit('transaction:rolledback', {
        transactionId,
        reason,
        operationCount: context.operations.length,
        timestamp: new Date()
      });

      this.logger.info(`Transaction rolled back: ${transactionId}`);

    } catch (error) {
      this.logger.error(`Failed to rollback transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Get states by workflow ID
   */
  async getStatesByWorkflow(workflowId: string): Promise<WorkflowState[]> {
    try {
      return await this.stateStore.getStatesByWorkflow(workflowId);
    } catch (error) {
      this.logger.error(`Failed to get states for workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Delete state
   */
  async deleteState(stateId: string, deletedBy?: string): Promise<void> {
    try {
      this.logger.info(`Deleting state: ${stateId}`);

      const state = await this.getState(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      await this.stateStore.deleteState(stateId);

      this.eventEmitter.emit('state:deleted', {
        stateId,
        workflowId: state.workflowId,
        deletedBy,
        timestamp: new Date()
      });

      this.logger.info(`State deleted: ${stateId}`);

    } catch (error) {
      this.logger.error(`Failed to delete state ${stateId}:`, error);
      throw error;
    }
  }

  /**
   * Get state history
   */
  async getStateHistory(stateId: string, limit?: number): Promise<StateHistoryEntry[]> {
    try {
      const state = await this.getState(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      const history = state.history.slice().reverse(); // Most recent first
      return limit ? history.slice(0, limit) : history;

    } catch (error) {
      this.logger.error(`Failed to get history for state ${stateId}:`, error);
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.eventEmitter.on('error', (error) => {
      this.logger.error('WorkflowStateManager error:', error);
    });
  }

  /**
   * Start transaction cleanup job
   */
  private startTransactionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [transactionId, context] of this.activeTransactions.entries()) {
        const elapsed = now.getTime() - context.startTime.getTime();
        if (elapsed > context.timeout) {
          this.rollbackTransaction(transactionId, 'Transaction expired').catch((error) => {
            this.logger.error(`Failed to cleanup expired transaction ${transactionId}:`, error);
          });
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Generate unique IDs
   */
  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCheckpointId(): string {
    return `chkpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    this.logger.info('Closing WorkflowStateManager');
    
    // Rollback any active transactions
    for (const transactionId of this.activeTransactions.keys()) {
      await this.rollbackTransaction(transactionId, 'Manager shutdown');
    }

    // Close state store
    await this.stateStore.close();
    
    this.eventEmitter.removeAllListeners();
    this.logger.info('WorkflowStateManager closed');
  }
}