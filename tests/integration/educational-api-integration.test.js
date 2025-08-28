/**
 * Educational API Integration Tests
 * Comprehensive testing of educational platform API endpoints and workflows
 */

const { IntegrationTester } = require('./integration-tester');
const { setupTestDB, teardownTestDB } = require('../setup/test-config');
const { createAPIClient } = require('../utils/api-client');
const { logger } = require('../utils/logger');

describe('Educational Platform API Integration Tests', () => {
  let integrationTester;
  let apiClient;
  let testDB;

  beforeAll(async () => {
    logger.info('Setting up Educational API Integration Tests');
    
    // Initialize integration tester
    integrationTester = new IntegrationTester({
      timeout: 60000,
      parallel: false,
      continueOnFailure: true
    });

    // Setup test database
    testDB = await setupTestDB();
    
    // Setup API client
    apiClient = createAPIClient({
      baseURL: process.env.TEST_API_URL || 'http://localhost:3001',
      timeout: 30000
    });

    // Register educational platform components
    await registerEducationalComponents();
  });

  afterAll(async () => {
    await teardownTestDB(testDB);
    logger.info('Educational API Integration Tests completed');
  });

  async function registerEducationalComponents() {
    // Register authentication service
    integrationTester.registerComponent('auth-service', {
      name: 'auth-service',
      healthCheck: async () => {
        const response = await apiClient.get('/api/health/auth');
        return response.status === 200;
      },
      dependencies: ['database'],
      recoveryMethods: ['restart', 'failover']
    });

    // Register module service
    integrationTester.registerComponent('module-service', {
      name: 'module-service',
      healthCheck: async () => {
        const response = await apiClient.get('/api/health/modules');
        return response.status === 200;
      },
      dependencies: ['database', 'auth-service'],
      recoveryMethods: ['cache-fallback', 'restart']
    });

    // Register quiz service
    integrationTester.registerComponent('quiz-service', {
      name: 'quiz-service',
      healthCheck: async () => {
        const response = await apiClient.get('/api/health/quiz');
        return response.status === 200;
      },
      dependencies: ['database', 'module-service', 'llm-service'],
      recoveryMethods: ['retry', 'degraded-mode']
    });

    // Register LLM service
    integrationTester.registerComponent('llm-service', {
      name: 'llm-service',
      healthCheck: async () => {
        const response = await apiClient.get('/api/health/llm');
        return response.status === 200;
      },
      dependencies: [],
      recoveryMethods: ['provider-switch', 'queue-fallback']
    });

    // Register content processing service
    integrationTester.registerComponent('content-service', {
      name: 'content-service',
      healthCheck: async () => {
        const response = await apiClient.get('/api/health/content');
        return response.status === 200;
      },
      dependencies: ['database'],
      recoveryMethods: ['cache-fallback', 'restart']
    });

    // Register database
    integrationTester.registerComponent('database', {
      name: 'database',
      healthCheck: async () => {
        try {
          const result = await testDB.query('SELECT 1');
          return result.rows.length > 0;
        } catch (error) {
          return false;
        }
      },
      dependencies: [],
      recoveryMethods: ['connection-pool-reset', 'readonly-mode']
    });
  }

  describe('Student Learning Journey Integration', () => {
    test('Complete student onboarding workflow', async () => {
      const workflow = integrationTester.defineWorkflow('student-onboarding', {
        components: ['auth-service', 'module-service', 'content-service'],
        steps: [
          'user-registration',
          'email-verification',
          'profile-setup',
          'course-enrollment',
          'initial-assessment'
        ],
        failureScenarios: [
          {
            type: 'service-crash',
            components: ['auth-service'],
            cascadeExpected: false,
            recoveryExpected: true,
            maxRecoveryTime: 30000
          }
        ],
        successCriteria: {
          userCreated: true,
          courseEnrolled: true,
          assessmentCompleted: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('student-onboarding');
      
      expect(testResult.success).toBe(true);
      expect(testResult.phases.length).toBeGreaterThan(3);
      expect(testResult.metrics.successfulRecoveries).toBeGreaterThanOrEqual(0);
      
      const report = integrationTester.generateIntegrationReport(testResult.id);
      expect(report.workflowAnalysis.successfulPhases).toBeGreaterThan(0);
    });

    test('Module completion and progress tracking workflow', async () => {
      const workflow = integrationTester.defineWorkflow('module-completion', {
        components: ['module-service', 'quiz-service', 'content-service', 'database'],
        steps: [
          'module-access',
          'content-consumption',
          'progress-tracking',
          'quiz-generation',
          'quiz-completion',
          'score-recording'
        ],
        failureScenarios: [
          {
            type: 'database-corruption',
            components: ['database'],
            cascadeExpected: true,
            recoveryExpected: true,
            maxRecoveryTime: 60000
          }
        ],
        successCriteria: {
          moduleAccessed: true,
          progressTracked: true,
          quizCompleted: true,
          scoreRecorded: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('module-completion');
      
      expect(testResult.success).toBe(true);
      expect(testResult.metrics.failuresInjected).toBeGreaterThan(0);
      expect(testResult.metrics.successfulRecoveries).toBeGreaterThan(0);
    });
  });

  describe('Educational Content Management Integration', () => {
    test('Content creation and processing workflow', async () => {
      const workflow = integrationTester.defineWorkflow('content-management', {
        components: ['content-service', 'llm-service', 'module-service', 'database'],
        steps: [
          'content-upload',
          'content-processing',
          'llm-enhancement',
          'module-integration',
          'content-publication'
        ],
        failureScenarios: [
          {
            type: 'network-partition',
            components: ['llm-service'],
            cascadeExpected: false,
            recoveryExpected: true,
            maxRecoveryTime: 45000
          }
        ],
        successCriteria: {
          contentProcessed: true,
          moduleIntegrated: true,
          contentPublished: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('content-management');
      expect(testResult.success).toBe(true);
    });

    test('Multi-modal content processing', async () => {
      const workflow = integrationTester.defineWorkflow('multimodal-processing', {
        components: ['content-service', 'llm-service'],
        steps: [
          'text-processing',
          'video-analysis',
          'audio-transcription',
          'content-synthesis',
          'quality-validation'
        ],
        failureScenarios: [
          {
            type: 'memory-leak',
            components: ['content-service'],
            cascadeExpected: false,
            recoveryExpected: true,
            maxRecoveryTime: 90000
          }
        ],
        successCriteria: {
          allModesProcessed: true,
          contentSynthesized: true,
          qualityPassed: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('multimodal-processing');
      expect(testResult.success).toBe(true);
    });
  });

  describe('Assessment and Analytics Integration', () => {
    test('Adaptive quiz generation workflow', async () => {
      const workflow = integrationTester.defineWorkflow('adaptive-quiz', {
        components: ['quiz-service', 'llm-service', 'module-service', 'database'],
        steps: [
          'student-analysis',
          'difficulty-assessment',
          'question-generation',
          'quiz-compilation',
          'adaptive-adjustment'
        ],
        failureScenarios: [
          {
            type: 'cascading-failure',
            components: ['llm-service', 'quiz-service'],
            sequential: true,
            injectionDelay: 5000,
            cascadeExpected: true,
            recoveryExpected: true,
            maxRecoveryTime: 120000
          }
        ],
        successCriteria: {
          questionsGenerated: true,
          adaptiveLogicWorking: true,
          quizCompiled: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('adaptive-quiz');
      expect(testResult.success).toBe(true);
      expect(testResult.metrics.successfulRecoveries).toBeGreaterThan(0);
    });

    test('Learning analytics and insights workflow', async () => {
      const workflow = integrationTester.defineWorkflow('learning-analytics', {
        components: ['database', 'content-service', 'module-service'],
        steps: [
          'data-collection',
          'pattern-analysis',
          'insight-generation',
          'recommendation-creation',
          'progress-visualization'
        ],
        failureScenarios: [
          {
            type: 'service-crash',
            components: ['database'],
            cascadeExpected: true,
            recoveryExpected: true,
            maxRecoveryTime: 60000
          }
        ],
        successCriteria: {
          dataCollected: true,
          insightsGenerated: true,
          recommendationsCreated: true
        }
      });

      const testResult = await integrationTester.executeWorkflowTest('learning-analytics');
      expect(testResult.success).toBe(true);
    });
  });

  describe('Cross-Component Communication Tests', () => {
    test('Service-to-service API coordination', async () => {
      // Test direct API calls between services
      const moduleResponse = await apiClient.post('/api/modules', {
        title: 'Integration Test Module',
        description: 'Testing cross-component communication',
        content: { sections: [{ title: 'Test Section', content: 'Test content' }] }
      });

      expect(moduleResponse.status).toBe(201);
      expect(moduleResponse.data.id).toBeDefined();

      // Test quiz service can access module
      const quizResponse = await apiClient.post('/api/quiz/generate-from-module', {
        moduleId: moduleResponse.data.id,
        questionCount: 3,
        difficulty: 'medium'
      });

      expect(quizResponse.status).toBe(200);
      expect(quizResponse.data.questions).toHaveLength(3);
      expect(quizResponse.data.moduleReference).toBe(moduleResponse.data.id);

      // Test content service can process module content
      const contentResponse = await apiClient.post('/api/content/enhance', {
        moduleId: moduleResponse.data.id,
        enhancementType: 'summary'
      });

      expect(contentResponse.status).toBe(200);
      expect(contentResponse.data.enhanced).toBe(true);
    });

    test('Database consistency across services', async () => {
      // Create user via auth service
      const userResponse = await apiClient.post('/api/auth/register', {
        email: 'integration-test@example.com',
        username: 'integration-user',
        password: 'securepassword'
      });

      expect(userResponse.status).toBe(201);
      const userId = userResponse.data.user.id;

      // Verify user exists in database directly
      const dbUser = await testDB.query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe('integration-test@example.com');

      // Enroll user in module via module service
      const enrollmentResponse = await apiClient.post('/api/modules/enroll', {
        userId: userId,
        moduleId: 'test-module-1'
      });

      expect(enrollmentResponse.status).toBe(200);

      // Verify enrollment in database
      const dbEnrollment = await testDB.query(
        'SELECT * FROM enrollments WHERE user_id = $1 AND module_id = $2',
        [userId, 'test-module-1']
      );
      expect(dbEnrollment.rows).toHaveLength(1);

      // Update progress via content service
      const progressResponse = await apiClient.post('/api/content/progress', {
        userId: userId,
        moduleId: 'test-module-1',
        progress: 75
      });

      expect(progressResponse.status).toBe(200);

      // Verify progress in database
      const dbProgress = await testDB.query(
        'SELECT progress FROM enrollments WHERE user_id = $1 AND module_id = $2',
        [userId, 'test-module-1']
      );
      expect(dbProgress.rows[0].progress).toBe(75);
    });

    test('Event-driven workflow coordination', async () => {
      // Trigger student completion event
      const eventResponse = await apiClient.post('/api/events/trigger', {
        eventType: 'module-completed',
        payload: {
          userId: 'test-user-123',
          moduleId: 'jung-psychology-101',
          completionTime: new Date().toISOString(),
          finalScore: 88
        }
      });

      expect(eventResponse.status).toBe(200);
      expect(eventResponse.data.executionId).toBeDefined();

      // Wait for cascading events to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify cascade effects
      const badgeResponse = await apiClient.get(`/api/users/test-user-123/badges`);
      expect(badgeResponse.status).toBe(200);
      expect(badgeResponse.data.badges.length).toBeGreaterThan(0);

      const certificateResponse = await apiClient.get(`/api/users/test-user-123/certificates`);
      expect(certificateResponse.status).toBe(200);

      const recommendationResponse = await apiClient.get(`/api/users/test-user-123/recommendations`);
      expect(recommendationResponse.status).toBe(200);
      expect(recommendationResponse.data.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scaling Integration', () => {
    test('Concurrent user workflow handling', async () => {
      const concurrentUsers = 50;
      const userPromises = [];

      // Create concurrent user workflows
      for (let i = 0; i < concurrentUsers; i++) {
        const userWorkflow = async () => {
          const userResponse = await apiClient.post('/api/auth/register', {
            email: `concurrent-user-${i}@test.com`,
            username: `concurrent-user-${i}`,
            password: 'testpass'
          });

          const enrollmentResponse = await apiClient.post('/api/modules/enroll', {
            userId: userResponse.data.user.id,
            moduleId: 'concurrent-test-module'
          });

          const quizResponse = await apiClient.post('/api/quiz/generate', {
            userId: userResponse.data.user.id,
            moduleId: 'concurrent-test-module',
            questionCount: 5
          });

          return {
            userId: userResponse.data.user.id,
            enrolled: enrollmentResponse.status === 200,
            quizGenerated: quizResponse.status === 200
          };
        };

        userPromises.push(userWorkflow());
      }

      // Execute all workflows concurrently
      const results = await Promise.all(userPromises);

      // Verify all workflows completed successfully
      const successfulWorkflows = results.filter(r => r.enrolled && r.quizGenerated);
      expect(successfulWorkflows.length).toBe(concurrentUsers);

      // Verify database consistency
      const dbUserCount = await testDB.query(
        'SELECT COUNT(*) FROM users WHERE email LIKE \'concurrent-user-%@test.com\''
      );
      expect(parseInt(dbUserCount.rows[0].count)).toBe(concurrentUsers);

      const dbEnrollmentCount = await testDB.query(
        'SELECT COUNT(*) FROM enrollments WHERE module_id = \'concurrent-test-module\''
      );
      expect(parseInt(dbEnrollmentCount.rows[0].count)).toBe(concurrentUsers);
    });

    test('System resilience under load', async () => {
      const loadTestDuration = 30000; // 30 seconds
      const requestsPerSecond = 10;
      const totalRequests = (loadTestDuration / 1000) * requestsPerSecond;

      let successfulRequests = 0;
      let failedRequests = 0;
      const startTime = Date.now();

      const loadTestPromises = [];

      const loadTestRequest = async () => {
        try {
          const response = await apiClient.get('/api/modules?limit=5');
          if (response.status === 200) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        } catch (error) {
          failedRequests++;
        }
      };

      // Generate load
      const interval = setInterval(() => {
        for (let i = 0; i < requestsPerSecond; i++) {
          loadTestPromises.push(loadTestRequest());
        }
      }, 1000);

      // Stop after duration
      setTimeout(() => {
        clearInterval(interval);
      }, loadTestDuration);

      // Wait for all requests to complete
      await Promise.all(loadTestPromises);
      const endTime = Date.now();

      const actualDuration = endTime - startTime;
      const successRate = (successfulRequests / (successfulRequests + failedRequests)) * 100;

      // Verify system maintained acceptable performance under load
      expect(successRate).toBeGreaterThan(95);
      expect(actualDuration).toBeLessThan(loadTestDuration + 5000); // Allow 5s buffer

      logger.info(`Load test results: ${successfulRequests} successful, ${failedRequests} failed, ${successRate.toFixed(2)}% success rate`);
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    test('Graceful degradation under service failures', async () => {
      // Simulate LLM service failure
      const originalLLMHealth = integrationTester.components.get('llm-service').healthCheck;
      integrationTester.components.get('llm-service').healthCheck = async () => false;

      try {
        // Test quiz generation with fallback logic
        const quizResponse = await apiClient.post('/api/quiz/generate', {
          moduleId: 'test-module-fallback',
          questionCount: 3,
          useFallback: true
        });

        expect(quizResponse.status).toBe(200);
        expect(quizResponse.data.questions).toHaveLength(3);
        expect(quizResponse.data.source).toBe('fallback-templates');
      } finally {
        // Restore original health check
        integrationTester.components.get('llm-service').healthCheck = originalLLMHealth;
      }
    });

    test('Transaction rollback integrity', async () => {
      const initialUserCount = await testDB.query('SELECT COUNT(*) FROM users');
      const initialCount = parseInt(initialUserCount.rows[0].count);

      try {
        // Attempt to create user with duplicate email (should fail)
        await apiClient.post('/api/auth/register', {
          email: 'duplicate@test.com',
          username: 'original-user',
          password: 'password1'
        });

        await apiClient.post('/api/auth/register', {
          email: 'duplicate@test.com', // Duplicate email should cause rollback
          username: 'duplicate-user',
          password: 'password2'
        });

        // This should not be reached if transaction handling is correct
        fail('Expected duplicate email error');
      } catch (error) {
        expect(error.response.status).toBe(409); // Conflict
      }

      // Verify no users were created due to rollback
      const finalUserCount = await testDB.query('SELECT COUNT(*) FROM users');
      const finalCount = parseInt(finalUserCount.rows[0].count);
      
      // Only the first user should be created
      expect(finalCount).toBe(initialCount + 1);

      // Verify first user exists
      const createdUser = await testDB.query('SELECT * FROM users WHERE email = \'duplicate@test.com\'');
      expect(createdUser.rows).toHaveLength(1);
      expect(createdUser.rows[0].username).toBe('original-user');
    });
  });
});