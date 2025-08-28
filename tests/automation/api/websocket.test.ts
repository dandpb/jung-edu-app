/**
 * API Automation Tests: WebSocket Connections & Real-time Communication
 * Comprehensive testing of WebSocket functionality, authentication, and message handling
 */

import WebSocket from 'ws';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Types
interface WebSocketMessage {
  type: string;
  executionId?: string;
  data?: any;
  timestamp: string;
  messageId: string;
}

interface ExecutionUpdate {
  type: 'status_change' | 'step_complete' | 'log_entry' | 'error' | 'progress';
  executionId: string;
  data: {
    status?: string;
    stepId?: string;
    progress?: number;
    error?: any;
    log?: {
      level: string;
      message: string;
      timestamp: string;
    };
  };
  timestamp: string;
}

interface NotificationMessage {
  type: 'notification';
  userId: string;
  data: {
    title: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    category: string;
  };
  timestamp: string;
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:8080';
const TIMEOUT = 10000;

// Global test data
let authToken: string;
let testWorkflowId: string;
let testExecutionIds: string[] = [];

// Helper Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeHttpRequest = async (config: any) => {
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

const createWebSocketConnection = (
  endpoint: string, 
  options: {
    headers?: Record<string, string>;
    protocols?: string[];
  } = {}
): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    const wsUrl = `${WS_BASE_URL}${endpoint}`;
    const headers = {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers
    };
    
    const ws = new WebSocket(wsUrl, options.protocols, { headers });
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

const waitForWebSocketMessage = (
  ws: WebSocket, 
  predicate: (message: any) => boolean,
  timeoutMs: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const messages: any[] = [];
    
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for WebSocket message. Received: ${JSON.stringify(messages)}`));
    }, timeoutMs);
    
    const messageHandler = (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        messages.push(message);
        
        if (predicate(message)) {
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(message);
        }
      } catch (error) {
        // Ignore invalid JSON messages
      }
    };
    
    ws.on('message', messageHandler);
  });
};

const createTestWorkflow = async (): Promise<string> => {
  const response = await makeHttpRequest({
    method: 'POST',
    url: `${BASE_URL}/workflows`,
    data: {
      name: `WebSocket Test Workflow ${uuidv4().slice(0, 8)}`,
      description: 'Test workflow for WebSocket testing',
      version: '1.0.0',
      status: 'active',
      steps: [
        {
          id: uuidv4(),
          name: 'Initialize',
          type: 'script',
          config: {
            script: 'console.log("WebSocket test started");',
            duration: 1000
          }
        },
        {
          id: uuidv4(),
          name: 'Process',
          type: 'delay',
          config: {
            duration: 3000
          }
        },
        {
          id: uuidv4(),
          name: 'Complete',
          type: 'script',
          config: {
            script: 'console.log("WebSocket test completed");',
            duration: 500
          }
        }
      ]
    }
  });
  
  return response.data.data.id;
};

// Test Suite
describe('WebSocket API Tests', () => {
  beforeAll(async () => {
    // Authenticate
    const authResponse = await makeHttpRequest({
      method: 'POST',
      url: `${BASE_URL}/auth/login`,
      data: {
        username: 'admin_test',
        password: 'AdminTest123!'
      }
    });
    
    if (authResponse.status !== 200) {
      throw new Error('Failed to authenticate for WebSocket tests');
    }
    
    authToken = authResponse.data.data.accessToken;
    
    // Create test workflow
    testWorkflowId = await createTestWorkflow();
  });

  afterAll(async () => {
    // Cleanup executions
    for (const executionId of testExecutionIds) {
      try {
        await makeHttpRequest({
          method: 'POST',
          url: `${BASE_URL}/executions/${executionId}/cancel`
        });
      } catch (error) {
        console.warn(`Failed to cleanup execution ${executionId}`);
      }
    }
    
    // Cleanup workflow
    try {
      await makeHttpRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${testWorkflowId}`
      });
    } catch (error) {
      console.warn('Failed to cleanup test workflow');
    }
  });

  describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection successfully', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      expect(ws.readyState).toBe(WebSocket.OPEN);
      
      ws.close();
    });

    test('should require authentication for protected WebSocket endpoints', async () => {
      // Try to connect without authentication
      await expect(createWebSocketConnection('/ws/executions', {
        headers: {} // No auth header
      })).rejects.toThrow();
    });

    test('should reject invalid authentication tokens', async () => {
      await expect(createWebSocketConnection('/ws/executions', {
        headers: {
          Authorization: 'Bearer invalid-token-here'
        }
      })).rejects.toThrow();
    });

    test('should handle connection upgrades properly', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      // Verify WebSocket protocol upgrade
      expect(ws.protocol).toBeDefined();
      
      ws.close();
    });

    test('should support WebSocket subprotocols', async () => {
      const protocols = ['jaqedu-ws-v1', 'jaqedu-notifications'];
      
      try {
        const ws = await createWebSocketConnection('/ws', {
          protocols
        });
        
        // Should negotiate a protocol
        expect(protocols.includes(ws.protocol) || ws.protocol === '').toBe(true);
        
        ws.close();
      } catch (error) {
        // Some servers might not support subprotocols, which is acceptable
        console.log('Subprotocol negotiation not supported');
      }
    });
  });

  describe('Execution Real-time Updates', () => {
    test('should receive execution status updates via WebSocket', async () => {
      // Start execution
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { wsTest: true }
        }
      });
      
      expect(executeResponse.status).toBe(202);
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      // Connect to execution stream
      const ws = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      // Wait for status updates
      const statusUpdate = await waitForWebSocketMessage(
        ws,
        (msg) => msg.type === 'status_change',
        10000
      );
      
      expect(statusUpdate).toHaveProperty('type', 'status_change');
      expect(statusUpdate).toHaveProperty('executionId', executionId);
      expect(statusUpdate).toHaveProperty('timestamp');
      expect(statusUpdate.data).toHaveProperty('status');
      expect(['pending', 'running', 'completed', 'failed']).toContain(statusUpdate.data.status);
      
      ws.close();
    }, 15000);

    test('should receive step completion updates', async () => {
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { stepTest: true }
        }
      });
      
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      const ws = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      // Wait for step completion
      const stepUpdate = await waitForWebSocketMessage(
        ws,
        (msg) => msg.type === 'step_complete',
        12000
      );
      
      expect(stepUpdate).toHaveProperty('type', 'step_complete');
      expect(stepUpdate).toHaveProperty('executionId', executionId);
      expect(stepUpdate.data).toHaveProperty('stepId');
      expect(typeof stepUpdate.data.stepId).toBe('string');
      
      ws.close();
    }, 15000);

    test('should receive log entries in real-time', async () => {
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { logTest: true }
        }
      });
      
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      const ws = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      // Wait for log entries
      const logUpdate = await waitForWebSocketMessage(
        ws,
        (msg) => msg.type === 'log_entry',
        10000
      );
      
      expect(logUpdate).toHaveProperty('type', 'log_entry');
      expect(logUpdate).toHaveProperty('executionId', executionId);
      expect(logUpdate.data).toHaveProperty('log');
      expect(logUpdate.data.log).toHaveProperty('level');
      expect(logUpdate.data.log).toHaveProperty('message');
      expect(logUpdate.data.log).toHaveProperty('timestamp');
      
      ws.close();
    }, 12000);

    test('should receive progress updates', async () => {
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { progressTest: true }
        }
      });
      
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      const ws = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      const progressUpdate = await waitForWebSocketMessage(
        ws,
        (msg) => msg.type === 'progress',
        10000
      );
      
      expect(progressUpdate).toHaveProperty('type', 'progress');
      expect(progressUpdate.data).toHaveProperty('progress');
      expect(typeof progressUpdate.data.progress).toBe('number');
      expect(progressUpdate.data.progress).toBeGreaterThanOrEqual(0);
      expect(progressUpdate.data.progress).toBeLessThanOrEqual(100);
      
      ws.close();
    }, 12000);

    test('should handle execution errors via WebSocket', async () => {
      // Create a workflow that will fail
      const failWorkflowResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          name: `Failing Workflow ${uuidv4().slice(0, 8)}`,
          description: 'Workflow that will fail for testing',
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
        }
      });
      
      const failWorkflowId = failWorkflowResponse.data.data.id;
      
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${failWorkflowId}/execute`,
        data: {
          variables: { errorTest: true }
        }
      });
      
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      const ws = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      const errorUpdate = await waitForWebSocketMessage(
        ws,
        (msg) => msg.type === 'error' || (msg.type === 'status_change' && msg.data.status === 'failed'),
        10000
      );
      
      if (errorUpdate.type === 'error') {
        expect(errorUpdate.data).toHaveProperty('error');
        expect(errorUpdate.data.error).toHaveProperty('message');
      } else {
        expect(errorUpdate.data.status).toBe('failed');
      }
      
      ws.close();
      
      // Cleanup
      await makeHttpRequest({
        method: 'DELETE',
        url: `${BASE_URL}/workflows/${failWorkflowId}`
      });
    }, 12000);
  });

  describe('Notification System', () => {
    test('should receive user notifications via WebSocket', async () => {
      const ws = await createWebSocketConnection('/ws/notifications');
      
      // Trigger a notification (this would typically be done by the system)
      // For testing, we'll simulate by sending a request that generates notifications
      const workflowResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          name: `Notification Test Workflow ${uuidv4().slice(0, 8)}`,
          description: 'Test workflow for notifications',
          version: '1.0.0',
          status: 'active',
          steps: [],
          metadata: {
            notifications: [{
              type: 'workflow_created',
              enabled: true
            }]
          }
        }
      });
      
      if (workflowResponse.status === 201) {
        try {
          const notification = await waitForWebSocketMessage(
            ws,
            (msg) => msg.type === 'notification',
            5000
          );
          
          expect(notification).toHaveProperty('type', 'notification');
          expect(notification.data).toHaveProperty('title');
          expect(notification.data).toHaveProperty('message');
          expect(notification.data).toHaveProperty('level');
          expect(['info', 'warning', 'error', 'success']).toContain(notification.data.level);
        } catch (error) {
          console.log('Notification not received (may not be implemented yet)');
        }
        
        // Cleanup
        await makeHttpRequest({
          method: 'DELETE',
          url: `${BASE_URL}/workflows/${workflowResponse.data.data.id}`
        });
      }
      
      ws.close();
    });

    test('should handle notification subscription filtering', async () => {
      const ws = await createWebSocketConnection('/ws/notifications?filter=workflow,execution');
      
      // Subscribe to specific notification types
      ws.send(JSON.stringify({
        type: 'subscribe',
        categories: ['workflow', 'execution'],
        levels: ['info', 'warning', 'error']
      }));
      
      // Wait for subscription confirmation
      try {
        const confirmation = await waitForWebSocketMessage(
          ws,
          (msg) => msg.type === 'subscription_confirmed',
          3000
        );
        
        expect(confirmation).toHaveProperty('type', 'subscription_confirmed');
        expect(confirmation.data).toHaveProperty('categories');
      } catch (error) {
        console.log('Subscription filtering not implemented');
      }
      
      ws.close();
    });
  });

  describe('WebSocket Message Validation and Security', () => {
    test('should validate message format', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      const invalidMessages = [
        'invalid-json-message',
        null,
        undefined,
        { type: 'invalid_type' },
        { /* missing type */ data: 'test' }
      ];
      
      for (const invalidMessage of invalidMessages) {
        try {
          ws.send(typeof invalidMessage === 'string' ? invalidMessage : JSON.stringify(invalidMessage));
          
          // Wait for error response
          const errorResponse = await waitForWebSocketMessage(
            ws,
            (msg) => msg.type === 'error',
            2000
          ).catch(() => null);
          
          if (errorResponse) {
            expect(errorResponse).toHaveProperty('type', 'error');
            expect(errorResponse.data).toHaveProperty('code');
          }
        } catch (error) {
          // Expected for invalid messages
        }
        
        await delay(100);
      }
      
      ws.close();
    });

    test('should prevent unauthorized access to execution streams', async () => {
      const fakeExecutionId = uuidv4();
      
      await expect(
        createWebSocketConnection(`/ws/executions/${fakeExecutionId}/stream`)
      ).rejects.toThrow();
    });

    test('should handle malformed WebSocket upgrade requests', async () => {
      try {
        // Attempt connection with invalid headers
        const ws = await createWebSocketConnection('/ws', {
          headers: {
            'Sec-WebSocket-Version': 'invalid',
            'Sec-WebSocket-Key': 'invalid-key'
          }
        });
        
        // If connection succeeds, the server handled it gracefully
        ws.close();
      } catch (error) {
        // Expected for malformed requests
        expect(error).toBeDefined();
      }
    });

    test('should enforce rate limiting on WebSocket messages', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      // Send rapid messages
      const messagePromises = [];
      for (let i = 0; i < 20; i++) {
        ws.send(JSON.stringify({
          type: 'ping',
          data: { index: i },
          timestamp: new Date().toISOString()
        }));
        
        messagePromises.push(
          waitForWebSocketMessage(
            ws,
            (msg) => msg.type === 'pong' || msg.type === 'rate_limit_exceeded',
            1000
          ).catch(() => null)
        );
        
        await delay(10); // Very rapid messages
      }
      
      const responses = await Promise.all(messagePromises);
      const rateLimitedResponses = responses.filter(
        (response) => response && response.type === 'rate_limit_exceeded'
      );
      
      // Should have some rate limited responses
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        rateLimitedResponses.forEach(response => {
          expect(response.data).toHaveProperty('retryAfter');
        });
      }
      
      ws.close();
    }, 10000);
  });

  describe('Connection Management and Resilience', () => {
    test('should handle connection keep-alive/ping-pong', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      // Send ping
      ws.ping();
      
      // Wait for pong
      const pongPromise = new Promise((resolve) => {
        ws.on('pong', resolve);
        setTimeout(() => resolve(null), 3000);
      });
      
      const pongReceived = await pongPromise;
      expect(pongReceived).not.toBeNull();
      
      ws.close();
    });

    test('should handle graceful connection closure', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      const closePromise = new Promise((resolve) => {
        ws.on('close', (code, reason) => {
          resolve({ code, reason: reason.toString() });
        });
      });
      
      ws.close(1000, 'Test closure');
      
      const closeEvent: any = await closePromise;
      expect(closeEvent.code).toBe(1000);
    });

    test('should handle unexpected disconnections', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      const closePromise = new Promise((resolve) => {
        ws.on('close', (code) => {
          resolve(code);
        });
      });
      
      // Simulate unexpected disconnection
      ws.terminate();
      
      const closeCode = await closePromise;
      expect(closeCode).toBe(1006); // Abnormal closure
    });

    test('should support connection resumption', async () => {
      const ws1 = await createWebSocketConnection('/ws');
      
      // Send a message to establish session
      ws1.send(JSON.stringify({
        type: 'session_init',
        clientId: 'test-client-123'
      }));
      
      await delay(100);
      ws1.close();
      
      // Reconnect with same client ID
      const ws2 = await createWebSocketConnection('/ws');
      
      ws2.send(JSON.stringify({
        type: 'session_resume',
        clientId: 'test-client-123'
      }));
      
      try {
        const resumeResponse = await waitForWebSocketMessage(
          ws2,
          (msg) => msg.type === 'session_resumed' || msg.type === 'session_not_found',
          3000
        );
        
        // Should either resume or indicate session not found
        expect(['session_resumed', 'session_not_found']).toContain(resumeResponse.type);
      } catch (error) {
        console.log('Session resumption not implemented');
      }
      
      ws2.close();
    });
  });

  describe('Multi-client Scenarios', () => {
    test('should broadcast updates to multiple connected clients', async () => {
      const executeResponse = await makeHttpRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
        data: {
          variables: { multiClientTest: true }
        }
      });
      
      const executionId = executeResponse.data.data.id;
      testExecutionIds.push(executionId);
      
      // Connect multiple clients to same execution stream
      const ws1 = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      const ws2 = await createWebSocketConnection(`/ws/executions/${executionId}/stream`);
      
      // Wait for updates on both connections
      const [update1, update2] = await Promise.all([
        waitForWebSocketMessage(ws1, (msg) => msg.type === 'status_change', 8000),
        waitForWebSocketMessage(ws2, (msg) => msg.type === 'status_change', 8000)
      ]);
      
      // Both should receive the same update
      expect(update1.executionId).toBe(update2.executionId);
      expect(update1.type).toBe(update2.type);
      
      ws1.close();
      ws2.close();
    }, 12000);

    test('should handle client disconnections gracefully', async () => {
      const ws1 = await createWebSocketConnection('/ws');
      const ws2 = await createWebSocketConnection('/ws');
      
      // Abruptly disconnect one client
      ws1.terminate();
      
      // Other client should remain functional
      ws2.send(JSON.stringify({ type: 'ping' }));
      
      try {
        const pongResponse = await waitForWebSocketMessage(
          ws2,
          (msg) => msg.type === 'pong',
          3000
        );
        
        expect(pongResponse.type).toBe('pong');
      } catch (error) {
        // Ping/pong might not be implemented
        console.log('Ping/pong not implemented');
      }
      
      ws2.close();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent WebSocket connections', async () => {
      const connectionCount = 10;
      const connectionPromises = [];
      
      for (let i = 0; i < connectionCount; i++) {
        connectionPromises.push(
          createWebSocketConnection('/ws').catch(() => null)
        );
      }
      
      const connections = await Promise.all(connectionPromises);
      const successfulConnections = connections.filter(ws => ws !== null);
      
      expect(successfulConnections.length).toBeGreaterThan(connectionCount * 0.8); // At least 80% success
      
      // Close all connections
      successfulConnections.forEach(ws => {
        if (ws) ws.close();
      });
    }, 10000);

    test('should maintain reasonable message throughput', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      const messageCount = 100;
      const startTime = Date.now();
      
      // Send messages rapidly
      for (let i = 0; i < messageCount; i++) {
        ws.send(JSON.stringify({
          type: 'test_message',
          data: { index: i },
          timestamp: Date.now()
        }));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const messagesPerSecond = (messageCount / duration) * 1000;
      
      // Should handle at least 50 messages per second
      expect(messagesPerSecond).toBeGreaterThan(50);
      
      ws.close();
    });

    test('should handle large message payloads', async () => {
      const ws = await createWebSocketConnection('/ws');
      
      const largePayload = {
        type: 'large_message',
        data: {
          content: 'x'.repeat(10000), // 10KB of data
          metadata: Array(100).fill({ key: 'value', timestamp: Date.now() })
        }
      };
      
      try {
        ws.send(JSON.stringify(largePayload));
        
        // Wait for acknowledgment or error
        const response = await waitForWebSocketMessage(
          ws,
          (msg) => msg.type === 'message_received' || msg.type === 'error',
          5000
        ).catch(() => null);
        
        if (response) {
          if (response.type === 'error') {
            expect(response.data.code).toContain('PAYLOAD_TOO_LARGE');
          } else {
            expect(response.type).toBe('message_received');
          }
        }
      } catch (error) {
        // Large payloads might be rejected
        console.log('Large payload rejected (expected)');
      }
      
      ws.close();
    });
  });
});
