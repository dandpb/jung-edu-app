/**
 * Quiz Services Index
 * Central export point for all quiz-related services and utilities
 */

// Import for factory usage
import { EnhancedQuizGenerator as EQG } from './enhancedQuizGenerator';
import { AutomaticQuizOrchestrator as AQO } from './automaticQuizOrchestrator';
import { AdaptiveQuizEngine as AQE } from './adaptiveQuizEngine';
import { QuestionTypeGenerators as QTG } from './questionTypeGenerators';

// Core quiz generation
export { EnhancedQuizGenerator } from './enhancedQuizGenerator';
export type { EnhancedQuizOptions } from './enhancedQuizGenerator';

// Automatic quiz orchestration
export { AutomaticQuizOrchestrator } from './automaticQuizOrchestrator';
export type { AutoQuizGenerationOptions, QuizGenerationResult } from './automaticQuizOrchestrator';

// Content analysis
export { contentAnalyzer } from './contentAnalyzer';
export type { ContentAnalysisResult } from './contentAnalyzer';

// Adaptive quiz engine
export { AdaptiveQuizEngine } from './adaptiveQuizEngine';
export type { 
  UserPerformanceProfile, 
  AdaptiveQuizOptions, 
  AdaptiveQuizSession 
} from './adaptiveQuizEngine';

// Question type generators
export { QuestionTypeGenerators } from './questionTypeGenerators';
export type {
  QuestionGenerationContext,
  MultipleChoiceOptions,
  TrueFalseOptions,
  ShortAnswerOptions,
  EssayOptions
} from './questionTypeGenerators';

// Templates and validation
export { 
  jungQuestionTypes,
  topicTemplates,
  difficultyProgressions,
  answerValidationPatterns,
  getQuestionTemplate,
  getTopicConcepts,
  getTopicMisconceptions
} from './quizTemplates';

export { quizValidator } from './quizValidator';
export type { 
  ValidationResult, 
  QuestionValidationResult 
} from './quizValidator';

// Enhancement and quality
export { quizEnhancer } from './quizEnhancer';
export type { EnhancementOptions } from './quizEnhancer';

// Re-export core types
export type { Quiz, Question } from '../../types';

// Utility functions for common quiz operations
export const QuizUtils = {
  /**
   * Calculate quiz completion time based on question types
   */
  calculateEstimatedTime: (questions: any[]): number => {
    let totalMinutes = 0;
    
    questions.forEach(q => {
      switch (q.type) {
        case 'multiple-choice':
        case 'true-false':
          totalMinutes += 2;
          break;
        case 'short-answer':
          totalMinutes += 5;
          break;
        case 'essay':
          totalMinutes += 15;
          break;
        case 'matching':
          totalMinutes += 4;
          break;
        default:
          totalMinutes += 3;
      }
    });
    
    return totalMinutes;
  },

  /**
   * Calculate quiz difficulty distribution
   */
  analyzeDifficultyDistribution: (questions: any[]): { easy: number; medium: number; hard: number } => {
    const distribution = { easy: 0, medium: 0, hard: 0 };
    
    questions.forEach(q => {
      const difficulty = q.metadata?.difficulty || 'medium';
      if (difficulty in distribution) {
        distribution[difficulty as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  },

  /**
   * Generate quiz statistics
   */
  generateQuizStats: (quiz: any) => {
    const totalQuestions = quiz.questions.length;
    const totalPoints = quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
    const estimatedTime = QuizUtils.calculateEstimatedTime(quiz.questions);
    const difficultyDist = QuizUtils.analyzeDifficultyDistribution(quiz.questions);
    
    return {
      totalQuestions,
      totalPoints,
      estimatedTime,
      difficultyDistribution: difficultyDist,
      averagePointsPerQuestion: totalPoints / totalQuestions,
      questionTypes: quiz.questions.reduce((types: Record<string, number>, q: any) => {
        types[q.type] = (types[q.type] || 0) + 1;
        return types;
      }, {})
    };
  }
};

/**
 * Quiz factory for creating different types of quiz generators
 */

export class QuizFactory {
  /**
   * Create an enhanced quiz generator with templates
   */
  static createEnhancedGenerator(provider: any) {
    return new EQG(provider);
  }

  /**
   * Create an automatic quiz orchestrator
   */
  static createAutomaticOrchestrator(provider: any) {
    return new AQO(provider);
  }

  /**
   * Create an adaptive quiz engine
   */
  static createAdaptiveEngine(provider: any) {
    return new AQE(provider);
  }

  /**
   * Create specialized question type generators
   */
  static createQuestionTypeGenerators(provider: any) {
    return new QTG(provider);
  }
}

/**
 * Pre-configured quiz presets for common scenarios
 */
export const QuizPresets = {
  beginnerAssessment: {
    questionCount: 8,
    targetDifficulty: 'beginner' as const,
    includeEssayQuestions: false,
    adaptiveDifficulty: false,
    qualityThreshold: 70,
    maxRetries: 2,
    language: 'pt-BR' as const,
    cognitiveDistribution: {
      recall: 0.4,
      understanding: 0.4,
      application: 0.2,
      analysis: 0.0
    }
  },

  standardAssessment: {
    questionCount: 12,
    targetDifficulty: 'intermediate' as const,
    includeEssayQuestions: true,
    adaptiveDifficulty: true,
    qualityThreshold: 75,
    maxRetries: 3,
    language: 'pt-BR' as const,
    cognitiveDistribution: {
      recall: 0.2,
      understanding: 0.4,
      application: 0.3,
      analysis: 0.1
    }
  },

  quickPractice: {
    questionCount: 5,
    targetDifficulty: 'intermediate' as const,
    includeEssayQuestions: false,
    adaptiveDifficulty: false,
    qualityThreshold: 65,
    maxRetries: 1,
    language: 'pt-BR' as const,
    cognitiveDistribution: {
      recall: 0.3,
      understanding: 0.5,
      application: 0.2,
      analysis: 0.0
    }
  }
};

// Export commonly used constants
export const QUIZ_CONSTANTS = {
  MIN_QUESTIONS: 3,
  MAX_QUESTIONS: 25,
  DEFAULT_PASSING_SCORE: 70,
  DEFAULT_TIME_PER_QUESTION: 2, // minutes
  QUALITY_THRESHOLD_MIN: 50,
  QUALITY_THRESHOLD_RECOMMENDED: 75,
  MAX_RETRIES: 5
};