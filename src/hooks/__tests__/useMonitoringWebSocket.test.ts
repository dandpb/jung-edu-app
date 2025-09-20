/**
 * Comprehensive test suite for useMonitoringWebSocket hook
 * Tests WebSocket connection, reconnection logic, event handling, error scenarios, and memory management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMonitoringWebSocket } from '../useMonitoringWebSocket';
import { PipelineMetrics, PipelineStatus, PerformanceAlert } from '../../services/resourcePipeline/monitoring';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    REACT_APP_WEBSOCKET_URL: 'ws://test.localhost:3001'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('useMonitoringWebSocket', () => {
  let mockOnMetricsUpdate: jest.Mock;
  let mockOnStatusUpdate: jest.Mock;
  let mockOnAlertsUpdate: jest.Mock;
  let mockSetTimeout: jest.SpyInstance;
  let mockClearTimeout: jest.SpyInstance;
  let mockSetInterval: jest.SpyInstance;
  let mockClearInterval: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockOnMetricsUpdate = jest.fn();
    mockOnStatusUpdate = jest.fn();
    mockOnAlertsUpdate = jest.fn();

    mockSetTimeout = jest.spyOn(global, 'setTimeout');
    mockClearTimeout = jest.spyOn(global, 'clearTimeout');
    mockSetInterval = jest.spyOn(global, 'setInterval');
    mockClearInterval = jest.spyOn(global, 'clearInterval');

    // Reset socket mock
    mockSocket.connected = false;
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Reset mock implementation
    const { io } = require('socket.io-client');
    io.mockReturnValue(mockSocket);
    io.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Hook Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useMonitoringWebSocket({}));

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.acknowledgeAlert).toBe('function');

      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledWith('ws://test.localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });
    });

    it('should use custom URL when provided', () => {
      const customUrl = 'ws://custom.localhost:4001';

      renderHook(() => useMonitoringWebSocket({
        url: customUrl,
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledWith(customUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });
    });

    it('should use fallback URL when environment variable is not set', () => {
      const originalUrl = process.env.REACT_APP_WEBSOCKET_URL;
      delete process.env.REACT_APP_WEBSOCKET_URL;

      renderHook(() => useMonitoringWebSocket({}));

      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledWith('ws://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      process.env.REACT_APP_WEBSOCKET_URL = originalUrl;
    });

    it('should use custom reconnection parameters', () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 10,
        reconnectDelay: 5000,
      }));

      expect(result.current.connected).toBe(false);
    });

    it('should register all event listeners on initialization', () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
        onStatusUpdate: mockOnStatusUpdate,
        onAlertsUpdate: mockOnAlertsUpdate,
      }));

      // Verify all required event listeners are registered
      const expectedEvents = [
        'connect',
        'disconnect', 
        'connect_error',
        'metrics_update',
        'status_update',
        'alerts_update',
        'initial_data',
        'health_check_complete',
        'alert_created',
        'alert_acknowledged'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });

  describe('WebSocket Connection Lifecycle', () => {
    it('should handle successful connection', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      expect(result.current.connected).toBe(false);

      // Simulate successful connection
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      expect(result.current.connected).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockSocket.emit).toHaveBeenCalledWith('request_initial_data');
    });

    it('should handle connection disconnection', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 3,
      }));

      // First connect
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      expect(result.current.connected).toBe(true);

      // Then disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('transport close');
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toContain('Connection lost. Reconnecting...');
    });

    it('should handle server-initiated disconnect', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({}));

      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('io server disconnect');
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBe('Server disconnected the connection');
    });

    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 2,
      }));

      const connectionError = new Error('Connection failed');

      act(() => {
        const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
        errorHandler(connectionError);
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toContain('Connection error: Connection failed');
    });

    it('should clean up existing connection before creating new one', () => {
      const { rerender } = renderHook(
        (props) => useMonitoringWebSocket(props),
        { initialProps: { url: 'ws://test1.localhost:3001' } }
      );

      expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);

      // Change URL to trigger reconnection
      rerender({ url: 'ws://test2.localhost:3001' });

      expect(mockSocket.disconnect).toHaveBeenCalledTimes(2);
      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledTimes(2);
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt to reconnect after disconnect', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 3,
        reconnectDelay: 1000,
      }));

      // Simulate disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('transport close');
      });

      expect(result.current.error).toContain('Connection lost. Reconnecting... (1/3)');

      // Fast-forward time to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should stop reconnecting after max attempts', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 2,
        reconnectDelay: 1000,
      }));

      // Simulate multiple disconnects
      for (let i = 0; i < 3; i++) {
        act(() => {
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
          disconnectHandler('transport close');
          jest.advanceTimersByTime(1000);
        });
      }

      expect(result.current.error).toBe('Failed to reconnect after multiple attempts');
    });

    it('should clear reconnect timeout on successful connection', async () => {
      renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 3,
        reconnectDelay: 1000,
      }));

      // Simulate disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('transport close');
      });

      // Simulate successful reconnection
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('should handle multiple rapid disconnects gracefully', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 5,
        reconnectDelay: 500,
      }));

      // Simulate rapid disconnects
      for (let i = 0; i < 3; i++) {
        act(() => {
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
          disconnectHandler('transport close');
        });
      }

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toContain('Connection lost. Reconnecting...');
    });
  });

  describe('Data Event Handling', () => {
    it('should handle metrics updates', async () => {
      const mockMetrics: PipelineMetrics = {
        totalModulesProcessed: 100,
        totalResourcesGenerated: 500,
        averageProcessingTime: 15000,
        successRate: 0.95,
        errorRate: 0.05,
        resourcesByType: { quiz: 200, video: 150, bibliography: 150 },
        qualityScores: {
          average: 0.85,
          byType: { quiz: 0.9, video: 0.8, bibliography: 0.85 }
        },
        performance: {
          averageGenerationTime: 8000,
          averageValidationTime: 2000,
          averageHookExecutionTime: 300
        },
        health: {
          status: 'healthy',
          lastUpdate: new Date(),
          issues: []
        }
      };

      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      act(() => {
        const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
        metricsHandler(mockMetrics);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(mockMetrics);
    });

    it('should handle status updates', async () => {
      const mockStatus: PipelineStatus = {
        stage: 'processing',
        progress: 0.75,
        currentTask: 'Generating quiz questions',
        estimatedTimeRemaining: 30000,
        activeWorkers: 3,
        queueLength: 15
      };

      renderHook(() => useMonitoringWebSocket({
        onStatusUpdate: mockOnStatusUpdate,
      }));

      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
        statusHandler(mockStatus);
      });

      expect(mockOnStatusUpdate).toHaveBeenCalledWith(mockStatus);
    });

    it('should handle alerts updates', async () => {
      const mockAlerts: PerformanceAlert[] = [
        {
          id: 'alert-1',
          type: 'warning',
          message: 'High memory usage detected',
          timestamp: new Date(),
          severity: 'medium',
          resolved: false
        },
        {
          id: 'alert-2',
          type: 'error',
          message: 'Database connection timeout',
          timestamp: new Date(),
          severity: 'high',
          resolved: false
        }
      ];

      renderHook(() => useMonitoringWebSocket({
        onAlertsUpdate: mockOnAlertsUpdate,
      }));

      act(() => {
        const alertsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'alerts_update')[1];
        alertsHandler(mockAlerts);
      });

      expect(mockOnAlertsUpdate).toHaveBeenCalledWith(mockAlerts);
    });

    it('should handle initial data', async () => {
      const mockInitialData = {
        metrics: { totalModulesProcessed: 50 } as PipelineMetrics,
        status: { stage: 'idle', progress: 0 } as PipelineStatus,
        alerts: [] as PerformanceAlert[]
      };

      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
        onStatusUpdate: mockOnStatusUpdate,
        onAlertsUpdate: mockOnAlertsUpdate,
      }));

      act(() => {
        const initialDataHandler = mockSocket.on.mock.calls.find(call => call[0] === 'initial_data')[1];
        initialDataHandler(mockInitialData);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(mockInitialData.metrics);
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(mockInitialData.status);
      expect(mockOnAlertsUpdate).toHaveBeenCalledWith(mockInitialData.alerts);
    });

    it('should handle health check completion', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useMonitoringWebSocket({}));

      const healthData = { status: 'healthy', checks: { database: true, redis: true } };

      act(() => {
        const healthHandler = mockSocket.on.mock.calls.find(call => call[0] === 'health_check_complete')[1];
        healthHandler(healthData);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('🏥 Health check completed:', healthData);

      consoleLogSpy.mockRestore();
    });

    it('should handle individual alert events', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useMonitoringWebSocket({}));

      const newAlert: PerformanceAlert = {
        id: 'alert-new',
        type: 'warning',
        message: 'New alert created',
        timestamp: new Date(),
        severity: 'low',
        resolved: false
      };

      act(() => {
        const alertCreatedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'alert_created')[1];
        alertCreatedHandler(newAlert);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('🚨 New alert created:', newAlert);

      const acknowledgedAlert = { ...newAlert, resolved: true };

      act(() => {
        const alertAckHandler = mockSocket.on.mock.calls.find(call => call[0] === 'alert_acknowledged')[1];
        alertAckHandler(acknowledgedAlert);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Alert acknowledged:', newAlert.id);

      consoleLogSpy.mockRestore();
    });
  });

  describe('Message Sending and Alert Acknowledgment', () => {
    it('should send messages when connected', () => {
      const { result } = renderHook(() => useMonitoringWebSocket({}));

      // Simulate connection
      mockSocket.connected = true;
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      act(() => {
        result.current.sendMessage('test_event', { data: 'test' });
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should not send messages when disconnected', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useMonitoringWebSocket({}));

      mockSocket.connected = false;

      act(() => {
        result.current.sendMessage('test_event', { data: 'test' });
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot send message: WebSocket not connected');

      consoleWarnSpy.mockRestore();
    });

    it('should acknowledge alerts', () => {
      const { result } = renderHook(() => useMonitoringWebSocket({}));

      mockSocket.connected = true;

      act(() => {
        result.current.acknowledgeAlert('alert-123');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('acknowledge_alert', { alertId: 'alert-123' });
    });
  });

  describe('Mock Data Simulation', () => {
    it.skip('should generate mock data when WebSocket is not connected', async () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Fast-forward time to trigger mock data generation
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalled();

      const callArgs = mockOnMetricsUpdate.mock.calls[0][0];
      expect(callArgs).toHaveProperty('totalModulesProcessed');
      expect(callArgs).toHaveProperty('totalResourcesGenerated');
      expect(callArgs).toHaveProperty('averageProcessingTime');
      expect(callArgs).toHaveProperty('successRate');
      expect(callArgs).toHaveProperty('resourcesByType');
      expect(callArgs).toHaveProperty('qualityScores');
      expect(callArgs).toHaveProperty('performance');
      expect(callArgs).toHaveProperty('health');
    });

    it('should not generate mock data when connected', async () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Simulate connection
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
      });

      expect(mockOnMetricsUpdate).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should still not have been called since we're "connected"
      expect(mockOnMetricsUpdate).not.toHaveBeenCalled();
    });

    it.skip('should stop mock data simulation when connected', async () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Let mock data start
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalledTimes(1);

      // Now connect
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();
        jest.advanceTimersByTime(5000);
      });

      // Should not generate more mock data
      expect(mockOnMetricsUpdate).toHaveBeenCalledTimes(1);
    });

    it.skip('should generate realistic mock data variations', async () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Generate multiple mock data points
      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }

      expect(mockOnMetricsUpdate).toHaveBeenCalledTimes(3);

      // Verify data has variations (not identical)
      const calls = mockOnMetricsUpdate.mock.calls;
      const firstCall = calls[0][0];
      const secondCall = calls[1][0];

      expect(firstCall.totalModulesProcessed).not.toBe(secondCall.totalModulesProcessed);
      expect(firstCall.averageProcessingTime).not.toBe(secondCall.averageProcessingTime);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket({}));

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('should clear reconnection timeouts on cleanup', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 3,
      }));

      // Trigger reconnection
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('transport close');
      });

      unmount();

      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it.skip('should clear mock data intervals on cleanup', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Let mock data interval start
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      unmount();

      expect(mockClearInterval).toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls gracefully', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket({}));

      // Multiple cleanup calls should not throw
      expect(() => {
        unmount();
        unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle WebSocket creation errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { io } = require('socket.io-client');
      io.mockImplementationOnce(() => {
        throw new Error('WebSocket creation failed');
      });

      const { result } = renderHook(() => useMonitoringWebSocket({}));

      expect(result.current.error).toContain('Failed to initialize connection');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create WebSocket connection:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      // Reset the mock
      io.mockReturnValue(mockSocket);
    });

    it('should handle malformed event data gracefully', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      // Send malformed data
      act(() => {
        const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
        metricsHandler(null);
      });

      // Should not crash and still call the handler
      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(null);

      consoleLogSpy.mockRestore();
    });

    it('should handle missing callback functions gracefully', () => {
      renderHook(() => useMonitoringWebSocket({})); // No callbacks provided

      // These should not crash when called
      act(() => {
        const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
        const statusHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
        const alertsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'alerts_update')[1];

        expect(() => {
          metricsHandler({ test: 'data' });
          statusHandler({ test: 'status' });
          alertsHandler([{ test: 'alert' }]);
        }).not.toThrow();
      });
    });

    it('should handle rapid URL changes', () => {
      const { rerender } = renderHook(
        (props) => useMonitoringWebSocket(props),
        { initialProps: { url: 'ws://test1.localhost:3001' } }
      );

      // Rapid URL changes
      rerender({ url: 'ws://test2.localhost:3001' });
      rerender({ url: 'ws://test3.localhost:3001' });
      rerender({ url: 'ws://test4.localhost:3001' });

      expect(mockSocket.disconnect).toHaveBeenCalledTimes(4); // Initial + 3 changes
      const { io } = require('socket.io-client');
      expect(io).toHaveBeenCalledTimes(4);
    });

    it('should handle zero reconnection attempts', () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        reconnectAttempts: 0,
      }));

      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('transport close');
      });

      expect(result.current.error).toBe('Failed to reconnect after multiple attempts');
      expect(mockSetTimeout).not.toHaveBeenCalled(); // Should not attempt reconnection
    });

    it('should handle performance degradation scenarios', () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      const degradedMetrics: PipelineMetrics = {
        totalModulesProcessed: 50,
        totalResourcesGenerated: 100,
        averageProcessingTime: 45000, // Very slow
        successRate: 0.6, // Low success rate
        errorRate: 0.4, // High error rate
        resourcesByType: { quiz: 30, video: 20, bibliography: 50 },
        qualityScores: {
          average: 0.5, // Low quality
          byType: { quiz: 0.4, video: 0.5, bibliography: 0.6 }
        },
        performance: {
          averageGenerationTime: 30000,
          averageValidationTime: 8000,
          averageHookExecutionTime: 1500
        },
        health: {
          status: 'degraded',
          lastUpdate: new Date(),
          issues: ['High memory usage', 'Database connection slow']
        }
      };

      act(() => {
        const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
        metricsHandler(degradedMetrics);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(degradedMetrics);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle high-frequency data updates efficiently', () => {
      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
        onStatusUpdate: mockOnStatusUpdate,
        onAlertsUpdate: mockOnAlertsUpdate,
      }));

      // Simulate high-frequency updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
          metricsHandler({ totalModulesProcessed: i });
        });
      }

      expect(mockOnMetricsUpdate).toHaveBeenCalledTimes(100);
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useMonitoringWebSocket({}));

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Function references should be stable
      expect(secondRender.sendMessage).toBe(firstRender.sendMessage);
      expect(secondRender.acknowledgeAlert).toBe(firstRender.acknowledgeAlert);
    });

    it('should handle memory pressure scenarios', () => {
      // Simulate memory pressure by creating large data objects
      const largeMetrics: PipelineMetrics = {
        totalModulesProcessed: 10000,
        totalResourcesGenerated: 50000,
        averageProcessingTime: 15000,
        successRate: 0.95,
        errorRate: 0.05,
        resourcesByType: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`type_${i}`, Math.random() * 1000])
        ),
        qualityScores: {
          average: 0.85,
          byType: Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [`type_${i}`, Math.random()])
          )
        },
        performance: {
          averageGenerationTime: 8000,
          averageValidationTime: 2000,
          averageHookExecutionTime: 300
        },
        health: {
          status: 'healthy',
          lastUpdate: new Date(),
          issues: []
        }
      };

      renderHook(() => useMonitoringWebSocket({
        onMetricsUpdate: mockOnMetricsUpdate,
      }));

      act(() => {
        const metricsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'metrics_update')[1];
        metricsHandler(largeMetrics);
      });

      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(largeMetrics);
    });
  });
});