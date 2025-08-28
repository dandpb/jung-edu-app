/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures by monitoring service health
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: Array<string | RegExp>;
  onStateChange?: (state: CircuitState) => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: number;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private resetTimer?: NodeJS.Timeout;

  constructor(
    private readonly config: CircuitBreakerConfig,
    private readonly name: string = 'CircuitBreaker'
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<R>(operation: () => Promise<R>): Promise<R> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.config.onStateChange?.(this.state);
      } else {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.config.onStateChange?.(this.state);
    }
    
    this.config.onSuccess?.();
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.isExpectedError(error)) {
      return; // Don't count expected errors towards circuit opening
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.scheduleReset();
      this.config.onStateChange?.(this.state);
    }

    this.config.onFailure?.(error);
  }

  private isExpectedError(error: Error): boolean {
    if (!this.config.expectedErrors) return false;

    return this.config.expectedErrors.some(expected => {
      if (typeof expected === 'string') {
        return error.message.includes(expected);
      }
      return expected.test(error.message);
    });
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.state = CircuitState.HALF_OPEN;
        this.config.onStateChange?.(this.state);
      }
    }, this.config.resetTimeout);
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failureRate: this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Force circuit breaker state change (for testing)
   */
  forceState(state: CircuitState): void {
    this.state = state;
    this.config.onStateChange?.(state);
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}

/**
 * Circuit Breaker Factory for creating pre-configured instances
 */
export class CircuitBreakerFactory {
  private static breakers = new Map<string, CircuitBreaker>();

  static create(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const breaker = new CircuitBreaker(config, name);
    this.breakers.set(name, breaker);
    return breaker;
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  static getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  static remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return this.breakers.delete(name);
    }
    return false;
  }
}