/**
 * Alert Templates Configuration
 * Defines templates for common alert scenarios and incident types
 */

import { AlertSeverity, AlertCategory } from './alertingThresholds';

// Alert Template Definition
export interface AlertTemplate {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  description: string;
  messageTemplate: string;
  subjectTemplate: string;
  variables: string[];
  actions: AlertAction[];
  tags: string[];
  runbook?: string;
  symptoms: string[];
  possibleCauses: string[];
  investigationSteps: string[];
  resolutionSteps: string[];
}

// Alert Action Definition
export interface AlertAction {
  id: string;
  name: string;
  type: 'link' | 'command' | 'webhook' | 'api_call';
  config: Record<string, any>;
  description: string;
}

// System Alert Templates
export const SYSTEM_ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'high-cpu-usage',
    name: 'High CPU Usage Alert',
    category: 'system',
    severity: 'high',
    description: 'CPU usage has exceeded critical threshold',
    messageTemplate: `🚨 High CPU Usage Detected

Current CPU Usage: {{currentValue}}%
Threshold: {{threshold}}%
Duration: {{duration}} minutes
Affected Server: {{serverName}}
Time: {{timestamp}}

The system is experiencing high CPU utilization which may impact performance.

Next Steps:
1. Check running processes
2. Identify resource-intensive applications
3. Consider scaling resources if needed

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[CRITICAL] High CPU Usage - {{serverName}} ({{currentValue}}%)',
    variables: ['currentValue', 'threshold', 'duration', 'serverName', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-dashboard',
        name: 'View System Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#cpu' },
        description: 'Open the system monitoring dashboard'
      },
      {
        id: 'check-processes',
        name: 'Check Top Processes',
        type: 'command',
        config: { command: 'top -n 1 -b | head -20' },
        description: 'List the top CPU-consuming processes'
      },
      {
        id: 'restart-services',
        name: 'Restart Services',
        type: 'webhook',
        config: { url: '/api/restart-services', method: 'POST' },
        description: 'Restart system services to recover resources'
      }
    ],
    tags: ['cpu', 'performance', 'system'],
    runbook: '/runbooks/high-cpu-usage',
    symptoms: [
      'System response time is slow',
      'Applications are unresponsive',
      'High load average',
      'Users reporting performance issues'
    ],
    possibleCauses: [
      'Resource-intensive application or process',
      'Memory leak causing excessive CPU usage',
      'Infinite loop in application code',
      'DDoS attack or high traffic spike',
      'Insufficient server resources for current load'
    ],
    investigationSteps: [
      'Check current CPU usage with `top` or `htop`',
      'Identify processes consuming most CPU',
      'Review application logs for errors',
      'Check for recent deployments or changes',
      'Monitor network traffic for unusual patterns'
    ],
    resolutionSteps: [
      'Kill or restart problematic processes',
      'Scale up server resources if needed',
      'Optimize application code if applicable',
      'Implement rate limiting for high traffic',
      'Add more servers to distribute load'
    ]
  },
  {
    id: 'memory-exhaustion',
    name: 'Memory Exhaustion Alert',
    category: 'system',
    severity: 'critical',
    description: 'System memory usage is critically high',
    messageTemplate: `🔴 CRITICAL: Memory Exhaustion

Current Memory Usage: {{currentValue}}%
Available Memory: {{availableMemory}}MB
Swap Usage: {{swapUsage}}%
Affected Server: {{serverName}}
Time: {{timestamp}}

The system is critically low on memory and may become unstable.

IMMEDIATE ACTION REQUIRED:
1. Free up memory immediately
2. Restart memory-intensive services
3. Monitor for out-of-memory killer activity

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[CRITICAL] Memory Exhaustion - {{serverName}} ({{currentValue}}%)',
    variables: ['currentValue', 'availableMemory', 'swapUsage', 'serverName', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-memory-dashboard',
        name: 'View Memory Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#memory' },
        description: 'Open the memory monitoring dashboard'
      },
      {
        id: 'check-memory-usage',
        name: 'Check Memory Usage',
        type: 'command',
        config: { command: 'free -h && ps aux --sort=-%mem | head -10' },
        description: 'Show memory usage and top memory-consuming processes'
      },
      {
        id: 'emergency-cleanup',
        name: 'Emergency Memory Cleanup',
        type: 'webhook',
        config: { url: '/api/emergency-cleanup', method: 'POST' },
        description: 'Trigger emergency memory cleanup procedures'
      }
    ],
    tags: ['memory', 'critical', 'system'],
    runbook: '/runbooks/memory-exhaustion',
    symptoms: [
      'System becomes very slow or unresponsive',
      'Applications crash unexpectedly',
      'Out-of-memory errors in logs',
      'Swap usage is very high',
      'OOM killer messages in system logs'
    ],
    possibleCauses: [
      'Memory leak in application',
      'Insufficient memory for current workload',
      'Large dataset processing',
      'Memory-intensive batch jobs',
      'Cached data not being released'
    ],
    investigationSteps: [
      'Check memory usage with `free -h`',
      'Identify memory-consuming processes with `ps aux --sort=-%mem`',
      'Review application logs for memory-related errors',
      'Check for recent changes or deployments',
      'Monitor swap usage and I/O wait times'
    ],
    resolutionSteps: [
      'Restart memory-intensive applications',
      'Clear system caches: `echo 3 > /proc/sys/vm/drop_caches`',
      'Kill non-essential processes',
      'Scale up memory resources',
      'Optimize application memory usage'
    ]
  },
  {
    id: 'disk-space-low',
    name: 'Low Disk Space Alert',
    category: 'system',
    severity: 'high',
    description: 'Disk space is running low',
    messageTemplate: `⚠️ Low Disk Space Warning

Current Disk Usage: {{currentValue}}%
Available Space: {{availableSpace}}GB
Mount Point: {{mountPoint}}
Affected Server: {{serverName}}
Time: {{timestamp}}

Disk space is critically low and may cause system issues.

Actions Needed:
1. Clean up unnecessary files
2. Archive or compress old logs
3. Consider adding more storage

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[WARNING] Low Disk Space - {{serverName}} {{mountPoint}} ({{currentValue}}%)',
    variables: ['currentValue', 'availableSpace', 'mountPoint', 'serverName', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-disk-usage',
        name: 'View Disk Usage',
        type: 'link',
        config: { url: '{{dashboardUrl}}#disk' },
        description: 'Open the disk monitoring dashboard'
      },
      {
        id: 'analyze-disk-usage',
        name: 'Analyze Disk Usage',
        type: 'command',
        config: { command: 'du -sh /* | sort -hr | head -10' },
        description: 'Show largest directories consuming disk space'
      },
      {
        id: 'cleanup-logs',
        name: 'Cleanup Old Logs',
        type: 'webhook',
        config: { url: '/api/cleanup-logs', method: 'POST' },
        description: 'Automatically clean up old log files'
      }
    ],
    tags: ['disk', 'storage', 'system'],
    runbook: '/runbooks/low-disk-space',
    symptoms: [
      'Applications fail to write files',
      'Database operations fail',
      'Log files stop growing',
      'Temporary file creation fails',
      'System performance degrades'
    ],
    possibleCauses: [
      'Log files growing too large',
      'Database files consuming excessive space',
      'Temporary files not being cleaned up',
      'Application data growth',
      'Backup files accumulating'
    ],
    investigationSteps: [
      'Check disk usage with `df -h`',
      'Find largest directories with `du -sh /* | sort -hr`',
      'Identify large files with `find / -size +100M -type f`',
      'Check log file sizes in /var/log',
      'Review database and application data directories'
    ],
    resolutionSteps: [
      'Clean up old log files',
      'Remove unnecessary temporary files',
      'Archive or compress old data',
      'Increase disk space or add new volumes',
      'Implement log rotation policies'
    ]
  }
];

// Application Alert Templates
export const APPLICATION_ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'pipeline-error-rate-high',
    name: 'High Pipeline Error Rate',
    category: 'application',
    severity: 'high',
    description: 'AI resource pipeline error rate exceeds threshold',
    messageTemplate: `🚨 High Pipeline Error Rate Detected

Current Error Rate: {{currentValue}}%
Threshold: {{threshold}}%
Failed Modules: {{failedModules}}
Successful Modules: {{successfulModules}}
Time Window: {{timeWindow}} minutes
Time: {{timestamp}}

The AI resource pipeline is experiencing a high error rate.

Immediate Actions:
1. Check pipeline logs for error patterns
2. Verify AI service connectivity
3. Review recent module configurations

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[ALERT] High Pipeline Error Rate ({{currentValue}}%)',
    variables: ['currentValue', 'threshold', 'failedModules', 'successfulModules', 'timeWindow', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-pipeline-dashboard',
        name: 'View Pipeline Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#pipeline' },
        description: 'Open the pipeline monitoring dashboard'
      },
      {
        id: 'check-pipeline-logs',
        name: 'Check Pipeline Logs',
        type: 'api_call',
        config: { endpoint: '/api/pipeline/logs', method: 'GET' },
        description: 'Retrieve recent pipeline error logs'
      },
      {
        id: 'restart-pipeline',
        name: 'Restart Pipeline Services',
        type: 'webhook',
        config: { url: '/api/pipeline/restart', method: 'POST' },
        description: 'Restart the pipeline processing services'
      }
    ],
    tags: ['pipeline', 'errors', 'ai'],
    runbook: '/runbooks/pipeline-errors',
    symptoms: [
      'Multiple modules failing to process',
      'Resources not being generated',
      'Users reporting missing content',
      'High number of error alerts',
      'Pipeline queue backing up'
    ],
    possibleCauses: [
      'AI service downtime or connectivity issues',
      'Invalid or corrupted input data',
      'Configuration errors in modules',
      'Resource limits exceeded',
      'External API failures'
    ],
    investigationSteps: [
      'Check pipeline service status and logs',
      'Verify AI service connectivity and API keys',
      'Review recent module configurations and changes',
      'Check input data quality and format',
      'Monitor resource usage and limits'
    ],
    resolutionSteps: [
      'Restart failing pipeline services',
      'Fix configuration errors',
      'Validate and clean input data',
      'Scale up resources if needed',
      'Implement retry mechanisms for transient failures'
    ]
  },
  {
    id: 'api-response-time-high',
    name: 'High API Response Time',
    category: 'application',
    severity: 'medium',
    description: 'API response times exceed acceptable thresholds',
    messageTemplate: `⚠️ High API Response Time

Average Response Time: {{currentValue}}ms
Threshold: {{threshold}}ms
P95 Response Time: {{p95ResponseTime}}ms
Affected Endpoints: {{affectedEndpoints}}
Request Volume: {{requestVolume}}/min
Time: {{timestamp}}

API performance is degraded and may impact user experience.

Investigation Required:
1. Check database query performance
2. Monitor server resource usage
3. Review recent code deployments

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[WARNING] High API Response Time ({{currentValue}}ms)',
    variables: ['currentValue', 'threshold', 'p95ResponseTime', 'affectedEndpoints', 'requestVolume', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-api-dashboard',
        name: 'View API Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#api' },
        description: 'Open the API performance dashboard'
      },
      {
        id: 'check-slow-queries',
        name: 'Check Slow Queries',
        type: 'api_call',
        config: { endpoint: '/api/database/slow-queries', method: 'GET' },
        description: 'Retrieve list of slow database queries'
      },
      {
        id: 'scale-api-servers',
        name: 'Scale API Servers',
        type: 'webhook',
        config: { url: '/api/scaling/scale-up', method: 'POST' },
        description: 'Scale up API server instances'
      }
    ],
    tags: ['api', 'performance', 'response-time'],
    runbook: '/runbooks/slow-api',
    symptoms: [
      'Users report slow application performance',
      'Timeouts in client applications',
      'High request queue depth',
      'Increased error rates due to timeouts',
      'Poor user experience metrics'
    ],
    possibleCauses: [
      'Slow database queries',
      'Insufficient server resources',
      'Network latency issues',
      'Inefficient application code',
      'High request volume or traffic spike'
    ],
    investigationSteps: [
      'Check API response time metrics and trends',
      'Identify slow endpoints and operations',
      'Review database query performance',
      'Monitor server CPU, memory, and I/O usage',
      'Check for recent code changes or deployments'
    ],
    resolutionSteps: [
      'Optimize slow database queries',
      'Scale up server resources',
      'Implement caching for frequently accessed data',
      'Optimize application code performance',
      'Add load balancing or CDN if needed'
    ]
  },
  {
    id: 'quality-score-degraded',
    name: 'Resource Quality Degraded',
    category: 'application',
    severity: 'medium',
    description: 'Generated resource quality scores below acceptable threshold',
    messageTemplate: `📉 Resource Quality Degradation

Average Quality Score: {{currentValue}}
Threshold: {{threshold}}
Affected Resource Types: {{affectedTypes}}
Total Resources Checked: {{totalResources}}
Low Quality Count: {{lowQualityCount}}
Time: {{timestamp}}

The quality of generated educational resources has degraded.

Review Required:
1. Check AI model performance
2. Validate input data quality
3. Review quality assessment criteria

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[QUALITY] Resource Quality Degradation (Score: {{currentValue}})',
    variables: ['currentValue', 'threshold', 'affectedTypes', 'totalResources', 'lowQualityCount', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-quality-dashboard',
        name: 'View Quality Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#quality' },
        description: 'Open the quality monitoring dashboard'
      },
      {
        id: 'sample-low-quality',
        name: 'Sample Low Quality Resources',
        type: 'api_call',
        config: { endpoint: '/api/quality/sample-low', method: 'GET' },
        description: 'Get samples of low-quality resources for review'
      },
      {
        id: 'retrain-model',
        name: 'Trigger Model Retraining',
        type: 'webhook',
        config: { url: '/api/ai/retrain', method: 'POST' },
        description: 'Trigger AI model retraining process'
      }
    ],
    tags: ['quality', 'ai', 'content'],
    runbook: '/runbooks/quality-degradation',
    symptoms: [
      'Users report poor quality content',
      'High rejection rate of generated resources',
      'Increased manual review requirements',
      'Lower user satisfaction scores',
      'More support tickets about content quality'
    ],
    possibleCauses: [
      'AI model drift or degradation',
      'Poor quality input data',
      'Changes in content requirements',
      'Model training data becoming outdated',
      'Quality assessment criteria changes'
    ],
    investigationSteps: [
      'Review quality score trends over time',
      'Sample and manually review low-quality resources',
      'Check AI model performance metrics',
      'Validate input data quality and consistency',
      'Review recent changes to quality criteria'
    ],
    resolutionSteps: [
      'Retrain AI model with updated data',
      'Improve input data quality validation',
      'Update quality assessment criteria',
      'Implement additional quality checks',
      'Enhance content review processes'
    ]
  }
];

// Security Alert Templates
export const SECURITY_ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'failed-login-attempts',
    name: 'Multiple Failed Login Attempts',
    category: 'security',
    severity: 'high',
    description: 'Unusual number of failed login attempts detected',
    messageTemplate: `🔐 Security Alert: Multiple Failed Login Attempts

Failed Attempts: {{currentValue}}
Threshold: {{threshold}}
Time Window: {{timeWindow}} minutes
Source IP(s): {{sourceIPs}}
Affected Accounts: {{affectedAccounts}}
Time: {{timestamp}}

Multiple failed login attempts detected - possible brute force attack.

IMMEDIATE ACTIONS:
1. Block suspicious IP addresses
2. Check affected user accounts
3. Review security logs for patterns

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[SECURITY] Multiple Failed Login Attempts ({{currentValue}} attempts)',
    variables: ['currentValue', 'threshold', 'timeWindow', 'sourceIPs', 'affectedAccounts', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-security-dashboard',
        name: 'View Security Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#security' },
        description: 'Open the security monitoring dashboard'
      },
      {
        id: 'block-ips',
        name: 'Block Suspicious IPs',
        type: 'webhook',
        config: { url: '/api/security/block-ips', method: 'POST' },
        description: 'Automatically block suspicious IP addresses'
      },
      {
        id: 'lock-accounts',
        name: 'Lock Affected Accounts',
        type: 'webhook',
        config: { url: '/api/security/lock-accounts', method: 'POST' },
        description: 'Temporarily lock affected user accounts'
      }
    ],
    tags: ['security', 'authentication', 'brute-force'],
    runbook: '/runbooks/failed-logins',
    symptoms: [
      'High number of authentication failures',
      'Failed login alerts from multiple IPs',
      'User accounts being locked out',
      'Suspicious patterns in access logs',
      'Reports of unauthorized access attempts'
    ],
    possibleCauses: [
      'Brute force attack attempt',
      'Credential stuffing attack',
      'Compromised user credentials',
      'Automated bot attacks',
      'Social engineering attempts'
    ],
    investigationSteps: [
      'Analyze failed login patterns and source IPs',
      'Check for compromised credentials on dark web',
      'Review user account activity and patterns',
      'Examine network traffic for anomalies',
      'Check for correlation with other security events'
    ],
    resolutionSteps: [
      'Block malicious IP addresses',
      'Implement rate limiting on login attempts',
      'Force password resets for affected accounts',
      'Enable multi-factor authentication',
      'Update security monitoring rules'
    ]
  }
];

// Business Alert Templates
export const BUSINESS_ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'user-satisfaction-low',
    name: 'Low User Satisfaction Score',
    category: 'business',
    severity: 'medium',
    description: 'User satisfaction metrics below acceptable threshold',
    messageTemplate: `📊 Business Alert: Low User Satisfaction

Average Satisfaction Score: {{currentValue}}
Threshold: {{threshold}}
Sample Size: {{sampleSize}} responses
Negative Feedback: {{negativeFeedback}}%
Time Period: {{timePeriod}}
Time: {{timestamp}}

User satisfaction has dropped below acceptable levels.

Analysis Required:
1. Review user feedback and complaints
2. Identify common issues or pain points
3. Check system performance during period

Dashboard: {{dashboardUrl}}
Runbook: {{runbook}}`,
    subjectTemplate: '[BUSINESS] Low User Satisfaction (Score: {{currentValue}})',
    variables: ['currentValue', 'threshold', 'sampleSize', 'negativeFeedback', 'timePeriod', 'timestamp', 'dashboardUrl', 'runbook'],
    actions: [
      {
        id: 'view-satisfaction-dashboard',
        name: 'View Satisfaction Dashboard',
        type: 'link',
        config: { url: '{{dashboardUrl}}#satisfaction' },
        description: 'Open the user satisfaction dashboard'
      },
      {
        id: 'analyze-feedback',
        name: 'Analyze User Feedback',
        type: 'api_call',
        config: { endpoint: '/api/feedback/analyze', method: 'GET' },
        description: 'Get detailed analysis of user feedback'
      },
      {
        id: 'create-improvement-task',
        name: 'Create Improvement Task',
        type: 'webhook',
        config: { url: '/api/tasks/create-improvement', method: 'POST' },
        description: 'Create task to address user satisfaction issues'
      }
    ],
    tags: ['business', 'satisfaction', 'ux'],
    runbook: '/runbooks/user-satisfaction',
    symptoms: [
      'Declining user satisfaction scores',
      'Increased negative feedback',
      'Higher support ticket volume',
      'Reduced user engagement',
      'Customer churn increase'
    ],
    possibleCauses: [
      'Performance issues affecting user experience',
      'New features not meeting user expectations',
      'System bugs or reliability issues',
      'Poor user interface design',
      'Inadequate customer support'
    ],
    investigationSteps: [
      'Review recent user feedback and survey responses',
      'Analyze user behavior and engagement metrics',
      'Check system performance during the period',
      'Review recent product changes or updates',
      'Interview users for detailed feedback'
    ],
    resolutionSteps: [
      'Address identified performance issues',
      'Improve user interface and experience',
      'Enhance customer support processes',
      'Implement requested feature improvements',
      'Increase communication with users about changes'
    ]
  }
];

// All Alert Templates
export const ALL_ALERT_TEMPLATES: AlertTemplate[] = [
  ...SYSTEM_ALERT_TEMPLATES,
  ...APPLICATION_ALERT_TEMPLATES,
  ...SECURITY_ALERT_TEMPLATES,
  ...BUSINESS_ALERT_TEMPLATES
];

// Template Categories
export const ALERT_TEMPLATE_CATEGORIES = {
  system: SYSTEM_ALERT_TEMPLATES,
  application: APPLICATION_ALERT_TEMPLATES,
  security: SECURITY_ALERT_TEMPLATES,
  business: BUSINESS_ALERT_TEMPLATES
};

// Template Manager
export class AlertTemplateManager {
  private templates: Map<string, AlertTemplate> = new Map();

  constructor(templates: AlertTemplate[] = ALL_ALERT_TEMPLATES) {
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): AlertTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplatesByCategory(category: AlertCategory): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  getTemplatesBySeverity(severity: AlertSeverity): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.severity === severity
    );
  }

  renderTemplate(templateId: string, variables: Record<string, any>): { subject: string; message: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const subject = this.interpolateTemplate(template.subjectTemplate, variables);
    const message = this.interpolateTemplate(template.messageTemplate, variables);

    return { subject, message };
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
  }

  validateTemplate(template: AlertTemplate): boolean {
    const requiredFields = ['id', 'name', 'category', 'severity', 'messageTemplate'];
    return requiredFields.every(field => template[field as keyof AlertTemplate]);
  }

  addTemplate(template: AlertTemplate): boolean {
    if (!this.validateTemplate(template)) {
      return false;
    }
    this.templates.set(template.id, template);
    return true;
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }
}

export default {
  ALL_ALERT_TEMPLATES,
  ALERT_TEMPLATE_CATEGORIES,
  AlertTemplateManager
};