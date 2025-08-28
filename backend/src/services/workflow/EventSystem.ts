/**
 * Event System for jaqEdu Workflow Engine
 * Provides comprehensive event handling, routing, and persistence for workflow execution
 */

import {
  ExecutionEvent,
  WorkflowError,
  WorkflowErrorCode
} from '../../types/workflow';

// ============================================================================
// Core Event System Types
// ============================================================================

/**
 * Event listener function signature
 */
export type EventListener<T = any> = (event: WorkflowEvent<T>) => void | Promise<void>;

/**
 * Async event listener function signature
 */
export type AsyncEventListener<T = any> = (event: WorkflowEvent<T>) => Promise<void>;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  once?: boolean;
  priority?: number;
  timeout?: number;
  filter?: (event: WorkflowEvent) => boolean;
  errorHandler?: (error: Error, event: WorkflowEvent) => void;
}

/**
 * Event subscription interface
 */
export interface EventSubscription {
  id: string;
  eventType: string;
  listener: EventListener;
  options: EventSubscriptionOptions;
  createdAt: Date;
  executionCount: number;
}

/**
 * Enhanced workflow event with generic typing
 */
export interface WorkflowEvent<T = any> {
  id: string;
  type: string;
  source: string;
  data: T;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
  executionId?: string;
  workflowId?: string;
  userId?: string;
}

/**
 * Event emission result
 */
export interface EventEmissionResult {
  eventId: string;
  listenersNotified: number;
  errors: EventError[];
  duration: number;
}

/**
 * Event processing error
 */
export interface EventError {
  subscriptionId: string;
  error: Error;
  timestamp: Date;
}

/**
 * Event statistics
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  totalSubscriptions: number;
  averageProcessingTime: number;
  errorRate: number;
  lastEventTime?: Date;
}

// ============================================================================
// Core Event System Implementation
// ============================================================================

/**
 * Comprehensive event system for workflow execution
 * Supports synchronous and asynchronous event handling with advanced features
 */
export class EventSystem {
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: WorkflowEvent[] = [];
  private stats: EventStats = {
    totalEvents: 0,
    eventsByType: {},
    totalSubscriptions: 0,
    averageProcessingTime: 0,
    errorRate: 0
  };
  private maxHistorySize: number;
  private globalErrorHandler?: (error: Error, event: WorkflowEvent, subscription: EventSubscription) => void;
  private eventFilters: EventFilter[] = [];
  private eventTransformers: EventTransformer[] = [];
  private isShuttingDown = false;

  constructor(options: EventSystemOptions = {}) {
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.globalErrorHandler = options.globalErrorHandler;
    
    // Set up default event types
    this.initializeDefaultEventTypes();
  }

  /**
   * Emit an event to all registered listeners
   */
  async emit<T = any>(
    eventType: string, 
    data: T, 
    metadata: Partial<WorkflowEvent> = {}
  ): Promise<EventEmissionResult> {
    if (this.isShuttingDown) {
      throw new WorkflowError(
        'Cannot emit events during shutdown',
        WorkflowErrorCode.EXECUTION_FAILED
      );
    }

    const startTime = Date.now();
    const eventId = this.generateEventId();
    
    const event: WorkflowEvent<T> = {
      id: eventId,
      type: eventType,
      source: metadata.source || 'workflow-engine',
      data,
      timestamp: new Date(),
      correlationId: metadata.correlationId,
      causationId: metadata.causationId,
      metadata: metadata.metadata,
      executionId: metadata.executionId,
      workflowId: metadata.workflowId,
      userId: metadata.userId
    };

    // Apply event filters
    if (!this.shouldProcessEvent(event)) {
      return {
        eventId,
        listenersNotified: 0,
        errors: [],
        duration: Date.now() - startTime
      };
    }

    // Apply event transformers
    const transformedEvent = this.transformEvent(event);

    // Add to history
    this.addToHistory(transformedEvent);
    
    // Update statistics
    this.updateStats(transformedEvent);

    // Get subscribers for this event type
    const subscribers = this.getSubscribers(eventType);
    const errors: EventError[] = [];
    let notifiedCount = 0;

    // Notify all subscribers
    const notifications = subscribers.map(async (subscription) => {
      try {
        if (subscription.options.filter && !subscription.options.filter(transformedEvent)) {
          return; // Skip filtered events
        }

        await this.notifySubscriber(subscription, transformedEvent);
        subscription.executionCount++;
        notifiedCount++;

        // Remove one-time subscriptions
        if (subscription.options.once) {
          this.unsubscribe(subscription.id);
        }

      } catch (error) {
        const eventError: EventError = {
          subscriptionId: subscription.id,
          error: error as Error,
          timestamp: new Date()
        };
        errors.push(eventError);

        // Handle error through subscription or global handler
        if (subscription.options.errorHandler) {
          subscription.options.errorHandler(error as Error, transformedEvent);
        } else if (this.globalErrorHandler) {
          this.globalErrorHandler(error as Error, transformedEvent, subscription);
        }
      }
    });

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);

    const duration = Date.now() - startTime;
    this.updateProcessingStats(duration);

    return {
      eventId,
      listenersNotified: notifiedCount,
      errors,
      duration
    };
  }

  /**
   * Subscribe to events with advanced options
   */
  subscribe<T = any>(
    eventType: string | string[],
    listener: EventListener<T>,
    options: EventSubscriptionOptions = {}
  ): EventSubscription {
    const subscriptionId = this.generateSubscriptionId();
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType: eventTypes.join(','),
      listener,
      options: {
        priority: 0,
        timeout: 5000,
        ...options
      },
      createdAt: new Date(),
      executionCount: 0
    };

    // Add subscription for each event type
    eventTypes.forEach(type => {
      if (!this.subscriptions.has(type)) {
        this.subscriptions.set(type, []);
      }
      
      const typeSubscriptions = this.subscriptions.get(type)!;
      typeSubscriptions.push(subscription);
      
      // Sort by priority (higher priority first)
      typeSubscriptions.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
    });

    this.stats.totalSubscriptions++;
    return subscription;
  }

  /**
   * Subscribe to events once only
   */
  once<T = any>(
    eventType: string,
    listener: EventListener<T>,
    options: EventSubscriptionOptions = {}
  ): EventSubscription {
    return this.subscribe(eventType, listener, { ...options, once: true });
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    let found = false;
    
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        found = true;
        this.stats.totalSubscriptions--;
        
        // Clean up empty event type entries
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
      }
    }
    
    return found;
  }

  /**
   * Unsubscribe all listeners for an event type
   */
  unsubscribeAll(eventType?: string): number {
    let removedCount = 0;
    
    if (eventType) {
      const subscriptions = this.subscriptions.get(eventType);
      if (subscriptions) {
        removedCount = subscriptions.length;
        this.subscriptions.delete(eventType);
        this.stats.totalSubscriptions -= removedCount;
      }
    } else {
      // Remove all subscriptions
      for (const subscriptions of this.subscriptions.values()) {
        removedCount += subscriptions.length;
      }
      this.subscriptions.clear();
      this.stats.totalSubscriptions = 0;
    }
    
    return removedCount;
  }

  /**
   * Wait for a specific event with timeout
   */
  waitFor<T = any>(
    eventType: string, 
    timeout = 10000,
    filter?: (event: WorkflowEvent<T>) => boolean
  ): Promise<WorkflowEvent<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      
      const subscription = this.subscribe<T>(
        eventType,
        (event) => {
          if (!filter || filter(event)) {
            clearTimeout(timeoutId);
            resolve(event);
          }
        },
        { once: true }
      );
      
      timeoutId = setTimeout(() => {
        this.unsubscribe(subscription.id);
        reject(new WorkflowError(
          `Timeout waiting for event '${eventType}' after ${timeout}ms`,
          WorkflowErrorCode.TIMEOUT_ERROR
        ));
      }, timeout);
    });
  }

  /**
   * Add event filter
   */
  addFilter(filter: EventFilter): void {
    this.eventFilters.push(filter);
  }

  /**
   * Remove event filter
   */
  removeFilter(filterId: string): boolean {
    const index = this.eventFilters.findIndex(f => f.id === filterId);
    if (index !== -1) {
      this.eventFilters.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add event transformer
   */
  addTransformer(transformer: EventTransformer): void {
    this.eventTransformers.push(transformer);
    this.eventTransformers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Remove event transformer
   */
  removeTransformer(transformerId: string): boolean {
    const index = this.eventTransformers.findIndex(t => t.id === transformerId);
    if (index !== -1) {
      this.eventTransformers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get event history
   */
  getEventHistory(
    eventType?: string, 
    limit?: number,
    since?: Date
  ): WorkflowEvent[] {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }
    
    if (since) {
      history = history.filter(event => event.timestamp >= since);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return [...history]; // Return copy
  }

  /**
   * Get current statistics
   */
  getStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(eventType?: string): EventSubscription[] {
    if (eventType) {
      return [...(this.subscriptions.get(eventType) || [])];
    }
    
    const allSubscriptions: EventSubscription[] = [];
    for (const subscriptions of this.subscriptions.values()) {
      allSubscriptions.push(...subscriptions);
    }
    
    // Remove duplicates (subscriptions to multiple event types)
    const unique = new Map<string, EventSubscription>();
    allSubscriptions.forEach(sub => unique.set(sub.id, sub));
    
    return Array.from(unique.values());
  }

  /**
   * Check if event type has subscribers
   */
  hasSubscribers(eventType: string): boolean {
    return this.subscriptions.has(eventType) && 
           this.subscriptions.get(eventType)!.length > 0;
  }

  /**
   * Gracefully shutdown the event system
   */
  async shutdown(timeout = 5000): Promise<void> {
    this.isShuttingDown = true;
    
    // Wait for pending events to complete or timeout
    const startTime = Date.now();
    while (this.isProcessingEvents() && (Date.now() - startTime) < timeout) {
      await this.sleep(100);
    }
    
    // Clear all subscriptions and history
    this.unsubscribeAll();
    this.clearHistory();
    
    // Reset statistics
    this.stats = {
      totalEvents: 0,
      eventsByType: {},
      totalSubscriptions: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private initializeDefaultEventTypes(): void {
    // Define common workflow event types
    const defaultEventTypes = [
      'workflow.started',
      'workflow.completed',
      'workflow.failed',
      'workflow.paused',
      'workflow.resumed',
      'state.entered',
      'state.completed',
      'state.failed',
      'action.started',
      'action.completed',
      'action.failed',
      'condition.evaluated',
      'loop.started',
      'loop.iteration',
      'loop.completed',
      'parallel.started',
      'parallel.child.completed',
      'parallel.completed',
      'execution.started',
      'execution.completed',
      'execution.failed',
      'node.execution.started',
      'node.execution.completed',
      'node.execution.failed',
      'strategy.selected',
      'error.occurred',
      'timeout.exceeded'
    ];

    // Initialize empty subscription lists for default event types
    defaultEventTypes.forEach(eventType => {
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, []);
      }
    });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldProcessEvent(event: WorkflowEvent): boolean {
    return this.eventFilters.every(filter => filter.shouldProcess(event));
  }

  private transformEvent(event: WorkflowEvent): WorkflowEvent {
    return this.eventTransformers.reduce((transformedEvent, transformer) => {
      return transformer.transform(transformedEvent);
    }, event);
  }

  private addToHistory(event: WorkflowEvent): void {
    this.eventHistory.push(event);
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private updateStats(event: WorkflowEvent): void {
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
    this.stats.lastEventTime = event.timestamp;
  }

  private updateProcessingStats(duration: number): void {
    // Update average processing time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.stats.averageProcessingTime = 
      this.stats.averageProcessingTime * (1 - alpha) + duration * alpha;
  }

  private getSubscribers(eventType: string): EventSubscription[] {
    return this.subscriptions.get(eventType) || [];
  }

  private async notifySubscriber(
    subscription: EventSubscription,
    event: WorkflowEvent
  ): Promise<void> {
    const timeout = subscription.options.timeout || 5000;
    
    const notification = async () => {
      try {
        const result = subscription.listener(event);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        throw error;
      }
    };

    // Execute with timeout
    await Promise.race([
      notification(),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new WorkflowError(
            `Event listener timeout after ${timeout}ms`,
            WorkflowErrorCode.TIMEOUT_ERROR
          ));
        }, timeout);
      })
    ]);
  }

  private isProcessingEvents(): boolean {
    // In a more complex implementation, this would track pending async operations
    return false; // Simplified assumption
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Event System Configuration and Extensions
// ============================================================================

/**
 * Event system configuration options
 */
export interface EventSystemOptions {
  maxHistorySize?: number;
  globalErrorHandler?: (error: Error, event: WorkflowEvent, subscription: EventSubscription) => void;
}

/**
 * Event filter interface
 */
export interface EventFilter {
  id: string;
  name: string;
  shouldProcess(event: WorkflowEvent): boolean;
  priority?: number;
}

/**
 * Event transformer interface
 */
export interface EventTransformer {
  id: string;
  name: string;
  transform(event: WorkflowEvent): WorkflowEvent;
  priority?: number;
}

/**
 * Educational workflow event types with specific data structures
 */
export interface StudentProgressEvent {
  userId: string;
  moduleId: string;
  progress: number;
  completedSections: string[];
  timeSpent: number;
}

export interface AssessmentEvent {
  userId: string;
  assessmentId: string;
  questionId?: string;
  score?: number;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface LearningPathEvent {
  userId: string;
  pathId: string;
  moduleId: string;
  action: 'started' | 'completed' | 'skipped' | 'recommended';
  adaptationTrigger?: string;
}

export interface ContentAdaptationEvent {
  userId: string;
  contentId: string;
  originalVariant: string;
  adaptedVariant: string;
  reason: string;
  confidence: number;
}

// ============================================================================
// Educational Event System Extensions
// ============================================================================

/**
 * Educational-specific event system with domain events
 */
export class EducationalEventSystem extends EventSystem {
  constructor(options: EventSystemOptions = {}) {
    super(options);
    this.initializeEducationalEventTypes();
  }

  /**
   * Emit student progress event
   */
  async emitStudentProgress(
    data: StudentProgressEvent,
    metadata?: Partial<WorkflowEvent>
  ): Promise<EventEmissionResult> {
    return this.emit('student.progress.updated', data, {
      ...metadata,
      source: 'education-system',
      userId: data.userId
    });
  }

  /**
   * Emit assessment event
   */
  async emitAssessment(
    eventType: 'started' | 'question.answered' | 'completed' | 'failed',
    data: AssessmentEvent,
    metadata?: Partial<WorkflowEvent>
  ): Promise<EventEmissionResult> {
    return this.emit(`assessment.${eventType}`, data, {
      ...metadata,
      source: 'assessment-system',
      userId: data.userId
    });
  }

  /**
   * Emit learning path event
   */
  async emitLearningPath(
    data: LearningPathEvent,
    metadata?: Partial<WorkflowEvent>
  ): Promise<EventEmissionResult> {
    return this.emit(`learning.path.${data.action}`, data, {
      ...metadata,
      source: 'learning-path-system',
      userId: data.userId
    });
  }

  /**
   * Emit content adaptation event
   */
  async emitContentAdaptation(
    data: ContentAdaptationEvent,
    metadata?: Partial<WorkflowEvent>
  ): Promise<EventEmissionResult> {
    return this.emit('content.adapted', data, {
      ...metadata,
      source: 'adaptation-system',
      userId: data.userId
    });
  }

  /**
   * Subscribe to all student events for a specific user
   */
  subscribeToStudent(
    userId: string,
    listener: EventListener,
    options?: EventSubscriptionOptions
  ): EventSubscription[] {
    const studentEventTypes = [
      'student.progress.updated',
      'assessment.started',
      'assessment.question.answered', 
      'assessment.completed',
      'assessment.failed',
      'learning.path.started',
      'learning.path.completed',
      'learning.path.skipped',
      'content.adapted'
    ];

    const filter = (event: WorkflowEvent) => event.userId === userId;
    
    return studentEventTypes.map(eventType => 
      this.subscribe(eventType, listener, {
        ...options,
        filter: options?.filter ? 
          (event) => filter(event) && options.filter!(event) :
          filter
      })
    );
  }

  private initializeEducationalEventTypes(): void {
    const educationalEventTypes = [
      'student.progress.updated',
      'student.achievement.unlocked',
      'student.registered',
      'student.graduated',
      'assessment.started',
      'assessment.question.answered',
      'assessment.completed',
      'assessment.failed',
      'learning.path.started',
      'learning.path.completed',
      'learning.path.skipped',
      'learning.path.recommended',
      'content.adapted',
      'content.personalized',
      'module.started',
      'module.completed',
      'quiz.started',
      'quiz.completed',
      'forum.post.created',
      'forum.reply.created',
      'certificate.issued',
      'jung.archetype.discovered',
      'jung.individuation.milestone',
      'jung.dream.analyzed',
      'jung.shadow.integrated'
    ];

    educationalEventTypes.forEach(eventType => {
      if (!this.hasSubscribers(eventType)) {
        // Initialize empty subscription list
        this.subscribe(eventType, () => {}, { once: true });
        this.unsubscribeAll(eventType);
      }
    });
  }
}

// ============================================================================
// Event System Factory
// ============================================================================

/**
 * Factory for creating event systems
 */
export class EventSystemFactory {
  private static instances = new Map<string, EventSystem>();

  /**
   * Create or get an event system instance
   */
  static create(
    type: 'standard' | 'educational' = 'standard',
    instanceId = 'default',
    options?: EventSystemOptions
  ): EventSystem {
    const key = `${type}-${instanceId}`;
    
    if (!this.instances.has(key)) {
      const eventSystem = type === 'educational' ? 
        new EducationalEventSystem(options) :
        new EventSystem(options);
      
      this.instances.set(key, eventSystem);
    }
    
    return this.instances.get(key)!;
  }

  /**
   * Remove an event system instance
   */
  static async destroy(type: string, instanceId = 'default'): Promise<void> {
    const key = `${type}-${instanceId}`;
    const instance = this.instances.get(key);
    
    if (instance) {
      await instance.shutdown();
      this.instances.delete(key);
    }
  }

  /**
   * Cleanup all instances
   */
  static async destroyAll(): Promise<void> {
    const shutdownPromises = Array.from(this.instances.values())
      .map(instance => instance.shutdown());
    
    await Promise.all(shutdownPromises);
    this.instances.clear();
  }

  /**
   * Get all active instances
   */
  static getInstances(): Map<string, EventSystem> {
    return new Map(this.instances);
  }
}