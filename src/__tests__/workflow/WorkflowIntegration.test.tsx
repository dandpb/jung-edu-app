/**
 * Integration tests for workflow system components
 * Tests the complete workflow system including engine, state manager, and educational services
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WorkflowEngine } from '../../services/workflow/WorkflowEngine';
import { WorkflowStateManager } from '../../services/workflow/WorkflowStateManager';
import { EducationalWorkflowService } from '../../services/workflow/EducationalWorkflowService';
import { WorkflowProgressVisualization } from '../../components/workflow/WorkflowProgressVisualization';
import {
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionStatus,
  StudentProgressWorkflowData,
  LearningPathWorkflowData,
  AssessmentWorkflowData
} from '../../types/workflow';
import { createMockLLMProvider } from '../../test-utils/mocks/llmProvider';

// Mock services
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
    getUserById: jest.fn().mockResolvedValue({
      id: 'user-1',
      role: 'student',
      profile: { learning_style: 'visual' }
    }),
    hasPermission: jest.fn().mockResolvedValue(true)
  },
  ai: {
    ...createMockLLMProvider(),
    analyzePerformance: jest.fn().mockResolvedValue({ recommendations: [] }),
    recommendContent: jest.fn().mockResolvedValue([
      { id: 'content-1', score: 0.9, reason: 'matches profile' }
    ])
  },
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
};

describe('Workflow Integration Tests', () => {
  let workflowEngine: WorkflowEngine;
  let stateManager: WorkflowStateManager;
  let educationalService: EducationalWorkflowService;
  let sampleWorkflow: WorkflowDefinition;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize workflow system components
    workflowEngine = new WorkflowEngine(mockServices as any, 5);
    stateManager = new WorkflowStateManager();
    educationalService = new EducationalWorkflowService(
      workflowEngine,
      stateManager,
      mockServices as any
    );

    // Sample workflow for testing
    sampleWorkflow = {
      id: 'jung-psychology-101',
      name: 'Introduction to Jung Psychology',
      description: 'Complete introduction to Jungian analytical psychology',
      version: '1.0.0',
      category: 'education',
      trigger: {
        type: 'manual',
        event: 'course_start',
        conditions: [],
        immediate: true,
        enabled: true
      },
      states: [
        {
          id: 'course_start',
          name: 'Course Start',
          type: 'task',
          isInitial: true,
          isFinal: false,
          actions: [{
            id: 'initialize_progress',
            type: 'execute_plugin',
            name: 'Initialize Progress',
            plugin: 'progress_tracker',
            config: { initialize: true }
          }]
        },
        {
          id: 'learning_phase',
          name: 'Learning Phase',
          type: 'task',
          isInitial: false,
          isFinal: false,
          actions: [{
            id: 'track_learning',
            type: 'execute_plugin',
            name: 'Track Learning',
            plugin: 'learning_tracker',
            config: { track: true }
          }]
        },
        {
          id: 'assessment_phase',
          name: 'Assessment Phase',
          type: 'task',
          isInitial: false,
          isFinal: false,
          actions: [{
            id: 'conduct_assessment',
            type: 'execute_plugin',
            name: 'Conduct Assessment',
            plugin: 'assessment_engine',
            config: { conduct: true }
          }]
        },
        {
          id: 'completion',
          name: 'Course Completion',
          type: 'end',
          isInitial: false,
          isFinal: true,
          actions: []
        }
      ],
      transitions: [
        {
          id: 'start_to_learning',
          from: 'course_start',
          to: 'learning_phase',
          priority: 1
        },
        {
          id: 'learning_to_assessment',
          from: 'learning_phase',
          to: 'assessment_phase',
          priority: 1
        },
        {
          id: 'assessment_to_completion',
          from: 'assessment_phase',
          to: 'completion',
          priority: 1
        }
      ],
      variables: [
        {
          name: 'userId',
          type: 'string',
          required: true,
          description: 'Student user ID'
        },
        {
          name: 'courseId',
          type: 'string',
          required: true,
          description: 'Course identifier'
        }
      ],
      metadata: {
        tags: ['psychology', 'jung', 'education'],
        author: 'system',
        dependencies: []
      },
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      is_active: true
    };
  });

  describe('End-to-End Student Progress Workflow', () => {
    test('should complete full student progress tracking workflow', async () => {
      const progressData: StudentProgressWorkflowData = {
        userId: 'student-1',
        moduleId: 'jung-psychology-101',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        currentSection: 'introduction',
        achievements: [],
        performanceMetrics: {
          accuracy: 0,
          speed: 0,
          consistency: 0,
          engagement: 0,
          retention: 0,
          difficulty_preference: 0.5
        }
      };

      // Start the workflow
      const result = await educationalService.startStudentProgressTracking(progressData);

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();

      // Simulate progress updates
      const updatedProgress = {
        ...progressData,
        progress: 25,
        timeSpent: 300, // 5 minutes
        completedSections: ['introduction'],
        currentSection: 'collective-unconscious',
        performanceMetrics: {
          ...progressData.performanceMetrics,
          accuracy: 0.85,
          engagement: 0.9
        }
      };

      const updateResult = await educationalService.updateStudentProgress(
        result.executionId!,
        updatedProgress
      );

      expect(updateResult.success).toBe(true);

      // Verify analytics tracking
      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining('progress')
        })
      );
    });

    test('should handle Jung-specific milestone achievements', async () => {
      const advancedProgressData: StudentProgressWorkflowData = {
        userId: 'student-1',
        moduleId: 'jung-psychology-101',
        progress: 100,
        timeSpent: 7200, // 2 hours
        completedSections: [
          'introduction',
          'collective-unconscious',
          'archetypes-overview',
          'shadow-integration',
          'anima-animus-balance',
          'self-realization'
        ],
        currentSection: 'completion',
        achievements: [],
        performanceMetrics: {
          accuracy: 0.92,
          speed: 0.8,
          consistency: 0.95,
          engagement: 0.98,
          retention: 0.89,
          difficulty_preference: 0.7
        }
      };

      const result = await educationalService.startStudentProgressTracking(advancedProgressData);

      expect(result.success).toBe(true);

      // Should trigger Jung-specific notifications
      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('individuation journey'),
          data: expect.objectContaining({
            milestone: 'jungian_mastery'
          })
        })
      );

      // Should track achievement unlock
      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'achievement.unlocked',
          properties: expect.objectContaining({
            achievement_id: 'jungian_scholar'
          })
        })
      );
    });
  });

  describe('Learning Path Orchestration Integration', () => {
    test('should create and execute personalized learning path', async () => {
      const learningPathData: LearningPathWorkflowData = {
        userId: 'student-1',
        pathId: 'analytical-psychology-mastery',
        currentModule: 'jung-psychology-101',
        completedModules: ['psychology-foundations'],
        recommendedModules: ['dream-analysis', 'active-imagination'],
        adaptationTriggers: [],
        personalizations: []
      };

      const result = await educationalService.createPersonalizedLearningPath(learningPathData);

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();

      // Get module recommendations
      const recommendations = await educationalService.getNextModuleRecommendations(
        'student-1',
        learningPathData
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toEqual(
        expect.objectContaining({
          id: 'content-1',
          score: 0.9,
          reason: 'matches profile'
        })
      );
    });

    test('should validate prerequisites for advanced Jung modules', async () => {
      const prerequisiteCheck = await educationalService.validatePrerequisites(
        'advanced-individuation',
        ['psychology-foundations'] // Missing jungian-psychology-101
      );

      expect(prerequisiteCheck.valid).toBe(false);
      expect(prerequisiteCheck.missingPrerequisites).toContain('jungian-psychology-101');
      expect(prerequisiteCheck.recommendedPath).toEqual([
        'jungian-psychology-101',
        'archetypes-deep-dive',
        'advanced-individuation'
      ]);
    });
  });

  describe('Assessment Workflow Integration', () => {
    test('should execute complete assessment workflow', async () => {
      const assessmentData: AssessmentWorkflowData = {
        userId: 'student-1',
        assessmentId: 'jung-archetypes-quiz',
        sessionId: 'session-123',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            question: 'What is the Shadow archetype?',
            options: [
              { id: 'a', text: 'Repressed aspects', isCorrect: true },
              { id: 'b', text: 'Conscious ego', isCorrect: false }
            ],
            correctAnswer: 'a',
            points: 10,
            difficulty: 'beginner',
            explanation: 'The Shadow represents repressed aspects of personality'
          }
        ],
        currentQuestion: 0,
        answers: [],
        timeLimit: 1800,
        startTime: new Date(),
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
          allowRetries: false,
          maxRetries: 0,
          showFeedback: 'immediate',
          showScore: true,
          allowReview: true,
          proctoring: false
        }
      };

      // Start assessment
      const startResult = await educationalService.startAssessment(assessmentData);
      expect(startResult.success).toBe(true);
      expect(startResult.sessionId).toBe('session-123');

      // Submit answer
      const answerData = {
        questionId: 'q1',
        answer: 'a',
        timeSpent: 45000,
        confidence: 0.8
      };

      // Mock the execution for answer submission
      jest.spyOn(stateManager, 'getExecution').mockResolvedValue({
        id: 'execution-1',
        workflow_id: 'assessment-jung-archetypes-quiz',
        user_id: 'student-1',
        status: 'running' as ExecutionStatus,
        variables: assessmentData,
        input_data: assessmentData,
        execution_history: [],
        retry_count: 0,
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      jest.spyOn(stateManager, 'updateExecution').mockResolvedValue({
        id: 'execution-1',
        workflow_id: 'assessment-jung-archetypes-quiz',
        user_id: 'student-1',
        status: 'running' as ExecutionStatus,
        variables: {
          ...assessmentData,
          currentQuestion: 1,
          answers: [answerData]
        },
        input_data: assessmentData,
        execution_history: [],
        retry_count: 0,
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      const submitResult = await educationalService.submitQuestionAnswer(
        'execution-1',
        answerData
      );

      expect(submitResult.success).toBe(true);
      expect(submitResult.nextQuestion).toBeNull(); // No more questions

      // Calculate final score
      const scoreData = {
        ...assessmentData,
        answers: [{ ...answerData, score: 10, isCorrect: true }]
      };

      const scoreResult = await educationalService.calculateAssessmentScore(scoreData);

      expect(scoreResult.totalScore).toBe(10);
      expect(scoreResult.percentage).toBe(100);
      expect(scoreResult.categoryScores).toBeDefined();
    });
  });

  describe('React Component Integration', () => {
    test('should render workflow progress visualization', async () => {
      const mockExecution: WorkflowExecution = {
        id: 'execution-1',
        workflow_id: 'jung-psychology-101',
        user_id: 'student-1',
        status: 'running',
        current_state: 'learning_phase',
        variables: {
          userId: 'student-1',
          progress: 65,
          timeSpent: 3600,
          completedSections: ['introduction', 'collective-unconscious'],
          currentSection: 'archetypes',
          jungian_concept_progress: {
            'collective-unconscious': 90,
            'archetypes': 65,
            'shadow-work': 30
          }
        },
        input_data: {},
        execution_history: [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            action: 'workflow_started',
            state: 'course_start'
          },
          {
            timestamp: new Date('2024-01-01T10:30:00Z'),
            action: 'state_transition',
            state: 'learning_phase'
          }
        ],
        retry_count: 0,
        started_at: new Date('2024-01-01T10:00:00Z'),
        created_at: new Date('2024-01-01T10:00:00Z'),
        updated_at: new Date('2024-01-01T10:30:00Z')
      };

      render(
        <WorkflowProgressVisualization
          execution={mockExecution}
          realTimeUpdates={false}
        />
      );

      // Check basic rendering
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();

      // Check Jung-specific features
      expect(screen.getByText('Jungian Stage: Exploration')).toBeInTheDocument();

      // Switch to detailed view
      fireEvent.click(screen.getByText('Detailed'));

      await waitFor(() => {
        expect(screen.getByText('Student Progress Details')).toBeInTheDocument();
        expect(screen.getByText('Jung Concept Progress')).toBeInTheDocument();
      });

      // Check timeline view
      fireEvent.click(screen.getByText('Timeline'));

      await waitFor(() => {
        expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
        expect(screen.getByText('workflow_started')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle workflow execution failures gracefully', async () => {
      // Mock workflow engine to throw error
      jest.spyOn(workflowEngine, 'executeWorkflow').mockRejectedValue(
        new Error('Plugin execution failed')
      );

      const progressData: StudentProgressWorkflowData = {
        userId: 'student-1',
        moduleId: 'jung-psychology-101',
        progress: 0,
        timeSpent: 0,
        completedSections: [],
        currentSection: 'introduction',
        achievements: [],
        performanceMetrics: {
          accuracy: 0,
          speed: 0,
          consistency: 0,
          engagement: 0,
          retention: 0,
          difficulty_preference: 0.5
        }
      };

      const result = await educationalService.startStudentProgressTracking(progressData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Plugin execution failed');

      // Should send error notification
      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email',
          subject: 'Workflow Execution Error',
          priority: 'high'
        })
      );
    });

    test('should recover from partial workflow failures', async () => {
      const failedExecution: WorkflowExecution = {
        id: 'execution-1',
        workflow_id: 'jung-psychology-101',
        user_id: 'student-1',
        status: 'failed',
        current_state: 'learning_phase',
        variables: {},
        input_data: {},
        execution_history: [],
        error_message: 'Achievement calculation failed',
        retry_count: 1,
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      jest.spyOn(stateManager, 'getExecution').mockResolvedValue(failedExecution);
      jest.spyOn(workflowEngine, 'resumeExecution').mockResolvedValue({ success: true });

      const result = await educationalService.recoverFailedWorkflow('execution-1');

      expect(result.recovered).toBe(true);
      expect(workflowEngine.resumeExecution).toHaveBeenCalledWith('execution-1');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent workflow executions', async () => {
      const concurrentProgressData = Array.from({ length: 3 }, (_, i) => ({
        userId: `student-${i + 1}`,
        moduleId: 'jung-psychology-101',
        progress: 50,
        timeSpent: 1800,
        completedSections: ['introduction'],
        currentSection: 'collective-unconscious',
        achievements: [],
        performanceMetrics: {
          accuracy: 0.8,
          speed: 0.7,
          consistency: 0.85,
          engagement: 0.9,
          retention: 0.75,
          difficulty_preference: 0.6
        }
      }));

      const results = await Promise.all(
        concurrentProgressData.map(data =>
          educationalService.startStudentProgressTracking(data)
        )
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.executionId).toBeDefined();
      });
    });

    test('should track workflow performance metrics', async () => {
      const progressData: StudentProgressWorkflowData = {
        userId: 'student-1',
        moduleId: 'jung-psychology-101',
        progress: 100,
        timeSpent: 5400, // 90 minutes
        completedSections: ['introduction', 'collective-unconscious', 'archetypes'],
        currentSection: 'completion',
        achievements: [
          {
            id: 'jung-scholar',
            title: 'Jung Scholar',
            description: 'Completed Jung psychology course',
            icon: '🎓',
            category: 'academic',
            points: 500,
            rarity: 'rare',
            unlockedAt: new Date(),
            requirements: []
          }
        ],
        performanceMetrics: {
          accuracy: 0.95,
          speed: 0.85,
          consistency: 0.92,
          engagement: 0.98,
          retention: 0.88,
          difficulty_preference: 0.75
        }
      };

      const result = await educationalService.startStudentProgressTracking(progressData);
      expect(result.success).toBe(true);

      // Track metrics
      const metricsData = {
        workflowType: 'student_progress',
        executionTime: 5400,
        stepsCompleted: 3,
        errorsEncountered: 0,
        userEngagement: 0.98,
        educationalOutcomes: {
          learningObjectivesMet: 3,
          skillsImproved: ['analytical thinking', 'self-reflection'],
          knowledgeGained: 0.95
        }
      };

      await educationalService.trackWorkflowMetrics(result.executionId!, metricsData);

      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'educational_workflow.completed',
          properties: expect.objectContaining(metricsData)
        })
      );
    });
  });

  afterEach(async () => {
    // Cleanup resources
    await workflowEngine.cleanup();
    await stateManager.cleanup();
  });
});