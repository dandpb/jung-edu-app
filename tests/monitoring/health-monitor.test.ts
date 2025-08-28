import { SystemHealthMonitor } from '../../src/monitoring/core/health-monitor';
import { MonitoringConfig } from '../../src/monitoring/types/monitoring';
import { MetricsCollector } from '../../src/monitoring/metrics/collector';
import { StorageManager } from '../../src/monitoring/storage/memory-store';

// Mock dependencies
jest.mock('../../src/monitoring/metrics/collector');
jest.mock('../../src/monitoring/storage/memory-store');

describe('SystemHealthMonitor', () => {
  let healthMonitor: SystemHealthMonitor;
  let mockConfig: MonitoringConfig;
  let mockMetricsCollector: jest.Mocked<MetricsCollector>;
  let mockStorageManager: jest.Mocked<StorageManager>;

  beforeEach(() => {
    mockConfig = {
      checkInterval: 30000,
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 75, critical: 85 },
        disk: { warning: 80, critical: 95 },
        network: { warning: 500, critical: 1000 }
      },
      metrics: {
        enabled: true,
        collection: {
          system: true,
          application: true,
          custom: true
        },
        retention: 7
      },
      storage: {
        type: 'memory',
        config: {}
      }
    };

    healthMonitor = new SystemHealthMonitor(mockConfig);
    
    // Access private properties for testing
    mockMetricsCollector = (healthMonitor as any).metricsCollector;
    mockStorageManager = (healthMonitor as any).storageManager;
  });

  afterEach(() => {
    healthMonitor.stop();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(healthMonitor).toBeInstanceOf(SystemHealthMonitor);
      expect(mockMetricsCollector).toBeDefined();
      expect(mockStorageManager).toBeDefined();
    });

    it('should set up default health checks', () => {
      const status = healthMonitor.getStatus();
      expect(status.checksCount).toBe(4); // CPU, Memory, Disk, Network
    });
  });

  describe('health checks', () => {
    beforeEach(() => {
      // Setup mock return values
      mockMetricsCollector.getCpuUsage.mockResolvedValue(50);
      mockMetricsCollector.getMemoryUsage.mockResolvedValue({
        total: 1000000,
        used: 400000,
        free: 600000
      });
      mockMetricsCollector.getDiskUsage.mockResolvedValue({
        total: 2000000,
        used: 800000,
        free: 1200000,
        path: '/'
      });
      mockMetricsCollector.getNetworkLatency.mockResolvedValue(100);
      mockStorageManager.storeHealthResults.mockResolvedValue();
    });

    it('should perform health checks and emit healthy status', async () => {
      const healthCheckPromise = new Promise((resolve) => {
        healthMonitor.once('healthCheck', resolve);
      });

      await healthMonitor.start();
      
      const result = await healthCheckPromise;
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('overallStatus', 'healthy');
    });

    it('should detect warning conditions', async () => {
      // Set CPU usage to warning level
      mockMetricsCollector.getCpuUsage.mockResolvedValue(80);

      const warningPromise = new Promise((resolve) => {
        healthMonitor.once('warning', resolve);
      });

      await healthMonitor.start();
      
      const warningResult = await warningPromise;
      
      expect(warningResult).toHaveProperty('service', 'cpu');
      expect(warningResult).toHaveProperty('status', 'warning');
      expect(warningResult).toHaveProperty('value', 80);
    });

    it('should detect critical conditions', async () => {
      // Set memory usage to critical level
      mockMetricsCollector.getMemoryUsage.mockResolvedValue({
        total: 1000000,
        used: 900000, // 90%
        free: 100000
      });

      const criticalPromise = new Promise((resolve) => {
        healthMonitor.once('critical', resolve);
      });

      await healthMonitor.start();
      
      const criticalResult = await criticalPromise;
      
      expect(criticalResult).toHaveProperty('service', 'memory');
      expect(criticalResult).toHaveProperty('status', 'critical');
    });
  });

  describe('custom health checks', () => {
    it('should allow adding custom health checks', () => {
      const customCheck = jest.fn().mockResolvedValue({
        service: 'custom-service',
        status: 'healthy' as const,
        value: 100,
        threshold: { warning: 200, critical: 300 },
        timestamp: new Date(),
        message: 'Custom service is healthy'
      });

      healthMonitor.addHealthCheck('custom', customCheck);
      
      const status = healthMonitor.getStatus();
      expect(status.checksCount).toBe(5); // 4 default + 1 custom
    });

    it('should allow removing health checks', () => {
      const customCheck = jest.fn().mockResolvedValue({
        service: 'custom-service',
        status: 'healthy' as const,
        value: 100,
        threshold: { warning: 200, critical: 300 },
        timestamp: new Date(),
        message: 'Custom service is healthy'
      });

      healthMonitor.addHealthCheck('custom', customCheck);
      expect(healthMonitor.getStatus().checksCount).toBe(5);

      const removed = healthMonitor.removeHealthCheck('custom');
      expect(removed).toBe(true);
      expect(healthMonitor.getStatus().checksCount).toBe(4);
    });
  });

  describe('lifecycle management', () => {
    it('should start and stop monitoring', async () => {
      expect(healthMonitor.getStatus().isRunning).toBe(false);

      await healthMonitor.start();
      expect(healthMonitor.getStatus().isRunning).toBe(true);

      healthMonitor.stop();
      expect(healthMonitor.getStatus().isRunning).toBe(false);
    });

    it('should throw error when starting already running monitor', async () => {
      await healthMonitor.start();
      
      await expect(healthMonitor.start()).rejects.toThrow(
        'Health monitor is already running'
      );
    });

    it('should handle stop when not running gracefully', () => {
      expect(() => healthMonitor.stop()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle failed health checks gracefully', async () => {
      mockMetricsCollector.getCpuUsage.mockRejectedValue(new Error('CPU check failed'));
      mockMetricsCollector.getMemoryUsage.mockResolvedValue({
        total: 1000000,
        used: 400000,
        free: 600000
      });

      const healthCheckPromise = new Promise((resolve) => {
        healthMonitor.once('healthCheck', resolve);
      });

      await healthMonitor.start();
      
      const result: any = await healthCheckPromise;
      
      // Should include error result for failed CPU check
      const cpuResult = result.results.find((r: any) => r.service === 'cpu');
      expect(cpuResult).toHaveProperty('status', 'critical');
      expect(cpuResult).toHaveProperty('error');
    });

    it('should emit error events for monitoring errors', async () => {
      mockStorageManager.storeHealthResults.mockRejectedValue(new Error('Storage error'));

      const errorPromise = new Promise((resolve) => {
        healthMonitor.once('error', resolve);
      });

      await healthMonitor.start();
      
      const error = await errorPromise;
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('data retrieval', () => {
    it('should return latest metrics', async () => {
      const mockMetrics = {
        timestamp: new Date(),
        cpu: { usage: 50, cores: 4, loadAverage: [1, 2, 3] },
        memory: { total: 1000000, used: 400000, free: 600000 },
        disk: { total: 2000000, used: 800000, free: 1200000, path: '/' },
        network: { latency: 100, bytesIn: 1000, bytesOut: 2000 }
      };

      mockMetricsCollector.getAllMetrics.mockResolvedValue(mockMetrics);

      const metrics = await healthMonitor.getLatestMetrics();
      expect(metrics).toEqual(mockMetrics);
      expect(mockMetricsCollector.getAllMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return health history from storage', async () => {
      const mockHistory = [
        {
          service: 'cpu',
          status: 'healthy' as const,
          value: 50,
          threshold: { warning: 70, critical: 90 },
          timestamp: new Date(),
          message: 'CPU usage normal'
        }
      ];

      mockStorageManager.getHealthHistory.mockResolvedValue(mockHistory);

      const timeRange = {
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      };

      const history = await healthMonitor.getHealthHistory(timeRange);
      expect(history).toEqual(mockHistory);
      expect(mockStorageManager.getHealthHistory).toHaveBeenCalledWith(timeRange);
    });
  });

  describe('configuration', () => {
    it('should return current configuration and status', () => {
      const status = healthMonitor.getStatus();
      
      expect(status).toHaveProperty('isRunning', false);
      expect(status).toHaveProperty('checksCount', 4);
      expect(status).toHaveProperty('config', mockConfig);
    });
  });

  describe('event emissions', () => {
    it('should emit started event when monitoring starts', async () => {
      const startedPromise = new Promise((resolve) => {
        healthMonitor.once('started', resolve);
      });

      await healthMonitor.start();
      
      await expect(startedPromise).resolves.toBeUndefined();
    });

    it('should emit stopped event when monitoring stops', async () => {
      const stoppedPromise = new Promise((resolve) => {
        healthMonitor.once('stopped', resolve);
      });

      await healthMonitor.start();
      healthMonitor.stop();
      
      await expect(stoppedPromise).resolves.toBeUndefined();
    });
  });
});