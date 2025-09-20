/**
 * Comprehensive test suite for AlertingService
 * Tests service integration, event handling, monitoring, and configuration management
 * Targets 90%+ coverage for alerting service functionality
 */

import { AlertingService, AlertingServiceConfig } from '../AlertingService';
import { AlertingEngine, AlertState } from '../AlertingEngine';
import { PipelineMonitoringService, PerformanceAlert, PipelineMetrics, PipelineStatus } from '../../resourcePipeline/monitoring';
import { EventEmitter } from 'events';

class MockAlertingEngine extends EventEmitter {
  stop = jest.fn();
  getActiveAlerts = jest.fn().mockReturnValue([]);
  getStatistics = jest.fn().mockReturnValue({
    rulesCount: 5,
    activeAlerts: 2,
    totalAlerts: 10,
    enabled: true
  });
  acknowledgeAlert = jest.fn().mockReturnValue(true);
  createTestAlert = jest.fn();
  enable = jest.fn();
  disable = jest.fn();
  on: jest.Mock;

  constructor() {
    super();
    this.on = jest.fn((event: string | symbol, listener: (...args: any[]) => void) => {
      super.on(event, listener);
      return this;
    });
  }
}

// Mock PipelineMonitoringService
class MockPipelineMonitoringService extends EventEmitter {
  getMetrics = jest.fn().mockReturnValue({
    totalPipelines: 10,
    activePipelines: 5,
    errorRate: 0.05,
    averageProcessingTime: 120000,
    qualityScores: { average: 0.85 }
  });
  
  getStatus = jest.fn().mockReturnValue({
    overall: 'healthy',
    components: []
  });
}

describe('AlertingService', () => {
  let service: AlertingService;
  let mockMonitoringService: MockPipelineMonitoringService;
  let mockEngine: MockAlertingEngine;

  const defaultConfig: AlertingServiceConfig = {
    enableAutoStart: false,
    integrationMode: 'polling',
    pollingInterval: 5000,
    alertRetentionDays: 30,
    enableTestMode: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    mockMonitoringService = new MockPipelineMonitoringService();
    mockEngine = new MockAlertingEngine();

    service = new AlertingService(defaultConfig, mockEngine as unknown as AlertingEngine);
  });

  afterEach(() => {
    if (service) {
      service.stop();
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new AlertingService();
      const stats = defaultService.getStatistics();
      
      expect(stats.integrationMode).toBe('hybrid');
      expect(stats.pollingInterval).toBe(30000);
      expect(stats.isRunning).toBe(true); // Auto-start enabled by default
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enableAutoStart: false,
        integrationMode: 'real-time' as const,
        pollingInterval: 15000,
        alertRetentionDays: 7,
        enableTestMode: false
      };

      const customService = new AlertingService(customConfig);
      const stats = customService.getStatistics();

      expect(stats.integrationMode).toBe('real-time');
      expect(stats.pollingInterval).toBe(15000);
      expect(stats.isRunning).toBe(false);

      customService.stop();
    });

    it('should setup event handlers for alerting engine', () => {
      expect(mockEngine.on).toHaveBeenCalledWith('alert_fired', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('alert_resolved', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('alert_acknowledged', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('alert_escalated', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('in_app_notification', expect.any(Function));
      expect(mockEngine.on).toHaveBeenCalledWith('evaluation_error', expect.any(Function));
    });

    it('should log initialization message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      new AlertingService(defaultConfig).stop();
      expect(consoleSpy).toHaveBeenCalledWith('🔔 Alerting Service initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('Service Control', () => {
    it('should start service successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.start();
      
      expect(service.getStatistics().isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Alerting service started in polling mode');
      
      consoleSpy.mockRestore();
    });

    it('should not start service if already running', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      service.start();
      service.start(); // Second call should warn
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Alerting service is already running');
      
      consoleWarnSpy.mockRestore();
    });

    it('should stop service successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.start();
      service.stop();
      
      expect(service.getStatistics().isRunning).toBe(false);
      expect(mockEngine.stop).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Alerting service stopped');
      
      consoleSpy.mockRestore();
    });

    it('should handle stop when not running', () => {
      // Should not throw error
      expect(() => service.stop()).not.toThrow();
    });

    it('should emit service events', () => {
      const startHandler = jest.fn();
      const stopHandler = jest.fn();
      
      service.on('service_started', startHandler);
      service.on('service_stopped', stopHandler);
      
      service.start();
      service.stop();
      
      expect(startHandler).toHaveBeenCalled();
      expect(stopHandler).toHaveBeenCalled();
    });
  });

  describe('Monitoring Integration', () => {
    it('should connect to monitoring service successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.connectToMonitoring(mockMonitoringService);
      
      expect(consoleSpy).toHaveBeenCalledWith('🔗 Connected alerting service to monitoring system');
      
      consoleSpy.mockRestore();
    });

    it('should setup real-time mode event handlers', () => {
      const realTimeService = new AlertingService({
        ...defaultConfig,
        integrationMode: 'real-time'
      });
      
      const eventSpy = jest.spyOn(mockMonitoringService, 'on');
      realTimeService.connectToMonitoring(mockMonitoringService);
      
      expect(eventSpy).toHaveBeenCalledWith('pipeline_event_monitored', expect.any(Function));
      expect(eventSpy).toHaveBeenCalledWith('health_check_complete', expect.any(Function));
      expect(eventSpy).toHaveBeenCalledWith('alert_created', expect.any(Function));
      
      realTimeService.stop();
    });

    it('should setup hybrid mode event handlers', () => {
      const hybridService = new AlertingService({
        ...defaultConfig,
        integrationMode: 'hybrid'
      });
      
      const eventSpy = jest.spyOn(mockMonitoringService, 'on');
      hybridService.connectToMonitoring(mockMonitoringService);
      
      expect(eventSpy).toHaveBeenCalledWith('pipeline_event_monitored', expect.any(Function));
      
      hybridService.stop();
    });

    it('should setup event handlers even in polling mode', () => {
      const eventSpy = jest.spyOn(mockMonitoringService, 'on');
      service.connectToMonitoring(mockMonitoringService);

      expect(eventSpy).toHaveBeenCalledWith('pipeline_event_monitored', expect.any(Function));
      expect(eventSpy).toHaveBeenCalledWith('health_check_complete', expect.any(Function));
      expect(eventSpy).toHaveBeenCalledWith('alert_created', expect.any(Function));
    });
  });

  describe('Polling Mechanism', () => {
    beforeEach(() => {
      service.connectToMonitoring(mockMonitoringService);
    });

    it('should start polling when service starts', () => {
      service.start();
      
      expect(service.getStatistics().isRunning).toBe(true);
    });

    it('should poll metrics at configured interval', async () => {
      service.start();
      
      // Fast-forward timers to trigger polling
      jest.advanceTimersByTime(5000);
      
      expect(mockMonitoringService.getMetrics).toHaveBeenCalled();
      expect(mockMonitoringService.getStatus).toHaveBeenCalled();
    });

    it('should emit metric threshold exceeded events', async () => {
      const thresholdHandler = jest.fn();
      service.on('metric_threshold_exceeded', thresholdHandler);
      
      // Mock high error rate
      mockMonitoringService.getMetrics.mockReturnValue({
        errorRate: 0.15, // Above 0.1 threshold
        averageProcessingTime: 100000,
        qualityScores: { average: 0.8 }
      });
      
      service.start();
      jest.advanceTimersByTime(5000);
      
      expect(thresholdHandler).toHaveBeenCalledWith({
        metric: 'errorRate',
        value: 0.15,
        threshold: 0.1
      });
    });

    it('should emit processing time threshold events', async () => {
      const thresholdHandler = jest.fn();
      service.on('metric_threshold_exceeded', thresholdHandler);
      
      mockMonitoringService.getMetrics.mockReturnValue({
        errorRate: 0.05,
        averageProcessingTime: 350000, // Above 300000 threshold
        qualityScores: { average: 0.8 }
      });
      
      service.start();
      jest.advanceTimersByTime(5000);
      
      expect(thresholdHandler).toHaveBeenCalledWith({
        metric: 'processingTime',
        value: 350000,
        threshold: 300000
      });
    });

    it('should emit quality score threshold events', async () => {
      const thresholdHandler = jest.fn();
      service.on('metric_threshold_exceeded', thresholdHandler);
      
      mockMonitoringService.getMetrics.mockReturnValue({
        errorRate: 0.05,
        averageProcessingTime: 100000,
        qualityScores: { average: 0.5 } // Below 0.6 threshold
      });
      
      service.start();
      jest.advanceTimersByTime(5000);
      
      expect(thresholdHandler).toHaveBeenCalledWith({
        metric: 'qualityScore',
        value: 0.5,
        threshold: 0.6
      });
    });

    it('should handle polling errors gracefully', async () => {
      const errorHandler = jest.fn();
      service.on('polling_error', errorHandler);
      
      mockMonitoringService.getMetrics.mockImplementation(() => {
        throw new Error('Metrics unavailable');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.start();
      jest.advanceTimersByTime(5000);
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Error polling metrics:', expect.any(Error));
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should not poll without monitoring service', () => {
      const serviceWithoutMonitoring = new AlertingService(defaultConfig);
      
      serviceWithoutMonitoring.start();
      jest.advanceTimersByTime(5000);
      
      // Should not call getMetrics since no monitoring service connected
      expect(mockMonitoringService.getMetrics).not.toHaveBeenCalled();
      
      serviceWithoutMonitoring.stop();
    });

    it('should stop polling when service stops', () => {
      service.start();
      const initialCallCount = mockMonitoringService.getMetrics.mock.calls.length;
      
      service.stop();
      jest.advanceTimersByTime(10000);
      
      // Should not have additional calls after stopping
      expect(mockMonitoringService.getMetrics.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Event Handling', () => {
    it('should handle monitoring events', () => {
      const eventAlertHandler = jest.fn();
      service.on('event_alert_created', eventAlertHandler);
      
      service.connectToMonitoring(mockMonitoringService);
      service.start();
      
      const mockEvent = {
        type: 'error',
        timestamp: new Date(),
        moduleId: 'test-module',
        data: { error: { message: 'Test error' } }
      };
      
      mockMonitoringService.emit('pipeline_event_monitored', mockEvent);
      
      expect(eventAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          severity: 'high',
          message: expect.stringContaining('Test error'),
          moduleId: 'test-module'
        })
      );
    });

    it('should handle health check events', () => {
      const healthAlertHandler = jest.fn();
      service.on('health_alert_created', healthAlertHandler);
      
      service.connectToMonitoring(mockMonitoringService);
      
      const unhealthyData = {
        status: 'unhealthy',
        timestamp: new Date(),
        issues: ['Database connection failed', 'High memory usage']
      };
      
      mockMonitoringService.emit('health_check_complete', unhealthyData);
      
      expect(healthAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'health',
          severity: 'critical',
          message: 'Health check failed: Database connection failed, High memory usage'
        })
      );
    });

    it('should process monitoring alerts', () => {
      const monitoringAlertHandler = jest.fn();
      service.on('monitoring_alert', monitoringAlertHandler);
      
      service.connectToMonitoring(mockMonitoringService);
      
      const mockAlert: PerformanceAlert = {
        id: 'alert-123',
        type: 'error',
        severity: 'high',
        message: 'High error rate detected',
        timestamp: new Date(),
        acknowledged: false
      };
      
      mockMonitoringService.emit('alert_created', mockAlert);
      
      expect(monitoringAlertHandler).toHaveBeenCalledWith(mockAlert);
    });

    it('should determine severity from event type', () => {
      const eventAlertHandler = jest.fn();
      service.on('event_alert_created', eventAlertHandler);
      
      service.connectToMonitoring(mockMonitoringService);
      
      const testCases = [
        { type: 'critical_error', expected: 'critical' },
        { type: 'system_failure', expected: 'critical' },
        { type: 'error', expected: 'high' },
        { type: 'pipeline_failure', expected: 'high' },
        { type: 'warning', expected: null },
        { type: 'performance_degradation', expected: null },
        { type: 'info', expected: null }
      ];
      
      testCases.forEach(({ type, expected }) => {
        const mockEvent = {
          type,
          timestamp: new Date(),
          data: { error: { message: `${type} message` } }
        };
        
        const beforeCount = eventAlertHandler.mock.calls.length;
        mockMonitoringService.emit('pipeline_event_monitored', mockEvent);

        if (expected === null) {
          expect(eventAlertHandler.mock.calls.length).toBe(beforeCount);
        } else {
          expect(eventAlertHandler.mock.calls.length).toBe(beforeCount + 1);
          const lastCall = eventAlertHandler.mock.calls[beforeCount][0];
          expect(lastCall).toEqual(expect.objectContaining({ severity: expected }));
        }
      });
    });

    it('should only create alerts for error and failure events', () => {
      const eventAlertHandler = jest.fn();
      service.on('event_alert_created', eventAlertHandler);
      
      service.connectToMonitoring(mockMonitoringService);
      
      const infoEvent = { type: 'info', timestamp: new Date() };
      const errorEvent = { type: 'error', timestamp: new Date() };
      
      mockMonitoringService.emit('pipeline_event_monitored', infoEvent);
      mockMonitoringService.emit('pipeline_event_monitored', errorEvent);
      
      expect(eventAlertHandler).toHaveBeenCalledTimes(1);
      expect(eventAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  describe('Alert History Management', () => {
    let testAlert: PerformanceAlert;

    beforeEach(() => {
      testAlert = {
        id: 'test-alert-1',
        type: 'error',
        severity: 'high',
        message: 'Test alert message',
        timestamp: new Date('2023-10-15T10:00:00Z'),
        acknowledged: false
      };
    });

    it('should add alerts to history by date', () => {
      service['addToAlertHistory'](testAlert);
      
      const history = service.getAlertHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(testAlert);
    });

    it('should group alerts by date', () => {
      const alert1 = { ...testAlert, id: 'alert-1', timestamp: new Date('2023-10-15T10:00:00Z') };
      const alert2 = { ...testAlert, id: 'alert-2', timestamp: new Date('2023-10-15T15:00:00Z') };
      const alert3 = { ...testAlert, id: 'alert-3', timestamp: new Date('2023-10-16T10:00:00Z') };
      
      service['addToAlertHistory'](alert1);
      service['addToAlertHistory'](alert2);
      service['addToAlertHistory'](alert3);
      
      const history = service.getAlertHistory();
      expect(history).toHaveLength(3);
    });

    it('should filter alert history by date range', () => {
      const alert1 = { ...testAlert, id: 'alert-1', timestamp: new Date('2023-10-10T10:00:00Z') };
      const alert2 = { ...testAlert, id: 'alert-2', timestamp: new Date('2023-10-15T10:00:00Z') };
      const alert3 = { ...testAlert, id: 'alert-3', timestamp: new Date('2023-10-20T10:00:00Z') };
      
      service['addToAlertHistory'](alert1);
      service['addToAlertHistory'](alert2);
      service['addToAlertHistory'](alert3);
      
      const filteredHistory = service.getAlertHistory(
        new Date('2023-10-12T00:00:00Z'),
        new Date('2023-10-18T00:00:00Z')
      );
      
      expect(filteredHistory).toHaveLength(1);
      expect(filteredHistory[0].id).toBe('alert-2');
    });

    it('should sort alert history by timestamp descending', () => {
      const alert1 = { ...testAlert, id: 'alert-1', timestamp: new Date('2023-10-10T10:00:00Z') };
      const alert2 = { ...testAlert, id: 'alert-2', timestamp: new Date('2023-10-20T10:00:00Z') };
      const alert3 = { ...testAlert, id: 'alert-3', timestamp: new Date('2023-10-15T10:00:00Z') };
      
      service['addToAlertHistory'](alert1);
      service['addToAlertHistory'](alert2);
      service['addToAlertHistory'](alert3);
      
      const history = service.getAlertHistory();
      
      expect(history[0].id).toBe('alert-2'); // Most recent first
      expect(history[1].id).toBe('alert-3');
      expect(history[2].id).toBe('alert-1');
    });

    it('should cleanup old alerts', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Add old alert
      const oldAlert = {
        ...testAlert,
        id: 'old-alert',
        timestamp: new Date('2023-01-01T10:00:00Z')
      };
      
      service['addToAlertHistory'](oldAlert);
      
      // Trigger cleanup
      service['cleanupOldAlerts']();
      
      const history = service.getAlertHistory();
      expect(history).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Cleaned up old alerts from history');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const configHandler = jest.fn();
      service.on('config_updated', configHandler);
      
      const updates = {
        pollingInterval: 10000,
        alertRetentionDays: 7
      };
      
      service.updateConfig(updates);
      
      const stats = service.getStatistics();
      expect(stats.pollingInterval).toBe(10000);
      expect(configHandler).toHaveBeenCalledWith(updates);
    });

    it('should restart polling when interval changes', () => {
      service.start();
      
      // Change polling interval
      service.updateConfig({ pollingInterval: 2000 });
      
      // Should have restarted with new interval
      expect(service.getStatistics().pollingInterval).toBe(2000);
    });

    it('should log configuration updates', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.updateConfig({ enableTestMode: false });
      
      expect(consoleSpy).toHaveBeenCalledWith('⚙️ Alerting service configuration updated');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Test Mode', () => {
    beforeEach(() => {
      mockEngine = new MockAlertingEngine();
      service = new AlertingService({
        ...defaultConfig,
        enableTestMode: true
      }, mockEngine as unknown as AlertingEngine);
    });

    it('should trigger test alerts when test mode enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.triggerTestAlert('critical');

      expect(mockEngine.createTestAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'critical',
          message: 'Test alert - critical severity',
          data: { testMode: true }
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith('🧪 Test alert triggered');
      
      consoleSpy.mockRestore();
    });

    it('should simulate system alerts', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.simulateSystemAlert('memory');
      
      expect(mockEngine.createTestAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resource',
          severity: 'critical',
          message: 'Memory usage critical - 92%',
          data: { simulationType: 'memory', testMode: true }
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith('🧪 Simulated memory alert');
      
      consoleSpy.mockRestore();
    });

    it('should warn when test mode disabled', () => {
      const disabledService = new AlertingService({
        ...defaultConfig,
        enableTestMode: false
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      disabledService.triggerTestAlert();
      disabledService.simulateSystemAlert('cpu');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Test mode is disabled');
      
      disabledService.stop();
      consoleSpy.mockRestore();
    });

    it('should simulate different system alert types', () => {
      const testCases = [
        { type: 'cpu', expectedSeverity: 'high', expectedMessage: 'High CPU usage detected - 87%' },
        { type: 'memory', expectedSeverity: 'critical', expectedMessage: 'Memory usage critical - 92%' },
        { type: 'disk', expectedSeverity: 'high', expectedMessage: 'Low disk space - 95% full' },
        { type: 'network', expectedSeverity: 'high', expectedMessage: 'High network latency - 850ms' }
      ];
      
      testCases.forEach(({ type, expectedSeverity, expectedMessage }) => {
        service.simulateSystemAlert(type as any);
        
        expect(mockEngine.createTestAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: expectedSeverity,
            message: expectedMessage,
            data: { simulationType: type, testMode: true }
          })
        );
      });
    });
  });

  describe('Public API', () => {
    it('should get active alerts', () => {
      const mockActiveAlerts = [
        { id: 'alert-1', status: 'firing' },
        { id: 'alert-2', status: 'firing' }
      ];
      
      mockEngine.getActiveAlerts.mockReturnValue(mockActiveAlerts as AlertState[]);
      
      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toEqual(mockActiveAlerts);
      expect(mockEngine.getActiveAlerts).toHaveBeenCalled();
    });

    it('should acknowledge alerts', () => {
      const result = service.acknowledgeAlert('alert-123', 'admin-user');
      
      expect(mockEngine.acknowledgeAlert).toHaveBeenCalledWith('alert-123', 'admin-user');
      expect(result).toBe(true);
    });

    it('should get service statistics', () => {
      const stats = service.getStatistics();
      
      expect(stats).toEqual(expect.objectContaining({
        rulesCount: 5,
        activeAlerts: 2,
        totalAlerts: 10,
        enabled: true,
        isRunning: false,
        integrationMode: 'polling',
        totalHistoryAlerts: 0,
        historyDays: 0,
        pollingInterval: 5000
      }));
    });

    it('should get service health', () => {
      const health = service.getHealth();
      
      expect(health).toEqual({
        status: 'stopped',
        details: {
          running: false,
          connected: false,
          activeAlerts: 0,
          engineEnabled: true,
          lastPoll: 'inactive'
        }
      });
    });

    it('should report healthy status when running and connected', () => {
      service.connectToMonitoring(mockMonitoringService);
      service.start();
      
      const health = service.getHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.details.running).toBe(true);
      expect(health.details.connected).toBe(true);
      expect(health.details.lastPoll).toBe('active');
    });

    it('should enable/disable service', () => {
      expect(service.getStatistics().isRunning).toBe(false);
      
      service.setEnabled(true);
      expect(service.getStatistics().isRunning).toBe(true);
      
      service.setEnabled(false);
      expect(service.getStatistics().isRunning).toBe(false);
    });
  });

  describe('Engine Event Handlers', () => {
    let mockAlert: PerformanceAlert;
    let mockAlertState: AlertState;

    beforeEach(() => {
      mockAlert = {
        id: 'engine-alert-1',
        type: 'error',
        severity: 'high',
        message: 'Engine generated alert',
        timestamp: new Date(),
        acknowledged: false
      };

      mockAlertState = {
        id: 'state-1',
        ruleId: 'rule-1',
        status: 'firing',
        severity: 'high',
        category: 'system',
        firstSeen: new Date(),
        lastSeen: new Date(),
        count: 1,
        acknowledged: true,
        escalationLevel: 0,
        metadata: {}
      };
    });

    it('should handle alert fired events', () => {
      const alertFiredHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.on('alert_fired', alertFiredHandler);
      
      // Simulate engine firing an alert
      const onAlertFired = mockEngine.on.mock.calls.find(call => call[0] === 'alert_fired')?.[1];
      onAlertFired(mockAlert);
      
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Alert fired: Engine generated alert');
      expect(alertFiredHandler).toHaveBeenCalledWith(mockAlert);
      
      consoleSpy.mockRestore();
    });

    it('should handle alert resolved events', () => {
      const alertResolvedHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.on('alert_resolved', alertResolvedHandler);
      
      const onAlertResolved = mockEngine.on.mock.calls.find(call => call[0] === 'alert_resolved')?.[1];
      onAlertResolved(mockAlert);
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Alert resolved: Engine generated alert');
      expect(alertResolvedHandler).toHaveBeenCalledWith(mockAlert);
      
      consoleSpy.mockRestore();
    });

    it('should handle alert acknowledged events', () => {
      const alertAcknowledgedHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.on('alert_acknowledged', alertAcknowledgedHandler);
      
      const onAlertAcknowledged = mockEngine.on.mock.calls.find(call => call[0] === 'alert_acknowledged')?.[1];
      onAlertAcknowledged(mockAlertState);
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Alert acknowledged: state-1');
      expect(alertAcknowledgedHandler).toHaveBeenCalledWith(mockAlertState);
      
      consoleSpy.mockRestore();
    });

    it('should handle alert escalated events', () => {
      const alertEscalatedHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.on('alert_escalated', alertEscalatedHandler);
      
      const escalationData = {
        alert: mockAlert,
        level: 2,
        policy: 'default'
      };
      
      const onAlertEscalated = mockEngine.on.mock.calls.find(call => call[0] === 'alert_escalated')?.[1];
      onAlertEscalated(escalationData);
      
      expect(consoleSpy).toHaveBeenCalledWith('📈 Alert escalated: Engine generated alert to level 2');
      expect(alertEscalatedHandler).toHaveBeenCalledWith(escalationData);
      
      consoleSpy.mockRestore();
    });

    it('should handle in-app notification events', () => {
      const inAppHandler = jest.fn();
      
      service.on('in_app_notification', inAppHandler);
      
      const onInAppNotification = mockEngine.on.mock.calls.find(call => call[0] === 'in_app_notification')?.[1];
      onInAppNotification(mockAlert);
      
      expect(inAppHandler).toHaveBeenCalledWith(mockAlert);
    });

    it('should handle evaluation error events', () => {
      const evaluationErrorHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.on('evaluation_error', evaluationErrorHandler);
      
      const error = new Error('Evaluation failed');
      
      const onEvaluationError = mockEngine.on.mock.calls.find(call => call[0] === 'evaluation_error')?.[1];
      onEvaluationError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Alert evaluation error:', error);
      expect(evaluationErrorHandler).toHaveBeenCalledWith(error);
      
      consoleSpy.mockRestore();
    });
  });
});
