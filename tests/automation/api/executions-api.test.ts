/**
 * API Automation Tests: Workflow Executions Management
 * Comprehensive testing for workflow execution lifecycle and monitoring
 */

import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

// Types
interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startedAt?: string;
  completedAt?: string;
  currentStep?: string;
  stepExecutions: StepExecution[];
  variables: Record<string, any>;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
  error?: {
    code: string;
    message: string;
    details?: any;
    stepId?: string;
    timestamp: string;
    recoverable: boolean;
  };
}

interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: any;
  retryCount: number;
}

interface ExecutionLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  stepId?: string;
  metadata?: Record<string, any>;
}

interface ExecutionMetrics {
  totalDuration?: number;
  stepDurations: Record<string, number>;
  resourceUsage?: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkIO?: number;
    diskIO?: number;
  };
  throughput?: number;
  errorRate?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const TIMEOUT = 30000;

// Global test data
let authToken: string;
let testWorkflowId: string;
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

const createTestWorkflow = async (): Promise<string> => {
  const workflowData = {
    name: `Test Execution Workflow ${uuidv4().slice(0, 8)}`,
    description: 'Workflow for execution testing',
    version: '1.0.0',
    status: 'active',
    steps: [
      {
        id: uuidv4(),
        name: 'Initialize',
        type: 'script',
        config: {
          script: 'console.log("Starting execution");',
          duration: 1000
        },
        timeout: 5000
      },
      {
        id: uuidv4(),
        name: 'Process Data',
        type: 'script',
        config: {
          script: 'console.log("Processing data: " + JSON.stringify(variables));',
          duration: 2000
        },
        timeout: 10000
      },
      {
        id: uuidv4(),
        name: 'Finalize',
        type: 'script',
        config: {
          script: 'console.log("Execution completed");',
          duration: 500
        },
        timeout: 5000
      }
    ],
    variables: {
      environment: 'test',
      maxRetries: 3
    },
    metadata: {
      tags: ['test', 'execution'],
      owner: 'test-admin',
      priority: 'normal'
    }
  };
  
  const response = await makeRequest({
    method: 'POST',
    url: `${BASE_URL}/workflows`,
    data: workflowData
  });
  
  return response.data.data.id;
};

const waitForExecutionStatus = async (
  executionId: string, 
  expectedStatus: string[], 
  timeoutMs: number = 30000
): Promise<WorkflowExecution> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const response = await makeRequest({
      method: 'GET',
      url: `${BASE_URL}/executions/${executionId}`
    });
    
    if (response.status === 200 && response.data.data) {
      const execution = response.data.data as WorkflowExecution;
      if (expectedStatus.includes(execution.status)) {
        return execution;
      }
    }
    
    await delay(500);
  }
  
  throw new Error(`Execution ${executionId} did not reach expected status ${expectedStatus} within ${timeoutMs}ms`);
};

const createWebSocketConnection = (executionId: string): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/executions/${executionId}/stream`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
    
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
  });
};

// Test Suite
describe('Workflow Executions API Tests', () => {
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
      throw new Error('Failed to authenticate for execution tests');
    }
    
    authToken = authResponse.data.data.accessToken;
    
    // Create test workflow
    testWorkflowId = await createTestWorkflow();
  });

  afterAll(async () => {
    // Cleanup test executions and workflow
    for (const executionId of testExecutionIds) {
      try {
        await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/executions/${executionId}/cancel`
        });
      } catch (error) {
        console.warn(`Failed to cleanup execution ${executionId}`);
      }
    }
    
    try {
      await makeRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${testWorkflowId}`
      });
    } catch (error) {
      console.warn(`Failed to cleanup workflow ${testWorkflowId}`);
    }
  });

  describe('POST /workflows/{id}/execute - Start Execution', () => {
    test('should start workflow execution successfully', async () => {
      const executionData = {
        variables: {
          testMode: true,
          userId: 'test-user-123',
          environment: 'testing'
        },
        priority: 'high',
        timeout: 60000
      };
      
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: executionData
      });

      expect(response.status).toBe(202);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('workflowId', testWorkflowId);
      expect(response.data.data).toHaveProperty('status');
      expect(['pending', 'running']).toContain(response.data.data.status);
      expect(response.data.data.variables).toEqual(
        expect.objectContaining(executionData.variables)
      );
      
      testExecutionIds.push(response.data.data.id);
    });

    test('should start execution with default variables', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`
      });

      expect(response.status).toBe(202);
      expect(response.data.data.variables).toHaveProperty('environment', 'test');
      expect(response.data.data.variables).toHaveProperty('maxRetries', 3);
      
      testExecutionIds.push(response.data.data.id);
    });

    test('should reject execution of non-existent workflow', async () => {
      const fakeWorkflowId = uuidv4();
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${fakeWorkflowId}/execute`
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('WORKFLOW_NOT_FOUND');
    });

    test('should reject execution of inactive workflow', async () => {
      // Create inactive workflow
      const inactiveWorkflowData = {
        name: `Inactive Workflow ${uuidv4().slice(0, 8)}`,
        description: 'Inactive workflow for testing',
        version: '1.0.0',
        status: 'inactive',
        steps: [{
          id: uuidv4(),
          name: 'Test Step',
          type: 'script',
          config: { script: 'console.log("test");' }
        }]
      };
      
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: inactiveWorkflowData
      });
      
      const inactiveWorkflowId = workflowResponse.data.data.id;
      
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${inactiveWorkflowId}/execute`
      });

      expect(executeResponse.status).toBe(400);
      expect(executeResponse.data.error.code).toBe('WORKFLOW_INACTIVE');
      
      // Cleanup
      await makeRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${inactiveWorkflowId}`
      });
    });

    test('should validate execution variables', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: 'invalid_variables_format'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /executions - List Executions', () => {
    beforeAll(async () => {
      // Create several test executions
      for (let i = 0; i < 3; i++) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
          data: {
            variables: { testIndex: i }
          }
        });
        
        if (response.status === 202) {
          testExecutionIds.push(response.data.data.id);
        }
      }
      
      // Wait a bit for executions to start
      await delay(1000);
    });

    test('should list executions with pagination', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions?limit=2`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('executions');
      expect(response.data.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data.executions)).toBe(true);
      expect(response.data.data.executions.length).toBeLessThanOrEqual(2);
    });

    test('should filter executions by workflow ID', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions?workflowId=${testWorkflowId}`
      });

      expect(response.status).toBe(200);
      response.data.data.executions.forEach((execution: WorkflowExecution) => {
        expect(execution.workflowId).toBe(testWorkflowId);
      });
    });

    test('should filter executions by status', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions?status=running,completed`
      });

      expect(response.status).toBe(200);
      response.data.data.executions.forEach((execution: WorkflowExecution) => {
        expect(['running', 'completed']).toContain(execution.status);
      });
    });

    test('should sort executions by start date', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions?sortBy=startedAt&sortOrder=desc`
      });

      expect(response.status).toBe(200);
      const executions = response.data.data.executions
        .filter((e: WorkflowExecution) => e.startedAt);
      
      for (let i = 1; i < executions.length; i++) {
        const prevDate = new Date(executions[i - 1].startedAt!);
        const currDate = new Date(executions[i].startedAt!);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('GET /executions/{id} - Get Execution Details', () => {
    let executionId: string;
    
    beforeAll(async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { detailsTest: true }
        }
      });
      
      executionId = response.data.data.id;
      testExecutionIds.push(executionId);
    });

    test('should retrieve execution details', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${executionId}`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(executionId);
      expect(response.data.data).toHaveProperty('workflowId');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('variables');
      expect(response.data.data).toHaveProperty('stepExecutions');
      expect(Array.isArray(response.data.data.stepExecutions)).toBe(true);
    });

    test('should include step execution details', async () => {
      // Wait for execution to progress
      await delay(2000);
      
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${executionId}`
      });

      expect(response.status).toBe(200);
      const execution = response.data.data as WorkflowExecution;
      
      if (execution.stepExecutions.length > 0) {
        execution.stepExecutions.forEach((stepExecution: StepExecution) => {
          expect(stepExecution).toHaveProperty('stepId');
          expect(stepExecution).toHaveProperty('status');
          expect(stepExecution).toHaveProperty('retryCount');
          expect(typeof stepExecution.retryCount).toBe('number');
        });
      }
    });

    test('should return 404 for non-existent execution', async () => {
      const fakeId = uuidv4();
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${fakeId}`
      });

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('EXECUTION_NOT_FOUND');
    });
  });

  describe('Execution Control Operations', () => {
    let controlExecutionId: string;
    
    beforeAll(async () => {
      // Create a long-running execution for control testing
      const workflowData = {
        name: `Control Test Workflow ${uuidv4().slice(0, 8)}`,
        description: 'Long-running workflow for control testing',
        version: '1.0.0',
        status: 'active',
        steps: [
          {
            id: uuidv4(),
            name: 'Long Running Step',
            type: 'delay',
            config: {
              duration: 30000 // 30 seconds
            }
          }
        ]
      };
      
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: workflowData
      });
      
      const longRunningWorkflowId = workflowResponse.data.data.id;
      
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${longRunningWorkflowId}/execute`
      });
      
      controlExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(controlExecutionId);
      
      // Wait for execution to start
      await delay(1000);
    });

    test('should pause running execution', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/executions/${controlExecutionId}/pause`
      });

      expect([200, 202]).toContain(response.status);
      if (response.data) {
        expect(response.data.success).toBe(true);
      }
      
      // Verify execution is paused
      const statusResponse = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${controlExecutionId}`
      });
      
      expect(statusResponse.data.data.status).toBe('paused');
    });

    test('should resume paused execution', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/executions/${controlExecutionId}/resume`
      });

      expect([200, 202]).toContain(response.status);
      if (response.data) {
        expect(response.data.success).toBe(true);
      }
      
      // Verify execution is running again
      await delay(1000);
      const statusResponse = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${controlExecutionId}`
      });
      
      expect(['running', 'completed']).toContain(statusResponse.data.data.status);
    });

    test('should cancel running execution', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/executions/${controlExecutionId}/cancel`
      });

      expect([200, 202]).toContain(response.status);
      if (response.data) {
        expect(response.data.success).toBe(true);
      }
      
      // Verify execution is cancelled
      const statusResponse = await waitForExecutionStatus(
        controlExecutionId, 
        ['cancelled'], 
        10000
      );
      
      expect(statusResponse.status).toBe('cancelled');
    });

    test('should reject control operations on completed execution', async () => {
      // Create a quick execution
      const quickWorkflowData = {
        name: `Quick Workflow ${uuidv4().slice(0, 8)}`,
        description: 'Quick workflow',
        version: '1.0.0',
        status: 'active',
        steps: [{
          id: uuidv4(),
          name: 'Quick Step',
          type: 'script',
          config: { script: 'console.log("done");' }
        }]
      };
      
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: quickWorkflowData
      });
      
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${workflowResponse.data.data.id}/execute`
      });
      
      const quickExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(quickExecutionId);
      
      // Wait for completion
      await waitForExecutionStatus(quickExecutionId, ['completed', 'failed'], 10000);
      
      // Try to pause completed execution
      const pauseResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/executions/${quickExecutionId}/pause`
      });

      expect(pauseResponse.status).toBe(400);
      expect(pauseResponse.data.error.code).toBe('INVALID_EXECUTION_STATE');
    });
  });

  describe('GET /executions/{id}/logs - Execution Logs', () => {
    let logExecutionId: string;
    
    beforeAll(async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { logTest: true }
        }
      });
      
      logExecutionId = response.data.data.id;
      testExecutionIds.push(logExecutionId);
      
      // Wait for some logs to be generated
      await delay(3000);
    });

    test('should retrieve execution logs', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${logExecutionId}/logs`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('logs');
      expect(response.data.data).toHaveProperty('total');
      expect(Array.isArray(response.data.data.logs)).toBe(true);
      
      if (response.data.data.logs.length > 0) {
        response.data.data.logs.forEach((log: ExecutionLog) => {
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('level');
          expect(log).toHaveProperty('message');
          expect(log).toHaveProperty('timestamp');
          expect(['debug', 'info', 'warn', 'error', 'fatal']).toContain(log.level);
        });
      }
    });

    test('should filter logs by level', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${logExecutionId}/logs?level=error`
      });

      expect(response.status).toBe(200);
      response.data.data.logs.forEach((log: ExecutionLog) => {
        expect(log.level).toBe('error');
      });
    });

    test('should support log pagination', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${logExecutionId}/logs?limit=5&offset=0`
      });

      expect(response.status).toBe(200);
      expect(response.data.data.logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /executions/{id}/metrics - Execution Metrics', () => {
    let metricsExecutionId: string;
    
    beforeAll(async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { metricsTest: true }
        }
      });
      
      metricsExecutionId = response.data.data.id;
      testExecutionIds.push(metricsExecutionId);
      
      // Wait for execution to complete and metrics to be calculated
      await waitForExecutionStatus(metricsExecutionId, ['completed', 'failed'], 15000);
    });

    test('should retrieve execution metrics', async () => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${metricsExecutionId}/metrics`
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('stepDurations');
      expect(typeof response.data.data.stepDurations).toBe('object');
      
      if (response.data.data.totalDuration) {
        expect(typeof response.data.data.totalDuration).toBe('number');
        expect(response.data.data.totalDuration).toBeGreaterThan(0);
      }
      
      if (response.data.data.resourceUsage) {
        expect(typeof response.data.data.resourceUsage).toBe('object');
      }
    });
  });

  describe('WebSocket Real-time Updates', () => {
    test('should receive real-time execution updates via WebSocket', async () => {
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { wsTest: true }
        }
      });
      
      const wsExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(wsExecutionId);
      
      // Connect to WebSocket
      const ws = await createWebSocketConnection(wsExecutionId);
      
      const messages: any[] = [];
      const messagePromise = new Promise((resolve) => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messages.push(message);
          
          if (message.type === 'status_change' || messages.length >= 3) {
            resolve(messages);
          }
        });
        
        setTimeout(() => resolve(messages), 10000);
      });
      
      await messagePromise;
      ws.close();
      
      expect(messages.length).toBeGreaterThan(0);
      
      // Verify message structure
      messages.forEach(message => {
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('executionId', wsExecutionId);
        expect(message).toHaveProperty('timestamp');
      });
    }, 15000);

    test('should handle WebSocket authentication', async () => {
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { authTest: true }
        }
      });
      
      const wsExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(wsExecutionId);
      
      // Try to connect without authentication
      const wsWithoutAuth = new WebSocket(`${WS_URL}/executions/${wsExecutionId}/stream`);
      
      const authErrorPromise = new Promise((resolve, reject) => {
        wsWithoutAuth.on('error', resolve);
        wsWithoutAuth.on('open', () => {
          wsWithoutAuth.close();
          reject(new Error('WebSocket should require authentication'));
        });
        
        setTimeout(() => reject(new Error('Timeout waiting for auth error')), 5000);
      });
      
      await expect(authErrorPromise).resolves.toBeDefined();
    }, 10000);
  });

  describe('Error Scenarios', () => {
    test('should handle execution timeout', async () => {
      const timeoutWorkflowData = {
        name: `Timeout Workflow ${uuidv4().slice(0, 8)}`,
        description: 'Workflow that will timeout',
        version: '1.0.0',
        status: 'active',
        steps: [{
          id: uuidv4(),
          name: 'Timeout Step',
          type: 'delay',
          config: { duration: 10000 }, // 10 seconds
          timeout: 2000 // 2 second timeout
        }]
      };
      
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: timeoutWorkflowData
      });
      
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${workflowResponse.data.data.id}/execute`
      });
      
      const timeoutExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(timeoutExecutionId);
      
      // Wait for timeout
      const finalExecution = await waitForExecutionStatus(
        timeoutExecutionId, 
        ['failed', 'timeout'], 
        15000
      );
      
      expect(['failed', 'timeout']).toContain(finalExecution.status);
      if (finalExecution.error) {
        expect(finalExecution.error.code).toContain('TIMEOUT');
      }
    });

    test('should handle step execution failures', async () => {
      const failWorkflowData = {
        name: `Fail Workflow ${uuidv4().slice(0, 8)}`,
        description: 'Workflow that will fail',
        version: '1.0.0',
        status: 'active',
        steps: [{
          id: uuidv4(),
          name: 'Failing Step',
          type: 'script',
          config: {
            script: 'throw new Error("Intentional test failure");'
          }
        }]
      };
      
      const workflowResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: failWorkflowData
      });
      
      const executeResponse = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${workflowResponse.data.data.id}/execute`
      });
      
      const failExecutionId = executeResponse.data.data.id;
      testExecutionIds.push(failExecutionId);
      
      // Wait for failure
      const finalExecution = await waitForExecutionStatus(
        failExecutionId, 
        ['failed'], 
        10000
      );
      
      expect(finalExecution.status).toBe('failed');
      expect(finalExecution.error).toBeDefined();
      expect(finalExecution.error!.message).toContain('Intentional test failure');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent execution requests', async () => {
      const concurrentCount = 5;
      const requests = [];
      
      for (let i = 0; i < concurrentCount; i++) {
        requests.push(
          makeRequest({
            method: 'POST',
            url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
            data: {
              variables: { concurrentTest: i }
            }
          })
        );
      }
      
      const responses = await Promise.allSettled(requests);
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<AxiosResponse>).value)
        .filter(r => r.status === 202);
      
      expect(successfulResponses.length).toBe(concurrentCount);
      
      // Track executions for cleanup
      successfulResponses.forEach(response => {
        testExecutionIds.push(response.data.data.id);
      });
    }, 30000);

    test('should maintain reasonable response times under load', async () => {
      const startTime = Date.now();
      
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions?limit=20`
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });
  });
});
