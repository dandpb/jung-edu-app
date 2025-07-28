import {
  createMockLLMProvider,
  createMockQuestions,
  mockLLMResponses,
  createMockLLMProviderWithPatterns
} from '../llmProvider';
import { ILLMProvider } from '../../../services/llm/types';
import { Question } from '../../../types';

describe('LLM Provider Mock Utilities - Extended Edge Case Tests', () => {
  describe('createMockLLMProvider', () => {
    it('should create a complete mock provider with all methods', () => {
      const mockProvider = createMockLLMProvider();
      
      expect(mockProvider.generateCompletion).toBeDefined();
      expect(mockProvider.generateStructuredOutput).toBeDefined();
      expect(mockProvider.generateStructuredOutput).toBeDefined();
      expect(mockProvider.getTokenCount).toBeDefined();
      expect(mockProvider.isAvailable).toBeDefined();
      
      // All should be jest mock functions
      expect(jest.isMockFunction(mockProvider.generateCompletion)).toBe(true);
      expect(jest.isMockFunction(mockProvider.generateStructuredOutput)).toBe(true);
      expect(jest.isMockFunction(mockProvider.generateStructuredOutput)).toBe(true);
      expect(jest.isMockFunction(mockProvider.getTokenCount)).toBe(true);
      expect(jest.isMockFunction(mockProvider.isAvailable)).toBe(true);
    });

    it('should merge overrides correctly', () => {
      const customCompletion = jest.fn().mockResolvedValue('Custom response');
      const customTokenCount = jest.fn().mockReturnValue(500);
      
      const mockProvider = createMockLLMProvider({
        generateCompletion: customCompletion,
        getTokenCount: customTokenCount
      });
      
      expect(mockProvider.generateCompletion).toBe(customCompletion);
      expect(mockProvider.getTokenCount).toBe(customTokenCount);
      
      // Other methods should still have defaults
      expect(mockProvider.isAvailable()).resolves.toBe(true);
    });

    it('should handle partial overrides without affecting other methods', () => {
      const mockProvider = createMockLLMProvider({
        isAvailable: jest.fn().mockResolvedValue(false)
      });
      
      expect(mockProvider.isAvailable()).resolves.toBe(false);
      expect(mockProvider.generateCompletion('test')).resolves.toEqual({ content: 'Mock completion response', usage: undefined });
      expect(mockProvider.getTokenCount('test')).toBe(100);
    });

    it('should handle null/undefined overrides', () => {
      const mockProvider = createMockLLMProvider(undefined);
      expect(mockProvider).toBeDefined();
      expect(mockProvider.generateCompletion).toBeDefined();
    });

    it('should allow custom implementations', () => {
      let callCount = 0;
      const mockProvider = createMockLLMProvider({
        generateCompletion: jest.fn().mockImplementation((prompt) => {
          callCount++;
          return Promise.resolve({ content: `Response ${callCount}: ${prompt}`, usage: undefined });
        })
      });
      
      return Promise.all([
        mockProvider.generateCompletion('test1'),
        mockProvider.generateCompletion('test2')
      ]).then(([result1, result2]) => {
        expect(result1.content).toBe('Response 1: test1');
        expect(result2.content).toBe('Response 2: test2');
      });
    });
  });

  describe('createMockQuestions', () => {
    it('should create exact number of questions requested', () => {
      const counts = [0, 1, 5, 10, 100];
      counts.forEach(count => {
        const questions = createMockQuestions(count);
        expect(questions).toHaveLength(count);
      });
    });

    it('should create all multiple-choice questions when specified', () => {
      const questions = createMockQuestions(10, { type: 'multiple-choice' });
      
      questions.forEach(q => {
        expect(q.type).toBe('multiple-choice');
        expect(q.options).toBeDefined();
        expect(q.options).toHaveLength(4);
        expect(typeof q.correctAnswer).toBe('number');
      });
    });

    it('should create all true-false questions when specified', () => {
      const questions = createMockQuestions(10, { type: 'true-false' });
      
      questions.forEach(q => {
        expect(q.type).toBe('true-false');
        expect(q.options).toBeUndefined();
        expect(typeof q.correctAnswer).toBe('boolean');
      });
    });

    it('should create mixed question types by default', () => {
      const questions = createMockQuestions(10, { type: 'mixed' });
      
      const multipleChoice = questions.filter(q => q.type === 'multiple-choice');
      const trueFalse = questions.filter(q => q.type === 'true-false');
      
      expect(multipleChoice.length).toBeGreaterThan(0);
      expect(trueFalse.length).toBeGreaterThan(0);
      expect(multipleChoice.length + trueFalse.length).toBe(10);
    });

    it('should apply single difficulty level when specified', () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
      const expectedDifficulties = {
        'easy': 'beginner',
        'medium': 'intermediate', 
        'hard': 'advanced'
      };
      
      difficulties.forEach(difficulty => {
        const questions = createMockQuestions(5, { difficulty });
        questions.forEach(q => {
          expect(q.difficulty).toBe(expectedDifficulties[difficulty]);
        });
      });
    });

    it('should cycle through difficulties when mixed', () => {
      const questions = createMockQuestions(9, { difficulty: 'mixed' });
      
      const beginner = questions.filter(q => q.difficulty === 'beginner');
      const intermediate = questions.filter(q => q.difficulty === 'intermediate');
      const advanced = questions.filter(q => q.difficulty === 'advanced');
      
      expect(beginner).toHaveLength(3);
      expect(intermediate).toHaveLength(3);
      expect(advanced).toHaveLength(3);
    });

    it('should use custom concepts when provided', () => {
      const customConcepts = ['Self', 'Persona', 'Ego'];
      const questions = createMockQuestions(6, { concepts: customConcepts });
      
      questions.forEach((q, i) => {
        expect(q.tags?.[0]).toBe(customConcepts[i % customConcepts.length]);
        expect(q.question).toContain(customConcepts[i % customConcepts.length]);
        expect(q.explanation).toContain(customConcepts[i % customConcepts.length]);
      });
    });

    it('should cycle through cognitive levels', () => {
      const questions = createMockQuestions(8);
      const cognitiveLevels = ['remembering', 'understanding', 'applying', 'analyzing'];
      
      questions.forEach((q, i) => {
        expect(q.cognitiveLevel).toBe(cognitiveLevels[i % 4]);
      });
    });

    it('should handle edge case with empty concepts array', () => {
      const questions = createMockQuestions(3, { concepts: [] });
      
      questions.forEach(q => {
        expect(q.tags).toEqual(['undefined']);
        expect(q.question).toContain('undefined');
      });
    });

    it('should create valid question IDs', () => {
      const questions = createMockQuestions(100);
      const ids = new Set(questions.map(q => q.id));
      
      expect(ids.size).toBe(100); // All IDs should be unique
      questions.forEach((q, i) => {
        expect(q.id).toBe(`q${i + 1}`);
      });
    });

    it('should handle zero questions gracefully', () => {
      const questions = createMockQuestions(0);
      expect(questions).toEqual([]);
    });

    it('should distribute correct answers evenly for multiple choice', () => {
      const questions = createMockQuestions(40, { type: 'multiple-choice' });
      const answerCounts = [0, 0, 0, 0];
      
      questions.forEach(q => {
        answerCounts[q.correctAnswer as number]++;
      });
      
      // Each answer option should be used roughly equally
      answerCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(9);
        expect(count).toBeLessThanOrEqual(11);
      });
    });
  });

  describe('mockLLMResponses', () => {
    it('should contain all expected response templates', () => {
      expect(mockLLMResponses.moduleOutline).toBeDefined();
      expect(mockLLMResponses.quizQuestions).toBeDefined();
      expect(mockLLMResponses.mindMapData).toBeDefined();
      expect(mockLLMResponses.contentGeneration).toBeDefined();
    });

    it('should have valid module outline structure', () => {
      const { moduleOutline } = mockLLMResponses;
      
      expect(moduleOutline.title).toBeTruthy();
      expect(Array.isArray(moduleOutline.concepts)).toBe(true);
      expect(moduleOutline.concepts.length).toBeGreaterThan(0);
      expect(Array.isArray(moduleOutline.objectives)).toBe(true);
      expect(moduleOutline.objectives.length).toBeGreaterThan(0);
      expect(Array.isArray(moduleOutline.sections)).toBe(true);
      
      moduleOutline.sections.forEach(section => {
        expect(section.title).toBeTruthy();
        expect(section.duration).toBeTruthy();
      });
    });

    it('should have valid quiz questions', () => {
      const { quizQuestions } = mockLLMResponses;
      
      expect(Array.isArray(quizQuestions)).toBe(true);
      expect(quizQuestions.length).toBe(5);
      
      quizQuestions.forEach(q => {
        expect(q.id).toBeTruthy();
        expect(q.type).toMatch(/^(multiple-choice|true-false)$/);
        expect(q.question).toBeTruthy();
        expect(q.explanation).toBeTruthy();
      });
    });

    it('should have valid mind map structure', () => {
      const { mindMapData } = mockLLMResponses;
      
      expect(mindMapData.centralConcept).toBeTruthy();
      expect(Array.isArray(mindMapData.branches)).toBe(true);
      
      mindMapData.branches.forEach(branch => {
        expect(branch.label).toBeTruthy();
        expect(Array.isArray(branch.children)).toBe(true);
        expect(branch.children.length).toBeGreaterThan(0);
      });
    });

    it('should have valid content generation structure', () => {
      const { contentGeneration } = mockLLMResponses;
      
      expect(contentGeneration.introduction).toBeTruthy();
      expect(contentGeneration.mainContent).toBeTruthy();
      expect(contentGeneration.summary).toBeTruthy();
      expect(Array.isArray(contentGeneration.keyTerms)).toBe(true);
      expect(contentGeneration.keyTerms.length).toBeGreaterThan(0);
    });
  });

  describe('createMockLLMProviderWithPatterns', () => {
    it('should create successful provider pattern', async () => {
      const provider = createMockLLMProviderWithPatterns('success');
      
      // Test quiz generation
      const quizResult = await provider.generateStructuredOutput('Generate quiz questions');
      expect(Array.isArray(quizResult)).toBe(true);
      expect(quizResult).toHaveLength(5);
      
      // Test module outline generation
      const outlineResult = await provider.generateStructuredOutput('Create module outline');
      expect(outlineResult).toHaveProperty('title');
      expect(outlineResult).toHaveProperty('concepts');
      
      // Test generic content
      const contentResult = await provider.generateStructuredOutput('Generate content');
      expect(contentResult).toHaveProperty('introduction');
      
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should create failure provider pattern', async () => {
      const provider = createMockLLMProviderWithPatterns('failure');
      
      await expect(provider.generateCompletion('test')).rejects.toThrow('API Error');
      await expect(provider.generateStructuredOutput('test')).rejects.toThrow('API Error');
      expect(await provider.isAvailable()).toBe(false);
    });

    it('should create partial response provider pattern', async () => {
      const provider = createMockLLMProviderWithPatterns('partial');
      
      const result1 = await provider.generateStructuredOutput('test1');
      expect(result1).toBeNull();
      
      const result2 = await provider.generateStructuredOutput('test2');
      expect(result2).toEqual({ partial: 'data' });
      
      const result3 = await provider.generateStructuredOutput('test3');
      expect(result3).toHaveProperty('introduction');
    });

    it('should create slow provider pattern', async () => {
      const provider = createMockLLMProviderWithPatterns('slow');
      
      const startTime = Date.now();
      const result = await provider.generateCompletion('test');
      const duration = Date.now() - startTime;
      
      expect(result.content).toBe('Slow response');
      expect(duration).toBeGreaterThanOrEqual(2900); // Allow some timing variance
      expect(duration).toBeLessThan(3500);
    });

    it('should maintain base provider functionality', () => {
      const patterns: Array<'success' | 'failure' | 'partial' | 'slow'> = 
        ['success', 'failure', 'partial', 'slow'];
      
      patterns.forEach(pattern => {
        const provider = createMockLLMProviderWithPatterns(pattern);
        
        // All providers should have the base methods
        expect(provider.generateCompletion).toBeDefined();
        expect(provider.generateStructuredOutput).toBeDefined();
        expect(provider.generateStructuredOutput).toBeDefined();
        expect(provider.getTokenCount).toBeDefined();
        expect(provider.isAvailable).toBeDefined();
        
        // Token count should work for all patterns
        expect(provider.getTokenCount('test')).toBe(100);
      });
    });

    it('should handle edge case patterns', () => {
      // Test that invalid pattern falls back to base behavior
      const provider = createMockLLMProviderWithPatterns('invalid' as any);
      
      expect(provider.generateCompletion('test')).resolves.toEqual({ content: 'Mock completion response', usage: undefined });
      expect(provider.isAvailable()).resolves.toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should support complex testing scenarios', async () => {
      const successProvider = createMockLLMProviderWithPatterns('success');
      const failureProvider = createMockLLMProviderWithPatterns('failure');
      
      // Simulate retry logic testing
      let attempts = 0;
      const attemptGeneration = async (provider: ILLMProvider): Promise<any> => {
        attempts++;
        try {
          return await provider.generateStructuredOutput('Generate quiz');
        } catch (error) {
          if (attempts < 3 && provider === failureProvider) {
            // Switch to success provider after failures
            return attemptGeneration(successProvider);
          }
          throw error;
        }
      };
      
      const result = await attemptGeneration(failureProvider);
      expect(attempts).toBe(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support mock chaining', async () => {
      const provider = createMockLLMProvider();
      
      // Chain multiple behaviors
      provider.generateStructuredOutput
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(createMockQuestions(3));
      
      const result1 = await provider.generateStructuredOutput('test1');
      expect(result1).toBeNull();
      
      await expect(provider.generateStructuredOutput('test2')).rejects.toThrow('Temporary failure');
      
      const result3 = await provider.generateStructuredOutput('test3');
      expect(result3).toHaveLength(3);
    });

    it('should support conditional responses', () => {
      const provider = createMockLLMProvider({
        generateStructuredOutput: jest.fn().mockImplementation(async (prompt) => {
          if (prompt.includes('error')) {
            throw new Error('Requested error');
          }
          if (prompt.includes('empty')) {
            return null;
          }
          if (prompt.includes('quiz')) {
            return createMockQuestions(10, { type: 'multiple-choice' });
          }
          return { default: 'response' };
        })
      });
      
      expect(provider.generateStructuredOutput('normal')).resolves.toEqual({ default: 'response' });
      expect(provider.generateStructuredOutput('quiz time')).resolves.toHaveLength(10);
      expect(provider.generateStructuredOutput('empty result')).resolves.toBeNull();
      expect(provider.generateStructuredOutput('cause error')).rejects.toThrow('Requested error');
    });
  });
});