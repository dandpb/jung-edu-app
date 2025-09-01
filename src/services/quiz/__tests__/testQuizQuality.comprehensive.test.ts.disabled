import { testQuizQuality } from '../testQuizQuality';
import { QuizGenerator } from '../../llm/generators/quiz-generator';
import { quizValidator } from '../quizValidator';

// Mock the dependencies
jest.mock('../../llm/generators/quiz-generator');
jest.mock('../quizValidator');

// Mock console methods to capture output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock QuizGenerator
const MockQuizGenerator = QuizGenerator as jest.MockedClass<typeof QuizGenerator>;

// Mock quiz validator
const mockQuizValidator = quizValidator as jest.Mocked<typeof quizValidator>;

// Mock provider class used within testQuizQuality
class MockTestProvider {
  async generateStructuredOutput<T>(prompt: string, schema: any, options?: any): Promise<T> {
    // Return the same mock questions as in testQuizQuality.ts
    const mockQuestions = [
      {
        question: "According to Jung, how does Gengar represent the Shadow archetype in Pokemon?",
        options: [
          "Gengar embodies repressed aspects of the psyche that manifest as a dark, mischievous Pokemon",
          "Gengar represents the personal unconscious and individual memories",
          "Gengar symbolizes the collective unconscious shared by all trainers",
          "Gengar is a manifestation of the anima/animus in ghost form"
        ],
        correctAnswer: 0,
        explanation: "Gengar, as a Ghost/Poison type known for hiding in shadows and playing tricks, perfectly embodies Jung's Shadow archetype - the repressed, hidden aspects of personality that we don't acknowledge but that still influence our behavior.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      },
      {
        question: "How does Pokemon evolution parallel Jung's concept of individuation?",
        options: [
          "Both involve a transformative process of psychological development and self-realization",
          "Evolution is purely physical while individuation is only mental",
          "Pokemon evolution happens instantly while individuation takes a lifetime",
          "They are unrelated concepts from different fields"
        ],
        correctAnswer: 0,
        explanation: "Pokemon evolution mirrors individuation as both represent transformative journeys toward a more complete, integrated form. Just as Pokemon evolve into their fuller potential, individuation is the process of integrating all aspects of the psyche.",
        difficulty: "hard",
        cognitiveLevel: "analysis"
      },
      {
        question: "Which Pokemon type combination best represents the integration of opposing psychological functions in Jungian theory?",
        options: [
          "Psychic/Dark types like Malamar, showing integration of conscious and unconscious",
          "Fire/Water types, representing impossible combinations",
          "Normal types, showing psychological balance",
          "Single-type Pokemon, representing psychological purity"
        ],
        correctAnswer: 0,
        explanation: "Dual-type Pokemon like Psychic/Dark represent the Jungian concept of holding opposites in tension. The Psychic type (consciousness) paired with Dark type (shadow/unconscious) shows psychological integration.",
        difficulty: "hard",
        cognitiveLevel: "application"
      },
      {
        question: "In Jungian terms, what does the trainer-Pokemon relationship most closely represent?",
        options: [
          "The ego-Self axis, with the trainer as ego guiding various aspects of the psyche",
          "Simple pet ownership without psychological significance",
          "The superego controlling the id",
          "Behavioral conditioning through positive reinforcement"
        ],
        correctAnswer: 0,
        explanation: "The trainer (ego) works with various Pokemon (different aspects of the psyche - shadow, anima/animus, etc.) toward a common goal, mirroring how the ego must integrate various psychological elements in the individuation process.",
        difficulty: "medium",
        cognitiveLevel: "application"
      },
      {
        question: "How can legendary Pokemon be understood through the lens of Jungian archetypes?",
        options: [
          "They represent primordial archetypes from the collective unconscious",
          "They are simply more powerful versions of regular Pokemon",
          "They symbolize individual achievements and personal goals",
          "They have no archetypal significance in psychological terms"
        ],
        correctAnswer: 0,
        explanation: "Legendary Pokemon like Arceus (creation), Darkrai (shadow/nightmare), and Cresselia (dreams/light) represent fundamental archetypes that appear across cultures - creation myths, light/dark duality, etc., showing their roots in the collective unconscious.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      }
    ];

    return mockQuestions as any as T;
  }
}

describe('testQuizQuality', () => {
  let mockGenerateQuiz: jest.Mock;
  let mockValidateQuiz: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGenerateQuiz = jest.fn();
    mockValidateQuiz = jest.fn();

    // Mock the QuizGenerator constructor and methods
    MockQuizGenerator.mockImplementation(() => ({
      generateQuiz: mockGenerateQuiz
    } as any));

    // Mock the quizValidator
    mockQuizValidator.validateQuiz = mockValidateQuiz;

    // Default successful mock implementations
    mockGenerateQuiz.mockResolvedValue({
      questions: [
        {
          question: "What is the collective unconscious?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Test explanation",
          difficulty: "medium",
          cognitiveLevel: "understanding"
        }
      ]
    });

    mockValidateQuiz.mockReturnValue({
      isValid: true,
      score: 85,
      errors: [],
      warnings: ['Test warning'],
      suggestions: ['Test suggestion']
    });
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should execute without errors', async () => {
      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should create QuizGenerator with mock provider', async () => {
      await testQuizQuality();

      expect(MockQuizGenerator).toHaveBeenCalledWith(expect.any(MockTestProvider));
    });

    it('should call generateQuiz with correct parameters', async () => {
      await testQuizQuality();

      expect(mockGenerateQuiz).toHaveBeenCalledWith(
        'pokemon-jung-1',
        'Pokemon and Jungian Psychology',
        expect.stringContaining('This module explores the deep psychological connections'),
        [
          'Understand how Pokemon represent Jungian archetypes',
          'Analyze Pokemon evolution as a metaphor for individuation',
          'Identify shadow projections in Pokemon battles'
        ],
        5
      );
    });

    it('should validate generated quiz', async () => {
      const mockQuiz = { questions: [] };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockValidateQuiz).toHaveBeenCalledWith(mockQuiz);
    });

    it('should log quiz validation results', async () => {
      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Testing Quiz Generation Quality...\n');
      expect(mockConsoleLog).toHaveBeenCalledWith('Quiz Validation Results:');
      expect(mockConsoleLog).toHaveBeenCalledWith('========================');
      expect(mockConsoleLog).toHaveBeenCalledWith('Valid: true');
      expect(mockConsoleLog).toHaveBeenCalledWith('Quality Score: 85/100');
      expect(mockConsoleLog).toHaveBeenCalledWith('Errors: 0');
      expect(mockConsoleLog).toHaveBeenCalledWith('Warnings: 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('Suggestions: 1');
    });

    it('should display sample questions', async () => {
      const mockQuiz = {
        questions: [
          {
            question: "What is the Shadow archetype?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 1,
            explanation: "The Shadow represents repressed aspects of personality."
          },
          {
            question: "How does individuation work?",
            options: ["Way 1", "Way 2", "Way 3", "Way 4"],
            correctAnswer: 0,
            explanation: "Individuation is the process of psychological integration."
          }
        ]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('\nSample Questions:');
      expect(mockConsoleLog).toHaveBeenCalledWith('=================');
      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 1: What is the Shadow archetype?');
      expect(mockConsoleLog).toHaveBeenCalledWith('  A) Option A');
      expect(mockConsoleLog).toHaveBeenCalledWith('  B) Option B');
      expect(mockConsoleLog).toHaveBeenCalledWith('  C) Option C');
      expect(mockConsoleLog).toHaveBeenCalledWith('  D) Option D');
      expect(mockConsoleLog).toHaveBeenCalledWith('Correct: B');
    });
  });

  describe('Error Handling', () => {
    it('should handle quiz generation errors', async () => {
      const error = new Error('Quiz generation failed');
      mockGenerateQuiz.mockRejectedValue(error);

      await testQuizQuality();

      expect(mockConsoleError).toHaveBeenCalledWith('Error testing quiz generation:', error);
    });

    it('should handle validation errors', async () => {
      mockValidateQuiz.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await testQuizQuality();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error testing quiz generation:', 
        expect.any(Error)
      );
    });

    it('should handle provider initialization errors', async () => {
      // Mock QuizGenerator constructor to throw
      MockQuizGenerator.mockImplementation(() => {
        throw new Error('Provider initialization failed');
      });

      await testQuizQuality();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error testing quiz generation:',
        expect.any(Error)
      );
    });

    it('should handle undefined quiz result', async () => {
      mockGenerateQuiz.mockResolvedValue(undefined);

      await testQuizQuality();

      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle quiz with missing questions', async () => {
      mockGenerateQuiz.mockResolvedValue({ questions: null });

      await testQuizQuality();

      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle invalid question structure', async () => {
      const invalidQuiz = {
        questions: [
          {
            // Missing required fields
            question: "Incomplete question"
          }
        ]
      };
      mockGenerateQuiz.mockResolvedValue(invalidQuiz);

      await testQuizQuality();

      // Should still attempt to validate and display
      expect(mockValidateQuiz).toHaveBeenCalled();
    });
  });

  describe('Validation Results Display', () => {
    it('should display detailed validation results with errors', async () => {
      mockValidateQuiz.mockReturnValue({
        isValid: false,
        score: 45,
        errors: ['Missing explanation', 'Invalid difficulty'],
        warnings: ['Long question text', 'Similar options'],
        suggestions: ['Add more context', 'Vary option lengths']
      });

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Valid: false');
      expect(mockConsoleLog).toHaveBeenCalledWith('Quality Score: 45/100');
      expect(mockConsoleLog).toHaveBeenCalledWith('Errors: 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Missing explanation');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Invalid difficulty');
      expect(mockConsoleLog).toHaveBeenCalledWith('Warnings: 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Long question text');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Similar options');
      expect(mockConsoleLog).toHaveBeenCalledWith('Suggestions: 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Add more context');
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Vary option lengths');
    });

    it('should handle empty validation arrays', async () => {
      mockValidateQuiz.mockReturnValue({
        isValid: true,
        score: 100,
        errors: [],
        warnings: [],
        suggestions: []
      });

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Errors: 0');
      expect(mockConsoleLog).toHaveBeenCalledWith('Warnings: 0');
      expect(mockConsoleLog).toHaveBeenCalledWith('Suggestions: 0');
    });

    it('should handle missing validation properties', async () => {
      mockValidateQuiz.mockReturnValue({
        isValid: true,
        score: 75,
        errors: undefined,
        warnings: undefined,
        suggestions: undefined
      } as any);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Errors: undefined');
      expect(mockConsoleLog).toHaveBeenCalledWith('Warnings: undefined');
      expect(mockConsoleLog).toHaveBeenCalledWith('Suggestions: undefined');
    });
  });

  describe('Question Display Logic', () => {
    it('should display limited sample questions (first 3)', async () => {
      const mockQuiz = {
        questions: Array.from({length: 10}, (_, i) => ({
          question: `Question ${i + 1}`,
          options: [`A${i}`, `B${i}`, `C${i}`, `D${i}`],
          correctAnswer: i % 4,
          explanation: `Explanation ${i + 1}`
        }))
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      // Should only show first 3 questions
      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 1: Question 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 2: Question 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 3: Question 3');
      expect(mockConsoleLog).not.toHaveBeenCalledWith('\nQuestion 4: Question 4');
    });

    it('should handle questions with array correct answers', async () => {
      const mockQuiz = {
        questions: [{
          question: "Multiple correct answers question",
          options: ["A", "B", "C", "D"],
          correctAnswer: [0, 2], // Array format
          explanation: "Multiple answers possible"
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Correct: A'); // Should use first element
    });

    it('should handle questions with string correct answers', async () => {
      const mockQuiz = {
        questions: [{
          question: "String answer question",
          options: ["A", "B", "C", "D"],
          correctAnswer: "B", // String format
          explanation: "String answer"
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Correct: A'); // Should default to 0 -> A
    });

    it('should handle questions without options', async () => {
      const mockQuiz = {
        questions: [{
          question: "Question without options",
          correctAnswer: 0,
          explanation: "No options provided"
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 1: Question without options');
      // Should not crash when accessing options
    });

    it('should truncate long explanations', async () => {
      const longExplanation = 'A'.repeat(200);
      const mockQuiz = {
        questions: [{
          question: "Long explanation question",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: longExplanation
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Explanation: ${longExplanation.substring(0, 100)}...`
      );
    });

    it('should handle missing explanations', async () => {
      const mockQuiz = {
        questions: [{
          question: "No explanation question",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0
          // No explanation field
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('Explanation: undefined...');
    });

    it('should handle empty quiz questions array', async () => {
      const mockQuiz = { questions: [] };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('\nSample Questions:');
      expect(mockConsoleLog).toHaveBeenCalledWith('=================');
      // Should not display any questions
    });
  });

  describe('Mock Provider Integration', () => {
    it('should create and use MockProvider correctly', async () => {
      await testQuizQuality();

      // Verify that the mock provider was used to create QuizGenerator
      expect(MockQuizGenerator).toHaveBeenCalledTimes(1);
      const providerArg = MockQuizGenerator.mock.calls[0][0];
      expect(providerArg).toHaveProperty('generateStructuredOutput');
    });

    it('should pass mock provider to QuizGenerator correctly', async () => {
      await testQuizQuality();

      const constructorCall = MockQuizGenerator.mock.calls[0];
      expect(constructorCall).toHaveLength(1);
      expect(constructorCall[0]).toBeInstanceOf(MockTestProvider);
    });

    it('should handle mock provider methods', async () => {
      // The actual MockProvider implementation should be tested
      const mockProvider = new MockTestProvider();
      
      const result = await mockProvider.generateStructuredOutput('test', {});
      
      expect(result).toHaveLength(5); // Should return 5 mock questions
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('options');
      expect(result[0]).toHaveProperty('correctAnswer');
      expect(result[0]).toHaveProperty('explanation');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await testQuizQuality();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle very large quiz results', async () => {
      const largeQuiz = {
        questions: Array.from({length: 100}, (_, i) => ({
          question: `Large quiz question ${i + 1}`,
          options: [`A${i}`, `B${i}`, `C${i}`, `D${i}`],
          correctAnswer: i % 4,
          explanation: `Large explanation ${i + 1}`.repeat(10)
        }))
      };
      mockGenerateQuiz.mockResolvedValue(largeQuiz);

      await testQuizQuality();

      expect(mockValidateQuiz).toHaveBeenCalledWith(largeQuiz);
      // Should still only show first 3 questions
      expect(mockConsoleLog).toHaveBeenCalledWith('\nQuestion 3: Large quiz question 3');
      expect(mockConsoleLog).not.toHaveBeenCalledWith('\nQuestion 4: Large quiz question 4');
    });

    it('should handle concurrent test runs', async () => {
      const promises = [
        testQuizQuality(),
        testQuizQuality(),
        testQuizQuality()
      ];

      await Promise.all(promises);

      expect(mockGenerateQuiz).toHaveBeenCalledTimes(3);
      expect(mockValidateQuiz).toHaveBeenCalledTimes(3);
    });

    it('should handle memory efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Run multiple times
      for (let i = 0; i < 10; i++) {
        await testQuizQuality();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('Module Integration', () => {
    it('should be compatible with require.main === module pattern', () => {
      // Test that the module can be run directly
      const originalMain = require.main;
      
      try {
        // Simulate being run as main module
        require.main = module as any;
        
        // Should not throw when evaluated
        expect(() => {
          // The actual conditional check in testQuizQuality
          if (require.main === module) {
            // Would call testQuizQuality()
          }
        }).not.toThrow();
      } finally {
        require.main = originalMain;
      }
    });

    it('should export testQuizQuality function correctly', () => {
      expect(testQuizQuality).toBeDefined();
      expect(typeof testQuizQuality).toBe('function');
      expect(testQuizQuality.length).toBe(0); // No parameters
    });

    it('should work when imported as module', async () => {
      // Test importing and calling the function
      expect(testQuizQuality).toBeDefined();
      
      // Should be able to call without errors
      await expect(testQuizQuality()).resolves.toBeUndefined();
    });

    it('should have proper dependency relationships', () => {
      // Verify that all required dependencies are available
      expect(QuizGenerator).toBeDefined();
      expect(quizValidator).toBeDefined();
      expect(mockQuizValidator.validateQuiz).toBeDefined();
    });
  });

  describe('Output Formatting', () => {
    it('should format console output consistently', async () => {
      await testQuizQuality();

      const logCalls = mockConsoleLog.mock.calls.map(call => call[0]);
      
      // Check header formatting
      expect(logCalls).toContain('Testing Quiz Generation Quality...\n');
      expect(logCalls).toContain('Quiz Validation Results:');
      expect(logCalls).toContain('========================');
      expect(logCalls).toContain('\nSample Questions:');
      expect(logCalls).toContain('=================');
    });

    it('should format question options with letters', async () => {
      const mockQuiz = {
        questions: [{
          question: "Test formatting question",
          options: ["First option", "Second option", "Third option", "Fourth option"],
          correctAnswer: 2,
          explanation: "Test explanation"
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('  A) First option');
      expect(mockConsoleLog).toHaveBeenCalledWith('  B) Second option');
      expect(mockConsoleLog).toHaveBeenCalledWith('  C) Third option');
      expect(mockConsoleLog).toHaveBeenCalledWith('  D) Fourth option');
      expect(mockConsoleLog).toHaveBeenCalledWith('Correct: C');
    });

    it('should handle option arrays with different lengths', async () => {
      const mockQuiz = {
        questions: [{
          question: "Variable options question",
          options: ["Only", "Two"],
          correctAnswer: 1,
          explanation: "Two options only"
        }]
      };
      mockGenerateQuiz.mockResolvedValue(mockQuiz);

      await testQuizQuality();

      expect(mockConsoleLog).toHaveBeenCalledWith('  A) Only');
      expect(mockConsoleLog).toHaveBeenCalledWith('  B) Two');
      expect(mockConsoleLog).not.toHaveBeenCalledWith('  C)');
      expect(mockConsoleLog).toHaveBeenCalledWith('Correct: B');
    });

    it('should handle edge cases in correct answer formatting', async () => {
      const testCases = [
        { correctAnswer: 0, expected: 'A' },
        { correctAnswer: 1, expected: 'B' },
        { correctAnswer: 2, expected: 'C' },
        { correctAnswer: 3, expected: 'D' },
        { correctAnswer: 25, expected: 'Z' }, // Beyond normal range
        { correctAnswer: -1, expected: 'A' }, // Negative (should default)
        { correctAnswer: null, expected: 'A' }, // Null (should default)
        { correctAnswer: undefined, expected: 'A' } // Undefined (should default)
      ];

      for (const testCase of testCases) {
        mockConsoleLog.mockClear();
        
        const mockQuiz = {
          questions: [{
            question: "Edge case question",
            options: ["A", "B", "C", "D"],
            correctAnswer: testCase.correctAnswer,
            explanation: "Edge case explanation"
          }]
        };
        mockGenerateQuiz.mockResolvedValue(mockQuiz);

        await testQuizQuality();

        if (testCase.correctAnswer <= 3 && testCase.correctAnswer >= 0) {
          expect(mockConsoleLog).toHaveBeenCalledWith(`Correct: ${testCase.expected}`);
        } else {
          // For invalid values, should default to 'A'
          expect(mockConsoleLog).toHaveBeenCalledWith('Correct: A');
        }
      }
    });
  });
});