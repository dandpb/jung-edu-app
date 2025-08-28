import { EventEmitter } from 'events';
import { 
  SystemMetrics, 
  HealthCheckResult, 
  Alert, 
  AnomalyResult, 
  AnomalyModel,
  PredictionResult 
} from '../types/monitoring';

interface StorageConfig {
  type: 'memory' | 'file' | 'database';
  maxEntries: number;
  retentionPeriod: number; // Hours
  compressionEnabled: boolean;
}

interface TimeSeriesEntry<T> {
  timestamp: Date;
  data: T;
}

export class StorageManager extends EventEmitter {
  private config: StorageConfig;
  private metricsStore: TimeSeriesEntry<SystemMetrics>[];
  private healthResultsStore: TimeSeriesEntry<HealthCheckResult[]>[];
  private alertsStore: Map<string, Alert>;
  private anomaliesStore: TimeSeriesEntry<AnomalyResult[]>[];
  private modelsStore: Map<string, AnomalyModel>;
  private predictionsStore: TimeSeriesEntry<PredictionResult[]>[];
  
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: StorageConfig) {
    super();
    this.config = config;
    this.metricsStore = [];
    this.healthResultsStore = [];
    this.alertsStore = new Map();
    this.anomaliesStore = [];
    this.modelsStore = new Map();
    this.predictionsStore = [];
    
    this.startCleanupProcess();
  }

  // Metrics Storage
  public async storeMetrics(metrics: SystemMetrics): Promise<void> {
    const entry: TimeSeriesEntry<SystemMetrics> = {
      timestamp: metrics.timestamp,
      data: metrics
    };

    this.metricsStore.push(entry);
    this.enforceMaxEntries(this.metricsStore);
    
    this.emit('metricsStored', metrics);
  }

  public async getMetrics(timeRange: { start: Date; end: Date }): Promise<SystemMetrics[]> {
    return this.metricsStore
      .filter(entry => 
        entry.timestamp >= timeRange.start && 
        entry.timestamp <= timeRange.end
      )
      .map(entry => entry.data)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public async getLatestMetrics(count: number = 1): Promise<SystemMetrics[]> {
    return this.metricsStore
      .slice(-count)
      .map(entry => entry.data);
  }

  public async getMetricsByType(metricType: keyof SystemMetrics, timeRange: { start: Date; end: Date }): Promise<Array<{ timestamp: Date; value: any }>> {
    return this.metricsStore
      .filter(entry => 
        entry.timestamp >= timeRange.start && 
        entry.timestamp <= timeRange.end
      )
      .map(entry => ({
        timestamp: entry.timestamp,
        value: entry.data[metricType]
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Health Results Storage
  public async storeHealthResults(results: HealthCheckResult[]): Promise<void> {
    const entry: TimeSeriesEntry<HealthCheckResult[]> = {
      timestamp: new Date(),
      data: results
    };

    this.healthResultsStore.push(entry);
    this.enforceMaxEntries(this.healthResultsStore);
    
    this.emit('healthResultsStored', results);
  }

  public async getHealthHistory(timeRange: { start: Date; end: Date }): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    this.healthResultsStore
      .filter(entry => 
        entry.timestamp >= timeRange.start && 
        entry.timestamp <= timeRange.end
      )
      .forEach(entry => {
        results.push(...entry.data);
      });

    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public async getHealthResultsByService(service: string, timeRange: { start: Date; end: Date }): Promise<HealthCheckResult[]> {
    const allResults = await this.getHealthHistory(timeRange);
    return allResults.filter(result => result.service === service);
  }

  // Alert Storage
  public async storeAlert(alert: Alert): Promise<void> {
    this.alertsStore.set(alert.id, { ...alert });
    this.emit('alertStored', alert);
  }

  public async updateAlert(alert: Alert): Promise<void> {
    if (!this.alertsStore.has(alert.id)) {
      throw new Error(`Alert ${alert.id} not found`);
    }
    
    this.alertsStore.set(alert.id, { ...alert });
    this.emit('alertUpdated', alert);
  }

  public async getAlert(alertId: string): Promise<Alert | null> {
    return this.alertsStore.get(alertId) || null;
  }

  public async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alertsStore.values());
  }

  public async getAlertHistory(timeRange: { start: Date; end: Date }): Promise<Alert[]> {
    return Array.from(this.alertsStore.values())
      .filter(alert => 
        alert.timestamp >= timeRange.start && 
        alert.timestamp <= timeRange.end
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alertsStore.values())
      .filter(alert => alert.status === 'active');
  }

  // Anomaly Results Storage
  public async storeAnomalyResults(timestamp: Date, anomalies: AnomalyResult[]): Promise<void> {
    const entry: TimeSeriesEntry<AnomalyResult[]> = {
      timestamp,
      data: anomalies
    };

    this.anomaliesStore.push(entry);
    this.enforceMaxEntries(this.anomaliesStore);
    
    this.emit('anomaliesStored', anomalies);
  }

  public async getAnomalies(timeRange: { start: Date; end: Date }): Promise<AnomalyResult[]> {
    const results: AnomalyResult[] = [];
    
    this.anomaliesStore
      .filter(entry => 
        entry.timestamp >= timeRange.start && 
        entry.timestamp <= timeRange.end
      )
      .forEach(entry => {
        results.push(...entry.data);
      });

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async getAnomaliesByMetric(metric: string, timeRange: { start: Date; end: Date }): Promise<AnomalyResult[]> {
    const allAnomalies = await this.getAnomalies(timeRange);
    return allAnomalies.filter(anomaly => anomaly.metric === metric);
  }

  // Anomaly Models Storage
  public async storeAnomalyModel(metricName: string, model: AnomalyModel): Promise<void> {
    this.modelsStore.set(metricName, { ...model });
    this.emit('modelStored', { metricName, model });
  }

  public async getAnomalyModel(metricName: string): Promise<AnomalyModel | null> {
    return this.modelsStore.get(metricName) || null;
  }

  public async getAnomalyModels(): Promise<Map<string, AnomalyModel>> {
    return new Map(this.modelsStore);
  }

  // Predictions Storage
  public async storePredictions(predictions: PredictionResult[]): Promise<void> {
    const entry: TimeSeriesEntry<PredictionResult[]> = {
      timestamp: new Date(),
      data: predictions
    };

    this.predictionsStore.push(entry);
    this.enforceMaxEntries(this.predictionsStore);
    
    this.emit('predictionsStored', predictions);
  }

  public async getPredictions(timeRange: { start: Date; end: Date }): Promise<PredictionResult[]> {
    const results: PredictionResult[] = [];
    
    this.predictionsStore
      .filter(entry => 
        entry.timestamp >= timeRange.start && 
        entry.timestamp <= timeRange.end
      )
      .forEach(entry => {
        results.push(...entry.data);
      });

    return results.sort((a, b) => b.timeHorizon - a.timeHorizon);
  }

  // Aggregation Methods
  public async getMetricsAggregated(
    metricType: keyof SystemMetrics,
    timeRange: { start: Date; end: Date },
    aggregation: 'avg' | 'min' | 'max' | 'sum' = 'avg',
    bucketSize: number = 60000 // 1 minute buckets
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const metrics = await this.getMetricsByType(metricType, timeRange);
    const buckets = new Map<number, number[]>();
    
    // Group metrics into time buckets
    metrics.forEach(metric => {
      const bucketKey = Math.floor(metric.timestamp.getTime() / bucketSize) * bucketSize;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      
      // Extract numeric value from metric
      const value = this.extractNumericValue(metric.value);
      if (value !== null) {
        buckets.get(bucketKey)!.push(value);
      }
    });

    // Calculate aggregated values
    const result: Array<{ timestamp: Date; value: number }> = [];
    
    for (const [bucketKey, values] of buckets) {
      if (values.length === 0) continue;
      
      let aggregatedValue: number;
      switch (aggregation) {
        case 'avg':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
      
      result.push({
        timestamp: new Date(bucketKey),
        value: aggregatedValue
      });
    }

    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private extractNumericValue(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Handle complex metric objects
      if ('usage' in value) return value.usage;
      if ('used' in value && 'total' in value) return (value.used / value.total) * 100;
      if ('latency' in value) return value.latency;
    }
    
    return null;
  }

  // Storage Management
  private enforceMaxEntries<T>(store: TimeSeriesEntry<T>[]): void {
    while (store.length > this.config.maxEntries) {
      const removed = store.shift();
      if (removed) {
        this.emit('entryEvicted', { timestamp: removed.timestamp, type: 'metrics' });
      }
    }
  }

  private startCleanupProcess(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);
  }

  private performCleanup(): void {
    const cutoffTime = new Date(Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000));
    
    // Clean up metrics
    const metricsRemoved = this.cleanupStore(this.metricsStore, cutoffTime);
    const healthRemoved = this.cleanupStore(this.healthResultsStore, cutoffTime);
    const anomaliesRemoved = this.cleanupStore(this.anomaliesStore, cutoffTime);
    const predictionsRemoved = this.cleanupStore(this.predictionsStore, cutoffTime);
    
    // Clean up alerts (keep resolved alerts for longer)
    const alertCutoffTime = new Date(Date.now() - (this.config.retentionPeriod * 2 * 60 * 60 * 1000));
    let alertsRemoved = 0;
    
    for (const [id, alert] of this.alertsStore) {
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt < alertCutoffTime) {
        this.alertsStore.delete(id);
        alertsRemoved++;
      }
    }

    if (metricsRemoved + healthRemoved + anomaliesRemoved + predictionsRemoved + alertsRemoved > 0) {
      this.emit('cleanup', {
        metricsRemoved,
        healthRemoved,
        anomaliesRemoved,
        predictionsRemoved,
        alertsRemoved,
        cutoffTime
      });
    }
  }

  private cleanupStore<T>(store: TimeSeriesEntry<T>[], cutoffTime: Date): number {
    const initialLength = store.length;
    const filtered = store.filter(entry => entry.timestamp >= cutoffTime);
    store.length = 0;
    store.push(...filtered);
    return initialLength - store.length;
  }

  // Statistics
  public getStorageStats(): {
    metrics: { count: number; oldest?: Date; newest?: Date };
    healthResults: { count: number; oldest?: Date; newest?: Date };
    alerts: { total: number; active: number; resolved: number };
    anomalies: { count: number; oldest?: Date; newest?: Date };
    models: { count: number };
    predictions: { count: number; oldest?: Date; newest?: Date };
  } {
    const getTimeRange = <T>(store: TimeSeriesEntry<T>[]) => ({
      oldest: store.length > 0 ? store[0].timestamp : undefined,
      newest: store.length > 0 ? store[store.length - 1].timestamp : undefined
    });

    const alerts = Array.from(this.alertsStore.values());

    return {
      metrics: {
        count: this.metricsStore.length,
        ...getTimeRange(this.metricsStore)
      },
      healthResults: {
        count: this.healthResultsStore.length,
        ...getTimeRange(this.healthResultsStore)
      },
      alerts: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        resolved: alerts.filter(a => a.status === 'resolved').length
      },
      anomalies: {
        count: this.anomaliesStore.length,
        ...getTimeRange(this.anomaliesStore)
      },
      models: {
        count: this.modelsStore.size
      },
      predictions: {
        count: this.predictionsStore.length,
        ...getTimeRange(this.predictionsStore)
      }
    };
  }

  // Backup and Restore
  public async exportData(): Promise<{
    timestamp: Date;
    metrics: TimeSeriesEntry<SystemMetrics>[];
    healthResults: TimeSeriesEntry<HealthCheckResult[]>[];
    alerts: Alert[];
    anomalies: TimeSeriesEntry<AnomalyResult[]>[];
    models: Array<[string, AnomalyModel]>;
    predictions: TimeSeriesEntry<PredictionResult[]>[];
  }> {
    return {
      timestamp: new Date(),
      metrics: [...this.metricsStore],
      healthResults: [...this.healthResultsStore],
      alerts: Array.from(this.alertsStore.values()),
      anomalies: [...this.anomaliesStore],
      models: Array.from(this.modelsStore.entries()),
      predictions: [...this.predictionsStore]
    };
  }

  public async importData(data: any): Promise<void> {
    if (data.metrics) {
      this.metricsStore.push(...data.metrics);
    }
    if (data.healthResults) {
      this.healthResultsStore.push(...data.healthResults);
    }
    if (data.alerts) {
      data.alerts.forEach((alert: Alert) => {
        this.alertsStore.set(alert.id, alert);
      });
    }
    if (data.anomalies) {
      this.anomaliesStore.push(...data.anomalies);
    }
    if (data.models) {
      data.models.forEach(([key, model]: [string, AnomalyModel]) => {
        this.modelsStore.set(key, model);
      });
    }
    if (data.predictions) {
      this.predictionsStore.push(...data.predictions);
    }

    this.emit('dataImported', { recordsImported: Object.keys(data).length });
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}