/**
 * Alert Escalation Policies Configuration
 * Defines escalation rules, schedules, and notification patterns
 */

import { AlertSeverity, AlertCategory } from './alertingThresholds';
import { NotificationChannelType } from './notificationChannels';

// Escalation Level Definition
export interface EscalationLevel {
  level: number;
  name: string;
  delayMinutes: number;
  channels: NotificationChannelType[];
  recipients: string[];
  conditions?: EscalationCondition[];
}

// Escalation Condition
export interface EscalationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

// Escalation Policy Definition
export interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: EscalationTrigger[];
  levels: EscalationLevel[];
  suppressionRules?: SuppressionRule[];
  schedule?: EscalationSchedule;
  maxEscalations?: number;
  cooldownPeriod?: number; // Minutes before re-escalation
}

// Escalation Trigger
export interface EscalationTrigger {
  severity?: AlertSeverity[];
  category?: AlertCategory[];
  tags?: string[];
  alertIds?: string[];
  timeWindow?: number; // Minutes
}

// Suppression Rule
export interface SuppressionRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: EscalationCondition[];
  suppressChannels?: NotificationChannelType[];
  suppressLevels?: number[];
  duration?: number; // Minutes
}

// Escalation Schedule
export interface EscalationSchedule {
  timezone: string;
  businessHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    days: string[]; // monday, tuesday, etc.
  };
  holidays?: string[]; // ISO date strings
  overrides?: ScheduleOverride[];
}

// Schedule Override
export interface ScheduleOverride {
  start: string; // ISO date string
  end: string;   // ISO date string
  policy: 'business_hours' | 'off_hours' | 'custom';
  levels?: EscalationLevel[];
}

// On-Call Rotation
export interface OnCallRotation {
  id: string;
  name: string;
  participants: OnCallParticipant[];
  rotationType: 'weekly' | 'daily' | 'custom';
  rotationStart: string; // ISO date string
  handoffTime: string;   // HH:MM format
}

export interface OnCallParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  slackId?: string;
  backup?: string; // ID of backup person
}

// Critical System Escalation Policy
export const CRITICAL_SYSTEM_POLICY: EscalationPolicy = {
  id: 'critical-system',
  name: 'Critical System Issues',
  description: 'Escalation policy for critical system alerts requiring immediate attention',
  enabled: true,
  triggers: [
    {
      severity: ['critical'],
      category: ['system', 'infrastructure'],
      timeWindow: 0 // Immediate escalation
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Immediate Response',
      delayMinutes: 0,
      channels: ['in-app', 'email', 'webhook'],
      recipients: ['oncall-primary@jaquedu.com', 'admin@jaquedu.com']
    },
    {
      level: 2,
      name: 'SMS and PagerDuty',
      delayMinutes: 5,
      channels: ['sms', 'pagerduty', 'slack'],
      recipients: ['+1234567890', 'oncall-backup@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    },
    {
      level: 3,
      name: 'Management Escalation',
      delayMinutes: 15,
      channels: ['email', 'sms'],
      recipients: ['manager@jaquedu.com', 'cto@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  maxEscalations: 3,
  cooldownPeriod: 60
};

// High Priority Application Escalation Policy
export const HIGH_PRIORITY_APP_POLICY: EscalationPolicy = {
  id: 'high-priority-app',
  name: 'High Priority Application Issues',
  description: 'Escalation policy for high priority application alerts',
  enabled: true,
  triggers: [
    {
      severity: ['high'],
      category: ['application'],
      timeWindow: 10 // 10 minutes
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Development Team',
      delayMinutes: 0,
      channels: ['in-app', 'email', 'slack'],
      recipients: ['dev-team@jaquedu.com']
    },
    {
      level: 2,
      name: 'Team Lead',
      delayMinutes: 15,
      channels: ['email', 'sms'],
      recipients: ['team-lead@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    },
    {
      level: 3,
      name: 'Engineering Manager',
      delayMinutes: 30,
      channels: ['email', 'slack'],
      recipients: ['eng-manager@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  maxEscalations: 3,
  cooldownPeriod: 120
};

// Security Incident Escalation Policy
export const SECURITY_INCIDENT_POLICY: EscalationPolicy = {
  id: 'security-incident',
  name: 'Security Incident Response',
  description: 'Escalation policy for security-related alerts',
  enabled: true,
  triggers: [
    {
      severity: ['high', 'critical'],
      category: ['security'],
      timeWindow: 0
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Security Team',
      delayMinutes: 0,
      channels: ['in-app', 'email', 'webhook', 'slack'],
      recipients: ['security@jaquedu.com', 'incident-response@jaquedu.com']
    },
    {
      level: 2,
      name: 'CISO and Management',
      delayMinutes: 10,
      channels: ['email', 'sms', 'pagerduty'],
      recipients: ['ciso@jaquedu.com', 'cto@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    },
    {
      level: 3,
      name: 'Executive Team',
      delayMinutes: 30,
      channels: ['email', 'sms'],
      recipients: ['ceo@jaquedu.com', 'legal@jaquedu.com'],
      conditions: [
        {
          field: 'severity',
          operator: 'equals',
          value: 'critical'
        },
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  maxEscalations: 3,
  cooldownPeriod: 240
};

// Business Hours Only Policy
export const BUSINESS_HOURS_POLICY: EscalationPolicy = {
  id: 'business-hours',
  name: 'Business Hours Alerts',
  description: 'Escalation policy for non-critical alerts during business hours',
  enabled: true,
  triggers: [
    {
      severity: ['low', 'medium'],
      timeWindow: 30
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Team Notification',
      delayMinutes: 0,
      channels: ['in-app', 'slack'],
      recipients: ['team@jaquedu.com']
    },
    {
      level: 2,
      name: 'Email Follow-up',
      delayMinutes: 60,
      channels: ['email'],
      recipients: ['team@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  schedule: {
    timezone: 'UTC',
    businessHours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  },
  suppressionRules: [
    {
      id: 'weekend-suppression',
      name: 'Weekend Suppression',
      enabled: true,
      conditions: [
        {
          field: 'day_of_week',
          operator: 'contains',
          value: ['saturday', 'sunday']
        }
      ],
      suppressChannels: ['email', 'sms'],
      duration: 2880 // 48 hours
    }
  ],
  maxEscalations: 2,
  cooldownPeriod: 360
};

// Performance Degradation Policy
export const PERFORMANCE_DEGRADATION_POLICY: EscalationPolicy = {
  id: 'performance-degradation',
  name: 'Performance Degradation',
  description: 'Escalation policy for performance-related issues',
  enabled: true,
  triggers: [
    {
      severity: ['medium', 'high'],
      tags: ['performance', 'slow', 'timeout'],
      timeWindow: 15
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Performance Team',
      delayMinutes: 0,
      channels: ['in-app', 'slack'],
      recipients: ['performance@jaquedu.com']
    },
    {
      level: 2,
      name: 'Infrastructure Team',
      delayMinutes: 20,
      channels: ['email', 'slack'],
      recipients: ['infrastructure@jaquedu.com'],
      conditions: [
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    },
    {
      level: 3,
      name: 'Senior Engineer',
      delayMinutes: 45,
      channels: ['email', 'sms'],
      recipients: ['senior-engineer@jaquedu.com'],
      conditions: [
        {
          field: 'severity',
          operator: 'equals',
          value: 'high'
        },
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  maxEscalations: 3,
  cooldownPeriod: 180
};

// Database Issues Policy
export const DATABASE_ISSUES_POLICY: EscalationPolicy = {
  id: 'database-issues',
  name: 'Database Issues',
  description: 'Escalation policy for database-related alerts',
  enabled: true,
  triggers: [
    {
      severity: ['medium', 'high', 'critical'],
      tags: ['database', 'db', 'sql'],
      timeWindow: 5
    }
  ],
  levels: [
    {
      level: 1,
      name: 'Database Team',
      delayMinutes: 0,
      channels: ['in-app', 'email', 'slack'],
      recipients: ['dba@jaquedu.com', 'backend@jaquedu.com']
    },
    {
      level: 2,
      name: 'Database Administrator',
      delayMinutes: 10,
      channels: ['sms', 'pagerduty'],
      recipients: ['senior-dba@jaquedu.com'],
      conditions: [
        {
          field: 'severity',
          operator: 'contains',
          value: ['high', 'critical']
        },
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    },
    {
      level: 3,
      name: 'Infrastructure Manager',
      delayMinutes: 20,
      channels: ['email', 'sms'],
      recipients: ['infra-manager@jaquedu.com'],
      conditions: [
        {
          field: 'severity',
          operator: 'equals',
          value: 'critical'
        },
        {
          field: 'acknowledged',
          operator: 'equals',
          value: false
        }
      ]
    }
  ],
  maxEscalations: 3,
  cooldownPeriod: 90
};

// All Escalation Policies
export const ESCALATION_POLICIES: EscalationPolicy[] = [
  CRITICAL_SYSTEM_POLICY,
  HIGH_PRIORITY_APP_POLICY,
  SECURITY_INCIDENT_POLICY,
  BUSINESS_HOURS_POLICY,
  PERFORMANCE_DEGRADATION_POLICY,
  DATABASE_ISSUES_POLICY
];

// On-Call Rotations
export const ON_CALL_ROTATIONS: OnCallRotation[] = [
  {
    id: 'primary-oncall',
    name: 'Primary On-Call',
    participants: [
      {
        id: 'engineer-1',
        name: 'Alice Johnson',
        email: 'alice@jaquedu.com',
        phone: '+1234567890',
        slackId: 'U12345',
        backup: 'engineer-2'
      },
      {
        id: 'engineer-2',
        name: 'Bob Smith',
        email: 'bob@jaquedu.com',
        phone: '+1234567891',
        slackId: 'U12346',
        backup: 'engineer-3'
      },
      {
        id: 'engineer-3',
        name: 'Carol Davis',
        email: 'carol@jaquedu.com',
        phone: '+1234567892',
        slackId: 'U12347',
        backup: 'engineer-1'
      }
    ],
    rotationType: 'weekly',
    rotationStart: '2024-01-01T00:00:00Z',
    handoffTime: '09:00'
  },
  {
    id: 'security-oncall',
    name: 'Security On-Call',
    participants: [
      {
        id: 'security-1',
        name: 'David Wilson',
        email: 'david@jaquedu.com',
        phone: '+1234567893',
        slackId: 'U12348'
      },
      {
        id: 'security-2',
        name: 'Eve Brown',
        email: 'eve@jaquedu.com',
        phone: '+1234567894',
        slackId: 'U12349'
      }
    ],
    rotationType: 'weekly',
    rotationStart: '2024-01-01T00:00:00Z',
    handoffTime: '08:00'
  }
];

// Escalation Policy Manager
export class EscalationPolicyManager {
  private policies: Map<string, EscalationPolicy> = new Map();
  private rotations: Map<string, OnCallRotation> = new Map();

  constructor(
    policies: EscalationPolicy[] = ESCALATION_POLICIES,
    rotations: OnCallRotation[] = ON_CALL_ROTATIONS
  ) {
    policies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
    
    rotations.forEach(rotation => {
      this.rotations.set(rotation.id, rotation);
    });
  }

  getPolicy(id: string): EscalationPolicy | undefined {
    return this.policies.get(id);
  }

  getPoliciesForAlert(severity: AlertSeverity, category: AlertCategory, tags: string[] = []): EscalationPolicy[] {
    return Array.from(this.policies.values()).filter(policy => {
      if (!policy.enabled) return false;

      return policy.triggers.some(trigger => {
        const severityMatch = !trigger.severity || trigger.severity.includes(severity);
        const categoryMatch = !trigger.category || trigger.category.includes(category);
        const tagsMatch = !trigger.tags || trigger.tags.some(tag => tags.includes(tag));

        return severityMatch && categoryMatch && tagsMatch;
      });
    });
  }

  getCurrentOnCallPerson(rotationId: string): OnCallParticipant | undefined {
    const rotation = this.rotations.get(rotationId);
    if (!rotation) return undefined;

    const now = new Date();
    const rotationStart = new Date(rotation.rotationStart);
    const diffMs = now.getTime() - rotationStart.getTime();
    
    let index = 0;
    if (rotation.rotationType === 'weekly') {
      const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      index = weeks % rotation.participants.length;
    } else if (rotation.rotationType === 'daily') {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      index = days % rotation.participants.length;
    }

    return rotation.participants[index];
  }

  isBusinessHours(policy: EscalationPolicy): boolean {
    if (!policy.schedule) return true;

    const now = new Date();
    const schedule = policy.schedule;
    
    // Check if current day is a business day
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    
    if (!schedule.businessHours.days.includes(currentDay)) {
      return false;
    }

    // Check if current time is within business hours
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= schedule.businessHours.start && currentTime <= schedule.businessHours.end;
  }

  shouldSuppressAlert(policy: EscalationPolicy, alertData: any): boolean {
    if (!policy.suppressionRules) return false;

    return policy.suppressionRules.some(rule => {
      if (!rule.enabled) return false;

      return rule.conditions.every(condition => {
        const fieldValue = alertData[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'not_equals':
            return fieldValue !== condition.value;
          case 'contains':
            return Array.isArray(condition.value) 
              ? condition.value.includes(fieldValue)
              : fieldValue?.includes(condition.value);
          case 'greater_than':
            return fieldValue > condition.value;
          case 'less_than':
            return fieldValue < condition.value;
          default:
            return false;
        }
      });
    });
  }
}

export default {
  ESCALATION_POLICIES,
  ON_CALL_ROTATIONS,
  EscalationPolicyManager
};