/**
 * Quiz Service Module for Jung Educational App
 * Exports all quiz-related functionality
 */

export * from './quizTemplates';
export * from './quizEnhancer';
export * from './enhancedQuizGenerator';
export * from './quizValidator';

// Re-export types for convenience
export type { Quiz, QuizQuestion } from '../../types/schema';

// Example usage and integration guide
export const quizServiceExample = `
// Example: Creating an enhanced quiz

import { EnhancedQuizGenerator } from './services/quiz';
import { OpenAIProvider } from './services/llm/provider';

const generator = new EnhancedQuizGenerator(new OpenAIProvider('your-api-key'));

// Generate a quiz with all enhancements
const quiz = await generator.generateEnhancedQuiz(
  'module-123',
  'Collective Unconscious',
  'Module content here...',
  ['Understand archetypes', 'Identify universal patterns'],
  10,
  {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    includeEssayQuestions: true,
    contextualizeQuestions: true,
    userLevel: 'intermediate'
  }
);

// Generate adaptive questions based on performance
const adaptiveQuestions = await generator.generateAdaptiveQuestions(
  'Shadow',
  [
    { correct: true, difficulty: 'easy' },
    { correct: true, difficulty: 'medium' },
    { correct: false, difficulty: 'hard' }
  ],
  3
);

// Generate a study guide after quiz completion
const studyGuide = await generator.generateStudyGuide(
  quiz,
  userResponses,
  'Collective Unconscious'
);
`;