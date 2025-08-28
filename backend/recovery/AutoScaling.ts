/**
 * Auto-scaling Implementation
 * Dynamic scaling based on load and performance metrics
 */

import { EventEmitter } from 'events';

export interface MetricData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface ScalingRule {
  metricName: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  duration: number; // Duration in ms the condition must be true
  cooldown: number; // Cooldown period after scaling action
  scaleAction: 'up' | 'down';
  scaleAmount: number;
}

export interface AutoScalingConfig {
  name: string;
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  scalingRules: ScalingRule[];
  metricWindow: number; // Window size for metric evaluation
  evaluationInterval: number; // How often to check scaling rules
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  onScale?: (action: 'up' | 'down', amount: number, reason: string) => Promise<void>;
  onMetricUpdate?: (metric: string, value: number) => void;
}

export interface ScalingEvent {
  timestamp: number;
  action: 'up' | 'down';
  amount: number;
  reason: string;
  instancesBefore: number;
  instancesAfter: number;
  triggeringMetric: string;
  triggeringValue: number;
}

export class AutoScaler extends EventEmitter {
  private metrics = new Map<string, MetricData[]>();
  private lastScaleUp = 0;
  private lastScaleDown = 0;
  private evaluationTimer?: NodeJS.Timeout;
  private scalingHistory: ScalingEvent[] = [];
  private pendingEvaluations = new Map<string, number>(); // Track rule evaluation start times

  constructor(private config: AutoScalingConfig) {
    super();
    this.startEvaluation();
  }

  /**
   * Update metric value
   */
  updateMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metricData: MetricData = {
      timestamp: Date.now(),
      value,
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metricData);

    // Keep only metrics within the window
    const cutoff = Date.now() - this.config.metricWindow;
    const filteredMetrics = metricArray.filter(m => m.timestamp > cutoff);
    this.metrics.set(name, filteredMetrics);

    this.config.onMetricUpdate?.(name, value);
    this.emit('metricUpdated', { name, value, metadata });
  }

  /**
   * Get current metric value (latest)
   */
  getCurrentMetric(name: string): number | undefined {
    const metricArray = this.metrics.get(name);
    if (!metricArray || metricArray.length === 0) return undefined;
    
    return metricArray[metricArray.length - 1].value;
  }

  /**
   * Get average metric value over the window
   */
  getAverageMetric(name: string, windowMs?: number): number | undefined {
    const metricArray = this.metrics.get(name);
    if (!metricArray || metricArray.length === 0) return undefined;

    const window = windowMs || this.config.metricWindow;
    const cutoff = Date.now() - window;
    const windowMetrics = metricArray.filter(m => m.timestamp > cutoff);
    
    if (windowMetrics.length === 0) return undefined;

    const sum = windowMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / windowMetrics.length;
  }

  /**
   * Get percentile metric value
   */
  getPercentileMetric(name: string, percentile: number): number | undefined {
    const metricArray = this.metrics.get(name);
    if (!metricArray || metricArray.length === 0) return undefined;

    const values = metricArray.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private startEvaluation(): void {
    this.evaluationTimer = setInterval(() => {
      this.evaluateScalingRules();
    }, this.config.evaluationInterval);
  }

  private evaluateScalingRules(): void {
    const now = Date.now();

    for (const rule of this.config.scalingRules) {
      try {
        this.evaluateRule(rule, now);
      } catch (error) {
        this.emit('evaluationError', {
          rule: rule.metricName,
          error: (error as Error).message
        });
      }
    }
  }

  private evaluateRule(rule: ScalingRule, now: number): void {
    const metricValue = this.getCurrentMetric(rule.metricName);
    if (metricValue === undefined) return;

    const conditionMet = this.checkCondition(metricValue, rule);
    const ruleKey = `${rule.metricName}-${rule.scaleAction}`;

    if (conditionMet) {
      // Start tracking if not already
      if (!this.pendingEvaluations.has(ruleKey)) {
        this.pendingEvaluations.set(ruleKey, now);
        return;
      }

      // Check if duration has passed
      const startTime = this.pendingEvaluations.get(ruleKey)!;
      if (now - startTime >= rule.duration) {
        // Check cooldown
        if (this.isInCooldown(rule, now)) {
          return;
        }

        // Execute scaling action
        this.executeScaling(rule, metricValue);
        this.pendingEvaluations.delete(ruleKey);
      }
    } else {
      // Condition not met, reset tracking
      this.pendingEvaluations.delete(ruleKey);
    }
  }

  private checkCondition(value: number, rule: ScalingRule): boolean {
    switch (rule.comparison) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      case 'eq': return value === rule.threshold;
      default: return false;
    }
  }

  private isInCooldown(rule: ScalingRule, now: number): boolean {
    if (rule.scaleAction === 'up') {
      return now - this.lastScaleUp < rule.cooldown;
    } else {
      return now - this.lastScaleDown < rule.cooldown;
    }
  }

  private async executeScaling(rule: ScalingRule, triggeringValue: number): Promise<void> {
    const currentInstances = this.config.currentInstances;
    let newInstances: number;

    if (rule.scaleAction === 'up') {
      newInstances = Math.min(
        this.config.maxInstances,
        currentInstances + rule.scaleAmount
      );
      this.lastScaleUp = Date.now();
    } else {
      newInstances = Math.max(
        this.config.minInstances,
        currentInstances - rule.scaleAmount
      );
      this.lastScaleDown = Date.now();
    }

    // No scaling needed
    if (newInstances === currentInstances) {
      return;
    }

    const scalingEvent: ScalingEvent = {
      timestamp: Date.now(),
      action: rule.scaleAction,
      amount: Math.abs(newInstances - currentInstances),
      reason: `${rule.metricName} ${rule.comparison} ${rule.threshold}`,
      instancesBefore: currentInstances,
      instancesAfter: newInstances,
      triggeringMetric: rule.metricName,
      triggeringValue
    };

    try {
      // Execute scaling callback
      if (this.config.onScale) {
        await this.config.onScale(
          rule.scaleAction,
          Math.abs(newInstances - currentInstances),
          scalingEvent.reason
        );
      }

      // Update current instances
      this.config.currentInstances = newInstances;
      this.scalingHistory.push(scalingEvent);

      // Keep only recent history
      if (this.scalingHistory.length > 100) {
        this.scalingHistory = this.scalingHistory.slice(-50);
      }

      this.emit('scaled', scalingEvent);

    } catch (error) {
      this.emit('scalingFailed', {
        ...scalingEvent,
        error: (error as Error).message
      });
    }
  }

  /**
   * Add or update a scaling rule
   */
  addScalingRule(rule: ScalingRule): void {
    const existingIndex = this.config.scalingRules.findIndex(
      r => r.metricName === rule.metricName && r.scaleAction === rule.scaleAction
    );

    if (existingIndex >= 0) {
      this.config.scalingRules[existingIndex] = rule;
    } else {
      this.config.scalingRules.push(rule);
    }

    this.emit('ruleAdded', rule);
  }

  /**
   * Remove a scaling rule
   */
  removeScalingRule(metricName: string, scaleAction: 'up' | 'down'): boolean {
    const index = this.config.scalingRules.findIndex(
      r => r.metricName === metricName && r.scaleAction === scaleAction
    );

    if (index >= 0) {
      const removed = this.config.scalingRules.splice(index, 1)[0];
      this.emit('ruleRemoved', removed);
      return true;
    }

    return false;
  }

  /**
   * Get current scaling status
   */
  getStatus() {
    return {
      name: this.config.name,
      currentInstances: this.config.currentInstances,
      minInstances: this.config.minInstances,
      maxInstances: this.config.maxInstances,
      lastScaleUp: this.lastScaleUp,
      lastScaleDown: this.lastScaleDown,
      activeRules: this.config.scalingRules.length,
      pendingEvaluations: Array.from(this.pendingEvaluations.keys()),
      recentScalingEvents: this.scalingHistory.slice(-5)
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    this.metrics.forEach((data, name) => {
      result[name] = [...data];
    });
    return result;
  }

  /**
   * Force scaling action (for testing or manual intervention)
   */
  async forceScale(action: 'up' | 'down', amount: number, reason: string): Promise<void> {
    const currentInstances = this.config.currentInstances;
    let newInstances: number;

    if (action === 'up') {
      newInstances = Math.min(this.config.maxInstances, currentInstances + amount);
    } else {
      newInstances = Math.max(this.config.minInstances, currentInstances - amount);
    }

    if (newInstances === currentInstances) return;

    const scalingEvent: ScalingEvent = {
      timestamp: Date.now(),
      action,
      amount: Math.abs(newInstances - currentInstances),
      reason: `Manual: ${reason}`,
      instancesBefore: currentInstances,
      instancesAfter: newInstances,
      triggeringMetric: 'manual',
      triggeringValue: 0
    };

    if (this.config.onScale) {
      await this.config.onScale(action, amount, reason);
    }

    this.config.currentInstances = newInstances;
    this.scalingHistory.push(scalingEvent);

    this.emit('forceScaled', scalingEvent);
  }

  /**
   * Shutdown autoscaler
   */
  shutdown(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = undefined;
    }

    this.metrics.clear();
    this.pendingEvaluations.clear();
    this.removeAllListeners();
  }
}

/**
 * Predefined scaling rules for common scenarios
 */
export const ScalingProfiles = {
  CPU_BASED: [
    {
      metricName: 'cpu_usage',
      threshold: 80,
      comparison: 'gte' as const,
      duration: 30000, // 30 seconds
      cooldown: 300000, // 5 minutes
      scaleAction: 'up' as const,
      scaleAmount: 1
    },
    {
      metricName: 'cpu_usage',
      threshold: 20,
      comparison: 'lte' as const,
      duration: 300000, // 5 minutes
      cooldown: 600000, // 10 minutes
      scaleAction: 'down' as const,
      scaleAmount: 1
    }
  ],

  MEMORY_BASED: [
    {
      metricName: 'memory_usage',
      threshold: 85,
      comparison: 'gte' as const,
      duration: 60000, // 1 minute
      cooldown: 300000, // 5 minutes
      scaleAction: 'up' as const,
      scaleAmount: 1
    },
    {
      metricName: 'memory_usage',
      threshold: 30,
      comparison: 'lte' as const,
      duration: 600000, // 10 minutes
      cooldown: 900000, // 15 minutes
      scaleAction: 'down' as const,
      scaleAmount: 1
    }
  ],

  REQUEST_RATE_BASED: [
    {
      metricName: 'requests_per_second',
      threshold: 100,
      comparison: 'gte' as const,
      duration: 60000, // 1 minute
      cooldown: 180000, // 3 minutes
      scaleAction: 'up' as const,
      scaleAmount: 2
    },
    {
      metricName: 'requests_per_second',
      threshold: 10,
      comparison: 'lte' as const,
      duration: 600000, // 10 minutes
      cooldown: 900000, // 15 minutes
      scaleAction: 'down' as const,
      scaleAmount: 1
    }
  ]
};