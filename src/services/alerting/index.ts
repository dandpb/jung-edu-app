/**
 * Alerting Services Export
 * Main entry point for the alerting system
 */

export { AlertingEngine } from './AlertingEngine';
export type { AlertState, AlertContext, NotificationRequest, AlertEvaluationResult } from './AlertingEngine';
export { AlertingService } from './AlertingService';
export type { AlertingServiceConfig } from './AlertingService';

// Re-export configuration types and constants
export * from '../../config/alertingThresholds';
export * from '../../config/notificationChannels';
export * from '../../config/escalationPolicies';
export * from '../../config/alertTemplates';

// Create and export default instances
import { AlertingService } from './AlertingService';

export const createAlertingService = (config?: Partial<any>) => {
  return new AlertingService(config);
};

export default {
  AlertingService,
  createAlertingService
};