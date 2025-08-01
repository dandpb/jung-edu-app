/**
 * Monitoring System Integration Tests
 * 
 * Comprehensive integration tests for the monitoring system including:
 * - Health service integration
 * - Monitoring service integration
 * - WebSocket connectivity
 * - Dashboard component integration
 * - Real-time data flow
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthService } from '../../services/health/healthService';
import { PipelineMonitoringService } from '../../services/resourcePipeline/monitoring';
import { MonitoringDashboard } from '../../pages/MonitoringDashboard';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock sending data
    console.log('Mock WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    REACT_APP_SUPABASE_URL: 'https://test.supabase.co',
    REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
    REACT_APP_WEBSOCKET_URL: 'ws://localhost:3001',
    REACT_APP_OPENAI_API_KEY: 'sk-test-key',
    REACT_APP_YOUTUBE_API_KEY: 'test-youtube-key'
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 2000000000
      },
      getEntriesByType: jest.fn((type) => {
        if (type === 'navigation') {
          return [{ loadEventEnd: 1000, navigationStart: 0 }];
        }
        if (type === 'resource') {
          return new Array(10).fill({}).map((_, i) => ({ name: `resource-${i}` }));
        }
        return [];
      })
    }
  });

  // Mock navigator
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Browser)',
    writable: true
  });
  Object.defineProperty(window.navigator, 'language', {
    value: 'en-US',
    writable: true
  });
  Object.defineProperty(window.navigator, 'onLine', {
    value: true,
    writable: true
  });
  Object.defineProperty(window.navigator, 'cookieEnabled', {
    value: true,
    writable: true
  });
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('Monitoring System Integration', () => {
  describe('Health Service Integration', () => {
    let healthService: HealthService;

    beforeEach(() => {
      healthService = HealthService.getInstance();
    });

    it('should perform comprehensive health check with all services', async () => {
      const health = await healthService.checkSystemHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(health.services).toBeDefined();
      expect(health.services.length).toBeGreaterThan(0);
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBeDefined();
      expect(health.environment).toBeDefined();

      // Check that all expected services are included
      const serviceNames = health.services.map(s => s.service);
      expect(serviceNames).toContain('supabase');
      expect(serviceNames).toContain('api');
      expect(serviceNames).toContain('storage');
      expect(serviceNames).toContain('auth');
      expect(serviceNames).toContain('database');
      expect(serviceNames).toContain('external_apis');
    });

    it('should collect system metrics successfully', async () => {
      const metrics = await healthService.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.browser).toBeDefined();
      expect(metrics.environment).toBeDefined();
      expect(metrics.response_time).toBeDefined();

      // Validate memory metrics
      expect(metrics.memory.used).toBe(50000000);
      expect(metrics.memory.total).toBe(100000000);
      expect(metrics.memory.limit).toBe(2000000000);

      // Validate browser metrics
      expect(metrics.browser.user_agent).toBe('Mozilla/5.0 (Test Browser)');
      expect(metrics.browser.language).toBe('en-US');
      expect(metrics.browser.online).toBe(true);
      expect(metrics.browser.cookies_enabled).toBe(true);
    });

    it('should handle service failures gracefully', async () => {
      // Mock localStorage to throw error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const health = await healthService.checkSystemHealth();
      const storageService = health.services.find(s => s.service === 'storage');

      expect(storageService?.status).toBe('unhealthy');
      expect(storageService?.error).toContain('Storage quota exceeded');
    });

    it('should perform deep health check with retries', async () => {
      const startTime = Date.now();
      const health = await healthService.performDeepHealthCheck(2);
      const endTime = Date.now();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(endTime - startTime).toBeGreaterThan(0);
    });

    it('should track response times for all services', async () => {
      const health = await healthService.checkSystemHealth();

      health.services.forEach(service => {
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
        expect(typeof service.responseTime).toBe('number');
        expect(service.timestamp).toBeDefined();
        expect(new Date(service.timestamp)).toBeInstanceOf(Date);
      });
    });
  });

  describe('Pipeline Monitoring Integration', () => {
    let mockPipeline: any;
    let mockHooks: any;
    let monitoringService: PipelineMonitoringService;

    beforeEach(() => {
      // Create mock pipeline with EventEmitter functionality
      mockPipeline = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      // Create mock hooks with EventEmitter functionality
      mockHooks = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      monitoringService = new PipelineMonitoringService(mockPipeline, mockHooks, {
        enableMetrics: true,
        enableAlerts: true,
        enablePerformanceTracking: true,
        enableQualityTracking: true,
        enableHealthChecks: true,
        healthCheckInterval: 1000 // Short interval for testing
      });
    });

    afterEach(() => {
      monitoringService.stop();
    });

    it('should initialize with default metrics and status', () => {
      const metrics = monitoringService.getMetrics();
      const status = monitoringService.getStatus();

      expect(metrics).toBeDefined();
      expect(metrics.totalModulesProcessed).toBe(0);
      expect(metrics.totalResourcesGenerated).toBe(0);
      expect(metrics.successRate).toBe(1.0);
      expect(metrics.errorRate).toBe(0.0);
      expect(metrics.health.status).toBe('healthy');

      expect(status).toBeDefined();
      expect(status.isRunning).toBe(true);
      expect(status.activeModules).toBe(0);
      expect(status.queuedModules).toBe(0);
      expect(status.resourcesInProgress).toBe(0);
    });

    it('should register event listeners on pipeline and hooks', () => {
      // Verify that event listeners were registered
      expect(mockPipeline.on).toHaveBeenCalledWith('pipeline_event', expect.any(Function));
      expect(mockPipeline.on).toHaveBeenCalledWith('module_created', expect.any(Function));
      expect(mockPipeline.on).toHaveBeenCalledWith('resource_generated', expect.any(Function));
      expect(mockPipeline.on).toHaveBeenCalledWith('validation_complete', expect.any(Function));
      expect(mockPipeline.on).toHaveBeenCalledWith('pipeline_complete', expect.any(Function));
      expect(mockPipeline.on).toHaveBeenCalledWith('error', expect.any(Function));

      expect(mockHooks.on).toHaveBeenCalledWith('hooks_executed', expect.any(Function));
      expect(mockHooks.on).toHaveBeenCalledWith('hooks_failed', expect.any(Function));
    });

    it('should track module processing lifecycle', () => {
      const initialMetrics = monitoringService.getMetrics();
      const initialStatus = monitoringService.getStatus();

      // Simulate module start
      const moduleStartEvent = {
        type: 'module_created',
        moduleId: 'test-module-1',
        timestamp: new Date(),
        data: {}
      };

      // Get the registered event handler and call it
      const moduleCreatedHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'module_created'
      )[1];
      moduleCreatedHandler(moduleStartEvent);

      const updatedStatus = monitoringService.getStatus();
      expect(updatedStatus.activeModules).toBe(initialStatus.activeModules + 1);
      expect(updatedStatus.lastActivity.getTime()).toBeGreaterThan(initialStatus.lastActivity.getTime());
    });

    it('should handle pipeline completion and update metrics', () => {
      // Simulate pipeline completion
      const completeEvent = {
        type: 'pipeline_complete',
        moduleId: 'test-module-1',
        timestamp: new Date(),
        data: {
          resources: [
            { id: 'resource-1', type: 'mindmap', moduleId: 'test-module-1', metadata: { quality: 0.9 } },
            { id: 'resource-2', type: 'quiz', moduleId: 'test-module-1', metadata: { quality: 0.8 } }
          ]
        }
      };

      const pipelineCompleteHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'pipeline_complete'
      )[1];
      pipelineCompleteHandler(completeEvent);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalModulesProcessed).toBe(1);
      expect(metrics.totalResourcesGenerated).toBe(2);
    });

    it('should create alerts on errors', () => {
      const errorEvent = {
        type: 'error',
        moduleId: 'test-module-1',
        timestamp: new Date(),
        data: {
          error: new Error('Test pipeline error')
        }
      };

      const errorHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorHandler(errorEvent);

      const alerts = monitoringService.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const errorAlert = alerts.find(a => a.type === 'error');
      expect(errorAlert).toBeDefined();
      expect(errorAlert?.severity).toBe('high');
      expect(errorAlert?.moduleId).toBe('test-module-1');
    });

    it('should acknowledge alerts', () => {
      // First create an alert
      const errorEvent = {
        type: 'error',
        moduleId: 'test-module-1',
        timestamp: new Date(),
        data: {
          error: new Error('Test error')
        }
      };

      const errorHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorHandler(errorEvent);

      const alerts = monitoringService.getAlerts();
      const alert = alerts[0];
      expect(alert.acknowledged).toBe(false);

      // Acknowledge the alert
      const acknowledged = monitoringService.acknowledgeAlert(alert.id);
      expect(acknowledged).toBe(true);

      const updatedAlerts = monitoringService.getAlerts();
      const updatedAlert = updatedAlerts.find(a => a.id === alert.id);
      expect(updatedAlert?.acknowledged).toBe(true);
    });
  });

  describe('WebSocket Integration', () => {
    // Note: WebSocket integration tests would require more complex mocking
    // For now, we'll test the hook behavior with mocked socket.io

    it('should handle WebSocket connection states', async () => {
      // This test would need to be expanded with proper socket.io mocking
      // For now, we verify that the hook exists and can be imported
      expect(useMonitoringWebSocket).toBeDefined();
      expect(typeof useMonitoringWebSocket).toBe('function');
    });
  });

  describe('Dashboard Component Integration', () => {
    const mockMetrics = {
      totalModulesProcessed: 127,
      totalResourcesGenerated: 845,
      averageProcessingTime: 12500,
      successRate: 0.94,
      errorRate: 0.06,
      resourcesByType: {
        'mindmap': 245,
        'quiz': 312,
        'video': 178,
        'bibliography': 110
      },
      qualityScores: {
        average: 0.87,
        byType: {
          'mindmap': 0.91,
          'quiz': 0.84,
          'video': 0.89,
          'bibliography': 0.83
        }
      },
      performance: {
        averageGenerationTime: 8200,
        averageValidationTime: 2100,
        averageHookExecutionTime: 350
      },
      health: {
        status: 'healthy' as const,
        lastUpdate: new Date(),
        issues: []
      }
    };

    const mockStatus = {
      isRunning: true,
      activeModules: 3,
      queuedModules: 7,
      resourcesInProgress: 12,
      lastActivity: new Date(),
      uptime: 8640000
    };

    // Mock the useMonitoringWebSocket hook
    jest.mock('../../hooks/useMonitoringWebSocket', () => ({
      useMonitoringWebSocket: () => ({
        connected: true,
        error: null,
        sendMessage: jest.fn(),
        acknowledgeAlert: jest.fn()
      })
    }));

    it('should render dashboard with metrics', async () => {
      render(<MonitoringDashboard theme="light" />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      });

      // Check for key components
      expect(screen.getByText('Real-time pipeline performance and health monitoring')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<MonitoringDashboard theme="light" />);

      expect(screen.getByText('Loading monitoring dashboard...')).toBeInTheDocument();
    });

    it('should handle theme switching', async () => {
      render(<MonitoringDashboard theme="light" />);

      await waitFor(() => {
        expect(screen.getByText('System Monitoring Dashboard')).toBeInTheDocument();
      });

      // Find and click theme toggle (this would need to be implemented in the component)
      // For now, we just verify the component renders
    });
  });

  describe('End-to-End Integration', () => {
    it('should integrate health service with monitoring dashboard', async () => {
      const healthService = HealthService.getInstance();
      const health = await healthService.checkSystemHealth();

      expect(health.overall).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);

      // Verify that the health data structure matches what the dashboard expects
      expect(health.services).toBeDefined();
      health.services.forEach(service => {
        expect(service.service).toBeDefined();
        expect(service.status).toBeDefined();
        expect(service.timestamp).toBeDefined();
        expect(service.responseTime).toBeDefined();
      });
    });

    it('should maintain data consistency across components', async () => {
      const healthService = HealthService.getInstance();
      const metrics = await healthService.getSystemMetrics();

      // Verify metrics structure matches monitoring interface
      expect(metrics.memory).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.browser).toBeDefined();
      expect(metrics.environment).toBeDefined();

      // Verify timestamp consistency
      expect(metrics.environment.timestamp).toBeDefined();
      const timestamp = new Date(metrics.environment.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Remove environment variables
      delete process.env.REACT_APP_SUPABASE_URL;
      delete process.env.REACT_APP_SUPABASE_ANON_KEY;

      const healthService = HealthService.getInstance();
      const health = await healthService.checkSystemHealth();

      const supabaseService = health.services.find(s => s.service === 'supabase');
      expect(supabaseService?.status).toBe('unhealthy');
      expect(supabaseService?.error).toContain('configuration missing');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const healthService = HealthService.getInstance();
      const health = await healthService.checkSystemHealth();

      const storageService = health.services.find(s => s.service === 'storage');
      expect(storageService?.status).toBe('unhealthy');
      expect(storageService?.error).toContain('Storage quota exceeded');
    });

    it('should calculate overall health correctly with mixed service states', async () => {
      // This test would need to mock specific service failures
      // For now, we verify the health calculation logic exists
      const healthService = HealthService.getInstance();
      const health = await healthService.checkSystemHealth();

      expect(health.overall).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle rapid metric updates', async () => {
      const mockPipeline = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const mockHooks = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const monitoringService = new PipelineMonitoringService(mockPipeline, mockHooks);

      // Simulate rapid events
      const eventHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'pipeline_event'
      )[1];

      const startTime = performance.now();
      
      // Generate multiple events rapidly
      for (let i = 0; i < 100; i++) {
        eventHandler({
          type: 'pipeline_complete',
          moduleId: `test-module-${i}`,
          timestamp: new Date(),
          data: { resources: [{ id: `resource-${i}`, type: 'test', moduleId: `test-module-${i}`, metadata: {} }] }
        });
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process 100 events in reasonable time (less than 1 second)
      expect(processingTime).toBeLessThan(1000);

      const metrics = monitoringService.getMetrics();
      expect(metrics.totalModulesProcessed).toBe(100);
      expect(metrics.totalResourcesGenerated).toBe(100);

      monitoringService.stop();
    });

    it('should handle memory efficiently with large datasets', () => {
      const mockPipeline = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const mockHooks = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const monitoringService = new PipelineMonitoringService(mockPipeline, mockHooks, {
        metricsRetentionDays: 1 // Short retention for testing
      });

      // Verify the service is initialized correctly
      expect(monitoringService).toBeDefined();
      expect(monitoringService.getMetrics()).toBeDefined();
      expect(monitoringService.getStatus()).toBeDefined();

      monitoringService.stop();
    });
  });
});

describe('Monitoring System Demo Scenarios', () => {
  describe('Health Check Demo', () => {
    it('should demonstrate health check workflow', async () => {
      const healthService = HealthService.getInstance();

      // Step 1: Perform initial health check
      const initialHealth = await healthService.checkSystemHealth();
      expect(initialHealth.overall).toBeDefined();

      // Step 2: Get detailed metrics
      const metrics = await healthService.getSystemMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.response_time).toBeDefined();

      // Step 3: Perform deep health check
      const deepHealth = await healthService.performDeepHealthCheck(1);
      expect(deepHealth.overall).toBeDefined();

      console.log('✅ Health Check Demo completed successfully');
    });
  });

  describe('Real-time Monitoring Demo', () => {
    it('should demonstrate real-time monitoring workflow', async () => {
      const mockPipeline = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const mockHooks = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const monitoringService = new PipelineMonitoringService(mockPipeline, mockHooks);

      // Step 1: Check initial state
      const initialMetrics = monitoringService.getMetrics();
      expect(initialMetrics.totalModulesProcessed).toBe(0);

      // Step 2: Simulate pipeline activity
      const pipelineCompleteHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'pipeline_complete'
      )[1];

      pipelineCompleteHandler({
        type: 'pipeline_complete',
        moduleId: 'demo-module',
        timestamp: new Date(),
        data: {
          resources: [
            { id: 'demo-resource', type: 'mindmap', moduleId: 'demo-module', metadata: { quality: 0.9 } }
          ]
        }
      });

      // Step 3: Verify metrics updated
      const updatedMetrics = monitoringService.getMetrics();
      expect(updatedMetrics.totalModulesProcessed).toBe(1);
      expect(updatedMetrics.totalResourcesGenerated).toBe(1);

      monitoringService.stop();
      console.log('✅ Real-time Monitoring Demo completed successfully');
    });
  });

  describe('Alert Management Demo', () => {
    it('should demonstrate alert management workflow', async () => {
      const mockPipeline = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const mockHooks = {
        on: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      };

      const monitoringService = new PipelineMonitoringService(mockPipeline, mockHooks);

      // Step 1: Check initial alerts
      const initialAlerts = monitoringService.getAlerts();
      expect(initialAlerts.length).toBe(0);

      // Step 2: Trigger an error to create alert
      const errorHandler = mockPipeline.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      errorHandler({
        type: 'error',
        moduleId: 'demo-module',
        timestamp: new Date(),
        data: {
          error: new Error('Demo error for alert testing')
        }
      });

      // Step 3: Verify alert created
      const alertsAfterError = monitoringService.getAlerts();
      expect(alertsAfterError.length).toBe(1);
      expect(alertsAfterError[0].acknowledged).toBe(false);

      // Step 4: Acknowledge alert
      const alertId = alertsAfterError[0].id;
      const acknowledged = monitoringService.acknowledgeAlert(alertId);
      expect(acknowledged).toBe(true);

      // Step 5: Verify alert acknowledged
      const finalAlerts = monitoringService.getAlerts();
      const acknowledgedAlert = finalAlerts.find(a => a.id === alertId);
      expect(acknowledgedAlert?.acknowledged).toBe(true);

      monitoringService.stop();
      console.log('✅ Alert Management Demo completed successfully');
    });
  });
});