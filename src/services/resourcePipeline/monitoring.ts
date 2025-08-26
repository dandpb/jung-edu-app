/**
 * AI Resource Pipeline Monitoring System
 * Provides real-time monitoring, metrics, and health checks for the pipeline
 */

import { EventEmitter } from 'events';
import { AIResourcePipeline, GeneratedResource, PipelineEvent } from './pipeline';
import { PipelineIntegrationHooks, HookEvent } from './integrationHooks';

// Monitoring Metrics
export interface PipelineMetrics {
  totalModulesProcessed: number;
  totalResourcesGenerated: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  resourcesByType: Record<string, number>;
  qualityScores: {
    average: number;
    byType: Record<string, number>;
  };
  performance: {
    averageGenerationTime: number;
    averageValidationTime: number;
    averageHookExecutionTime: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastUpdate: Date;
    issues: string[];
  };
}

// Pipeline Status
export interface PipelineStatus {
  isRunning: boolean;
  activeModules: number;
  queuedModules: number;
  resourcesInProgress: number;
  lastActivity: Date;
  uptime: number;
}

// Performance Alert
export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'quality' | 'error' | 'resource' | 'health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  moduleId?: string;
  resourceId?: string;
  data?: any;
  acknowledged: boolean;
}

// Monitoring Configuration
export interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enablePerformanceTracking: boolean;
  enableQualityTracking: boolean;
  enableHealthChecks: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    errorRate: number;
    averageProcessingTime: number;
    lowQualityScore: number;
    highMemoryUsage: number;
  };
  healthCheckInterval: number;
}

/**
 * Pipeline Monitoring Service
 * Monitors pipeline performance, quality, and health
 */
export class PipelineMonitoringService extends EventEmitter {
  private pipeline: AIResourcePipeline;
  private hooks: PipelineIntegrationHooks;
  private config: MonitoringConfig;
  private metrics!: PipelineMetrics;
  private status!: PipelineStatus;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private performanceData: Map<string, any[]> = new Map();
  private startTime: Date;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    pipeline: AIResourcePipeline,
    hooks: PipelineIntegrationHooks,
    config: Partial<MonitoringConfig> = {}
  ) {
    super();
    
    this.pipeline = pipeline;
    this.hooks = hooks;
    this.startTime = new Date();
    
    this.config = {
      enableMetrics: true,
      enableAlerts: true,
      enablePerformanceTracking: true,
      enableQualityTracking: true,
      enableHealthChecks: true,
      metricsRetentionDays: 30,
      alertThresholds: {
        errorRate: 0.1, // 10%
        averageProcessingTime: 300000, // 5 minutes
        lowQualityScore: 0.6,
        highMemoryUsage: 0.8 // 80%
      },
      healthCheckInterval: 60000, // 1 minute
      ...config
    };

    this.initializeMetrics();
    this.initializeStatus();
    this.setupEventListeners();
    this.startHealthChecks();
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): void {
    this.metrics = {
      totalModulesProcessed: 0,
      totalResourcesGenerated: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
      errorRate: 0.0,
      resourcesByType: {},
      qualityScores: {
        average: 0.8,
        byType: {}
      },
      performance: {
        averageGenerationTime: 0,
        averageValidationTime: 0,
        averageHookExecutionTime: 0
      },
      health: {
        status: 'healthy',
        lastUpdate: new Date(),
        issues: []
      }
    };
  }

  /**
   * Initialize status structure
   */
  private initializeStatus(): void {
    this.status = {
      isRunning: true,
      activeModules: 0,
      queuedModules: 0,
      resourcesInProgress: 0,
      lastActivity: new Date(),
      uptime: 0
    };
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    // Listen to pipeline events
    this.pipeline.on('pipeline_event', (event: PipelineEvent) => {
      this.handlePipelineEvent(event);
    });

    // Listen to hook events
    this.hooks.on('hooks_executed', (event: HookEvent) => {
      this.trackHookPerformance(event);
    });

    this.hooks.on('hooks_failed', (data: { hookEvent: HookEvent; error: Error }) => {
      this.handleHookError(data.hookEvent, data.error);
    });

    // Listen to specific pipeline stages for detailed tracking
    this.pipeline.on('module_created', (event: PipelineEvent) => {
      this.trackModuleStart(event);
    });

    this.pipeline.on('resource_generated', (event: PipelineEvent) => {
      this.trackResourceGeneration(event);
    });

    this.pipeline.on('validation_complete', (event: PipelineEvent) => {
      this.trackValidationComplete(event);
    });

    this.pipeline.on('pipeline_complete', (event: PipelineEvent) => {
      this.trackPipelineComplete(event);
    });

    this.pipeline.on('error', (event: PipelineEvent) => {
      this.trackPipelineError(event);
    });
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    if (!this.config.enableHealthChecks) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Handle pipeline events for monitoring
   */
  private handlePipelineEvent(event: PipelineEvent): void {
    this.status.lastActivity = new Date();
    
    if (this.config.enableMetrics) {
      this.updateMetricsFromEvent(event);
    }

    if (this.config.enableAlerts) {
      this.checkAlertConditions(event);
    }

    this.emit('pipeline_event_monitored', event);
  }

  /**
   * Track module processing start
   */
  private trackModuleStart(event: PipelineEvent): void {
    this.status.activeModules++;
    this.recordPerformanceData('module_start', {
      moduleId: event.moduleId,
      timestamp: event.timestamp
    });

    console.log(`📊 Monitoring: Module processing started for ${event.moduleId}`);
  }

  /**
   * Track resource generation
   */
  private trackResourceGeneration(event: PipelineEvent): void {
    const resourceType = event.data?.type;
    if (resourceType) {
      this.metrics.resourcesByType[resourceType] = 
        (this.metrics.resourcesByType[resourceType] || 0) + 1;
    }

    this.status.resourcesInProgress++;
    this.recordPerformanceData('resource_generation', {
      moduleId: event.moduleId,
      resourceType,
      timestamp: event.timestamp
    });
  }

  /**
   * Track validation completion
   */
  private trackValidationComplete(event: PipelineEvent): void {
    const resources = event.data?.resources || [];
    
    if (this.config.enableQualityTracking) {
      this.updateQualityMetrics(resources);
    }

    this.recordPerformanceData('validation_complete', {
      moduleId: event.moduleId,
      resourceCount: resources.length,
      timestamp: event.timestamp
    });
  }

  /**
   * Track pipeline completion
   */
  private trackPipelineComplete(event: PipelineEvent): void {
    this.metrics.totalModulesProcessed++;
    this.status.activeModules = Math.max(0, this.status.activeModules - 1);
    
    const resources = event.data?.resources || [];
    this.metrics.totalResourcesGenerated += resources.length;
    
    // Calculate processing time
    const startData = this.getPerformanceData('module_start')
      .find(d => d.moduleId === event.moduleId);
    
    if (startData) {
      const processingTime = event.timestamp.getTime() - startData.timestamp.getTime();
      this.updateAverageProcessingTime(processingTime);
    }

    this.recordPerformanceData('pipeline_complete', {
      moduleId: event.moduleId,
      resourceCount: resources.length,
      timestamp: event.timestamp
    });

    console.log(`✅ Monitoring: Pipeline completed for ${event.moduleId}`);
  }

  /**
   * Track pipeline errors
   */
  private trackPipelineError(event: PipelineEvent): void {
    this.status.activeModules = Math.max(0, this.status.activeModules - 1);
    this.updateErrorRate();

    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      severity: 'high',
      message: `Pipeline error for module ${event.moduleId}: ${event.data?.error?.message || 'Unknown error'}`,
      timestamp: event.timestamp,
      moduleId: event.moduleId,
      data: event.data,
      acknowledged: false
    };

    this.addAlert(alert);
  }

  /**
   * Track hook performance
   */
  private trackHookPerformance(event: HookEvent): void {
    if (!this.config.enablePerformanceTracking) return;

    this.recordPerformanceData('hook_execution', {
      hookType: event.type,
      moduleId: event.moduleId,
      timestamp: event.timestamp,
      handled: event.handled
    });
  }

  /**
   * Handle hook errors
   */
  private handleHookError(hookEvent: HookEvent, error: Error): void {
    const alert: PerformanceAlert = {
      id: `hook-alert-${Date.now()}`,
      type: 'error',
      severity: 'medium',
      message: `Hook execution failed: ${hookEvent.type} - ${error.message}`,
      timestamp: new Date(),
      moduleId: hookEvent.moduleId,
      data: { hookEvent, error: error.message },
      acknowledged: false
    };

    this.addAlert(alert);
  }

  /**
   * Update metrics from pipeline events
   */
  private updateMetricsFromEvent(event: PipelineEvent): void {
    this.metrics.health.lastUpdate = new Date();
    
    // Update success/error rates
    if (event.type === 'pipeline_complete') {
      this.updateSuccessRate(true);
    } else if (event.type === 'error') {
      this.updateSuccessRate(false);
    }
  }

  /**
   * Update quality metrics
   */
  private updateQualityMetrics(resources: GeneratedResource[]): void {
    let totalQuality = 0;
    let resourceCount = 0;

    for (const resource of resources) {
      if (resource.metadata.quality !== undefined) {
        totalQuality += resource.metadata.quality;
        resourceCount++;

        // Update quality by type (determine type from ID prefix)
        let resourceType = 'unknown';
        if (resource.id.startsWith('quiz-')) resourceType = 'quiz';
        else if (resource.id.startsWith('video-')) resourceType = 'video';
        else if (resource.id.startsWith('bibliography-')) resourceType = 'bibliography';
        else if (resource.id.startsWith('config-')) resourceType = 'config';
        
        if (!this.metrics.qualityScores.byType[resourceType]) {
          this.metrics.qualityScores.byType[resourceType] = resource.metadata.quality;
        } else {
          this.metrics.qualityScores.byType[resourceType] = 
            (this.metrics.qualityScores.byType[resourceType] + resource.metadata.quality) / 2;
        }

        // Check for low quality alerts
        if (resource.metadata.quality < this.config.alertThresholds.lowQualityScore) {
          this.addQualityAlert(resource);
        }
      }
    }

    if (resourceCount > 0) {
      const averageQuality = totalQuality / resourceCount;
      this.metrics.qualityScores.average = 
        (this.metrics.qualityScores.average + averageQuality) / 2;
    }
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(event: PipelineEvent): void {
    // Check error rate threshold
    if (this.metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.addErrorRateAlert();
    }

    // Check processing time threshold
    if (this.metrics.averageProcessingTime > this.config.alertThresholds.averageProcessingTime) {
      this.addPerformanceAlert();
    }
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    console.log(`🏥 Performing pipeline health check...`);
    
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    if (this.metrics.errorRate > 0.2) {
      issues.push(`High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`);
      status = 'unhealthy';
    } else if (this.metrics.errorRate > 0.1) {
      issues.push(`Elevated error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`);
      status = 'degraded';
    }

    // Check processing time
    if (this.metrics.averageProcessingTime > 600000) { // 10 minutes
      issues.push(`Slow processing time: ${(this.metrics.averageProcessingTime / 1000).toFixed(1)}s`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // Check memory usage (placeholder)
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.config.alertThresholds.highMemoryUsage) {
      issues.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // Update health status
    this.metrics.health = {
      status,
      lastUpdate: new Date(),
      issues
    };

    // Update uptime
    this.status.uptime = Date.now() - this.startTime.getTime();

    if (issues.length > 0) {
      console.warn(`⚠️ Health check issues detected:`, issues);
      this.addHealthAlert(status, issues);
    } else {
      console.log(`✅ Pipeline health check passed`);
    }

    this.emit('health_check_complete', {
      status: this.metrics.health.status,
      issues,
      timestamp: new Date()
    });
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.set(alert.id, alert);
    this.emit('alert_created', alert);
    console.warn(`🚨 Alert created: ${alert.message}`);

    // Auto-cleanup old alerts
    this.cleanupOldAlerts();
  }

  /**
   * Add specific alert types
   */
  private addQualityAlert(resource: GeneratedResource): void {
    const alert: PerformanceAlert = {
      id: `quality-${resource.id}`,
      type: 'quality',
      severity: 'medium',
      message: `Low quality resource: ${resource.id} (score: ${resource.metadata.quality})`,
      timestamp: new Date(),
      moduleId: resource.moduleId,
      resourceId: resource.id,
      data: { resource },
      acknowledged: false
    };

    this.addAlert(alert);
  }

  private addErrorRateAlert(): void {
    const alert: PerformanceAlert = {
      id: `error-rate-${Date.now()}`,
      type: 'error',
      severity: 'high',
      message: `High error rate detected: ${(this.metrics.errorRate * 100).toFixed(1)}%`,
      timestamp: new Date(),
      data: { errorRate: this.metrics.errorRate },
      acknowledged: false
    };

    this.addAlert(alert);
  }

  private addPerformanceAlert(): void {
    const alert: PerformanceAlert = {
      id: `performance-${Date.now()}`,
      type: 'performance',
      severity: 'medium',
      message: `Slow processing detected: ${(this.metrics.averageProcessingTime / 1000).toFixed(1)}s average`,
      timestamp: new Date(),
      data: { averageProcessingTime: this.metrics.averageProcessingTime },
      acknowledged: false
    };

    this.addAlert(alert);
  }

  private addHealthAlert(status: string, issues: string[]): void {
    const alert: PerformanceAlert = {
      id: `health-${Date.now()}`,
      type: 'health',
      severity: status === 'unhealthy' ? 'critical' : 'medium',
      message: `Pipeline health ${status}: ${issues.join(', ')}`,
      timestamp: new Date(),
      data: { status, issues },
      acknowledged: false
    };

    this.addAlert(alert);
  }

  /**
   * Performance data helpers
   */
  private recordPerformanceData(type: string, data: any): void {
    if (!this.performanceData.has(type)) {
      this.performanceData.set(type, []);
    }

    const typeData = this.performanceData.get(type)!;
    typeData.push(data);

    // Keep only recent data
    const cutoffTime = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.performanceData.set(type, 
      typeData.filter(d => d.timestamp.getTime() > cutoffTime)
    );
  }

  private getPerformanceData(type: string): any[] {
    return this.performanceData.get(type) || [];
  }

  /**
   * Metrics calculation helpers
   */
  private updateAverageProcessingTime(newTime: number): void {
    const currentAvg = this.metrics.averageProcessingTime;
    const totalProcessed = this.metrics.totalModulesProcessed;
    
    this.metrics.averageProcessingTime = 
      ((currentAvg * (totalProcessed - 1)) + newTime) / totalProcessed;
  }

  private updateSuccessRate(success: boolean): void {
    const total = this.metrics.totalModulesProcessed + 1;
    const currentSuccesses = this.metrics.successRate * (total - 1);
    const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
    
    this.metrics.successRate = newSuccesses / total;
    this.metrics.errorRate = 1 - this.metrics.successRate;
  }

  private updateErrorRate(): void {
    this.updateSuccessRate(false);
  }

  private getMemoryUsage(): number {
    // Placeholder for actual memory monitoring
    // In a real implementation, this would check actual memory usage
    return Math.random() * 0.5; // Mock: 0-50% usage
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp.getTime() < cutoffTime && alert.acknowledged) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get current metrics
   */
  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current status
   */
  getStatus(): PipelineStatus {
    return { ...this.status };
  }

  /**
   * Get active alerts
   */
  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert_acknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    return {
      totalModules: this.metrics.totalModulesProcessed,
      totalResources: this.metrics.totalResourcesGenerated,
      successRate: this.metrics.successRate,
      averageTime: this.metrics.averageProcessingTime,
      healthStatus: this.metrics.health.status,
      activeAlerts: this.getAlerts().filter(a => !a.acknowledged).length,
      uptime: this.status.uptime
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart health checks if interval changed
    if (updates.healthCheckInterval && this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.startHealthChecks();
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    this.status.isRunning = false;
    this.emit('monitoring_stopped');
  }
}

// Export monitoring service
export default PipelineMonitoringService;