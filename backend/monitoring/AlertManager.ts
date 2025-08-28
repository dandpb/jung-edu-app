import { EventEmitter } from 'events';
import { Alert, AlertRule, MonitoringConfig, Metric } from './types';

interface AlertChannel {
  name: string;
  type: 'webhook' | 'email' | 'slack' | 'console';
  config: any;
  enabled: boolean;
}

interface AlertState {
  rule: AlertRule;
  currentValue: number;
  status: 'normal' | 'firing' | 'resolved';
  lastFired?: Date;
  lastResolved?: Date;
  fireCount: number;
  suppressedUntil?: Date;
}

export class AlertManager extends EventEmitter {
  private config: MonitoringConfig['alerts'];
  private rules: Map<string, AlertRule> = new Map();
  private states: Map<string, AlertState> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private maxHistorySize: number = 1000;

  constructor(config: MonitoringConfig['alerts']) {
    super();
    this.config = config;
    this.setupDefaultChannels();
    this.setupDefaultRules();
    this.startAlertEvaluation();
  }

  private setupDefaultChannels(): void {
    // Console channel (always available)
    this.channels.set('console', {
      name: 'console',
      type: 'console',
      config: {},
      enabled: true,
    });

    // Webhook channel
    if (this.config.webhook) {
      this.channels.set('webhook', {
        name: 'webhook',
        type: 'webhook',
        config: { url: this.config.webhook },
        enabled: true,
      });
    }

    // Email channel
    if (this.config.email) {
      this.channels.set('email', {
        name: 'email',
        type: 'email',
        config: this.config.email,
        enabled: true,
      });
    }

    // Slack channel
    if (this.config.slack) {
      this.channels.set('slack', {
        name: 'slack',
        type: 'slack',
        config: this.config.slack,
        enabled: true,
      });
    }
  }

  private setupDefaultRules(): void {
    // High error rate alert
    this.addRule({
      name: 'high_error_rate',
      query: 'error_rate',
      condition: '>',
      threshold: 0.05, // 5% error rate
      duration: '5m',
      severity: 'high',
      annotations: {
        summary: 'High error rate detected',
        description: 'Error rate is above 5% for more than 5 minutes',
        runbook: 'Check application logs and recent deployments',
      },
      labels: {
        team: 'platform',
        service: 'jaquedu',
        priority: 'urgent',
      },
    });

    // High memory usage alert
    this.addRule({
      name: 'high_memory_usage',
      query: 'memory_usage',
      condition: '>',
      threshold: 0.85, // 85% memory usage
      duration: '3m',
      severity: 'medium',
      annotations: {
        summary: 'High memory usage detected',
        description: 'Memory usage is above 85% for more than 3 minutes',
        runbook: 'Check for memory leaks and consider scaling',
      },
      labels: {
        team: 'platform',
        service: 'jaquedu',
        priority: 'medium',
      },
    });

    // Slow response time alert
    this.addRule({
      name: 'slow_response_time',
      query: 'response_time_p95',
      condition: '>',
      threshold: 2000, // 2 seconds
      duration: '5m',
      severity: 'medium',
      annotations: {
        summary: 'Slow response times detected',
        description: '95th percentile response time is above 2 seconds',
        runbook: 'Check database performance and server resources',
      },
      labels: {
        team: 'platform',
        service: 'jaquedu',
        priority: 'medium',
      },
    });

    // Low cache hit rate alert
    this.addRule({
      name: 'low_cache_hit_rate',
      query: 'cache_hit_rate',
      condition: '<',
      threshold: 0.8, // 80% cache hit rate
      duration: '10m',
      severity: 'low',
      annotations: {
        summary: 'Low cache hit rate detected',
        description: 'Cache hit rate is below 80% for more than 10 minutes',
        runbook: 'Review cache configuration and key patterns',
      },
      labels: {
        team: 'platform',
        service: 'jaquedu',
        priority: 'low',
      },
    });

    // Failed workflow alert
    this.addRule({
      name: 'failed_workflows',
      query: 'workflow_failures',
      condition: '>',
      threshold: 5, // More than 5 failures
      duration: '1m',
      severity: 'critical',
      annotations: {
        summary: 'Multiple workflow failures detected',
        description: 'More than 5 workflow failures in the last minute',
        runbook: 'Check workflow engine logs and dependencies',
      },
      labels: {
        team: 'platform',
        service: 'jaquedu',
        priority: 'critical',
      },
    });
  }

  // Add alert rule
  addRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
    this.states.set(rule.name, {
      rule,
      currentValue: 0,
      status: 'normal',
      fireCount: 0,
    });

    this.emit('rule_added', rule);
  }

  // Remove alert rule
  removeRule(name: string): boolean {
    const removed = this.rules.delete(name);
    if (removed) {
      this.states.delete(name);
      this.emit('rule_removed', { name });
    }
    return removed;
  }

  // Add alert channel
  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.name, channel);
    this.emit('channel_added', channel);
  }

  // Remove alert channel
  removeChannel(name: string): boolean {
    const removed = this.channels.delete(name);
    if (removed) {
      this.emit('channel_removed', { name });
    }
    return removed;
  }

  // Evaluate metric against rules
  evaluateMetric(metricName: string, value: number, labels: Record<string, string> = {}): void {
    for (const [ruleName, rule] of this.rules) {
      if (rule.query === metricName) {
        this.evaluateRule(rule, value, labels);
      }
    }
  }

  // Evaluate specific rule
  private evaluateRule(rule: AlertRule, value: number, labels: Record<string, string>): void {
    const state = this.states.get(rule.name);
    if (!state) return;

    state.currentValue = value;

    // Check if condition is met
    const conditionMet = this.checkCondition(value, rule.condition, rule.threshold);

    if (conditionMet && state.status === 'normal') {
      // Condition met, start firing
      state.status = 'firing';
      state.lastFired = new Date();
      state.fireCount++;

      const alert = this.createAlert(rule, value, labels);
      this.fireAlert(alert);
      
    } else if (!conditionMet && state.status === 'firing') {
      // Condition no longer met, resolve
      state.status = 'resolved';
      state.lastResolved = new Date();

      const alert = this.activeAlerts.get(rule.name);
      if (alert) {
        this.resolveAlert(alert);
      }
    }

    this.emit('rule_evaluated', {
      rule: rule.name,
      value,
      conditionMet,
      status: state.status,
    });
  }

  // Check condition
  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  // Create alert
  private createAlert(rule: AlertRule, value: number, labels: Record<string, string>): Alert {
    const alert: Alert = {
      id: `${rule.name}_${Date.now()}`,
      name: rule.name,
      severity: rule.severity,
      status: 'firing',
      message: rule.annotations.summary || `Alert: ${rule.name}`,
      labels: { ...rule.labels, ...labels },
      annotations: {
        ...rule.annotations,
        current_value: value.toString(),
        threshold: rule.threshold.toString(),
      },
      startsAt: new Date(),
    };

    return alert;
  }

  // Fire alert
  private fireAlert(alert: Alert): void {
    this.activeAlerts.set(alert.name, alert);
    this.alertHistory.push(alert);

    // Maintain history size
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    this.emit('alert_fired', alert);
    this.sendAlert(alert);
  }

  // Resolve alert
  private resolveAlert(alert: Alert): void {
    alert.status = 'resolved';
    alert.endsAt = new Date();

    this.activeAlerts.delete(alert.name);
    this.emit('alert_resolved', alert);
    this.sendAlert(alert);
  }

  // Send alert to channels
  private async sendAlert(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values())
      .filter(channel => channel.enabled);

    for (const channel of enabledChannels) {
      try {
        await this.sendToChannel(channel, alert);
        this.emit('alert_sent', { alert, channel: channel.name });
      } catch (error) {
        this.emit('alert_send_error', { alert, channel: channel.name, error });
      }
    }
  }

  // Send alert to specific channel
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'console':
        console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
        console.log(`   Status: ${alert.status}`);
        console.log(`   Labels: ${JSON.stringify(alert.labels)}`);
        console.log(`   Time: ${alert.startsAt.toISOString()}`);
        break;

      case 'webhook':
        await this.sendWebhookAlert(channel.config.url, alert);
        break;

      case 'email':
        await this.sendEmailAlert(channel.config, alert);
        break;

      case 'slack':
        await this.sendSlackAlert(channel.config, alert);
        break;

      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }

  // Send webhook alert
  private async sendWebhookAlert(url: string, alert: Alert): Promise<void> {
    const payload = {
      version: '4',
      groupKey: alert.name,
      status: alert.status,
      receiver: 'webhook',
      groupLabels: alert.labels,
      commonLabels: alert.labels,
      commonAnnotations: alert.annotations,
      externalURL: '',
      alerts: [alert],
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  // Send email alert
  private async sendEmailAlert(config: any, alert: Alert): Promise<void> {
    // This would integrate with nodemailer or similar email service
    console.log(`Email alert would be sent to: ${config.to.join(', ')}`);
    console.log(`Subject: [${alert.severity.toUpperCase()}] ${alert.message}`);
    console.log(`Body: ${alert.annotations.description || alert.message}`);
  }

  // Send Slack alert
  private async sendSlackAlert(config: any, alert: Alert): Promise<void> {
    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#ff0000',
    }[alert.severity] || '#36a64f';

    const payload = {
      channel: config.channel,
      username: 'AlertManager',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: `${alert.status.toUpperCase()}: ${alert.message}`,
        text: alert.annotations.description || alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Status',
            value: alert.status,
            short: true,
          },
          {
            title: 'Time',
            value: alert.startsAt.toISOString(),
            short: false,
          },
        ],
        footer: 'jaqEdu AlertManager',
        ts: Math.floor(alert.startsAt.getTime() / 1000),
      }],
    };

    await fetch(config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  // Start alert evaluation loop
  private startAlertEvaluation(): void {
    if (!this.config.enabled) {
      return;
    }

    this.checkInterval = setInterval(() => {
      this.emit('evaluation_cycle_started');
      // This would typically pull metrics from the metrics collector
      // For now, we'll emit an event that other services can listen to
      this.emit('metrics_needed');
    }, 30000); // Evaluate every 30 seconds

    this.emit('alert_evaluation_started');
  }

  // Stop alert evaluation
  stopAlertEvaluation(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.emit('alert_evaluation_stopped');
    }
  }

  // Suppress alert
  suppressAlert(ruleName: string, duration: number): void {
    const state = this.states.get(ruleName);
    if (state) {
      state.suppressedUntil = new Date(Date.now() + duration);
      this.emit('alert_suppressed', { ruleName, until: state.suppressedUntil });
    }
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  // Get alert history
  getAlertHistory(limit?: number): Alert[] {
    return limit ? this.alertHistory.slice(-limit) : this.alertHistory;
  }

  // Get alert states
  getAlertStates(): Record<string, AlertState> {
    const states: Record<string, AlertState> = {};
    for (const [name, state] of this.states) {
      states[name] = state;
    }
    return states;
  }

  // Get alert statistics
  getAlertStats(): {
    totalRules: number;
    activeAlerts: number;
    totalFired: number;
    totalResolved: number;
    averageResolutionTime: number;
  } {
    const totalResolved = this.alertHistory.filter(alert => 
      alert.status === 'resolved' && alert.endsAt
    );

    const resolutionTimes = totalResolved.map(alert => 
      (alert.endsAt!.getTime() - alert.startsAt.getTime()) / 1000
    );

    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
      : 0;

    return {
      totalRules: this.rules.size,
      activeAlerts: this.activeAlerts.size,
      totalFired: this.alertHistory.length,
      totalResolved: totalResolved.length,
      averageResolutionTime,
    };
  }

  // Health check for alert manager
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const stats = this.getAlertStats();
      return {
        status: 'healthy',
        message: `AlertManager operational. Rules: ${stats.totalRules}, Active: ${stats.activeAlerts}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `AlertManager error: ${error}`,
      };
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAlertEvaluation();
    this.rules.clear();
    this.states.clear();
    this.channels.clear();
    this.activeAlerts.clear();
    this.removeAllListeners();
  }
}