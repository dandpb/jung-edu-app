/**
 * Intelligent Retry Mechanism with Exponential Backoff
 * Implements various retry strategies with jitter and circuit breaker integration
 */

export enum RetryStrategy {
  EXPONENTIAL = 'EXPONENTIAL',
  LINEAR = 'LINEAR',
  FIXED = 'FIXED',
  FIBONACCI = 'FIBONACCI'
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay?: number;
  strategy: RetryStrategy;
  jitter?: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  onFailure?: (error: Error, totalAttempts: number) => void;
  onSuccess?: (result: any, attempt: number) => void;
  abortSignal?: AbortSignal;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class RetryMechanism {
  constructor(private readonly config: RetryConfig) {}

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      attempt++;

      // Check for abort signal
      if (this.config.abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }

      try {
        const result = await operation();
        this.config.onSuccess?.(result, attempt);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry this error
        if (!this.shouldRetry(lastError, attempt)) {
          break;
        }

        // Don't wait on the last attempt
        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt);
          this.config.onRetry?.(lastError, attempt, delay);
          await this.wait(delay);
        }
      }
    }

    this.config.onFailure?.(lastError!, attempt);
    throw new RetryError(
      `Operation failed after ${attempt} attempts`,
      lastError!,
      attempt
    );
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    if (this.config.retryCondition) {
      return this.config.retryCondition(error, attempt);
    }

    // Default retry conditions
    return this.isRetriableError(error);
  }

  private isRetriableError(error: Error): boolean {
    // Network errors
    if (error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ECONNREFUSED')) {
      return true;
    }

    // HTTP status codes that are retriable
    if ('status' in error) {
      const status = (error as any).status;
      return status >= 500 || status === 408 || status === 429;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case RetryStrategy.EXPONENTIAL:
        delay = this.config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case RetryStrategy.LINEAR:
        delay = this.config.baseDelay * attempt;
        break;
      case RetryStrategy.FIXED:
        delay = this.config.baseDelay;
        break;
      case RetryStrategy.FIBONACCI:
        delay = this.config.baseDelay * this.fibonacci(attempt);
        break;
      default:
        delay = this.config.baseDelay;
    }

    // Apply maximum delay limit
    if (this.config.maxDelay) {
      delay = Math.min(delay, this.config.maxDelay);
    }

    // Apply jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 1;
    
    let prev = 1;
    let curr = 1;
    
    for (let i = 3; i <= n; i++) {
      const next = prev + curr;
      prev = curr;
      curr = next;
    }
    
    return curr;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry Decorator for method-level retry logic
 */
export function Retry(config: RetryConfig) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const retryMechanism = new RetryMechanism(config);

    descriptor.value = async function(...args: any[]) {
      return retryMechanism.execute(async () => {
        return method.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryProfiles = {
  NETWORK_REQUEST: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    strategy: RetryStrategy.EXPONENTIAL,
    jitter: true,
    retryCondition: (error: Error) => {
      // Retry on network errors and 5xx status codes
      return error.message.includes('ECONNRESET') ||
             error.message.includes('ETIMEDOUT') ||
             ('status' in error && (error as any).status >= 500);
    }
  } as RetryConfig,

  DATABASE_OPERATION: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 5000,
    strategy: RetryStrategy.EXPONENTIAL,
    jitter: true,
    retryCondition: (error: Error) => {
      // Retry on connection errors and lock timeouts
      return error.message.includes('connection') ||
             error.message.includes('lock') ||
             error.message.includes('timeout');
    }
  } as RetryConfig,

  EXTERNAL_API: {
    maxAttempts: 4,
    baseDelay: 2000,
    maxDelay: 30000,
    strategy: RetryStrategy.FIBONACCI,
    jitter: true,
    retryCondition: (error: Error, attempt: number) => {
      // More conservative retry for external APIs
      if ('status' in error) {
        const status = (error as any).status;
        return status === 429 || status >= 500;
      }
      return false;
    }
  } as RetryConfig
};