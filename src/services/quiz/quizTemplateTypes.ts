/**
 * Quiz Template Types
 * Shared type definitions for quiz templates
 */

export interface QuestionTemplate {
  type: 'multiple-choice' | 'true-false' | 'matching' | 'short-answer' | 'essay';
  structure: string;
  optionPatterns?: string[];
  explanationTemplate: string;
  difficultyFactors: string[];
}

export interface TopicTemplate {
  topic: string;
  concepts: string[];
  questionTypes: QuestionTemplate[];
  assessmentFocus: string[];
  commonMisconceptions: string[];
}