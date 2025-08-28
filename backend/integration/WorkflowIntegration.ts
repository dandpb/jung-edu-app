import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { WorkflowAPI } from '../api/WorkflowAPI';
import { WorkflowMonitoring } from '../monitoring/WorkflowMonitoring';
import { WorkflowStateManager } from '../state/WorkflowStateManager';
import { PerformanceOptimizer } from '../utils/performance';
import { OptimizationManager } from '../utils/optimization';
import { performance } from 'perf_hooks';

export interface IntegrationConfig {
  enableHealthChecks: boolean;
  enableMetricsCollection: boolean;
  enableErrorRecovery: boolean;
  enableLoadBalancing: boolean;
  enableCircuitBreaker: boolean;
  healthCheckInterval: number;
  metricsCollectionInterval: number;
  errorRecoveryMaxRetries: number;
  circuitBreakerThreshold: number;
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  responseTime: number;
  errorCount: number;
  details: any;
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  componentsHealth: ComponentHealth[];
  circuitBreakerStatus: Record<string, 'closed' | 'open' | 'half-open'>;
  loadBalancingStats: {
    totalDistributed: number;
    distributionStrategy: string;
    nodeUtilization: Record<string, number>;
  };
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  fallbackEnabled: boolean;
}

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
  healthCheckRequired: boolean;
  nodes: Array<{ id: string; weight?: number; endpoint?: string }>;
}

/**
 * Integration service that coordinates all workflow components
 * Provides seamless integration, health monitoring, and error recovery
 */
export class WorkflowIntegration extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: IntegrationConfig;
  
  // Component references
  private readonly workflowEngine: WorkflowEngine;
  private readonly workflowAPI: WorkflowAPI;
  private readonly monitoring: WorkflowMonitoring;
  private readonly stateManager: WorkflowStateManager;
  private readonly performanceOptimizer: PerformanceOptimizer;
  private readonly optimizationManager: OptimizationManager;
  
  // Integration state
  private readonly componentHealth = new Map<string, ComponentHealth>();
  private readonly circuitBreakers = new Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailure: number;
    nextAttempt: number;
  }>();
  
  // Load balancing
  private readonly loadBalancers = new Map<string, {
    strategy: string;
    nodes: any[];
    currentIndex: number;
    nodeStats: Map<string, { requests: number; errors: number; responseTime: number }>;
  }>();
  
  // Monitoring intervals
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  
  // Error recovery
  private readonly errorRecovery = new Map<string, {
    retryCount: number;
    lastAttempt: number;
    strategy: 'exponential' | 'linear' | 'fixed';
  }>();
  
  // Request routing
  private readonly requestRouter = new Map<string, string[]>();
  
  // Component coordination
  private readonly componentDependencies = new Map<string, string[]>();
  private readonly componentStartOrder: string[] = [];
  private readonly componentStopOrder: string[] = [];
  
  constructor(config: {
    workflowEngine: WorkflowEngine;
    api: WorkflowAPI;
    monitoring: WorkflowMonitoring;
    stateManager: WorkflowStateManager;
    performanceOptimizer: PerformanceOptimizer;
    optimizationManager: OptimizationManager;
    logger: Logger;
    config?: Partial<IntegrationConfig>;
  }) {
    super();
    this.workflowEngine = config.workflowEngine;
    this.workflowAPI = config.api;
    this.monitoring = config.monitoring;
    this.stateManager = config.stateManager;
    this.performanceOptimizer = config.performanceOptimizer;
    this.optimizationManager = config.optimizationManager;
    this.logger = config.logger;
    
    // Default configuration
    this.config = {
      enableHealthChecks: true,
      enableMetricsCollection: true,
      enableErrorRecovery: true,
      enableLoadBalancing: false,
      enableCircuitBreaker: true,
      healthCheckInterval: 30000, // 30 seconds
      metricsCollectionInterval: 60000, // 1 minute
      errorRecoveryMaxRetries: 3,
      circuitBreakerThreshold: 5,
      ...config.config
    };
    
    this.logger.info('WorkflowIntegration initialized', {
      config: this.config
    });
    
    this.setupComponentDependencies();
    this.setupEventHandlers();
  }
  
  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing workflow integration');
    
    try {
      // Initialize circuit breakers
      if (this.config.enableCircuitBreaker) {
        this.initializeCircuitBreakers();
      }
      
      // Initialize load balancers
      if (this.config.enableLoadBalancing) {
        this.initializeLoadBalancers();
      }
      
      // Set up component health monitoring
      if (this.config.enableHealthChecks) {
        await this.initializeHealthChecks();
      }
      
      // Set up metrics collection
      if (this.config.enableMetricsCollection) {
        this.initializeMetricsCollection();
      }
      
      // Set up request routing
      this.initializeRequestRouting();
      
      // Start integration monitoring
      this.startIntegrationMonitoring();
      
      this.logger.info('Workflow integration initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Workflow integration initialization failed', { error });
      throw error;
    }
  }
  
  /**
   * Set up component dependencies and startup/shutdown order
   */
  private setupComponentDependencies(): void {
    // Define component dependencies (who depends on whom)
    this.componentDependencies.set('stateManager', []);
    this.componentDependencies.set('performanceOptimizer', ['stateManager']);
    this.componentDependencies.set('workflowEngine', ['stateManager', 'performanceOptimizer']);
    this.componentDependencies.set('monitoring', ['workflowEngine', 'stateManager']);
    this.componentDependencies.set('optimizationManager', ['performanceOptimizer', 'workflowEngine']);
    this.componentDependencies.set('api', ['workflowEngine', 'monitoring', 'stateManager']);
    
    // Calculate startup order (topological sort)
    this.componentStartOrder = this.topologicalSort(this.componentDependencies);
    
    // Shutdown order is reverse of startup order
    this.componentStopOrder = [...this.componentStartOrder].reverse();
    
    this.logger.info('Component dependencies configured', {
      startOrder: this.componentStartOrder,
      stopOrder: this.componentStopOrder
    });
  }
  
  /**
   * Set up event handlers for component coordination
   */
  private setupEventHandlers(): void {
    // Engine events
    this.workflowEngine.on('workflowStarted', (data) => {
      this.handleWorkflowEvent('started', data);
    });
    
    this.workflowEngine.on('workflowCompleted', (data) => {
      this.handleWorkflowEvent('completed', data);
    });
    
    this.workflowEngine.on('workflowFailed', (data) => {
      this.handleWorkflowEvent('failed', data);
    });
    
    // API events
    this.workflowAPI.on('requestReceived', (data) => {
      this.handleAPIEvent('request', data);
    });
    
    this.workflowAPI.on('responseSent', (data) => {
      this.handleAPIEvent('response', data);
    });
    
    this.workflowAPI.on('error', (data) => {
      this.handleAPIEvent('error', data);
    });
    
    // Monitoring events
    this.monitoring.on('alert', (data) => {
      this.handleMonitoringEvent('alert', data);
    });
    
    this.monitoring.on('threshold', (data) => {
      this.handleMonitoringEvent('threshold', data);
    });
    
    // Performance events
    this.performanceOptimizer.on('metrics', (data) => {
      this.handlePerformanceEvent('metrics', data);
    });
    
    // Optimization events
    this.optimizationManager.on('optimizationComplete', (data) => {
      this.handleOptimizationEvent('optimization', data);
    });
    
    // State manager events
    this.stateManager.on('stateChanged', (data) => {
      this.handleStateEvent('change', data);
    });
  }
  
  /**
   * Initialize circuit breakers for fault tolerance
   */
  private initializeCircuitBreakers(): void {
    this.logger.info('Initializing circuit breakers');
    
    const components = ['workflowEngine', 'api', 'stateManager', 'monitoring'];
    
    components.forEach(component => {
      this.circuitBreakers.set(component, {
        state: 'closed',
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0
      });
    });
    
    this.logger.info('Circuit breakers initialized', {
      components: Array.from(this.circuitBreakers.keys())
    });
  }
  
  /**
   * Initialize load balancers
   */
  private initializeLoadBalancers(): void {
    this.logger.info('Initializing load balancers');
    
    // Example load balancer setup (would be configured based on deployment)
    const apiNodes = [
      { id: 'api-1', weight: 1 },
      { id: 'api-2', weight: 1 }
    ];
    
    this.loadBalancers.set('api', {
      strategy: 'round-robin',
      nodes: apiNodes,
      currentIndex: 0,
      nodeStats: new Map()
    });
    
    // Initialize node statistics
    apiNodes.forEach(node => {
      const stats = this.loadBalancers.get('api')!.nodeStats;
      stats.set(node.id, { requests: 0, errors: 0, responseTime: 0 });
    });
    
    this.logger.info('Load balancers initialized');
  }
  
  /**
   * Initialize health checks
   */
  private async initializeHealthChecks(): Promise<void> {
    this.logger.info('Initializing health checks');
    
    // Perform initial health check
    await this.performHealthCheck();
    
    // Start periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Health check failed', { error });
      }
    }, this.config.healthCheckInterval);
    
    this.logger.info('Health checks initialized');
  }
  
  /**
   * Initialize metrics collection
   */
  private initializeMetricsCollection(): void {
    this.logger.info('Initializing metrics collection');
    
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectIntegrationMetrics();
        this.emit('metrics', metrics);
      } catch (error) {
        this.logger.error('Metrics collection failed', { error });
      }
    }, this.config.metricsCollectionInterval);
    
    this.logger.info('Metrics collection initialized');
  }
  
  /**
   * Initialize request routing
   */
  private initializeRequestRouting(): void {
    this.logger.info('Initializing request routing');
    
    // Define routing rules
    this.requestRouter.set('workflow', ['workflowEngine']);
    this.requestRouter.set('state', ['stateManager']);
    this.requestRouter.set('monitoring', ['monitoring']);
    this.requestRouter.set('optimization', ['optimizationManager']);
    
    this.logger.info('Request routing initialized');
  }
  
  /**
   * Start integration monitoring
   */
  private startIntegrationMonitoring(): void {
    this.logger.info('Starting integration monitoring');
    
    // Monitor component interactions
    setInterval(() => {
      this.monitorComponentInteractions();
    }, 30000); // Every 30 seconds
    
    // Monitor error patterns
    setInterval(() => {
      this.analyzeErrorPatterns();
    }, 300000); // Every 5 minutes
    
    this.logger.info('Integration monitoring started');
  }
  
  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();
    
    const components = [
      { name: 'workflowEngine', instance: this.workflowEngine },
      { name: 'api', instance: this.workflowAPI },
      { name: 'monitoring', instance: this.monitoring },
      { name: 'stateManager', instance: this.stateManager },
      { name: 'performanceOptimizer', instance: this.performanceOptimizer },
      { name: 'optimizationManager', instance: this.optimizationManager }
    ];
    
    for (const component of components) {
      const componentStartTime = performance.now();
      
      try {
        let health: any;
        
        if (component.instance && typeof component.instance.healthCheck === 'function') {
          health = await component.instance.healthCheck();
        } else {
          health = { status: 'healthy', message: 'No health check implemented' };
        }
        
        const responseTime = performance.now() - componentStartTime;
        
        const componentHealth: ComponentHealth = {
          component: component.name,
          status: health.status || 'healthy',
          lastCheck: Date.now(),
          responseTime,
          errorCount: health.errorCount || 0,
          details: health.details || {}
        };
        
        this.componentHealth.set(component.name, componentHealth);
        
        // Update circuit breaker
        this.updateCircuitBreaker(component.name, true, responseTime);
        
      } catch (error) {
        this.logger.warn(`Health check failed for ${component.name}`, { error });
        
        const responseTime = performance.now() - componentStartTime;
        
        const componentHealth: ComponentHealth = {
          component: component.name,
          status: 'unhealthy',
          lastCheck: Date.now(),
          responseTime,
          errorCount: 1,
          details: { error: error.message }
        };
        
        this.componentHealth.set(component.name, componentHealth);
        
        // Update circuit breaker
        this.updateCircuitBreaker(component.name, false, responseTime);
        
        // Trigger error recovery if enabled
        if (this.config.enableErrorRecovery) {
          await this.initiateErrorRecovery(component.name, error);
        }
      }
    }
    
    const totalTime = performance.now() - startTime;
    this.logger.debug('Health check completed', {
      duration: `${totalTime.toFixed(2)}ms`,
      components: components.length
    });
  }
  
  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(component: string, success: boolean, responseTime: number): void {
    if (!this.config.enableCircuitBreaker) return;
    
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return;
    
    if (success) {
      // Reset failure count on success
      breaker.failures = 0;
      
      // Close circuit if it was half-open
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        this.logger.info(`Circuit breaker closed for ${component}`);
        this.emit('circuitBreakerClosed', { component });
      }
    } else {
      // Increment failure count
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      // Open circuit if threshold exceeded
      if (breaker.failures >= this.config.circuitBreakerThreshold && breaker.state === 'closed') {
        breaker.state = 'open';
        breaker.nextAttempt = Date.now() + 60000; // 1 minute timeout
        
        this.logger.warn(`Circuit breaker opened for ${component}`, {
          failures: breaker.failures,
          threshold: this.config.circuitBreakerThreshold
        });
        
        this.emit('circuitBreakerOpened', { component, failures: breaker.failures });
      }
    }
    
    // Try to close circuit after timeout
    if (breaker.state === 'open' && Date.now() > breaker.nextAttempt) {
      breaker.state = 'half-open';
      this.logger.info(`Circuit breaker half-open for ${component}`);
      this.emit('circuitBreakerHalfOpen', { component });
    }
  }
  
  /**
   * Initiate error recovery for a component
   */
  private async initiateErrorRecovery(component: string, error: any): Promise<void> {
    this.logger.info(`Initiating error recovery for ${component}`, { error: error.message });
    
    const recovery = this.errorRecovery.get(component) || {
      retryCount: 0,
      lastAttempt: 0,
      strategy: 'exponential'
    };
    
    if (recovery.retryCount >= this.config.errorRecoveryMaxRetries) {
      this.logger.error(`Max retry attempts exceeded for ${component}`, {
        retryCount: recovery.retryCount,
        maxRetries: this.config.errorRecoveryMaxRetries
      });
      
      this.emit('errorRecoveryFailed', { component, error, retryCount: recovery.retryCount });
      return;
    }
    
    // Calculate retry delay based on strategy
    let delay = 0;
    switch (recovery.strategy) {
      case 'exponential':
        delay = Math.pow(2, recovery.retryCount) * 1000; // 1s, 2s, 4s, 8s...
        break;
      case 'linear':
        delay = (recovery.retryCount + 1) * 1000; // 1s, 2s, 3s, 4s...
        break;
      case 'fixed':
        delay = 5000; // Fixed 5s delay
        break;
    }
    
    recovery.retryCount++;
    recovery.lastAttempt = Date.now();
    this.errorRecovery.set(component, recovery);
    
    // Schedule retry
    setTimeout(async () => {
      try {
        await this.attemptComponentRecovery(component);
        
        // Reset retry count on success
        recovery.retryCount = 0;
        this.errorRecovery.set(component, recovery);
        
        this.emit('errorRecoverySuccess', { component });
        
      } catch (retryError) {
        this.logger.warn(`Error recovery attempt failed for ${component}`, {
          retryError: retryError.message,
          attempt: recovery.retryCount
        });
        
        // Retry again if under limit
        if (recovery.retryCount < this.config.errorRecoveryMaxRetries) {
          await this.initiateErrorRecovery(component, retryError);
        }
      }
    }, delay);
  }
  
  /**
   * Attempt to recover a failed component
   */
  private async attemptComponentRecovery(component: string): Promise<void> {
    this.logger.info(`Attempting recovery for ${component}`);
    
    switch (component) {
      case 'workflowEngine':
        await this.workflowEngine.healthCheck();
        break;
      case 'api':
        await this.workflowAPI.healthCheck();
        break;
      case 'monitoring':
        await this.monitoring.healthCheck();
        break;
      case 'stateManager':
        await this.stateManager.healthCheck();
        break;
      default:
        throw new Error(`Unknown component: ${component}`);
    }
    
    this.logger.info(`Recovery successful for ${component}`);
  }
  
  /**
   * Collect integration metrics
   */
  private async collectIntegrationMetrics(): Promise<IntegrationMetrics> {
    const componentsHealth = Array.from(this.componentHealth.values());
    
    // Circuit breaker status
    const circuitBreakerStatus: Record<string, 'closed' | 'open' | 'half-open'> = {};
    for (const [component, breaker] of this.circuitBreakers.entries()) {
      circuitBreakerStatus[component] = breaker.state;
    }
    
    // Load balancing stats
    const loadBalancingStats = {
      totalDistributed: 0,
      distributionStrategy: 'round-robin',
      nodeUtilization: {} as Record<string, number>
    };
    
    for (const [name, balancer] of this.loadBalancers.entries()) {
      for (const [nodeId, stats] of balancer.nodeStats.entries()) {
        loadBalancingStats.totalDistributed += stats.requests;
        loadBalancingStats.nodeUtilization[nodeId] = stats.requests;
      }
    }
    
    // Calculate request statistics
    const totalRequests = loadBalancingStats.totalDistributed || 0;
    const failedRequests = componentsHealth.reduce((sum, health) => sum + health.errorCount, 0);
    const successfulRequests = Math.max(0, totalRequests - failedRequests);
    const averageResponseTime = componentsHealth.reduce((sum, health) => sum + health.responseTime, 0) / componentsHealth.length || 0;
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      componentsHealth,
      circuitBreakerStatus,
      loadBalancingStats
    };
  }
  
  /**
   * Monitor component interactions
   */
  private monitorComponentInteractions(): void {
    // Check for cascading failures
    const unhealthyComponents = Array.from(this.componentHealth.values())
      .filter(health => health.status === 'unhealthy')
      .map(health => health.component);
    
    if (unhealthyComponents.length > 1) {
      this.logger.warn('Multiple unhealthy components detected', {
        components: unhealthyComponents
      });
      
      this.emit('cascadingFailure', { components: unhealthyComponents });
    }
    
    // Check for high response times
    const slowComponents = Array.from(this.componentHealth.values())
      .filter(health => health.responseTime > 1000)
      .map(health => ({ component: health.component, responseTime: health.responseTime }));
    
    if (slowComponents.length > 0) {
      this.emit('performanceDegradation', { components: slowComponents });
    }
  }
  
  /**
   * Analyze error patterns
   */
  private analyzeErrorPatterns(): void {
    const errorCounts = new Map<string, number>();
    
    // Count errors by component
    for (const health of this.componentHealth.values()) {
      if (health.errorCount > 0) {
        errorCounts.set(health.component, health.errorCount);
      }
    }
    
    // Identify components with high error rates
    const highErrorComponents = Array.from(errorCounts.entries())
      .filter(([_, count]) => count > 10)
      .map(([component, count]) => ({ component, count }));
    
    if (highErrorComponents.length > 0) {
      this.emit('highErrorRate', { components: highErrorComponents });
    }
  }
  
  // Event handlers
  private handleWorkflowEvent(type: string, data: any): void {
    this.logger.debug(`Workflow event: ${type}`, data);
    this.emit('workflowEvent', { type, data });
  }
  
  private handleAPIEvent(type: string, data: any): void {
    this.logger.debug(`API event: ${type}`, data);
    this.emit('apiEvent', { type, data });
    
    // Update load balancer stats
    if (type === 'response' && data.nodeId) {
      this.updateLoadBalancerStats(data.nodeId, data.responseTime, data.error);
    }
  }
  
  private handleMonitoringEvent(type: string, data: any): void {
    this.logger.debug(`Monitoring event: ${type}`, data);
    this.emit('monitoringEvent', { type, data });
  }
  
  private handlePerformanceEvent(type: string, data: any): void {
    this.logger.debug(`Performance event: ${type}`, data);
    this.emit('performanceEvent', { type, data });
  }
  
  private handleOptimizationEvent(type: string, data: any): void {
    this.logger.debug(`Optimization event: ${type}`, data);
    this.emit('optimizationEvent', { type, data });
  }
  
  private handleStateEvent(type: string, data: any): void {
    this.logger.debug(`State event: ${type}`, data);
    this.emit('stateEvent', { type, data });
  }
  
  /**
   * Update load balancer statistics
   */
  private updateLoadBalancerStats(nodeId: string, responseTime: number, error: boolean): void {
    for (const balancer of this.loadBalancers.values()) {
      const nodeStats = balancer.nodeStats.get(nodeId);
      if (nodeStats) {
        nodeStats.requests++;
        nodeStats.responseTime = (nodeStats.responseTime + responseTime) / 2; // Moving average
        if (error) {
          nodeStats.errors++;
        }
      }
    }
  }
  
  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(dependencies: Map<string, string[]>): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (node: string): void => {
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`);
      }
      
      if (!visited.has(node)) {
        visiting.add(node);
        
        const deps = dependencies.get(node) || [];
        for (const dep of deps) {
          visit(dep);
        }
        
        visiting.delete(node);
        visited.add(node);
        result.push(node);
      }
    };
    
    for (const node of dependencies.keys()) {
      visit(node);
    }
    
    return result;
  }
  
  /**
   * Get component health status
   */
  getComponentHealth(): ComponentHealth[] {
    return Array.from(this.componentHealth.values());
  }
  
  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Record<string, 'closed' | 'open' | 'half-open'> {
    const status: Record<string, 'closed' | 'open' | 'half-open'> = {};
    for (const [component, breaker] of this.circuitBreakers.entries()) {
      status[component] = breaker.state;
    }
    return status;
  }
  
  /**
   * Manual circuit breaker control
   */
  async resetCircuitBreaker(component: string): Promise<void> {
    const breaker = this.circuitBreakers.get(component);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failures = 0;
      breaker.lastFailure = 0;
      breaker.nextAttempt = 0;
      
      this.logger.info(`Circuit breaker reset for ${component}`);
      this.emit('circuitBreakerReset', { component });
    }
  }
  
  /**
   * Stop the integration service
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping workflow integration');
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Clean up resources
    this.componentHealth.clear();
    this.circuitBreakers.clear();
    this.loadBalancers.clear();
    this.errorRecovery.clear();
    
    this.logger.info('Workflow integration stopped');
    this.emit('stopped');
  }
}