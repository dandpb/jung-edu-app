/**
 * Comprehensive tests for quiz/example-usage.ts
 * Tests quiz generation workflows, example functions, and integration patterns
 */

import {
  generateBeginnerQuiz,
  generateAdvancedQuiz,
  generateAdaptiveFollowUp,
  generateConceptPractice,
  generatePersonalizedStudyGuide,
  demonstrateTemplateUsage,
  completeQuizWorkflow,
  demonstrateQuestionValidation
} from '../example-usage';

import { EnhancedQuizGenerator } from '../enhancedQuizGenerator';
import { quizEnhancer } from '../quizEnhancer';
import { getQuestionTemplate, topicTemplates } from '../quizTemplates';
import { OpenAIProvider } from '../../llm/providers/openai';
import { Quiz, Question } from '../../../types';

// Mock dependencies
jest.mock('../enhancedQuizGenerator');
jest.mock('../quizEnhancer');
jest.mock('../quizTemplates');
jest.mock('../../llm/providers/openai');

const mockEnhancedQuizGenerator = EnhancedQuizGenerator as jest.MockedClass<typeof EnhancedQuizGenerator>;
const mockQuizEnhancer = quizEnhancer as jest.Mocked<typeof quizEnhancer>;
const mockOpenAIProvider = OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>;

// Mock quiz data
const mockQuiz: Quiz = {
  id: 'quiz-test-123',
  title: 'Jung Psychology Quiz',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is the shadow in Jungian psychology?',
      options: [
        { id: 'q1-a', text: 'Conscious self', isCorrect: false },
        { id: 'q1-b', text: 'Unconscious aspects', isCorrect: true },
        { id: 'q1-c', text: 'Dream symbols', isCorrect: false },
        { id: 'q1-d', text: 'Collective memory', isCorrect: false }
      ],
      correctAnswer: 1,
      explanation: 'The shadow represents unconscious aspects of personality',
      points: 10,
      order: 1,
      metadata: { difficulty: 'intermediate' }
    },
    {
      id: 'q2',
      type: 'short-answer',
      question: 'Define individuation process',
      options: [],
      correctAnswer: -1,
      explanation: 'Individuation is the process of psychological integration',
      expectedKeywords: ['integration', 'wholeness', 'self'],
      points: 15,
      order: 2,
      metadata: { difficulty: 'advanced' }
    }
  ],
  passingScore: 70,
  timeLimit: 30,
  metadata: {
    difficulty: 'intermediate',
    difficultyDistribution: { beginner: 0, intermediate: 1, advanced: 1 },
    concepts: ['shadow', 'individuation'],
    estimatedTime: 25
  }
};

const mockQuestions: Question[] = [
  {
    id: 'adaptive-q1',
    type: 'multiple-choice',
    question: 'How does shadow projection manifest?',
    options: [
      { id: 'aq1-a', text: 'Through dreams', isCorrect: false },
      { id: 'aq1-b', text: 'Through external blame', isCorrect: true },
      { id: 'aq1-c', text: 'Through memory', isCorrect: false },
      { id: 'aq1-d', text: 'Through logic', isCorrect: false }
    ],
    correctAnswer: 1,
    explanation: 'Shadow projection involves attributing our dark aspects to others',
    points: 12,
    order: 1,
    metadata: { difficulty: 'intermediate' }
  }
];

const mockTemplate = {
  topic: 'Shadow',
  difficulty: 'medium',
  structure: 'In the context of {context}, which of the following best describes...?',
  conceptDepth: 3,
  optionPatterns: ['correct concept', 'related but incorrect', 'completely wrong', 'partial truth'],
  commonMisconceptions: ['shadow is evil', 'shadow should be eliminated'],
  educationalNotes: 'Focus on integration rather than elimination'
};

describe('Quiz Example Usage - Comprehensive Tests', () => {
  let mockQuizGeneratorInstance: jest.Mocked<EnhancedQuizGenerator>;
  let mockOpenAIProviderInstance: jest.Mocked<OpenAIProvider>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup EnhancedQuizGenerator mock
    mockQuizGeneratorInstance = {
      generateEnhancedQuiz: jest.fn(),
      generateAdaptiveQuestions: jest.fn(),
      generatePracticeQuestions: jest.fn(),
      generateStudyGuide: jest.fn()
    } as any;
    mockEnhancedQuizGenerator.mockImplementation(() => mockQuizGeneratorInstance);

    // Setup OpenAI provider mock
    mockOpenAIProviderInstance = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      generateEmbedding: jest.fn()
    } as any;
    mockOpenAIProvider.mockImplementation(() => mockOpenAIProviderInstance);

    // Setup quiz enhancer mock
    mockQuizEnhancer.enhanceQuestions = jest.fn().mockResolvedValue(mockQuestions);

    // Setup template mock
    (getQuestionTemplate as jest.Mock).mockReturnValue(mockTemplate);
    (topicTemplates as any) = [
      { topic: 'Shadow', templates: [mockTemplate] },
      { topic: 'Anima', templates: [mockTemplate] }
    ];

    // Default mock returns
    mockQuizGeneratorInstance.generateEnhancedQuiz.mockResolvedValue(mockQuiz);
    mockQuizGeneratorInstance.generateAdaptiveQuestions.mockResolvedValue(mockQuestions);
    mockQuizGeneratorInstance.generatePracticeQuestions.mockResolvedValue(mockQuestions);
    mockQuizGeneratorInstance.generateStudyGuide.mockResolvedValue('Comprehensive study guide content...');

    // Mock environment variable
    process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';
  });

  describe('generateBeginnerQuiz', () => {
    it('should generate beginner-friendly quiz', async () => {
      const quiz = await generateBeginnerQuiz();

      expect(quiz).toBeDefined();
      expect(quiz).toEqual(mockQuiz);
      expect(mockQuizGeneratorInstance.generateEnhancedQuiz).toHaveBeenCalledWith(
        'module-intro-001',
        'Collective Unconscious',
        expect.stringContaining('collective unconscious'),
        [
          'Define the collective unconscious',
          'Identify basic archetypes',
          'Distinguish collective from personal unconscious'
        ],
        8,
        expect.objectContaining({
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: false,
          includeEssayQuestions: false,
          contextualizeQuestions: true,
          userLevel: 'beginner'
        })
      );

      expect(console.log).toHaveBeenCalledWith('Generated beginner quiz:', expect.objectContaining({
        title: mockQuiz.title,
        questionCount: mockQuiz.questions.length
      }));
    });

    it('should handle quiz generation errors', async () => {
      mockQuizGeneratorInstance.generateEnhancedQuiz.mockRejectedValue(new Error('Generation failed'));

      await expect(generateBeginnerQuiz()).rejects.toThrow('Generation failed');
    });

    it('should use correct options for beginner level', async () => {
      await generateBeginnerQuiz();

      const options = mockQuizGeneratorInstance.generateEnhancedQuiz.mock.calls[0][5];
      expect(options).toMatchObject({
        adaptiveDifficulty: false,
        includeEssayQuestions: false,
        userLevel: 'beginner'
      });
    });
  });

  describe('generateAdvancedQuiz', () => {
    it('should generate advanced quiz with essays', async () => {
      const quiz = await generateAdvancedQuiz();

      expect(quiz).toBeDefined();
      expect(mockQuizGeneratorInstance.generateEnhancedQuiz).toHaveBeenCalledWith(
        'module-adv-shadow',
        'Shadow',
        expect.stringContaining('shadow represents'),
        [
          'Analyze shadow projection mechanisms',
          'Evaluate integration strategies',
          'Synthesize shadow work with individuation'
        ],
        12,
        expect.objectContaining({
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: true,
          includeEssayQuestions: true,
          contextualizeQuestions: true,
          userLevel: 'advanced'
        })
      );
    });

    it('should use correct options for advanced level', async () => {
      await generateAdvancedQuiz();

      const options = mockQuizGeneratorInstance.generateEnhancedQuiz.mock.calls[0][5];
      expect(options).toMatchObject({
        adaptiveDifficulty: true,
        includeEssayQuestions: true,
        userLevel: 'advanced'
      });
    });
  });

  describe('generateAdaptiveFollowUp', () => {
    it('should generate adaptive questions based on performance', async () => {
      const previousPerformance = [
        { questionId: 'q1', correct: true, difficulty: 'easy' },
        { questionId: 'q2', correct: false, difficulty: 'medium' },
        { questionId: 'q3', correct: true, difficulty: 'medium' }
      ];

      const questions = await generateAdaptiveFollowUp('Shadow Work', previousPerformance);

      expect(questions).toBeDefined();
      expect(questions).toEqual(mockQuestions);

      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalledWith(
        'Shadow Work',
        [
          { correct: true, difficulty: 'easy' },
          { correct: false, difficulty: 'medium' },
          { correct: true, difficulty: 'medium' }
        ],
        5
      );

      expect(mockQuizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        mockQuestions,
        'Shadow Work',
        expect.objectContaining({
          addExplanations: true,
          improveDistractors: true,
          varyQuestionStems: true,
          addReferences: true,
          contextualizeQuestions: false
        })
      );
    });

    it('should handle empty performance data', async () => {
      const questions = await generateAdaptiveFollowUp('Test Topic', []);

      expect(questions).toBeDefined();
      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalledWith(
        'Test Topic',
        [],
        5
      );
    });

    it('should handle enhancement errors gracefully', async () => {
      mockQuizEnhancer.enhanceQuestions.mockRejectedValue(new Error('Enhancement failed'));

      await expect(generateAdaptiveFollowUp('Topic', [])).rejects.toThrow('Enhancement failed');
    });
  });

  describe('generateConceptPractice', () => {
    it('should generate practice questions for specific concept', async () => {
      const questions = await generateConceptPractice('Psychology', 'archetypes');

      expect(questions).toBeDefined();
      expect(questions).toEqual(mockQuestions);

      expect(mockQuizGeneratorInstance.generatePracticeQuestions).toHaveBeenCalledWith(
        'Psychology',
        'archetypes',
        5
      );

      expect(mockQuizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        mockQuestions,
        'Psychology',
        expect.objectContaining({
          addExplanations: true,
          improveDistractors: true,
          varyQuestionStems: false,
          addReferences: true,
          contextualizeQuestions: true
        })
      );
    });

    it('should handle practice generation errors', async () => {
      mockQuizGeneratorInstance.generatePracticeQuestions.mockRejectedValue(new Error('Practice failed'));

      await expect(generateConceptPractice('Topic', 'concept')).rejects.toThrow('Practice failed');
    });
  });

  describe('generatePersonalizedStudyGuide', () => {
    it('should generate study guide based on quiz performance', async () => {
      const userResponses = [
        { questionId: 'q1', answer: 1, correct: true },
        { questionId: 'q2', answer: 0, correct: false }
      ];

      const studyGuide = await generatePersonalizedStudyGuide(mockQuiz, userResponses);

      expect(studyGuide).toBeDefined();
      expect(typeof studyGuide).toBe('string');
      expect(studyGuide).toBe('Comprehensive study guide content...');

      expect(mockQuizGeneratorInstance.generateStudyGuide).toHaveBeenCalledWith(
        mockQuiz,
        [
          { questionId: 'q1', correct: true },
          { questionId: 'q2', correct: false }
        ],
        'Jung'
      );
    });

    it('should extract topic from quiz title correctly', async () => {
      const quizWithComplexTitle = {
        ...mockQuiz,
        title: 'Advanced Shadow Work - Module 3'
      };

      await generatePersonalizedStudyGuide(quizWithComplexTitle, []);

      expect(mockQuizGeneratorInstance.generateStudyGuide).toHaveBeenCalledWith(
        quizWithComplexTitle,
        [],
        'Advanced'
      );
    });
  });

  describe('demonstrateTemplateUsage', () => {
    it('should demonstrate template functionality', () => {
      demonstrateTemplateUsage();

      expect(getQuestionTemplate).toHaveBeenCalledWith('Shadow', 'medium');
      expect(console.log).toHaveBeenCalledWith('Available topics:', expect.any(Array));
      expect(console.log).toHaveBeenCalledWith('Shadow question template:', mockTemplate);
      expect(console.log).toHaveBeenCalledWith('Example question:', expect.stringContaining('workplace criticism'));
      expect(console.log).toHaveBeenCalledWith('Distractor patterns:', mockTemplate.optionPatterns);
    });

    it('should handle templates without option patterns', () => {
      const templateWithoutOptions = { ...mockTemplate, optionPatterns: undefined };
      (getQuestionTemplate as jest.Mock).mockReturnValue(templateWithoutOptions);

      expect(() => demonstrateTemplateUsage()).not.toThrow();
    });
  });

  describe('completeQuizWorkflow', () => {
    it('should execute complete quiz workflow', async () => {
      const result = await completeQuizWorkflow('module-001', 'Collective Unconscious');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('quiz');
      expect(result).toHaveProperty('userResponses');
      expect(result).toHaveProperty('followUpQuestions');
      expect(result).toHaveProperty('studyGuide');
      expect(result).toHaveProperty('practiceQuestions');

      expect(result.quiz).toEqual(mockQuiz);
      expect(result.userResponses).toHaveLength(mockQuiz.questions.length);
      expect(result.followUpQuestions).toEqual(mockQuestions);
      expect(result.studyGuide).toBe('Comprehensive study guide content...');
      expect(result.practiceQuestions).toEqual(mockQuestions);

      // Verify all steps were called
      expect(mockQuizGeneratorInstance.generateEnhancedQuiz).toHaveBeenCalled();
      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalled();
      expect(mockQuizGeneratorInstance.generateStudyGuide).toHaveBeenCalled();
      expect(mockQuizGeneratorInstance.generatePracticeQuestions).toHaveBeenCalled();

      expect(console.log).toHaveBeenCalledWith('Starting quiz workflow for Collective Unconscious...');
      expect(console.log).toHaveBeenCalledWith('✓ Quiz generated');
      expect(console.log).toHaveBeenCalledWith('✓ Adaptive questions generated:', mockQuestions.length);
    });

    it('should simulate realistic user responses', async () => {
      const result = await completeQuizWorkflow('test-module', 'Test Topic');

      // Check that user responses were simulated with some wrong answers
      const correctCount = result.userResponses.filter(r => r.correct).length;
      const totalQuestions = result.userResponses.length;
      
      expect(correctCount).toBeGreaterThan(0);
      expect(correctCount).toBeLessThan(totalQuestions); // Some should be wrong
    });

    it('should handle workflow errors gracefully', async () => {
      mockQuizGeneratorInstance.generateEnhancedQuiz.mockRejectedValue(new Error('Workflow error'));

      await expect(completeQuizWorkflow('module', 'topic')).rejects.toThrow('Workflow error');
    });
  });

  describe('demonstrateQuestionValidation', () => {
    it('should demonstrate multiple choice validation', () => {
      console.log = jest.fn();
      
      demonstrateQuestionValidation();

      expect(console.log).toHaveBeenCalledWith('Multiple choice:', 'Correct!');
    });

    it('should demonstrate short answer validation', () => {
      console.log = jest.fn();
      
      demonstrateQuestionValidation();

      expect(console.log).toHaveBeenCalledWith('Short answer:', 'Good answer!');
    });

    it('should demonstrate essay scoring', () => {
      console.log = jest.fn();
      
      demonstrateQuestionValidation();

      expect(console.log).toHaveBeenCalledWith('Essay score:', expect.any(Number), 'points (based on word count)');
    });

    it('should not throw on validation demonstrations', () => {
      expect(() => demonstrateQuestionValidation()).not.toThrow();
    });
  });

  describe('Integration Patterns', () => {
    it('should properly integrate EnhancedQuizGenerator with enhancer', async () => {
      await generateAdaptiveFollowUp('Topic', []);

      expect(mockQuizGeneratorInstance.generateAdaptiveQuestions).toHaveBeenCalledBefore(
        mockQuizEnhancer.enhanceQuestions as jest.Mock
      );
    });

    it('should pass correct parameters between components', async () => {
      const topic = 'Advanced Psychology';
      const concept = 'shadow projection';
      
      await generateConceptPractice(topic, concept);

      expect(mockQuizGeneratorInstance.generatePracticeQuestions).toHaveBeenCalledWith(
        topic, concept, 5
      );
      
      expect(mockQuizEnhancer.enhanceQuestions).toHaveBeenCalledWith(
        mockQuestions,
        topic,
        expect.any(Object)
      );
    });

    it('should handle service dependency initialization', () => {
      expect(mockOpenAIProvider).toHaveBeenCalledWith(process.env.REACT_APP_OPENAI_API_KEY);
      expect(mockEnhancedQuizGenerator).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.REACT_APP_OPENAI_API_KEY;

      // Should still work with empty string fallback
      await generateBeginnerQuiz();
      
      expect(mockOpenAIProvider).toHaveBeenCalledWith('');
    });

    it('should handle quiz with no questions', async () => {
      const emptyQuiz = { ...mockQuiz, questions: [] };
      mockQuizGeneratorInstance.generateEnhancedQuiz.mockResolvedValue(emptyQuiz);

      const result = await completeQuizWorkflow('module', 'topic');

      expect(result.userResponses).toEqual([]);
      expect(result.quiz).toEqual(emptyQuiz);
    });

    it('should handle invalid performance data format', async () => {
      const invalidPerformance = [
        { questionId: 'q1' }, // missing required fields
        { correct: true }, // missing questionId
      ];

      // Should not crash, though may produce unexpected results
      expect(async () => {
        await generateAdaptiveFollowUp('Topic', invalidPerformance as any);
      }).not.toThrow();
    });

    it('should handle template system failures', () => {
      (getQuestionTemplate as jest.Mock).mockImplementation(() => {
        throw new Error('Template error');
      });

      expect(() => demonstrateTemplateUsage()).toThrow('Template error');
    });

    it('should handle concurrent quiz generation', async () => {
      const promises = Array(5).fill(null).map((_, i) => 
        generateBeginnerQuiz()
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(quiz => {
        expect(quiz).toEqual(mockQuiz);
      });
    });

    it('should handle large numbers of questions', async () => {
      const largeQuiz = {
        ...mockQuiz,
        questions: Array(100).fill(mockQuiz.questions[0]).map((q, i) => ({
          ...q,
          id: `q${i}`,
          order: i
        }))
      };
      
      mockQuizGeneratorInstance.generateEnhancedQuiz.mockResolvedValue(largeQuiz);

      const result = await completeQuizWorkflow('module', 'topic');

      expect(result.userResponses).toHaveLength(100);
      expect(result.quiz.questions).toHaveLength(100);
    });
  });

  describe('Async Behavior and Timing', () => {
    it('should handle timeouts gracefully', async () => {
      jest.setTimeout(15000);
      
      mockQuizGeneratorInstance.generateEnhancedQuiz.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockQuiz), 100))
      );

      const startTime = Date.now();
      const quiz = await generateBeginnerQuiz();
      const endTime = Date.now();

      expect(quiz).toBeDefined();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle rapid successive calls', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(generateBeginnerQuiz());
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(quiz => {
        expect(quiz).toEqual(mockQuiz);
      });
    });
  });
});