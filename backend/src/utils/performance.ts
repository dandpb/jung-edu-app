/**
 * Performance Utilities for jaqEdu Workflow System
 * Provides caching, connection pooling, batching, and optimization tools
 */

import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';

/**
 * Memory-efficient LRU Cache with TTL support
 */
export class PerformanceCache<K, V> extends EventEmitter {
  private cache: LRUCache<K, V>;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: {
    max?: number;
    ttl?: number; // milliseconds
    updateAgeOnGet?: boolean;
    allowStale?: boolean;
  } = {}) {
    super();
    
    this.cache = new LRUCache({
      max: options.max || 1000,
      ttl: options.ttl || 300000, // 5 minutes default
      updateAgeOnGet: options.updateAgeOnGet ?? true,
      allowStale: options.allowStale ?? false,
      dispose: (value, key) => {
        this.emit('evict', key, value);
      }
    });
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hitCount++;
      this.emit('hit', key, value);
    } else {
      this.missCount++;
      this.emit('miss', key);
    }
    return value;
  }

  set(key: K, value: V, ttl?: number): void {
    this.cache.set(key, value, { ttl });
    this.emit('set', key, value);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.emit('delete', key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.emit('clear');
  }

  getStats() {
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      maxSize: this.cache.max
    };
  }
}

/**
 * Generic Connection Pool Implementation
 */
export class ConnectionPool<T> extends EventEmitter {
  private pool: T[] = [];
  private activeConnections = new Set<T>();
  private waitQueue: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  
  private readonly maxSize: number;
  private readonly minSize: number;
  private readonly acquireTimeout: number;
  private readonly createConnection: () => Promise<T>;
  private readonly validateConnection: (connection: T) => Promise<boolean>;
  private readonly destroyConnection: (connection: T) => Promise<void>;

  constructor(options: {
    minSize: number;
    maxSize: number;
    acquireTimeout?: number;
    createConnection: () => Promise<T>;
    validateConnection: (connection: T) => Promise<boolean>;
    destroyConnection: (connection: T) => Promise<void>;
  }) {
    super();
    this.minSize = options.minSize;
    this.maxSize = options.maxSize;
    this.acquireTimeout = options.acquireTimeout || 10000;
    this.createConnection = options.createConnection;
    this.validateConnection = options.validateConnection;
    this.destroyConnection = options.destroyConnection;
  }

  async initialize(): Promise<void> {
    // Create minimum number of connections
    for (let i = 0; i < this.minSize; i++) {
      const connection = await this.createConnection();
      this.pool.push(connection);
    }
    this.emit('initialized', { poolSize: this.pool.length });
  }

  async acquire(): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.acquireTimeout);

      this.waitQueue.push({ resolve, reject, timeout });
      this.processQueue();
    });
  }

  async release(connection: T): Promise<void> {
    if (!this.activeConnections.has(connection)) {
      throw new Error('Connection not found in active connections');
    }

    this.activeConnections.delete(connection);

    // Validate connection before returning to pool
    try {
      const isValid = await this.validateConnection(connection);
      if (isValid) {
        this.pool.push(connection);
        this.emit('released', connection);
      } else {
        await this.destroyConnection(connection);
        this.emit('destroyed', connection);
      }
    } catch (error) {
      await this.destroyConnection(connection);
      this.emit('error', error);
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.waitQueue.length > 0 && this.canProvideConnection()) {
      const waiter = this.waitQueue.shift()!;
      clearTimeout(waiter.timeout);

      try {
        const connection = await this.getConnection();
        this.activeConnections.add(connection);
        waiter.resolve(connection);
      } catch (error) {
        waiter.reject(error);
      }
    }
  }

  private canProvideConnection(): boolean {
    return this.pool.length > 0 || 
           (this.activeConnections.size + this.pool.length) < this.maxSize;
  }

  private async getConnection(): Promise<T> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    } else {
      return await this.createConnection();
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      activeConnections: this.activeConnections.size,
      waitingRequests: this.waitQueue.length,
      totalConnections: this.pool.length + this.activeConnections.size
    };
  }

  async shutdown(): Promise<void> {
    // Reject all waiting requests
    this.waitQueue.forEach(waiter => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool shutting down'));
    });
    this.waitQueue = [];

    // Close all connections
    const allConnections = [...this.pool, ...this.activeConnections];
    await Promise.all(allConnections.map(conn => this.destroyConnection(conn)));
    
    this.pool = [];
    this.activeConnections.clear();
    this.emit('shutdown');
  }
}

/**
 * Batch Processor for efficient bulk operations
 */
export class BatchProcessor<T, R> extends EventEmitter {
  private batch: T[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private processing = false;
  
  constructor(
    private processBatch: (items: T[]) => Promise<R[]>,
    private options: {
      batchSize: number;
      flushInterval: number; // milliseconds
      maxRetries?: number;
    }
  ) {
    super();
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push({
        ...item,
        resolve,
        reject
      } as any);

      this.emit('added', item);

      if (this.batch.length >= this.options.batchSize) {
        this.flush();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flush(), this.options.flushInterval);
      }
    });
  }

  async flush(): Promise<void> {
    if (this.processing || this.batch.length === 0) {
      return;
    }

    this.processing = true;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const currentBatch = this.batch.splice(0);
    this.emit('flushing', { size: currentBatch.length });

    try {
      const results = await this.processBatch(currentBatch.map(item => ({
        ...item,
        resolve: undefined,
        reject: undefined
      })));

      // Resolve individual promises
      currentBatch.forEach((item: any, index) => {
        if (results[index] !== undefined) {
          item.resolve(results[index]);
        } else {
          item.reject(new Error('Batch processing failed'));
        }
      });

      this.emit('processed', { size: currentBatch.length });
    } catch (error) {
      // Reject all promises in the batch
      currentBatch.forEach((item: any) => {
        item.reject(error);
      });
      this.emit('error', error);
    } finally {
      this.processing = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    await this.flush();
    this.emit('shutdown');
  }

  getStats() {
    return {
      pendingItems: this.batch.length,
      processing: this.processing,
      hasTimer: !!this.batchTimer
    };
  }
}

/**
 * Performance Monitoring Utility
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private startTimes = new Map<string, number>();

  startTimer(name: string): void {
    this.startTimes.set(name, Date.now());
  }

  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(name);

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    return duration;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const name of this.metrics.keys()) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * Memory Usage Tracker
 */
export class MemoryTracker {
  private snapshots: Array<{
    timestamp: number;
    usage: NodeJS.MemoryUsage;
  }> = [];

  private maxSnapshots: number;

  constructor(maxSnapshots = 100) {
    this.maxSnapshots = maxSnapshots;
  }

  takeSnapshot(): NodeJS.MemoryUsage {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      usage
    });

    // Keep only the last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    return usage;
  }

  getMemoryTrend(minutes = 5): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    samples: number;
  } {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    const recentSnapshots = this.snapshots.filter(s => s.timestamp >= cutoffTime);

    if (recentSnapshots.length < 2) {
      return { trend: 'stable', changePercent: 0, samples: recentSnapshots.length };
    }

    const first = recentSnapshots[0].usage.heapUsed;
    const last = recentSnapshots[recentSnapshots.length - 1].usage.heapUsed;
    const changePercent = ((last - first) / first) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'increasing' : 'decreasing';
    }

    return { trend, changePercent, samples: recentSnapshots.length };
  }

  getLatestUsage(): NodeJS.MemoryUsage | null {
    const latest = this.snapshots[this.snapshots.length - 1];
    return latest ? latest.usage : null;
  }

  isMemoryHigh(thresholdMB = 500): boolean {
    const latest = this.getLatestUsage();
    if (!latest) return false;
    return (latest.heapUsed / 1024 / 1024) > thresholdMB;
  }
}

/**
 * Async Queue with concurrency control
 */
export class AsyncQueue<T> extends EventEmitter {
  private queue: Array<() => Promise<T>> = [];
  private running = 0;
  private results: T[] = [];

  constructor(private concurrency: number = 5) {
    super();
  }

  add(task: () => Promise<T>): void {
    this.queue.push(task);
    this.emit('added', { queueSize: this.queue.length });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;

    try {
      const result = await task();
      this.results.push(result);
      this.emit('completed', result);
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        this.processQueue();
      } else if (this.running === 0) {
        this.emit('drained', this.results);
      }
    }
  }

  getStats() {
    return {
      queued: this.queue.length,
      running: this.running,
      completed: this.results.length
    };
  }

  async drain(): Promise<T[]> {
    return new Promise((resolve) => {
      if (this.queue.length === 0 && this.running === 0) {
        resolve(this.results);
      } else {
        this.once('drained', resolve);
      }
    });
  }
}