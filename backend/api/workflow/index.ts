import express, { Application } from 'express';
import { WorkflowRoutes } from './WorkflowRoutes';
import {
  globalRateLimit,
  requestId,
  cors,
  errorHandler,
  addRateLimitInfo
} from './WorkflowMiddleware';

/**
 * Workflow Management API
 * 
 * A comprehensive RESTful API for workflow management following OpenAPI 3.0 specifications.
 * 
 * Features:
 * - Complete CRUD operations for workflows
 * - Execution management (start, pause, resume, cancel)
 * - Real-time monitoring and logging
 * - Authentication and authorization
 * - Rate limiting and request validation
 * - Comprehensive error handling
 * 
 * @example
 * ```typescript
 * import { createWorkflowApp } from './api/workflow';
 * 
 * const app = createWorkflowApp();
 * app.listen(3000, () => {
 *   console.log('Workflow API server running on port 3000');
 * });
 * ```
 */

export function createWorkflowApp(): Application {
  const app = express();
  
  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Global middleware
  app.use(requestId);
  app.use(cors);
  app.use(globalRateLimit);
  app.use(addRateLimitInfo);
  
  // API routes
  const workflowRoutes = new WorkflowRoutes();
  app.use('/api/v1', workflowRoutes.router);
  
  // Error handling (must be last)
  app.use(errorHandler);
  
  return app;
}

// Export all components
export { WorkflowController } from './WorkflowController';
export { WorkflowRoutes } from './WorkflowRoutes';
export * from './WorkflowMiddleware';
export * from './ValidationSchemas';
export * from './types';

// Default export for convenience
export default createWorkflowApp;