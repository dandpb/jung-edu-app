/**
 * Comprehensive Integration Tests for jaqEdu Workflow System
 * Tests integration with authentication, database, real-time notifications and existing components
 */

import { WorkflowEngine } from '../../services/workflow/WorkflowEngine';
import { WorkflowStateManager } from '../../services/workflow/WorkflowStateManager';
import { EducationalWorkflowService } from '../../services/workflow/EducationalWorkflowService';
import { AuthContext } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  WorkflowDefinition, 
  WorkflowExecution, 
  ExecutionStatus,
  WorkflowEvent,
  StudentProgressWorkflowData 
} from '../../types/workflow';
import { setupTestDatabase, cleanupTestDatabase } from '../../test-utils/integrationTestHelpers';

// Test component for workflow integration
const WorkflowTestComponent: React.FC<{
  userId: string;
  onWorkflowComplete?: (result: any) => void;
}> = ({ userId, onWorkflowComplete }) => {
  const [workflowStatus, setWorkflowStatus] = React.useState<string>('idle');
  const [executionId, setExecutionId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);
  
  const educationalService = new EducationalWorkflowService(
    new WorkflowEngine(
      new WorkflowStateManager(supabaseClient),
      mockPluginSystem,
      mockServices
    ),
    new WorkflowStateManager(supabaseClient),
    mockServices
  );

  const startProgressTracking = async () => {
    setWorkflowStatus('starting');
    try {
      const result = await educationalService.startStudentProgressTracking({
        userId,
        moduleId: 'test-module',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        performanceMetrics: {
          accuracy: 0,
          speed: 0,
          consistency: 0,
          engagement: 0,
          retention: 0,
          difficulty_preference: 0.5
        }
      });
      
      if (result.success) {
        setExecutionId(result.executionId);
        setWorkflowStatus('running');
        onWorkflowComplete?.(result);
      }
    } catch (error) {
      setWorkflowStatus('error');
    }
  };

  return (
    <div>
      <div data-testid="workflow-status">{workflowStatus}</div>
      <div data-testid="execution-id">{executionId || 'none'}</div>
      <div data-testid="progress">{progress}%</div>
      <button onClick={startProgressTracking} data-testid="start-workflow">
        Start Progress Tracking
      </button>
    </div>
  );
};

// Mock implementations for integration testing
const mockSupabaseClient = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'http://localhost:3000',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-key'
);

const mockPluginSystem = {
  execute: jest.fn(),
  loadPlugin: jest.fn(),
  unloadPlugin: jest.fn(),
  listPlugins: jest.fn(),
  getPlugin: jest.fn()
};

const mockServices = {
  database: {
    query: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn()
  },
  notification: {
    send: jest.fn(),
    sendBatch: jest.fn()
  },
  analytics: {
    track: jest.fn(),
    trackBatch: jest.fn()
  },
  auth: {
    validateToken: jest.fn().mockResolvedValue(true),
    getUserById: jest.fn(),
    hasPermission: jest.fn().mockResolvedValue(true)
  },
  ai: {
    generateContent: jest.fn(),
    analyzePerformance: jest.fn(),
    recommendContent: jest.fn()
  },
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
};

describe('Workflow System Integration Tests', () => {
  let workflowEngine: WorkflowEngine;
  let stateManager: WorkflowStateManager;
  let educationalService: EducationalWorkflowService;
  let testDatabase: any;

  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    
    // Initialize services with real database connection
    stateManager = new WorkflowStateManager(testDatabase);
    workflowEngine = new WorkflowEngine(stateManager, mockPluginSystem, mockServices);
    educationalService = new EducationalWorkflowService(workflowEngine, stateManager, mockServices);
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDatabase);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Integration', () => {
    test('should authenticate user before workflow execution', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'student@jaquedu.com',
        role: 'student',
        profile: { learning_style: 'visual' }
      };

      mockServices.auth.getUserById.mockResolvedValue(mockUser);
      mockServices.auth.validateToken.mockResolvedValue(true);

      const workflowData: StudentProgressWorkflowData = {
        userId: 'user-1',
        moduleId: 'jung-basics',
        progress: 25,
        timeSpent: 900,
        completedSections: ['introduction'],
        performanceMetrics: {
          accuracy: 0.85,
          speed: 0.75,
          consistency: 0.90,
          engagement: 0.95,
          retention: 0.80,
          difficulty_preference: 0.70
        }
      };

      const result = await educationalService.startStudentProgressTracking(workflowData);

      expect(mockServices.auth.getUserById).toHaveBeenCalledWith('user-1');
      expect(result.success).toBe(true);
    });

    test('should handle authentication failures', async () => {
      mockServices.auth.validateToken.mockResolvedValue(false);

      await expect(
        educationalService.startStudentProgressTracking({
          userId: 'invalid-user',
          moduleId: 'test-module',
          progress: 0,
          timeSpent: 0,
          completedSections: [],
          performanceMetrics: {
            accuracy: 0, speed: 0, consistency: 0, engagement: 0, retention: 0, difficulty_preference: 0.5
          }
        })
      ).rejects.toThrow('Authentication failed');
    });

    test('should validate user permissions for workflow actions', async () => {
      const instructorUser = {
        id: 'instructor-1',
        role: 'instructor',
        permissions: ['workflow.create', 'workflow.manage']
      };

      mockServices.auth.getUserById.mockResolvedValue(instructorUser);
      mockServices.auth.hasPermission.mockResolvedValue(true);

      const workflowDefinition: WorkflowDefinition = {
        id: 'instructor-workflow',
        name: 'Student Assessment Review',
        description: 'Workflow for reviewing student assessments',
        version: '1.0.0',
        category: 'approval',
        trigger: { type: 'manual', event: 'assessment.submitted', conditions: [], immediate: false, enabled: true },
        states: [
          {
            id: 'review',
            name: 'Review Assessment',
            type: 'task',
            isInitial: true,
            isFinal: false,
            actions: []
          }
        ],
        transitions: [],
        variables: [],
        metadata: { tags: [], author: 'instructor-1' },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'instructor-1',
        is_active: true
      };

      const result = await workflowEngine.executeWorkflow(workflowDefinition, { 
        assessmentId: 'assessment-1' 
      });

      expect(mockServices.auth.hasPermission).toHaveBeenCalledWith(
        'instructor-1', 
        'workflow', 
        'create'
      );
    });
  });

  describe('Database Integration', () => {
    test('should persist workflow execution to database', async () => {
      const executionData = {
        workflow_id: 'test-workflow',
        user_id: 'user-1',
        status: 'running' as ExecutionStatus,
        variables: { test: 'data' },
        input_data: { moduleId: 'test-module' }
      };

      const execution = await stateManager.createExecution(executionData);

      expect(execution).toBeDefined();
      expect(execution.id).toBeDefined();
      expect(execution.workflow_id).toBe('test-workflow');

      // Verify database persistence
      const retrieved = await stateManager.getExecution(execution.id);
      expect(retrieved).toEqual(execution);
    });

    test('should handle database transactions for complex operations', async () => {
      const transactionOperations = async (tx: any) => {
        // Create execution
        const execution = await stateManager.createExecution({
          workflow_id: 'transaction-test',
          status: 'running' as ExecutionStatus
        });

        // Add events
        await stateManager.addEvent({
          id: 'event-1',
          execution_id: execution.id,
          event_type: 'workflow.started',
          event_data: { message: 'Started in transaction' },
          timestamp: new Date()
        });

        return execution;
      };

      const result = await mockServices.database.transaction(transactionOperations);
      expect(result).toBeDefined();
    });

    test('should handle database connection failures gracefully', async () => {
      // Simulate connection failure
      mockServices.database.query.mockRejectedValue(new Error('Connection lost'));

      const result = await educationalService.startStudentProgressTracking({
        userId: 'user-1',
        moduleId: 'test-module',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        performanceMetrics: {
          accuracy: 0, speed: 0, consistency: 0, engagement: 0, retention: 0, difficulty_preference: 0.5
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection lost');
    });

    test('should maintain data consistency across workflow operations', async () => {
      const workflowData = {
        userId: 'user-1',
        moduleId: 'consistency-test',
        progress: 50,
        timeSpent: 1800,
        completedSections: ['intro', 'basics'],
        performanceMetrics: {
          accuracy: 0.75, speed: 0.80, consistency: 0.85, engagement: 0.90, retention: 0.70, difficulty_preference: 0.60
        }
      };

      // Start workflow
      const startResult = await educationalService.startStudentProgressTracking(workflowData);
      expect(startResult.success).toBe(true);

      // Update progress
      const updatedData = { ...workflowData, progress: 75, completedSections: [...workflowData.completedSections, 'advanced'] };
      const updateResult = await educationalService.updateStudentProgress(startResult.executionId!, updatedData);
      expect(updateResult.success).toBe(true);

      // Verify consistency
      const execution = await stateManager.getExecution(startResult.executionId!);
      expect(execution?.variables.progress).toBe(75);
      expect(execution?.variables.completedSections).toEqual(['intro', 'basics', 'advanced']);
    });
  });

  describe('Real-time Updates Integration', () => {
    test('should receive real-time workflow execution updates', async (done) => {
      const executionId = 'realtime-test-execution';
      let updateReceived = false;

      const unsubscribe = stateManager.subscribeToExecution(executionId, (update) => {
        expect(update.type).toBe('UPDATE');
        expect(update.execution).toBeDefined();
        updateReceived = true;
        unsubscribe();
        done();
      });

      // Simulate execution update
      setTimeout(async () => {
        await stateManager.updateExecution(executionId, { 
          status: 'completed' as ExecutionStatus 
        });
      }, 100);

      // Cleanup if test doesn't complete
      setTimeout(() => {
        if (!updateReceived) {
          unsubscribe();
          done();
        }
      }, 5000);
    });

    test('should receive real-time workflow event updates', async (done) => {
      const executionId = 'event-test-execution';
      let eventReceived = false;

      const unsubscribe = stateManager.subscribeToExecutionEvents(executionId, (event) => {
        expect(event.event_type).toBe('test.event');
        eventReceived = true;
        unsubscribe();
        done();
      });

      // Simulate event addition
      setTimeout(async () => {
        await stateManager.addEvent({
          id: 'test-event',
          execution_id: executionId,
          event_type: 'test.event',
          event_data: { test: 'data' },
          timestamp: new Date()
        });
      }, 100);

      // Cleanup if test doesn't complete
      setTimeout(() => {
        if (!eventReceived) {
          unsubscribe();
          done();
        }
      }, 5000);
    });

    test('should handle WebSocket connection failures gracefully', () => {
      const mockFailingChannel = {
        subscribe: jest.fn(() => { throw new Error('WebSocket connection failed'); }),
        on: jest.fn(),
        unsubscribe: jest.fn()
      };

      // Mock Supabase to return failing channel
      jest.spyOn(mockSupabaseClient, 'channel').mockReturnValue(mockFailingChannel as any);

      expect(() => {
        stateManager.subscribeToExecution('test-execution', () => {});
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    test('should integrate with React components for workflow UI', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();

      mockServices.auth.getUserById.mockResolvedValue({
        id: 'test-user',
        role: 'student'
      });

      render(
        <WorkflowTestComponent 
          userId="test-user" 
          onWorkflowComplete={onComplete}
        />
      );

      expect(screen.getByTestId('workflow-status')).toHaveTextContent('idle');

      const startButton = screen.getByTestId('start-workflow');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-status')).toHaveTextContent('running');
      });

      expect(onComplete).toHaveBeenCalled();
    });

    test('should handle workflow errors in UI components', async () => {
      const user = userEvent.setup();
      
      // Mock workflow failure
      mockServices.auth.validateToken.mockRejectedValue(new Error('Auth service down'));

      render(<WorkflowTestComponent userId="test-user" />);

      const startButton = screen.getByTestId('start-workflow');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-status')).toHaveTextContent('error');
      });
    });

    test('should update UI based on workflow progress', async () => {
      const user = userEvent.setup();
      
      mockServices.auth.getUserById.mockResolvedValue({ id: 'test-user', role: 'student' });
      
      // Mock progressive updates
      let progressValue = 0;
      const mockProgressUpdate = jest.fn().mockImplementation(() => {
        progressValue += 25;
        return Promise.resolve({ progress: progressValue });
      });

      render(<WorkflowTestComponent userId="test-user" />);

      const startButton = screen.getByTestId('start-workflow');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-status')).toHaveTextContent('running');
      });
    });
  });

  describe('Notification Integration', () => {
    test('should send notifications on workflow completion', async () => {
      const workflowData = {
        userId: 'user-1',
        moduleId: 'notification-test',
        progress: 100,
        timeSpent: 3600,
        completedSections: ['all'],
        achievements: [{
          id: 'module-complete',
          title: 'Module Completed',
          description: 'Completed notification test module',
          icon: '🎉',
          category: 'progress' as const,
          points: 100,
          rarity: 'common' as const,
          unlockedAt: new Date(),
          requirements: []
        }],
        performanceMetrics: {
          accuracy: 0.95, speed: 0.85, consistency: 0.90, engagement: 0.95, retention: 0.88, difficulty_preference: 0.75
        }
      };

      const result = await educationalService.startStudentProgressTracking(workflowData);

      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'in_app',
          recipient: 'user-1',
          message: expect.stringContaining('Congratulations'),
          data: expect.objectContaining({
            achievement: expect.any(Object)
          })
        })
      );
    });

    test('should send error notifications on workflow failures', async () => {
      // Mock plugin failure
      mockPluginSystem.execute.mockRejectedValue(new Error('Critical plugin failure'));

      const result = await educationalService.startStudentProgressTracking({
        userId: 'user-1',
        moduleId: 'error-test',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        performanceMetrics: {
          accuracy: 0, speed: 0, consistency: 0, engagement: 0, retention: 0, difficulty_preference: 0.5
        }
      });

      expect(result.success).toBe(false);
      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email',
          priority: 'high',
          subject: expect.stringContaining('Error')
        })
      );
    });

    test('should batch notifications for efficiency', async () => {
      const multipleWorkflows = Array.from({ length: 5 }, (_, i) => ({
        userId: `user-${i + 1}`,
        moduleId: 'batch-test',
        progress: 100,
        timeSpent: 1200,
        completedSections: ['complete'],
        performanceMetrics: {
          accuracy: 0.85, speed: 0.75, consistency: 0.80, engagement: 0.90, retention: 0.75, difficulty_preference: 0.65
        }
      }));

      await Promise.all(
        multipleWorkflows.map(workflow => 
          educationalService.startStudentProgressTracking(workflow)
        )
      );

      expect(mockServices.notification.sendBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ recipient: 'user-1' }),
          expect.objectContaining({ recipient: 'user-5' })
        ])
      );
    });
  });

  describe('Analytics Integration', () => {
    test('should track workflow execution analytics', async () => {
      const workflowData = {
        userId: 'analytics-user',
        moduleId: 'analytics-module',
        progress: 75,
        timeSpent: 2400,
        completedSections: ['intro', 'main', 'practice'],
        performanceMetrics: {
          accuracy: 0.82, speed: 0.78, consistency: 0.85, engagement: 0.92, retention: 0.79, difficulty_preference: 0.68
        }
      };

      const result = await educationalService.startStudentProgressTracking(workflowData);

      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'workflow.execution.started',
          userId: 'analytics-user',
          properties: expect.objectContaining({
            workflow_type: 'student_progress',
            module_id: 'analytics-module'
          })
        })
      );
    });

    test('should track educational outcomes in analytics', async () => {
      const learningOutcomes = {
        conceptsMastered: ['collective-unconscious', 'shadow'],
        skillsImproved: ['self-reflection', 'analytical thinking'],
        performanceGrowth: 0.25,
        engagementIncrease: 0.15
      };

      await educationalService.trackLearningOutcomes('user-1', learningOutcomes);

      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'learning.outcomes.recorded',
          properties: expect.objectContaining(learningOutcomes)
        })
      );
    });

    test('should aggregate analytics across multiple workflow executions', async () => {
      const executionMetrics = [
        { executionId: 'exec-1', duration: 1200, success: true },
        { executionId: 'exec-2', duration: 1500, success: true },
        { executionId: 'exec-3', duration: 900, success: false }
      ];

      const aggregatedMetrics = await educationalService.aggregateWorkflowMetrics(executionMetrics);

      expect(aggregatedMetrics).toEqual({
        totalExecutions: 3,
        successRate: expect.closeTo(0.67, 2),
        averageDuration: 1200,
        performanceTrends: expect.any(Object)
      });
    });
  });

  describe('End-to-End Workflow Scenarios', () => {
    test('should complete full student learning journey workflow', async () => {
      // 1. Student enrolls in Jung psychology course
      const enrollmentData = {
        userId: 'student-e2e',
        courseId: 'analytical-psychology-101',
        learningGoals: ['understand jung theory', 'apply to personal growth']
      };

      const enrollmentResult = await educationalService.enrollInCourse(enrollmentData);
      expect(enrollmentResult.success).toBe(true);

      // 2. Progress through modules
      const progressUpdates = [
        { moduleId: 'intro-jung', progress: 100, completedSections: ['biography', 'key-concepts'] },
        { moduleId: 'collective-unconscious', progress: 100, completedSections: ['theory', 'examples'] },
        { moduleId: 'archetypes', progress: 75, completedSections: ['persona', 'shadow'] }
      ];

      for (const update of progressUpdates) {
        const result = await educationalService.updateStudentProgress(
          enrollmentResult.executionId!,
          { ...update, userId: 'student-e2e', timeSpent: 1800, performanceMetrics: {
            accuracy: 0.85, speed: 0.75, consistency: 0.80, engagement: 0.90, retention: 0.75, difficulty_preference: 0.70
          }}
        );
        expect(result.success).toBe(true);
      }

      // 3. Take assessment
      const assessmentResult = await educationalService.startAssessment({
        userId: 'student-e2e',
        assessmentId: 'jung-midterm',
        sessionId: 'session-e2e',
        questions: [],
        currentQuestion: 0,
        answers: [],
        startTime: new Date(),
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
          allowRetries: true,
          maxRetries: 2,
          showFeedback: 'after_completion',
          showScore: true,
          allowReview: true,
          proctoring: false
        }
      });

      expect(assessmentResult.success).toBe(true);

      // 4. Complete course and receive certificate
      const completionResult = await educationalService.completeCourse('student-e2e', 'analytical-psychology-101');
      expect(completionResult.certificateIssued).toBe(true);
    });

    test('should handle instructor approval workflow', async () => {
      // 1. Student submits assignment
      const assignmentSubmission = {
        studentId: 'student-approval',
        assignmentId: 'jung-essay',
        content: 'Analysis of shadow work in personal development...',
        submittedAt: new Date()
      };

      const submissionResult = await educationalService.submitAssignment(assignmentSubmission);
      expect(submissionResult.success).toBe(true);

      // 2. Workflow routes to instructor for review
      const approvalWorkflow = await educationalService.startApprovalWorkflow({
        contentId: submissionResult.assignmentId!,
        contentType: 'assignment',
        authorId: 'student-approval',
        reviewers: ['instructor-1'],
        status: { current: 'pending', history: [] },
        priority: 'normal',
        metadata: {
          category: 'assignment',
          estimatedReviewTime: 1800,
          contentLength: 2500,
          complexity: 'moderate',
          requiredExpertise: ['analytical-psychology']
        }
      });

      expect(approvalWorkflow.success).toBe(true);

      // 3. Instructor reviews and provides feedback
      const reviewResult = await educationalService.submitReview(approvalWorkflow.executionId!, {
        reviewerId: 'instructor-1',
        rating: 85,
        comments: 'Good understanding of shadow work concepts',
        suggestions: ['Expand on practical applications', 'Add more examples'],
        requirements: [],
        timestamp: new Date()
      });

      expect(reviewResult.approved).toBe(true);
    });

    test('should handle adaptive learning workflow', async () => {
      // 1. System assesses student learning style
      const learningStyleAssessment = {
        userId: 'adaptive-student',
        responses: [
          { question: 'preferred_content', answer: 'visual_diagrams' },
          { question: 'learning_pace', answer: 'moderate' },
          { question: 'difficulty_preference', answer: 'challenging' }
        ]
      };

      const styleResult = await educationalService.assessLearningStyle(learningStyleAssessment);
      expect(styleResult.profile.learningStyle.visual).toBeGreaterThan(0.7);

      // 2. System adapts content based on performance
      const performanceData = {
        userId: 'adaptive-student',
        topicId: 'complex-jung-theory',
        completionTime: 3600, // Took longer than expected
        accuracyScore: 0.65, // Lower accuracy
        engagementMetrics: {
          timeOnPage: 1800,
          interactionCount: 25,
          dropoffPoints: ['theoretical-section-2']
        },
        difficultyFeedback: 'too_hard'
      };

      const adaptationResult = await educationalService.adaptContentBasedOnPerformance(performanceData);
      expect(adaptationResult.adaptations).toContain('reduce_difficulty');
      expect(adaptationResult.contentChanges.addedSupport).toContain('glossary');

      // 3. System provides personalized recommendations
      const recommendations = await educationalService.getPersonalizedRecommendations('adaptive-student');
      expect(recommendations.contentSuggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ format: 'visual' }),
          expect.objectContaining({ difficulty: 'moderate' })
        ])
      );
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high concurrent workflow executions', async () => {
      const concurrentWorkflows = Array.from({ length: 50 }, (_, i) => ({
        userId: `concurrent-user-${i}`,
        moduleId: 'performance-test',
        progress: Math.floor(Math.random() * 100),
        timeSpent: Math.floor(Math.random() * 3600),
        completedSections: [`section-${i % 5}`],
        performanceMetrics: {
          accuracy: 0.7 + Math.random() * 0.3,
          speed: 0.6 + Math.random() * 0.4,
          consistency: 0.7 + Math.random() * 0.3,
          engagement: 0.8 + Math.random() * 0.2,
          retention: 0.6 + Math.random() * 0.4,
          difficulty_preference: 0.4 + Math.random() * 0.6
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        concurrentWorkflows.map(workflow => 
          educationalService.startStudentProgressTracking(workflow)
        )
      );
      const duration = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should optimize database queries for large datasets', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `execution-${i}`,
        workflow_id: 'bulk-test',
        status: 'completed' as ExecutionStatus,
        created_at: new Date(Date.now() - i * 86400000) // Spread over time
      }));

      // Mock database query
      mockServices.database.query.mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await stateManager.listExecutions({ limit: 100, offset: 0 });
      const queryDuration = Date.now() - startTime;

      expect(result).toHaveLength(100); // Should limit results
      expect(queryDuration).toBeLessThan(1000); // Should be fast with proper indexing
    });

    test('should handle workflow execution timeouts gracefully', async () => {
      // Mock slow workflow execution
      mockPluginSystem.execute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 10000))
      );

      const workflowWithTimeout = {
        userId: 'timeout-user',
        moduleId: 'slow-module',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        timeout: 5000, // 5 second timeout
        performanceMetrics: {
          accuracy: 0, speed: 0, consistency: 0, engagement: 0, retention: 0, difficulty_preference: 0.5
        }
      };

      const result = await educationalService.startStudentProgressTracking(workflowWithTimeout);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from transient database errors', async () => {
      let failCount = 0;
      mockServices.database.query.mockImplementation(() => {
        failCount++;
        if (failCount <= 2) {
          return Promise.reject(new Error('Connection timeout'));
        }
        return Promise.resolve([{ id: 'recovery-test' }]);
      });

      const result = await educationalService.startStudentProgressTracking({
        userId: 'recovery-user',
        moduleId: 'resilience-test',
        progress: 50,
        timeSpent: 1800,
        completedSections: ['intro'],
        performanceMetrics: {
          accuracy: 0.8, speed: 0.7, consistency: 0.75, engagement: 0.85, retention: 0.70, difficulty_preference: 0.65
        }
      });

      expect(result.success).toBe(true);
      expect(failCount).toBe(3); // Should retry and succeed
    });

    test('should handle partial workflow state corruption', async () => {
      // Simulate corrupted execution state
      const corruptedExecution = {
        id: 'corrupted-execution',
        workflow_id: 'test-workflow',
        status: 'running' as ExecutionStatus,
        variables: '{"invalid": json}', // Invalid JSON
        execution_history: 'not-an-array'
      };

      mockServices.database.query.mockResolvedValue([corruptedExecution]);

      const result = await educationalService.recoverCorruptedWorkflow('corrupted-execution');

      expect(result.recovered).toBe(true);
      expect(result.corrections).toEqual([
        'Fixed invalid JSON in variables',
        'Reconstructed execution history',
        'Reset workflow state to last known good state'
      ]);
    });
  });
});