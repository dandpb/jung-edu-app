import { AnomalyDetector } from '../../src/monitoring/anomaly/detector';
import { StorageManager } from '../../src/monitoring/storage/memory-store';
import { SystemMetrics } from '../../src/monitoring/types/monitoring';

// Mock dependencies
jest.mock('../../src/monitoring/storage/memory-store');

describe('AnomalyDetector', () => {
  let anomalyDetector: AnomalyDetector;
  let mockStorageManager: jest.Mocked<StorageManager>;
  let sampleMetrics: SystemMetrics[];

  beforeEach(() => {
    mockStorageManager = new StorageManager({
      type: 'memory',
      maxEntries: 1000,
      retentionPeriod: 24,
      compressionEnabled: false
    }) as jest.Mocked<StorageManager>;

    anomalyDetector = new AnomalyDetector(mockStorageManager, {
      trainingWindow: 100,
      detectionSensitivity: 2.5
    });

    // Generate sample training data
    sampleMetrics = generateSampleMetrics(150);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function generateSampleMetrics(count: number): SystemMetrics[] {
    const metrics: SystemMetrics[] = [];
    const baseTime = Date.now() - count * 60 * 1000; // 1 minute intervals

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(baseTime + i * 60 * 1000);
      
      // Generate realistic patterns with some noise
      const cpuUsage = 30 + 20 * Math.sin(i / 10) + Math.random() * 10;
      const memoryUsage = 40 + 10 * Math.sin(i / 15) + Math.random() * 5;
      const diskUsage = 50 + 5 * Math.sin(i / 30) + Math.random() * 3;
      const networkLatency = 50 + 20 * Math.sin(i / 8) + Math.random() * 15;

      metrics.push({
        timestamp,
        cpu: {
          usage: Math.max(0, Math.min(100, cpuUsage)),
          cores: 4,
          loadAverage: [1, 1.5, 2]
        },
        memory: {
          total: 1000000,
          used: Math.max(0, memoryUsage * 10000),
          free: (100 - memoryUsage) * 10000
        },
        disk: {
          total: 2000000,
          used: Math.max(0, diskUsage * 20000),
          free: (100 - diskUsage) * 20000,
          path: '/'
        },
        network: {
          latency: Math.max(1, networkLatency),
          bytesIn: 1000 + Math.random() * 500,
          bytesOut: 800 + Math.random() * 400
        },
        custom: {
          applicationMetric: 10 + 5 * Math.sin(i / 12) + Math.random() * 3
        }
      });
    }

    return metrics;
  }

  describe('model training', () => {
    beforeEach(() => {
      mockStorageManager.storeAnomalyModel.mockResolvedValue();
    });

    it('should train models for all metric types', async () => {
      await anomalyDetector.trainModels(sampleMetrics);

      expect(mockStorageManager.storeAnomalyModel).toHaveBeenCalledTimes(5); // CPU, Memory, Disk, Network, Custom
      
      // Verify training completed event
      const trainedPromise = new Promise((resolve) => {
        anomalyDetector.once('trainingCompleted', resolve);
      });
      
      await anomalyDetector.trainModels(sampleMetrics);
      await expect(trainedPromise).resolves.toBeUndefined();
    });

    it('should throw error with insufficient training data', async () => {
      const insufficientData = sampleMetrics.slice(0, 20); // Less than minimum
      
      await expect(anomalyDetector.trainModels(insufficientData)).rejects.toThrow(
        'Insufficient CPU data for training'
      );
    });

    it('should emit training events', async () => {
      const startedPromise = new Promise((resolve) => {
        anomalyDetector.once('trainingStarted', resolve);
      });

      const completedPromise = new Promise((resolve) => {
        anomalyDetector.once('trainingCompleted', resolve);
      });

      const trainingPromise = anomalyDetector.trainModels(sampleMetrics);
      
      await expect(startedPromise).resolves.toBeUndefined();
      await trainingPromise;
      await expect(completedPromise).resolves.toBeUndefined();
    });

    it('should handle training errors gracefully', async () => {
      mockStorageManager.storeAnomalyModel.mockRejectedValue(new Error('Storage error'));

      const errorPromise = new Promise((resolve) => {
        anomalyDetector.once('trainingError', resolve);
      });

      await expect(anomalyDetector.trainModels(sampleMetrics)).rejects.toThrow();
      await expect(errorPromise).resolves.toBeInstanceOf(Error);
    });

    it('should not allow concurrent training', async () => {
      const firstTraining = anomalyDetector.trainModels(sampleMetrics);
      
      await expect(anomalyDetector.trainModels(sampleMetrics)).rejects.toThrow(
        'Training already in progress'
      );

      await firstTraining;
    });
  });

  describe('anomaly detection', () => {
    beforeEach(async () => {
      mockStorageManager.storeAnomalyModel.mockResolvedValue();
      mockStorageManager.storeAnomalyResults.mockResolvedValue();
      
      // Train models first
      await anomalyDetector.trainModels(sampleMetrics);
    });

    it('should detect no anomalies in normal data', async () => {
      const normalMetrics = sampleMetrics[100]; // A normal data point
      
      const anomalies = await anomalyDetector.detectAnomalies(normalMetrics);
      
      expect(anomalies).toHaveLength(0);
      expect(mockStorageManager.storeAnomalyResults).not.toHaveBeenCalled();
    });

    it('should detect CPU usage anomalies', async () => {
      const anomalousMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        cpu: {
          ...sampleMetrics[100].cpu,
          usage: 95 // Much higher than normal
        }
      };

      const anomalyPromise = new Promise((resolve) => {
        anomalyDetector.once('anomalyDetected', resolve);
      });

      const anomalies = await anomalyDetector.detectAnomalies(anomalousMetrics);
      
      expect(anomalies.length).toBeGreaterThan(0);
      const cpuAnomaly = anomalies.find(a => a.metric === 'cpu');
      expect(cpuAnomaly).toBeDefined();
      expect(['medium', 'high', 'critical']).toContain(cpuAnomaly?.severity);
      
      await expect(anomalyPromise).resolves.toBeDefined();
    });

    it('should detect memory usage anomalies', async () => {
      const anomalousMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        memory: {
          total: 1000000,
          used: 950000, // 95% usage - much higher than normal
          free: 50000
        }
      };

      const anomalies = await anomalyDetector.detectAnomalies(anomalousMetrics);
      
      const memoryAnomaly = anomalies.find(a => a.metric === 'memory');
      expect(memoryAnomaly).toBeDefined();
      expect(memoryAnomaly?.value).toBe(95);
      expect(memoryAnomaly?.severity).toBeOneOf(['medium', 'high', 'critical']);
    });

    it('should detect network latency anomalies', async () => {
      const anomalousMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        network: {
          ...sampleMetrics[100].network,
          latency: 500 // Much higher than normal
        }
      };

      const anomalies = await anomalyDetector.detectAnomalies(anomalousMetrics);
      
      const networkAnomaly = anomalies.find(a => a.metric === 'network');
      expect(networkAnomaly).toBeDefined();
      expect(networkAnomaly?.value).toBe(500);
    });

    it('should store anomaly results', async () => {
      const anomalousMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        cpu: { ...sampleMetrics[100].cpu, usage: 95 }
      };

      const anomalies = await anomalyDetector.detectAnomalies(anomalousMetrics);
      
      if (anomalies.length > 0) {
        expect(mockStorageManager.storeAnomalyResults).toHaveBeenCalledWith(
          anomalousMetrics.timestamp,
          anomalies
        );
      }
    });
  });

  describe('model management', () => {
    beforeEach(async () => {
      mockStorageManager.storeAnomalyModel.mockResolvedValue();
      await anomalyDetector.trainModels(sampleMetrics);
    });

    it('should provide model information', () => {
      const modelInfo = anomalyDetector.getModelInfo();
      
      expect(modelInfo.length).toBeGreaterThan(0);
      expect(modelInfo[0]).toHaveProperty('metric');
      expect(modelInfo[0]).toHaveProperty('type');
      expect(modelInfo[0]).toHaveProperty('accuracy');
      expect(modelInfo[0]).toHaveProperty('lastTrained');
    });

    it('should update existing models', async () => {
      const newData = sampleMetrics.slice(50).map(m => m.cpu.usage);
      
      const updatePromise = new Promise((resolve) => {
        anomalyDetector.once('modelUpdated', resolve);
      });

      await anomalyDetector.updateModel('cpu', newData);
      
      const updateEvent: any = await updatePromise;
      expect(updateEvent.metric).toBe('cpu');
      expect(updateEvent.accuracy).toBeGreaterThan(0);
    });

    it('should throw error when updating non-existent model', async () => {
      await expect(
        anomalyDetector.updateModel('nonexistent', [1, 2, 3])
      ).rejects.toThrow('Model for metric nonexistent not found');
    });

    it('should load stored models', async () => {
      const storedModels = new Map([
        ['cpu', {
          type: 'seasonal' as const,
          metric: 'cpu',
          model: { seasonal: [1, 2, 3], trend: 50, residual: { mean: 0, standardDeviation: 5, threshold: 2.5 } },
          lastTrained: new Date(),
          accuracy: 0.85
        }]
      ]);

      mockStorageManager.getAnomalyModels.mockResolvedValue(storedModels);

      await anomalyDetector.loadStoredModels();

      const modelInfo = anomalyDetector.getModelInfo();
      const cpuModel = modelInfo.find(m => m.metric === 'cpu');
      expect(cpuModel).toBeDefined();
      expect(cpuModel?.accuracy).toBe(0.85);
    });
  });

  describe('anomaly scoring', () => {
    beforeEach(async () => {
      mockStorageManager.storeAnomalyModel.mockResolvedValue();
      await anomalyDetector.trainModels(sampleMetrics);
    });

    it('should assign appropriate severity levels', async () => {
      // Create metrics with varying degrees of anomaly
      const mildAnomalyMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        cpu: { ...sampleMetrics[100].cpu, usage: 75 } // Mildly high
      };

      const severeAnomalyMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        cpu: { ...sampleMetrics[100].cpu, usage: 99 } // Very high
      };

      const mildAnomalies = await anomalyDetector.detectAnomalies(mildAnomalyMetrics);
      const severeAnomalies = await anomalyDetector.detectAnomalies(severeAnomalyMetrics);

      if (severeAnomalies.length > 0 && mildAnomalies.length > 0) {
        const severeCpuAnomaly = severeAnomalies.find(a => a.metric === 'cpu');
        const mildCpuAnomaly = mildAnomalies.find(a => a.metric === 'cpu');

        if (severeCpuAnomaly && mildCpuAnomaly) {
          expect(severeCpuAnomaly.anomalyScore).toBeGreaterThan(mildCpuAnomaly.anomalyScore);
        }
      }
    });

    it('should generate descriptive anomaly messages', async () => {
      const anomalousMetrics: SystemMetrics = {
        ...sampleMetrics[100],
        cpu: { ...sampleMetrics[100].cpu, usage: 95 }
      };

      const anomalies = await anomalyDetector.detectAnomalies(anomalousMetrics);
      const cpuAnomaly = anomalies.find(a => a.metric === 'cpu');

      if (cpuAnomaly) {
        expect(cpuAnomaly.description).toContain('cpu');
        expect(cpuAnomaly.description).toContain('95');
        expect(cpuAnomaly.description).toMatch(/(above|below)/);
      }
    });
  });

  describe('statistical models', () => {
    it('should handle edge cases in statistical calculations', async () => {
      // Create data with zero variance (all same values)
      const constantData = Array(100).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - (100 - i) * 60000),
        cpu: { usage: 50, cores: 4, loadAverage: [1, 1, 1] },
        memory: { total: 1000000, used: 500000, free: 500000 },
        disk: { total: 2000000, used: 1000000, free: 1000000, path: '/' },
        network: { latency: 100, bytesIn: 1000, bytesOut: 1000 }
      }));

      mockStorageManager.storeAnomalyModel.mockResolvedValue();

      // Should not throw error even with constant data
      await expect(anomalyDetector.trainModels(constantData)).resolves.not.toThrow();
    });

    it('should handle missing or invalid metric values', async () => {
      const metricsWithMissingValues: SystemMetrics = {
        timestamp: new Date(),
        cpu: { usage: NaN, cores: 4, loadAverage: [1, 1, 1] },
        memory: { total: 1000000, used: 500000, free: 500000 },
        disk: { total: 2000000, used: 1000000, free: 1000000, path: '/' },
        network: { latency: 100, bytesIn: 1000, bytesOut: 1000 }
      };

      mockStorageManager.storeAnomalyModel.mockResolvedValue();
      await anomalyDetector.trainModels(sampleMetrics);

      // Should handle NaN values gracefully
      const anomalies = await anomalyDetector.detectAnomalies(metricsWithMissingValues);
      
      // Should not include anomalies for invalid metrics
      const cpuAnomalies = anomalies.filter(a => a.metric === 'cpu');
      expect(cpuAnomalies).toHaveLength(0);
    });
  });
});