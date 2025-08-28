/**
 * Comprehensive WorkflowRoutes API Tests
 * Testing all endpoints with authentication, authorization, validation, and error handling
 * @priority HIGH - API endpoints are critical user-facing functionality
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowRoutes } from '../../../backend/api/workflow/WorkflowRoutes';
import { WorkflowStatus, ExecutionStatus, StepType, Priority, BackoffStrategy } from '../../../backend/api/workflow/types';

describe('WorkflowRoutes API Tests', () => {
  let app: express.Express;
  let workflowRoutes: WorkflowRoutes;
  let authToken: string;
  let apiKey: string;
  let userId: string;
  let workflowId: string;
  let executionId: string;

  // Test user contexts
  const adminUser = {
    userId: 'admin-user-id',
    username: 'admin',
    roles: ['admin'],
    permissions: ['workflow:create', 'workflow:read', 'workflow:update', 'workflow:delete', 'workflow:execute', 'workflow:control'],
    organizationId: 'test-org'
  };

  const regularUser = {
    userId: 'regular-user-id',
    username: 'user',
    roles: ['user'],
    permissions: ['workflow:read'],
    organizationId: 'test-org'
  };

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    
    workflowRoutes = new WorkflowRoutes();
    app.use('/api/v1', workflowRoutes.router);

    // Generate test tokens
    authToken = jwt.sign(adminUser, process.env.JWT_SECRET || 'workflow-secret', { expiresIn: '1h' });
    apiKey = process.env.WORKFLOW_API_KEY || 'test-api-key';
    userId = adminUser.userId;
    workflowId = uuidv4();
    executionId = uuidv4();

    // Set environment for testing
    process.env.NODE_ENV = 'test';
    
    // Create a test workflow for use in subsequent tests
    const testWorkflowData = {
      name: 'Test Workflow for API Tests',
      description: 'Test workflow created for API testing',
      steps: [{
        name: 'Test Step',
        type: StepType.SCRIPT,
        config: { script: 'test.js' }
      }],
      metadata: {
        tags: ['test'],
        priority: Priority.NORMAL
      }
    };
    
    const createResponse = await request(app)
      .post('/api/v1/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testWorkflowData);
      
    if (createResponse.status === 201) {
      workflowId = createResponse.body.data.id;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    test('GET /health should return healthy status', async () => {
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
        timestamp: expect.any(String)
      });
    });

    test('GET /health should not require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication Tests', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_AUTH',
          message: expect.stringContaining('Authentication required')
        }
      });
    });

    test('should accept valid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should accept valid API key', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('X-API-Key', 'invalid-api-key')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    test('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { ...adminUser, exp: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
        process.env.JWT_SECRET || 'workflow-secret'
      );

      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Authorization Tests', () => {
    const limitedUser = jwt.sign(regularUser, process.env.JWT_SECRET || 'workflow-secret');

    test('should allow admin to create workflows', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test workflow description',
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: { script: 'test.js' }
        }]
      };

      const response = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should deny regular user from creating workflows', async () => {
      const workflowData = {
        name: 'Test Workflow',
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: { script: 'test.js' }
        }]
      };

      const response = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${limitedUser}`)
        .send(workflowData)
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(response.body.error.details.required).toContain('workflow:create');
    });

    test('should allow users with read permission to list workflows', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${limitedUser}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should deny access without required permissions', async () => {
      const noPermissionsUser = jwt.sign({
        userId: 'no-perms-user',
        roles: [],
        permissions: []
      }, process.env.JWT_SECRET || 'workflow-secret');

      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${noPermissionsUser}`)
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Workflow CRUD Operations', () => {
    describe('Create Workflow (POST /workflows)', () => {
      test('should create workflow with valid data', async () => {
        const workflowData = {
          name: 'User Onboarding Workflow',
          description: 'Automated user onboarding process',
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
                backoffStrategy: BackoffStrategy.EXPONENTIAL,
                backoffMultiplier: 2,
                maxBackoffTime: 60000
              }
            }
          ],
          variables: {
            defaultRole: 'user'
          },
          metadata: {
            tags: ['onboarding', 'automation'],
            priority: Priority.NORMAL,
            owner: 'platform-team'
          }
        };

        const response = await request(app)
          .post('/api/v1/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(workflowData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: workflowData.name,
            description: workflowData.description,
            steps: expect.arrayContaining([
              expect.objectContaining({
                name: 'Send Welcome Email',
                type: StepType.EMAIL
              })
            ]),
            status: WorkflowStatus.DRAFT,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        });
      });

      test('should reject workflow with invalid data', async () => {
        const invalidData = {
          name: '', // Empty name
          steps: [] // No steps
        };

        const response = await request(app)
          .post('/api/v1/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
              })
            ])
          }
        });
      });

      test('should reject workflow with invalid step configuration', async () => {
        const invalidData = {
          name: 'Test Workflow',
          steps: [{
            name: 'Invalid Step',
            type: 'INVALID_TYPE', // Invalid step type
            config: {} // Missing required config
          }]
        };

        const response = await request(app)
          .post('/api/v1/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      test('should enforce rate limiting', async () => {
        const workflowData = {
          name: 'Rate Limited Workflow',
          steps: [{
            name: 'Test Step',
            type: StepType.SCRIPT,
            config: { script: 'test.js' }
          }]
        };

        // Make multiple rapid requests to trigger rate limiting
        const requests = Array.from({ length: 105 }, () =>
          request(app)
            .post('/api/v1/workflows')
            .set('Authorization', `Bearer ${authToken}`)
            .send(workflowData)
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(res => res.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        expect(rateLimitedResponses[0].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      });
    });

    describe('List Workflows (GET /workflows)', () => {
      test('should list workflows with default pagination', async () => {
        const response = await request(app)
          .get('/api/v1/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            workflows: expect.any(Array),
            pagination: {
              page: 1,
              limit: 20,
              total: expect.any(Number),
              pages: expect.any(Number)
            }
          }
        });
      });

      test('should handle pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/workflows')
          .query({ page: 2, limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.pagination).toMatchObject({
          page: 2,
          limit: 10
        });
      });

      test('should filter by status', async () => {
        const response = await request(app)
          .get('/api/v1/workflows')
          .query({ status: [WorkflowStatus.ACTIVE, WorkflowStatus.DRAFT] })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should search workflows', async () => {
        const response = await request(app)
          .get('/api/v1/workflows')
          .query({ search: 'onboarding', sortBy: 'name', sortOrder: 'asc' })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should reject invalid query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/workflows')
          .query({ page: 0, limit: 101 }) // Invalid values
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Get Workflow (GET /workflows/:id)', () => {
      test('should get workflow by valid ID', async () => {
        const response = await request(app)
          .get(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: workflowId,
            name: expect.any(String),
            steps: expect.any(Array),
            status: expect.any(String)
          }
        });
      });

      test('should return 404 for non-existent workflow', async () => {
        const nonExistentId = uuidv4();
        const response = await request(app)
          .get(`/api/v1/workflows/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error.code).toBe('NOT_FOUND');
      });

      test('should reject invalid UUID format', async () => {
        const response = await request(app)
          .get('/api/v1/workflows/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      test('should enforce ownership check', async () => {
        const otherUserToken = jwt.sign({
          userId: 'other-user-id',
          roles: ['user'],
          permissions: ['workflow:read']
        }, process.env.JWT_SECRET || 'workflow-secret');

        const response = await request(app)
          .get(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(403);

        expect(response.body.error.code).toBe('ACCESS_DENIED');
      });
    });

    describe('Update Workflow (PUT /workflows/:id)', () => {
      test('should update workflow with valid data', async () => {
        const updateData = {
          name: 'Updated Workflow Name',
          description: 'Updated description',
          metadata: {
            tags: ['updated', 'test'],
            priority: Priority.HIGH
          }
        };

        const response = await request(app)
          .put(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: workflowId,
            name: updateData.name,
            description: updateData.description,
            updatedAt: expect.any(String)
          }
        });
      });

      test('should reject empty update', async () => {
        const response = await request(app)
          .put(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({}) // Empty update
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      test('should validate updated steps', async () => {
        const updateData = {
          steps: [{
            name: 'Invalid Step',
            type: 'INVALID_TYPE',
            config: {}
          }]
        };

        const response = await request(app)
          .put(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Delete Workflow (DELETE /workflows/:id)', () => {
      test('should delete workflow successfully', async () => {
        const response = await request(app)
          .delete(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        expect(response.body).toEqual({});
      });

      test('should prevent deletion if workflow has active executions', async () => {
        const response = await request(app)
          .delete(`/api/v1/workflows/${workflowId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'WORKFLOW_HAS_ACTIVE_EXECUTIONS',
            message: expect.stringContaining('active executions')
          }
        });
      });

      test('should return 404 for non-existent workflow', async () => {
        const nonExistentId = uuidv4();
        const response = await request(app)
          .delete(`/api/v1/workflows/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Workflow Execution Operations', () => {
    describe('Execute Workflow (POST /workflows/:id/execute)', () => {
      test('should execute workflow with variables', async () => {
        const executionData = {
          variables: {
            user: {
              email: 'user@example.com',
              name: 'John Doe'
            }
          },
          priority: Priority.HIGH,
          timeout: 3600000,
          notifications: [{
            type: 'email',
            recipients: ['admin@example.com'],
            events: ['completed', 'failed']
          }]
        };

        const response = await request(app)
          .post(`/api/v1/workflows/${workflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(executionData)
          .expect(202);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            workflowId,
            status: expect.stringMatching(/^(pending|running)$/),
            variables: executionData.variables,
            startedAt: expect.any(String)
          }
        });
      });

      test('should execute workflow without additional parameters', async () => {
        const response = await request(app)
          .post(`/api/v1/workflows/${workflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(202);

        expect(response.body.success).toBe(true);
        expect(response.body.data.workflowId).toBe(workflowId);
      });

      test('should reject execution of inactive workflow', async () => {
        const inactiveWorkflowId = uuidv4();
        const response = await request(app)
          .post(`/api/v1/workflows/${inactiveWorkflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.error.code).toBe('WORKFLOW_NOT_EXECUTABLE');
      });

      test('should validate execution parameters', async () => {
        const invalidData = {
          priority: 'INVALID_PRIORITY',
          timeout: -1000, // Negative timeout
          notifications: [{
            type: 'invalid_type',
            recipients: ['invalid-email']
          }]
        };

        const response = await request(app)
          .post(`/api/v1/workflows/${workflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('List Executions (GET /executions)', () => {
      test('should list executions with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/executions')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            executions: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 20
            })
          }
        });
      });

      test('should filter executions by status and workflow', async () => {
        const response = await request(app)
          .get('/api/v1/executions')
          .query({
            status: [ExecutionStatus.RUNNING, ExecutionStatus.COMPLETED],
            workflowId,
            sortBy: 'startedAt',
            sortOrder: 'desc'
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should filter executions by date range', async () => {
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const endDate = new Date();

        const response = await request(app)
          .get('/api/v1/executions')
          .query({
            startedAfter: startDate.toISOString(),
            startedBefore: endDate.toISOString()
          })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Get Execution (GET /executions/:executionId)', () => {
      test('should get execution details', async () => {
        const response = await request(app)
          .get(`/api/v1/executions/${executionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: executionId,
            workflowId: expect.any(String),
            status: expect.any(String),
            steps: expect.any(Array),
            startedAt: expect.any(String)
          }
        });
      });

      test('should return 404 for non-existent execution', async () => {
        const nonExistentId = uuidv4();
        const response = await request(app)
          .get(`/api/v1/executions/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('Execution Control Operations', () => {
      test('should pause running execution', async () => {
        const response = await request(app)
          .post(`/api/v1/executions/${executionId}/pause`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: executionId,
            status: ExecutionStatus.PAUSED,
            pausedAt: expect.any(String)
          }
        });
      });

      test('should resume paused execution', async () => {
        const response = await request(app)
          .post(`/api/v1/executions/${executionId}/resume`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: executionId,
            status: ExecutionStatus.RUNNING,
            resumedAt: expect.any(String)
          }
        });
      });

      test('should cancel execution', async () => {
        const response = await request(app)
          .post(`/api/v1/executions/${executionId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: executionId,
            status: ExecutionStatus.CANCELLED,
            cancelledAt: expect.any(String)
          }
        });
      });

      test('should prevent invalid state transitions', async () => {
        // Try to pause already cancelled execution
        const response = await request(app)
          .post(`/api/v1/executions/${executionId}/pause`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.error.code).toBe('INVALID_STATE_TRANSITION');
      });

      test('should require control permissions', async () => {
        const limitedToken = jwt.sign({
          userId: 'limited-user',
          roles: ['user'],
          permissions: ['workflow:read'] // Missing workflow:control
        }, process.env.JWT_SECRET || 'workflow-secret');

        const response = await request(app)
          .post(`/api/v1/executions/${executionId}/pause`)
          .set('Authorization', `Bearer ${limitedToken}`)
          .expect(403);

        expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      });
    });
  });

  describe('Monitoring Endpoints', () => {
    describe('Execution Logs (GET /executions/:executionId/logs)', () => {
      test('should get execution logs', async () => {
        const response = await request(app)
          .get(`/api/v1/executions/${executionId}/logs`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            logs: expect.any(Array),
            total: expect.any(Number)
          }
        });
      });

      test('should filter logs by level', async () => {
        const response = await request(app)
          .get(`/api/v1/executions/${executionId}/logs`)
          .query({ level: 'error', limit: 50, offset: 0 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should paginate logs', async () => {
        const response = await request(app)
          .get(`/api/v1/executions/${executionId}/logs`)
          .query({ limit: 10, offset: 20 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Execution Metrics (GET /executions/:executionId/metrics)', () => {
      test('should get execution metrics', async () => {
        const response = await request(app)
          .get(`/api/v1/executions/${executionId}/metrics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            duration: expect.any(Number),
            stepMetrics: expect.any(Array),
            resourceUsage: expect.objectContaining({
              cpu: expect.any(Number),
              memory: expect.any(Number)
            }),
            errorRate: expect.any(Number),
            throughput: expect.any(Number)
          }
        });
      });

      test('should return 404 for metrics of non-existent execution', async () => {
        const nonExistentId = uuidv4();
        const response = await request(app)
          .get(`/api/v1/executions/${nonExistentId}/metrics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    test('should handle database connection errors gracefully', async () => {
      // Mock database connection error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      
      jest.restoreAllMocks();
    });

    test('should handle internal server errors', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .get('/api/v1/workflows/trigger-error')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal server error occurred'
        },
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });

      jest.restoreAllMocks();
    });

    test('should include request ID in all responses', async () => {
      const requestId = uuidv4();
      const response = await request(app)
        .get('/api/v1/health')
        .set('X-Request-ID', requestId)
        .expect(200);

      expect(response.body.requestId).toBe(requestId);
      expect(response.headers['x-request-id']).toBe(requestId);
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/v1/workflows')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should include rate limit headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    test('should apply different rate limits to different endpoints', async () => {
      // Heavy operations should have lower rate limits
      const heavyOpResponse = await request(app)
        .post(`/api/v1/executions/${executionId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const regularOpResponse = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const heavyLimit = parseInt(heavyOpResponse.headers['x-ratelimit-limit']);
      const regularLimit = parseInt(regularOpResponse.headers['x-ratelimit-limit']);

      expect(heavyLimit).toBeLessThan(regularLimit);
    });
  });
});