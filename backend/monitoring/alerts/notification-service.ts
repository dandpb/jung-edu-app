import { EventEmitter } from 'events';
import { Alert, EscalationLevel } from '../types/monitoring';

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'pager' | 'sms';
  config: any;
  enabled: boolean;
}

interface NotificationRequest {
  alert: Alert;
  level: EscalationLevel;
  channels: string[];
}

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
  to: string[];
}

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username: string;
}

interface WebhookConfig {
  url: string;
  headers: Record<string, string>;
  method: 'POST' | 'PUT';
}

interface PagerConfig {
  integrationKey: string;
  severity: string;
}

export class NotificationService extends EventEmitter {
  private channels: Map<string, NotificationChannel>;
  private retryAttempts: number = 3;
  private retryDelay: number = 5000; // 5 seconds

  constructor() {
    super();
    this.channels = new Map();
    this.setupDefaultChannels();
  }

  private setupDefaultChannels(): void {
    // Setup would typically come from configuration
    // This is a placeholder for demonstration
  }

  public addChannel(name: string, channel: NotificationChannel): void {
    this.channels.set(name, channel);
    this.emit('channelAdded', { name, channel });
  }

  public removeChannel(name: string): boolean {
    const removed = this.channels.delete(name);
    if (removed) {
      this.emit('channelRemoved', { name });
    }
    return removed;
  }

  public async sendNotification(request: NotificationRequest): Promise<void> {
    const { alert, level, channels } = request;

    // Send notifications to all requested channels
    const notifications = channels.map(channelName => 
      this.sendToChannel(channelName, alert, level)
    );

    try {
      await Promise.allSettled(notifications);
      this.emit('notificationSent', { alert, channels, level });
    } catch (error) {
      this.emit('notificationError', { alert, channels, level, error });
    }
  }

  private async sendToChannel(channelName: string, alert: Alert, level: EscalationLevel): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel || !channel.enabled) {
      throw new Error(`Channel ${channelName} not found or disabled`);
    }

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmail(alert, level, channel.config as EmailConfig);
            break;
          case 'slack':
            await this.sendSlack(alert, level, channel.config as SlackConfig);
            break;
          case 'webhook':
            await this.sendWebhook(alert, level, channel.config as WebhookConfig);
            break;
          case 'pager':
            await this.sendPager(alert, level, channel.config as PagerConfig);
            break;
          case 'sms':
            await this.sendSMS(alert, level, channel.config);
            break;
          default:
            throw new Error(`Unsupported channel type: ${channel.type}`);
        }
        
        this.emit('channelNotificationSent', { channelName, alert, level });
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        this.emit('channelNotificationError', { channelName, alert, level, error, attempt });
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        } else {
          throw error; // Final attempt failed
        }
      }
    }
  }

  private async sendEmail(alert: Alert, level: EscalationLevel, config: EmailConfig): Promise<void> {
    // Placeholder for email sending implementation
    // In a real implementation, you would use nodemailer or similar
    
    const subject = `[${alert.severity.toUpperCase()}] ${alert.ruleName}`;
    const body = this.formatEmailBody(alert, level);
    
    // Simulate email sending
    console.log(`Sending email to ${config.to.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // Simulate potential failure
    if (Math.random() < 0.1) {
      throw new Error('Email service temporarily unavailable');
    }
  }

  private async sendSlack(alert: Alert, level: EscalationLevel, config: SlackConfig): Promise<void> {
    const payload = {
      username: config.username || 'Alert Bot',
      channel: config.channel,
      attachments: [{
        color: this.getSlackColor(alert.severity),
        title: `${alert.ruleName} - ${alert.severity.toUpperCase()}`,
        text: alert.message,
        fields: [
          {
            title: 'Metric',
            value: alert.metric,
            short: true
          },
          {
            title: 'Value',
            value: alert.value.toString(),
            short: true
          },
          {
            title: 'Threshold',
            value: alert.threshold.toString(),
            short: true
          },
          {
            title: 'Escalation Level',
            value: level.level.toString(),
            short: true
          },
          {
            title: 'Time',
            value: alert.timestamp.toISOString(),
            short: false
          }
        ],
        footer: 'System Monitor',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    // Placeholder for Slack webhook implementation
    console.log(`Sending Slack notification to ${config.channel}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Simulate HTTP request to Slack webhook
    // In a real implementation, use fetch or axios
    if (Math.random() < 0.05) {
      throw new Error('Slack webhook failed');
    }
  }

  private async sendWebhook(alert: Alert, level: EscalationLevel, config: WebhookConfig): Promise<void> {
    const payload = {
      alert: {
        id: alert.id,
        rule: alert.ruleName,
        severity: alert.severity,
        message: alert.message,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: alert.timestamp.toISOString(),
        escalationLevel: level.level
      },
      notification: {
        type: 'alert',
        timestamp: new Date().toISOString()
      }
    };

    // Placeholder for webhook implementation
    console.log(`Sending webhook to ${config.url}`);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Simulate HTTP request failure
    if (Math.random() < 0.08) {
      throw new Error('Webhook endpoint unreachable');
    }
  }

  private async sendPager(alert: Alert, level: EscalationLevel, config: PagerConfig): Promise<void> {
    const payload = {
      routing_key: config.integrationKey,
      event_action: 'trigger',
      payload: {
        summary: `${alert.ruleName}: ${alert.message}`,
        source: alert.metric,
        severity: config.severity || alert.severity,
        timestamp: alert.timestamp.toISOString(),
        component: 'system-monitor',
        group: 'infrastructure',
        class: 'monitoring',
        custom_details: {
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          escalation_level: level.level,
          rule_id: alert.ruleId
        }
      }
    };

    // Placeholder for PagerDuty or similar service
    console.log('Sending pager notification');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    if (Math.random() < 0.03) {
      throw new Error('Pager service unavailable');
    }
  }

  private async sendSMS(alert: Alert, level: EscalationLevel, config: any): Promise<void> {
    const message = `ALERT [${alert.severity.toUpperCase()}]: ${alert.ruleName} - ${alert.message.substring(0, 100)}...`;
    
    // Placeholder for SMS service (Twilio, etc.)
    console.log(`Sending SMS: ${message}`);
    
    if (Math.random() < 0.05) {
      throw new Error('SMS service error');
    }
  }

  private formatEmailBody(alert: Alert, level: EscalationLevel): string {
    return `
Dear Team,

An alert has been triggered in the system monitoring.

Alert Details:
- Rule: ${alert.ruleName}
- Severity: ${alert.severity.toUpperCase()}
- Message: ${alert.message}
- Metric: ${alert.metric}
- Current Value: ${alert.value}
- Threshold: ${alert.threshold}
- Time: ${alert.timestamp.toISOString()}
- Escalation Level: ${level.level}

Please investigate and take appropriate action.

Best regards,
System Monitoring Team
    `.trim();
  }

  private getSlackColor(severity: string): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange  
      high: '#ff4444',     // Red
      critical: '#aa0000'  // Dark Red
    };
    return colors[severity as keyof typeof colors] || '#cccccc';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async testChannel(channelName: string): Promise<boolean> {
    const testAlert: Alert = {
      id: `test-${Date.now()}`,
      ruleId: 'test-rule',
      ruleName: 'Test Alert',
      severity: 'medium',
      message: 'This is a test notification',
      timestamp: new Date(),
      metric: 'test',
      value: 50,
      threshold: 75,
      status: 'active',
      escalationLevel: 1,
      acknowledgedBy: null,
      resolvedAt: null
    };

    const testLevel: EscalationLevel = {
      level: 1,
      delay: 0,
      channels: [channelName],
      severity: 'medium'
    };

    try {
      await this.sendToChannel(channelName, testAlert, testLevel);
      return true;
    } catch (error) {
      this.emit('testChannelError', { channelName, error });
      return false;
    }
  }

  public getChannels(): Array<{ name: string; type: string; enabled: boolean }> {
    return Array.from(this.channels.entries()).map(([name, channel]) => ({
      name,
      type: channel.type,
      enabled: channel.enabled
    }));
  }

  public getChannelStats(): Record<string, { sent: number; failed: number; lastUsed?: Date }> {
    // This would typically track statistics in a real implementation
    // Placeholder for demonstration
    return {};
  }
}