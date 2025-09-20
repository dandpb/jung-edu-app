/**
 * Comprehensive test suite for Educational Workflow implementations
 * Tests course enrollment, assignment lifecycle, student progress and Jung psychology workflows
 */

import { EducationalWorkflowService } from '../EducationalWorkflowService';
import { WorkflowEngine } from '../WorkflowEngine';
import { WorkflowStateManager } from '../WorkflowStateManager';
import { 
  StudentProgressWorkflowData,
  LearningPathWorkflowData,
  AssessmentWorkflowData,
  AdaptiveContentWorkflowData,
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionStatus,
  Achievement,
  PerformanceMetrics
} from '../../../types/workflow';
import { createMockLLMProvider } from '../../../test-utils/mocks/llmProvider';

// Mock dependencies
const mockWorkflowEngine = {
  executeWorkflow: jest.fn(),
  startExecution: jest.fn(),
  pauseExecution: jest.fn(),
  resumeExecution: jest.fn(),
  cancelExecution: jest.fn(),
  processEvent: jest.fn()
};

const mockStateManager = {
  createExecution: jest.fn(),
  updateExecution: jest.fn(),
  updateExecutionVariables: jest.fn(),
  getExecution: jest.fn(),
  addEvent: jest.fn(),
  getEvents: jest.fn(),
  subscribeToExecution: jest.fn(),
  subscribeToExecutionEvents: jest.fn()
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
      { id: 'dream-analysis-visual', score: 0.9, reason: 'matches visual learning style' },
      { id: 'active-imagination-practice', score: 0.85, reason: 'builds on analytical strengths' }
    ])
  },
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn()
  }
};

describe('EducationalWorkflowService', () => {
  let educationalService: EducationalWorkflowService;
  let sampleStudentProgressData: StudentProgressWorkflowData;
  let sampleLearningPathData: LearningPathWorkflowData;
  let sampleAssessmentData: AssessmentWorkflowData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    educationalService = new EducationalWorkflowService(
      mockWorkflowEngine as any,
      mockStateManager as any,
      mockServices as any
    );

    sampleStudentProgressData = {
      userId: 'user-1',
      moduleId: 'jungian-psychology-101',
      progress: 75,
      timeSpent: 1800, // 30 minutes
      completedSections: ['introduction', 'collective-unconscious', 'archetypes'],
      currentSection: 'shadow-work',
      achievements: [{
        id: 'shadow-explorer',
        title: 'Shadow Explorer',
        description: 'Completed introduction to shadow work',
        icon: '🌑',
        category: 'knowledge',
        points: 100,
        rarity: 'common',
        unlockedAt: new Date(),
        requirements: [{ type: 'complete_modules', value: 1, operator: '>=' }]
      }],
      performanceMetrics: {
        accuracy: 0.85,
        speed: 0.75,
        consistency: 0.90,
        engagement: 0.95,
        retention: 0.80,
        difficulty_preference: 0.70
      }
    };

    sampleLearningPathData = {
      userId: 'user-1',
      pathId: 'analytical-psychology-mastery',
      currentModule: 'jungian-psychology-101',
      completedModules: ['psychology-foundations', 'freud-basics'],
      recommendedModules: ['dream-analysis-intro', 'active-imagination'],
      adaptationTriggers: [{
        type: 'performance',
        condition: 'accuracy < 0.7',
        threshold: 0.7,
        action: { type: 'adjust_difficulty', parameters: { adjustment: -0.2 } }
      }],
      personalizations: [{
        aspect: 'content_type',
        value: 'visual_heavy',
        confidence: 0.85,
        source: 'inferred'
      }]
    };

    sampleAssessmentData = {
      userId: 'user-1',
      assessmentId: 'jung-archetypes-quiz',
      sessionId: 'session-123',
      questions: [{
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the primary function of the Shadow archetype?',
        options: [
          { id: 'a', text: 'To represent repressed aspects of personality', isCorrect: true },
          { id: 'b', text: 'To guide conscious decision-making', isCorrect: false },
          { id: 'c', text: 'To connect with the collective unconscious', isCorrect: false },
          { id: 'd', text: 'To facilitate individuation', isCorrect: false }
        ],
        correctAnswer: 'a',
        points: 10,
        difficulty: 'intermediate',
        explanation: 'The Shadow represents the hidden or repressed aspects of the personality.'
      }],
      currentQuestion: 0,
      answers: [],
      timeLimit: 1800, // 30 minutes
      startTime: new Date(),
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        allowRetries: false,
        maxRetries: 0,
        showFeedback: 'after_completion',
        showScore: true,
        allowReview: true,
        proctoring: false
      }
    };
  });

  describe('Student Progress Workflow', () => {
    test('should start student progress tracking workflow', async () => {
      const mockExecution: WorkflowExecution = {
        id: 'execution-1',
        workflow_id: 'student-progress-tracking',
        user_id: 'user-1',
        status: 'running',
        variables: sampleStudentProgressData,
        execution_history: [],
        retry_count: 0,
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      mockWorkflowEngine.executeWorkflow.mockResolvedValue(mockExecution);

      const result = await educationalService.startStudentProgressTracking(sampleStudentProgressData);

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'progress_tracking',
          name: expect.stringContaining('Student Progress')
        }),
        expect.objectContaining({
          id: expect.any(String),
          variables: sampleStudentProgressData
        }),
        sampleStudentProgressData
      );
    });

    test('should update progress when section is completed', async () => {
      const progressUpdate = {
        ...sampleStudentProgressData,
        completedSections: [...sampleStudentProgressData.completedSections, 'shadow-work'],
        progress: 90,
        currentSection: 'anima-animus'
      };

      mockStateManager.updateExecution.mockResolvedValue({
        ...progressUpdate,
        id: 'execution-1'
      });

      const result = await educationalService.updateStudentProgress(
        'execution-1', 
        progressUpdate
      );

      expect(result.success).toBe(true);
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'execution-1',
        expect.objectContaining({
          variables: progressUpdate
        })
      );
    });

    test('should trigger achievement unlock when criteria met', async () => {
      const achievementCriteria = {
        completedSections: 5,
        minimumScore: 0.8,
        timeSpentMinimum: 3600
      };

      const progressWithAchievement = {
        ...sampleStudentProgressData,
        completedSections: Array.from({ length: 5 }, (_, i) => `section-${i + 1}`),
        performanceMetrics: { ...sampleStudentProgressData.performanceMetrics, accuracy: 0.85 },
        timeSpent: 4000
      };

      mockServices.database.query.mockResolvedValue([{
        id: 'achievement-1',
        title: 'Jungian Scholar',
        requirements: JSON.stringify(achievementCriteria)
      }]);

      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        id: 'execution-1'
      });

      const result = await educationalService.startStudentProgressTracking(progressWithAchievement);

      expect(mockServices.analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'achievement.unlocked',
          properties: expect.objectContaining({
            achievement_id: expect.any(String)
          })
        })
      );
    });

    test('should adapt difficulty based on performance metrics', async () => {
      const lowPerformanceData = {
        ...sampleStudentProgressData,
        performanceMetrics: {
          ...sampleStudentProgressData.performanceMetrics,
          accuracy: 0.45, // Low accuracy should trigger difficulty adjustment
          consistency: 0.50
        }
      };

      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        id: 'execution-1',
        variables: lowPerformanceData
      });

      await educationalService.startStudentProgressTracking(lowPerformanceData);

      // Should trigger adaptive difficulty adjustment
      expect(mockServices.ai.analyzePerformance).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: 0.45,
          consistency: 0.50
        })
      );
    });

    test('should handle Jung-specific progress milestones', async () => {
      const jungianMilestones = {
        ...sampleStudentProgressData,
        completedSections: [
          'collective-unconscious',
          'archetypes-overview',
          'shadow-integration',
          'anima-animus-balance',
          'self-realization'
        ]
      };

      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        id: 'execution-1'
      });

      const result = await educationalService.startStudentProgressTracking(jungianMilestones);

      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'in_app',
          message: expect.stringContaining('individuation journey'),
          data: expect.objectContaining({
            milestone: 'jungian_mastery'
          })
        })
      );
    });
  });

  describe('Learning Path Orchestration', () => {
    test('should create personalized learning path workflow', async () => {
      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        id: 'execution-2',
        variables: sampleLearningPathData
      });

      const result = await educationalService.createPersonalizedLearningPath(sampleLearningPathData);

      expect(result.success).toBe(true);
      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'learning_path',
          name: expect.stringContaining('Personalized Learning Path')
        }),
        expect.objectContaining({
          id: expect.any(String),
          variables: sampleLearningPathData
        }),
        sampleLearningPathData
      );
    });

    test('should recommend next modules based on progress and preferences', async () => {
      const userProfile = {
        learningStyle: { visual: 0.8, auditory: 0.3, kinesthetic: 0.5, reading: 0.6 },
        strengths: ['analytical thinking', 'pattern recognition'],
        weaknesses: ['memorization', 'speed'],
        goals: ['understand jung theory', 'apply to therapy']
      };

      mockServices.auth.getUserById.mockResolvedValue({
        id: 'user-1',
        profile: userProfile
      });

      mockServices.ai.recommendContent.mockResolvedValue([
        { id: 'dream-analysis-visual', score: 0.9, reason: 'matches visual learning style' },
        { id: 'active-imagination-practice', score: 0.85, reason: 'builds on analytical strengths' }
      ]);

      const recommendations = await educationalService.getNextModuleRecommendations('user-1', sampleLearningPathData);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].id).toBe('dream-analysis-visual');
      expect(mockServices.ai.recommendContent).toHaveBeenCalledWith(
        expect.objectContaining({
          learningStyle: userProfile.learningStyle
        }),
        expect.any(Array)
      );
    });

    test('should handle prerequisite validation for Jung modules', async () => {
      const pathWithPrerequisites = {
        ...sampleLearningPathData,
        currentModule: 'advanced-individuation',
        completedModules: ['psychology-foundations'] // Missing required Jung basics
      };

      const prerequisiteCheck = await educationalService.validatePrerequisites(
        'advanced-individuation',
        pathWithPrerequisites.completedModules
      );

      expect(prerequisiteCheck.valid).toBe(false);
      expect(prerequisiteCheck.missingPrerequisites).toContain('jungian-psychology-101');
      expect(prerequisiteCheck.recommendedPath).toEqual([
        'jungian-psychology-101',
        'archetypes-deep-dive',
        'advanced-individuation'
      ]);
    });

    test('should adapt learning path based on performance triggers', async () => {
      const pathWithTriggers = {
        ...sampleLearningPathData,
        adaptationTriggers: [
          {
            type: 'performance',
            condition: 'accuracy < 0.6',
            threshold: 0.6,
            action: { type: 'suggest_review', parameters: { topics: ['collective-unconscious'] } }
          }
        ]
      };

      const lowPerformanceEvent = {
        userId: 'user-1',
        moduleId: 'archetypes-advanced',
        performance: { accuracy: 0.55, retention: 0.40 }
      };

      mockWorkflowEngine.processEvent.mockResolvedValue({
        success: true,
        executionId: 'execution-2'
      });

      const result = await educationalService.processPerformanceEvent(lowPerformanceEvent, pathWithTriggers);

      expect(result.adaptationTriggered).toBe(true);
      expect(result.adaptationAction.type).toBe('suggest_review');
      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('review'),
          data: expect.objectContaining({
            topics: ['collective-unconscious']
          })
        })
      );
    });

    test('should handle Jung-specific learning path milestones', async () => {
      const jungianMasteryPath = {
        ...sampleLearningPathData,
        completedModules: [
          'psychology-foundations',
          'jungian-psychology-101',
          'collective-unconscious-deep',
          'archetypes-mastery',
          'shadow-work-advanced',
          'anima-animus-integration',
          'self-realization-practice'
        ]
      };

      const milestoneCheck = await educationalService.checkLearningPathMilestones(jungianMasteryPath);

      expect(milestoneCheck.milestonesReached).toContain('individuation_foundation');
      expect(milestoneCheck.nextMilestone).toBe('analytical_practitioner');
      expect(milestoneCheck.certificationEligible).toBe(true);
    });
  });

  describe('Assessment Workflows', () => {
    test('should start assessment workflow with proper initialization', async () => {
      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        id: 'assessment-execution-1',
        variables: sampleAssessmentData
      });

      const result = await educationalService.startAssessment(sampleAssessmentData);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('session-123');
      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'assessment',
          trigger: expect.objectContaining({
            type: 'manual',
            immediate: true
          })
        }),
        expect.objectContaining({
          id: expect.any(String),
          variables: sampleAssessmentData
        }),
        sampleAssessmentData
      );
    });

    test('should handle question progression with timing', async () => {
      const questionAnswer = {
        questionId: 'q1',
        answer: 'a',
        timeSpent: 45000, // 45 seconds
        confidence: 0.8
      };

      const updatedAssessmentData = {
        ...sampleAssessmentData,
        currentQuestion: 1,
        answers: [questionAnswer]
      };

      mockStateManager.getExecution.mockResolvedValue({
        id: 'assessment-execution-1',
        variables: {
          ...sampleAssessmentData,
          questions: [
            { id: 'q1', text: 'Question 1', points: 10 },
            { id: 'q2', text: 'Question 2', points: 15 },
            { id: 'q3', text: 'Question 3', points: 10 }
          ]
        }
      });
      mockStateManager.updateExecution.mockResolvedValue(updatedAssessmentData);

      const result = await educationalService.submitQuestionAnswer(
        'assessment-execution-1',
        questionAnswer
      );

      expect(result.success).toBe(true);
      expect(result.nextQuestion).toBeDefined();
      expect(mockStateManager.updateExecution).toHaveBeenCalledWith(
        'assessment-execution-1',
        expect.objectContaining({
          variables: expect.objectContaining({
            currentQuestion: 1,
            answers: expect.arrayContaining([questionAnswer])
          })
        })
      );
    });

    test('should calculate Jung-specific assessment scores', async () => {
      const completedAssessment = {
        ...sampleAssessmentData,
        answers: [
          { questionId: 'q1', answer: 'a', isCorrect: true, score: 10, timeSpent: 30000 },
          { questionId: 'q2', answer: 'b', isCorrect: false, score: 0, timeSpent: 45000 },
          { questionId: 'q3', answer: 'c', isCorrect: true, score: 15, timeSpent: 25000 }
        ],
        currentQuestion: 3
      };

      const scoreCalculation = await educationalService.calculateAssessmentScore(completedAssessment);

      expect(scoreCalculation).toEqual({
        totalScore: 25,
        maxScore: expect.any(Number),
        percentage: expect.any(Number),
        categoryScores: {
          'collective-unconscious': expect.any(Number),
          'archetypes': expect.any(Number),
          'shadow-work': expect.any(Number)
        },
        timeMetrics: {
          totalTime: 100000,
          averageTimePerQuestion: expect.any(Number),
          speedScore: expect.any(Number)
        },
        recommendations: expect.any(Array)
      });
    });

    test('should handle adaptive assessment question selection', async () => {
      const adaptiveSettings = {
        ...sampleAssessmentData,
        settings: {
          ...sampleAssessmentData.settings,
          adaptive: true,
          targetDifficulty: 'intermediate'
        }
      };

      const performanceHistory = {
        recentAccuracy: 0.75,
        averageResponseTime: 35000,
        strongConcepts: ['collective-unconscious'],
        weakConcepts: ['shadow-work']
      };

      mockServices.ai.recommendContent.mockResolvedValue([
        { id: 'shadow-q1', difficulty: 'beginner', concept: 'shadow-work' },
        { id: 'shadow-q2', difficulty: 'intermediate', concept: 'shadow-work' }
      ]);

      const nextQuestion = await educationalService.getAdaptiveNextQuestion(
        adaptiveSettings,
        performanceHistory
      );

      expect(nextQuestion.concept).toBe('shadow-work'); // Should focus on weak areas
      expect(['beginner', 'intermediate']).toContain(nextQuestion.difficulty);
    });

    test('should provide detailed Jung-concept feedback', async () => {
      const incorrectAnswer = {
        questionId: 'shadow-question-1',
        selectedAnswer: 'b',
        correctAnswer: 'a',
        concept: 'shadow-work',
        difficulty: 'intermediate'
      };

      const feedback = await educationalService.generateJungianFeedback(incorrectAnswer);

      expect(feedback).toEqual({
        isCorrect: false,
        explanation: expect.stringContaining('Shadow'),
        conceptReview: expect.objectContaining({
          concept: 'shadow-work',
          keyPoints: expect.any(Array),
          resources: expect.any(Array)
        }),
        studyRecommendations: expect.any(Array),
        relatedConcepts: expect.arrayContaining(['repression', 'persona', 'individuation'])
      });
    });

    test('should handle assessment timeout and auto-submission', async () => {
      const timedOutAssessment = {
        ...sampleAssessmentData,
        timeLimit: 1800,
        startTime: new Date(Date.now() - 1900000) // Started 31 minutes ago (over limit)
      };

      mockWorkflowEngine.processEvent.mockResolvedValue({
        success: true,
        action: 'auto_submit'
      });

      mockStateManager.updateExecutionVariables.mockResolvedValue({});
      mockStateManager.updateExecution.mockResolvedValue({});

      const result = await educationalService.handleAssessmentTimeout('assessment-execution-1');

      expect(result.autoSubmitted).toBe(true);
      expect(result.partialScore).toBeDefined();
    });
  });

  describe('Adaptive Content Workflows', () => {
    test('should select content variant based on learner profile', async () => {
      const adaptiveData: AdaptiveContentWorkflowData = {
        userId: 'user-1',
        topicId: 'jungian-archetypes',
        learnerProfile: {
          userId: 'user-1',
          learningStyle: { visual: 0.9, auditory: 0.3, kinesthetic: 0.4, reading: 0.5 },
          difficultyPreference: 0.7,
          pacePreference: 'medium',
          contentPreferences: [
            { type: 'video', preference: 0.9 },
            { type: 'interactive', preference: 0.8 },
            { type: 'text', preference: 0.4 }
          ],
          strengths: ['visual processing', 'pattern recognition'],
          weaknesses: ['abstract concepts', 'memorization'],
          goals: ['understand archetypes', 'apply to self-analysis'],
          background: ['psychology basics', 'some freud exposure'],
          adaptationHistory: []
        },
        contentVariants: [
          {
            id: 'archetypes-video-heavy',
            targetAudience: 'visual learners',
            difficulty: 0.7,
            format: 'video',
            estimatedTime: 25,
            prerequisites: ['psychology-basics'],
            content: { videos: 3, interactives: 2, text: 1 },
            effectiveness: 0.85
          },
          {
            id: 'archetypes-text-heavy',
            targetAudience: 'reading learners',
            difficulty: 0.8,
            format: 'text',
            estimatedTime: 35,
            prerequisites: ['psychology-basics'],
            content: { videos: 1, interactives: 1, text: 5 },
            effectiveness: 0.75
          }
        ],
        adaptationRules: [
          {
            id: 'visual-preference',
            trigger: { type: 'preference', condition: 'visual > 0.8', threshold: 0.8, action: { type: 'show_variant', parameters: {} } },
            action: { type: 'show_variant', parameters: { format: 'video' } },
            priority: 1,
            conditions: ['learningStyle.visual > 0.8'],
            enabled: true
          }
        ],
        performanceData: {
          accuracy: 0.75,
          completionTime: 1200,
          engagementScore: 0.85,
          retentionScore: 0.70,
          difficultyRating: 0.6,
          lastAssessment: new Date()
        }
      };

      const result = await educationalService.selectAdaptiveContent(adaptiveData);

      expect(result.success).toBe(true);
      expect(result.selectedVariant?.format).toBe('video'); // Should select video variant for visual learner
      expect(result.selectionRationale).toContain('visual learning preference');
    });

    test('should adapt content based on performance feedback', async () => {
      const performanceFeedback = {
        userId: 'user-1',
        topicId: 'shadow-work',
        completionTime: 2400, // Took longer than expected
        accuracyScore: 0.60, // Lower accuracy
        engagementMetrics: {
          timeOnPage: 1800,
          interactionCount: 15,
          dropoffPoints: ['complex-diagram-1', 'theoretical-section-3']
        },
        difficultyFeedback: 'too_hard'
      };

      const adaptationResult = await educationalService.adaptContentBasedOnPerformance(performanceFeedback);

      expect(adaptationResult.adaptations).toContain('reduce_difficulty');
      expect(adaptationResult.contentChanges).toEqual({
        difficulty: expect.any(Number), // Should be reduced
        addedSupport: ['glossary', 'concept-review'],
        removedComplexity: ['advanced-diagrams', 'theoretical-depth']
      });
    });

    test('should handle Jung-specific content adaptation', async () => {
      const jungianAdaptation = {
        userId: 'user-1',
        concept: 'individuation',
        currentUnderstanding: 'basic',
        personalRelevance: {
          hasTherapyExperience: true,
          personalGrowthGoals: ['self-awareness', 'shadow-integration'],
          culturalBackground: 'western',
          ageRange: '25-35'
        }
      };

      const adaptedContent = await educationalService.adaptJungianContent(jungianAdaptation);

      expect(adaptedContent.examples).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ relevance: 'therapy_context' }),
          expect.objectContaining({ relevance: 'personal_growth' })
        ])
      );
      expect(adaptedContent.exercises).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'shadow_dialogue' }),
          expect.objectContaining({ type: 'active_imagination' })
        ])
      );
    });
  });

  describe('Workflow Integration and Error Handling', () => {
    test('should handle workflow execution failures gracefully', async () => {
      mockWorkflowEngine.executeWorkflow.mockRejectedValue(new Error('Plugin execution failed'));

      const result = await educationalService.startStudentProgressTracking(sampleStudentProgressData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Plugin execution failed');
      expect(mockServices.notification.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email',
          subject: 'Workflow Execution Error',
          priority: 'high'
        })
      );
    });

    test('should recover from partial workflow failures', async () => {
      const partiallyFailedExecution = {
        id: 'execution-1',
        status: 'failed' as ExecutionStatus,
        error_message: 'Achievement calculation failed',
        variables: sampleStudentProgressData
      };

      mockStateManager.getExecution.mockResolvedValue(partiallyFailedExecution);
      mockWorkflowEngine.resumeExecution.mockResolvedValue({ success: true });

      const result = await educationalService.recoverFailedWorkflow('execution-1');

      expect(result.recovered).toBe(true);
      expect(mockWorkflowEngine.resumeExecution).toHaveBeenCalledWith('execution-1');
    });

    test('should handle concurrent user actions on same workflow', async () => {
      const concurrentUpdates = [
        { progress: 80, completedSections: ['intro', 'archetypes'] },
        { progress: 85, completedSections: ['intro', 'archetypes', 'shadow'] },
        { progress: 90, achievements: [{ id: 'new-achievement' }] }
      ];

      mockStateManager.updateExecution
        .mockResolvedValueOnce({ ...sampleStudentProgressData, ...concurrentUpdates[0] })
        .mockResolvedValueOnce({ ...sampleStudentProgressData, ...concurrentUpdates[1] })
        .mockResolvedValueOnce({ ...sampleStudentProgressData, ...concurrentUpdates[2] });

      const results = await Promise.all(
        concurrentUpdates.map((update, index) => 
          educationalService.updateStudentProgress(`execution-${index + 1}`, update)
        )
      );

      expect(results.every(r => r.success)).toBe(true);
      expect(mockStateManager.updateExecution).toHaveBeenCalledTimes(3);
    });

    test('should validate educational workflow data integrity', async () => {
      const invalidProgressData = {
        ...sampleStudentProgressData,
        progress: 150, // Invalid: over 100%
        timeSpent: -100, // Invalid: negative time
        completedSections: null // Invalid: should be array
      };

      const validationResult = await educationalService.validateWorkflowData(invalidProgressData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual([
        'Progress cannot exceed 100%',
        'Time spent cannot be negative',
        'Completed sections must be an array'
      ]);
    });
  });

  describe('Performance and Analytics', () => {
    test('should track educational workflow metrics', async () => {
      const metricsData = {
        workflowType: 'student_progress',
        executionTime: 1500,
        stepsCompleted: 5,
        errorsEncountered: 0,
        userEngagement: 0.85,
        educationalOutcomes: {
          learningObjectivesMet: 4,
          skillsImproved: ['analytical thinking', 'self-reflection'],
          knowledgeGained: 0.75
        }
      };

      await educationalService.trackWorkflowMetrics('execution-1', metricsData);

      expect(mockServices.analytics.track).toHaveBeenCalledWith({
        userId: 'user-1',
        event: 'educational_workflow.completed',
        properties: expect.objectContaining(metricsData),
        timestamp: expect.any(Date)
      });
    });

    test('should generate educational insights from workflow data', async () => {
      const workflowHistory = [
        { type: 'progress', outcome: 'completed', duration: 1200, score: 0.85 },
        { type: 'assessment', outcome: 'completed', duration: 800, score: 0.78 },
        { type: 'adaptive_content', outcome: 'completed', duration: 1500, score: 0.92 }
      ];

      mockServices.database.query.mockResolvedValue(workflowHistory);

      const insights = await educationalService.generateLearningInsights('user-1');

      expect(insights).toEqual({
        overallProgress: expect.any(Number),
        learningVelocity: expect.any(Number),
        strengthAreas: expect.any(Array),
        improvementAreas: expect.any(Array),
        recommendedActions: expect.any(Array),
        jungianProgressMap: expect.objectContaining({
          collectiveUnconscious: expect.any(Number),
          archetypes: expect.any(Number),
          shadowWork: expect.any(Number),
          individuationStage: expect.any(String)
        })
      });
    });

    test('should optimize workflow performance based on usage patterns', async () => {
      const usagePatterns = {
        peakUsageHours: [9, 14, 20], // 9am, 2pm, 8pm
        commonFailurePoints: ['achievement-calculation', 'ai-content-selection'],
        averageExecutionTime: 2500,
        userSatisfactionScore: 0.78
      };

      const optimizations = await educationalService.optimizeWorkflowPerformance(usagePatterns);

      expect(optimizations).toEqual({
        cacheStrategies: expect.arrayContaining(['user-profiles', 'content-variants']),
        parallelizationOpportunities: expect.any(Array),
        resourceScaling: expect.objectContaining({
          scaleUpHours: [9, 14, 20],
          scaleDownHours: expect.any(Array)
        }),
        failurePreventionMeasures: expect.any(Array)
      });
    });
  });
});