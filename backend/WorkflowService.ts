/**
 * Main Workflow Service - Integrates all workflow components
 * Provides a unified interface for workflow management in jaqEdu
 */

import { EventEmitter } from 'events';
import { WorkflowEngine } from './services/workflow/WorkflowEngine';
import { WorkflowStateManager } from './services/workflow/WorkflowStateManager';
import { StateStore } from './services/workflow/StateStore';
import { createDefaultStateValidator } from './services/workflow/StateValidator';
import { MonitoringService } from './monitoring/MonitoringService';
import { WorkflowMonitor } from './monitoring/WorkflowMonitor';
import { createMonitoringSystem } from './monitoring';
import { WorkflowController } from './api/workflow/WorkflowController';
import { WorkflowRoutes } from './api/workflow/WorkflowRoutes';
import { Express } from 'express';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStatus, 
  WorkflowResult,
  WorkflowServiceConfig,
  ServiceHealthStatus,
  WorkflowMetrics
} from './types/workflow';

export interface WorkflowServiceDependencies {
  express: Express;
  database: any; // Database connection
  redis: any;    // Redis connection
  logger: any;   // Logger instance
}

export class WorkflowService extends EventEmitter {
  private engine: WorkflowEngine;
  private stateManager: WorkflowStateManager;
  private monitoringService: MonitoringService;
  private workflowMonitor: WorkflowMonitor;
  private controller: WorkflowController;
  private config: WorkflowServiceConfig;
  private isInitialized = false;
  private isShuttingDown = false;

  constructor(
    config: WorkflowServiceConfig,
    dependencies: WorkflowServiceDependencies
  ) {
    super();
    this.config = config;
    this.initializeComponents(dependencies);
  }

  /**
   * Initialize all workflow service components
   */
  private async initializeComponents(dependencies: WorkflowServiceDependencies): Promise<void> {
    try {
      // Initialize state storage
      const stateStore = new StateStore({
        database: dependencies.database,
        redis: dependencies.redis,
        enableCache: this.config.enableCache || true,
        cacheConfig: this.config.cacheConfig
      });
      await stateStore.initialize();

      // Initialize state manager
      const validator = createDefaultStateValidator();
      this.stateManager = new WorkflowStateManager({
        stateStore,
        validator,
        enableSnapshots: this.config.enableSnapshots || true,
        maxHistoryEntries: this.config.maxHistoryEntries || 100
      });

      // Initialize monitoring system
      const { monitoringService, workflowMonitor, middleware, initialize } = 
        createMonitoringSystem(this.config.environment || 'development');
      
      await initialize();
      this.monitoringService = monitoringService;
      this.workflowMonitor = workflowMonitor;

      // Initialize workflow engine
      this.engine = new WorkflowEngine({
        stateManager: this.stateManager,
        eventSystem: this.engine?.getEventSystem(),
        pluginManager: this.config.pluginManager,
        logger: dependencies.logger,
        config: {
          maxConcurrentExecutions: this.config.maxConcurrentExecutions || 10,
          defaultTimeout: this.config.defaultTimeout || 300000, // 5 minutes
          enableMetrics: true
        }
      });

      // Initialize API controller
      this.controller = new WorkflowController({
        workflowEngine: this.engine,
        stateManager: this.stateManager,
        monitoringService: this.monitoringService
      });

      // Setup API routes
      const routes = new WorkflowRoutes(this.controller);
      dependencies.express.use('/api/v1', routes.getRouter());

      // Setup monitoring middleware
      dependencies.express.use(middleware.requestTiming());
      dependencies.express.use(middleware.requestId());
      dependencies.express.use(middleware.userContext());
      dependencies.express.use(middleware.middleware());

      this.isInitialized = true;
      this.emit('initialized');

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start the workflow service
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('WorkflowService must be initialized before starting');
    }

    try {
      // Start monitoring
      await this.monitoringService.start();
      
      // Register shutdown handlers
      this.registerShutdownHandlers();

      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflow: Workflow, 
    inputData: Record<string, any> = {},
    options: { 
      timeout?: number;
      priority?: 'low' | 'medium' | 'high';
      userId?: string;
    } = {}
  ): Promise<WorkflowResult> {
    if (!this.isInitialized) {
      throw new Error('WorkflowService not initialized');
    }

    const workflowId = this.workflowMonitor.startWorkflow(
      workflow.name,
      workflow.type || 'general',
      options.priority || 'medium'
    );

    try {
      // Create workflow execution
      const execution: WorkflowExecution = {
        id: workflowId,
        workflowId: workflow.id,
        status: WorkflowStatus.PENDING,
        startTime: new Date(),
        inputData,
        currentState: 'start',
        metadata: {
          userId: options.userId,
          priority: options.priority || 'medium',
          timeout: options.timeout || this.config.defaultTimeout
        }
      };

      // Execute workflow
      const result = await this.engine.executeWorkflow(workflow, execution, inputData);

      // Track completion
      this.workflowMonitor.completeWorkflow(workflowId, result.status === 'completed');

      return result;

    } catch (error) {
      this.workflowMonitor.failWorkflow(workflowId, error.message);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.controller.getExecution(executionId);
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    await this.controller.cancelExecution(executionId, reason);
    this.workflowMonitor.cancelWorkflow(executionId, reason || 'User cancelled');
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<ServiceHealthStatus> {
    const healthChecker = this.monitoringService.getHealthChecker();
    const health = await healthChecker.getHealthStatus();

    return {
      status: health.status,
      timestamp: new Date(),
      components: {
        engine: this.engine ? 'healthy' : 'unhealthy',
        stateManager: this.stateManager ? 'healthy' : 'unhealthy',
        monitoring: this.monitoringService ? 'healthy' : 'unhealthy'
      },
      metrics: await this.getServiceMetrics()
    };
  }

  /**
   * Get workflow metrics
   */
  async getServiceMetrics(): Promise<WorkflowMetrics> {
    const metricsCollector = this.monitoringService.getMetricsCollector();
    
    return {
      totalExecutions: await metricsCollector.getMetric('workflow_executions_total'),
      successfulExecutions: await metricsCollector.getMetric('workflow_executions_successful_total'),
      failedExecutions: await metricsCollector.getMetric('workflow_executions_failed_total'),
      averageExecutionTime: await metricsCollector.getMetric('workflow_execution_duration_avg'),
      activeExecutions: await metricsCollector.getMetric('workflow_executions_active'),
      queuedExecutions: await metricsCollector.getMetric('workflow_executions_queued')
    };
  }

  /**
   * Register graceful shutdown handlers
   */
  private registerShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop accepting new workflows
        this.emit('shutting-down');

        // Wait for active executions to complete (with timeout)
        await this.waitForActiveExecutions(30000); // 30 seconds

        // Shutdown monitoring
        await this.monitoringService.stop();

        // Close database connections
        await this.stateManager.shutdown();

        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart
  }

  /**
   * Wait for active executions to complete
   */
  private async waitForActiveExecutions(timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const metrics = await this.getServiceMetrics();
      if (metrics.activeExecutions === 0) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.warn('Shutdown timeout reached, forcing exit...');
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.emit('shutting-down');

    try {
      await this.monitoringService?.stop();
      await this.stateManager?.shutdown();
      this.emit('shutdown');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

/**
 * Factory function to create and configure WorkflowService
 */
export function createWorkflowService(
  config: WorkflowServiceConfig,
  dependencies: WorkflowServiceDependencies
): WorkflowService {
  return new WorkflowService(config, dependencies);
}

/**
 * Default configuration for development
 */
export const defaultConfig: Partial<WorkflowServiceConfig> = {
  environment: 'development',
  enableCache: true,
  enableSnapshots: true,
  maxHistoryEntries: 100,
  maxConcurrentExecutions: 10,
  defaultTimeout: 300000 // 5 minutes
};