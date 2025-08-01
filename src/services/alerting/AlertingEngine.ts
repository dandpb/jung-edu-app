/**
 * Alerting Engine
 * Core alerting system that evaluates rules, manages notifications, and handles escalations
 */

import { EventEmitter } from 'events';
import { ALERT_RULES, AlertRule, AlertSeverity, AlertCategory } from '../../config/alertingThresholds';
import { NOTIFICATION_CHANNELS, NotificationChannel, NotificationChannelManager } from '../../config/notificationChannels';
import { ESCALATION_POLICIES, EscalationPolicy, EscalationPolicyManager } from '../../config/escalationPolicies';
import { ALL_ALERT_TEMPLATES, AlertTemplate, AlertTemplateManager } from '../../config/alertTemplates';
import { PerformanceAlert } from '../resourcePipeline/monitoring';

// Alert State Management
export interface AlertState {
  id: string;
  ruleId: string;
  status: 'firing' | 'resolved' | 'suppressed';
  severity: AlertSeverity;
  category: AlertCategory;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalationLevel: number;
  lastEscalation?: Date;
  nextEscalation?: Date;
  suppressedUntil?: Date;
  metadata: Record<string, any>;
}

// Alert Evaluation Context
export interface AlertContext {
  ruleId: string;
  currentValue: number | string;
  threshold: number | string;
  timestamp: Date;
  metadata: Record<string, any>;
  tags: string[];
}

// Notification Request
export interface NotificationRequest {
  alertId: string;
  channels: string[];
  templateId?: string;
  variables: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suppressUntil?: Date;
}

// Alert Evaluation Result
export interface AlertEvaluationResult {
  shouldFire: boolean;
  shouldResolve: boolean;
  currentValue: any;
  reason: string;
}

/**
 * Main Alerting Engine Class
 */
export class AlertingEngine extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private alertStates: Map<string, AlertState> = new Map();
  private channelManager: NotificationChannelManager;
  private escalationManager: EscalationPolicyManager;
  private templateManager: AlertTemplateManager;
  private evaluationTimers: Map<string, NodeJS.Timeout> = new Map();
  private enabled: boolean = true;

  constructor() {
    super();
    
    // Initialize managers
    this.channelManager = new NotificationChannelManager(NOTIFICATION_CHANNELS);
    this.escalationManager = new EscalationPolicyManager(ESCALATION_POLICIES);
    this.templateManager = new AlertTemplateManager(ALL_ALERT_TEMPLATES);
    
    // Load alert rules
    this.loadRules(ALERT_RULES);
    
    // Start evaluation loops
    this.startEvaluationLoops();
    
    console.log('🚨 Alerting Engine initialized with', this.rules.size, 'rules');
  }

  /**
   * Load alert rules into the engine
   */
  private loadRules(rules: AlertRule[]): void {
    rules.forEach(rule => {
      if (rule.enabled) {
        this.rules.set(rule.id, rule);
        console.log(`📋 Loaded alert rule: ${rule.name} (${rule.severity})`);
      }
    });
  }

  /**
   * Start evaluation loops for all rules
   */
  private startEvaluationLoops(): void {
    this.rules.forEach(rule => {
      const interval = (rule.evaluationWindow || 5) * 60 * 1000; // Convert minutes to ms
      
      const timer = setInterval(() => {
        if (this.enabled) {
          this.evaluateRule(rule.id);
        }
      }, interval);
      
      this.evaluationTimers.set(rule.id, timer);
    });
  }

  /**
   * Evaluate a specific alert rule
   */
  private async evaluateRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) return;

    try {
      // Get current metrics for evaluation
      const context = await this.buildEvaluationContext(rule);
      
      // Evaluate the rule condition
      const result = this.evaluateCondition(rule, context);
      
      // Handle the evaluation result
      if (result.shouldFire) {
        await this.handleAlertFiring(rule, context, result);
      } else if (result.shouldResolve) {
        await this.handleAlertResolution(rule, context);
      }
      
    } catch (error) {
      console.error(`❌ Failed to evaluate rule ${rule.name}:`, error);
      this.emit('evaluation_error', { ruleId, error });
    }
  }

  /**
   * Build evaluation context for a rule
   */
  private async buildEvaluationContext(rule: AlertRule): Promise<AlertContext> {
    // This would integrate with your metrics collection system
    // For now, using mock data - in production, this would query actual metrics
    
    const mockValue = this.getMockMetricValue(rule);
    
    return {
      ruleId: rule.id,
      currentValue: mockValue,
      threshold: rule.threshold,
      timestamp: new Date(),
      metadata: {
        ruleName: rule.name,
        category: rule.category,
        severity: rule.severity
      },
      tags: rule.tags
    };
  }

  /**
   * Mock metric value generator (replace with actual metrics integration)
   */
  private getMockMetricValue(rule: AlertRule): number {
    // Simulate different metric values based on rule type
    switch (rule.id) {
      case 'sys-cpu-high':
        return Math.random() * 100; // 0-100% CPU usage
      case 'sys-memory-critical':
        return Math.random() * 100; // 0-100% memory usage
      case 'app-pipeline-error-rate':
        return Math.random() * 0.2; // 0-20% error rate
      case 'app-api-response-time':
        return Math.random() * 5000; // 0-5000ms response time
      default:
        return Math.random() * Number(rule.threshold) * 1.5; // Random value around threshold
    }
  }

  /**
   * Evaluate rule condition
   */
  private evaluateCondition(rule: AlertRule, context: AlertContext): AlertEvaluationResult {
    const currentValue = Number(context.currentValue);
    const threshold = Number(rule.threshold);
    
    let shouldFire = false;
    let shouldResolve = false;
    let reason = '';

    // Simple threshold evaluation (extend for complex conditions)
    if (rule.condition.includes('> threshold')) {
      shouldFire = currentValue > threshold;
      shouldResolve = currentValue <= threshold * 0.9; // 10% hysteresis
      reason = shouldFire 
        ? `Value ${currentValue} exceeds threshold ${threshold}`
        : `Value ${currentValue} is within acceptable range`;
    } else if (rule.condition.includes('< threshold')) {
      shouldFire = currentValue < threshold;
      shouldResolve = currentValue >= threshold * 1.1; // 10% hysteresis
      reason = shouldFire 
        ? `Value ${currentValue} below threshold ${threshold}`
        : `Value ${currentValue} is within acceptable range`;
    }

    // Check if alert is in cooldown period
    const alertState = this.alertStates.get(`${rule.id}-current`);
    if (alertState && shouldFire) {
      const cooldownMs = (rule.cooldownPeriod || 30) * 60 * 1000;
      if (Date.now() - alertState.lastSeen.getTime() < cooldownMs) {
        shouldFire = false;
        reason = 'Alert in cooldown period';
      }
    }

    return {
      shouldFire,
      shouldResolve,
      currentValue,
      reason
    };
  }

  /**
   * Handle alert firing
   */
  private async handleAlertFiring(
    rule: AlertRule, 
    context: AlertContext, 
    result: AlertEvaluationResult
  ): Promise<void> {
    const alertId = `${rule.id}-${Date.now()}`;
    const stateId = `${rule.id}-current`;
    
    // Create or update alert state
    let alertState = this.alertStates.get(stateId);
    
    if (!alertState) {
      // New alert
      alertState = {
        id: alertId,
        ruleId: rule.id,
        status: 'firing',
        severity: rule.severity,
        category: rule.category,
        firstSeen: context.timestamp,
        lastSeen: context.timestamp,
        count: 1,
        acknowledged: false,
        escalationLevel: 0,
        metadata: {
          ...context.metadata,
          currentValue: result.currentValue,
          threshold: rule.threshold,
          reason: result.reason
        }
      };
      
      console.log(`🚨 NEW ALERT: ${rule.name} - ${result.reason}`);
    } else {
      // Update existing alert
      alertState.lastSeen = context.timestamp;
      alertState.count++;
      alertState.metadata.currentValue = result.currentValue;
      alertState.metadata.reason = result.reason;
      
      console.log(`🔄 ALERT UPDATE: ${rule.name} - Count: ${alertState.count}`);
    }
    
    this.alertStates.set(stateId, alertState);
    
    // Create PerformanceAlert for compatibility with monitoring system
    const performanceAlert: PerformanceAlert = {
      id: alertState.id,
      type: this.mapCategoryToType(rule.category),
      severity: rule.severity,
      message: `${rule.name}: ${result.reason}`,
      timestamp: context.timestamp,
      moduleId: context.metadata.moduleId,
      resourceId: context.metadata.resourceId,
      data: alertState.metadata,
      acknowledged: alertState.acknowledged
    };
    
    // Send notifications
    await this.sendNotifications(alertState, rule, performanceAlert);
    
    // Handle escalation
    await this.handleEscalation(alertState, rule, performanceAlert);
    
    // Emit event
    this.emit('alert_fired', performanceAlert);
  }

  /**
   * Handle alert resolution
   */
  private async handleAlertResolution(rule: AlertRule, context: AlertContext): Promise<void> {
    const stateId = `${rule.id}-current`;
    const alertState = this.alertStates.get(stateId);
    
    if (alertState && alertState.status === 'firing') {
      alertState.status = 'resolved';
      alertState.lastSeen = context.timestamp;
      
      console.log(`✅ ALERT RESOLVED: ${rule.name}`);
      
      // Create resolution alert
      const resolutionAlert: PerformanceAlert = {
        id: `${alertState.id}-resolved`,
        type: this.mapCategoryToType(rule.category),
        severity: 'low',
        message: `RESOLVED: ${rule.name}`,
        timestamp: context.timestamp,
        data: alertState.metadata,
        acknowledged: true
      };
      
      // Send resolution notification
      await this.sendResolutionNotification(alertState, rule, resolutionAlert);
      
      // Clean up resolved alert after some time
      setTimeout(() => {
        this.alertStates.delete(stateId);
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      // Emit event
      this.emit('alert_resolved', resolutionAlert);
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(
    alertState: AlertState, 
    rule: AlertRule, 
    alert: PerformanceAlert
  ): Promise<void> {
    // Get appropriate channels for this alert
    const channels = this.channelManager.getChannelsForAlert(
      rule.severity, 
      rule.category
    );
    
    // Prepare notification variables
    const variables = {
      alertName: rule.name,
      severity: rule.severity,
      category: rule.category,
      description: rule.description,
      currentValue: alertState.metadata.currentValue,
      threshold: rule.threshold,
      timestamp: alertState.lastSeen.toISOString(),
      dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000/monitoring',
      runbook: rule.runbook || '/runbooks/default'
    };
    
    // Send to each channel
    for (const channel of channels) {
      try {
        await this.sendToChannel(channel, alert, variables);
        console.log(`📧 Notification sent via ${channel.type} for alert: ${rule.name}`);
      } catch (error) {
        console.error(`❌ Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel, 
    alert: PerformanceAlert, 
    variables: Record<string, any>
  ): Promise<void> {
    // Apply rate limiting
    if (await this.isRateLimited(channel)) {
      console.warn(`⏱️ Rate limit exceeded for channel ${channel.id}`);
      return;
    }
    
    // Render message using template
    const template = channel.template;
    let subject = '';
    let body = '';
    
    if (template) {
      subject = this.renderTemplate(template.subject, variables);
      body = this.renderTemplate(template.body, variables);
    } else {
      subject = `[${alert.severity.toUpperCase()}] ${variables.alertName}`;
      body = `Alert: ${variables.alertName}\nSeverity: ${alert.severity}\nDetails: ${variables.description}`;
    }
    
    // Send based on channel type
    switch (channel.type) {
      case 'email':
        await this.sendEmail(channel, subject, body, variables);
        break;
      case 'webhook':
        await this.sendWebhook(channel, alert, variables);
        break;
      case 'slack':
        await this.sendSlack(channel, subject, body, variables);
        break;
      case 'in-app':
        await this.sendInApp(channel, alert, variables);
        break;
      case 'sms':
        await this.sendSMS(channel, body, variables);
        break;
      default:
        console.warn(`⚠️ Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(
    alertState: AlertState,
    rule: AlertRule,
    resolutionAlert: PerformanceAlert
  ): Promise<void> {
    const channels = this.channelManager.getChannelsForAlert(rule.severity, rule.category);
    
    const variables = {
      alertName: rule.name,
      severity: 'resolved',
      resolvedAt: resolutionAlert.timestamp.toISOString(),
      duration: this.formatDuration(
        resolutionAlert.timestamp.getTime() - alertState.firstSeen.getTime()
      )
    };
    
    for (const channel of channels) {
      try {
        const subject = `[RESOLVED] ${rule.name}`;
        const body = `Alert "${rule.name}" has been resolved after ${variables.duration}`;
        
        await this.sendToChannel(channel, resolutionAlert, { ...variables, subject, body });
      } catch (error) {
        console.error(`❌ Failed to send resolution notification:`, error);
      }
    }
  }

  /**
   * Handle alert escalation
   */
  private async handleEscalation(
    alertState: AlertState,
    rule: AlertRule,
    alert: PerformanceAlert
  ): Promise<void> {
    const policies = this.escalationManager.getPoliciesForAlert(
      rule.severity,
      rule.category,
      rule.tags
    );
    
    if (policies.length === 0) return;
    
    const policy = policies[0]; // Use first matching policy
    
    // Check if we should escalate
    const shouldEscalate = this.shouldEscalate(alertState, policy);
    
    if (shouldEscalate && alertState.escalationLevel < policy.levels.length) {
      const level = policy.levels[alertState.escalationLevel];
      
      console.log(`📈 ESCALATING: ${rule.name} to level ${level.level}`);
      
      // Update alert state
      alertState.escalationLevel++;
      alertState.lastEscalation = new Date();
      alertState.nextEscalation = new Date(
        Date.now() + (level.delayMinutes * 60 * 1000)
      );
      
      // Send escalation notifications
      await this.sendEscalationNotification(alertState, rule, level, alert);
      
      this.emit('alert_escalated', {
        alert,
        level: alertState.escalationLevel,
        policy: policy.id
      });
    }
  }

  /**
   * Check if alert should be escalated
   */
  private shouldEscalate(alertState: AlertState, policy: EscalationPolicy): boolean {
    if (alertState.acknowledged) return false;
    if (alertState.escalationLevel >= policy.levels.length) return false;
    
    const level = policy.levels[alertState.escalationLevel];
    const timeSinceLastEscalation = alertState.lastEscalation 
      ? Date.now() - alertState.lastEscalation.getTime()
      : Date.now() - alertState.firstSeen.getTime();
    
    return timeSinceLastEscalation >= (level.delayMinutes * 60 * 1000);
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(
    alertState: AlertState,
    rule: AlertRule,
    level: any,
    alert: PerformanceAlert
  ): Promise<void> {
    // Implementation for escalation notifications
    console.log(`📢 Sending escalation notification for ${rule.name} to level ${level.level}`);
    
    // This would send to specific escalation channels and recipients
    // Implementation depends on your escalation policy structure
  }

  /**
   * Helper methods for different notification channels
   */
  private async sendEmail(channel: NotificationChannel, subject: string, body: string, variables: Record<string, any>): Promise<void> {
    console.log(`📧 EMAIL: ${subject}`);
    // Implementation for email sending
  }

  private async sendWebhook(channel: NotificationChannel, alert: PerformanceAlert, variables: Record<string, any>): Promise<void> {
    console.log(`🔗 WEBHOOK: ${channel.config.url}`);
    // Implementation for webhook sending
  }

  private async sendSlack(channel: NotificationChannel, subject: string, body: string, variables: Record<string, any>): Promise<void> {
    console.log(`💬 SLACK: ${subject}`);
    // Implementation for Slack notifications
  }

  private async sendInApp(channel: NotificationChannel, alert: PerformanceAlert, variables: Record<string, any>): Promise<void> {
    console.log(`📱 IN-APP: ${alert.message}`);
    // Implementation for in-app notifications
    this.emit('in_app_notification', alert);
  }

  private async sendSMS(channel: NotificationChannel, message: string, variables: Record<string, any>): Promise<void> {
    console.log(`📱 SMS: ${message}`);
    // Implementation for SMS sending
  }

  /**
   * Utility methods
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
  }

  private async isRateLimited(channel: NotificationChannel): Promise<boolean> {
    // Implementation for rate limiting check
    return false;
  }

  private mapCategoryToType(category: AlertCategory): PerformanceAlert['type'] {
    switch (category) {
      case 'system': return 'resource';
      case 'application': return 'performance';
      case 'security': return 'error';
      case 'business': return 'quality';
      case 'infrastructure': return 'health';
      default: return 'error';
    }
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Public API methods
   */

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    for (const [stateId, alertState] of this.alertStates) {
      if (alertState.id === alertId) {
        alertState.acknowledged = true;
        alertState.acknowledgedBy = acknowledgedBy;
        alertState.acknowledgedAt = new Date();
        
        console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
        this.emit('alert_acknowledged', alertState);
        return true;
      }
    }
    return false;
  }

  /**
   * Get current active alerts
   */
  getActiveAlerts(): AlertState[] {
    return Array.from(this.alertStates.values()).filter(
      state => state.status === 'firing'
    );
  }

  /**
   * Get alert by ID
   */
  getAlertState(alertId: string): AlertState | undefined {
    for (const alertState of this.alertStates.values()) {
      if (alertState.id === alertId) {
        return alertState;
      }
    }
    return undefined;
  }

  /**
   * Enable/disable the alerting engine
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🚨 Alerting engine ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Stop the alerting engine
   */
  stop(): void {
    this.enabled = false;
    
    // Clear all timers
    this.evaluationTimers.forEach(timer => clearInterval(timer));
    this.evaluationTimers.clear();
    
    console.log('🛑 Alerting engine stopped');
    this.emit('engine_stopped');
  }

  /**
   * Get engine statistics
   */
  getStatistics(): any {
    return {
      rulesCount: this.rules.size,
      activeAlerts: this.getActiveAlerts().length,
      totalAlerts: this.alertStates.size,
      enabled: this.enabled,
      uptime: process.uptime()
    };
  }
}

export default AlertingEngine;