# Alerting System Overview

## Introduction

The jaqEdu alerting system provides comprehensive monitoring and notification capabilities for the educational AI platform. It features intelligent threshold management, escalation policies, multiple notification channels, and detailed incident response procedures.

## Architecture Overview

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Monitoring        │    │   Alerting           │    │   Notification      │
│   System            │───▶│   Engine             │───▶│   Channels          │
│                     │    │                      │    │                     │
│ • Metrics Collection│    │ • Rule Evaluation    │    │ • Email             │
│ • Health Checks     │    │ • Alert Management   │    │ • Slack             │
│ • Performance Data  │    │ • Escalation Logic   │    │ • Webhooks          │
└─────────────────────┘    └──────────────────────┘    │ • In-App            │
                                       │                │ • SMS               │
                                       ▼                └─────────────────────┘
┌─────────────────────┐    ┌──────────────────────┐    
│   Configuration     │    │   Incident           │    
│   Management        │    │   Response           │    
│                     │    │                      │    
│ • Thresholds        │    │ • Runbooks           │    
│ • Alert Rules       │    │ • Escalation         │    
│ • Templates         │    │ • Resolution         │    
└─────────────────────┘    └──────────────────────┘    
```

## Key Components

### 1. Alert Rules Engine
- **Purpose**: Evaluates system metrics against predefined thresholds
- **Features**: 
  - Dynamic threshold adjustment
  - Time-based rules
  - Multi-condition evaluation
  - Cooldown periods
- **Location**: `/src/services/alerting/AlertingEngine.ts`

### 2. Notification System
- **Purpose**: Delivers alerts through multiple channels
- **Channels**: Email, Slack, Webhooks, In-App, SMS, PagerDuty
- **Features**:
  - Template-based messaging
  - Rate limiting
  - Retry mechanisms
- **Location**: `/src/config/notificationChannels.ts`

### 3. Escalation Management
- **Purpose**: Manages alert escalation based on severity and response
- **Features**:
  - Multi-level escalation
  - Time-based triggers
  - On-call rotation support
  - Suppression rules
- **Location**: `/src/config/escalationPolicies.ts`

### 4. Alert Templates
- **Purpose**: Standardized alert formatting and content
- **Features**:
  - Category-specific templates
  - Variable interpolation
  - Multi-format support
  - Runbook integration
- **Location**: `/src/config/alertTemplates.ts`

## Alert Categories and Severity

### Categories
1. **System** - CPU, memory, disk, network
2. **Application** - API performance, pipeline errors, quality issues
3. **Security** - Authentication failures, suspicious activity
4. **Business** - User satisfaction, conversion rates
5. **Infrastructure** - Service availability, health checks

### Severity Levels
- **Critical**: Immediate attention required, affects core functionality
- **High**: Urgent attention needed, impacts users
- **Medium**: Important but not urgent, should be addressed soon
- **Low**: Informational, can be addressed during normal hours

## Performance Thresholds

### System Metrics
```yaml
CPU Usage:
  Warning: 70% (sustained 5+ minutes)
  Critical: 85% (sustained 3+ minutes)

Memory Usage:
  Warning: 80% (sustained 3+ minutes) 
  Critical: 90% (sustained 2+ minutes)

Disk Space:
  Warning: 80% capacity
  Critical: 90% capacity

Network Latency:
  Warning: 500ms average
  Critical: 1000ms average
```

### Application Metrics
```yaml
API Response Time:
  Warning: 2000ms average
  Critical: 5000ms average

Pipeline Error Rate:
  Warning: 5%
  Critical: 15%

Quality Score:
  Warning: Below 70%
  Critical: Below 50%

Queue Depth:
  Warning: 25 modules
  Critical: 50 modules
```

## Notification Channels

### Email Notifications
- **Recipients**: Configurable by severity and category
- **Templates**: HTML and plain text formats
- **Rate Limiting**: 50 notifications per hour
- **Features**: Subject line customization, attachment support

### Slack Integration
- **Channels**: #monitoring, #alerts, #critical
- **Format**: Rich message formatting with action buttons
- **Features**: Thread replies, emoji reactions, custom webhooks

### Webhook Notifications
- **Format**: JSON payload with alert details
- **Authentication**: Bearer token or custom headers
- **Retry Policy**: 5 attempts with exponential backoff
- **Timeout**: 10 seconds

### In-App Notifications
- **Delivery**: Real-time via WebSocket
- **Persistence**: 24-hour retention
- **Features**: Acknowledgment, filtering, sound alerts

### SMS Alerts (Critical Only)
- **Provider**: Twilio integration
- **Triggers**: Critical alerts only
- **Rate Limiting**: 10 messages per hour
- **Content**: Shortened message with dashboard link

## Escalation Policies

### Critical System Issues
```
Level 1 (0 min):    On-call engineer (Email, In-App, Webhook)
Level 2 (5 min):    SMS, PagerDuty (if not acknowledged)
Level 3 (15 min):   Management team (if still not acknowledged)
```

### High Priority Application Issues
```
Level 1 (0 min):    Development team (Email, Slack, In-App)
Level 2 (15 min):   Team lead (Email, SMS)
Level 3 (30 min):   Engineering manager
```

### Security Incidents
```
Level 1 (0 min):    Security team (All channels)
Level 2 (10 min):   CISO, CTO
Level 3 (30 min):   Executive team (Critical only)
```

## Alert Templates

### System Alert Example
```
🚨 High CPU Usage Detected

Current CPU Usage: 87%
Threshold: 85%
Duration: 8 minutes
Affected Server: web-server-01
Time: 2024-01-15 14:30:00 UTC

The system is experiencing high CPU utilization which may impact performance.

Next Steps:
1. Check running processes
2. Identify resource-intensive applications
3. Consider scaling resources if needed

Dashboard: https://monitoring.jaquedu.com/cpu
Runbook: https://runbooks.jaquedu.com/high-cpu-usage
```

### Application Alert Example
```
🚨 High Pipeline Error Rate

Current Error Rate: 12%
Threshold: 10%
Failed Modules: 15
Time Window: 20 minutes
Time: 2024-01-15 14:30:00 UTC

The AI resource pipeline is experiencing a high error rate.

Immediate Actions:
1. Check pipeline logs for error patterns
2. Verify AI service connectivity
3. Review recent module configurations

Dashboard: https://monitoring.jaquedu.com/pipeline
Runbook: https://runbooks.jaquedu.com/pipeline-errors
```

## Configuration Management

### Environment Variables
```bash
# Notification Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ALERT_FROM_EMAIL=alerts@jaquedu.com
ALERT_TO_EMAIL=admin@jaquedu.com,team@jaquedu.com

# Webhook Configuration
WEBHOOK_URL=https://api.jaquedu.com/alerts
WEBHOOK_TOKEN=your-webhook-token

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# SMS Configuration (Critical Alerts)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
CRITICAL_ALERT_PHONE=+1234567890,+1234567891

# Dashboard
DASHBOARD_URL=https://monitoring.jaquedu.com
```

### Configuration Files
- `/src/config/alertingThresholds.ts` - Alert rules and thresholds
- `/src/config/notificationChannels.ts` - Notification channel settings
- `/src/config/escalationPolicies.ts` - Escalation rules and schedules
- `/src/config/alertTemplates.ts` - Message templates

## Monitoring Integration

### Real-time Integration
The alerting system integrates with the monitoring service for real-time alert generation:

```typescript
// Connect alerting service to monitoring
const monitoringService = new PipelineMonitoringService(pipeline, hooks);
const alertingService = new AlertingService();

alertingService.connectToMonitoring(monitoringService);

// Monitoring service automatically creates alerts
monitoringService.on('alert_created', (alert) => {
  // Alert is automatically processed by alerting service
});
```

### Polling Mode
For systems without real-time integration:

```typescript
const alertingService = new AlertingService({
  integrationMode: 'polling',
  pollingInterval: 30000 // 30 seconds
});
```

## Dashboard Integration

### Alert Panel Component
The monitoring dashboard includes an integrated alerts panel:

```typescript
import { AlertsPanel } from '../components/monitoring/AlertsPanel';

<AlertsPanel 
  alerts={alerts}
  theme={theme}
  onAcknowledge={(alertId) => {
    alertingService.acknowledgeAlert(alertId, currentUser.id);
  }}
/>
```

### Real-time Updates
Alerts are updated in real-time via WebSocket:

```typescript
// WebSocket hook for real-time alert updates
const { connected } = useMonitoringWebSocket({
  onAlertsUpdate: (newAlerts) => {
    setAlerts(newAlerts);
  }
});
```

## Testing and Validation

### Test Alert Generation
```typescript
// Enable test mode
const alertingService = new AlertingService({
  enableTestMode: true
});

// Trigger test alerts
alertingService.triggerTestAlert('high');
alertingService.simulateSystemAlert('cpu');
```

### Load Testing
Use the provided test scripts to validate alert performance:

```bash
# Run alert load test
npm run test:alerts:load

# Test notification channels
npm run test:alerts:notifications

# Validate escalation policies
npm run test:alerts:escalation
```

## Maintenance and Monitoring

### Health Checks
Monitor the alerting system itself:

```typescript
const health = alertingService.getHealth();
console.log('Alerting service health:', health);
```

### Statistics and Metrics
```typescript
const stats = alertingService.getStatistics();
console.log('Active alerts:', stats.activeAlerts);
console.log('Total rules:', stats.rulesCount);
console.log('Engine uptime:', stats.uptime);
```

### Log Monitoring
Key log patterns to monitor:
- `🚨 NEW ALERT:` - New alerts being created
- `✅ Alert acknowledged:` - Alert acknowledgments
- `📈 ESCALATING:` - Alert escalations
- `❌ Failed to send notification:` - Notification failures

## Best Practices

### Alert Design
1. **Make alerts actionable** - Every alert should have clear next steps
2. **Avoid alert fatigue** - Tune thresholds to minimize false positives
3. **Use severity appropriately** - Reserve critical for true emergencies
4. **Include context** - Provide relevant details and links

### Threshold Management
1. **Start conservative** - Begin with loose thresholds and tighten gradually
2. **Use baselines** - Base thresholds on historical data analysis
3. **Account for patterns** - Consider time-of-day and seasonal variations
4. **Regular review** - Update thresholds monthly based on performance

### Escalation Strategy
1. **Clear ownership** - Define who responds to what types of alerts
2. **Reasonable timeframes** - Allow adequate time for response
3. **Backup coverage** - Ensure escalation paths for all scenarios
4. **Regular testing** - Validate escalation procedures work correctly

### Documentation
1. **Keep runbooks current** - Update procedures after each incident
2. **Include examples** - Provide specific command examples
3. **Link everything** - Connect alerts to relevant dashboards and docs
4. **Regular reviews** - Schedule quarterly documentation updates

## Troubleshooting

### Common Issues

#### Alerts Not Firing
1. Check alert rule configuration
2. Verify monitoring data is flowing
3. Confirm thresholds are appropriate
4. Review evaluation window settings

#### Notification Failures
1. Check channel configuration
2. Verify network connectivity
3. Review rate limiting settings
4. Check authentication credentials

#### Missing Escalations
1. Verify escalation policy assignment
2. Check escalation timing configuration
3. Review suppression rules
4. Confirm on-call schedule accuracy

### Debug Commands
```bash
# Check alerting service status
curl http://localhost:3000/api/alerting/health

# View active alerts
curl http://localhost:3000/api/alerting/alerts

# Get service statistics
curl http://localhost:3000/api/alerting/stats

# Test notification channel
curl -X POST http://localhost:3000/api/alerting/test-notification \
  -H "Content-Type: application/json" \
  -d '{"channelId": "email-primary", "severity": "medium"}'
```

## Future Enhancements

### Planned Features
1. **Machine Learning Integration** - Anomaly detection and adaptive thresholds
2. **Advanced Analytics** - Alert pattern analysis and optimization suggestions
3. **Mobile App** - Dedicated mobile application for alert management
4. **Integration Marketplace** - Pre-built integrations for popular tools
5. **Advanced Templating** - Dynamic templates based on context

### API Extensions
1. **GraphQL Support** - Query alerts with complex filters
2. **Webhook Subscriptions** - Subscribe to specific alert patterns
3. **Bulk Operations** - Batch acknowledge and manage alerts
4. **Historical Analysis** - API for alert trend analysis

---

*This document is maintained as part of the jaqEdu monitoring system. Last updated: [Current Date]*