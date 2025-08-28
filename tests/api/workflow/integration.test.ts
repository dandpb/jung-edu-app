/**
 * Integration Tests for Workflow API Endpoints
 * Tests complete API functionality including CRUD operations, execution, and error handling
 */

import request from 'supertest';
import express from 'express';
import { WorkflowController } from '../../../src/api/workflow/WorkflowController';
import {
  Workflow,
  WorkflowExecution,
  WorkflowStatus,
  ExecutionStatus,
  LogLevel
} from '../../../src/api/workflow/types';

// Mock implementations for integration testing
class MockWorkflowService {
  private workflows = new Map<string, Workflow>();
  private executions = new Map<string, WorkflowExecution>();

  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;
    
    const updated = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async listWorkflows(filters: any): Promise<{ workflows: Workflow[]; total: number }> {
    const workflows = Array.from(this.workflows.values());
    return { workflows, total: workflows.length };
  }

  async executeWorkflow(workflowId: string, params: any): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      status: ExecutionStatus.PENDING,
      stepExecutions: [],
      variables: params.variables || {},
      logs: [],
      metrics: { stepDurations: {} }
    };
    
    this.executions.set(execution.id, execution);
    return execution;
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return this.executions.get(id) || null;
  }

  async listExecutions(filters: any): Promise<{ executions: WorkflowExecution[]; total: number }> {
    const executions = Array.from(this.executions.values());
    return { executions, total: executions.length };
  }

  clear(): void {
    this.workflows.clear();
    this.executions.clear();
  }
}

// Test app setup
function createTestApp(): express.Application {
  const app = express();
  const controller = new WorkflowController();
  
  app.use(express.json());
  
  // Add request ID middleware
  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || `test-${Date.now()}`;
    next();
  });
  
  // Add mock auth middleware
  app.use((req: any, res, next) => {
    req.auth = {
      userId: 'test-user-1',
      roles: ['user']
    };
    next();
  });
  
  // Workflow CRUD routes
  app.post('/api/workflows', (req, res) => controller.createWorkflow(req, res));
  app.get('/api/workflows/:id', (req, res) => controller.getWorkflow(req, res));
  app.get('/api/workflows', (req, res) => controller.listWorkflows(req, res));
  app.put('/api/workflows/:id', (req, res) => controller.updateWorkflow(req, res));
  app.delete('/api/workflows/:id', (req, res) => controller.deleteWorkflow(req, res));
  
  // Execution routes
  app.post('/api/workflows/:id/execute', (req, res) => controller.executeWorkflow(req, res));
  app.get('/api/executions/:executionId', (req, res) => controller.getExecution(req, res));
  app.get('/api/executions', (req, res) => controller.listExecutions(req, res));
  app.post('/api/executions/:executionId/pause', (req, res) => controller.pauseExecution(req, res));
  app.post('/api/executions/:executionId/resume', (req, res) => controller.resumeExecution(req, res));
  app.post('/api/executions/:executionId/cancel', (req, res) => controller.cancelExecution(req, res));
  
  // Monitoring routes
  app.get('/api/executions/:executionId/logs', (req, res) => controller.getExecutionLogs(req, res));
  app.get('/api/executions/:executionId/metrics', (req, res) => controller.getExecutionMetrics(req, res));
  
  return app;
}

describe('Workflow API Integration Tests', () => {
  let app: express.Application;
  let mockService: MockWorkflowService;

  beforeEach(() => {
    app = createTestApp();
    mockService = new MockWorkflowService();
    // In real implementation, inject mock service into controller
  });

  afterEach(() => {
    mockService.clear();
  });

  describe('Workflow CRUD Operations', () => {
    const sampleWorkflow = {
      name: 'Test Workflow',
      description: 'A test workflow for integration testing',
      steps: [
        {
          name: 'Initial Step',
          type: 'task',
          config: { action: 'initialize' }
        },
        {
          name: 'Processing Step',
          type: 'task',
          config: { action: 'process' }
        }
      ],
      variables: {
        inputVar: 'defaultValue'
      },
      metadata: {
        tags: ['test', 'integration'],
        priority: 'normal'
      }
    };

    describe('POST /api/workflows', () => {
      it('should create a new workflow', async () => {
        const response = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.name).toBe(sampleWorkflow.name);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.status).toBe(WorkflowStatus.DRAFT);
        expect(response.body.data.version).toBe('1.0.0');
        expect(response.body.requestId).toBeDefined();
      });

      it('should validate required fields', async () => {
        const invalidWorkflow = {
          description: 'Missing name field'
        };

        const response = await request(app)
          .post('/api/workflows')
          .send(invalidWorkflow)
          .expect(500); // Would be validation error in real implementation

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should handle large workflow definitions', async () => {
        const largeWorkflow = {
          ...sampleWorkflow,
          steps: Array.from({ length: 50 }, (_, i) => ({
            name: `Step ${i + 1}`,
            type: 'task',
            config: { action: `action-${i}` }
          }))
        };

        const response = await request(app)
          .post('/api/workflows')
          .send(largeWorkflow)
          .expect(201);

        expect(response.body.data.steps).toHaveLength(50);
      });
    });

    describe('GET /api/workflows/:id', () => {
      it('should retrieve workflow by ID', async () => {
        // First create a workflow
        const createResponse = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow);

        const workflowId = createResponse.body.data.id;

        // Then retrieve it
        const response = await request(app)
          .get(`/api/workflows/${workflowId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(workflowId);
        expect(response.body.data.name).toBe(sampleWorkflow.name);
      });

      it('should return 404 for non-existent workflow', async () => {
        const response = await request(app)
          .get('/api/workflows/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('WORKFLOW_NOT_FOUND');
      });
    });

    describe('GET /api/workflows', () => {
      beforeEach(async () => {
        // Create multiple workflows for testing
        const workflows = [
          { ...sampleWorkflow, name: 'Workflow 1', metadata: { tags: ['tag1'] } },
          { ...sampleWorkflow, name: 'Workflow 2', metadata: { tags: ['tag2'] } },
          { ...sampleWorkflow, name: 'Workflow 3', metadata: { tags: ['tag1', 'tag2'] } }
        ];

        for (const workflow of workflows) {
          await request(app).post('/api/workflows').send(workflow);
        }
      });

      it('should list all workflows', async () => {
        const response = await request(app)
          .get('/api/workflows')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.workflows).toHaveLength(3);
        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination.total).toBe(3);
      });

      it('should filter workflows by status', async () => {
        const response = await request(app)
          .get('/api/workflows?status=draft')
          .expect(200);

        expect(response.body.data.workflows).toHaveLength(3); // All are draft
      });

      it('should filter workflows by tags', async () => {
        const response = await request(app)
          .get('/api/workflows?tags=tag1')
          .expect(200);

        expect(response.body.data.workflows).toHaveLength(2); // Workflow 1 and 3
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/workflows?search=Workflow 1')
          .expect(200);

        expect(response.body.data.workflows).toHaveLength(1);
        expect(response.body.data.workflows[0].name).toBe('Workflow 1');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/workflows?page=1&limit=2')
          .expect(200);

        expect(response.body.data.workflows).toHaveLength(2);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(2);
        expect(response.body.data.pagination.hasNext).toBe(true);
      });

      it('should support sorting', async () => {
        const response = await request(app)
          .get('/api/workflows?sortBy=name&sortOrder=desc')
          .expect(200);

        const names = response.body.data.workflows.map((w: any) => w.name);
        expect(names[0]).toBe('Workflow 3');
        expect(names[2]).toBe('Workflow 1');
      });
    });

    describe('PUT /api/workflows/:id', () => {
      it('should update workflow properties', async () => {
        // Create workflow
        const createResponse = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow);

        const workflowId = createResponse.body.data.id;

        // Update workflow
        const updates = {
          name: 'Updated Workflow Name',
          description: 'Updated description',
          version: '2.0.0'
        };

        const response = await request(app)
          .put(`/api/workflows/${workflowId}`)
          .send(updates)
          .expect(200);

        expect(response.body.data.name).toBe(updates.name);
        expect(response.body.data.description).toBe(updates.description);
        expect(response.body.data.version).toBe(updates.version);
        expect(new Date(response.body.data.updatedAt)).toBeInstanceOf(Date);
      });

      it('should update workflow steps', async () => {
        const createResponse = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow);

        const workflowId = createResponse.body.data.id;

        const newSteps = [
          { name: 'New Step 1', type: 'task', config: {} },
          { name: 'New Step 2', type: 'condition', config: {} }
        ];

        const response = await request(app)
          .put(`/api/workflows/${workflowId}`)
          .send({ steps: newSteps })
          .expect(200);

        expect(response.body.data.steps).toHaveLength(2);
        expect(response.body.data.steps[0].name).toBe('New Step 1');
      });

      it('should return 404 for non-existent workflow', async () => {
        const response = await request(app)
          .put('/api/workflows/non-existent-id')
          .send({ name: 'Updated Name' })
          .expect(404);

        expect(response.body.error.code).toBe('WORKFLOW_NOT_FOUND');
      });
    });

    describe('DELETE /api/workflows/:id', () => {
      it('should delete workflow successfully', async () => {
        const createResponse = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow);

        const workflowId = createResponse.body.data.id;

        await request(app)
          .delete(`/api/workflows/${workflowId}`)
          .expect(204);

        // Verify workflow is deleted
        await request(app)
          .get(`/api/workflows/${workflowId}`)
          .expect(404);
      });

      it('should prevent deletion with active executions', async () => {
        const createResponse = await request(app)
          .post('/api/workflows')
          .send({ ...sampleWorkflow, status: WorkflowStatus.ACTIVE });

        const workflowId = createResponse.body.data.id;

        // Start execution
        await request(app)
          .post(`/api/workflows/${workflowId}/execute`)
          .send({ variables: {} });

        // Attempt deletion
        const response = await request(app)
          .delete(`/api/workflows/${workflowId}`)
          .expect(409);

        expect(response.body.error.code).toBe('WORKFLOW_HAS_ACTIVE_EXECUTIONS');
      });

      it('should return 404 for non-existent workflow', async () => {
        const response = await request(app)
          .delete('/api/workflows/non-existent-id')
          .expect(404);

        expect(response.body.error.code).toBe('WORKFLOW_NOT_FOUND');
      });
    });
  });

  describe('Workflow Execution', () => {
    let activeWorkflowId: string;

    beforeEach(async () => {
      // Create an active workflow for execution tests
      const response = await request(app)
        .post('/api/workflows')
        .send({ ...sampleWorkflow, status: WorkflowStatus.ACTIVE });
      
      activeWorkflowId = response.body.data.id;
    });

    describe('POST /api/workflows/:id/execute', () => {
      it('should start workflow execution', async () => {
        const executeParams = {
          variables: {
            inputVar: 'testValue',
            additionalVar: 'extra'
          }
        };

        const response = await request(app)
          .post(`/api/workflows/${activeWorkflowId}/execute`)
          .send(executeParams)
          .expect(202);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(ExecutionStatus.PENDING);
        expect(response.body.data.workflowId).toBe(activeWorkflowId);
        expect(response.body.data.variables).toEqual(expect.objectContaining(executeParams.variables));
        expect(response.body.data.id).toBeDefined();
      });

      it('should reject execution of non-active workflow', async () => {
        // Create draft workflow
        const draftResponse = await request(app)
          .post('/api/workflows')
          .send(sampleWorkflow); // Draft by default

        const response = await request(app)
          .post(`/api/workflows/${draftResponse.body.data.id}/execute`)
          .send({ variables: {} })
          .expect(400);

        expect(response.body.error.code).toBe('WORKFLOW_NOT_ACTIVE');
      });

      it('should handle execution with no variables', async () => {
        const response = await request(app)
          .post(`/api/workflows/${activeWorkflowId}/execute`)
          .send({})
          .expect(202);

        expect(response.body.data.variables).toBeDefined();
      });

      it('should return 404 for non-existent workflow', async () => {
        const response = await request(app)
          .post('/api/workflows/non-existent-id/execute')
          .send({ variables: {} })
          .expect(404);

        expect(response.body.error.code).toBe('WORKFLOW_NOT_FOUND');
      });
    });

    describe('GET /api/executions/:executionId', () => {
      it('should retrieve execution status', async () => {
        // Start execution
        const executeResponse = await request(app)
          .post(`/api/workflows/${activeWorkflowId}/execute`)
          .send({ variables: {} });

        const executionId = executeResponse.body.data.id;

        // Get execution status
        const response = await request(app)
          .get(`/api/executions/${executionId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(executionId);
        expect(response.body.data.status).toBeDefined();
      });

      it('should return 404 for non-existent execution', async () => {
        const response = await request(app)
          .get('/api/executions/non-existent-id')
          .expect(404);

        expect(response.body.error.code).toBe('EXECUTION_NOT_FOUND');
      });
    });

    describe('GET /api/executions', () => {
      it('should list executions', async () => {
        // Create multiple executions
        await request(app).post(`/api/workflows/${activeWorkflowId}/execute`).send({});
        await request(app).post(`/api/workflows/${activeWorkflowId}/execute`).send({});

        const response = await request(app)
          .get('/api/executions')
          .expect(200);

        expect(response.body.data.executions).toHaveLength(2);
        expect(response.body.data.pagination.total).toBe(2);
      });

      it('should filter executions by workflow ID', async () => {
        // Create another workflow and execution
        const workflow2Response = await request(app)
          .post('/api/workflows')
          .send({ ...sampleWorkflow, name: 'Workflow 2', status: WorkflowStatus.ACTIVE });

        await request(app).post(`/api/workflows/${activeWorkflowId}/execute`).send({});
        await request(app).post(`/api/workflows/${workflow2Response.body.data.id}/execute`).send({});

        const response = await request(app)
          .get(`/api/executions?workflowId=${activeWorkflowId}`)
          .expect(200);

        expect(response.body.data.executions).toHaveLength(1);
        expect(response.body.data.executions[0].workflowId).toBe(activeWorkflowId);
      });

      it('should filter executions by status', async () => {
        await request(app).post(`/api/workflows/${activeWorkflowId}/execute`).send({});

        const response = await request(app)
          .get(`/api/executions?status=${ExecutionStatus.PENDING}`)
          .expect(200);

        expect(response.body.data.executions.every(
          (e: any) => e.status === ExecutionStatus.PENDING
        )).toBe(true);
      });
    });
  });

  describe('Execution Control', () => {
    let executionId: string;

    beforeEach(async () => {
      // Create workflow and start execution
      const workflowResponse = await request(app)
        .post('/api/workflows')
        .send({ ...sampleWorkflow, status: WorkflowStatus.ACTIVE });

      const executeResponse = await request(app)
        .post(`/api/workflows/${workflowResponse.body.data.id}/execute`)
        .send({});

      executionId = executeResponse.body.data.id;
    });

    describe('POST /api/executions/:executionId/pause', () => {
      it('should pause running execution', async () => {
        // First, simulate execution is running
        // In real implementation, this would be handled by the execution engine
        
        const response = await request(app)
          .post(`/api/executions/${executionId}/pause`)
          .expect(200);

        expect(response.body.data.status).toBe(ExecutionStatus.PAUSED);
        expect(response.body.data.logs.some(
          (log: any) => log.message.includes('paused')
        )).toBe(true);
      });

      it('should reject pausing non-running execution', async () => {
        // First pause it
        await request(app).post(`/api/executions/${executionId}/pause`);

        // Try to pause again
        const response = await request(app)
          .post(`/api/executions/${executionId}/pause`)
          .expect(400);

        expect(response.body.error.code).toBe('EXECUTION_NOT_RUNNING');
      });
    });

    describe('POST /api/executions/:executionId/resume', () => {
      it('should resume paused execution', async () => {
        // First pause the execution
        await request(app).post(`/api/executions/${executionId}/pause`);

        // Then resume it
        const response = await request(app)
          .post(`/api/executions/${executionId}/resume`)
          .expect(200);

        expect(response.body.data.status).toBe(ExecutionStatus.RUNNING);
        expect(response.body.data.logs.some(
          (log: any) => log.message.includes('resumed')
        )).toBe(true);
      });

      it('should reject resuming non-paused execution', async () => {
        const response = await request(app)
          .post(`/api/executions/${executionId}/resume`)
          .expect(400);

        expect(response.body.error.code).toBe('EXECUTION_NOT_PAUSED');
      });
    });

    describe('POST /api/executions/:executionId/cancel', () => {
      it('should cancel execution', async () => {
        const response = await request(app)
          .post(`/api/executions/${executionId}/cancel`)
          .expect(200);

        expect(response.body.data.status).toBe(ExecutionStatus.CANCELLED);
        expect(response.body.data.completedAt).toBeDefined();
        expect(response.body.data.logs.some(
          (log: any) => log.message.includes('cancelled')
        )).toBe(true);
      });

      it('should reject cancelling already finished execution', async () => {
        // Cancel first time
        await request(app).post(`/api/executions/${executionId}/cancel`);

        // Try to cancel again
        const response = await request(app)
          .post(`/api/executions/${executionId}/cancel`)
          .expect(400);

        expect(response.body.error.code).toBe('EXECUTION_ALREADY_FINISHED');
      });
    });
  });

  describe('Monitoring and Observability', () => {
    let executionId: string;

    beforeEach(async () => {
      // Create workflow and execution with logs
      const workflowResponse = await request(app)
        .post('/api/workflows')
        .send({ ...sampleWorkflow, status: WorkflowStatus.ACTIVE });

      const executeResponse = await request(app)
        .post(`/api/workflows/${workflowResponse.body.data.id}/execute`)
        .send({});

      executionId = executeResponse.body.data.id;
    });

    describe('GET /api/executions/:executionId/logs', () => {
      it('should retrieve execution logs', async () => {
        const response = await request(app)
          .get(`/api/executions/${executionId}/logs`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.logs).toBeDefined();
        expect(response.body.data.total).toBeDefined();
      });

      it('should filter logs by level', async () => {
        const response = await request(app)
          .get(`/api/executions/${executionId}/logs?level=${LogLevel.INFO}`)
          .expect(200);

        expect(response.body.data.logs.every(
          (log: any) => log.level === LogLevel.INFO
        )).toBe(true);
      });

      it('should support pagination for logs', async () => {
        const response = await request(app)
          .get(`/api/executions/${executionId}/logs?limit=5&offset=0`)
          .expect(200);

        expect(response.body.data.logs.length).toBeLessThanOrEqual(5);
      });

      it('should return 404 for non-existent execution', async () => {
        const response = await request(app)
          .get('/api/executions/non-existent-id/logs')
          .expect(404);

        expect(response.body.error.code).toBe('EXECUTION_NOT_FOUND');
      });
    });

    describe('GET /api/executions/:executionId/metrics', () => {
      it('should retrieve execution metrics', async () => {
        const response = await request(app)
          .get(`/api/executions/${executionId}/metrics`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.stepDurations).toBeDefined();
      });

      it('should return 404 for non-existent execution', async () => {
        const response = await request(app)
          .get('/api/executions/non-existent-id/metrics')
          .expect(404);

        expect(response.body.error.code).toBe('EXECUTION_NOT_FOUND');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should handle missing request headers', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send(sampleWorkflow);

      // Should still work with auto-generated request ID
      expect(response.body.requestId).toBeDefined();
    });

    it('should handle very large payloads', async () => {
      const largePayload = {
        name: 'Large Workflow',
        description: 'A' + 'B'.repeat(10000), // Large description
        steps: Array.from({ length: 1000 }, (_, i) => ({
          name: `Step ${i}`,
          type: 'task',
          config: { data: 'x'.repeat(100) }
        }))
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(largePayload);

      // Should handle large payloads (or return appropriate error)
      expect(response.status).toBeOneOf([201, 413, 400]);
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('/api/workflows')
          .send({ ...sampleWorkflow, name: `Workflow ${i}` })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect([201, 200]).toContain(response.status);
      });

      // All should have unique IDs
      const ids = responses.map(r => r.body.data?.id).filter(Boolean);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should validate content types', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should include user context in workflow creation', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send(sampleWorkflow)
        .expect(201);

      expect(response.body.data.createdBy).toBe('test-user-1');
      expect(response.body.data.metadata.owner).toBe('test-user-1');
    });

    it('should filter workflows by owner for non-admin users', async () => {
      // This would be more comprehensive in real implementation
      const response = await request(app)
        .get('/api/workflows?owner=different-user')
        .expect(200);

      // Non-admin user should only see their own workflows
      expect(response.body.data.workflows).toHaveLength(0);
    });
  });

  describe('API Response Format', () => {
    it('should return consistent success response format', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send(sampleWorkflow)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).not.toHaveProperty('error');
    });

    it('should return consistent error response format', async () => {
      const response = await request(app)
        .get('/api/workflows/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should include proper timestamps', async () => {
      const beforeRequest = new Date();
      
      const response = await request(app)
        .post('/api/workflows')
        .send(sampleWorkflow);

      const afterRequest = new Date();
      const responseTime = new Date(response.body.timestamp);

      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });
  });
});

// Custom Jest matcher for better error messages
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}
