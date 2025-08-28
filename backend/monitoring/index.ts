// Main exports for the monitoring package
export * from './types';
export * from './MetricsCollector';
export * from './TracingService';
export * from './HealthChecker';
export * from './AlertManager';
export * from './DashboardAggregator';
export * from './Logger';
export * from './MonitoringService';
export * from './WorkflowMonitor';
export * from './middleware';
export * from './config';

// Convenience exports
export { 
  createMonitoringConfig, 
  validateMonitoringConfig, 
  defaultMonitoringConfig,
  developmentConfig,
  testConfig,
  productionConfig 
} from './config';

export { MonitoringMiddleware } from './middleware';
export { MonitoringService } from './MonitoringService';
export { WorkflowMonitor } from './WorkflowMonitor';

// Factory function for easy setup
export function createMonitoringSystem(environment?: string) {
  const config = createMonitoringConfig(environment);
  const monitoringService = new MonitoringService(config);
  const workflowMonitor = new WorkflowMonitor(monitoringService);
  const middleware = new MonitoringMiddleware(monitoringService, workflowMonitor);
  
  return {
    config,
    monitoringService,
    workflowMonitor,
    middleware,
    async initialize() {
      await monitoringService.initialize();
      return { monitoringService, workflowMonitor, middleware };
    },
    async shutdown() {
      await monitoringService.shutdown();
    }
  };
}