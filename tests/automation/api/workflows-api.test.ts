/**
 * API Automation Tests: Workflows REST Endpoints
 * Comprehensive CRUD operations testing for workflow management API
 */

import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Types
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  metadata?: {
    tags: string[];
    owner: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'http_request' | 'script' | 'approval' | 'delay' | 'condition' | 'email';
  config: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
  };
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  currentStep?: string;
  variables: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const TIMEOUT = 30000;

// Global test data
let authToken: string;
let testWorkflowIds: string[] = [];
let testExecutionIds: string[] = [];

// Helper Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (config: any): Promise<AxiosResponse> => {
  try {
    return await axios({
      timeout: TIMEOUT,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...config.headers
      }
    });
  } catch (error: any) {
    if (error.response) {
      return error.response;
    }
    throw error;
  }
};

const createSampleWorkflow = (): Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> => ({
  name: `Test Workflow ${uuidv4().slice(0, 8)}`,
  description: 'A test workflow for API automation testing',
  version: '1.0.0',
  status: 'draft',
  steps: [
    {
      id: uuidv4(),
      name: 'Initialize Variables',
      type: 'script',
      config: {
        script: 'console.log("Workflow started");',
        variables: { initialized: true }
      },
      timeout: 30000
    },
    {
      id: uuidv4(),
      name: 'Send Notification',
      type: 'email',
      config: {
        recipient: 'test@jaqedu.test',
        subject: 'Workflow Started',
        template: 'workflow-notification'
      },
      dependencies: [],
      retryPolicy: {
        maxAttempts: 3,
        backoffStrategy: 'exponential'
      }
    }
  ],
  variables: {
    environment: 'test',
    timeout: 300000
  },
  metadata: {
    tags: ['test', 'automation'],
    owner: 'test-admin',
    priority: 'normal'
  }
});

const waitForExecution = async (executionId: string, timeoutMs: number = 30000): Promise<WorkflowExecution> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const response = await makeRequest({
      method: 'GET',
      url: `${BASE_URL}/executions/${executionId}`
    });
    
    if (response.status === 200 && response.data.data) {
      const execution = response.data.data as WorkflowExecution;
      if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
        return execution;
      }
    }
    
    await delay(1000);
  }
  
  throw new Error(`Execution ${executionId} did not complete within ${timeoutMs}ms`);
};

// Test Suite
describe('Workflows API Tests', () => {
  beforeAll(async () => {
    // Authenticate first
    const authResponse = await makeRequest({
      method: 'POST',
      url: `${BASE_URL}/auth/login`,
      data: {
        username: 'admin_test',
        password: 'AdminTest123!'
      }
    });
    
    if (authResponse.status !== 200) {
      // Register admin user if doesn't exist
      const registerResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: 'admin@jaqedu.test',
          username: 'admin_test',
          password: 'AdminTest123!',
          firstName: 'Admin',
          lastName: 'Test',
          role: 'admin'
        }
      });
      
      authToken = registerResponse.data.data.accessToken;
    } else {
      authToken = authResponse.data.data.accessToken;
    }
  });

  afterAll(async () => {
    // Cleanup test workflows
    for (const workflowId of testWorkflowIds) {
      try {
        await makeRequest({
          method: 'DELETE',
          url: `${BASE_URL}/workflows/${workflowId}`
        });
      } catch (error) {
        console.warn(`Failed to cleanup workflow ${workflowId}`);
      }
    }
  });

  describe('POST /workflows - Create Workflow', () => {
    test('should create a new workflow successfully', async () => {
      const workflowData = createSampleWorkflow();
      
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data.name).toBe(workflowData.name);
      expect(response.data.data.description).toBe(workflowData.description);
      expect(response.data.data.status).toBe('draft');
      expect(response.data.data.steps).toHaveLength(2);
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      testWorkflowIds.push(response.data.data.id);
    });

    test('should validate required fields on create', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          description: 'Missing name field'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
      expect(response.data.error.field).toBe('name');
    });

    test('should validate workflow step configuration', async () => {
      const workflowData = {
        ...createSampleWorkflow(),
        steps: [
          {
            id: uuidv4(),
            name: 'Invalid Step',
            type: 'invalid_type', // Invalid step type
            config: {}
          }
        ]
      };
      
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should enforce workflow name uniqueness for same user', async () => {
      const workflowData = createSampleWorkflow();
      
      // Create first workflow
      const firstResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });
      expect(firstResponse.status).toBe(201);
      testWorkflowIds.push(firstResponse.data.data.id);
      
      // Try to create duplicate
      const duplicateResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });
      
      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.data.success).toBe(false);
      expect(duplicateResponse.data.error.code).toBe('DUPLICATE_NAME');
    });

    test('should handle large workflow definitions', async () => {
      const steps = [];
      for (let i = 0; i < 50; i++) {
        steps.push({
          id: uuidv4(),
          name: `Step ${i}`,
          type: 'script',
          config: {
            script: `console.log("Step ${i} executed");`,
            data: Array(100).fill(`data-${i}`).join(',')
          }
        });
      }
      
      const workflowData = {
        ...createSampleWorkflow(),
        steps
      };
      
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });

      expect(response.status).toBe(201);
      expect(response.data.data.steps).toHaveLength(50);
      
      testWorkflowIds.push(response.data.data.id);
    });
  });

  describe('GET /workflows - List Workflows', () => {
    beforeAll(async () => {
      // Create some test workflows
      for (let i = 0; i < 5; i++) {
        const workflowData = {
          ...createSampleWorkflow(),
          name: `List Test Workflow ${i}`,
          metadata: {
            tags: i % 2 === 0 ? ['even', 'test'] : ['odd', 'test'],
            owner: 'test-admin',
            priority: i < 2 ? 'high' : 'normal' as any
          }
        };
        
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: workflowData
        });
        
        if (response.status === 201) {
          testWorkflowIds.push(response.data.data.id);
        }
      }
    });

    test('should list workflows with default pagination', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('workflows');
      expect(response.data.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data.workflows)).toBe(true);
      expect(response.data.data.pagination).toHaveProperty('page');
      expect(response.data.data.pagination).toHaveProperty('limit');
      expect(response.data.data.pagination).toHaveProperty('total');
    });

    test('should support pagination parameters', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?page=1&limit=2`
      });

      expect(response.status).toBe(200);
      expect(response.data.data.workflows.length).toBeLessThanOrEqual(2);
      expect(response.data.data.pagination.page).toBe(1);
      expect(response.data.data.pagination.limit).toBe(2);
    });

    test('should filter by status', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?status=draft`
      });

      expect(response.status).toBe(200);
      response.data.data.workflows.forEach((workflow: WorkflowDefinition) => {
        expect(workflow.status).toBe('draft');
      });
    });

    test('should filter by tags', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?tags=test,even`
      });

      expect(response.status).toBe(200);
      response.data.data.workflows.forEach((workflow: WorkflowDefinition) => {
        expect(workflow.metadata?.tags.some(tag => ['test', 'even'].includes(tag))).toBe(true);
      });
    });

    test('should support search functionality', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?search=List Test`
      });

      expect(response.status).toBe(200);
      response.data.data.workflows.forEach((workflow: WorkflowDefinition) => {
        expect(workflow.name.toLowerCase()).toContain('list test');
      });
    });

    test('should support sorting', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?sortBy=createdAt&sortOrder=desc`
      });

      expect(response.status).toBe(200);
      const workflows = response.data.data.workflows;
      
      for (let i = 1; i < workflows.length; i++) {
        const prevDate = new Date(workflows[i - 1].createdAt);
        const currDate = new Date(workflows[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('GET /workflows/{id} - Get Workflow', () => {
    let workflowId: string;
    
    beforeAll(async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: createSampleWorkflow()
      });
      
      workflowId = response.data.data.id;
      testWorkflowIds.push(workflowId);
    });

    test('should retrieve workflow by valid ID', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows/${workflowId}`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(workflowId);
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('steps');
      expect(response.data.data).toHaveProperty('createdAt');
    });

    test('should return 404 for non-existent workflow', async () => {
      const fakeId = uuidv4();
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows/${fakeId}`
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('WORKFLOW_NOT_FOUND');
    });

    test('should validate UUID format', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows/invalid-uuid`
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /workflows/{id} - Update Workflow', () => {
    let workflowId: string;
    
    beforeAll(async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: createSampleWorkflow()
      });
      
      workflowId = response.data.data.id;
      testWorkflowIds.push(workflowId);
    });

    test('should update workflow successfully', async () => {
      const updateData = {
        name: 'Updated Workflow Name',
        description: 'Updated description',
        status: 'active',
        metadata: {
          tags: ['updated', 'test'],
          owner: 'test-admin',
          priority: 'high'
        }
      };
      
      const response = await makeRequest({
        method: 'PUT',
        url: `${BASE_URL}/workflows/${workflowId}`,
        data: updateData
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(updateData.name);
      expect(response.data.data.description).toBe(updateData.description);
      expect(response.data.data.status).toBe('active');
      expect(response.data.data.metadata.priority).toBe('high');
      expect(response.data.data.updatedAt).not.toBe(response.data.data.createdAt);
    });

    test('should perform partial updates', async () => {
      const updateData = {
        description: 'Partially updated description'
      };
      
      const response = await makeRequest({
        method: 'PUT',
        url: `${BASE_URL}/workflows/${workflowId}`,
        data: updateData
      });

      expect(response.status).toBe(200);
      expect(response.data.data.description).toBe(updateData.description);
      // Name should remain unchanged
      expect(response.data.data.name).toBe('Updated Workflow Name');
    });

    test('should validate update data', async () => {
      const response = await makeRequest({
        method: 'PUT',
        url: `${BASE_URL}/workflows/${workflowId}`,
        data: {
          status: 'invalid_status'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 404 for non-existent workflow update', async () => {
      const fakeId = uuidv4();
      const response = await makeRequest({
        method: 'PUT',
        url: `${BASE_URL}/workflows/${fakeId}`,
        data: { name: 'New Name' }
      });

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('WORKFLOW_NOT_FOUND');
    });
  });

  describe('DELETE /workflows/{id} - Delete Workflow', () => {
    test('should delete workflow successfully', async () => {
      // Create workflow to delete
      const createResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: createSampleWorkflow()
      });
      
      const workflowId = createResponse.data.data.id;
      
      // Delete workflow
      const deleteResponse = await makeRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${workflowId}`
      });

      expect(deleteResponse.status).toBe(204);
      
      // Verify deletion
      const getResponse = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows/${workflowId}`
      });
      
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 when deleting non-existent workflow', async () => {
      const fakeId = uuidv4();
      const response = await makeRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${fakeId}`
      });

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('WORKFLOW_NOT_FOUND');
    });

    test('should prevent deletion of workflow with active executions', async () => {
      // Create workflow
      const createResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          ...createSampleWorkflow(),
          status: 'active'
        }
      });
      
      const workflowId = createResponse.data.data.id;
      testWorkflowIds.push(workflowId);
      
      // Start execution (simulate active execution)
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${workflowId}/execute`,
        data: {
          variables: { test: true }
        }
      });
      
      if (executeResponse.status === 202) {
        testExecutionIds.push(executeResponse.data.data.id);
        
        // Try to delete with active execution
        const deleteResponse = await makeRequest({
          method: 'DELETE',
          url: `${BASE_URL}/workflows/${workflowId}`
        });

        expect(deleteResponse.status).toBe(409);
        expect(deleteResponse.data.error.code).toBe('WORKFLOW_HAS_ACTIVE_EXECUTIONS');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON requests', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: '{ "invalid": json }',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('INVALID_JSON');
    });

    test('should handle missing Content-Type header', async () => {
      const response = await axios.post(
        `${BASE_URL}/workflows`,
        JSON.stringify(createSampleWorkflow()),
        {
          headers: {
            Authorization: `Bearer ${authToken}`
            // Missing Content-Type header
          }
        }
      ).catch(error => error.response);

      expect([400, 415]).toContain(response.status);
    });

    test('should handle request timeout gracefully', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows`,
        timeout: 1 // Very short timeout
      }).catch(error => {
        expect(error.code).toBe('ECONNABORTED');
        return { status: 408 }; // Simulate timeout response
      });

      expect(response.status).toBe(408);
    }, 10000);

    test('should return consistent error format for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', url: `${BASE_URL}/workflows/invalid-id` },
        { method: 'PUT', url: `${BASE_URL}/workflows/invalid-id`, data: {} },
        { method: 'DELETE', url: `${BASE_URL}/workflows/invalid-id` }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(endpoint);
        
        expect(response.data).toHaveProperty('success', false);
        expect(response.data).toHaveProperty('error');
        expect(response.data).toHaveProperty('timestamp');
        expect(response.data).toHaveProperty('requestId');
        expect(response.data.error).toHaveProperty('code');
        expect(response.data.error).toHaveProperty('message');
      }
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent workflow creation', async () => {
      const concurrentRequests = 10;
      const requests = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          makeRequest({
            method: 'POST',
            url: `${BASE_URL}/workflows`,
            data: {
              ...createSampleWorkflow(),
              name: `Concurrent Workflow ${i}`
            }
          })
        );
      }
      
      const responses = await Promise.allSettled(requests);
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<AxiosResponse>).value)
        .filter(r => r.status === 201);
      
      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8); // Allow some failures
      
      // Cleanup
      successfulResponses.forEach(response => {
        testWorkflowIds.push(response.data.data.id);
      });
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows?limit=10`
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
