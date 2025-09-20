/**
 * Comprehensive Unit Tests for AdaptiveQuizEngine
 * Tests all critical paths including session creation, response processing, and adaptation logic
 */

import { AdaptiveQuizEngine, UserPerformanceProfile, AdaptiveQuizOptions } from '../adaptiveQuizEngine';
import { ILLMProvider } from '../../llm/types';
import { Question } from '../../../types';

// Mock QuizGenerator
jest.mock('../../llm/generators/quiz-generator');

describe('AdaptiveQuizEngine', () => {
  let engine: AdaptiveQuizEngine;
  let mockProvider: jest.Mocked<ILLMProvider>;

  // Mock data
  const mockUserProfile: UserPerformanceProfile = {
    userId: 'test-user-123',
    overallScore: 75,
    strengthAreas: ['understanding', 'application'],
    weaknessAreas: ['analysis'],
    preferredDifficulty: 'medium',
    cognitiveProfile: {
      recall: 0.8,
      understanding: 0.9,
      application: 0.7,
      analysis: 0.5
    },
    learningStyle: 'visual',
    responseHistory: [
      {
        questionId: 'prev-1',
        correct: true,
        timeTaken: 45,
        difficulty: 'medium',
        cognitiveLevel: 'understanding',
        date: new Date()
      },
      {
        questionId: 'prev-2',
        correct: false,
        timeTaken: 120,
        difficulty: 'hard',
        cognitiveLevel: 'analysis',
        date: new Date()
      }
    ]
  };

  const mockOptions: AdaptiveQuizOptions = {
    initialDifficulty: 'medium',
    adaptationStrategy: 'performance',
    maxQuestions: 15,
    minQuestions: 5,
    targetAccuracy: 0.75,
    confidenceThreshold: 0.8,
    includeRemediation: true
  };

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      question: 'What is the collective unconscious?',
      type: 'multiple-choice',
      options: [
        { id: 'opt-1', text: 'Correct answer', isCorrect: true },
        { id: 'opt-2', text: 'Wrong answer 1', isCorrect: false },
        { id: 'opt-3', text: 'Wrong answer 2', isCorrect: false },
        { id: 'opt-4', text: 'Wrong answer 3', isCorrect: false }
      ],
      correctAnswer: 0,
      explanation: 'The collective unconscious is a fundamental concept.',
      points: 10,
      order: 0,
      metadata: {
        difficulty: 'medium',
        adaptiveDifficulty: 'medium'
      }
    },
    {
      id: 'q2',
      question: 'Explain the individuation process',
      type: 'short-answer',
      options: [],
      correctAnswer: '',
      explanation: 'Individuation is the process of psychological development.',
      expectedKeywords: ['individuation', 'development', 'psychological'],
      points: 15,
      order: 1,
      metadata: {
        difficulty: 'hard',
        adaptiveDifficulty: 'hard'
      }
    }
  ];

  beforeEach(() => {
    // Create mock LLM provider
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    engine = new AdaptiveQuizEngine(mockProvider);

    // Mock the QuizGenerator's generateAdaptiveQuestions method
    const mockQuizGenerator = require('../../llm/generators/quiz-generator').QuizGenerator;
    mockQuizGenerator.prototype.generateAdaptiveQuestions = jest.fn()
      .mockResolvedValue(mockQuestions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startAdaptiveSession()', () => {
    it('should create a new adaptive session with correct initial settings', async () => {
      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content about Jung',
        ['Understand collective unconscious'],
        mockUserProfile,
        mockOptions
      );

      expect(session).toBeDefined();
      expect(session.userId).toBe('test-user');
      expect(session.topic).toBe('Jung Psychology');
      expect(session.sessionId).toMatch(/^adaptive-/);
      expect(session.currentDifficulty).toBe('medium'); // Based on user profile
      expect(session.questionsAsked).toHaveLength(3); // Initial 3 questions
      expect(session.responses).toHaveLength(0);
      expect(session.currentAccuracy).toBe(0);
      expect(session.shouldContinue).toBe(true);
      expect(session.masteryLevel).toBe(0);
    });

    it('should determine initial difficulty based on user profile with history', async () => {
      const profileWithGoodHistory: UserPerformanceProfile = {
        ...mockUserProfile,
        responseHistory: Array(10).fill(null).map((_, i) => ({
          questionId: `hist-${i}`,
          correct: i >= 2, // 80% accuracy
          timeTaken: 60,
          difficulty: 'medium',
          cognitiveLevel: 'understanding',
          date: new Date()
        }))
      };

      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        profileWithGoodHistory,
        mockOptions
      );

      expect(session.currentDifficulty).toBe('hard'); // Should upgrade due to good history
    });

    it('should use fallback difficulty when user has no history', async () => {
      const newUserProfile: UserPerformanceProfile = {
        ...mockUserProfile,
        overallScore: 0,
        responseHistory: []
      };

      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        newUserProfile,
        mockOptions
      );

      expect(session.currentDifficulty).toBe('medium'); // Should use options default
    });

    it('should handle quiz generation errors gracefully', async () => {
      const mockQuizGenerator = require('../../llm/generators/quiz-generator').QuizGenerator;
      mockQuizGenerator.prototype.generateAdaptiveQuestions = jest.fn()
        .mockRejectedValue(new Error('Generation failed'));

      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );

      // Should still create session with fallback questions
      expect(session).toBeDefined();
      expect(session.questionsAsked.length).toBeGreaterThan(0);
      expect(session.questionsAsked[0].metadata?.adaptiveFallback).toBe(true);
    });
  });

  describe('processResponse()', () => {
    let session: any;

    beforeEach(async () => {
      session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );
    });

    it('should process correct response and update session metrics', async () => {
      const result = await engine.processResponse(
        session.sessionId,
        'q1',
        0, // Correct answer
        45,
        0.8
      );

      expect(result.session.responses).toHaveLength(1);
      expect(result.session.responses[0]).toMatchObject({
        questionId: 'q1',
        userAnswer: 0,
        correct: true,
        timeTaken: 45,
        confidence: 0.8
      });
      expect(result.session.currentAccuracy).toBe(1.0);
      expect(result.session.masteryLevel).toBe(1.0);
      expect(result.feedback).toContain('Excelente');
    });

    it('should process incorrect response and provide appropriate feedback', async () => {
      const result = await engine.processResponse(
        session.sessionId,
        'q1',
        1, // Wrong answer
        90,
        0.3
      );

      expect(result.session.responses).toHaveLength(1);
      expect(result.session.responses[0].correct).toBe(false);
      expect(result.session.currentAccuracy).toBe(0);
      expect(result.feedback).toContain('Não foi desta vez');
    });

    it('should handle short-answer questions with keyword matching', async () => {
      const result = await engine.processResponse(
        session.sessionId,
        'q2',
        'individuation is a psychological development process',
        120,
        0.6
      );

      expect(result.session.responses[0].correct).toBe(true); // Should match keywords
    });

    it('should throw error for invalid session ID', async () => {
      await expect(
        engine.processResponse('invalid-session', 'q1', 0, 45)
      ).rejects.toThrow('Session invalid-session not found');
    });

    it('should throw error for invalid question ID', async () => {
      await expect(
        engine.processResponse(session.sessionId, 'invalid-question', 0, 45)
      ).rejects.toThrow('Question invalid-question not found');
    });

    it('should adapt difficulty based on recent performance', async () => {
      // Process several correct answers to trigger difficulty increase
      await engine.processResponse(session.sessionId, 'q1', 0, 45, 0.8);
      
      const mockQuizGenerator = require('../../llm/generators/quiz-generator').QuizGenerator;
      mockQuizGenerator.prototype.generateAdaptiveQuestions = jest.fn()
        .mockResolvedValue([{...mockQuestions[0], id: 'q3'}]);

      // Add more questions to the session to test adaptation
      session.questionsAsked.push({...mockQuestions[0], id: 'q4'});
      session.questionsAsked.push({...mockQuestions[0], id: 'q5'});

      await engine.processResponse(session.sessionId, 'q4', 0, 30, 0.9);
      const result = await engine.processResponse(session.sessionId, 'q5', 0, 25, 0.95);

      expect(result.session.currentDifficulty).toBe('hard'); // Should increase difficulty
      expect(result.adaptationReason).toContain('Aumentando dificuldade');
    });

    it('should decrease difficulty for poor performance', async () => {
      // Start with hard difficulty
      session.currentDifficulty = 'hard';
      
      // Add questions and process incorrect responses
      session.questionsAsked.push({...mockQuestions[0], id: 'q3'});
      session.questionsAsked.push({...mockQuestions[0], id: 'q4'});
      session.questionsAsked.push({...mockQuestions[0], id: 'q5'});

      await engine.processResponse(session.sessionId, 'q1', 1, 120, 0.2); // Wrong
      await engine.processResponse(session.sessionId, 'q3', 2, 150, 0.1); // Wrong
      const result = await engine.processResponse(session.sessionId, 'q4', 3, 180, 0.1); // Wrong

      expect(result.session.currentDifficulty).toBe('medium'); // Should decrease difficulty
      expect(result.adaptationReason).toContain('Diminuindo dificuldade');
    });
  });

  describe('shouldContinueSession()', () => {
    let session: any;

    beforeEach(async () => {
      session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );
    });

    it('should stop session when high mastery is achieved with sufficient responses', async () => {
      // Simulate 8 correct responses
      session.responses = Array(8).fill(null).map((_, i) => ({
        questionId: `q${i}`,
        correct: true,
        timeTaken: 45,
        confidence: 0.8
      }));
      
      // Update metrics manually for test
      session.currentAccuracy = 1.0;
      session.masteryLevel = 0.9;

      const result = await engine.processResponse(session.sessionId, 'q1', 0, 45);
      
      expect(result.session.shouldContinue).toBe(false);
    });

    it('should stop session at maximum questions limit', async () => {
      // Add 15 responses
      session.responses = Array(15).fill(null).map((_, i) => ({
        questionId: `q${i}`,
        correct: i % 2 === 0, // 50% accuracy
        timeTaken: 60,
        confidence: 0.5
      }));
      session.currentAccuracy = 0.5;
      session.masteryLevel = 0.5;

      const result = await engine.processResponse(session.sessionId, 'q1', 0, 45);
      
      expect(result.session.shouldContinue).toBe(false);
    });

    it('should stop session for persistently poor performance', async () => {
      // Add 6 mostly incorrect responses
      session.responses = Array(6).fill(null).map((_, i) => ({
        questionId: `q${i}`,
        correct: i === 0, // Only first correct, rest wrong
        timeTaken: 120,
        confidence: 0.2
      }));
      session.currentAccuracy = 0.17; // 1/6
      session.masteryLevel = 0.2; // Low mastery

      const result = await engine.processResponse(session.sessionId, 'q1', 1, 150);
      
      expect(result.session.shouldContinue).toBe(false);
    });

    it('should continue session for normal progress', async () => {
      // Add moderate responses
      session.responses = Array(4).fill(null).map((_, i) => ({
        questionId: `q${i}`,
        correct: i % 2 === 0, // 50% accuracy
        timeTaken: 60,
        confidence: 0.5
      }));
      session.currentAccuracy = 0.5;
      session.masteryLevel = 0.5;

      const result = await engine.processResponse(session.sessionId, 'q1', 0, 60);
      
      expect(result.session.shouldContinue).toBe(true);
    });
  });

  describe('getSessionAnalytics()', () => {
    let session: any;

    beforeEach(async () => {
      session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );

      // Use the actual question IDs from the generated questions
      const questionIds = session.questionsAsked.map((q: any) => q.id);
      
      // Add some responses for analysis
      await engine.processResponse(session.sessionId, questionIds[0], 0, 45, 0.8); // Correct
      if (questionIds[1]) {
        await engine.processResponse(session.sessionId, questionIds[1], 'wrong answer', 120, 0.3); // Incorrect
      }
    });

    it('should return comprehensive session analytics', () => {
      const analytics = engine.getSessionAnalytics(session.sessionId);

      expect(analytics).toMatchObject({
        performance: 0.5, // 1/2 correct
        difficultyProgression: expect.any(Array),
        responsePattern: expect.any(Array),
        recommendations: expect.any(Array)
      });

      expect(analytics.difficultyProgression).toHaveLength(3); // Initial questions
      expect(analytics.responsePattern).toHaveLength(2); // Two responses
      expect(analytics.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide appropriate recommendations for different performance levels', () => {
      // Test high performance recommendations
      session.currentAccuracy = 0.95;
      const highPerfAnalytics = engine.getSessionAnalytics(session.sessionId);
      expect(highPerfAnalytics.recommendations).toContain(
        expect.stringContaining('Excelente performance')
      );

      // Test low performance recommendations
      session.currentAccuracy = 0.3;
      const lowPerfAnalytics = engine.getSessionAnalytics(session.sessionId);
      expect(lowPerfAnalytics.recommendations).toContain(
        expect.stringContaining('Recomenda-se revisar')
      );
    });

    it('should analyze response time patterns', () => {
      const analytics = engine.getSessionAnalytics(session.sessionId);
      
      expect(analytics.responsePattern).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            correct: true,
            time: 45,
            difficulty: 'medium'
          }),
          expect.objectContaining({
            correct: false,
            time: 120,
            difficulty: 'hard'
          })
        ])
      );
    });

    it('should throw error for invalid session', () => {
      expect(() => {
        engine.getSessionAnalytics('invalid-session');
      }).toThrow('Session invalid-session not found');
    });
  });

  describe('endSession()', () => {
    let session: any;

    beforeEach(async () => {
      session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );

      // Use the actual question IDs from the generated questions
      const questionIds = session.questionsAsked.map((q: any) => q.id);
      
      // Add sample responses
      await engine.processResponse(session.sessionId, questionIds[0], 0, 45, 0.8);
      if (questionIds[1]) {
        await engine.processResponse(session.sessionId, questionIds[1], 'individuation process', 90, 0.6);
      }
    });

    it('should return final session results and clean up', () => {
      const finalResults = engine.endSession(session.sessionId);

      expect(finalResults).toMatchObject({
        finalScore: expect.any(Number),
        masteryLevel: expect.any(Number),
        totalQuestions: 2,
        timeSpent: 135, // 45 + 90
        strongAreas: expect.any(Array),
        improvementAreas: expect.any(Array)
      });

      expect(finalResults.finalScore).toBeGreaterThan(0);
      expect(finalResults.finalScore).toBeLessThanOrEqual(100);

      // Verify session is cleaned up
      expect(() => {
        engine.getSessionAnalytics(session.sessionId);
      }).toThrow('Session');
    });

    it('should analyze performance areas correctly', () => {
      const finalResults = engine.endSession(session.sessionId);

      expect(finalResults.strongAreas).toEqual(expect.any(Array));
      expect(finalResults.improvementAreas).toEqual(expect.any(Array));

      // Should have at least analyzed medium difficulty performance
      const hasPerformanceAnalysis = 
        finalResults.strongAreas.length > 0 || finalResults.improvementAreas.length > 0;
      expect(hasPerformanceAnalysis).toBe(true);
    });

    it('should throw error for invalid session', () => {
      expect(() => {
        engine.endSession('invalid-session');
      }).toThrow('Session invalid-session not found');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty user profile gracefully', async () => {
      const emptyProfile: UserPerformanceProfile = {
        userId: 'empty-user',
        overallScore: 0,
        strengthAreas: [],
        weaknessAreas: [],
        preferredDifficulty: 'easy',
        cognitiveProfile: {
          recall: 0,
          understanding: 0,
          application: 0,
          analysis: 0
        },
        learningStyle: 'mixed',
        responseHistory: []
      };

      const session = await engine.startAdaptiveSession(
        'empty-user',
        'Test Topic',
        'Test content',
        [],
        emptyProfile,
        { ...mockOptions, initialDifficulty: 'easy' } // Force easy difficulty
      );

      expect(session).toBeDefined();
      expect(session.currentDifficulty).toBe('easy'); // Should use options default since no score
    });

    it('should handle malformed question responses', async () => {
      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );

      // Use actual question IDs from the session
      const questionIds = session.questionsAsked.map((q: any) => q.id);

      // Test with null/undefined responses
      const result1 = await engine.processResponse(session.sessionId, questionIds[0], null, 60);
      expect(result1.session.responses[0].correct).toBe(false);

      if (questionIds[1]) {
        const result2 = await engine.processResponse(session.sessionId, questionIds[1], undefined, 60);
        expect(result2.session.responses[1].correct).toBe(false);
      }
    });

    it('should maintain session state consistency', async () => {
      const session = await engine.startAdaptiveSession(
        'test-user',
        'Jung Psychology',
        'Test content',
        [],
        mockUserProfile,
        mockOptions
      );

      // Use actual question IDs from the session
      const questionIds = session.questionsAsked.map((q: any) => q.id);

      // Process multiple responses and verify state consistency
      await engine.processResponse(session.sessionId, questionIds[0], 0, 45);
      if (questionIds[1]) {
        await engine.processResponse(session.sessionId, questionIds[1], 'individuatio', 90);
      }

      const analytics = engine.getSessionAnalytics(session.sessionId);
      
      expect(analytics.performance).toBe(session.currentAccuracy);
      expect(analytics.responsePattern.length).toBe(session.responses.length);
    });
  });
});