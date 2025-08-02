/**
 * Alerting System Tests
 * Comprehensive test suite for the alerting system components
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AlertingEngine, AlertState } from '../../services/alerting/AlertingEngine';
import { AlertingService } from '../../services/alerting/AlertingService';
import { ALERT_RULES } from '../../config/alertingThresholds';
import { NOTIFICATION_CHANNELS } from '../../config/notificationChannels';
import { PerformanceAlert } from '../../services/resourcePipeline/monitoring';

// Mock console methods to avoid noise in tests
global.console = {
  ...global.console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('AlertingEngine', () => {
  let alertingEngine: AlertingEngine;

  beforeEach(() => {
    alertingEngine = new AlertingEngine();
    // Disable automatic evaluation for testing
    (alertingEngine as any).enabled = false;
  });

  afterEach(() => {
    alertingEngine.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default alert rules', () => {
      const stats = alertingEngine.getStatistics();
      expect(stats.rulesCount).toBeGreaterThan(0);
      expect(stats.activeAlerts).toBe(0);
      expect(stats.totalAlerts).toBe(0);
    });

    it('should load enabled rules only', () => {
      const enabledRules = ALERT_RULES.filter(rule => rule.enabled);
      const stats = alertingEngine.getStatistics();
      expect(stats.rulesCount).toBe(enabledRules.length);
    });
  });

  describe('Alert Management', () => {
    it('should acknowledge alerts correctly', () => {
      // Create a mock alert state
      const alertState: AlertState = {
        id: 'test-alert-1',
        ruleId: 'sys-cpu-high',
        status: 'firing',
        severity: 'high',
        category: 'system',
        firstSeen: new Date(),
        lastSeen: new Date(),
        count: 1,
        acknowledged: false,
        escalationLevel: 0,
        metadata: {}
      };

      // Add to internal state (accessing private method for testing)
      (alertingEngine as any).alertStates.set('test-state', alertState);

      const acknowledged = alertingEngine.acknowledgeAlert('test-alert-1', 'test-user');
      expect(acknowledged).toBe(true);

      const updatedState = (alertingEngine as any).alertStates.get('test-state');
      expect(updatedState.acknowledged).toBe(true);
      expect(updatedState.acknowledgedBy).toBe('test-user');
    });

    it('should return false when acknowledging non-existent alert', () => {
      const acknowledged = alertingEngine.acknowledgeAlert('non-existent', 'test-user');
      expect(acknowledged).toBe(false);
    });

    it('should get active alerts correctly', () => {
      // Initially no active alerts
      const activeAlerts = alertingEngine.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should enable and disable correctly', () => {
      alertingEngine.setEnabled(true);
      expect(alertingEngine.getStatistics().enabled).toBe(true);

      alertingEngine.setEnabled(false);
      expect(alertingEngine.getStatistics().enabled).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit events correctly', (done) => {
      alertingEngine.on('alert_acknowledged', (alertState: AlertState) => {
        expect(alertState.acknowledged).toBe(true);
        done();
      });

      // Create and acknowledge an alert
      const alertState: AlertState = {
        id: 'test-alert-event',
        ruleId: 'sys-cpu-high',
        status: 'firing',
        severity: 'high',
        category: 'system',
        firstSeen: new Date(),
        lastSeen: new Date(),
        count: 1,
        acknowledged: false,
        escalationLevel: 0,
        metadata: {}
      };

      (alertingEngine as any).alertStates.set('test-state-event', alertState);
      alertingEngine.acknowledgeAlert('test-alert-event', 'test-user');
    });
  });
});

describe('AlertingService', () => {
  let alertingService: AlertingService;

  beforeEach(() => {
    alertingService = new AlertingService({
      enableAutoStart: false,
      enableTestMode: true
    });
  });

  afterEach(() => {
    alertingService.stop();
  });

  describe('Initialization', () => {
    it('should initialize without auto-start', () => {
      const health = alertingService.getHealth();
      expect(health.status).toBe('stopped');
      expect(health.details.running).toBe(false);
    });

    it('should initialize with test mode enabled', () => {
      const stats = alertingService.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('Service Management', () => {
    it('should start and stop correctly', () => {
      alertingService.start();
      expect(alertingService.getHealth().status).toBe('healthy');

      alertingService.stop();
      expect(alertingService.getHealth().status).toBe('stopped');
    });

    it('should not start if already running', () => {
      alertingService.start();
      const consoleSpy = jest.spyOn(console, 'warn');
      
      alertingService.start(); // Try to start again
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Alerting service is already running');
    });
  });

  describe('Alert History', () => {
    it('should maintain alert history', () => {
      const initialHistory = alertingService.getAlertHistory();
      expect(Array.isArray(initialHistory)).toBe(true);
    });

    it('should filter alert history by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const filteredHistory = alertingService.getAlertHistory(startDate, endDate);
      expect(Array.isArray(filteredHistory)).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        pollingInterval: 60000, // 60 seconds
        alertRetentionDays: 60
      };

      alertingService.updateConfig(newConfig);
      const stats = alertingService.getStatistics();
      expect(stats.pollingInterval).toBe(60000);
    });
  });

  describe('Test Mode', () => {
    it('should trigger test alerts in test mode', (done) => {
      alertingService.on('alert_fired', (alert: PerformanceAlert) => {
        expect(alert.data.testMode).toBe(true);
        expect(alert.severity).toBe('medium');
        done();
      });

      alertingService.triggerTestAlert('medium');
    });

    it('should simulate system alerts', (done) => {
      alertingService.on('alert_fired', (alert: PerformanceAlert) => {
        expect(alert.data.simulationType).toBe('cpu');
        expect(alert.data.testMode).toBe(true);
        expect(alert.message).toContain('High CPU usage detected');
        done();
      });

      alertingService.simulateSystemAlert('cpu');
    });

    it('should not trigger test alerts when test mode is disabled', () => {
      const alertingServiceNoTest = new AlertingService({
        enableTestMode: false
      });

      const consoleSpy = jest.spyOn(console, 'warn');
      alertingServiceNoTest.triggerTestAlert();
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Test mode is disabled');
      alertingServiceNoTest.stop();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const stats = alertingService.getStatistics();
      
      expect(stats).toHaveProperty('rulesCount');
      expect(stats).toHaveProperty('activeAlerts');
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('integrationMode');
      expect(stats).toHaveProperty('totalHistoryAlerts');
      expect(stats).toHaveProperty('pollingInterval');
    });
  });

  describe('Health Monitoring', () => {
    it('should report health status correctly', () => {
      const health = alertingService.getHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
      expect(health.details).toHaveProperty('running');
      expect(health.details).toHaveProperty('activeAlerts');
      expect(health.details).toHaveProperty('engineEnabled');
    });
  });
});

describe('Alert Integration Tests', () => {
  let alertingService: AlertingService;

  beforeEach(() => {
    alertingService = new AlertingService({
      enableAutoStart: true,
      enableTestMode: true,
      integrationMode: 'polling',
      pollingInterval: 1000 // 1 second for testing
    });
  });

  afterEach(() => {
    alertingService.stop();
  });

  describe('End-to-End Alert Flow', () => {
    it('should handle complete alert lifecycle', (done) => {
      let alertFired = false;
      let alertAcknowledged = false;

      alertingService.on('alert_fired', (alert: PerformanceAlert) => {
        alertFired = true;
        
        // Acknowledge the alert
        setTimeout(() => {
          const acknowledged = alertingService.acknowledgeAlert(alert.id, 'test-user');
          expect(acknowledged).toBe(true);
        }, 100);
      });

      alertingService.on('alert_acknowledged', (alertState: AlertState) => {
        alertAcknowledged = true;
        expect(alertState.acknowledgedBy).toBe('test-user');
        
        // Verify both events occurred
        expect(alertFired).toBe(true);
        expect(alertAcknowledged).toBe(true);
        done();
      });

      // Trigger test alert
      alertingService.triggerTestAlert('high');
    });

    it('should maintain alert counts correctly', async () => {
      const initialStats = alertingService.getStatistics();
      const initialAlertCount = initialStats.totalHistoryAlerts;

      // Trigger multiple test alerts
      alertingService.triggerTestAlert('low');
      alertingService.triggerTestAlert('medium');
      alertingService.triggerTestAlert('high');

      // Wait for alerts to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalStats = alertingService.getStatistics();
      expect(finalStats.totalHistoryAlerts).toBe(initialAlertCount + 3);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate notification channels', () => {
      const emailChannel = NOTIFICATION_CHANNELS.find(ch => ch.type === 'email');
      expect(emailChannel).toBeDefined();
      expect(emailChannel?.enabled).toBeDefined();
      expect(emailChannel?.config).toBeDefined();
    });

    it('should validate alert rules', () => {
      const systemRules = ALERT_RULES.filter(rule => rule.category === 'system');
      expect(systemRules.length).toBeGreaterThan(0);
      
      systemRules.forEach(rule => {
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(rule.threshold).toBeDefined();
        expect(rule.evaluationWindow).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      const serviceWithMinimalConfig = new AlertingService({});
      expect(serviceWithMinimalConfig.getHealth().status).toBe('healthy');
      serviceWithMinimalConfig.stop();
    });

    it('should handle invalid alert acknowledgment', () => {
      const result = alertingService.acknowledgeAlert('invalid-id', 'test-user');
      expect(result).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple simultaneous alerts', async () => {
      const alertPromises: Promise<void>[] = [];
      const alertCount = 10;

      for (let i = 0; i < alertCount; i++) {
        const promise = new Promise<void>((resolve) => {
          alertingService.once('alert_fired', () => resolve());
          alertingService.triggerTestAlert('medium');
        });
        alertPromises.push(promise);
      }

      await Promise.all(alertPromises);
      
      const stats = alertingService.getStatistics();
      expect(stats.totalHistoryAlerts).toBeGreaterThanOrEqual(alertCount);
    });

    it('should maintain performance under load', async () => {
      const start = Date.now();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        alertingService.triggerTestAlert('low');
      }

      // Wait for all alerts to be processed
      await new Promise(resolve => setTimeout(resolve, 500));

      const duration = Date.now() - start;
      const avgTimePerAlert = duration / iterations;
      
      // Should process alerts quickly (less than 50ms per alert on average)
      expect(avgTimePerAlert).toBeLessThan(50);
    });
  });
});

describe('Alert Rule Validation', () => {
  describe('System Alert Rules', () => {
    it('should have valid CPU usage rules', () => {
      const cpuRule = ALERT_RULES.find(rule => rule.id === 'sys-cpu-high');
      expect(cpuRule).toBeDefined();
      expect(cpuRule?.threshold).toBe(85);
      expect(cpuRule?.severity).toBe('high');
      expect(cpuRule?.category).toBe('system');
    });

    it('should have valid memory usage rules', () => {
      const memoryRule = ALERT_RULES.find(rule => rule.id === 'sys-memory-critical');
      expect(memoryRule).toBeDefined();
      expect(memoryRule?.threshold).toBe(90);
      expect(memoryRule?.severity).toBe('critical');
    });
  });

  describe('Application Alert Rules', () => {
    it('should have valid pipeline error rate rules', () => {
      const pipelineRule = ALERT_RULES.find(rule => rule.id === 'app-pipeline-error-rate');
      expect(pipelineRule).toBeDefined();
      expect(pipelineRule?.threshold).toBe(0.1);
      expect(pipelineRule?.category).toBe('application');
    });

    it('should have valid API response time rules', () => {
      const apiRule = ALERT_RULES.find(rule => rule.id === 'app-api-response-time');
      expect(apiRule).toBeDefined();
      expect(apiRule?.threshold).toBe(2000);
      expect(apiRule?.severity).toBe('medium');
    });
  });

  describe('Security Alert Rules', () => {
    it('should have valid failed login rules', () => {
      const securityRule = ALERT_RULES.find(rule => rule.id === 'sec-failed-logins');
      expect(securityRule).toBeDefined();
      expect(securityRule?.category).toBe('security');
      expect(securityRule?.severity).toBe('high');
    });
  });
});

describe('Notification Channel Validation', () => {
  it('should have required notification channels', () => {
    const channelTypes = NOTIFICATION_CHANNELS.map(ch => ch.type);
    
    expect(channelTypes).toContain('email');
    expect(channelTypes).toContain('webhook');
    expect(channelTypes).toContain('in-app');
    expect(channelTypes).toContain('slack');
  });

  it('should have valid email configuration', () => {
    const emailChannel = NOTIFICATION_CHANNELS.find(ch => ch.type === 'email');
    
    expect(emailChannel?.config.from).toBeDefined();
    expect(emailChannel?.template?.subject).toBeDefined();
    expect(emailChannel?.template?.body).toBeDefined();
    expect(emailChannel?.retryPolicy).toBeDefined();
  });

  it('should have valid webhook configuration', () => {
    const webhookChannel = NOTIFICATION_CHANNELS.find(ch => ch.type === 'webhook');
    
    expect(webhookChannel?.config.method).toBe('POST');
    expect(webhookChannel?.config.headers).toBeDefined();
    expect(webhookChannel?.retryPolicy.maxRetries).toBeGreaterThan(0);
  });
});