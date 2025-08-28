import { EventEmitter } from 'events';
import { HealthCheckResult, AnomalyResult, Alert, AlertConfig, EscalationPolicy } from '../types/monitoring';
import { StorageManager } from '../storage/memory-store';
import { NotificationService } from './notification-service';

interface AlertRule {
  id: string;
  name: string;
  conditions: AlertCondition[];
  escalationPolicy: EscalationPolicy;
  enabled: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
}

interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration: number; // consecutive occurrences
}

export class AlertManager extends EventEmitter {
  private storageManager: StorageManager;
  private notificationService: NotificationService;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private conditionCounters: Map<string, number>;
  private isRunning: boolean = false;

  constructor(
    storageManager: StorageManager,
    notificationService: NotificationService,
    config: AlertConfig
  ) {
    super();
    this.storageManager = storageManager;
    this.notificationService = notificationService;
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.conditionCounters = new Map();
    
    this.initializeDefaultAlertRules(config);
  }

  private initializeDefaultAlertRules(config: AlertConfig): void {
    // High CPU Usage Alert
    this.addAlertRule({
      id: 'high-cpu',
      name: 'High CPU Usage',
      conditions: [{
        metric: 'cpu',
        operator: 'gte',
        value: config.thresholds?.cpu?.critical || 90,
        duration: 3
      }],
      escalationPolicy: {
        levels: [
          { level: 1, delay: 0, channels: ['email'], severity: 'warning' },
          { level: 2, delay: 5, channels: ['email', 'slack'], severity: 'critical' },
          { level: 3, delay: 15, channels: ['email', 'slack', 'pager'], severity: 'critical' }
        ]
      },
      enabled: true,
      cooldownPeriod: 10
    });

    // High Memory Usage Alert
    this.addAlertRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      conditions: [{
        metric: 'memory',
        operator: 'gte',
        value: config.thresholds?.memory?.critical || 85,
        duration: 2
      }],
      escalationPolicy: {
        levels: [
          { level: 1, delay: 0, channels: ['email'], severity: 'warning' },
          { level: 2, delay: 10, channels: ['email', 'slack'], severity: 'critical' }
        ]
      },
      enabled: true,
      cooldownPeriod: 15
    });

    // Disk Space Critical Alert
    this.addAlertRule({
      id: 'disk-critical',
      name: 'Critical Disk Space',
      conditions: [{
        metric: 'disk',
        operator: 'gte',
        value: config.thresholds?.disk?.critical || 95,
        duration: 1
      }],
      escalationPolicy: {
        levels: [
          { level: 1, delay: 0, channels: ['email', 'slack'], severity: 'critical' },
          { level: 2, delay: 5, channels: ['email', 'slack', 'pager'], severity: 'critical' }
        ]
      },
      enabled: true,
      cooldownPeriod: 5
    });

    // Network Latency Alert
    this.addAlertRule({
      id: 'high-latency',
      name: 'High Network Latency',
      conditions: [{
        metric: 'network',
        operator: 'gte',
        value: config.thresholds?.network?.critical || 1000,
        duration: 5
      }],
      escalationPolicy: {
        levels: [
          { level: 1, delay: 0, channels: ['email'], severity: 'warning' },
          { level: 2, delay: 10, channels: ['email', 'slack'], severity: 'high' }
        ]
      },
      enabled: true,
      cooldownPeriod: 20
    });

    // Anomaly Detection Alert
    this.addAlertRule({
      id: 'anomaly-detected',
      name: 'Anomaly Detected',
      conditions: [{
        metric: 'anomaly_score',
        operator: 'gte',
        value: 3.0,
        duration: 1
      }],
      escalationPolicy: {
        levels: [
          { level: 1, delay: 0, channels: ['email'], severity: 'medium' },
          { level: 2, delay: 5, channels: ['email', 'slack'], severity: 'high' }
        ]
      },
      enabled: true,
      cooldownPeriod: 30
    });
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }

  public removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.emit('ruleRemoved', { ruleId });
    }
    return removed;
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    Object.assign(rule, updates);
    this.emit('ruleUpdated', rule);
  }

  public async processHealthResults(results: HealthCheckResult[]): Promise<void> {
    for (const result of results) {
      await this.evaluateHealthResult(result);
    }
  }

  public async processAnomalyResults(anomalies: AnomalyResult[]): Promise<void> {
    for (const anomaly of anomalies) {
      await this.evaluateAnomaly(anomaly);
    }
  }

  private async evaluateHealthResult(result: HealthCheckResult): Promise<void> {
    const value = result.value;
    const metric = result.service;

    // Check all rules that apply to this metric
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const applicableConditions = rule.conditions.filter(c => c.metric === metric || c.metric === 'any');
      
      for (const condition of applicableConditions) {
        if (this.evaluateCondition(condition, value)) {
          await this.handleConditionMet(rule, condition, result);
        } else {
          this.resetConditionCounter(rule.id, condition);
        }
      }
    }
  }

  private async evaluateAnomaly(anomaly: AnomalyResult): Promise<void> {
    // Create a synthetic health result from anomaly for rule evaluation
    const syntheticResult: HealthCheckResult = {
      service: anomaly.metric,
      status: anomaly.severity === 'critical' ? 'critical' : 'warning',
      value: anomaly.anomalyScore,
      threshold: { warning: 2, critical: 3 },
      timestamp: anomaly.timestamp,
      message: anomaly.description
    };

    // Special handling for anomaly score
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const anomalyConditions = rule.conditions.filter(c => c.metric === 'anomaly_score');
      
      for (const condition of anomalyConditions) {
        if (this.evaluateCondition(condition, anomaly.anomalyScore)) {
          await this.handleConditionMet(rule, condition, syntheticResult, anomaly);
        } else {
          this.resetConditionCounter(rule.id, condition);
        }
      }
    }
  }

  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.value;
      case 'gte': return value >= condition.value;
      case 'lt': return value < condition.value;
      case 'lte': return value <= condition.value;
      case 'eq': return value === condition.value;
      default: return false;
    }
  }

  private async handleConditionMet(
    rule: AlertRule, 
    condition: AlertCondition, 
    result: HealthCheckResult,
    anomaly?: AnomalyResult
  ): Promise<void> {
    const counterId = `${rule.id}-${condition.metric}`;
    const currentCount = (this.conditionCounters.get(counterId) || 0) + 1;
    this.conditionCounters.set(counterId, currentCount);

    // Check if condition has been met for required duration
    if (currentCount >= condition.duration) {
      await this.triggerAlert(rule, condition, result, anomaly);
      this.conditionCounters.set(counterId, 0); // Reset counter after triggering
    }
  }

  private resetConditionCounter(ruleId: string, condition: AlertCondition): void {
    const counterId = `${ruleId}-${condition.metric}`;
    this.conditionCounters.set(counterId, 0);
  }

  private async triggerAlert(
    rule: AlertRule, 
    condition: AlertCondition, 
    result: HealthCheckResult,
    anomaly?: AnomalyResult
  ): Promise<void> {
    // Check cooldown period
    if (rule.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      const cooldownMs = rule.cooldownPeriod * 60 * 1000;
      
      if (timeSinceLastTrigger < cooldownMs) {
        return; // Still in cooldown period
      }
    }

    const alertId = `${rule.id}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: this.determineSeverity(result, anomaly),
      message: this.generateAlertMessage(rule, condition, result, anomaly),
      timestamp: new Date(),
      metric: condition.metric,
      value: result.value,
      threshold: condition.value,
      status: 'active',
      escalationLevel: 1,
      acknowledgedBy: null,
      resolvedAt: null
    };

    // Store alert
    this.activeAlerts.set(alertId, alert);
    await this.storageManager.storeAlert(alert);

    // Update rule last triggered
    rule.lastTriggered = new Date();

    // Start escalation process
    await this.startEscalation(alert, rule.escalationPolicy);

    this.emit('alertTriggered', alert);
  }

  private determineSeverity(result: HealthCheckResult, anomaly?: AnomalyResult): 'low' | 'medium' | 'high' | 'critical' {
    if (anomaly) {
      return anomaly.severity;
    }

    switch (result.status) {
      case 'critical': return 'critical';
      case 'warning': return 'medium';
      default: return 'low';
    }
  }

  private generateAlertMessage(
    rule: AlertRule, 
    condition: AlertCondition, 
    result: HealthCheckResult,
    anomaly?: AnomalyResult
  ): string {
    if (anomaly) {
      return `Anomaly detected: ${anomaly.description}`;
    }

    const operatorText = {
      'gt': '>',
      'gte': '≥',
      'lt': '<',
      'lte': '≤',
      'eq': '='
    };

    return `${rule.name}: ${condition.metric} (${result.value}) ${operatorText[condition.operator]} ${condition.value}. ${result.message}`;
  }

  private async startEscalation(alert: Alert, policy: EscalationPolicy): Promise<void> {
    for (const level of policy.levels) {
      setTimeout(async () => {
        const currentAlert = this.activeAlerts.get(alert.id);
        if (!currentAlert || currentAlert.status !== 'active') {
          return; // Alert has been resolved or acknowledged
        }

        // Update escalation level
        currentAlert.escalationLevel = level.level;
        
        // Send notifications
        await this.notificationService.sendNotification({
          alert: currentAlert,
          level: level,
          channels: level.channels
        });

        this.emit('alertEscalated', { alert: currentAlert, level: level.level });
      }, level.delay * 60 * 1000); // Convert minutes to milliseconds
    }
  }

  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await this.storageManager.updateAlert(alert);
    this.emit('alertAcknowledged', alert);
  }

  public async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolution = resolution;

    await this.storageManager.updateAlert(alert);
    this.activeAlerts.delete(alertId);
    
    this.emit('alertResolved', alert);
  }

  public async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values());
  }

  public async getAlertHistory(timeRange: { start: Date; end: Date }): Promise<Alert[]> {
    return await this.storageManager.getAlertHistory(timeRange);
  }

  public async getAlertStats(): Promise<{
    active: number;
    acknowledged: number;
    resolved: number;
    byService: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const activeAlerts = Array.from(this.activeAlerts.values());
    const acknowledgedAlerts = activeAlerts.filter(a => a.status === 'acknowledged');
    
    const byService: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    activeAlerts.forEach(alert => {
      byService[alert.metric] = (byService[alert.metric] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      active: activeAlerts.length,
      acknowledged: acknowledgedAlerts.length,
      resolved: 0, // Would need to query storage for full history
      byService,
      bySeverity
    };
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  public async testAlertRule(ruleId: string, testData: any): Promise<boolean> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    // Simulate rule evaluation with test data
    for (const condition of rule.conditions) {
      const value = testData[condition.metric];
      if (value !== undefined && this.evaluateCondition(condition, value)) {
        return true;
      }
    }

    return false;
  }

  public start(): void {
    this.isRunning = true;
    this.emit('started');
  }

  public stop(): void {
    this.isRunning = false;
    this.emit('stopped');
  }
}