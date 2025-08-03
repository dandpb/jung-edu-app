import { ILLMProvider, LLMResponse } from '../../services/llm/types';
import { Question } from '../../types';

/**
 * Creates a fully mocked LLM provider for testing
 */
export const createMockLLMProvider = (overrides?: Partial<jest.Mocked<ILLMProvider>>): jest.Mocked<ILLMProvider> => {
  const mockProvider: jest.Mocked<ILLMProvider> = {
    generateCompletion: jest.fn().mockResolvedValue({ content: 'Mock completion response', usage: undefined }),
    generateStructuredOutput: jest.fn().mockResolvedValue({}),
    getTokenCount: jest.fn().mockReturnValue(100), // Simple default for testing
    isAvailable: jest.fn().mockResolvedValue(true),
    streamCompletion: jest.fn().mockImplementation(async (prompt: string, onChunk: (chunk: string) => void) => {
      // Default streaming implementation
      onChunk('Mock ');
      onChunk('streaming ');
      onChunk('response');
    }),
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
    const questionDifficulty: 'beginner' | 'intermediate' | 'advanced' = difficulty === 'mixed' 
      ? (['beginner', 'intermediate', 'advanced'][i % 3] as 'beginner' | 'intermediate' | 'advanced')
      : (difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced');
    
    // Handle empty concepts array
    const conceptIndex = concepts.length > 0 ? i % concepts.length : 0;
    const concept = concepts.length > 0 ? concepts[conceptIndex] : 'undefined';
    
    if (isMultipleChoice) {
      questions.push({
        id: `q${i + 1}`,
        type: 'multiple-choice',
        question: `Test question ${i + 1} about ${concept}`,
        options: [
          { id: `${i + 1}a`, text: `Option A for ${i + 1}` },
          { id: `${i + 1}b`, text: `Option B for ${i + 1}` },
          { id: `${i + 1}c`, text: `Option C for ${i + 1}` },
          { id: `${i + 1}d`, text: `Option D for ${i + 1}` }
        ],
        correctAnswer: i % 4,
        explanation: `Explanation for question ${i + 1} about ${concept}`,
        difficulty: questionDifficulty,
        cognitiveLevel: ['remembering', 'understanding', 'applying', 'analyzing'][i % 4],
        tags: [concept]
      });
    } else {
      questions.push({
        id: `q${i + 1}`,
        type: 'true-false',
        question: `Test question ${i + 1} about ${concept}`,
        options: [
          { id: '0', text: 'False' },
          { id: '1', text: 'True' }
        ],
        correctAnswer: i % 2 === 0 ? 1 : 0, // 1 for true, 0 for false
        explanation: `Explanation for question ${i + 1} about ${concept}`,
        difficulty: questionDifficulty,
        cognitiveLevel: ['remembering', 'understanding', 'applying', 'analyzing'][i % 4],
        tags: [concept]
      });
    }
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
  
  // Ensure getTokenCount uses consistent default value for testing
  baseProvider.getTokenCount.mockReturnValue(100);
  
  switch (pattern) {
    case 'success':
      baseProvider.generateStructuredOutput.mockImplementation(async (prompt) => {
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
      baseProvider.generateStructuredOutput.mockRejectedValue(new Error('API Error'));
      baseProvider.isAvailable.mockResolvedValue(false);
      break;
      
    case 'partial':
      baseProvider.generateStructuredOutput.mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ partial: 'data' })
        .mockResolvedValue(mockLLMResponses.contentGeneration);
      break;
      
    case 'slow':
      baseProvider.generateCompletion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ content: 'Slow response', usage: undefined }), 3000))
      );
      break;
  }
  
  return baseProvider;
};