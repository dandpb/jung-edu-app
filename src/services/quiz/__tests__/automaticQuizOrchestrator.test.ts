/**
 * Comprehensive Unit Tests for AutomaticQuizOrchestrator
 * Tests the full workflow from content analysis to quiz generation with quality validation
 */

import { AutomaticQuizOrchestrator, AutoQuizGenerationOptions } from '../automaticQuizOrchestrator';
import { EnhancedQuizGenerator } from '../enhancedQuizGenerator';
import { contentAnalyzer } from '../contentAnalyzer';
import { quizValidator } from '../quizValidator';
import { ILLMProvider } from '../../llm/types';
import { Quiz } from '../../../types';

// Mock dependencies
jest.mock('../enhancedQuizGenerator');
jest.mock('../contentAnalyzer');
jest.mock('../quizValidator');

describe('AutomaticQuizOrchestrator', () => {
  let orchestrator: AutomaticQuizOrchestrator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  let mockEnhancedGenerator: jest.Mocked<EnhancedQuizGenerator>;
  let mockContentAnalyzer: jest.Mocked<typeof contentAnalyzer>;
  let mockQuizValidator: jest.Mocked<typeof quizValidator>;

  const mockGenerationOptions: AutoQuizGenerationOptions = {
    questionCount: 10,
    targetDifficulty: 'intermediate',
    includeEssayQuestions: true,
    adaptiveDifficulty: false,
    qualityThreshold: 80,
    maxRetries: 3,
    language: 'pt-BR',
    cognitiveDistribution: {
      recall: 0.2,
      understanding: 0.4,
      application: 0.3,
      analysis: 0.1
    }
  };

  const mockContentAnalysis = {
    keyConcepts: ['collective unconscious', 'archetypes', 'individuation'],
    difficulty: 'intermediate' as const,
    cognitivelevels: ['understanding', 'application', 'analysis'],
    learningObjectives: ['Understand Jung\'s key concepts'],
    conceptRelationships: [
      { concept1: 'collective unconscious', concept2: 'archetypes', relationship: 'contains' }
    ],
    potentialQuestionAreas: [
      {
        area: 'Core Concepts',
        concepts: ['collective unconscious', 'archetypes'],
        suggestedQuestionTypes: ['multiple-choice', 'essay'],
        difficulty: 'medium'
      }
    ],
    contentStructure: {
      mainTopics: ['Jung Theory', 'Applications'],
      subtopics: ['Archetypes', 'Dreams'],
      examples: ['Case studies'],
      definitions: ['Collective unconscious definition']
    },
    assessmentSuggestions: {
      recommendedQuestionCount: 10,
      difficultyDistribution: { easy: 0.2, medium: 0.6, hard: 0.2 },
      questionTypeDistribution: { 'multiple-choice': 0.7, 'essay': 0.3 }
    }
  };

  const mockQuiz: Quiz = {
    id: 'test-quiz-123',
    moduleId: 'test-module',
    title: 'Jung Psychology Quiz',
    description: 'Test quiz about Jung psychology',
    questions: [
      {
        id: 'q1',
        question: 'What is the collective unconscious?',
        type: 'multiple-choice',
        options: [
          { id: 'opt-1', text: 'Shared unconscious content across humanity', isCorrect: true },
          { id: 'opt-2', text: 'Personal unconscious memories', isCorrect: false },
          { id: 'opt-3', text: 'Conscious thoughts', isCorrect: false },
          { id: 'opt-4', text: 'Individual experiences', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'The collective unconscious contains archetypal patterns.',
        points: 10,
        order: 0,
        metadata: { difficulty: 'medium', cognitiveLevel: 'understanding' }
      },
      {
        id: 'q2',
        question: 'Explain the individuation process in your own words.',
        type: 'essay',
        options: [],
        correctAnswer: '',
        explanation: 'Individuation is the process of psychological development.',
        points: 20,
        order: 1,
        metadata: { difficulty: 'hard', cognitiveLevel: 'analysis' }
      }
    ],
    passingScore: 70,
    timeLimit: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      difficulty: 'intermediate',
      topic: 'Jung Psychology',
      generatedAt: new Date()
    }
  };

  beforeEach(() => {
    // Setup mock provider
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    // Setup mocks
    mockEnhancedGenerator = {
      generateEnhancedQuiz: jest.fn().mockResolvedValue(mockQuiz)
    } as any;

    mockContentAnalyzer = {
      analyzeContent: jest.fn().mockResolvedValue(mockContentAnalysis)
    } as any;

    mockQuizValidator = {
      validateQuiz: jest.fn().mockReturnValue({
        score: 85,
        errors: [],
        warnings: [],
        suggestions: ['Great quiz!']
      })
    } as any;

    // Mock constructor calls
    (EnhancedQuizGenerator as jest.Mock).mockImplementation(() => mockEnhancedGenerator);
    
    // Assign module-level mocks
    Object.assign(contentAnalyzer, mockContentAnalyzer);
    Object.assign(quizValidator, mockQuizValidator);

    orchestrator = new AutomaticQuizOrchestrator(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAutomaticQuiz()', () => {
    const testContent = 'This is test content about Jung psychology and the collective unconscious...';
    const testObjectives = ['Understand Jung\'s key concepts', 'Apply theory to practice'];

    it('should successfully generate a quiz with full workflow', async () => {
      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result).toBeDefined();
      expect(result.quiz).toEqual(mockQuiz);
      expect(result.analytics).toMatchObject({
        contentAnalysis: mockContentAnalysis,
        generationAttempts: 1,
        finalQualityScore: 85,
        improvementSuggestions: ['Great quiz!'],
        timeTaken: expect.any(Number)
      });

      // Verify the workflow calls
      expect(mockContentAnalyzer.analyzeContent).toHaveBeenCalledWith(
        testContent,
        'Jung Psychology',
        'pt-BR'
      );
      expect(mockEnhancedGenerator.generateEnhancedQuiz).toHaveBeenCalledWith(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        10,
        expect.objectContaining({
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: false,
          includeEssayQuestions: true
        })
      );
      expect(mockQuizValidator.validateQuiz).toHaveBeenCalledWith(mockQuiz);
    });

    it('should handle content analysis failure gracefully', async () => {
      mockContentAnalyzer.analyzeContent = jest.fn().mockRejectedValue(
        new Error('Content analysis failed')
      );

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result).toBeDefined();
      expect(result.quiz).toEqual(mockQuiz);
      expect(result.analytics.contentAnalysis).toMatchObject({
        keyConcepts: ['collective unconscious', 'archetypes', 'individuation'],
        difficulty: 'intermediate'
      });
    });

    it('should retry generation when quality threshold is not met', async () => {
      // First attempt fails quality check
      mockQuizValidator.validateQuiz
        .mockReturnValueOnce({
          score: 60, // Below threshold
          errors: ['Poor question quality'],
          warnings: [],
          suggestions: ['Improve questions']
        })
        .mockReturnValueOnce({
          score: 85, // Above threshold
          errors: [],
          warnings: [],
          suggestions: ['Good quiz']
        });

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result.analytics.generationAttempts).toBe(2);
      expect(result.analytics.finalQualityScore).toBe(85);
      expect(mockEnhancedGenerator.generateEnhancedQuiz).toHaveBeenCalledTimes(2);
    });

    it('should use best quiz when max retries reached', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();
      
      const poorQuiz = { ...mockQuiz, id: 'poor-quiz' };
      const betterQuiz = { ...mockQuiz, id: 'better-quiz' };

      mockEnhancedGenerator.generateEnhancedQuiz
        .mockResolvedValueOnce(poorQuiz)
        .mockResolvedValueOnce(betterQuiz)
        .mockResolvedValueOnce(poorQuiz);

      mockQuizValidator.validateQuiz
        .mockReturnValueOnce({ score: 40, errors: [], warnings: [], suggestions: [], isValid: true })
        .mockReturnValueOnce({ score: 65, errors: [], warnings: [], suggestions: [], isValid: true })
        .mockReturnValueOnce({ score: 35, errors: [], warnings: [], suggestions: [], isValid: true });

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result.analytics.generationAttempts).toBe(3);
      expect(result.quiz.id).toBe('better-quiz'); // Should use the best attempt
      expect(result.analytics.finalQualityScore).toBe(65);
    });

    it('should create fallback quiz when all generation attempts fail', async () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();
      
      mockEnhancedGenerator.generateEnhancedQuiz = jest.fn()
        .mockRejectedValue(new Error('Generation failed'));

      // Mock the fallback quiz creation with expected score
      mockQuizValidator.validateQuiz.mockReturnValue({
        score: 50,
        errors: [],
        warnings: [],
        suggestions: [],
        isValid: true
      });

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.quiz.metadata?.fallback).toBe(true);
      expect(result.analytics.finalQualityScore).toBe(50); // Fallback score
      expect(result.analytics.generationAttempts).toBe(3);
    });

    it('should handle validator failure gracefully', async () => {
      mockQuizValidator.validateQuiz = jest.fn()
        .mockReturnValue(undefined); // Simulate validator failure

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(result).toBeDefined();
      expect(result.analytics.finalQualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should respect quality threshold setting', async () => {
      const highThresholdOptions = { ...mockGenerationOptions, qualityThreshold: 95 };

      mockQuizValidator.validateQuiz.mockReturnValue({
        score: 90, // Below high threshold
        errors: [],
        warnings: [],
        suggestions: []
      });

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        highThresholdOptions
      );

      // Should retry all attempts since 90 < 95
      expect(result.analytics.generationAttempts).toBe(3);
      expect(mockEnhancedGenerator.generateEnhancedQuiz).toHaveBeenCalledTimes(3);
    });

    it('should track generation time accurately', async () => {
      const startTime = Date.now();
      
      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      const endTime = Date.now();
      expect(result.analytics.timeTaken).toBeGreaterThanOrEqual(0);
      expect(result.analytics.timeTaken).toBeLessThanOrEqual(endTime - startTime + 100); // Small buffer
    });
  });

  describe('generateQuizVariations()', () => {
    const testContent = 'Test content about Jung psychology...';
    const testObjectives = ['Understand concepts'];

    it('should generate multiple quiz variations', async () => {
      // Mock different quiz objects with different moduleIds for each variation
      mockEnhancedGenerator.generateEnhancedQuiz
        .mockResolvedValueOnce({ ...mockQuiz, moduleId: 'test-module-var1' })
        .mockResolvedValueOnce({ ...mockQuiz, moduleId: 'test-module-var2' })
        .mockResolvedValueOnce({ ...mockQuiz, moduleId: 'test-module-var3' });

      const variations = await orchestrator.generateQuizVariations(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions,
        3
      );

      expect(variations).toHaveLength(3);
      variations.forEach((variation, index) => {
        expect(variation.quiz).toBeDefined();
        expect(variation.analytics).toBeDefined();
        expect(variation.quiz.moduleId).toBe(`test-module-var${index + 1}`);
      });

      // Should have called enhanced generator 3 times
      expect(mockEnhancedGenerator.generateEnhancedQuiz).toHaveBeenCalledTimes(3);
    });

    it('should create variations with different parameters', async () => {
      const variations = await orchestrator.generateQuizVariations(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions,
        3
      );

      // Check that enhanced generator was called with different options
      const calls = mockEnhancedGenerator.generateEnhancedQuiz.mock.calls;
      
      expect(calls[0][5]).toMatchObject({
        includeEssayQuestions: true // First variation keeps original
      });
      expect(calls[1][5]).toMatchObject({
        includeEssayQuestions: false // Second variation flips
      });
      expect(calls[2][5]).toMatchObject({
        includeEssayQuestions: true // Third variation flips back
      });
    });

    it('should handle single variation request', async () => {
      const variations = await orchestrator.generateQuizVariations(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions,
        1
      );

      expect(variations).toHaveLength(1);
      expect(variations[0].quiz).toBeDefined();
    });

    it('should default to 3 variations when count not specified', async () => {
      const variations = await orchestrator.generateQuizVariations(
        'test-module',
        'Jung Psychology',
        testContent,
        testObjectives,
        mockGenerationOptions
      );

      expect(variations).toHaveLength(3);
    });

    it('should handle variation generation failures', async () => {
      mockEnhancedGenerator.generateEnhancedQuiz
        .mockResolvedValueOnce(mockQuiz)
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockResolvedValueOnce(mockQuiz);

      // Despite one failure, should still return results for successful attempts
      await expect(
        orchestrator.generateQuizVariations(
          'test-module',
          'Jung Psychology',
          testContent,
          testObjectives,
          mockGenerationOptions,
          3
        )
      ).rejects.toThrow(); // Promise.all will reject if any promise fails
    });
  });

  describe('analyzeQuizPerformance()', () => {
    const userResponses = [
      { questionId: 'q1', correct: true, timeTaken: 45 },
      { questionId: 'q2', correct: false, timeTaken: 120 }
    ];

    it('should analyze quiz performance correctly', async () => {
      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, userResponses);

      expect(analysis).toMatchObject({
        overallPerformance: 50, // 1/2 correct = 50%
        weakAreas: expect.any(Array),
        recommendations: expect.any(Array),
        nextSteps: expect.any(Array)
      });

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.nextSteps.length).toBeGreaterThan(0);
    });

    it('should identify weak areas from incorrect answers', async () => {
      const responses = [
        { questionId: 'q1', correct: false, timeTaken: 60 },
        { questionId: 'q2', correct: false, timeTaken: 180 }
      ];

      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, responses);

      expect(analysis.overallPerformance).toBe(0);
      expect(analysis.weakAreas).toContain('hard level questions');
      expect(analysis.weakAreas).toContain('analysis cognitive level');
    });

    it('should provide appropriate recommendations for high performance', async () => {
      const perfectResponses = [
        { questionId: 'q1', correct: true, timeTaken: 30 },
        { questionId: 'q2', correct: true, timeTaken: 60 }
      ];

      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, perfectResponses);

      expect(analysis.overallPerformance).toBe(100);
      expect(analysis.recommendations).toContain('Progress to the next module');
      expect(analysis.nextSteps).toContain('Progress to the next module');
    });

    it('should provide appropriate recommendations for medium performance', async () => {
      const mixedResponses = [
        { questionId: 'q1', correct: true, timeTaken: 45 },
        { questionId: 'q1', correct: true, timeTaken: 50 },
        { questionId: 'q2', correct: false, timeTaken: 120 }
      ];

      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, mixedResponses);

      expect(analysis.overallPerformance).toBeCloseTo(66.67, 1);
      expect(analysis.recommendations).toContain('Practice application of concepts in different contexts');
    });

    it('should provide appropriate recommendations for poor performance', async () => {
      const poorResponses = [
        { questionId: 'q1', correct: false, timeTaken: 90 },
        { questionId: 'q2', correct: false, timeTaken: 180 }
      ];

      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, poorResponses);

      expect(analysis.overallPerformance).toBe(0);
      expect(analysis.recommendations).toContain('Review fundamental concepts before retaking');
      expect(analysis.nextSteps).toContain('Review module content thoroughly');
    });

    it('should handle empty response array', async () => {
      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, []);

      expect(analysis.overallPerformance).toBe(0);
      expect(analysis.weakAreas).toHaveLength(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle responses with missing questions', async () => {
      const responsesWithMissingQ = [
        { questionId: 'nonexistent', correct: true, timeTaken: 45 },
        { questionId: 'q1', correct: false, timeTaken: 60 }
      ];

      const analysis = await orchestrator.analyzeQuizPerformance(mockQuiz, responsesWithMissingQ);

      expect(analysis.overallPerformance).toBe(50); // Only counts valid responses
      expect(analysis.weakAreas.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createEnhancedOptions()', () => {
    it('should create enhanced options from base options and content analysis', async () => {
      // Access private method through type assertion for testing
      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Jung Psychology',
        'test content',
        [],
        mockGenerationOptions
      );

      // Verify that enhanced generator was called with proper options
      const enhancedOptionsCall = mockEnhancedGenerator.generateEnhancedQuiz.mock.calls[0][5];
      
      expect(enhancedOptionsCall).toMatchObject({
        useTemplates: true,
        enhanceQuestions: true,
        adaptiveDifficulty: false,
        includeEssayQuestions: true,
        contextualizeQuestions: true,
        userLevel: 'intermediate'
      });
    });
  });

  describe('createFallbackQuiz()', () => {
    it('should create fallback quiz when generation fails', async () => {
      mockEnhancedGenerator.generateEnhancedQuiz = jest.fn()
        .mockRejectedValue(new Error('All generation attempts failed'));

      const result = await orchestrator.generateAutomaticQuiz(
        'fallback-module',
        'Test Topic',
        'test content',
        ['Learn basics'],
        { ...mockGenerationOptions, questionCount: 5 }
      );

      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions).toHaveLength(5);
      expect(result.quiz.metadata?.fallback).toBe(true);
      expect(result.quiz.title).toContain('Test Topic');
      
      // Check question structure
      result.quiz.questions.forEach((question, index) => {
        expect(question.id).toBe(`fallback-${index + 1}`);
        expect(question.type).toBe('multiple-choice');
        expect(question.options).toHaveLength(4);
        expect(question.explanation).toContain('Test Topic');
      });
    });

    it('should create fallback questions with varying difficulties', async () => {
      mockEnhancedGenerator.generateEnhancedQuiz = jest.fn()
        .mockRejectedValue(new Error('Generation failed'));

      const result = await orchestrator.generateAutomaticQuiz(
        'test-module',
        'Test Topic',
        'test content',
        [],
        { ...mockGenerationOptions, questionCount: 9 }
      );

      const difficulties = result.quiz.questions.map(q => q.metadata?.difficulty);
      
      // Should have easy, medium, and hard questions
      expect(difficulties).toContain('easy');
      expect(difficulties).toContain('medium');
      expect(difficulties).toContain('hard');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no quiz could be generated', async () => {
      mockEnhancedGenerator.generateEnhancedQuiz = jest.fn()
        .mockRejectedValue(new Error('Cannot generate quiz'));
      
      // Mock options with maxRetries = 0 to prevent fallback
      const noFallbackOptions = { ...mockGenerationOptions, maxRetries: 1 };

      await expect(
        orchestrator.generateAutomaticQuiz(
          'test-module',
          'Test Topic',
          'test content',
          [],
          noFallbackOptions
        )
      ).rejects.toThrow('Failed to generate quiz after all attempts');
    });

    it('should handle concurrent generation requests', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        orchestrator.generateAutomaticQuiz(
          `module-${i}`,
          'Jung Psychology',
          'Test content',
          [],
          mockGenerationOptions
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.quiz).toBeDefined();
        expect(result.quiz.moduleId).toBe(`module-${i}`);
      });
    });
  });
});