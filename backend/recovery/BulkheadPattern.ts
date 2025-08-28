/**
 * Bulkhead Pattern Implementation
 * Isolates critical resources to prevent cascade failures
 */

import { EventEmitter } from 'events';

export interface BulkheadConfig {
  name: string;
  maxConcurrent: number;
  maxQueue: number;
  timeout?: number;
  priority?: boolean;
  onReject?: (reason: string) => void;
  onQueueFull?: () => void;
  onTimeout?: (operation: string) => void;
}

export interface QueuedOperation<T> {
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  priority: number;
  timestamp: number;
  operationId: string;
  timeout?: NodeJS.Timeout;
}

export class ResourceExhaustedError extends Error {
  constructor(bulkheadName: string, reason: string) {
    super(`Bulkhead '${bulkheadName}' resource exhausted: ${reason}`);
    this.name = 'ResourceExhaustedError';
  }
}

export class BulkheadTimeout extends Error {
  constructor(bulkheadName: string, operationId: string, timeout: number) {
    super(`Operation '${operationId}' timed out after ${timeout}ms in bulkhead '${bulkheadName}'`);
    this.name = 'BulkheadTimeout';
  }
}

export class Bulkhead extends EventEmitter {
  private runningOperations: Set<string> = new Set();
  private queue: QueuedOperation<any>[] = [];
  private operationCounter: number = 0;

  constructor(private readonly config: BulkheadConfig) {
    super();
  }

  /**
   * Execute an operation with bulkhead protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    priority: number = 0,
    operationName?: string
  ): Promise<T> {
    const operationId = operationName || `op-${++this.operationCounter}`;

    // Check if we can run immediately
    if (this.runningOperations.size < this.config.maxConcurrent) {
      return this.runOperation(operation, operationId);
    }

    // Check if queue is full
    if (this.queue.length >= this.config.maxQueue) {
      this.config.onQueueFull?.();
      this.emit('queueFull', this.config.name);
      throw new ResourceExhaustedError(this.config.name, 'Queue is full');
    }

    // Queue the operation
    return new Promise<T>((resolve, reject) => {
      const queuedOp: QueuedOperation<T> = {
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        operationId
      };

      // Set timeout if configured
      if (this.config.timeout) {
        queuedOp.timeout = setTimeout(() => {
          this.removeFromQueue(operationId);
          this.config.onTimeout?.(operationId);
          reject(new BulkheadTimeout(this.config.name, operationId, this.config.timeout!));
        }, this.config.timeout);
      }

      this.addToQueue(queuedOp);
      this.emit('queued', { operationId, queueLength: this.queue.length });
    });
  }

  private async runOperation<T>(operation: () => Promise<T>, operationId: string): Promise<T> {
    this.runningOperations.add(operationId);
    this.emit('started', { operationId, runningCount: this.runningOperations.size });

    try {
      const result = await operation();
      this.emit('completed', { operationId, success: true });
      return result;
    } catch (error) {
      this.emit('completed', { operationId, success: false, error });
      throw error;
    } finally {
      this.runningOperations.delete(operationId);
      this.processQueue();
    }
  }

  private addToQueue<T>(queuedOp: QueuedOperation<T>): void {
    if (this.config.priority) {
      // Insert based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(op => op.priority < queuedOp.priority);
      if (insertIndex === -1) {
        this.queue.push(queuedOp);
      } else {
        this.queue.splice(insertIndex, 0, queuedOp);
      }
    } else {
      // FIFO queue
      this.queue.push(queuedOp);
    }
  }

  private removeFromQueue(operationId: string): boolean {
    const index = this.queue.findIndex(op => op.operationId === operationId);
    if (index !== -1) {
      const [removed] = this.queue.splice(index, 1);
      if (removed.timeout) {
        clearTimeout(removed.timeout);
      }
      return true;
    }
    return false;
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.runningOperations.size < this.config.maxConcurrent) {
      const queuedOp = this.queue.shift()!;
      
      // Clear timeout since we're about to execute
      if (queuedOp.timeout) {
        clearTimeout(queuedOp.timeout);
      }

      // Execute the operation
      this.runOperation(queuedOp.operation, queuedOp.operationId)
        .then(queuedOp.resolve)
        .catch(queuedOp.reject);
    }
  }

  /**
   * Get current bulkhead metrics
   */
  getMetrics() {
    return {
      name: this.config.name,
      runningOperations: this.runningOperations.size,
      queuedOperations: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
      maxQueue: this.config.maxQueue,
      utilization: this.runningOperations.size / this.config.maxConcurrent,
      queueUtilization: this.queue.length / this.config.maxQueue,
      oldestQueuedOperation: this.queue.length > 0 ? 
        Date.now() - Math.min(...this.queue.map(op => op.timestamp)) : 0
    };
  }

  /**
   * Shutdown bulkhead gracefully
   */
  async shutdown(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const shutdownTimeout = setTimeout(() => {
        reject(new Error(`Bulkhead shutdown timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Reject all queued operations
      while (this.queue.length > 0) {
        const queuedOp = this.queue.shift()!;
        if (queuedOp.timeout) {
          clearTimeout(queuedOp.timeout);
        }
        queuedOp.reject(new Error('Bulkhead is shutting down'));
      }

      // Wait for running operations to complete
      const checkCompletion = () => {
        if (this.runningOperations.size === 0) {
          clearTimeout(shutdownTimeout);
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }
}

/**
 * Bulkhead Manager for managing multiple bulkheads
 */
export class BulkheadManager {
  private static bulkheads = new Map<string, Bulkhead>();

  static create(config: BulkheadConfig): Bulkhead {
    if (this.bulkheads.has(config.name)) {
      return this.bulkheads.get(config.name)!;
    }

    const bulkhead = new Bulkhead(config);
    this.bulkheads.set(config.name, bulkhead);
    return bulkhead;
  }

  static get(name: string): Bulkhead | undefined {
    return this.bulkheads.get(name);
  }

  static getAll(): Map<string, Bulkhead> {
    return new Map(this.bulkheads);
  }

  static async shutdownAll(timeoutMs: number = 30000): Promise<void> {
    const shutdownPromises = Array.from(this.bulkheads.values())
      .map(bulkhead => bulkhead.shutdown(timeoutMs));
    
    await Promise.all(shutdownPromises);
    this.bulkheads.clear();
  }

  static getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    this.bulkheads.forEach((bulkhead, name) => {
      metrics[name] = bulkhead.getMetrics();
    });
    return metrics;
  }
}

/**
 * Predefined bulkhead configurations
 */
export const BulkheadProfiles = {
  DATABASE: {
    name: 'database',
    maxConcurrent: 10,
    maxQueue: 50,
    timeout: 30000,
    priority: true
  } as BulkheadConfig,

  EXTERNAL_API: {
    name: 'external-api',
    maxConcurrent: 5,
    maxQueue: 20,
    timeout: 10000,
    priority: false
  } as BulkheadConfig,

  FILE_IO: {
    name: 'file-io',
    maxConcurrent: 3,
    maxQueue: 15,
    timeout: 5000,
    priority: true
  } as BulkheadConfig,

  CPU_INTENSIVE: {
    name: 'cpu-intensive',
    maxConcurrent: 2,
    maxQueue: 5,
    timeout: 60000,
    priority: true
  } as BulkheadConfig
};