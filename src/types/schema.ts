/**
 * Schema types for validation system
 */

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'Básico' | 'Intermediário' | 'Avançado' | 'Especialista';
  objectives: string[];
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      keyTerms?: Array<{ term: string; definition: string }>;
    }>;
    videos?: Array<{
      id: string;
      title: string;
      youtubeId: string;
      description: string;
      duration: number;
    }>;
    bibliography?: Array<{
      author: string;
      title: string;
      year: number;
      type: 'book' | 'article' | 'website';
      link?: string;
    }>;
    films?: Array<{
      title: string;
      director: string;
      year: number;
      relevance: string;
      link?: string;
    }>;
    quiz?: {
      id: string;
      title: string;
      questions: Array<{
        id: string;
        question: string;
        type: string;
        options: Array<{ id: string; text: string; isCorrect: boolean }>;
        correctAnswer: number;
        explanation: string;
      }>;
    };
  };
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface Quiz {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options: Array<{ id: string; text: string; isCorrect?: boolean }>;
    correctAnswer: number;
    explanation: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    cognitiveLevel?: string;
    tags?: string[];
  }>;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'essay' | 'fill-in-blank';
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: number | number[];
  explanation: string;
  expectedKeywords?: string[];
  rubric?: {
    excellent: string;
    good: string;
    needs_improvement: string;
  };
}

export interface Reference {
  author: string;
  title: string;
  year: number;
  type: 'book' | 'article' | 'website';
  link?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}