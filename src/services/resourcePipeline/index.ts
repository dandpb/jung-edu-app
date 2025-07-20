/**
 * AI Resource Pipeline - Main Export
 * Provides a unified interface for automatic resource generation
 */

export { AIResourcePipeline, aiResourcePipeline } from './pipeline';
export { PipelineIntegrationHooks } from './integrationHooks';
export { PipelineMonitoringService } from './monitoring';

export type {
  ResourceGenerationConfig,
  GeneratedResource,
  ResourceDependency,
  PipelineEvent
} from './pipeline';

export type {
  HookEvent,
  HookConfig,
  HookHandler
} from './integrationHooks';

export type {
  PipelineMetrics,
  PipelineStatus,
  PerformanceAlert,
  MonitoringConfig
} from './monitoring';

// Re-export enhanced module generator with pipeline integration
export { EnhancedModuleGeneratorWithPipeline } from './enhancedGenerator';