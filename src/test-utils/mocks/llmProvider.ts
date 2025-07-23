import { ILLMProvider } from '../../services/llm/provider';
import { Question } from '../../types';

/**
 * Creates a fully mocked LLM provider for testing
 */
export const createMockLLMProvider = (overrides?: Partial<jest.Mocked<ILLMProvider>>): jest.Mocked<ILLMProvider> => {
  const mockProvider: jest.Mocked<ILLMProvider> = {
    generateCompletion: jest.fn().mockResolvedValue('Mock completion response'),
    generateStructuredResponse: jest.fn().mockResolvedValue({}),
    generateStructuredOutput: jest.fn().mockResolvedValue({}),
    getTokenCount: jest.fn().mockReturnValue(100),
    isAvailable: jest.fn().mockResolvedValue(true),
    ...overrides
  };

  return mockProvider;
};

/**
 * Creates mock questions for testing
 */
export const createMockQuestions = (count: number, options?: {
  type?: 'multiple-choice' | 'true-false' | 'mixed';
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  concepts?: string[];
}): Question[] => {
  const {
    type = 'mixed',
    difficulty = 'mixed',
    concepts = ['collective unconscious', 'shadow', 'archetypes', 'individuation', 'anima/animus']
  } = options || {};

  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const isMultipleChoice = type === 'multiple-choice' || (type === 'mixed' && i % 2 === 0);
    const questionDifficulty = difficulty === 'mixed' 
      ? ['easy', 'medium', 'hard'][i % 3] 
      : difficulty;
    
    questions.push({
      id: `q${i + 1}`,
      type: isMultipleChoice ? 'multiple-choice' : 'true-false',
      question: `Test question ${i + 1} about ${concepts[i % concepts.length]}`,
      options: isMultipleChoice 
        ? [`Option A for ${i + 1}`, `Option B for ${i + 1}`, `Option C for ${i + 1}`, `Option D for ${i + 1}`]
        : undefined,
      correctAnswer: isMultipleChoice ? i % 4 : Boolean(i % 2),
      explanation: `Explanation for question ${i + 1} about ${concepts[i % concepts.length]}`,
      difficulty: questionDifficulty,
      concept: concepts[i % concepts.length],
      cognitiveLevel: ['remembering', 'understanding', 'applying', 'analyzing'][i % 4]
    });
  }
  
  return questions;
};

/**
 * Common LLM response templates for testing
 */
export const mockLLMResponses = {
  moduleOutline: {
    title: 'Introduction to Jungian Psychology',
    concepts: ['Collective Unconscious', 'Archetypes', 'Shadow', 'Individuation'],
    objectives: [
      'Understand the basic concepts of analytical psychology',
      'Identify key archetypes in personal and collective contexts',
      'Recognize shadow aspects in psychological development'
    ],
    sections: [
      { title: 'The Collective Unconscious', duration: '15 minutes' },
      { title: 'Major Archetypes', duration: '20 minutes' },
      { title: 'Shadow Work', duration: '15 minutes' }
    ]
  },
  
  quizQuestions: createMockQuestions(5),
  
  mindMapData: {
    centralConcept: 'Jungian Psychology',
    branches: [
      {
        label: 'Collective Unconscious',
        children: ['Archetypes', 'Instincts', 'Universal Patterns']
      },
      {
        label: 'Individuation',
        children: ['Self-realization', 'Integration', 'Wholeness']
      }
    ]
  },
  
  contentGeneration: {
    introduction: 'This module explores the fundamental concepts of Carl Jung\'s analytical psychology.',
    mainContent: 'Carl Gustav Jung developed a comprehensive approach to understanding the human psyche...',
    summary: 'Key takeaways include understanding the collective unconscious and the process of individuation.',
    keyTerms: ['Collective Unconscious', 'Archetypes', 'Shadow', 'Anima/Animus', 'Self']
  }
};

/**
 * Creates a mock provider with specific response patterns
 */
export const createMockLLMProviderWithPatterns = (pattern: 'success' | 'failure' | 'partial' | 'slow'): jest.Mocked<ILLMProvider> => {
  const baseProvider = createMockLLMProvider();
  
  switch (pattern) {
    case 'success':
      baseProvider.generateStructuredResponse.mockImplementation(async (prompt) => {
        if (prompt.includes('quiz') || prompt.includes('questions')) {
          return createMockQuestions(5);
        }
        if (prompt.includes('outline') || prompt.includes('module')) {
          return mockLLMResponses.moduleOutline;
        }
        return mockLLMResponses.contentGeneration;
      });
      break;
      
    case 'failure':
      baseProvider.generateCompletion.mockRejectedValue(new Error('API Error'));
      baseProvider.generateStructuredResponse.mockRejectedValue(new Error('API Error'));
      baseProvider.isAvailable.mockResolvedValue(false);
      break;
      
    case 'partial':
      baseProvider.generateStructuredResponse.mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ partial: 'data' })
        .mockResolvedValue(mockLLMResponses.contentGeneration);
      break;
      
    case 'slow':
      baseProvider.generateCompletion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('Slow response'), 3000))
      );
      break;
  }
  
  return baseProvider;
};