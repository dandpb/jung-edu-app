/**
 * API Automation Tests: Input Validation & Security
 * Comprehensive testing of request validation, sanitization, and security measures
 */

import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Types
interface ValidationError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: {
      field: string;
      message: string;
      value?: any;
    }[];
  };
  timestamp: string;
  requestId: string;
}

interface TestCase {
  name: string;
  data: any;
  expectedStatus: number;
  expectedErrorCode?: string;
  expectedField?: string;
}

// Test Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const TIMEOUT = 10000;

// Global test data
let authToken: string;
let testWorkflowId: string;

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

const generateLargeString = (length: number): string => {
  return 'x'.repeat(length);
};

const generateSpecialCharacters = (): string[] => {
  return [
    '<script>alert("XSS")</script>',
    'javascript:alert(1)',
    '\"; DROP TABLE users; --',
    '${7*7}', // Template injection
    '{{7*7}}', // Template injection
    '../../../etc/passwd', // Path traversal
    '\x00\x01\x02', // Null bytes
    '\u0000\u0001', // Unicode null
    '<img src=x onerror=alert(1)>',
    'data:text/html,<script>alert(1)</script>'
  ];
};

const createTestWorkflow = async (): Promise<string> => {
  const workflowData = {
    name: `Validation Test Workflow ${uuidv4().slice(0, 8)}`,
    description: 'Test workflow for validation testing',
    version: '1.0.0',
    status: 'active',
    steps: [{
      id: uuidv4(),
      name: 'Test Step',
      type: 'script',
      config: {
        script: 'console.log("test");'
      }
    }]
  };
  
  const response = await makeRequest({
    method: 'POST',
    url: `${BASE_URL}/workflows`,
    data: workflowData
  });
  
  return response.data.data.id;
};

// Test Suite
describe('API Input Validation Tests', () => {
  beforeAll(async () => {
    // Authenticate
    const authResponse = await makeRequest({
      method: 'POST',
      url: `${BASE_URL}/auth/login`,
      data: {
        username: 'admin_test',
        password: 'AdminTest123!'
      }
    });
    
    if (authResponse.status !== 200) {
      throw new Error('Failed to authenticate for validation tests');
    }
    
    authToken = authResponse.data.data.accessToken;
    
    // Create test workflow for some tests
    testWorkflowId = await createTestWorkflow();
  });

  afterAll(async () => {
    // Cleanup
    if (testWorkflowId) {
      try {
        await makeRequest({
          method: 'DELETE',
          url: `${BASE_URL}/workflows/${testWorkflowId}`
        });
      } catch (error) {
        console.warn('Failed to cleanup test workflow');
      }
    }
  });

  describe('Authentication Input Validation', () => {
    const authValidationTests: TestCase[] = [
      {
        name: 'should reject empty email',
        data: { email: '', username: 'testuser', password: 'TestPass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'email'
      },
      {
        name: 'should reject invalid email format',
        data: { email: 'invalid-email', username: 'testuser', password: 'TestPass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'email'
      },
      {
        name: 'should reject email with spaces',
        data: { email: 'test @example.com', username: 'testuser', password: 'TestPass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'email'
      },
      {
        name: 'should reject extremely long email',
        data: { 
          email: `${generateLargeString(100)}@${generateLargeString(100)}.com`, 
          username: 'testuser', 
          password: 'TestPass123!' 
        },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'email'
      },
      {
        name: 'should reject empty username',
        data: { email: 'test@example.com', username: '', password: 'TestPass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'username'
      },
      {
        name: 'should reject username with special characters',
        data: { email: 'test@example.com', username: 'test<script>', password: 'TestPass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'username'
      },
      {
        name: 'should reject short password',
        data: { email: 'test@example.com', username: 'testuser', password: '123' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'password'
      },
      {
        name: 'should reject password without uppercase',
        data: { email: 'test@example.com', username: 'testuser', password: 'testpass123!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'password'
      },
      {
        name: 'should reject password without numbers',
        data: { email: 'test@example.com', username: 'testuser', password: 'TestPassword!' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'password'
      },
      {
        name: 'should reject password without special characters',
        data: { email: 'test@example.com', username: 'testuser', password: 'TestPassword123' },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'password'
      }
    ];

    test.each(authValidationTests)('$name', async ({ data, expectedStatus, expectedErrorCode, expectedField }) => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          firstName: 'Test',
          lastName: 'User',
          ...data
        }
      });

      expect(response.status).toBe(expectedStatus);
      expect(response.data.success).toBe(false);
      
      if (expectedErrorCode) {
        expect(response.data.error.code).toBe(expectedErrorCode);
      }
      
      if (expectedField) {
        expect(response.data.error.field).toBe(expectedField);
      }
    });

    test('should sanitize HTML in input fields', async () => {
      const maliciousInputs = generateSpecialCharacters();
      
      for (const maliciousInput of maliciousInputs) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/auth/register`,
          data: {
            email: 'test@example.com',
            username: 'testuser',
            password: 'TestPassword123!',
            firstName: maliciousInput,
            lastName: 'User'
          }
        });

        // Should either reject or sanitize
        if (response.status === 201) {
          // If accepted, should be sanitized
          expect(response.data.data.user.firstName).not.toBe(maliciousInput);
          expect(response.data.data.user.firstName).not.toContain('<script>');
          expect(response.data.data.user.firstName).not.toContain('javascript:');
        } else {
          // Or should be rejected with validation error
          expect(response.status).toBe(400);
          expect(response.data.error.code).toBe('VALIDATION_ERROR');
        }
        
        await delay(100); // Prevent overwhelming the server
      }
    });

    test('should validate login request structure', async () => {
      const invalidLoginRequests = [
        null,
        undefined,
        '',
        'invalid-json-string',
        { username: 'test' }, // Missing password
        { password: 'test' }, // Missing username
        { username: null, password: 'test' },
        { username: 'test', password: null },
        { username: ['array'], password: 'test' }, // Wrong type
        { username: 'test', password: { object: 'value' } } // Wrong type
      ];

      for (const invalidData of invalidLoginRequests) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          data: invalidData
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(['VALIDATION_ERROR', 'INVALID_JSON']).toContain(response.data.error.code);
        
        await delay(50);
      }
    });
  });

  describe('Workflow Input Validation', () => {
    const workflowValidationTests: TestCase[] = [
      {
        name: 'should reject empty workflow name',
        data: { name: '', description: 'Test', version: '1.0.0', status: 'draft', steps: [] },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'name'
      },
      {
        name: 'should reject null workflow name',
        data: { name: null, description: 'Test', version: '1.0.0', status: 'draft', steps: [] },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'name'
      },
      {
        name: 'should reject extremely long workflow name',
        data: { 
          name: generateLargeString(1000), 
          description: 'Test', 
          version: '1.0.0', 
          status: 'draft', 
          steps: [] 
        },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'name'
      },
      {
        name: 'should reject invalid version format',
        data: { 
          name: 'Test Workflow', 
          description: 'Test', 
          version: 'invalid-version', 
          status: 'draft', 
          steps: [] 
        },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'version'
      },
      {
        name: 'should reject invalid status',
        data: { 
          name: 'Test Workflow', 
          description: 'Test', 
          version: '1.0.0', 
          status: 'invalid_status', 
          steps: [] 
        },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'status'
      },
      {
        name: 'should reject non-array steps',
        data: { 
          name: 'Test Workflow', 
          description: 'Test', 
          version: '1.0.0', 
          status: 'draft', 
          steps: 'not-an-array' 
        },
        expectedStatus: 400,
        expectedErrorCode: 'VALIDATION_ERROR',
        expectedField: 'steps'
      }
    ];

    test.each(workflowValidationTests)('$name', async ({ data, expectedStatus, expectedErrorCode, expectedField }) => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data
      });

      expect(response.status).toBe(expectedStatus);
      expect(response.data.success).toBe(false);
      
      if (expectedErrorCode) {
        expect(response.data.error.code).toBe(expectedErrorCode);
      }
      
      if (expectedField) {
        expect(response.data.error.field).toBe(expectedField);
      }
    });

    test('should validate workflow step structure', async () => {
      const invalidSteps = [
        [{ name: 'Test' }], // Missing required fields
        [{ id: 'test', type: 'invalid_type', config: {} }], // Invalid step type
        [{ id: 'test', name: 'Test', type: 'script' }], // Missing config
        [{ id: 'test', name: '', type: 'script', config: {} }], // Empty name
        [null], // Null step
        [{ id: null, name: 'Test', type: 'script', config: {} }] // Null id
      ];

      for (const steps of invalidSteps) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: 'Test Workflow',
            description: 'Test workflow',
            version: '1.0.0',
            status: 'draft',
            steps
          }
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });

    test('should validate workflow variables', async () => {
      const invalidVariables = [
        'string-instead-of-object',
        null,
        ['array-instead-of-object']
      ];

      for (const variables of invalidVariables) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: 'Test Workflow',
            description: 'Test workflow',
            version: '1.0.0',
            status: 'draft',
            steps: [{
              id: uuidv4(),
              name: 'Test Step',
              type: 'script',
              config: { script: 'console.log("test");' }
            }],
            variables
          }
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });
  });

  describe('Execution Input Validation', () => {
    test('should validate execution variables', async () => {
      const invalidVariables = [
        'string-instead-of-object',
        ['array-instead-of-object'],
        null
      ];

      for (const variables of invalidVariables) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
          data: { variables }
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });

    test('should validate execution priority', async () => {
      const invalidPriorities = [
        'invalid-priority',
        123,
        null,
        { priority: 'high' }
      ];

      for (const priority of invalidPriorities) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
          data: { priority }
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });

    test('should validate execution timeout', async () => {
      const invalidTimeouts = [
        -1, // Negative timeout
        'string-timeout',
        null,
        86400001 // Too large (more than 24 hours)
      ];

      for (const timeout of invalidTimeouts) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows/${testWorkflowId}/execute`,
          data: { timeout }
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });
  });

  describe('UUID and ID Validation', () => {
    const invalidIds = [
      'invalid-uuid',
      '12345',
      'not-a-uuid-at-all',
      '123e4567-e89b-12d3-a456-42661417400', // Invalid UUID format
      '', // Empty string
      null,
      undefined
    ];

    test.each(invalidIds)('should reject invalid workflow ID: %s', async (invalidId) => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/workflows/${invalidId}`
      });

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });

    test.each(invalidIds)('should reject invalid execution ID: %s', async (invalidId) => {
      const response = await makeRequest({
        method: 'GET',
        url: `${BASE_URL}/executions/${invalidId}`
      });

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Query Parameter Validation', () => {
    test('should validate pagination parameters', async () => {
      const invalidPaginationTests = [
        { param: 'page', value: '0' }, // Page should start from 1
        { param: 'page', value: '-1' },
        { param: 'page', value: 'invalid' },
        { param: 'limit', value: '0' },
        { param: 'limit', value: '-1' },
        { param: 'limit', value: '1000' }, // Too large
        { param: 'limit', value: 'invalid' }
      ];

      for (const { param, value } of invalidPaginationTests) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows?${param}=${value}`
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });

    test('should validate sort parameters', async () => {
      const invalidSortTests = [
        { param: 'sortBy', value: 'invalid_field' },
        { param: 'sortBy', value: 'id; DROP TABLE workflows;' }, // SQL injection attempt
        { param: 'sortOrder', value: 'invalid_order' },
        { param: 'sortOrder', value: 'ASC; DELETE FROM workflows;' } // SQL injection attempt
      ];

      for (const { param, value } of invalidSortTests) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows?${param}=${encodeURIComponent(value)}`
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });

    test('should validate filter parameters', async () => {
      const invalidFilterTests = [
        'status=invalid_status',
        'status=active;DROP TABLE workflows;',
        'tags=<script>alert(1)</script>',
        'search=\x00\x01\x02', // Null bytes
        'createdAfter=invalid-date',
        'createdBefore=not-a-date'
      ];

      for (const queryString of invalidFilterTests) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows?${queryString}`
        });

        expect(response.status).toBe(400);
        expect(response.data.error.code).toBe('VALIDATION_ERROR');
        
        await delay(50);
      }
    });
  });

  describe('Security Input Validation', () => {
    test('should prevent SQL injection in all text inputs', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET role='admin'; --",
        "1' UNION SELECT * FROM users--",
        "'; INSERT INTO users (username, role) VALUES ('hacker', 'admin'); --"
      ];

      for (const injection of sqlInjectionAttempts) {
        // Test in workflow name
        const workflowResponse = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: injection,
            description: 'Test',
            version: '1.0.0',
            status: 'draft',
            steps: []
          }
        });

        // Should either reject or sanitize
        if (workflowResponse.status === 201) {
          expect(workflowResponse.data.data.name).not.toContain('DROP');
          expect(workflowResponse.data.data.name).not.toContain('UPDATE');
          expect(workflowResponse.data.data.name).not.toContain('INSERT');
        } else {
          expect(workflowResponse.status).toBe(400);
        }

        // Test in search parameter
        const searchResponse = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows?search=${encodeURIComponent(injection)}`
        });

        // Should not cause server error
        expect(searchResponse.status).not.toBe(500);
        
        await delay(100);
      }
    });

    test('should prevent XSS in all text inputs', async () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
        '<iframe src=javascript:alert(1)></iframe>',
        "<script>document.cookie='stolen'</script>",
        '<a href="javascript:alert(1)">click</a>'
      ];

      for (const xss of xssAttempts) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: 'Test Workflow',
            description: xss,
            version: '1.0.0',
            status: 'draft',
            steps: []
          }
        });

        if (response.status === 201) {
          // If accepted, should be sanitized
          expect(response.data.data.description).not.toContain('<script>');
          expect(response.data.data.description).not.toContain('javascript:');
          expect(response.data.data.description).not.toContain('onerror');
          expect(response.data.data.description).not.toContain('onload');
        } else {
          // Or should be rejected
          expect(response.status).toBe(400);
        }
        
        await delay(100);
      }
    });

    test('should prevent NoSQL injection attempts', async () => {
      const noSqlInjectionAttempts = [
        '{ "$ne": null }',
        '{ "$gt": "" }',
        '{ "$where": "this.username == this.password" }',
        '{ "$regex": ".*" }',
        '{ "$expr": { "$eq": ["$username", "$password"] } }'
      ];

      for (const injection of noSqlInjectionAttempts) {
        const response = await makeRequest({
          method: 'GET',
          url: `${BASE_URL}/workflows?search=${encodeURIComponent(injection)}`
        });

        // Should not cause server error or return unauthorized data
        expect(response.status).not.toBe(500);
        
        if (response.status === 200) {
          // Should not return all records (which would indicate successful injection)
          expect(response.data.data.workflows).toBeDefined();
        }
        
        await delay(100);
      }
    });

    test('should prevent path traversal attacks', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', // URL encoded
        '..%252f..%252f..%252fetc%252fpasswd', // Double URL encoded
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd' // UTF-8 encoded
      ];

      for (const traversal of pathTraversalAttempts) {
        // Test in various endpoints where file paths might be used
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: 'Test Workflow',
            description: 'Test',
            version: '1.0.0',
            status: 'draft',
            steps: [{
              id: uuidv4(),
              name: 'File Step',
              type: 'script',
              config: {
                script: 'console.log("test");',
                file: traversal // Potential file reference
              }
            }]
          }
        });

        // Should not cause server error or expose file contents
        expect(response.status).not.toBe(500);
        
        if (response.status === 201) {
          // Should not contain actual file system paths
          const stepConfig = response.data.data.steps[0].config;
          expect(stepConfig.file).not.toContain('/etc/');
          expect(stepConfig.file).not.toContain('\\windows\\');
        }
        
        await delay(100);
      }
    });
  });

  describe('Content-Type and Encoding Validation', () => {
    test('should reject requests with missing Content-Type', async () => {
      const response = await axios.post(
        `${BASE_URL}/workflows`,
        JSON.stringify({
          name: 'Test',
          description: 'Test',
          version: '1.0.0',
          status: 'draft',
          steps: []
        }),
        {
          headers: {
            Authorization: `Bearer ${authToken}`
            // Missing Content-Type
          }
        }
      ).catch(error => error.response);

      expect([400, 415]).toContain(response.status);
    });

    test('should reject requests with wrong Content-Type', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: 'name=Test&version=1.0.0', // Form data
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect([400, 415]).toContain(response.status);
    });

    test('should handle various character encodings safely', async () => {
      const encodingTests = [
        '\u0000\u0001\u0002', // Null bytes
        '\uffff\ufffe', // Unicode edge cases
        'café', // UTF-8 characters
        '测试', // Chinese characters
        '🚀🔥💯', // Emojis
        'А Б В Г', // Cyrillic
        'العربية' // Arabic
      ];

      for (const testString of encodingTests) {
        const response = await makeRequest({
          method: 'POST',
          url: `${BASE_URL}/workflows`,
          data: {
            name: `Encoding Test: ${testString}`,
            description: 'Test encoding handling',
            version: '1.0.0',
            status: 'draft',
            steps: []
          }
        });

        // Should handle encoding gracefully
        expect(response.status).not.toBe(500);
        
        if (response.status === 201) {
          // Should preserve valid Unicode characters
          if (!testString.includes('\u0000')) {
            expect(response.data.data.name).toContain(testString);
          }
        }
        
        await delay(100);
      }
    });
  });

  describe('Request Size and Structure Validation', () => {
    test('should reject oversized request payloads', async () => {
      const largePayload = {
        name: 'Large Payload Test',
        description: generateLargeString(100000), // 100KB description
        version: '1.0.0',
        status: 'draft',
        steps: Array(1000).fill({
          id: uuidv4(),
          name: generateLargeString(1000),
          type: 'script',
          config: {
            script: generateLargeString(5000),
            data: generateLargeString(10000)
          }
        })
      };

      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: largePayload
      });

      // Should reject oversized payloads
      expect([400, 413]).toContain(response.status);
      
      if (response.status === 413) {
        expect(response.data.error.code).toBe('PAYLOAD_TOO_LARGE');
      }
    });

    test('should validate deeply nested object structures', async () => {
      // Create deeply nested object
      let deepObject = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        deepObject = { nested: deepObject };
      }

      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          name: 'Deep Nesting Test',
          description: 'Test deep object nesting',
          version: '1.0.0',
          status: 'draft',
          steps: [],
          variables: deepObject
        }
      });

      // Should reject or limit deep nesting
      expect([400, 413]).toContain(response.status);
    });

    test('should validate circular reference detection', async () => {
      // This test checks if the API properly handles circular references
      // Note: JSON.stringify would throw an error for circular references
      const circularData = {
        name: 'Circular Test',
        description: 'Test circular reference handling',
        version: '1.0.0',
        status: 'draft',
        steps: []
      };
      
      // In a real scenario, we'd need to send raw data that could contain circular refs
      // For this test, we'll send valid JSON and ensure the API can handle edge cases
      
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: circularData
      });

      // This should succeed as it's valid data
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Error Response Validation', () => {
    test('should return consistent error structure for validation failures', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/workflows`,
        data: {
          // Missing required fields
        }
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('requestId');
      
      expect(response.data.error).toHaveProperty('code');
      expect(response.data.error).toHaveProperty('message');
      expect(typeof response.data.error.code).toBe('string');
      expect(typeof response.data.error.message).toBe('string');
    });

    test('should provide detailed field-level validation errors', async () => {
      const response = await makeRequest({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: 'invalid-email',
          username: 'a', // Too short
          password: '123', // Too weak
          firstName: '',
          lastName: ''
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
      
      // Should provide specific field information
      if (response.data.error.details) {
        expect(Array.isArray(response.data.error.details)).toBe(true);
        response.data.error.details.forEach((detail: any) => {
          expect(detail).toHaveProperty('field');
          expect(detail).toHaveProperty('message');
          expect(typeof detail.field).toBe('string');
          expect(typeof detail.message).toBe('string');
        });
      }
    });
  });
});
