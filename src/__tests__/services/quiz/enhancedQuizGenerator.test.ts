import { EnhancedQuizGenerator } from '../../../services/quiz/enhancedQuizGenerator';
import { LLMProvider } from '../../../services/llm/provider';
import { mockQuiz, mockModule } from '../../mocks/mockData';
import { Question } from '../../../types';

jest.mock('../../../services/llm/provider');

describe('EnhancedQuizGenerator', () => {
  let generator: EnhancedQuizGenerator;
  let mockProvider: jest.Mocked<LLMProvider>;
  
  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      streamCompletion: jest.fn(),
      updateConfig: jest.fn()
    } as any;
    
    generator = new EnhancedQuizGenerator(mockProvider);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateQuiz', () => {
    const mockGeneratedQuestions: Question[] = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the collective unconscious?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'The collective unconscious is...',
        difficulty: 'easy',
        concept: 'collective unconscious'
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'The Shadow only contains negative traits.',
        correctAnswer: false,
        explanation: 'The Shadow contains both positive and negative...',
        difficulty: 'medium',
        concept: 'shadow'
      }
    ];
    
    beforeEach(() => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        questions: mockGeneratedQuestions
      });
    });
    
    it('should generate quiz with specified parameters', async () => {
      const result = await generator.generateQuiz({
        concepts: ['collective unconscious', 'shadow', 'archetypes'],
        difficulty: 'intermediate',
        questionCount: 10,
        questionTypes: ['multiple-choice', 'true-false', 'short-answer']
      });
      
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].type).toBe('multiple-choice');
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('collective unconscious'),
        expect.objectContaining({
          questions: expect.any(Object)
        })
      );
    });
    
    it('should balance question difficulty', async () => {
      await generator.generateQuiz({
        concepts: mockModule.concepts,
        difficulty: 'mixed',
        questionCount: 12,
        difficultyDistribution: {
          easy: 0.3,
          medium: 0.5,
          hard: 0.2
        }
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('30% easy');
      expect(prompt).toContain('50% medium');
      expect(prompt).toContain('20% hard');
    });
    
    it('should generate questions for specific concepts', async () => {
      await generator.generateQuiz({
        concepts: ['shadow'],
        difficulty: 'intermediate',
        questionCount: 5,
        conceptFocus: {
          shadow: 0.8,
          other: 0.2
        }
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('80% shadow');
    });
    
    it('should handle custom question templates', async () => {
      const customTemplates = [
        'What would Jung say about {concept}?',
        'How does {concept} manifest in daily life?'
      ];
      
      await generator.generateQuiz({
        concepts: mockModule.concepts,
        difficulty: 'intermediate',
        questionCount: 8,
        customTemplates
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('What would Jung say about');
    });
  });
  
  describe('generateAdaptiveQuiz', () => {
    it('should adapt based on previous performance', async () => {
      const performanceData = {
        correctAnswers: 7,
        totalQuestions: 10,
        conceptScores: {
          'collective unconscious': 0.9,
          'shadow': 0.6,
          'archetypes': 0.4
        },
        averageTime: 45 // seconds per question
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        questions: mockQuiz.questions
      });
      
      await generator.generateAdaptiveQuiz(
        mockModule.concepts,
        performanceData
      );
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('focus on weaker concepts');
      expect(prompt).toContain('archetypes'); // Lowest score
    });
    
    it('should increase difficulty for high performers', async () => {
      const highPerformance = {
        correctAnswers: 9,
        totalQuestions: 10,
        conceptScores: {
          'collective unconscious': 0.95,
          'shadow': 0.9
        },
        averageTime: 30
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        questions: mockQuiz.questions
      });
      
      await generator.generateAdaptiveQuiz(
        ['collective unconscious', 'shadow'],
        highPerformance
      );
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('increase difficulty');
      expect(prompt).toContain('advanced');
    });
  });
  
  describe('validateQuestion', () => {
    it('should validate multiple choice questions', () => {
      const validQuestion: Question = {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Valid question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Explanation',
        difficulty: 'easy',
        concept: 'test'
      };
      
      expect(() => generator.validateQuestion(validQuestion)).not.toThrow();
    });
    
    it('should reject invalid multiple choice questions', () => {
      const invalidQuestion: Question = {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Invalid question?',
        options: ['A', 'B'], // Too few options
        correctAnswer: 2, // Out of bounds
        explanation: '',
        difficulty: 'easy',
        concept: 'test'
      };
      
      expect(() => generator.validateQuestion(invalidQuestion))
        .toThrow('Multiple choice questions must have at least 3 options');
    });
    
    it('should validate true/false questions', () => {
      const validQuestion: Question = {
        id: 'q1',
        type: 'true-false',
        question: 'Is this true?',
        correctAnswer: true,
        explanation: 'Because...',
        difficulty: 'medium',
        concept: 'test'
      };
      
      expect(() => generator.validateQuestion(validQuestion)).not.toThrow();
    });
    
    it('should validate short answer questions', () => {
      const validQuestion: Question = {
        id: 'q1',
        type: 'short-answer',
        question: 'What is...?',
        correctAnswer: 'The answer',
        explanation: 'Because...',
        difficulty: 'hard',
        concept: 'test',
        acceptableAnswers: ['The answer', 'Answer', 'the answer']
      };
      
      expect(() => generator.validateQuestion(validQuestion)).not.toThrow();
    });
  });
  
  describe('enhanceQuestions', () => {
    it('should add hints to questions', async () => {
      const enhancedQuestions = await generator.enhanceQuestions(
        mockQuiz.questions,
        {
          addHints: true,
          addFollowUp: false
        }
      );
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        hint: 'Think about the unconscious mind shared by all humans'
      });
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(
        mockQuiz.questions.length
      );
    });
    
    it('should add follow-up questions', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        followUp: {
          question: 'Can you give an example?',
          expectedPoints: ['Dreams', 'Myths', 'Symbols']
        }
      });
      
      const enhanced = await generator.enhanceQuestions(
        [mockQuiz.questions[0]],
        {
          addHints: false,
          addFollowUp: true
        }
      );
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('follow-up question'),
        expect.any(Object)
      );
    });
  });
  
  describe('generateQuizVariations', () => {
    it('should create question variations', async () => {
      const originalQuestion = mockQuiz.questions[0];
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        variations: [
          {
            ...originalQuestion,
            question: 'According to Jung, what is the collective unconscious?',
            id: 'q1-var1'
          },
          {
            ...originalQuestion,
            question: 'How would you define the collective unconscious?',
            id: 'q1-var2'
          }
        ]
      });
      
      const variations = await generator.generateQuizVariations(
        originalQuestion,
        2
      );
      
      expect(variations).toHaveLength(2);
      expect(variations[0].question).not.toBe(originalQuestion.question);
    });
  });
  
  describe('analyzeQuizPerformance', () => {
    it('should analyze quiz results', async () => {
      const quizResults = {
        quiz: mockQuiz,
        answers: [
          { questionId: 'q1', answer: 1, correct: true, timeSpent: 30 },
          { questionId: 'q2', answer: true, correct: false, timeSpent: 45 },
          { questionId: 'q3', answer: 'Shadow', correct: true, timeSpent: 60 }
        ]
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        analysis: {
          overallScore: 0.67,
          strengths: ['Good understanding of collective unconscious'],
          weaknesses: ['Confusion about Shadow concept'],
          recommendations: ['Review Shadow material', 'Practice true/false questions'],
          conceptMastery: {
            'collective unconscious': 0.9,
            'shadow': 0.4,
            'archetypes': 0.7
          }
        }
      });
      
      const analysis = await generator.analyzeQuizPerformance(quizResults);
      
      expect(analysis.analysis.overallScore).toBe(0.67);
      expect(analysis.analysis.recommendations).toContain('Review Shadow material');
    });
  });
  
  describe('error handling', () => {
    it('should handle generation failures', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(
        new Error('API error')
      );
      
      await expect(generator.generateQuiz({
        concepts: ['test'],
        difficulty: 'easy',
        questionCount: 5
      })).rejects.toThrow('API error');
    });
    
    it('should validate quiz parameters', async () => {
      await expect(generator.generateQuiz({
        concepts: [],
        difficulty: 'easy',
        questionCount: 5
      })).rejects.toThrow('At least one concept is required');
      
      await expect(generator.generateQuiz({
        concepts: ['test'],
        difficulty: 'invalid' as any,
        questionCount: 5
      })).rejects.toThrow('Invalid difficulty level');
    });
    
    it('should handle malformed LLM responses', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        // Missing questions array
        quiz: 'Invalid structure'
      });
      
      await expect(generator.generateQuiz({
        concepts: ['test'],
        difficulty: 'easy',
        questionCount: 5
      })).rejects.toThrow('Invalid quiz structure');
    });
  });
});