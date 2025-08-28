import { Router } from 'express';
import { WorkflowController } from './WorkflowController';
import {
  authenticate,
  authorize,
  checkOwnership,
  workflowRateLimit,
  executionRateLimit,
  heavyOperationRateLimit,
  requestLogger,
  healthCheck,
  cors,
  requestId
} from './WorkflowMiddleware';
import { validateSchema } from './ValidationSchemas';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  executeWorkflowSchema,
  workflowQuerySchema,
  executionQuerySchema,
  workflowIdSchema,
  executionIdSchema,
  workflowExecutionParamsSchema
} from './ValidationSchemas';

export class WorkflowRoutes {
  public router: Router;
  private controller: WorkflowController;

  constructor() {
    this.router = Router();
    this.controller = new WorkflowController();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Apply global middleware first
    this.router.use(cors);
    this.router.use(requestId);
    this.router.use(requestLogger);
    
    // Health check endpoint (no authentication required)
    this.router.get('/health', healthCheck);

    // Apply authentication middleware to protected routes
    this.router.use(authenticate);

    // Workflow CRUD operations
    this.setupWorkflowRoutes();
    
    // Execution management routes
    this.setupExecutionRoutes();
    
    // Monitoring routes
    this.setupMonitoringRoutes();
  }

  private setupWorkflowRoutes(): void {
    /**
     * @openapi
     * /workflows:
     *   post:
     *     summary: Create a new workflow
     *     description: Create a new workflow with steps and configuration
     *     tags:
     *       - Workflows
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateWorkflowRequest'
     *           example:
     *             name: "User Onboarding Workflow"
     *             description: "Automated user onboarding process"
     *             steps:
     *               - name: "Send Welcome Email"
     *                 type: "email"
     *                 config:
     *                   template: "welcome"
     *                   recipient: "{{user.email}}"
     *               - name: "Create User Account"
     *                 type: "script"
     *                 config:
     *                   script: "createUser.js"
     *             variables:
     *               defaultRole: "user"
     *             metadata:
     *               tags: ["onboarding", "automation"]
     *               priority: "normal"
     *     responses:
     *       201:
     *         description: Workflow created successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Workflow'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       429:
     *         $ref: '#/components/responses/RateLimitError'
     */
    this.router.post(
      '/workflows',
      workflowRateLimit,
      authorize(['workflow:create']),
      validateSchema(createWorkflowSchema, 'body'),
      this.controller.createWorkflow.bind(this.controller)
    );

    /**
     * @openapi
     * /workflows:
     *   get:
     *     summary: List workflows
     *     description: Retrieve a paginated list of workflows with filtering options
     *     tags:
     *       - Workflows
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 20
     *         description: Number of items per page
     *       - in: query
     *         name: status
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/components/schemas/WorkflowStatus'
     *         description: Filter by workflow status
     *       - in: query
     *         name: tags
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         description: Filter by tags
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search in workflow names and descriptions
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [name, createdAt, updatedAt, status]
     *           default: createdAt
     *         description: Sort field
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Sort order
     *     responses:
     *       200:
     *         description: List of workflows
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowListResponse'
     */
    this.router.get(
      '/workflows',
      workflowRateLimit,
      authorize(['workflow:read']),
      validateSchema(workflowQuerySchema, 'query'),
      this.controller.listWorkflows.bind(this.controller)
    );

    /**
     * @openapi
     * /workflows/{id}:
     *   get:
     *     summary: Get workflow by ID
     *     description: Retrieve a specific workflow by its ID
     *     tags:
     *       - Workflows
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Workflow ID
     *     responses:
     *       200:
     *         description: Workflow details
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Workflow'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.get(
      '/workflows/:id',
      workflowRateLimit,
      authorize(['workflow:read']),
      validateSchema(workflowIdSchema, 'params'),
      checkOwnership('id'),
      this.controller.getWorkflow.bind(this.controller)
    );

    /**
     * @openapi
     * /workflows/{id}:
     *   put:
     *     summary: Update workflow
     *     description: Update an existing workflow
     *     tags:
     *       - Workflows
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Workflow ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateWorkflowRequest'
     *     responses:
     *       200:
     *         description: Workflow updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Workflow'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.put(
      '/workflows/:id',
      workflowRateLimit,
      authorize(['workflow:update']),
      validateSchema(workflowIdSchema, 'params'),
      validateSchema(updateWorkflowSchema, 'body'),
      checkOwnership('id'),
      this.controller.updateWorkflow.bind(this.controller)
    );

    /**
     * @openapi
     * /workflows/{id}:
     *   delete:
     *     summary: Delete workflow
     *     description: Delete a workflow (only if no active executions)
     *     tags:
     *       - Workflows
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Workflow ID
     *     responses:
     *       204:
     *         description: Workflow deleted successfully
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     *       409:
     *         description: Workflow has active executions
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     */
    this.router.delete(
      '/workflows/:id',
      workflowRateLimit,
      authorize(['workflow:delete']),
      validateSchema(workflowIdSchema, 'params'),
      checkOwnership('id'),
      this.controller.deleteWorkflow.bind(this.controller)
    );
  }

  private setupExecutionRoutes(): void {
    /**
     * @openapi
     * /workflows/{id}/execute:
     *   post:
     *     summary: Execute workflow
     *     description: Start execution of a workflow
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Workflow ID
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ExecuteWorkflowRequest'
     *           example:
     *             variables:
     *               user:
     *                 email: "user@example.com"
     *                 name: "John Doe"
     *             priority: "high"
     *             timeout: 3600000
     *     responses:
     *       202:
     *         description: Workflow execution started
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowExecution'
     *       400:
     *         description: Workflow cannot be executed
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.post(
      '/workflows/:id/execute',
      executionRateLimit,
      authorize(['workflow:execute']),
      validateSchema(workflowIdSchema, 'params'),
      validateSchema(executeWorkflowSchema, 'body'),
      checkOwnership('id'),
      this.controller.executeWorkflow.bind(this.controller)
    );

    /**
     * @openapi
     * /executions:
     *   get:
     *     summary: List executions
     *     description: Retrieve a paginated list of workflow executions
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 20
     *         description: Number of items per page
     *       - in: query
     *         name: status
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/components/schemas/ExecutionStatus'
     *         description: Filter by execution status
     *       - in: query
     *         name: workflowId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Filter by workflow ID
     *     responses:
     *       200:
     *         description: List of executions
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/ExecutionListResponse'
     */
    this.router.get(
      '/executions',
      executionRateLimit,
      authorize(['workflow:read']),
      validateSchema(executionQuerySchema, 'query'),
      this.controller.listExecutions.bind(this.controller)
    );

    /**
     * @openapi
     * /executions/{executionId}:
     *   get:
     *     summary: Get execution details
     *     description: Retrieve details of a specific execution
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *     responses:
     *       200:
     *         description: Execution details
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowExecution'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.get(
      '/executions/:executionId',
      executionRateLimit,
      authorize(['workflow:read']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.getExecution.bind(this.controller)
    );

    /**
     * @openapi
     * /executions/{executionId}/pause:
     *   post:
     *     summary: Pause execution
     *     description: Pause a running workflow execution
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *     responses:
     *       200:
     *         description: Execution paused successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowExecution'
     *       400:
     *         description: Execution cannot be paused
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.post(
      '/executions/:executionId/pause',
      heavyOperationRateLimit,
      authorize(['workflow:control']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.pauseExecution.bind(this.controller)
    );

    /**
     * @openapi
     * /executions/{executionId}/resume:
     *   post:
     *     summary: Resume execution
     *     description: Resume a paused workflow execution
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *     responses:
     *       200:
     *         description: Execution resumed successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowExecution'
     *       400:
     *         description: Execution cannot be resumed
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.post(
      '/executions/:executionId/resume',
      heavyOperationRateLimit,
      authorize(['workflow:control']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.resumeExecution.bind(this.controller)
    );

    /**
     * @openapi
     * /executions/{executionId}/cancel:
     *   post:
     *     summary: Cancel execution
     *     description: Cancel a running or paused workflow execution
     *     tags:
     *       - Executions
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *     responses:
     *       200:
     *         description: Execution cancelled successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WorkflowExecution'
     *       400:
     *         description: Execution cannot be cancelled
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.post(
      '/executions/:executionId/cancel',
      heavyOperationRateLimit,
      authorize(['workflow:control']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.cancelExecution.bind(this.controller)
    );
  }

  private setupMonitoringRoutes(): void {
    /**
     * @openapi
     * /executions/{executionId}/logs:
     *   get:
     *     summary: Get execution logs
     *     description: Retrieve logs for a specific execution
     *     tags:
     *       - Monitoring
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *       - in: query
     *         name: level
     *         schema:
     *           $ref: '#/components/schemas/LogLevel'
     *         description: Filter logs by level
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 1000
     *           default: 100
     *         description: Number of logs to retrieve
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *         description: Number of logs to skip
     *     responses:
     *       200:
     *         description: Execution logs
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         logs:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/ExecutionLog'
     *                         total:
     *                           type: integer
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.get(
      '/executions/:executionId/logs',
      executionRateLimit,
      authorize(['workflow:read']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.getExecutionLogs.bind(this.controller)
    );

    /**
     * @openapi
     * /executions/{executionId}/metrics:
     *   get:
     *     summary: Get execution metrics
     *     description: Retrieve performance metrics for a specific execution
     *     tags:
     *       - Monitoring
     *     security:
     *       - bearerAuth: []
     *       - apiKey: []
     *     parameters:
     *       - in: path
     *         name: executionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Execution ID
     *     responses:
     *       200:
     *         description: Execution metrics
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/ExecutionMetrics'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
    this.router.get(
      '/executions/:executionId/metrics',
      executionRateLimit,
      authorize(['workflow:read']),
      validateSchema(executionIdSchema, 'params'),
      this.controller.getExecutionMetrics.bind(this.controller)
    );
  }
}

export default WorkflowRoutes;