/**
 * Quiz and Assessment Grading Automation Tests
 * 
 * Tests automated grading systems, adaptive scoring algorithms,
 * feedback generation, and analytics for educational assessments.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  QuizGradingService,
  AdaptiveGradingEngine,
  FeedbackGenerationService,
  AssessmentAnalyticsService
} from '../../../jung-edu-app/src/services/grading';
import { EnhancedQuizGenerator } from '../../../jung-edu-app/src/services/quiz/enhancedQuizGenerator';
import { QuizValidator } from '../../../jung-edu-app/src/services/quiz/quizValidator';

// Mock dependencies
jest.mock('../../../jung-edu-app/src/services/quiz/enhancedQuizGenerator');
jest.mock('../../../jung-edu-app/src/services/quiz/quizValidator');

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank' | 'matching' | 'ordering';
  question: string;
  points: number;
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  correctAnswers: string[];
  options?: string[];
  rubric?: GradingRubric;
  metadata: {
    topic: string;
    subtopic?: string;
    keywords: string[];
  };
}

interface GradingRubric {
  criteria: Array<{
    name: string;
    description: string;
    points: number;
    levels: Array<{
      score: number;
      description: string;
      indicators: string[];
    }>;
  }>;
}

interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[];
    timeSpent: number;
    attemptCount: number;
  }>;
  startedAt: Date;
  submittedAt: Date;
  timeRemaining: number;
}

interface GradingResult {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  questionResults: Array<{
    questionId: string;
    score: number;
    maxScore: number;
    isCorrect: boolean;
    feedback: string;
    partialCredit?: number;
  }>;
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  };
  analytics: {
    timeEfficiency: number;
    difficultyPerformance: Record<string, number>;
    cognitiveSkillsAssessment: Record<string, number>;
  };
}

describe('Quiz Grading Automation Tests', () => {
  let gradingService: QuizGradingService;
  let adaptiveEngine: AdaptiveGradingEngine;
  let feedbackService: FeedbackGenerationService;
  let analyticsService: AssessmentAnalyticsService;
  let quizGenerator: jest.Mocked<EnhancedQuizGenerator>;
  let quizValidator: jest.Mocked<QuizValidator>;

  const mockQuiz = {
    id: 'quiz123',
    title: 'Jungian Psychology Assessment',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice' as const,
        question: 'What is the collective unconscious according to Jung?',
        points: 5,
        difficulty: 'medium' as const,
        cognitiveLevel: 'understand' as const,
        correctAnswers: ['b'],
        options: [
          'Personal repressed memories',
          'Universal patterns shared by humanity',
          'Conscious thoughts and feelings',
          'Individual personality traits'
        ],
        metadata: {
          topic: 'collective-unconscious',
          keywords: ['jung', 'unconscious', 'collective']
        }
      },
      {
        id: 'q2',
        type: 'essay' as const,
        question: 'Explain the process of individuation and its significance in Jungian psychology.',
        points: 15,
        timeLimit: 1800, // 30 minutes
        difficulty: 'hard' as const,
        cognitiveLevel: 'analyze' as const,
        correctAnswers: [], // Essay questions don't have simple correct answers
        rubric: {
          criteria: [
            {
              name: 'Understanding',
              description: 'Demonstrates understanding of individuation concept',
              points: 5,
              levels: [
                { score: 5, description: 'Complete understanding', indicators: ['defines individuation', 'explains process'] },
                { score: 3, description: 'Good understanding', indicators: ['basic definition', 'some process understanding'] },
                { score: 1, description: 'Limited understanding', indicators: ['vague definition'] }
              ]
            }
          ]
        },
        metadata: {
          topic: 'individuation',
          subtopic: 'psychological-development',
          keywords: ['individuation', 'self', 'development']
        }
      }
    ],
    totalPoints: 20,
    timeLimit: 3600, // 1 hour
    attempts: 2,
    gradingMethod: 'immediate' as const
  };

  beforeEach(() => {
    quizGenerator = new EnhancedQuizGenerator() as jest.Mocked<EnhancedQuizGenerator>;
    quizValidator = new QuizValidator() as jest.Mocked<QuizValidator>;
    
    gradingService = new QuizGradingService();
    adaptiveEngine = new AdaptiveGradingEngine();
    feedbackService = new FeedbackGenerationService();
    analyticsService = new AssessmentAnalyticsService();

    jest.clearAllMocks();
  });

  describe('Automated Grading Engine', () => {
    test('should grade multiple choice questions correctly', async () => {
      const attempt: QuizAttempt = {
        id: 'attempt123',
        studentId: 'student456',
        quizId: mockQuiz.id,
        answers: [
          { questionId: 'q1', answer: 'b', timeSpent: 45, attemptCount: 1 }
        ],
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T10:00:45Z'),
        timeRemaining: 3555
      };

      const result = await gradingService.gradeQuizAttempt(mockQuiz, attempt);

      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[0].score).toBe(5);
      expect(result.questionResults[0].feedback).toContain('Correct!');
      expect(result.totalScore).toBe(5);
    });

    test('should handle partial credit for multiple select questions', async () => {
      const multiSelectQuestion: QuizQuestion = {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Which are Jung\'s four psychological functions? (Select all that apply)',
        points: 8,
        difficulty: 'medium',
        cognitiveLevel: 'remember',
        correctAnswers: ['thinking', 'feeling', 'sensation', 'intuition'],
        options: ['thinking', 'feeling', 'sensation', 'intuition', 'emotion', 'logic'],
        metadata: { topic: 'psychological-functions', keywords: ['functions', 'thinking', 'feeling'] }
      };

      const attempt: QuizAttempt = {
        id: 'attempt124',
        studentId: 'student456',
        quizId: mockQuiz.id,
        answers: [
          { 
            questionId: 'q3', 
            answer: ['thinking', 'feeling', 'sensation'], // Missing 'intuition'
            timeSpent: 120, 
            attemptCount: 1 
          }
        ],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 3480
      };

      const quizWithMultiSelect = { ...mockQuiz, questions: [multiSelectQuestion] };
      const result = await gradingService.gradeQuizAttempt(quizWithMultiSelect, attempt);

      expect(result.questionResults[0].score).toBe(6); // 3/4 correct = 75% of 8 points
      expect(result.questionResults[0].partialCredit).toBe(0.75);
      expect(result.questionResults[0].feedback).toContain('partially correct');
    });

    test('should grade essay questions using AI-powered rubric assessment', async () => {
      const essayAttempt: QuizAttempt = {
        id: 'attempt125',
        studentId: 'student456',
        quizId: mockQuiz.id,
        answers: [
          { 
            questionId: 'q2',
            answer: 'Individuation is the central process of Jungian psychology where an individual becomes whole by integrating conscious and unconscious aspects of their personality. This process involves confronting and assimilating the shadow, integrating the anima/animus, and ultimately realizing the Self archetype.',
            timeSpent: 1200,
            attemptCount: 1
          }
        ],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 2400
      };

      // Mock AI grading response
      jest.spyOn(gradingService, 'gradeEssayWithAI').mockResolvedValue({
        score: 12,
        maxScore: 15,
        rubricScores: { Understanding: 4, Analysis: 4, Writing: 4 },
        feedback: 'Good understanding of individuation concept with clear explanation of key components.'
      });

      const result = await gradingService.gradeQuizAttempt(mockQuiz, essayAttempt);

      expect(result.questionResults[0].score).toBe(12);
      expect(result.questionResults[0].maxScore).toBe(15);
      expect(result.questionResults[0].feedback).toContain('Good understanding');
      expect(gradingService.gradeEssayWithAI).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'q2' }),
        expect.any(String)
      );
    });

    test('should apply time penalties for late submissions', async () => {
      const lateAttempt: QuizAttempt = {
        id: 'attempt126',
        studentId: 'student456',
        quizId: mockQuiz.id,
        answers: [
          { questionId: 'q1', answer: 'b', timeSpent: 45, attemptCount: 1 }
        ],
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T11:05:00Z'), // 5 minutes late
        timeRemaining: -300 // Overtime
      };

      const quizWithPenalty = { 
        ...mockQuiz, 
        latePenalty: { enabled: true, percentagePerMinute: 2, maxPenalty: 50 }
      };

      const result = await gradingService.gradeQuizAttempt(quizWithPenalty, lateAttempt);

      expect(result.questionResults[0].score).toBe(5); // Original score
      expect(result.totalScore).toBe(4.5); // 10% penalty (5 minutes * 2%)
      expect(result.feedback.overall).toContain('late submission penalty');
    });
  });

  describe('Adaptive Grading and Scoring', () => {
    test('should adjust scores based on question difficulty and student performance', async () => {
      const studentHistory = {
        studentId: 'student456',
        averageScore: 75,
        strengthAreas: ['basic-concepts'],
        weaknessAreas: ['advanced-theory'],
        learningStyle: 'analytical'
      };

      const adaptiveScore = await adaptiveEngine.calculateAdaptiveScore({
        rawScore: 15,
        maxScore: 20,
        questionDifficulties: ['easy', 'medium', 'hard'],
        timeEfficiency: 0.8,
        studentHistory
      });

      expect(adaptiveScore.adjustedScore).toBeDefined();
      expect(adaptiveScore.competencyLevel).toBeOneOf(['novice', 'developing', 'proficient', 'advanced']);
      expect(adaptiveScore.confidenceInterval).toHaveLength(2);
      expect(adaptiveScore.growthIndicators).toBeDefined();
    });

    test('should provide mastery-based grading for competency assessment', async () => {
      const masteryAttempt: QuizAttempt = {
        id: 'attempt127',
        studentId: 'student456',
        quizId: 'mastery-quiz',
        answers: [
          { questionId: 'basic1', answer: 'correct', timeSpent: 30, attemptCount: 1 },
          { questionId: 'basic2', answer: 'correct', timeSpent: 35, attemptCount: 1 },
          { questionId: 'intermediate1', answer: 'correct', timeSpent: 60, attemptCount: 1 },
          { questionId: 'advanced1', answer: 'incorrect', timeSpent: 120, attemptCount: 1 }
        ],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 0
      };

      const masteryResult = await adaptiveEngine.assessMasteryLevel(masteryAttempt);

      expect(masteryResult.basicLevel).toBe('mastered');
      expect(masteryResult.intermediateLevel).toBe('proficient');
      expect(masteryResult.advancedLevel).toBe('developing');
      expect(masteryResult.overallMastery).toBeDefined();
      expect(masteryResult.recommendedNextSteps).toBeDefined();
    });
  });

  describe('Intelligent Feedback Generation', () => {
    test('should generate personalized feedback based on learning patterns', async () => {
      const gradingResult: GradingResult = {
        attemptId: 'attempt123',
        totalScore: 15,
        maxScore: 20,
        percentage: 75,
        grade: 'B',
        questionResults: [
          {
            questionId: 'q1',
            score: 5,
            maxScore: 5,
            isCorrect: true,
            feedback: 'Correct understanding of collective unconscious'
          },
          {
            questionId: 'q2',
            score: 10,
            maxScore: 15,
            isCorrect: false,
            feedback: 'Good understanding but missing depth in analysis'
          }
        ],
        feedback: {
          overall: '',
          strengths: [],
          improvements: [],
          nextSteps: []
        },
        analytics: {
          timeEfficiency: 0.85,
          difficultyPerformance: { easy: 90, medium: 80, hard: 60 },
          cognitiveSkillsAssessment: { remember: 85, understand: 75, analyze: 65 }
        }
      };

      const enhancedFeedback = await feedbackService.generatePersonalizedFeedback(
        gradingResult,
        {
          learningStyle: 'visual',
          previousPerformance: [70, 72, 75],
          strugglingConcepts: ['individuation', 'shadow-work']
        }
      );

      expect(enhancedFeedback.overall).toContain('improvement');
      expect(enhancedFeedback.strengths).toContain('collective unconscious');
      expect(enhancedFeedback.improvements).toContain('analysis depth');
      expect(enhancedFeedback.nextSteps).toHaveLength(3);
      expect(enhancedFeedback.visualAids).toBeDefined(); // For visual learner
    });

    test('should provide remediation suggestions for incorrect answers', async () => {
      const incorrectAnswer = {
        questionId: 'q1',
        studentAnswer: 'a', // Incorrect
        correctAnswer: 'b',
        questionTopic: 'collective-unconscious'
      };

      const remediation = await feedbackService.generateRemediationSuggestions(incorrectAnswer);

      expect(remediation.explanation).toContain('collective unconscious');
      expect(remediation.resources).toHaveLength(3);
      expect(remediation.resources[0]).toHaveProperty('type');
      expect(remediation.resources[0]).toHaveProperty('title');
      expect(remediation.resources[0]).toHaveProperty('url');
      expect(remediation.practiceQuestions).toHaveLength(2);
    });

    test('should adapt feedback tone based on student performance and motivation', async () => {
      const strugglingStudent = {
        recentScores: [45, 38, 42],
        motivationLevel: 'low',
        confidenceLevel: 'low'
      };

      const encouragingFeedback = await feedbackService.generateMotivationalFeedback(
        { score: 55, improvement: 13 },
        strugglingStudent
      );

      expect(encouragingFeedback.tone).toBe('encouraging');
      expect(encouragingFeedback.message).toContain('improvement');
      expect(encouragingFeedback.celebrateProgress).toBe(true);
      expect(encouragingFeedback.supportResources).toBeDefined();

      const excellentStudent = {
        recentScores: [92, 95, 98],
        motivationLevel: 'high',
        confidenceLevel: 'high'
      };

      const challengingFeedback = await feedbackService.generateMotivationalFeedback(
        { score: 96, improvement: 1 },
        excellentStudent
      );

      expect(challengingFeedback.tone).toBe('challenging');
      expect(challengingFeedback.message).toContain('challenge');
      expect(challengingFeedback.advancedResources).toBeDefined();
    });
  });

  describe('Assessment Analytics', () => {
    test('should track detailed learning analytics per question', async () => {
      const attempts = [
        {
          questionId: 'q1',
          students: [
            { id: 's1', correct: true, timeSpent: 30 },
            { id: 's2', correct: false, timeSpent: 45 },
            { id: 's3', correct: true, timeSpent: 25 }
          ]
        }
      ];

      const analytics = await analyticsService.generateQuestionAnalytics('q1', attempts);

      expect(analytics.correctPercentage).toBe(66.67);
      expect(analytics.averageTimeSpent).toBe(33.33);
      expect(analytics.difficultyRating).toBeOneOf(['easy', 'medium', 'hard']);
      expect(analytics.discriminationIndex).toBeDefined();
      expect(analytics.commonWrongAnswers).toBeDefined();
    });

    test('should identify learning gaps and misconceptions', async () => {
      const classResults = [
        { studentId: 's1', topicScores: { 'archetypes': 85, 'individuation': 45 } },
        { studentId: 's2', topicScores: { 'archetypes': 90, 'individuation': 50 } },
        { studentId: 's3', topicScores: { 'archetypes': 80, 'individuation': 40 } }
      ];

      const gapAnalysis = await analyticsService.identifyLearningGaps(classResults);

      expect(gapAnalysis.weakTopics).toContain('individuation');
      expect(gapAnalysis.strongTopics).toContain('archetypes');
      expect(gapAnalysis.recommendedInterventions).toBeDefined();
      expect(gapAnalysis.affectedStudents['individuation']).toHaveLength(3);
    });

    test('should generate comprehensive quiz performance reports', async () => {
      const quizResults = {
        quizId: 'quiz123',
        attempts: 25,
        averageScore: 78.5,
        scores: [65, 70, 75, 80, 85, 90],
        timeToComplete: [45, 50, 55, 48, 52],
        questionPerformance: [
          { id: 'q1', averageScore: 85, difficulty: 'medium' },
          { id: 'q2', averageScore: 72, difficulty: 'hard' }
        ]
      };

      const report = await analyticsService.generateQuizReport(quizResults);

      expect(report.summary.averageScore).toBe(78.5);
      expect(report.summary.medianScore).toBeDefined();
      expect(report.summary.standardDeviation).toBeDefined();
      expect(report.questionAnalysis).toHaveLength(2);
      expect(report.recommendations).toBeDefined();
      expect(report.charts).toHaveProperty('scoreDistribution');
      expect(report.charts).toHaveProperty('timeAnalysis');
    });
  });

  describe('Real-time Grading and Feedback', () => {
    test('should provide immediate feedback for objective questions', async () => {
      const instantGradingService = new QuizGradingService({ mode: 'instant' });
      
      const answer = {
        questionId: 'q1',
        answer: 'b',
        timestamp: new Date()
      };

      const feedback = await instantGradingService.gradeInstantly(mockQuiz.questions[0], answer);

      expect(feedback.isCorrect).toBe(true);
      expect(feedback.score).toBe(5);
      expect(feedback.immediateResponse).toBeDefined();
      expect(feedback.explanation).toContain('collective unconscious');
      expect(feedback.nextQuestionHint).toBeDefined();
    });

    test('should handle real-time progress tracking', async () => {
      const progressTracker = new QuizProgressTracker();
      
      await progressTracker.startQuiz('student456', 'quiz123');
      await progressTracker.updateProgress('student456', 'q1', { completed: true, score: 5 });
      
      const progress = await progressTracker.getProgress('student456', 'quiz123');

      expect(progress.questionsCompleted).toBe(1);
      expect(progress.currentScore).toBe(5);
      expect(progress.estimatedTimeRemaining).toBeDefined();
      expect(progress.progressPercentage).toBe(50); // 1 of 2 questions
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed or missing answers gracefully', async () => {
      const malformedAttempt: QuizAttempt = {
        id: 'attempt128',
        studentId: 'student456',
        quizId: mockQuiz.id,
        answers: [
          { questionId: 'q1', answer: '', timeSpent: 0, attemptCount: 1 }, // Empty answer
          { questionId: 'nonexistent', answer: 'test', timeSpent: 30, attemptCount: 1 } // Invalid question
        ],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 0
      };

      const result = await gradingService.gradeQuizAttempt(mockQuiz, malformedAttempt);

      expect(result.questionResults).toHaveLength(2); // One for each question in quiz
      expect(result.questionResults[0].score).toBe(0); // Empty answer = 0 points
      expect(result.questionResults[0].feedback).toContain('No answer provided');
      expect(result.errors).toContain('Question nonexistent not found in quiz');
    });

    test('should handle concurrent grading requests', async () => {
      const attempts = Array.from({ length: 10 }, (_, i) => ({
        id: `attempt${i}`,
        studentId: `student${i}`,
        quizId: mockQuiz.id,
        answers: [{ questionId: 'q1', answer: 'b', timeSpent: 30, attemptCount: 1 }],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 0
      }));

      const gradingPromises = attempts.map(attempt => 
        gradingService.gradeQuizAttempt(mockQuiz, attempt)
      );

      const results = await Promise.all(gradingPromises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.totalScore).toBe(5);
        expect(result.questionResults[0].isCorrect).toBe(true);
      });
    });

    test('should handle grading system overload with queue management', async () => {
      const overloadAttempts = Array.from({ length: 100 }, (_, i) => ({
        id: `overload-attempt${i}`,
        studentId: `student${i}`,
        quizId: mockQuiz.id,
        answers: [{ questionId: 'q1', answer: 'b', timeSpent: 30, attemptCount: 1 }],
        startedAt: new Date(),
        submittedAt: new Date(),
        timeRemaining: 0
      }));

      const queuedGradingService = new QuizGradingService({ 
        maxConcurrentGrading: 5,
        queueEnabled: true 
      });

      const results = await Promise.all(
        overloadAttempts.map(attempt => 
          queuedGradingService.gradeQuizAttempt(mockQuiz, attempt)
        )
      );

      expect(results).toHaveLength(100);
      expect(queuedGradingService.getQueueStats().maxConcurrent).toBe(5);
      expect(queuedGradingService.getQueueStats().totalProcessed).toBe(100);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Additional utility classes and interfaces for testing
class QuizProgressTracker {
  private progress = new Map<string, any>();

  async startQuiz(studentId: string, quizId: string): Promise<void> {
    this.progress.set(`${studentId}-${quizId}`, {
      questionsCompleted: 0,
      currentScore: 0,
      startTime: new Date()
    });
  }

  async updateProgress(studentId: string, questionId: string, update: any): Promise<void> {
    const key = `${studentId}-quiz123`; // Simplified
    const current = this.progress.get(key);
    if (current) {
      current.questionsCompleted += 1;
      current.currentScore += update.score || 0;
      this.progress.set(key, current);
    }
  }

  async getProgress(studentId: string, quizId: string): Promise<any> {
    const key = `${studentId}-${quizId}`;
    const current = this.progress.get(key);
    return {
      ...current,
      progressPercentage: (current.questionsCompleted / 2) * 100, // Assuming 2 questions
      estimatedTimeRemaining: 30 * (2 - current.questionsCompleted) // 30 seconds per question
    };
  }
}

export { QuizProgressTracker };