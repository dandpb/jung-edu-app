/**
 * Self-Healing Orchestrator
 * 
 * Central coordinator for all self-healing activities across the distributed system.
 * Manages fault detection, recovery execution, and predictive actions.
 */

import { EventEmitter } from 'events';
import { Logger } from '../common/logger';
import { HealthMonitor } from '../monitoring/health-monitor';
import { FaultDetector } from '../monitoring/fault-detector';
import { RecoveryManager } from '../recovery/recovery-manager';
import { PredictiveAnalytics } from '../analytics/predictive-analytics';
import { RollbackManager } from '../rollback/rollback-manager';
import { 
  SystemFailure, 
  RecoveryAction, 
  HealthStatus, 
  PredictionAlert,
  OrchestratorConfig,
  RecoveryResult
} from './types';

export class SelfHealingOrchestrator extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: OrchestratorConfig;
  private readonly healthMonitor: HealthMonitor;
  private readonly faultDetector: FaultDetector;
  private readonly recoveryManager: RecoveryManager;
  private readonly predictiveAnalytics: PredictiveAnalytics;
  private readonly rollbackManager: RollbackManager;
  
  private isActive: boolean = false;
  private activeRecoveries: Map<string, RecoveryAction> = new Map();
  private systemHealth: Map<string, HealthStatus> = new Map();

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.logger = new Logger('SelfHealingOrchestrator');
    
    // Initialize components
    this.healthMonitor = new HealthMonitor(config.healthMonitor);
    this.faultDetector = new FaultDetector(config.faultDetector);
    this.recoveryManager = new RecoveryManager(config.recoveryManager);
    this.predictiveAnalytics = new PredictiveAnalytics(config.predictiveAnalytics);
    this.rollbackManager = new RollbackManager(config.rollbackManager);
    
    this.setupEventHandlers();
  }

  /**
   * Start the self-healing orchestration
   */
  async start(): Promise<void> {
    this.logger.info('Starting Self-Healing Orchestrator');
    
    try {
      // Initialize all components
      await Promise.all([
        this.healthMonitor.start(),
        this.faultDetector.start(),
        this.recoveryManager.initialize(),
        this.predictiveAnalytics.initialize(),
        this.rollbackManager.initialize()
      ]);

      this.isActive = true;
      
      // Start continuous monitoring
      this.startContinuousMonitoring();
      
      this.logger.info('Self-Healing Orchestrator started successfully');
      this.emit('started');
      
    } catch (error) {
      this.logger.error('Failed to start Self-Healing Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Stop the self-healing orchestration
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping Self-Healing Orchestrator');
    
    this.isActive = false;
    
    // Wait for active recoveries to complete
    await this.waitForActiveRecoveries();
    
    // Stop all components
    await Promise.all([
      this.healthMonitor.stop(),
      this.faultDetector.stop(),
      this.predictiveAnalytics.stop()
    ]);
    
    this.logger.info('Self-Healing Orchestrator stopped');
    this.emit('stopped');
  }

  /**
   * Handle detected system failure
   */
  private async handleSystemFailure(failure: SystemFailure): Promise<void> {
    this.logger.warn(`System failure detected: ${failure.type}`, {
      service: failure.service,
      severity: failure.severity,
      impact: failure.impact
    });

    try {
      // Check if recovery is already in progress
      if (this.activeRecoveries.has(failure.service)) {
        this.logger.info(`Recovery already in progress for ${failure.service}`);
        return;
      }

      // Assess recovery strategy
      const recoveryStrategy = await this.assessRecoveryStrategy(failure);
      
      // Execute recovery action
      const recoveryAction = await this.executeRecovery(failure, recoveryStrategy);
      
      // Track active recovery
      this.activeRecoveries.set(failure.service, recoveryAction);
      
      // Monitor recovery progress
      this.monitorRecoveryProgress(recoveryAction);

      this.emit('recoveryStarted', { failure, recoveryAction });

    } catch (error) {
      this.logger.error(`Failed to handle system failure for ${failure.service}:`, error);
      this.emit('recoveryFailed', { failure, error });
    }
  }

  /**
   * Handle predictive alerts
   */
  private async handlePredictiveAlert(alert: PredictionAlert): Promise<void> {
    this.logger.info(`Predictive alert received: ${alert.type}`, {
      service: alert.service,
      probability: alert.probability,
      timeToFailure: alert.timeToFailure
    });

    try {
      // Execute preventive actions
      if (alert.probability > this.config.preventiveActionThreshold) {
        await this.executePreventiveActions(alert);
      }

      // Update monitoring thresholds
      await this.updateMonitoringThresholds(alert);

      this.emit('predictiveActionTaken', { alert });

    } catch (error) {
      this.logger.error(`Failed to handle predictive alert for ${alert.service}:`, error);
    }
  }

  /**
   * Assess the best recovery strategy for a given failure
   */
  private async assessRecoveryStrategy(failure: SystemFailure): Promise<string> {
    const factors = {
      severity: failure.severity,
      impact: failure.impact,
      service: failure.service,
      dependencies: failure.dependencies || [],
      historicalData: await this.getHistoricalRecoveryData(failure.service)
    };

    // Use ML model to recommend recovery strategy
    const recommendation = await this.predictiveAnalytics.recommendRecoveryStrategy(factors);
    
    this.logger.debug(`Recovery strategy recommended: ${recommendation.strategy}`, {
      confidence: recommendation.confidence,
      factors
    });

    return recommendation.strategy;
  }

  /**
   * Execute recovery action
   */
  private async executeRecovery(
    failure: SystemFailure,
    strategy: string
  ): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      id: this.generateRecoveryId(),
      service: failure.service,
      strategy,
      startTime: Date.now(),
      status: 'in_progress',
      failure
    };

    this.logger.info(`Executing recovery action: ${strategy} for ${failure.service}`, {
      recoveryId: recoveryAction.id
    });

    try {
      switch (strategy) {
        case 'circuit_breaker':
          await this.recoveryManager.executeCircuitBreakerRecovery(failure);
          break;
        
        case 'restart_service':
          await this.recoveryManager.executeServiceRestart(failure);
          break;
        
        case 'scale_up':
          await this.recoveryManager.executeScaleUp(failure);
          break;
        
        case 'rollback':
          const rollbackResult = await this.rollbackManager.executeRollback({
            service: failure.service,
            trigger: 'failure_recovery',
            automatic: true,
            startTime: Date.now()
          });
          recoveryAction.rollbackId = rollbackResult.rollbackId;
          break;
        
        case 'failover':
          await this.recoveryManager.executeFailover(failure);
          break;
        
        default:
          throw new Error(`Unknown recovery strategy: ${strategy}`);
      }

      recoveryAction.status = 'completed';
      recoveryAction.endTime = Date.now();
      
      this.logger.info(`Recovery action completed: ${strategy} for ${failure.service}`, {
        recoveryId: recoveryAction.id,
        duration: recoveryAction.endTime - recoveryAction.startTime
      });

    } catch (error) {
      recoveryAction.status = 'failed';
      recoveryAction.error = error.message;
      recoveryAction.endTime = Date.now();
      
      this.logger.error(`Recovery action failed: ${strategy} for ${failure.service}`, {
        recoveryId: recoveryAction.id,
        error: error.message
      });
      
      throw error;
    }

    return recoveryAction;
  }

  /**
   * Execute preventive actions based on predictive alerts
   */
  private async executePreventiveActions(alert: PredictionAlert): Promise<void> {
    const actions = alert.recommendedActions || [];
    
    for (const action of actions) {
      try {
        this.logger.info(`Executing preventive action: ${action.type}`, {
          service: alert.service,
          action: action.description
        });

        switch (action.type) {
          case 'scale_resources':
            await this.recoveryManager.executeProactiveScaling({
              service: alert.service,
              prediction: alert,
              scalingFactor: action.parameters?.scalingFactor || 1.5
            });
            break;
          
          case 'adjust_thresholds':
            await this.adjustMonitoringThresholds({
              service: alert.service,
              metric: action.parameters?.metric,
              adjustment: action.parameters?.adjustment
            });
            break;
          
          case 'schedule_maintenance':
            await this.schedulePreventiveMaintenance({
              service: alert.service,
              window: action.parameters?.maintenanceWindow,
              priority: action.priority
            });
            break;
          
          default:
            this.logger.warn(`Unknown preventive action type: ${action.type}`);
        }

      } catch (error) {
        this.logger.error(`Failed to execute preventive action: ${action.type}`, error);
      }
    }
  }

  /**
   * Monitor recovery progress and handle completion/failure
   */
  private monitorRecoveryProgress(recoveryAction: RecoveryAction): void {
    const monitoringInterval = setInterval(async () => {
      try {
        const healthStatus = await this.healthMonitor.getServiceHealth(recoveryAction.service);
        
        if (healthStatus.status === 'healthy') {
          // Recovery successful
          this.handleRecoverySuccess(recoveryAction);
          clearInterval(monitoringInterval);
        } else if (Date.now() - recoveryAction.startTime > this.config.recoveryTimeout) {
          // Recovery timeout
          this.handleRecoveryTimeout(recoveryAction);
          clearInterval(monitoringInterval);
        }

      } catch (error) {
        this.logger.error(`Error monitoring recovery progress for ${recoveryAction.id}:`, error);
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Handle successful recovery
   */
  private async handleRecoverySuccess(recoveryAction: RecoveryAction): Promise<void> {
    recoveryAction.status = 'completed';
    recoveryAction.endTime = Date.now();
    
    // Remove from active recoveries
    this.activeRecoveries.delete(recoveryAction.service);
    
    // Update ML models with successful recovery data
    await this.predictiveAnalytics.updateRecoveryFeedback(recoveryAction, 'success');
    
    this.logger.info(`Recovery completed successfully: ${recoveryAction.id}`, {
      service: recoveryAction.service,
      strategy: recoveryAction.strategy,
      duration: recoveryAction.endTime - recoveryAction.startTime
    });

    this.emit('recoveryCompleted', { recoveryAction });
  }

  /**
   * Handle recovery timeout or failure
   */
  private async handleRecoveryTimeout(recoveryAction: RecoveryAction): Promise<void> {
    recoveryAction.status = 'failed';
    recoveryAction.endTime = Date.now();
    recoveryAction.error = 'Recovery timeout exceeded';
    
    // Remove from active recoveries
    this.activeRecoveries.delete(recoveryAction.service);
    
    // Update ML models with failed recovery data
    await this.predictiveAnalytics.updateRecoveryFeedback(recoveryAction, 'failure');
    
    // Escalate to human intervention
    await this.escalateToHuman(recoveryAction);
    
    this.logger.error(`Recovery failed/timeout: ${recoveryAction.id}`, {
      service: recoveryAction.service,
      strategy: recoveryAction.strategy,
      duration: recoveryAction.endTime - recoveryAction.startTime
    });

    this.emit('recoveryFailed', { recoveryAction });
  }

  /**
   * Setup event handlers for components
   */
  private setupEventHandlers(): void {
    // Fault detector events
    this.faultDetector.on('failureDetected', (failure: SystemFailure) => {
      this.handleSystemFailure(failure);
    });

    // Predictive analytics events
    this.predictiveAnalytics.on('predictionAlert', (alert: PredictionAlert) => {
      this.handlePredictiveAlert(alert);
    });

    // Health monitor events
    this.healthMonitor.on('healthStatusChanged', (status: HealthStatus) => {
      this.systemHealth.set(status.service, status);
      this.emit('healthStatusChanged', status);
    });
  }

  /**
   * Start continuous monitoring loop
   */
  private startContinuousMonitoring(): void {
    setInterval(async () => {
      if (!this.isActive) return;

      try {
        // Collect system metrics
        const systemMetrics = await this.healthMonitor.getSystemMetrics();
        
        // Run predictive analysis
        await this.predictiveAnalytics.analyzeTrends(systemMetrics);
        
        // Update system health cache
        await this.updateSystemHealthCache();
        
      } catch (error) {
        this.logger.error('Error in continuous monitoring loop:', error);
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Utility methods
   */
  private generateRecoveryId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async waitForActiveRecoveries(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeRecoveries.size > 0 && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.activeRecoveries.size > 0) {
      this.logger.warn(`${this.activeRecoveries.size} recoveries still active after timeout`);
    }
  }

  private async getHistoricalRecoveryData(service: string): Promise<any> {
    // Implementation would fetch historical recovery data from database
    return {};
  }

  private async updateMonitoringThresholds(alert: PredictionAlert): Promise<void> {
    // Implementation would update monitoring thresholds based on predictions
  }

  private async adjustMonitoringThresholds(params: any): Promise<void> {
    // Implementation would adjust monitoring thresholds
  }

  private async schedulePreventiveMaintenance(params: any): Promise<void> {
    // Implementation would schedule maintenance window
  }

  private async updateSystemHealthCache(): Promise<void> {
    // Implementation would update cached health status
  }

  private async escalateToHuman(recoveryAction: RecoveryAction): Promise<void> {
    // Implementation would send alerts to operations team
    this.logger.error(`Escalating to human intervention: ${recoveryAction.id}`);
  }

  /**
   * Get current system status
   */
  getSystemStatus(): any {
    return {
      isActive: this.isActive,
      activeRecoveries: this.activeRecoveries.size,
      systemHealth: Array.from(this.systemHealth.values()),
      uptime: Date.now() - (this.config.startTime || Date.now())
    };
  }
}