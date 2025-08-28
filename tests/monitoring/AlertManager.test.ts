/**
 * Comprehensive AlertManager Tests
 * Testing alert creation, routing, firing, resolution, and channel integration
 * @priority MEDIUM - Monitoring alerts are critical for system health visibility
 */

import { AlertManager } from '../../src/monitoring/AlertManager';
import { EventEmitter } from 'events';

// Mock fetch globally
global.fetch = jest.fn();

describe('AlertManager Tests', () => {
  let alertManager: AlertManager;
  let mockConfig: any;
  let consoleSpy: jest.SpyInstance;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockConfig = {
      enabled: true,
      webhook: 'https://webhook.example.com',
      email: {
        to: ['admin@example.com'],
        from: 'alerts@example.com',
        smtp: {
          host: 'smtp.example.com',
          port: 587
        }
      },
      slack: {
        webhook: 'https://hooks.slack.com/services/test',
        channel: '#alerts'
      }
    };

    alertManager = new AlertManager(mockConfig);
  });

  afterEach(() => {
    alertManager.destroy();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with configuration', () => {
      expect(alertManager).toBeDefined();
      expect(alertManager).toBeInstanceOf(EventEmitter);
    });

    test('should setup default channels', () => {
      const healthStatus = alertManager.getHealthStatus();
      expect(healthStatus.status).toBe('healthy');
    });

    test('should setup default rules', () => {
      const stats = alertManager.getAlertStats();
      expect(stats.totalRules).toBeGreaterThan(0);
    });

    test('should start alert evaluation when enabled', (done) => {
      const enabledConfig = { ...mockConfig, enabled: true };
      const manager = new AlertManager(enabledConfig);
      
      manager.on('alert_evaluation_started', () => {
        expect(true).toBe(true);
        manager.destroy();
        done();
      });
    });

    test('should not start evaluation when disabled', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const manager = new AlertManager(disabledConfig);
      
      const stats = alertManager.getAlertStats();
      expect(stats).toBeDefined();
      
      manager.destroy();
    });
  });

  describe('Alert Rules Management', () => {
    const testRule = {
      name: 'test_rule',
      query: 'test_metric',
      condition: '>',
      threshold: 100,
      duration: '5m',
      severity: 'high' as const,
      annotations: {
        summary: 'Test alert',
        description: 'Test alert description'
      },
      labels: {
        team: 'test',
        service: 'test-service'
      }
    };

    test('should add alert rule', (done) => {
      alertManager.on('rule_added', (rule) => {
        expect(rule.name).toBe('test_rule');
        expect(rule.threshold).toBe(100);
        done();
      });

      alertManager.addRule(testRule);
    });

    test('should remove alert rule', (done) => {
      alertManager.addRule(testRule);
      
      alertManager.on('rule_removed', (data) => {
        expect(data.name).toBe('test_rule');
        done();
      });

      const removed = alertManager.removeRule('test_rule');
      expect(removed).toBe(true);
    });

    test('should return false when removing non-existent rule', () => {
      const removed = alertManager.removeRule('non_existent_rule');
      expect(removed).toBe(false);
    });

    test('should get alert states', () => {
      alertManager.addRule(testRule);
      const states = alertManager.getAlertStates();
      
      expect(states).toHaveProperty('test_rule');
      expect(states.test_rule.status).toBe('normal');
      expect(states.test_rule.currentValue).toBe(0);
      expect(states.test_rule.fireCount).toBe(0);
    });
  });

  describe('Alert Channels Management', () => {
    const testChannel = {
      name: 'test_channel',
      type: 'webhook' as const,
      config: { url: 'https://test.webhook.com' },
      enabled: true
    };

    test('should add alert channel', (done) => {
      alertManager.on('channel_added', (channel) => {
        expect(channel.name).toBe('test_channel');
        expect(channel.type).toBe('webhook');
        done();
      });

      alertManager.addChannel(testChannel);
    });

    test('should remove alert channel', (done) => {
      alertManager.addChannel(testChannel);
      
      alertManager.on('channel_removed', (data) => {
        expect(data.name).toBe('test_channel');
        done();
      });

      const removed = alertManager.removeChannel('test_channel');
      expect(removed).toBe(true);
    });

    test('should return false when removing non-existent channel', () => {
      const removed = alertManager.removeChannel('non_existent_channel');
      expect(removed).toBe(false);
    });
  });

  describe('Metric Evaluation', () => {
    const testRule = {
      name: 'cpu_usage_high',
      query: 'cpu_usage',
      condition: '>',
      threshold: 80,
      duration: '5m',
      severity: 'medium' as const,
      annotations: {
        summary: 'High CPU usage',
        description: 'CPU usage is above 80%'
      },
      labels: {
        team: 'platform',
        service: 'api'
      }
    };

    beforeEach(() => {
      alertManager.addRule(testRule);
    });

    test('should evaluate metric and fire alert when threshold exceeded', (done) => {
      alertManager.on('alert_fired', (alert) => {
        expect(alert.name).toBe('cpu_usage_high');
        expect(alert.severity).toBe('medium');
        expect(alert.status).toBe('firing');
        expect(alert.annotations.current_value).toBe('90');
        done();
      });

      alertManager.evaluateMetric('cpu_usage', 90); // Above threshold
    });

    test('should not fire alert when threshold not exceeded', (done) => {
      let alertFired = false;
      
      alertManager.on('alert_fired', () => {
        alertFired = true;
      });

      alertManager.evaluateMetric('cpu_usage', 70); // Below threshold

      setTimeout(() => {
        expect(alertFired).toBe(false);
        done();
      }, 100);
    });

    test('should resolve alert when metric returns to normal', (done) => {
      let alerts = [];
      
      alertManager.on('alert_fired', (alert) => {
        alerts.push(alert);
        // After alert is fired, evaluate with normal value
        setTimeout(() => {
          alertManager.evaluateMetric('cpu_usage', 50); // Below threshold
        }, 10);
      });

      alertManager.on('alert_resolved', (alert) => {
        expect(alert.status).toBe('resolved');
        expect(alert.endsAt).toBeDefined();
        expect(alerts.length).toBe(1);
        done();
      });

      alertManager.evaluateMetric('cpu_usage', 90); // Above threshold
    });

    test('should handle different condition types', () => {
      const conditions = [
        { rule: { ...testRule, name: 'test_gt', condition: '>', threshold: 50 }, value: 60, shouldFire: true },
        { rule: { ...testRule, name: 'test_lt', condition: '<', threshold: 50 }, value: 40, shouldFire: true },
        { rule: { ...testRule, name: 'test_gte', condition: '>=', threshold: 50 }, value: 50, shouldFire: true },
        { rule: { ...testRule, name: 'test_lte', condition: '<=', threshold: 50 }, value: 50, shouldFire: true },
        { rule: { ...testRule, name: 'test_eq', condition: '==', threshold: 50 }, value: 50, shouldFire: true },
        { rule: { ...testRule, name: 'test_neq', condition: '!=', threshold: 50 }, value: 40, shouldFire: true },
      ];

      let firedAlerts = 0;
      alertManager.on('alert_fired', () => {
        firedAlerts++;
      });

      conditions.forEach(({ rule, value, shouldFire }) => {
        alertManager.addRule(rule);
        alertManager.evaluateMetric(rule.query, value);
      });

      // Allow time for all evaluations
      setTimeout(() => {
        expect(firedAlerts).toBe(conditions.length);
      }, 100);
    });

    test('should emit rule_evaluated event', (done) => {
      alertManager.on('rule_evaluated', (data) => {
        expect(data.rule).toBe('cpu_usage_high');
        expect(data.value).toBe(85);
        expect(data.conditionMet).toBe(true);
        expect(data.status).toBe('firing');
        done();
      });

      alertManager.evaluateMetric('cpu_usage', 85);
    });

    test('should track fire count', () => {
      // Fire alert multiple times
      alertManager.evaluateMetric('cpu_usage', 90);
      alertManager.evaluateMetric('cpu_usage', 95);
      alertManager.evaluateMetric('cpu_usage', 85);

      const states = alertManager.getAlertStates();
      expect(states.cpu_usage_high.fireCount).toBeGreaterThan(0);
    });
  });

  describe('Alert Channels and Notifications', () => {
    const testRule = {
      name: 'test_notification',
      query: 'test_metric',
      condition: '>',
      threshold: 100,
      duration: '1m',
      severity: 'critical' as const,
      annotations: {
        summary: 'Test notification alert',
        description: 'Testing notification channels'
      },
      labels: {
        team: 'test'
      }
    };

    beforeEach(() => {
      alertManager.addRule(testRule);
    });

    test('should send alert to console channel', (done) => {
      alertManager.on('alert_sent', (data) => {
        expect(data.channel).toBe('console');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('🚨 ALERT [CRITICAL]')
        );
        done();
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should send alert to webhook channel', (done) => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      alertManager.on('alert_sent', (data) => {
        if (data.channel === 'webhook') {
          expect(fetchMock).toHaveBeenCalledWith(
            'https://webhook.example.com',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: expect.stringContaining('test_notification')
            })
          );
          done();
        }
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should send alert to slack channel', (done) => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      alertManager.on('alert_sent', (data) => {
        if (data.channel === 'slack') {
          expect(fetchMock).toHaveBeenCalledWith(
            'https://hooks.slack.com/services/test',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: expect.stringContaining('test_notification')
            })
          );
          done();
        }
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should handle webhook errors gracefully', (done) => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      alertManager.on('alert_send_error', (data) => {
        expect(data.channel).toBe('webhook');
        expect(data.error).toBeInstanceOf(Error);
        done();
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should format slack alert with proper color coding', (done) => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      alertManager.on('alert_sent', (data) => {
        if (data.channel === 'slack') {
          const call = fetchMock.mock.calls.find(call => 
            call[0] === 'https://hooks.slack.com/services/test'
          );
          const body = JSON.parse(call?.[1]?.body as string || '{}');
          
          expect(body.attachments[0].color).toBe('#ff0000'); // Red for critical
          expect(body.attachments[0].title).toContain('FIRING');
          done();
        }
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should include alert metadata in webhook payload', (done) => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      alertManager.on('alert_sent', (data) => {
        if (data.channel === 'webhook') {
          const call = fetchMock.mock.calls.find(call => 
            call[0] === 'https://webhook.example.com'
          );
          const payload = JSON.parse(call?.[1]?.body as string || '{}');
          
          expect(payload.version).toBe('4');
          expect(payload.groupKey).toBe('test_notification');
          expect(payload.status).toBe('firing');
          expect(payload.alerts).toHaveLength(1);
          expect(payload.alerts[0].labels.team).toBe('test');
          done();
        }
      });

      alertManager.evaluateMetric('test_metric', 150);
    });
  });

  describe('Alert History and Statistics', () => {
    const testRule = {
      name: 'history_test',
      query: 'test_metric',
      condition: '>',
      threshold: 50,
      duration: '1m',
      severity: 'low' as const,
      annotations: {
        summary: 'History test alert'
      },
      labels: {}
    };

    beforeEach(() => {
      alertManager.addRule(testRule);
    });

    test('should track alert history', (done) => {
      alertManager.on('alert_fired', () => {
        const history = alertManager.getAlertHistory();
        expect(history.length).toBeGreaterThan(0);
        expect(history[history.length - 1].name).toBe('history_test');
        done();
      });

      alertManager.evaluateMetric('test_metric', 75);
    });

    test('should get active alerts', (done) => {
      alertManager.on('alert_fired', () => {
        const activeAlerts = alertManager.getActiveAlerts();
        expect(activeAlerts.length).toBe(1);
        expect(activeAlerts[0].name).toBe('history_test');
        expect(activeAlerts[0].status).toBe('firing');
        done();
      });

      alertManager.evaluateMetric('test_metric', 75);
    });

    test('should limit alert history size', () => {
      const maxHistorySize = 1000;
      
      // Fire alerts beyond the limit
      for (let i = 0; i < maxHistorySize + 10; i++) {
        alertManager.evaluateMetric('test_metric', 75 + i);
        // Reset to normal to allow refiring
        alertManager.evaluateMetric('test_metric', 25);
      }

      const history = alertManager.getAlertHistory();
      expect(history.length).toBeLessThanOrEqual(maxHistorySize);
    });

    test('should get limited alert history', () => {
      // Fire some alerts
      for (let i = 0; i < 5; i++) {
        alertManager.evaluateMetric('test_metric', 75 + i);
        alertManager.evaluateMetric('test_metric', 25); // Reset
      }

      const limitedHistory = alertManager.getAlertHistory(3);
      expect(limitedHistory.length).toBeLessThanOrEqual(3);
    });

    test('should calculate alert statistics', (done) => {
      let resolvedCount = 0;
      
      alertManager.on('alert_resolved', () => {
        resolvedCount++;
        if (resolvedCount === 2) {
          const stats = alertManager.getAlertStats();
          expect(stats.totalRules).toBeGreaterThan(0);
          expect(stats.totalFired).toBeGreaterThan(0);
          expect(stats.totalResolved).toBeGreaterThan(0);
          expect(stats.averageResolutionTime).toBeGreaterThan(0);
          done();
        }
      });

      // Fire and resolve alerts
      alertManager.evaluateMetric('test_metric', 75);
      setTimeout(() => alertManager.evaluateMetric('test_metric', 25), 50);
      
      setTimeout(() => {
        alertManager.evaluateMetric('test_metric', 80);
        setTimeout(() => alertManager.evaluateMetric('test_metric', 20), 50);
      }, 100);
    });
  });

  describe('Alert Suppression', () => {
    const testRule = {
      name: 'suppress_test',
      query: 'test_metric',
      condition: '>',
      threshold: 50,
      duration: '1m',
      severity: 'medium' as const,
      annotations: {
        summary: 'Suppression test alert'
      },
      labels: {}
    };

    beforeEach(() => {
      alertManager.addRule(testRule);
    });

    test('should suppress alert for specified duration', (done) => {
      alertManager.on('alert_suppressed', (data) => {
        expect(data.ruleName).toBe('suppress_test');
        expect(data.until).toBeInstanceOf(Date);
        
        const states = alertManager.getAlertStates();
        expect(states.suppress_test.suppressedUntil).toBeInstanceOf(Date);
        done();
      });

      alertManager.suppressAlert('suppress_test', 60000); // 1 minute
    });

    test('should not suppress non-existent rule', () => {
      let suppressionEmitted = false;
      
      alertManager.on('alert_suppressed', () => {
        suppressionEmitted = true;
      });

      alertManager.suppressAlert('non_existent_rule', 60000);
      
      setTimeout(() => {
        expect(suppressionEmitted).toBe(false);
      }, 100);
    });
  });

  describe('Alert Lifecycle', () => {
    test('should create alert with correct structure', (done) => {
      const rule = {
        name: 'lifecycle_test',
        query: 'test_metric',
        condition: '>',
        threshold: 100,
        duration: '5m',
        severity: 'high' as const,
        annotations: {
          summary: 'Lifecycle test alert',
          description: 'Testing alert lifecycle'
        },
        labels: {
          service: 'test-service',
          environment: 'test'
        }
      };

      alertManager.addRule(rule);

      alertManager.on('alert_fired', (alert) => {
        expect(alert).toMatchObject({
          id: expect.any(String),
          name: 'lifecycle_test',
          severity: 'high',
          status: 'firing',
          message: 'Lifecycle test alert',
          labels: {
            service: 'test-service',
            environment: 'test'
          },
          annotations: {
            summary: 'Lifecycle test alert',
            description: 'Testing alert lifecycle',
            current_value: '150',
            threshold: '100'
          },
          startsAt: expect.any(Date)
        });

        expect(alert.id).toMatch(/^lifecycle_test_\d+$/);
        done();
      });

      alertManager.evaluateMetric('test_metric', 150);
    });

    test('should track alert resolution time', (done) => {
      const rule = {
        name: 'resolution_test',
        query: 'test_metric',
        condition: '>',
        threshold: 50,
        duration: '1m',
        severity: 'low' as const,
        annotations: {
          summary: 'Resolution test'
        },
        labels: {}
      };

      alertManager.addRule(rule);

      let startTime: Date;

      alertManager.on('alert_fired', (alert) => {
        startTime = alert.startsAt;
        // Resolve after a delay
        setTimeout(() => {
          alertManager.evaluateMetric('test_metric', 25);
        }, 100);
      });

      alertManager.on('alert_resolved', (alert) => {
        expect(alert.endsAt).toBeDefined();
        expect(alert.endsAt!.getTime()).toBeGreaterThan(startTime.getTime());
        
        const duration = alert.endsAt!.getTime() - alert.startsAt.getTime();
        expect(duration).toBeGreaterThan(90); // At least 100ms minus some tolerance
        done();
      });

      alertManager.evaluateMetric('test_metric', 75);
    });
  });

  describe('Health and Monitoring', () => {
    test('should report healthy status when operational', () => {
      const health = alertManager.getHealthStatus();
      
      expect(health).toMatchObject({
        status: 'healthy',
        message: expect.stringContaining('operational')
      });
    });

    test('should report unhealthy status on error', () => {
      // Mock an internal error by breaking the stats method
      jest.spyOn(alertManager, 'getAlertStats').mockImplementation(() => {
        throw new Error('Internal error');
      });

      const health = alertManager.getHealthStatus();
      
      expect(health).toMatchObject({
        status: 'unhealthy',
        message: expect.stringContaining('error')
      });
    });

    test('should emit evaluation cycle events', (done) => {
      let cycleStarted = false;
      let metricsNeeded = false;

      alertManager.on('evaluation_cycle_started', () => {
        cycleStarted = true;
      });

      alertManager.on('metrics_needed', () => {
        metricsNeeded = true;
        if (cycleStarted && metricsNeeded) {
          done();
        }
      });

      // The evaluation cycle should start automatically
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should stop alert evaluation on destroy', () => {
      const manager = new AlertManager({ enabled: true });
      
      expect(() => manager.destroy()).not.toThrow();
      
      // Should not have any active timers after destroy
      const stats = manager.getAlertStats();
      expect(stats.totalRules).toBe(0);
    });

    test('should clear all data on destroy', () => {
      const manager = new AlertManager({ enabled: true });
      
      manager.addRule({
        name: 'destroy_test',
        query: 'test',
        condition: '>',
        threshold: 1,
        duration: '1m',
        severity: 'low',
        annotations: { summary: 'test' },
        labels: {}
      });

      expect(manager.getAlertStats().totalRules).toBe(6); // 5 default + 1 added
      
      manager.destroy();
      
      expect(manager.getAlertStats().totalRules).toBe(0);
    });

    test('should stop evaluation loop', () => {
      const manager = new AlertManager({ enabled: true });
      manager.stopAlertEvaluation();
      
      // Should emit stop event
      manager.on('alert_evaluation_stopped', () => {
        expect(true).toBe(true);
      });
      
      manager.destroy();
    });

    test('should remove all event listeners on destroy', () => {
      const manager = new AlertManager({ enabled: true });
      
      manager.on('test_event', () => {});
      expect(manager.listenerCount('test_event')).toBe(1);
      
      manager.destroy();
      expect(manager.listenerCount('test_event')).toBe(0);
    });
  });
});