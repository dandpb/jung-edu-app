/**
 * Comprehensive ValidationSchemas Tests
 * Testing all validation schemas, custom validators, and edge cases
 * @priority HIGH - Input validation prevents security vulnerabilities and data corruption
 */

import Joi from 'joi';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  executeWorkflowSchema,
  workflowQuerySchema,
  executionQuerySchema,
  workflowIdSchema,
  executionIdSchema,
  workflowExecutionParamsSchema,
  validateArrayParam,
  validateDateParam,
  validateSortOrder,
  validateSchema
} from '../../../src/api/workflow/ValidationSchemas';
import { WorkflowStatus, ExecutionStatus, StepType, Priority, BackoffStrategy, ConditionType, NotificationType, NotificationEvent } from '../../../src/api/workflow/types';
import express from 'express';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

describe('ValidationSchemas Tests', () => {
  describe('createWorkflowSchema', () => {
    const validWorkflowData = {
      name: 'Test Workflow',
      description: 'A test workflow for validation',
      steps: [{
        name: 'Test Step',
        type: StepType.SCRIPT,
        config: {
          script: 'test.js',
          timeout: 5000
        },
        dependencies: [],
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: BackoffStrategy.EXPONENTIAL,
          backoffMultiplier: 2.0,
          maxBackoffTime: 60000
        },
        conditions: [{
          type: ConditionType.EXPRESSION,
          expression: 'result.success === true',
          description: 'Check if operation succeeded'
        }]
      }],
      variables: {
        environment: 'test',
        timeout: 5000
      },
      metadata: {
        tags: ['test', 'automation'],
        owner: 'test-team',
        priority: Priority.NORMAL,
        timeout: 3600000,
        schedule: {
          cron: '0 0 * * *',
          interval: 86400000,
          startDate: new Date(),
          timezone: 'UTC'
        },
        notifications: [{
          type: NotificationType.EMAIL,
          recipients: ['admin@example.com', 'dev@example.com'],
          events: [NotificationEvent.COMPLETED, NotificationEvent.FAILED],
          template: 'workflow-notification'
        }]
      }
    };

    test('should validate complete valid workflow', () => {
      const { error, value } = createWorkflowSchema.validate(validWorkflowData);
      expect(error).toBeUndefined();
      expect(value).toMatchObject({
        name: 'Test Workflow',
        description: 'A test workflow for validation',
        steps: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Step',
            type: StepType.SCRIPT
          })
        ])
      });
    });

    test('should require workflow name', () => {
      const invalidData = { ...validWorkflowData };
      delete (invalidData as any).name;

      const { error } = createWorkflowSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });

    test('should validate workflow name length constraints', () => {
      // Empty name
      const emptyName = { ...validWorkflowData, name: '' };
      const emptyError = createWorkflowSchema.validate(emptyName).error;
      expect(emptyError).toBeDefined();

      // Too long name
      const longName = { ...validWorkflowData, name: 'a'.repeat(256) };
      const longError = createWorkflowSchema.validate(longName).error;
      expect(longError).toBeDefined();

      // Valid length
      const validName = { ...validWorkflowData, name: 'a'.repeat(100) };
      const validError = createWorkflowSchema.validate(validName).error;
      expect(validError).toBeUndefined();
    });

    test('should validate description length', () => {
      const longDescription = { 
        ...validWorkflowData, 
        description: 'a'.repeat(1001) 
      };
      
      const { error } = createWorkflowSchema.validate(longDescription);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('1000');
    });

    test('should require at least one step', () => {
      const noSteps = { ...validWorkflowData, steps: [] };
      
      const { error } = createWorkflowSchema.validate(noSteps);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1');
    });

    test('should validate step structure', () => {
      // Missing required step fields
      const invalidStep = {
        ...validWorkflowData,
        steps: [{
          // Missing name, type, and config
        }]
      };

      const { error } = createWorkflowSchema.validate(invalidStep);
      expect(error).toBeDefined();
      expect(error?.details).toHaveLength(3); // name, type, config required
    });

    test('should validate step types', () => {
      const invalidStepType = {
        ...validWorkflowData,
        steps: [{
          name: 'Invalid Step',
          type: 'INVALID_TYPE' as any,
          config: {}
        }]
      };

      const { error } = createWorkflowSchema.validate(invalidStepType);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    test('should validate step timeout constraints', () => {
      // Negative timeout
      const negativeTimeout = {
        ...validWorkflowData,
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: {},
          timeout: -1000
        }]
      };

      const { error: negError } = createWorkflowSchema.validate(negativeTimeout);
      expect(negError).toBeDefined();

      // Timeout too large (more than 24 hours)
      const largeTimeout = {
        ...validWorkflowData,
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: {},
          timeout: 86400001 // > 24 hours
        }]
      };

      const { error: largeError } = createWorkflowSchema.validate(largeTimeout);
      expect(largeError).toBeDefined();
    });

    test('should validate retry policy', () => {
      // Invalid max attempts
      const invalidRetryPolicy = {
        ...validWorkflowData,
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: {},
          retryPolicy: {
            maxAttempts: 11, // > 10
            backoffStrategy: BackoffStrategy.EXPONENTIAL
          }
        }]
      };

      const { error } = createWorkflowSchema.validate(invalidRetryPolicy);
      expect(error).toBeDefined();
    });

    test('should validate backoff strategy', () => {
      const invalidBackoffStrategy = {
        ...validWorkflowData,
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: {},
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: 'INVALID_STRATEGY' as any
          }
        }]
      };

      const { error } = createWorkflowSchema.validate(invalidBackoffStrategy);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    test('should validate condition types', () => {
      const invalidCondition = {
        ...validWorkflowData,
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: {},
          conditions: [{
            type: 'INVALID_TYPE' as any,
            expression: 'true'
          }]
        }]
      };

      const { error } = createWorkflowSchema.validate(invalidCondition);
      expect(error).toBeDefined();
    });

    test('should validate metadata tags', () => {
      // Too many tags
      const tooManyTags = {
        ...validWorkflowData,
        metadata: {
          tags: Array.from({ length: 21 }, (_, i) => `tag${i}`)
        }
      };

      const { error: tooManyError } = createWorkflowSchema.validate(tooManyTags);
      expect(tooManyError).toBeDefined();

      // Tag too long
      const longTag = {
        ...validWorkflowData,
        metadata: {
          tags: ['a'.repeat(51)]
        }
      };

      const { error: longError } = createWorkflowSchema.validate(longTag);
      expect(longError).toBeDefined();
    });

    test('should validate schedule configuration', () => {
      // Invalid cron expression
      const invalidCron = {
        ...validWorkflowData,
        metadata: {
          schedule: {
            cron: 'invalid cron expression'
          }
        }
      };

      const { error: cronError } = createWorkflowSchema.validate(invalidCron);
      expect(cronError).toBeDefined();

      // End date before start date
      const invalidDateRange = {
        ...validWorkflowData,
        metadata: {
          schedule: {
            startDate: new Date('2024-12-31'),
            endDate: new Date('2024-01-01')
          }
        }
      };

      const { error: dateError } = createWorkflowSchema.validate(invalidDateRange);
      expect(dateError).toBeDefined();
    });

    test('should validate notification configuration', () => {
      // Invalid email format
      const invalidEmail = {
        ...validWorkflowData,
        metadata: {
          notifications: [{
            type: NotificationType.EMAIL,
            recipients: ['invalid-email'],
            events: [NotificationEvent.COMPLETED]
          }]
        }
      };

      const { error: emailError } = createWorkflowSchema.validate(invalidEmail);
      expect(emailError).toBeDefined();

      // No recipients
      const noRecipients = {
        ...validWorkflowData,
        metadata: {
          notifications: [{
            type: NotificationType.EMAIL,
            recipients: [],
            events: [NotificationEvent.COMPLETED]
          }]
        }
      };

      const { error: recipientsError } = createWorkflowSchema.validate(noRecipients);
      expect(recipientsError).toBeDefined();

      // No events
      const noEvents = {
        ...validWorkflowData,
        metadata: {
          notifications: [{
            type: NotificationType.EMAIL,
            recipients: ['admin@example.com'],
            events: []
          }]
        }
      };

      const { error: eventsError } = createWorkflowSchema.validate(noEvents);
      expect(eventsError).toBeDefined();
    });

    test('should validate priority values', () => {
      const invalidPriority = {
        ...validWorkflowData,
        metadata: {
          priority: 'INVALID_PRIORITY' as any
        }
      };

      const { error } = createWorkflowSchema.validate(invalidPriority);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });
  });

  describe('updateWorkflowSchema', () => {
    test('should validate partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
        metadata: {
          tags: ['updated']
        }
      };

      const { error } = updateWorkflowSchema.validate(partialUpdate);
      expect(error).toBeUndefined();
    });

    test('should require at least one field to update', () => {
      const emptyUpdate = {};

      const { error } = updateWorkflowSchema.validate(emptyUpdate);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1');
    });

    test('should allow empty description', () => {
      const emptyDescription = { description: '' };

      const { error } = updateWorkflowSchema.validate(emptyDescription);
      expect(error).toBeUndefined();
    });

    test('should validate version format', () => {
      const validVersion = { version: '1.2.3' };
      const { error: validError } = updateWorkflowSchema.validate(validVersion);
      expect(validError).toBeUndefined();

      const invalidVersion = { version: '1.2' };
      const { error: invalidError } = updateWorkflowSchema.validate(invalidVersion);
      expect(invalidError).toBeDefined();
    });
  });

  describe('executeWorkflowSchema', () => {
    const validExecutionData = {
      variables: {
        userId: '123',
        environment: 'production'
      },
      priority: Priority.HIGH,
      timeout: 1800000, // 30 minutes
      notifications: [{
        type: NotificationType.EMAIL,
        recipients: ['admin@example.com'],
        events: [NotificationEvent.COMPLETED]
      }]
    };

    test('should validate execution request', () => {
      const { error } = executeWorkflowSchema.validate(validExecutionData);
      expect(error).toBeUndefined();
    });

    test('should allow empty execution request', () => {
      const { error } = executeWorkflowSchema.validate({});
      expect(error).toBeUndefined();
    });

    test('should validate timeout constraints', () => {
      const invalidTimeout = { timeout: 86400001 }; // > 24 hours

      const { error } = executeWorkflowSchema.validate(invalidTimeout);
      expect(error).toBeDefined();
    });

    test('should validate notification configuration', () => {
      const invalidNotification = {
        notifications: [{
          type: 'INVALID_TYPE' as any,
          recipients: ['admin@example.com'],
          events: [NotificationEvent.COMPLETED]
        }]
      };

      const { error } = executeWorkflowSchema.validate(invalidNotification);
      expect(error).toBeDefined();
    });
  });

  describe('Query Parameter Schemas', () => {
    describe('workflowQuerySchema', () => {
      test('should validate valid query parameters', () => {
        const validQuery = {
          page: 2,
          limit: 10,
          status: [WorkflowStatus.ACTIVE, WorkflowStatus.DRAFT],
          owner: 'test-owner',
          tags: ['test', 'automation'],
          search: 'onboarding',
          sortBy: 'name',
          sortOrder: 'asc',
          createdAfter: new Date('2024-01-01'),
          createdBefore: new Date('2024-12-31')
        };

        const { error, value } = workflowQuerySchema.validate(validQuery);
        expect(error).toBeUndefined();
        expect(value.page).toBe(2);
        expect(value.limit).toBe(10);
      });

      test('should apply default values', () => {
        const { error, value } = workflowQuerySchema.validate({});
        expect(error).toBeUndefined();
        expect(value.page).toBe(1);
        expect(value.limit).toBe(20);
        expect(value.sortBy).toBe('createdAt');
        expect(value.sortOrder).toBe('desc');
      });

      test('should validate page constraints', () => {
        const invalidPage = { page: 0 };
        const { error: pageError } = workflowQuerySchema.validate(invalidPage);
        expect(pageError).toBeDefined();

        const tooLargePage = { page: 1001 };
        const { error: largeError } = workflowQuerySchema.validate(tooLargePage);
        expect(largeError).toBeDefined();
      });

      test('should validate limit constraints', () => {
        const zeroLimit = { limit: 0 };
        const { error: zeroError } = workflowQuerySchema.validate(zeroLimit);
        expect(zeroError).toBeDefined();

        const tooLargeLimit = { limit: 101 };
        const { error: largeError } = workflowQuerySchema.validate(tooLargeLimit);
        expect(largeError).toBeDefined();
      });

      test('should validate status values', () => {
        const invalidStatus = { status: ['INVALID_STATUS'] };
        const { error } = workflowQuerySchema.validate(invalidStatus);
        expect(error).toBeDefined();
      });

      test('should validate sortBy values', () => {
        const invalidSortBy = { sortBy: 'invalidField' };
        const { error } = workflowQuerySchema.validate(invalidSortBy);
        expect(error).toBeDefined();
      });

      test('should validate sortOrder values', () => {
        const invalidSortOrder = { sortOrder: 'invalid' };
        const { error } = workflowQuerySchema.validate(invalidSortOrder);
        expect(error).toBeDefined();
      });
    });

    describe('executionQuerySchema', () => {
      test('should validate execution query parameters', () => {
        const validQuery = {
          page: 1,
          limit: 20,
          status: [ExecutionStatus.RUNNING, ExecutionStatus.COMPLETED],
          workflowId: uuidv4(),
          startedAfter: new Date('2024-01-01'),
          startedBefore: new Date('2024-12-31'),
          sortBy: 'startedAt',
          sortOrder: 'desc'
        };

        const { error } = executionQuerySchema.validate(validQuery);
        expect(error).toBeUndefined();
      });

      test('should validate workflowId UUID format', () => {
        const invalidUuid = { workflowId: 'not-a-uuid' };
        const { error } = executionQuerySchema.validate(invalidUuid);
        expect(error).toBeDefined();

        const validUuid = { workflowId: uuidv4() };
        const { error: validError } = executionQuerySchema.validate(validUuid);
        expect(validError).toBeUndefined();
      });

      test('should validate execution status values', () => {
        const invalidStatus = { status: ['INVALID_STATUS'] };
        const { error } = executionQuerySchema.validate(invalidStatus);
        expect(error).toBeDefined();
      });
    });
  });

  describe('Path Parameter Schemas', () => {
    test('workflowIdSchema should validate UUID', () => {
      const validId = { id: uuidv4() };
      const { error: validError } = workflowIdSchema.validate(validId);
      expect(validError).toBeUndefined();

      const invalidId = { id: 'not-a-uuid' };
      const { error: invalidError } = workflowIdSchema.validate(invalidId);
      expect(invalidError).toBeDefined();
    });

    test('executionIdSchema should validate UUID', () => {
      const validId = { executionId: uuidv4() };
      const { error: validError } = executionIdSchema.validate(validId);
      expect(validError).toBeUndefined();

      const invalidId = { executionId: 'not-a-uuid' };
      const { error: invalidError } = executionIdSchema.validate(invalidId);
      expect(invalidError).toBeDefined();
    });

    test('workflowExecutionParamsSchema should validate both IDs', () => {
      const validParams = {
        id: uuidv4(),
        executionId: uuidv4()
      };
      const { error: validError } = workflowExecutionParamsSchema.validate(validParams);
      expect(validError).toBeUndefined();

      const invalidParams = {
        id: 'not-a-uuid',
        executionId: 'also-not-a-uuid'
      };
      const { error: invalidError } = workflowExecutionParamsSchema.validate(invalidParams);
      expect(invalidError).toBeDefined();
      expect(invalidError?.details).toHaveLength(2);
    });
  });

  describe('Custom Validation Functions', () => {
    describe('validateArrayParam', () => {
      test('should convert string to array', () => {
        const result = validateArrayParam('tag1,tag2,tag3');
        expect(result).toEqual(['tag1', 'tag2', 'tag3']);
      });

      test('should trim whitespace', () => {
        const result = validateArrayParam('tag1, tag2 , tag3');
        expect(result).toEqual(['tag1', 'tag2', 'tag3']);
      });

      test('should filter empty values', () => {
        const result = validateArrayParam('tag1,,tag3,');
        expect(result).toEqual(['tag1', 'tag3']);
      });

      test('should return array as-is', () => {
        const input = ['tag1', 'tag2'];
        const result = validateArrayParam(input);
        expect(result).toEqual(input);
      });

      test('should handle non-string, non-array input', () => {
        const result = validateArrayParam(123 as any);
        expect(result).toEqual([]);
      });
    });

    describe('validateDateParam', () => {
      test('should parse valid date string', () => {
        const result = validateDateParam('2024-01-01T00:00:00.000Z');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2024);
      });

      test('should return undefined for invalid date', () => {
        const result = validateDateParam('invalid-date');
        expect(result).toBeUndefined();
      });

      test('should return undefined for empty string', () => {
        const result = validateDateParam('');
        expect(result).toBeUndefined();
      });

      test('should handle various date formats', () => {
        const formats = [
          '2024-01-01',
          '2024-01-01T12:00:00Z',
          '2024-01-01T12:00:00.000Z',
          'January 1, 2024'
        ];

        formats.forEach(format => {
          const result = validateDateParam(format);
          expect(result).toBeInstanceOf(Date);
        });
      });
    });

    describe('validateSortOrder', () => {
      test('should return "asc" for ascending', () => {
        expect(validateSortOrder('asc')).toBe('asc');
      });

      test('should return "desc" for descending', () => {
        expect(validateSortOrder('desc')).toBe('desc');
      });

      test('should default to "desc" for invalid input', () => {
        expect(validateSortOrder('invalid')).toBe('desc');
        expect(validateSortOrder('')).toBe('desc');
        expect(validateSortOrder('ASC')).toBe('desc');
      });
    });
  });

  describe('validateSchema Middleware', () => {
    let app: express.Express;

    beforeAll(() => {
      app = express();
      app.use(express.json());
    });

    test('should validate request body', (done) => {
      app.post('/test-body', validateSchema(createWorkflowSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const validData = {
        name: 'Test Workflow',
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: { script: 'test.js' }
        }]
      };

      request(app)
        .post('/test-body')
        .send(validData)
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Test Workflow');
          done();
        });
    });

    test('should validate query parameters', (done) => {
      app.get('/test-query', validateSchema(workflowQuerySchema, 'query'), (req, res) => {
        res.json({ success: true, query: req.query });
      });

      request(app)
        .get('/test-query')
        .query({ page: 2, limit: 10, sortBy: 'name' })
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.query.page).toBe(2);
          done();
        });
    });

    test('should validate path parameters', (done) => {
      app.get('/test-params/:id', validateSchema(workflowIdSchema, 'params'), (req, res) => {
        res.json({ success: true, params: req.params });
      });

      const testId = uuidv4();
      request(app)
        .get(`/test-params/${testId}`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.params.id).toBe(testId);
          done();
        });
    });

    test('should return validation error for invalid data', (done) => {
      app.post('/test-validation-error', validateSchema(createWorkflowSchema, 'body'), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        name: '', // Empty name
        steps: [] // No steps
      };

      request(app)
        .post('/test-validation-error')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toMatchObject({
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
          done();
        });
    });

    test('should strip unknown properties', (done) => {
      app.post('/test-strip', validateSchema(createWorkflowSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const dataWithExtra = {
        name: 'Test Workflow',
        steps: [{
          name: 'Test Step',
          type: StepType.SCRIPT,
          config: { script: 'test.js' }
        }],
        unknownField: 'should be stripped'
      };

      request(app)
        .post('/test-strip')
        .send(dataWithExtra)
        .expect(200)
        .end((err, res) => {
          expect(res.body.data).not.toHaveProperty('unknownField');
          expect(res.body.data.name).toBe('Test Workflow');
          done();
        });
    });

    test('should include request ID in error response', (done) => {
      app.post('/test-request-id', validateSchema(createWorkflowSchema, 'body'), (req, res) => {
        res.json({ success: true });
      });

      const requestId = 'test-request-id-123';
      
      request(app)
        .post('/test-request-id')
        .set('x-request-id', requestId)
        .send({}) // Invalid empty body
        .expect(400)
        .end((err, res) => {
          expect(res.body.requestId).toBe(requestId);
          done();
        });
    });

    test('should provide detailed field validation errors', (done) => {
      app.post('/test-detailed-errors', validateSchema(createWorkflowSchema, 'body'), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        name: 'a'.repeat(256), // Too long
        description: 'a'.repeat(1001), // Too long
        steps: [{
          name: 'Test Step',
          type: 'INVALID_TYPE', // Invalid type
          config: {} // Valid but empty
        }]
      };

      request(app)
        .post('/test-detailed-errors')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          const errors = res.body.error.details;
          expect(errors).toHaveLength(3);
          
          const nameError = errors.find((e: any) => e.field === 'name');
          const descError = errors.find((e: any) => e.field === 'description');
          const typeError = errors.find((e: any) => e.field === 'steps.0.type');
          
          expect(nameError).toBeDefined();
          expect(descError).toBeDefined();
          expect(typeError).toBeDefined();
          done();
        });
    });
  });

  describe('Schema Edge Cases', () => {
    test('should handle null and undefined values', () => {
      const nullData = { name: null, description: undefined };
      const { error } = createWorkflowSchema.validate(nullData);
      expect(error).toBeDefined(); // Should fail because name is required
    });

    test('should handle deeply nested validation errors', () => {
      const deeplyNested = {
        name: 'Test',
        steps: [{
          name: 'Step',
          type: StepType.SCRIPT,
          config: {},
          retryPolicy: {
            maxAttempts: 'not-a-number' as any,
            backoffStrategy: BackoffStrategy.EXPONENTIAL,
            backoffMultiplier: -1 // Invalid negative
          }
        }]
      };

      const { error } = createWorkflowSchema.validate(deeplyNested);
      expect(error).toBeDefined();
      expect(error?.details).toHaveLength(2); // maxAttempts and backoffMultiplier
    });

    test('should handle array with mixed valid/invalid items', () => {
      const mixedArray = {
        name: 'Test',
        steps: [
          {
            name: 'Valid Step',
            type: StepType.SCRIPT,
            config: {}
          },
          {
            name: '', // Invalid empty name
            type: 'INVALID_TYPE' as any,
            config: {}
          }
        ]
      };

      const { error } = createWorkflowSchema.validate(mixedArray);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(1);
    });

    test('should handle very large objects', () => {
      const largeObject = {
        name: 'Large Test',
        steps: Array.from({ length: 100 }, (_, i) => ({
          name: `Step ${i}`,
          type: StepType.SCRIPT,
          config: { script: `script${i}.js` }
        })),
        variables: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`var${i}`, `value${i}`])
        )
      };

      const { error } = createWorkflowSchema.validate(largeObject);
      expect(error).toBeUndefined(); // Should be valid
    });

    test('should validate with Unicode characters', () => {
      const unicodeData = {
        name: 'テストワークフロー', // Japanese
        description: 'Workflow with émojis 🚀 and spëcial chars',
        steps: [{
          name: 'Étape de test',
          type: StepType.SCRIPT,
          config: { script: 'тест.js' }
        }]
      };

      const { error } = createWorkflowSchema.validate(unicodeData);
      expect(error).toBeUndefined();
    });
  });
});