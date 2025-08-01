/**
 * Alerting Service
 * Integration service that connects the alerting engine with the monitoring system
 */

import { AlertingEngine, AlertState } from './AlertingEngine';
import { PipelineMonitoringService, PerformanceAlert, PipelineMetrics, PipelineStatus } from '../resourcePipeline/monitoring';
import { EventEmitter } from 'events';

export interface AlertingServiceConfig {
  enableAutoStart: boolean;
  integrationMode: 'real-time' | 'polling' | 'hybrid';
  pollingInterval: number; // milliseconds
  alertRetentionDays: number;
  enableTestMode: boolean;
}

/**
 * Alerting Service that integrates with monitoring system
 */
export class AlertingService extends EventEmitter {
  private alertingEngine: AlertingEngine;
  private monitoringService?: PipelineMonitoringService;
  private config: AlertingServiceConfig;
  private isRunning: boolean = false;
  private pollingTimer?: NodeJS.Timeout;
  private alertHistory: Map<string, PerformanceAlert[]> = new Map();

  constructor(config: Partial<AlertingServiceConfig> = {}) {
    super();
    
    this.config = {
      enableAutoStart: true,
      integrationMode: 'hybrid',
      pollingInterval: 30000, // 30 seconds
      alertRetentionDays: 30,
      enableTestMode: false,
      ...config
    };

    this.alertingEngine = new AlertingEngine();
    this.setupEventHandlers();
    
    if (this.config.enableAutoStart) {
      this.start();
    }

    console.log('🔔 Alerting Service initialized');
  }

  /**
   * Setup event handlers for alerting engine
   */
  private setupEventHandlers(): void {
    // Handle alerts from engine
    this.alertingEngine.on('alert_fired', (alert: PerformanceAlert) => {
      this.handleAlertFired(alert);
    });

    this.alertingEngine.on('alert_resolved', (alert: PerformanceAlert) => {
      this.handleAlertResolved(alert);
    });

    this.alertingEngine.on('alert_acknowledged', (alertState: AlertState) => {
      this.handleAlertAcknowledged(alertState);
    });

    this.alertingEngine.on('alert_escalated', (escalationData: any) => {
      this.handleAlertEscalated(escalationData);
    });

    this.alertingEngine.on('in_app_notification', (alert: PerformanceAlert) => {
      this.handleInAppNotification(alert);
    });

    this.alertingEngine.on('evaluation_error', (error: any) => {
      console.error('⚠️ Alert evaluation error:', error);
      this.emit('evaluation_error', error);
    });
  }

  /**
   * Connect to monitoring service
   */
  connectToMonitoring(monitoringService: PipelineMonitoringService): void {
    this.monitoringService = monitoringService;

    // Listen to monitoring events for real-time alerting
    if (this.config.integrationMode === 'real-time' || this.config.integrationMode === 'hybrid') {
      this.setupMonitoringEventHandlers();
    }

    console.log('🔗 Connected alerting service to monitoring system');
  }

  /**
   * Setup monitoring event handlers
   */
  private setupMonitoringEventHandlers(): void {
    if (!this.monitoringService) return;

    // Listen for monitoring events that should trigger alerts
    this.monitoringService.on('pipeline_event_monitored', (event: any) => {
      this.handleMonitoringEvent(event);
    });

    this.monitoringService.on('health_check_complete', (healthData: any) => {
      this.handleHealthCheckEvent(healthData);
    });

    this.monitoringService.on('alert_created', (alert: PerformanceAlert) => {
      // Forward monitoring alerts to our alerting engine
      this.processMonitoringAlert(alert);
    });
  }

  /**
   * Start the alerting service
   */
  start(): void {
    if (this.isRunning) {
      console.warn('⚠️ Alerting service is already running');
      return;
    }

    this.isRunning = true;

    // Start polling mode if configured
    if (this.config.integrationMode === 'polling' || this.config.integrationMode === 'hybrid') {
      this.startPolling();
    }

    // Setup cleanup for old alerts
    this.setupAlertCleanup();

    console.log(`🚀 Alerting service started in ${this.config.integrationMode} mode`);
    this.emit('service_started');
  }

  /**
   * Stop the alerting service
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Stop polling
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }

    // Stop alerting engine
    this.alertingEngine.stop();

    console.log('🛑 Alerting service stopped');
    this.emit('service_stopped');
  }

  /**
   * Start polling for metrics
   */
  private startPolling(): void {
    this.pollingTimer = setInterval(() => {
      if (this.isRunning && this.monitoringService) {
        this.pollMetrics();
      }
    }, this.config.pollingInterval);
  }

  /**
   * Poll metrics from monitoring service
   */
  private async pollMetrics(): Promise<void> {
    if (!this.monitoringService) return;

    try {
      const metrics = this.monitoringService.getMetrics();
      const status = this.monitoringService.getStatus();
      
      // Process metrics for alert evaluation
      await this.processMetricsForAlerts(metrics, status);
      
    } catch (error) {
      console.error('❌ Error polling metrics:', error);
      this.emit('polling_error', error);
    }
  }

  /**
   * Process metrics for alert evaluation
   */
  private async processMetricsForAlerts(metrics: PipelineMetrics, status: PipelineStatus): Promise<void> {
    // This method would trigger alert evaluations based on current metrics
    // The actual alert rules evaluation is handled by the AlertingEngine
    
    // Example: Check if we should create synthetic alerts based on metrics
    if (metrics.errorRate > 0.1) {
      this.emit('metric_threshold_exceeded', {
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: 0.1
      });
    }

    if (metrics.averageProcessingTime > 300000) { // 5 minutes
      this.emit('metric_threshold_exceeded', {
        metric: 'processingTime',
        value: metrics.averageProcessingTime,
        threshold: 300000
      });
    }

    if (metrics.qualityScores.average < 0.6) {
      this.emit('metric_threshold_exceeded', {
        metric: 'qualityScore',
        value: metrics.qualityScores.average,
        threshold: 0.6
      });
    }
  }

  /**
   * Handle monitoring events
   */
  private handleMonitoringEvent(event: any): void {
    // Process monitoring events for real-time alerting
    if (event.type === 'error' && this.shouldCreateAlert(event)) {
      this.createAlertFromEvent(event);
    }
  }

  /**
   * Handle health check events
   */
  private handleHealthCheckEvent(healthData: any): void {
    if (healthData.status === 'unhealthy') {
      this.createHealthAlert(healthData);
    }
  }

  /**
   * Process monitoring alerts
   */
  private processMonitoringAlert(alert: PerformanceAlert): void {
    // Store alert in history
    this.addToAlertHistory(alert);
    
    // Forward to dashboard or other systems
    this.emit('monitoring_alert', alert);
  }

  /**
   * Create alert from monitoring event
   */
  private createAlertFromEvent(event: any): void {
    const alert: PerformanceAlert = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      severity: this.determineSeverityFromEvent(event),
      message: `Event alert: ${event.type} - ${event.data?.error?.message || 'Unknown error'}`,
      timestamp: event.timestamp || new Date(),
      moduleId: event.moduleId,
      data: event.data,
      acknowledged: false
    };

    this.addToAlertHistory(alert);
    this.emit('event_alert_created', alert);
  }

  /**
   * Create health alert
   */
  private createHealthAlert(healthData: any): void {
    const alert: PerformanceAlert = {
      id: `health-${Date.now()}`,
      type: 'health',
      severity: healthData.status === 'unhealthy' ? 'critical' : 'medium',
      message: `Health check failed: ${healthData.issues?.join(', ') || 'System unhealthy'}`,
      timestamp: healthData.timestamp || new Date(),
      data: healthData,
      acknowledged: false
    };

    this.addToAlertHistory(alert);
    this.emit('health_alert_created', alert);
  }

  /**
   * Event handlers for alerting engine events
   */
  private handleAlertFired(alert: PerformanceAlert): void {
    console.log(`🚨 Alert fired: ${alert.message}`);
    this.addToAlertHistory(alert);
    this.emit('alert_fired', alert);
  }

  private handleAlertResolved(alert: PerformanceAlert): void {
    console.log(`✅ Alert resolved: ${alert.message}`);
    this.addToAlertHistory(alert);
    this.emit('alert_resolved', alert);
  }

  private handleAlertAcknowledged(alertState: AlertState): void {
    console.log(`✅ Alert acknowledged: ${alertState.id}`);
    this.emit('alert_acknowledged', alertState);
  }

  private handleAlertEscalated(escalationData: any): void {
    console.log(`📈 Alert escalated: ${escalationData.alert.message} to level ${escalationData.level}`);
    this.emit('alert_escalated', escalationData);
  }

  private handleInAppNotification(alert: PerformanceAlert): void {
    // Forward in-app notifications to connected clients
    this.emit('in_app_notification', alert);
  }

  /**
   * Alert history management
   */
  private addToAlertHistory(alert: PerformanceAlert): void {
    const date = alert.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!this.alertHistory.has(date)) {
      this.alertHistory.set(date, []);
    }
    
    this.alertHistory.get(date)!.push(alert);
  }

  /**
   * Setup periodic cleanup of old alerts
   */
  private setupAlertCleanup(): void {
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
      this.cleanupOldAlerts();
    }, cleanupInterval);
  }

  /**
   * Clean up old alerts from history
   */
  private cleanupOldAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.alertRetentionDays);
    
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    for (const [date] of this.alertHistory) {
      if (date < cutoffString) {
        this.alertHistory.delete(date);
      }
    }
    
    console.log('🧹 Cleaned up old alerts from history');
  }

  /**
   * Utility methods
   */
  private shouldCreateAlert(event: any): boolean {
    // Logic to determine if an event should create an alert
    return event.type === 'error' || event.type === 'pipeline_failure';
  }

  private determineSeverityFromEvent(event: any): PerformanceAlert['severity'] {
    if (event.type === 'critical_error' || event.type === 'system_failure') {
      return 'critical';
    } else if (event.type === 'error' || event.type === 'pipeline_failure') {
      return 'high';
    } else if (event.type === 'warning' || event.type === 'performance_degradation') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Public API methods
   */

  /**
   * Get current active alerts
   */
  getActiveAlerts(): AlertState[] {
    return this.alertingEngine.getActiveAlerts();
  }

  /**
   * Get alert history for a date range
   */
  getAlertHistory(startDate?: Date, endDate?: Date): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    
    for (const [date, dayAlerts] of this.alertHistory) {
      const alertDate = new Date(date);
      
      if (startDate && alertDate < startDate) continue;
      if (endDate && alertDate > endDate) continue;
      
      alerts.push(...dayAlerts);
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    return this.alertingEngine.acknowledgeAlert(alertId, acknowledgedBy);
  }

  /**
   * Get service statistics
   */
  getStatistics(): any {
    const engineStats = this.alertingEngine.getStatistics();
    const totalHistoryAlerts = Array.from(this.alertHistory.values())
      .reduce((total, alerts) => total + alerts.length, 0);
    
    return {
      ...engineStats,
      isRunning: this.isRunning,
      integrationMode: this.config.integrationMode,
      totalHistoryAlerts,
      historyDays: this.alertHistory.size,
      pollingInterval: this.config.pollingInterval
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AlertingServiceConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    // Restart polling if interval changed
    if (updates.pollingInterval && oldConfig.pollingInterval !== updates.pollingInterval) {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.startPolling();
      }
    }
    
    console.log('⚙️ Alerting service configuration updated');
    this.emit('config_updated', updates);
  }

  /**
   * Test mode methods
   */
  triggerTestAlert(severity: PerformanceAlert['severity'] = 'medium'): void {
    if (!this.config.enableTestMode) {
      console.warn('⚠️ Test mode is disabled');
      return;
    }
    
    const testAlert: PerformanceAlert = {
      id: `test-${Date.now()}`,
      type: 'error',
      severity,
      message: `Test alert - ${severity} severity`,
      timestamp: new Date(),
      data: { testMode: true },
      acknowledged: false
    };
    
    this.handleAlertFired(testAlert);
    console.log('🧪 Test alert triggered');
  }

  simulateSystemAlert(type: 'cpu' | 'memory' | 'disk' | 'network'): void {
    if (!this.config.enableTestMode) {
      console.warn('⚠️ Test mode is disabled');
      return;
    }
    
    const alertMessages = {
      cpu: 'High CPU usage detected - 87%',
      memory: 'Memory usage critical - 92%',
      disk: 'Low disk space - 95% full',
      network: 'High network latency - 850ms'
    };
    
    const testAlert: PerformanceAlert = {
      id: `sim-${type}-${Date.now()}`,
      type: 'resource',
      severity: type === 'memory' ? 'critical' : 'high',
      message: alertMessages[type],
      timestamp: new Date(),
      data: { simulationType: type, testMode: true },
      acknowledged: false
    };
    
    this.handleAlertFired(testAlert);
    console.log(`🧪 Simulated ${type} alert`);
  }

  /**
   * Enable/disable the service
   */
  setEnabled(enabled: boolean): void {
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Get service health
   */
  getHealth(): { status: string; details: any } {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      details: {
        running: this.isRunning,
        connected: !!this.monitoringService,
        activeAlerts: this.getActiveAlerts().length,
        engineEnabled: this.alertingEngine.getStatistics().enabled,
        lastPoll: this.pollingTimer ? 'active' : 'inactive'
      }
    };
  }
}

export default AlertingService;