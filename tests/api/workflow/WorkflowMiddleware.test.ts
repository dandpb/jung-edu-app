/**
 * Comprehensive WorkflowMiddleware Tests
 * Testing rate limiting, authentication, authorization, CORS, logging, and error handling
 * @priority HIGH - Middleware controls security and performance of all API requests
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  createRateLimit,
  globalRateLimit,
  workflowRateLimit,
  executionRateLimit,
  heavyOperationRateLimit,
  requestId,
  cors,
  authenticate,
  authorize,
  checkOwnership,
  requestLogger,
  errorHandler,
  healthCheck,
  addRateLimitInfo
} from '../../../src/api/workflow/WorkflowMiddleware';

describe('WorkflowMiddleware Tests', () => {
  let app: express.Express;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Setup test environment
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.WORKFLOW_API_KEY = 'test-api-key';
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rate Limiting Middleware', () => {
    describe('createRateLimit Function', () => {
      test('should create rate limit middleware with custom settings', () => {
        const middleware = createRateLimit(60000, 5, 'Custom rate limit message');
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('function');
      });

      test('should enforce rate limit', (done) => {
        const testApp = express();
        const limitMiddleware = createRateLimit(1000, 2);
        testApp.use(limitMiddleware);
        testApp.get('/test', (req, res) => res.json({ success: true }));

        // First two requests should succeed
        request(testApp).get('/test').expect(200, () => {
          request(testApp).get('/test').expect(200, () => {
            // Third request should be rate limited
            request(testApp).get('/test').expect(429, (err, res) => {
              expect(res.body).toMatchObject({
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: expect.stringContaining('Too many requests')
                }
              });
              done();
            });
          });
        });
      });

      test('should include rate limit headers', (done) => {
        const testApp = express();
        const limitMiddleware = createRateLimit(60000, 10);
        testApp.use(limitMiddleware);
        testApp.get('/test', (req, res) => res.json({ success: true }));

        request(testApp)
          .get('/test')
          .expect(200)
          .end((err, res) => {
            expect(res.headers['x-ratelimit-limit']).toBe('10');
            expect(res.headers['x-ratelimit-remaining']).toBe('9');
            expect(res.headers['x-ratelimit-reset']).toBeDefined();
            done();
          });
      });

      test('should reset rate limit after window expires', (done) => {
        const testApp = express();
        const limitMiddleware = createRateLimit(100, 1); // Short window for testing
        testApp.use(limitMiddleware);
        testApp.get('/test', (req, res) => res.json({ success: true }));

        // First request should succeed
        request(testApp).get('/test').expect(200, () => {
          // Second request should be rate limited
          request(testApp).get('/test').expect(429, () => {
            // Wait for window to reset
            setTimeout(() => {
              // Should succeed again after window reset
              request(testApp).get('/test').expect(200, done);
            }, 150);
          });
        });
      });
    });

    describe('Pre-configured Rate Limiters', () => {
      test('should have different limits for different operations', () => {
        expect(globalRateLimit).toBeDefined();
        expect(workflowRateLimit).toBeDefined();
        expect(executionRateLimit).toBeDefined();
        expect(heavyOperationRateLimit).toBeDefined();
      });

      test('should apply workflow rate limit', (done) => {
        const testApp = express();
        testApp.use(workflowRateLimit);
        testApp.get('/workflows', (req, res) => res.json({ success: true }));

        request(testApp)
          .get('/workflows')
          .expect(200)
          .end((err, res) => {
            expect(res.headers['x-ratelimit-limit']).toBe('100');
            done();
          });
      });

      test('should apply execution rate limit', (done) => {
        const testApp = express();
        testApp.use(executionRateLimit);
        testApp.post('/executions', (req, res) => res.json({ success: true }));

        request(testApp)
          .post('/executions')
          .expect(200)
          .end((err, res) => {
            expect(res.headers['x-ratelimit-limit']).toBe('50');
            done();
          });
      });

      test('should apply heavy operation rate limit', (done) => {
        const testApp = express();
        testApp.use(heavyOperationRateLimit);
        testApp.post('/heavy', (req, res) => res.json({ success: true }));

        request(testApp)
          .post('/heavy')
          .expect(200)
          .end((err, res) => {
            expect(res.headers['x-ratelimit-limit']).toBe('10');
            done();
          });
      });
    });
  });

  describe('Request ID Middleware', () => {
    test('should add request ID when not provided', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res) => {
        expect(req.headers['x-request-id']).toBeDefined();
        expect(typeof req.headers['x-request-id']).toBe('string');
        res.json({ requestId: req.headers['x-request-id'] });
      });

      request(testApp)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(res.headers['x-request-id']).toBeDefined();
          expect(res.body.requestId).toBe(res.headers['x-request-id']);
          done();
        });
    });

    test('should preserve existing request ID', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res) => {
        res.json({ requestId: req.headers['x-request-id'] });
      });

      const customRequestId = 'custom-request-id-123';
      request(testApp)
        .get('/test')
        .set('X-Request-ID', customRequestId)
        .expect(200)
        .end((err, res) => {
          expect(res.headers['x-request-id']).toBe(customRequestId);
          expect(res.body.requestId).toBe(customRequestId);
          done();
        });
    });

    test('should generate UUID v4 format', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          const requestIdHeader = res.headers['x-request-id'];
          expect(requestIdHeader).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
          done();
        });
    });
  });

  describe('CORS Middleware', () => {
    test('should handle preflight OPTIONS request', (done) => {
      const testApp = express();
      testApp.use(cors);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200)
        .end((err, res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
          expect(res.headers['access-control-allow-methods']).toContain('GET');
          expect(res.headers['access-control-allow-methods']).toContain('POST');
          expect(res.headers['access-control-allow-headers']).toContain('Authorization');
          done();
        });
    });

    test('should allow requests from allowed origins', (done) => {
      const testApp = express();
      testApp.use(cors);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200)
        .end((err, res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
          expect(res.headers['access-control-allow-credentials']).toBe('true');
          done();
        });
    });

    test('should reject requests from disallowed origins', (done) => {
      const testApp = express();
      testApp.use(cors);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Origin', 'http://malicious-site.com')
        .expect(200)
        .end((err, res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
          done();
        });
    });

    test('should handle requests without origin', (done) => {
      const testApp = express();
      testApp.use(cors);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(res.headers['access-control-allow-origin']).toBe('*');
          done();
        });
    });

    test('should expose required headers', (done) => {
      const testApp = express();
      testApp.use(cors);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          const exposedHeaders = res.headers['access-control-expose-headers'];
          expect(exposedHeaders).toContain('X-Request-ID');
          expect(exposedHeaders).toContain('X-RateLimit-Limit');
          done();
        });
    });
  });

  describe('Authentication Middleware', () => {
    const validToken = jwt.sign({
      sub: 'user-123',
      username: 'testuser',
      roles: ['user'],
      permissions: ['workflow:read'],
      organizationId: 'org-123'
    }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    test('should authenticate with valid JWT token', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req: any, res) => {
        expect(req.auth).toBeDefined();
        expect(req.auth.userId).toBe('user-123');
        expect(req.auth.username).toBe('testuser');
        res.json({ success: true, user: req.auth });
      });

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.user.userId).toBe('user-123');
          done();
        });
    });

    test('should authenticate with valid API key', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req: any, res) => {
        expect(req.auth).toBeDefined();
        expect(req.auth.userId).toBe('api-user');
        res.json({ success: true, user: req.auth });
      });

      request(testApp)
        .get('/test')
        .set('X-API-Key', process.env.WORKFLOW_API_KEY!)
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.user.userId).toBe('api-user');
          done();
        });
    });

    test('should reject request without authentication', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(401)
        .end((err, res) => {
          expect(res.body).toMatchObject({
            success: false,
            error: {
              code: 'MISSING_AUTH',
              message: expect.stringContaining('Authentication required')
            }
          });
          done();
        });
    });

    test('should reject invalid JWT token', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .end((err, res) => {
          expect(res.body.error.code).toBe('INVALID_TOKEN');
          done();
        });
    });

    test('should reject invalid API key', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('X-API-Key', 'invalid-api-key')
        .expect(401)
        .end((err, res) => {
          expect(res.body.error.code).toBe('INVALID_API_KEY');
          done();
        });
    });

    test('should reject expired JWT token', (done) => {
      const expiredToken = jwt.sign({
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }, process.env.JWT_SECRET!);

      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .end((err, res) => {
          expect(res.body.error.code).toBe('INVALID_TOKEN');
          done();
        });
    });

    test('should handle malformed authorization header', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', 'InvalidFormat')
        .expect(401)
        .end((err, res) => {
          expect(res.body.error.code).toBe('MISSING_AUTH');
          done();
        });
    });
  });

  describe('Authorization Middleware', () => {
    const userWithPermissions = jwt.sign({
      sub: 'user-123',
      permissions: ['workflow:read', 'workflow:write'],
      roles: ['user']
    }, process.env.JWT_SECRET!);

    const adminUser = jwt.sign({
      sub: 'admin-123',
      permissions: ['workflow:read'],
      roles: ['admin']
    }, process.env.JWT_SECRET!);

    const userWithoutPermissions = jwt.sign({
      sub: 'user-456',
      permissions: [],
      roles: ['user']
    }, process.env.JWT_SECRET!);

    test('should allow access with required permissions', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:read']));
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${userWithPermissions}`)
        .expect(200, done);
    });

    test('should allow admin access regardless of specific permissions', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:delete'])); // Admin doesn't have this permission
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${adminUser}`)
        .expect(200, done);
    });

    test('should deny access without required permissions', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:write']));
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${userWithoutPermissions}`)
        .expect(403)
        .end((err, res) => {
          expect(res.body).toMatchObject({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              details: {
                required: ['workflow:write'],
                current: []
              }
            }
          });
          done();
        });
    });

    test('should check multiple permissions', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:read', 'workflow:write']));
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${userWithPermissions}`)
        .expect(200, done);
    });

    test('should fail if user missing any required permission', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:read', 'workflow:delete'])); // User doesn't have delete
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${userWithPermissions}`)
        .expect(403, done);
    });

    test('should fail if no auth context exists', (done) => {
      const testApp = express();
      testApp.use(authorize(['workflow:read'])); // No authenticate middleware
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(403)
        .end((err, res) => {
          expect(res.body.error.code).toBe('NO_AUTH_CONTEXT');
          done();
        });
    });
  });

  describe('Ownership Check Middleware', () => {
    const ownerToken = jwt.sign({
      sub: 'owner-123',
      roles: ['user'],
      permissions: ['workflow:read']
    }, process.env.JWT_SECRET!);

    const nonOwnerToken = jwt.sign({
      sub: 'other-user-456',
      roles: ['user'],
      permissions: ['workflow:read']
    }, process.env.JWT_SECRET!);

    const adminToken = jwt.sign({
      sub: 'admin-789',
      roles: ['admin'],
      permissions: ['workflow:read']
    }, process.env.JWT_SECRET!);

    test('should allow access for resource owner', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(checkOwnership('id'));
      testApp.get('/resource/:id', (req, res) => res.json({ success: true }));

      // Mock checkResourceOwnership to return true for owner
      jest.mock('../../../src/api/workflow/WorkflowMiddleware', () => ({
        ...jest.requireActual('../../../src/api/workflow/WorkflowMiddleware'),
        checkResourceOwnership: jest.fn().mockResolvedValue(true)
      }));

      request(testApp)
        .get('/resource/123')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200, done);
    });

    test('should allow access for admin users', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(checkOwnership('id'));
      testApp.get('/resource/:id', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/resource/123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200, done);
    });

    test('should deny access for non-owners', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(checkOwnership('id'));
      testApp.get('/resource/:id', (req, res) => res.json({ success: true }));

      // Mock checkResourceOwnership to return false for non-owner
      const mockCheckOwnership = jest.fn().mockResolvedValue(false);
      
      request(testApp)
        .get('/resource/123')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403)
        .end((err, res) => {
          expect(res.body.error.code).toBe('ACCESS_DENIED');
          done();
        });
    });

    test('should handle custom resource parameter', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(checkOwnership('workflowId'));
      testApp.get('/resource/:workflowId', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/resource/workflow-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200, done);
    });

    test('should handle ownership check errors gracefully', (done) => {
      const testApp = express();
      testApp.use(authenticate);
      testApp.use(checkOwnership('id'));
      testApp.get('/resource/:id', (req, res) => res.json({ success: true }));

      // Mock checkResourceOwnership to throw error
      const mockCheckOwnership = jest.fn().mockRejectedValue(new Error('Database error'));

      request(testApp)
        .get('/resource/123')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(500)
        .end((err, res) => {
          expect(res.body.error.code).toBe('OWNERSHIP_CHECK_ERROR');
          done();
        });
    });
  });

  describe('Request Logger Middleware', () => {
    test('should log incoming requests', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.use(authenticate);
      testApp.use(requestLogger);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .set('Authorization', `Bearer ${jwt.sign({ sub: 'user-123' }, process.env.JWT_SECRET!)}`)
        .expect(200)
        .end(() => {
          expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('GET /test'),
            expect.objectContaining({
              ip: expect.any(String),
              userAgent: expect.any(String),
              auth: 'user-123'
            })
          );
          done();
        });
    });

    test('should log response completion', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.use(requestLogger);
      testApp.get('/test', (req, res) => {
        setTimeout(() => res.json({ success: true }), 10); // Simulate processing time
      });

      request(testApp)
        .get('/test')
        .expect(200)
        .end(() => {
          // Wait for response logging
          setTimeout(() => {
            expect(consoleLogSpy).toHaveBeenCalledWith(
              expect.stringContaining('GET /test 200'),
              expect.anything()
            );
            done();
          }, 20);
        });
    });

    test('should log anonymous requests', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.use(requestLogger);
      testApp.get('/test', (req, res) => res.json({ success: true }));

      request(testApp)
        .get('/test')
        .expect(200)
        .end(() => {
          expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('GET /test'),
            expect.objectContaining({
              auth: 'anonymous'
            })
          );
          done();
        });
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle validation errors', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        (error as any).details = ['Field is required'];
        next(error);
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.body).toMatchObject({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: ['Field is required']
            }
          });
          done();
        });
    });

    test('should handle cast errors', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Cast to ObjectId failed');
        error.name = 'CastError';
        next(error);
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.body.error.code).toBe('INVALID_ID');
          done();
        });
    });

    test('should handle service unavailable errors', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        next(error);
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(503)
        .end((err, res) => {
          expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
          done();
        });
    });

    test('should handle HTTP errors with status', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Resource not found');
        (error as any).status = 404;
        (error as any).code = 'NOT_FOUND';
        next(error);
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(404)
        .end((err, res) => {
          expect(res.body.error.code).toBe('NOT_FOUND');
          done();
        });
    });

    test('should handle generic internal errors', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        next(new Error('Something went wrong'));
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(500)
        .end((err, res) => {
          expect(res.body).toMatchObject({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'An internal server error occurred'
            }
          });
          expect(consoleErrorSpy).toHaveBeenCalled();
          done();
        });
    });

    test('should include request ID in error responses', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(500)
        .end((err, res) => {
          expect(res.body.requestId).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          done();
        });
    });
  });

  describe('Health Check Middleware', () => {
    test('should return healthy status', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/health', healthCheck);

      request(testApp)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          expect(res.body).toMatchObject({
            success: true,
            data: {
              status: 'healthy',
              timestamp: expect.any(String),
              uptime: expect.any(Number),
              version: expect.any(String)
            },
            requestId: expect.any(String)
          });
          done();
        });
    });

    test('should include process uptime', (done) => {
      const testApp = express();
      testApp.use(requestId);
      testApp.get('/health', healthCheck);

      const startTime = process.uptime();
      
      request(testApp)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          expect(res.body.data.uptime).toBeGreaterThanOrEqual(startTime);
          done();
        });
    });
  });

  describe('Rate Limit Info Middleware', () => {
    test('should add rate limit info to request', (done) => {
      const testApp = express();
      testApp.use(createRateLimit(60000, 100));
      testApp.use(addRateLimitInfo);
      testApp.get('/test', (req: any, res) => {
        expect(req.rateLimit).toBeDefined();
        expect(req.rateLimit.limit).toBe(100);
        expect(req.rateLimit.remaining).toBeGreaterThanOrEqual(0);
        expect(req.rateLimit.reset).toBeInstanceOf(Date);
        res.json({ rateLimit: req.rateLimit });
      });

      request(testApp)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(res.body.rateLimit).toMatchObject({
            limit: 100,
            remaining: expect.any(Number),
            reset: expect.any(String)
          });
          done();
        });
    });

    test('should handle missing rate limit headers', (done) => {
      const testApp = express();
      testApp.use(addRateLimitInfo);
      testApp.get('/test', (req: any, res) => {
        expect(req.rateLimit.limit).toBe(0);
        expect(req.rateLimit.remaining).toBe(0);
        res.json({ success: true });
      });

      request(testApp)
        .get('/test')
        .expect(200, done);
    });
  });

  describe('Middleware Integration', () => {
    test('should work together in typical workflow', (done) => {
      const testApp = express();
      
      // Setup typical middleware stack
      testApp.use(requestId);
      testApp.use(cors);
      testApp.use(requestLogger);
      testApp.use(workflowRateLimit);
      testApp.use(addRateLimitInfo);
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:read']));
      testApp.get('/workflows/:id', (req: any, res) => {
        res.json({
          success: true,
          workflow: { id: req.params.id },
          requestId: req.headers['x-request-id'],
          rateLimit: req.rateLimit
        });
      });
      testApp.use(errorHandler);

      const validToken = jwt.sign({
        sub: 'user-123',
        permissions: ['workflow:read'],
        roles: ['user']
      }, process.env.JWT_SECRET!);

      request(testApp)
        .get('/workflows/123')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)
        .end((err, res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.requestId).toBeDefined();
          expect(res.body.rateLimit).toBeDefined();
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
          expect(res.headers['x-ratelimit-limit']).toBe('100');
          done();
        });
    });

    test('should handle authentication failure in middleware chain', (done) => {
      const testApp = express();
      
      testApp.use(requestId);
      testApp.use(requestLogger);
      testApp.use(authenticate);
      testApp.use(authorize(['workflow:read']));
      testApp.get('/test', (req, res) => res.json({ success: true }));
      testApp.use(errorHandler);

      request(testApp)
        .get('/test')
        .expect(401)
        .end((err, res) => {
          expect(res.body.error.code).toBe('MISSING_AUTH');
          expect(res.body.requestId).toBeDefined();
          done();
        });
    });
  });
});