/**
 * Notification Channels Configuration
 * Defines various notification methods for alerting system
 */

// Notification Channel Types
export type NotificationChannelType = 
  | 'email'
  | 'webhook' 
  | 'in-app'
  | 'sms'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'pagerduty';

// Base Notification Channel Interface
export interface NotificationChannel {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  config: Record<string, any>;
  retryPolicy: RetryPolicy;
  rateLimit?: RateLimit;
  template?: NotificationTemplate;
  filters?: NotificationFilter[];
}

// Retry Policy for failed notifications
export interface RetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

// Rate Limiting for notifications
export interface RateLimit {
  maxNotifications: number;
  windowMs: number;
  burst?: number;
}

// Notification Templates
export interface NotificationTemplate {
  subject: string;
  body: string;
  format: 'text' | 'html' | 'markdown';
  variables: string[];
}

// Notification Filters
export interface NotificationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

// Default Retry Policy
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
};

// Email Notification Channel
export const EMAIL_CHANNEL: NotificationChannel = {
  id: 'email-primary',
  name: 'Primary Email Notifications',
  type: 'email',
  enabled: true,
  config: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.ALERT_FROM_EMAIL || 'alerts@jaquedu.com',
    to: process.env.ALERT_TO_EMAIL?.split(',') || ['admin@jaquedu.com']
  },
  retryPolicy: DEFAULT_RETRY_POLICY,
  rateLimit: {
    maxNotifications: 50,
    windowMs: 3600000, // 1 hour
    burst: 10
  },
  template: {
    subject: '[{{severity}}] {{alertName}} - jaqEdu System',
    body: `
Alert: {{alertName}}
Severity: {{severity}}
Category: {{category}}
Description: {{description}}

Details:
- Timestamp: {{timestamp}}
- Threshold: {{threshold}}
- Current Value: {{currentValue}}
- Module ID: {{moduleId}}

{{#if runbook}}
Runbook: {{runbook}}
{{/if}}

Dashboard: {{dashboardUrl}}

This is an automated alert from the jaqEdu monitoring system.
    `.trim(),
    format: 'text',
    variables: ['severity', 'alertName', 'category', 'description', 'timestamp', 'threshold', 'currentValue', 'moduleId', 'runbook', 'dashboardUrl']
  }
};

// Webhook Notification Channel
export const WEBHOOK_CHANNEL: NotificationChannel = {
  id: 'webhook-primary',
  name: 'Primary Webhook Notifications',
  type: 'webhook',
  enabled: true,
  config: {
    url: process.env.WEBHOOK_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WEBHOOK_TOKEN}`,
      'X-Source': 'jaqedu-monitoring'
    },
    timeout: 10000,
    validateSSL: true
  },
  retryPolicy: {
    maxRetries: 5,
    retryDelayMs: 2000,
    backoffMultiplier: 1.5,
    maxDelayMs: 60000
  },
  rateLimit: {
    maxNotifications: 100,
    windowMs: 3600000, // 1 hour
    burst: 20
  }
};

// In-App Notification Channel
export const IN_APP_CHANNEL: NotificationChannel = {
  id: 'in-app',
  name: 'In-Application Notifications',
  type: 'in-app',
  enabled: true,
  config: {
    storage: 'redis', // or 'memory', 'database'
    ttl: 86400000, // 24 hours
    maxNotifications: 1000,
    realtime: true,
    websocketEnabled: true
  },
  retryPolicy: {
    maxRetries: 1,
    retryDelayMs: 500,
    backoffMultiplier: 1,
    maxDelayMs: 1000
  },
  rateLimit: {
    maxNotifications: 500,
    windowMs: 3600000, // 1 hour
    burst: 50
  }
};

// SMS Notification Channel (for critical alerts)
export const SMS_CHANNEL: NotificationChannel = {
  id: 'sms-critical',
  name: 'SMS Critical Alerts',
  type: 'sms',
  enabled: false, // Disabled by default due to cost
  config: {
    provider: 'twilio', // or 'aws-sns'
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.CRITICAL_ALERT_PHONE?.split(',') || []
  },
  retryPolicy: {
    maxRetries: 2,
    retryDelayMs: 5000,
    backoffMultiplier: 2,
    maxDelayMs: 30000
  },
  rateLimit: {
    maxNotifications: 10,
    windowMs: 3600000, // 1 hour
    burst: 3
  },
  filters: [
    {
      field: 'severity',
      operator: 'equals',
      value: 'critical'
    }
  ],
  template: {
    subject: '',
    body: '[{{severity}}] {{alertName}}: {{description}} at {{timestamp}}. Dashboard: {{dashboardUrl}}',
    format: 'text',
    variables: ['severity', 'alertName', 'description', 'timestamp', 'dashboardUrl']
  }
};

// Slack Notification Channel
export const SLACK_CHANNEL: NotificationChannel = {
  id: 'slack-dev-team',
  name: 'Development Team Slack',
  type: 'slack',
  enabled: true,
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#monitoring',
    username: 'jaqEdu Monitoring',
    iconEmoji: ':rotating_light:',
    linkNames: true
  },
  retryPolicy: DEFAULT_RETRY_POLICY,
  rateLimit: {
    maxNotifications: 100,
    windowMs: 3600000, // 1 hour
    burst: 15
  },
  template: {
    subject: '',
    body: JSON.stringify({
      text: '{{severity}} Alert: {{alertName}}',
      attachments: [
        {
          color: '{{#eq severity "critical"}}danger{{else}}{{#eq severity "high"}}warning{{else}}good{{/eq}}{{/eq}}',
          fields: [
            {
              title: 'Alert',
              value: '{{alertName}}',
              short: true
            },
            {
              title: 'Severity',
              value: '{{severity}}',
              short: true
            },
            {
              title: 'Category',
              value: '{{category}}',
              short: true
            },
            {
              title: 'Description',
              value: '{{description}}',
              short: false
            }
          ],
          footer: 'jaqEdu Monitoring',
          ts: '{{timestampUnix}}'
        }
      ]
    }),
    format: 'text',
    variables: ['severity', 'alertName', 'category', 'description', 'timestampUnix']
  }
};

// Discord Notification Channel
export const DISCORD_CHANNEL: NotificationChannel = {
  id: 'discord-alerts',
  name: 'Discord Alerts Channel',
  type: 'discord',
  enabled: false,
  config: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    username: 'jaqEdu Monitor',
    avatarUrl: 'https://jaquedu.com/assets/monitor-avatar.png'
  },
  retryPolicy: DEFAULT_RETRY_POLICY,
  rateLimit: {
    maxNotifications: 50,
    windowMs: 3600000, // 1 hour
    burst: 10
  }
};

// Microsoft Teams Notification Channel
export const TEAMS_CHANNEL: NotificationChannel = {
  id: 'teams-operations',
  name: 'Operations Team Teams',
  type: 'teams',
  enabled: false,
  config: {
    webhookUrl: process.env.TEAMS_WEBHOOK_URL
  },
  retryPolicy: DEFAULT_RETRY_POLICY,
  rateLimit: {
    maxNotifications: 75,
    windowMs: 3600000, // 1 hour
    burst: 12
  }
};

// PagerDuty Integration Channel
export const PAGERDUTY_CHANNEL: NotificationChannel = {
  id: 'pagerduty-oncall',
  name: 'PagerDuty On-Call',
  type: 'pagerduty',
  enabled: false,
  config: {
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    severity: 'critical', // Only for critical alerts
    component: 'jaqEdu Platform',
    group: 'Production Systems'
  },
  retryPolicy: {
    maxRetries: 5,
    retryDelayMs: 3000,
    backoffMultiplier: 2,
    maxDelayMs: 60000
  },
  filters: [
    {
      field: 'severity',
      operator: 'in',
      value: ['critical', 'high']
    }
  ]
};

// All Available Notification Channels
export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  EMAIL_CHANNEL,
  WEBHOOK_CHANNEL,
  IN_APP_CHANNEL,
  SMS_CHANNEL,
  SLACK_CHANNEL,
  DISCORD_CHANNEL,
  TEAMS_CHANNEL,
  PAGERDUTY_CHANNEL
];

// Channel Routing by Severity
export const SEVERITY_ROUTING = {
  low: ['in-app'],
  medium: ['email', 'in-app', 'slack'],
  high: ['email', 'webhook', 'in-app', 'slack'],
  critical: ['email', 'webhook', 'in-app', 'sms', 'slack', 'pagerduty']
};

// Channel Routing by Category
export const CATEGORY_ROUTING = {
  system: ['email', 'webhook', 'in-app', 'slack'],
  application: ['email', 'webhook', 'in-app', 'slack'],
  security: ['email', 'webhook', 'in-app', 'slack', 'pagerduty'],
  business: ['email', 'in-app'],
  infrastructure: ['email', 'webhook', 'in-app', 'slack', 'pagerduty']
};

// Time-based Routing (business hours vs. off-hours)
export const TIME_BASED_ROUTING = {
  businessHours: {
    start: '09:00',
    end: '17:00',
    timezone: 'UTC',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    channels: ['email', 'in-app', 'slack']
  },
  offHours: {
    channels: ['email', 'webhook', 'in-app', 'sms', 'pagerduty']
  }
};

// Notification Channel Utilities
export class NotificationChannelManager {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(channels: NotificationChannel[] = NOTIFICATION_CHANNELS) {
    channels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  getChannel(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  getChannelsByType(type: NotificationChannelType): NotificationChannel[] {
    return Array.from(this.channels.values()).filter(
      channel => channel.type === type && channel.enabled
    );
  }

  getChannelsForAlert(severity: string, category: string): NotificationChannel[] {
    const severityChannels = SEVERITY_ROUTING[severity as keyof typeof SEVERITY_ROUTING] || [];
    const categoryChannels = CATEGORY_ROUTING[category as keyof typeof CATEGORY_ROUTING] || [];
    
    // Combine and deduplicate
    const channelIds = [...new Set([...severityChannels, ...categoryChannels])];
    
    return channelIds
      .map(id => this.getChannel(id))
      .filter((channel): channel is NotificationChannel => 
        channel !== undefined && channel.enabled
      );
  }

  updateChannelConfig(id: string, config: Partial<NotificationChannel>): boolean {
    const channel = this.channels.get(id);
    if (channel) {
      Object.assign(channel, config);
      return true;
    }
    return false;
  }

  validateChannel(channel: NotificationChannel): boolean {
    // Basic validation logic
    if (!channel.id || !channel.name || !channel.type) {
      return false;
    }

    // Type-specific validation
    switch (channel.type) {
      case 'email':
        return !!(channel.config.smtpHost && channel.config.from && channel.config.to);
      case 'webhook':
        return !!(channel.config.url);
      case 'slack':
        return !!(channel.config.webhookUrl);
      case 'sms':
        return !!(channel.config.from && channel.config.to);
      default:
        return true;
    }
  }
}

export default {
  NOTIFICATION_CHANNELS,
  SEVERITY_ROUTING,
  CATEGORY_ROUTING,
  TIME_BASED_ROUTING,
  NotificationChannelManager
};