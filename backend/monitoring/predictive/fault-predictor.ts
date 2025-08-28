import { EventEmitter } from 'events';
import { SystemMetrics, PredictionResult, AnomalyResult } from '../types/monitoring';
import { StorageManager } from '../storage/memory-store';

interface PredictionModel {
  type: 'linear' | 'exponential' | 'arima' | 'ml';
  coefficients: number[];
  accuracy: number;
  lastTrained: Date;
  trainingDataCount: number;
}

interface RiskFactors {
  trend: number; // -1 to 1, negative means declining
  volatility: number; // 0 to 1, higher means more volatile
  seasonality: number; // 0 to 1, seasonal component strength
  anomalyFrequency: number; // 0 to 1, frequency of recent anomalies
}

export class FaultPredictor extends EventEmitter {
  private storageManager: StorageManager;
  private models: Map<string, PredictionModel>;
  private predictionHorizons: number[]; // Minutes into future
  private riskThresholds: { low: number; medium: number; high: number };
  private minTrainingData: number;

  constructor(storageManager: StorageManager, options: {
    predictionHorizons?: number[];
    riskThresholds?: { low: number; medium: number; high: number };
    minTrainingData?: number;
  } = {}) {
    super();
    this.storageManager = storageManager;
    this.models = new Map();
    this.predictionHorizons = options.predictionHorizons || [5, 15, 30, 60, 180, 360]; // 5min to 6h
    this.riskThresholds = options.riskThresholds || { low: 0.3, medium: 0.6, high: 0.8 };
    this.minTrainingData = options.minTrainingData || 100;
  }

  public async trainPredictionModels(): Promise<void> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    try {
      const historicalMetrics = await this.storageManager.getMetrics({ start: startTime, end: endTime });
      
      if (historicalMetrics.length < this.minTrainingData) {
        throw new Error(`Insufficient training data: ${historicalMetrics.length} < ${this.minTrainingData}`);
      }

      // Train models for each metric type
      await Promise.all([
        this.trainMetricModel('cpu', historicalMetrics.map(m => m.cpu.usage)),
        this.trainMetricModel('memory', historicalMetrics.map(m => (m.memory.used / m.memory.total) * 100)),
        this.trainMetricModel('disk', historicalMetrics.map(m => (m.disk.used / m.disk.total) * 100)),
        this.trainMetricModel('network', historicalMetrics.map(m => m.network.latency)),
        this.trainCustomMetricModels(historicalMetrics)
      ]);

      this.emit('modelsTrained', {
        modelsCount: this.models.size,
        trainingDataPoints: historicalMetrics.length,
        trainedAt: new Date()
      });

    } catch (error) {
      this.emit('trainingError', error);
      throw error;
    }
  }

  private async trainMetricModel(metricName: string, data: number[]): Promise<void> {
    // Remove outliers using IQR method
    const cleanedData = this.removeOutliers(data);
    
    // Try different model types and select the best one
    const models = await Promise.all([
      this.trainLinearModel(cleanedData),
      this.trainExponentialModel(cleanedData),
      this.trainARIMAModel(cleanedData)
    ]);

    // Select model with highest accuracy
    const bestModel = models.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );

    this.models.set(metricName, bestModel);
    await this.storageManager.storeAnomalyModel(`prediction_${metricName}`, {
      type: 'ml',
      metric: metricName,
      model: bestModel,
      lastTrained: new Date(),
      accuracy: bestModel.accuracy
    });
  }

  private async trainCustomMetricModels(metrics: SystemMetrics[]): Promise<void> {
    const customMetrics = new Set<string>();
    
    metrics.forEach(metric => {
      if (metric.custom) {
        Object.keys(metric.custom).forEach(key => customMetrics.add(key));
      }
    });

    for (const metricName of customMetrics) {
      const data = metrics
        .map(m => m.custom?.[metricName])
        .filter(val => val !== undefined) as number[];

      if (data.length >= this.minTrainingData) {
        await this.trainMetricModel(`custom_${metricName}`, data);
      }
    }
  }

  private removeOutliers(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return data.filter(val => val >= lowerBound && val <= upperBound);
  }

  private async trainLinearModel(data: number[]): Promise<PredictionModel> {
    // Simple linear regression: y = mx + b
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for accuracy
    const yMean = sumY / n;
    const totalSumSquares = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = data.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = Math.max(0, 1 - (residualSumSquares / totalSumSquares));

    return {
      type: 'linear',
      coefficients: [intercept, slope],
      accuracy: rSquared,
      lastTrained: new Date(),
      trainingDataCount: n
    };
  }

  private async trainExponentialModel(data: number[]): Promise<PredictionModel> {
    // Exponential smoothing model
    const alpha = 0.3; // Smoothing factor
    const smoothed = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    }

    // Calculate accuracy based on prediction errors
    const errors = data.slice(1).map((actual, i) => Math.abs(actual - smoothed[i]));
    const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const dataRange = Math.max(...data) - Math.min(...data);
    const accuracy = Math.max(0, 1 - (meanError / dataRange));

    return {
      type: 'exponential',
      coefficients: [alpha, smoothed[smoothed.length - 1]],
      accuracy,
      lastTrained: new Date(),
      trainingDataCount: data.length
    };
  }

  private async trainARIMAModel(data: number[]): Promise<PredictionModel> {
    // Simplified ARIMA(1,1,1) implementation
    // This is a basic implementation - in production, use a proper ARIMA library
    
    // First difference to make series stationary
    const diff = data.slice(1).map((val, i) => val - data[i]);
    
    if (diff.length < 2) {
      // Fallback to simple model
      return this.trainLinearModel(data);
    }

    // AR(1) component
    const sumDiff = diff.slice(1).reduce((sum, val) => sum + val, 0);
    const sumDiffPrev = diff.slice(0, -1).reduce((sum, val) => sum + val, 0);
    const sumDiffDiffPrev = diff.slice(1).reduce((sum, val, i) => sum + val * diff[i], 0);
    const sumDiffPrevSq = diff.slice(0, -1).reduce((sum, val) => sum + val * val, 0);
    
    const n = diff.length - 1;
    const arCoeff = (n * sumDiffDiffPrev - sumDiff * sumDiffPrev) / 
                   (n * sumDiffPrevSq - sumDiffPrev * sumDiffPrev);

    // Calculate residuals for MA component
    const residuals = diff.slice(1).map((val, i) => val - arCoeff * diff[i]);
    const maCoeff = 0.5; // Simplified MA coefficient

    // Calculate accuracy
    const predictions = data.slice(2).map((_, i) => {
      const prevDiff = i > 0 ? diff[i + 1] : diff[0];
      const predictedDiff = arCoeff * prevDiff;
      return data[i + 1] + predictedDiff;
    });

    const errors = predictions.map((pred, i) => Math.abs(pred - data[i + 2]));
    const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const dataRange = Math.max(...data) - Math.min(...data);
    const accuracy = Math.max(0, 1 - (meanError / dataRange));

    return {
      type: 'arima',
      coefficients: [arCoeff, maCoeff, data[data.length - 1], diff[diff.length - 1]],
      accuracy,
      lastTrained: new Date(),
      trainingDataCount: data.length
    };
  }

  public async generatePredictions(currentMetrics: SystemMetrics): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];

    for (const [metricName, model] of this.models) {
      const currentValue = this.extractMetricValue(currentMetrics, metricName);
      if (currentValue === undefined) continue;

      for (const horizon of this.predictionHorizons) {
        const prediction = this.makePrediction(model, currentValue, horizon);
        const riskFactors = await this.calculateRiskFactors(metricName, currentMetrics);
        const riskLevel = this.assessRiskLevel(prediction, currentValue, riskFactors);

        predictions.push({
          metric: metricName,
          currentValue,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          timeHorizon: horizon,
          trend: this.determineTrend(model, currentValue),
          riskLevel
        });
      }
    }

    // Store predictions for analysis
    await this.storageManager.storePredictions(predictions);
    
    // Emit high-risk predictions
    const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high');
    if (highRiskPredictions.length > 0) {
      this.emit('highRiskPredicted', highRiskPredictions);
    }

    return predictions;
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

  private makePrediction(model: PredictionModel, currentValue: number, horizon: number): { value: number; confidence: number } {
    let predictedValue: number;
    
    switch (model.type) {
      case 'linear':
        predictedValue = model.coefficients[0] + model.coefficients[1] * horizon;
        break;
        
      case 'exponential':
        predictedValue = model.coefficients[1]; // Last smoothed value
        break;
        
      case 'arima':
        // Simplified ARIMA prediction
        const [arCoeff, maCoeff, lastValue, lastDiff] = model.coefficients;
        const predictedDiff = arCoeff * lastDiff;
        predictedValue = lastValue + predictedDiff * (horizon / 5); // Scale by time
        break;
        
      default:
        predictedValue = currentValue;
    }

    // Confidence decreases with prediction horizon and increases with model accuracy
    const baseConfidence = model.accuracy;
    const horizonPenalty = Math.exp(-horizon / 60); // Decay over time
    const confidence = Math.max(0.1, baseConfidence * horizonPenalty);

    return {
      value: Math.max(0, predictedValue), // Ensure non-negative
      confidence
    };
  }

  private async calculateRiskFactors(metricName: string, currentMetrics: SystemMetrics): Promise<RiskFactors> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

    // Get recent data for analysis
    const recentMetrics = await this.storageManager.getMetrics({ start: startTime, end: endTime });
    const recentAnomalies = await this.storageManager.getAnomalies({ start: startTime, end: endTime });

    const values = recentMetrics
      .map(m => this.extractMetricValue(m, metricName))
      .filter(v => v !== undefined) as number[];

    if (values.length === 0) {
      return { trend: 0, volatility: 0, seasonality: 0, anomalyFrequency: 0 };
    }

    // Calculate trend
    const trend = this.calculateTrend(values);

    // Calculate volatility (coefficient of variation)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = mean > 0 ? Math.sqrt(variance) / mean : 0;

    // Calculate seasonality (simplified)
    const seasonality = this.calculateSeasonality(values);

    // Calculate anomaly frequency
    const metricAnomalies = recentAnomalies.filter(a => a.metric === metricName);
    const anomalyFrequency = metricAnomalies.length / Math.max(1, recentMetrics.length);

    return {
      trend: Math.max(-1, Math.min(1, trend)),
      volatility: Math.max(0, Math.min(1, volatility)),
      seasonality: Math.max(0, Math.min(1, seasonality)),
      anomalyFrequency: Math.max(0, Math.min(1, anomalyFrequency))
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgValue = sumY / n;
    
    // Normalize slope by average value to get trend strength
    return avgValue > 0 ? slope / avgValue : 0;
  }

  private calculateSeasonality(values: number[]): number {
    // Simple seasonality detection using autocorrelation
    if (values.length < 24) return 0; // Need at least 24 points for hourly seasonality

    const period = 24; // Assume hourly data with daily seasonality
    let correlation = 0;
    let count = 0;

    for (let i = 0; i < values.length - period; i++) {
      correlation += values[i] * values[i + period];
      count++;
    }

    if (count === 0) return 0;

    const avgCorrelation = correlation / count;
    const avgSquared = values.reduce((sum, val) => sum + val * val, 0) / values.length;
    
    return avgSquared > 0 ? Math.abs(avgCorrelation) / avgSquared : 0;
  }

  private determineTrend(model: PredictionModel, currentValue: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.01; // 1% change threshold

    switch (model.type) {
      case 'linear':
        const slope = model.coefficients[1];
        if (slope > threshold) return 'increasing';
        if (slope < -threshold) return 'decreasing';
        return 'stable';
        
      default:
        // For non-linear models, compare recent prediction with current
        const shortTermPrediction = this.makePrediction(model, currentValue, 5);
        const change = (shortTermPrediction.value - currentValue) / currentValue;
        
        if (change > threshold) return 'increasing';
        if (change < -threshold) return 'decreasing';
        return 'stable';
    }
  }

  private assessRiskLevel(prediction: { value: number; confidence: number }, currentValue: number, riskFactors: RiskFactors): 'low' | 'medium' | 'high' {
    // Combine multiple risk factors
    const changeRatio = Math.abs(prediction.value - currentValue) / currentValue;
    const confidenceWeight = 1 - prediction.confidence; // Lower confidence = higher risk
    
    const overallRisk = (
      changeRatio * 0.3 +
      riskFactors.volatility * 0.25 +
      Math.abs(riskFactors.trend) * 0.2 +
      riskFactors.anomalyFrequency * 0.15 +
      confidenceWeight * 0.1
    );

    if (overallRisk >= this.riskThresholds.high) return 'high';
    if (overallRisk >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  public async updateModel(metricName: string, newData: number[]): Promise<void> {
    if (newData.length < this.minTrainingData) {
      throw new Error('Insufficient data for model update');
    }

    await this.trainMetricModel(metricName, newData);
    this.emit('modelUpdated', { metric: metricName, updatedAt: new Date() });
  }

  public getModelInfo(): Array<{ metric: string; type: string; accuracy: number; lastTrained: Date; dataPoints: number }> {
    return Array.from(this.models.entries()).map(([metric, model]) => ({
      metric,
      type: model.type,
      accuracy: model.accuracy,
      lastTrained: model.lastTrained,
      dataPoints: model.trainingDataCount
    }));
  }

  public async getFailureProbability(metric: string, timeHorizon: number): Promise<number | null> {
    const model = this.models.get(metric);
    if (!model) return null;

    // Get recent metrics to establish baseline
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    try {
      const recentMetrics = await this.storageManager.getMetrics({ start: startTime, end: endTime });
      const values = recentMetrics
        .map(m => this.extractMetricValue(m, metric))
        .filter(v => v !== undefined) as number[];

      if (values.length === 0) return null;

      const currentValue = values[values.length - 1];
      const prediction = this.makePrediction(model, currentValue, timeHorizon);
      const riskFactors = await this.calculateRiskFactors(metric, recentMetrics[recentMetrics.length - 1]);
      
      // Calculate failure probability based on prediction exceeding thresholds
      const thresholds = { cpu: 95, memory: 90, disk: 95, network: 2000 };
      const threshold = thresholds[metric as keyof typeof thresholds] || 100;
      
      if (prediction.value > threshold) {
        // Higher probability if prediction exceeds threshold
        const exceedanceRatio = (prediction.value - threshold) / threshold;
        const baseProbability = Math.min(0.9, exceedanceRatio * prediction.confidence);
        
        // Adjust based on risk factors
        const riskAdjustment = (riskFactors.volatility + riskFactors.anomalyFrequency) / 2;
        
        return Math.min(0.95, baseProbability + riskAdjustment * 0.1);
      }
      
      return 0.05; // Base low probability
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
}