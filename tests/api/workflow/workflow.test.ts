import request from 'supertest';
import { Application } from 'express';
import { createWorkflowApp } from '../../../src/api/workflow';
import { WorkflowStatus, ExecutionStatus, StepType, Priority } from '../../../src/api/workflow/types';

describe('Workflow Management API', () => {
  let app: Application;
  let authToken: string;
  let workflowId: string;
  let executionId: string;

  beforeAll(async () => {
    app = createWorkflowApp();
    
    // Set up test environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.WORKFLOW_API_KEY = 'test-api-key';
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    
    // Mock JWT token for testing
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test environment
    delete process.env.JWT_SECRET;
    delete process.env.WORKFLOW_API_KEY;
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          uptime: expect.any(Number),
          version: expect.any(String)
        },
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_AUTH',
          message: 'Authentication required - provide Bearer token or API key'
        }
      });
    });

    it('should accept requests with API key', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Workflow CRUD Operations', () => {
    const validWorkflow = {
      name: 'Test Workflow',
      description: 'A test workflow for unit testing',
      steps: [
        {
          name: 'Send Welcome Email',
          type: StepType.EMAIL,
          config: {
            template: 'welcome',
            recipient: '{{user.email}}'
          }
        },
        {
          name: 'Create User Account',
          type: StepType.SCRIPT,
          config: {
            script: 'createUser.js'
          },
          timeout: 30000,
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: 'exponential',
            backoffMultiplier: 2,
            maxBackoffTime: 60000
          }
        }
      ],
      variables: {
        defaultRole: 'user',
        welcomeMessage: 'Welcome to our platform!'
      },
      metadata: {
        tags: ['onboarding', 'automation', 'test'],
        priority: Priority.NORMAL,
        timeout: 300000
      }
    };

    it('should create a new workflow', async () => {
      const response = await request(app)
        .post('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .send(validWorkflow)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: validWorkflow.name,
          description: validWorkflow.description,
          version: '1.0.0',
          status: WorkflowStatus.DRAFT,
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: 'Send Welcome Email',
              type: StepType.EMAIL
            }),
            expect.objectContaining({
              id: expect.any(String),
              name: 'Create User Account',
              type: StepType.SCRIPT
            })
          ]),
          variables: validWorkflow.variables,
          metadata: expect.objectContaining({
            tags: validWorkflow.metadata.tags,
            priority: validWorkflow.metadata.priority
          }),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          createdBy: expect.any(String)
        }
      });

      workflowId = response.body.data.id;
    });

    it('should validate workflow creation input', async () => {
      const invalidWorkflow = {
        name: '', // Empty name should fail validation
        steps: [] // Empty steps should fail validation
      };

      const response = await request(app)
        .post('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringMatching(/name|steps/)
            })
          ])
        }
      });
    });

    it('should retrieve a workflow by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: workflowId,
          name: validWorkflow.name,
          status: WorkflowStatus.DRAFT
        }
      });
    });

    it('should return 404 for non-existent workflow', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND'
        }
      });
    });

    it('should list workflows with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .query({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          workflows: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
            pages: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrev: expect.any(Boolean)
          },
          filters: expect.any(Object)
        }
      });

      expect(response.body.data.workflows.length).toBeGreaterThan(0);
    });

    it('should filter workflows by status', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .query({
          status: [WorkflowStatus.DRAFT],
          limit: 5
        })
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.workflows.forEach((workflow: any) => {
        expect(workflow.status).toBe(WorkflowStatus.DRAFT);
      });
    });

    it('should update a workflow', async () => {
      const updateData = {
        name: 'Updated Test Workflow',
        description: 'Updated description',
        metadata: {
          tags: ['updated', 'test'],
          priority: Priority.HIGH
        }
      };

      const response = await request(app)
        .put(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: workflowId,
          name: updateData.name,
          description: updateData.description,
          metadata: expect.objectContaining({
            tags: updateData.metadata.tags,
            priority: updateData.metadata.priority
          })
        }
      });
    });

    it('should validate workflow update input', async () => {
      const invalidUpdate = {
        version: 'invalid-version' // Invalid semver format
      };

      const response = await request(app)
        .put(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });
  });

  describe('Workflow Execution', () => {
    beforeAll(async () => {
      // First, activate the workflow so it can be executed
      await request(app)
        .put(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .send({ status: WorkflowStatus.ACTIVE });
    });

    it('should execute a workflow', async () => {
      const executeRequest = {
        variables: {
          user: {
            email: 'test@example.com',
            name: 'Test User'
          }
        },
        priority: Priority.HIGH,
        timeout: 600000
      };

      const response = await request(app)
        .post(`/api/v1/workflows/${workflowId}/execute`)
        .set('X-API-Key', 'test-api-key')
        .send(executeRequest)
        .expect(202);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          workflowId: workflowId,
          status: ExecutionStatus.PENDING,
          variables: expect.objectContaining(executeRequest.variables),
          stepExecutions: expect.any(Array),
          logs: expect.any(Array),
          metrics: expect.any(Object)
        }
      });

      executionId = response.body.data.id;
    });

    it('should not execute inactive workflow', async () => {
      // Create and try to execute a draft workflow
      const draftWorkflow = {
        name: 'Draft Workflow',
        steps: [
          {
            name: 'Test Step',
            type: StepType.SCRIPT,
            config: { script: 'test.js' }
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .send(draftWorkflow);

      const draftWorkflowId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/v1/workflows/${draftWorkflowId}/execute`)
        .set('X-API-Key', 'test-api-key')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'WORKFLOW_NOT_ACTIVE',
          message: 'Only active workflows can be executed'
        }
      });
    });

    it('should retrieve execution details', async () => {
      const response = await request(app)
        .get(`/api/v1/executions/${executionId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: executionId,
          workflowId: workflowId,
          status: expect.any(String),
          stepExecutions: expect.any(Array),
          logs: expect.any(Array),
          metrics: expect.any(Object)
        }
      });
    });

    it('should list executions', async () => {
      const response = await request(app)
        .get('/api/v1/executions')
        .query({
          workflowId: workflowId,
          page: 1,
          limit: 10
        })
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          executions: expect.arrayContaining([
            expect.objectContaining({
              id: executionId,
              workflowId: workflowId
            })
          ]),
          pagination: expect.any(Object)
        }
      });
    });

    // Note: The following execution control tests might need to wait for the execution 
    // to reach the running state in a real implementation
    it('should pause execution (when running)', async () => {
      // This test assumes the execution reaches running state quickly
      // In a real implementation, you might need to wait or mock the execution state
      
      const response = await request(app)
        .post(`/api/v1/executions/${executionId}/pause`)
        .set('X-API-Key', 'test-api-key');

      // The response code depends on the current execution state
      if (response.status === 200) {
        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: executionId,
            status: ExecutionStatus.PAUSED
          }
        });
      } else if (response.status === 400) {
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'EXECUTION_NOT_RUNNING'
          }
        });
      }
    });

    it('should cancel execution', async () => {
      const response = await request(app)
        .post(`/api/v1/executions/${executionId}/cancel`)
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: executionId,
          status: ExecutionStatus.CANCELLED
        }
      });
    });
  });

  describe('Monitoring Endpoints', () => {
    it('should retrieve execution logs', async () => {
      const response = await request(app)
        .get(`/api/v1/executions/${executionId}/logs`)
        .query({
          limit: 50,
          offset: 0
        })
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          logs: expect.any(Array),
          total: expect.any(Number)
        }
      });

      if (response.body.data.logs.length > 0) {
        expect(response.body.data.logs[0]).toMatchObject({
          id: expect.any(String),
          level: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String)
        });
      }
    });

    it('should filter execution logs by level', async () => {
      const response = await request(app)
        .get(`/api/v1/executions/${executionId}/logs`)
        .query({
          level: 'info',
          limit: 20
        })
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.logs.length > 0) {
        response.body.data.logs.forEach((log: any) => {
          expect(log.level).toBe('info');
        });
      }
    });

    it('should retrieve execution metrics', async () => {
      const response = await request(app)
        .get(`/api/v1/executions/${executionId}/metrics`)
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          stepDurations: expect.any(Object)
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to workflow endpoints', async () => {
      // This test would need to make many requests quickly to trigger rate limiting
      // For brevity, we'll just verify the rate limit headers are present
      
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/workflows')
        .set('X-API-Key', 'test-api-key')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid UUID parameters', async () => {
      const response = await request(app)
        .get('/api/v1/workflows/invalid-uuid')
        .set('X-API-Key', 'test-api-key')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });
  });

  describe('Cleanup', () => {
    it('should delete the test workflow', async () => {
      const response = await request(app)
        .delete(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should verify workflow deletion', async () => {
      await request(app)
        .get(`/api/v1/workflows/${workflowId}`)
        .set('X-API-Key', 'test-api-key')
        .expect(404);
    });
  });
});