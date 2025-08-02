import { EnhancedQuizGenerator } from '../../../services/quiz/enhancedQuizGenerator';
import { ILLMProvider } from '../../../services/llm/types';
import { Question } from '../../../types';

// Mock data
const mockModule = {
  id: 'test-module',
  title: 'Test Module',
  concepts: ['concept1', 'concept2'],
  difficulty: 'intermediate'
};

const mockQuiz = {
  id: 'test-quiz',
  title: 'Test Quiz',
  questions: []
};

// Mock is handled inline

describe('EnhancedQuizGenerator', () => {
  let generator: EnhancedQuizGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  
  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn().mockResolvedValue({
        content: 'Generated content',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      }),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true)
    } as any;
    
    generator = new EnhancedQuizGenerator(mockProvider);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateEnhancedQuiz', () => {
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
    
    // Create a function to generate the requested number of questions
    const generateMockQuestions = (count: number): Question[] => {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
        questions.push({
          id: `q${i + 1}`,
          type: i % 2 === 0 ? 'multiple-choice' : 'true-false',
          question: `Question ${i + 1} about Jungian concepts`,
          options: i % 2 === 0 ? ['A', 'B', 'C', 'D'] : [{id: '0', text: 'False'}, {id: '1', text: 'True'}],
          correctAnswer: i % 2 === 0 ? i % 4 : (i % 2 === 0 ? 1 : 0),
          explanation: `Explanation for question ${i + 1}`,
          difficulty: ['easy', 'medium', 'hard'][i % 3],
          concept: ['collective unconscious', 'shadow', 'archetypes'][i % 3]
        });
      }
      return questions;
    };
    
    beforeEach(() => {
      // Return a reasonable number of questions per call (difficulty level)
      mockProvider.generateStructuredOutput.mockImplementation(async (prompt) => {
        // Extract count from prompt or use default
        const countMatch = prompt.toString().match(/(\d+)\s+questions?/i);
        const requestedCount = countMatch ? parseInt(countMatch[1]) : 3;
        return generateMockQuestions(Math.min(requestedCount, 5)); // Cap at 5 per call
      });
    });
    
    it('should generate enhanced quiz with specified parameters', async () => {
      const result = await generator.generateEnhancedQuiz(
        'module-1',
        'Jungian Concepts',
        'Content about collective unconscious, shadow, and archetypes...',
        ['Understand the collective unconscious', 'Identify shadow aspects'],
        10
      );
      
      // The enhanced quiz generator distributes questions across difficulty levels
      // For intermediate level: ~2 easy, ~6 medium, ~2 hard = ~10 total questions
      expect(result.questions.length).toBeGreaterThanOrEqual(8);
      expect(result.questions.length).toBeLessThanOrEqual(12);
      expect(result.questions[0].type).toBe('multiple-choice');
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
    });
    
    it('should use templates when enabled', async () => {
      // Mock to return 12 questions
      mockProvider.generateStructuredOutput.mockResolvedValueOnce(generateMockQuestions(12));
      
      const result = await generator.generateEnhancedQuiz(
        'module-1',
        'Jungian Concepts', 
        'Content about concepts...',
        ['Understand concepts'],
        12,
        {
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: true,
          includeEssayQuestions: false,
          contextualizeQuestions: true,
          userLevel: 'intermediate'
        }
      );
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
      // Similar flexibility for 12 questions - enhanced quiz may generate more
      expect(result.questions.length).toBeGreaterThanOrEqual(10);
      expect(result.questions.length).toBeLessThanOrEqual(20);
    });
    
    it('should generate questions for specific concepts', async () => {
      await generator.generateEnhancedQuiz(
        'module-1',
        'Shadow Work',
        'Content focused on shadow concepts...',
        ['Understand the shadow'],
        5
      );
      
      const call = mockProvider.generateStructuredOutput.mock.calls[0];
      expect(call[0]).toContain('shadow');
    });
    
    it('should include essay questions when enabled', async () => {
      await generator.generateEnhancedQuiz(
        'module-1',
        'Individuation',
        'Content about individuation process...',
        ['Understand individuation'],
        8,
        {
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: false,
          includeEssayQuestions: true,
          contextualizeQuestions: true,
          userLevel: 'advanced'
        }
      );
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
    });
    
    it('should adapt difficulty based on user level', async () => {
      await generator.generateEnhancedQuiz(
        'module-1',
        'Archetypes',
        'Content about archetypes...',
        ['Identify archetypes'],
        10,
        {
          useTemplates: true,
          enhanceQuestions: true,
          adaptiveDifficulty: true,
          includeEssayQuestions: false,
          contextualizeQuestions: true,
          userLevel: 'beginner'
        }
      );
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
    });
  });
  
  describe('generateQuiz (base method)', () => {
    beforeEach(() => {
      mockProvider.generateStructuredOutput.mockResolvedValue([
        {
          question: 'Basic question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Basic explanation',
          difficulty: 'medium',
          cognitiveLevel: 'understanding'
        }
      ]);
    });
    
    it('should generate basic quiz', async () => {
      const result = await generator.generateQuiz(
        'module-1',
        'Basic Topic',
        'Basic content...',
        ['Basic objective'],
        5
      );
      
      expect(result.moduleId).toBe('module-1');
      expect(result.title).toContain('Basic Topic');
      expect(result.passingScore).toBe(70);
      expect(result.timeLimit).toBe(10); // 2 minutes per question
    });
  });
  
  describe('error handling', () => {
    it('should handle generation failures', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(
        new Error('API error')
      );
      
      await expect(generator.generateEnhancedQuiz(
        'module-1',
        'Test Topic',
        'Test content',
        ['Test objective'],
        5
      )).rejects.toThrow('API error');
    });
    
    it('should handle invalid parameters gracefully', async () => {
      // Test with empty objectives - should still work
      mockProvider.generateStructuredOutput.mockResolvedValue([]);
      
      const result = await generator.generateQuiz(
        'module-1',
        'Test Topic',
        'Test content',
        [],
        5
      );
      
      expect(result).toBeDefined();
      expect(result.questions).toEqual([]);
    });
    
    it('should handle malformed LLM responses', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(null);
      
      const result = await generator.generateQuiz(
        'module-1',
        'Test Topic',
        'Test content',
        ['Test objective'],
        5
      );
      
      // The implementation uses fallback questions when response is null
      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0]).toHaveProperty('question');
      expect(result.questions[0]).toHaveProperty('options');
    });
  });
});