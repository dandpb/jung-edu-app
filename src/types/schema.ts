/**
 * Schema types for validation system
 */

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  content: {
    introduction: string;
    sections?: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
      keyTerms?: Array<{ term: string; definition: string }>;
      images?: Array<{ id: string; url: string; alt: string; caption: string }>;
      interactiveElements?: any[];
      estimatedTime?: number;
    }>;
    videos?: Array<{
      id: string;
      title: string;
      youtubeId?: string;
      url?: string;
      description: string;
      duration: number | { hours: number; minutes: number; seconds: number };
      transcript?: string;
      keyMoments?: any[];
    }>;
    summary?: string;
    keyTakeaways?: string[];
  };
  quiz?: {
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
  };
  bibliography?: Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    publisher?: string;
    type: 'book' | 'article' | 'journal' | 'online' | 'thesis';
    url?: string;
    summary?: string;
  }>;
  mindmap?: {
    nodes: Array<{ id: string; label: string; x: number; y: number }>;
    edges: Array<{ id: string; source: string; target: string; label?: string }>;
  };
  videos?: Array<{
    id: string;
    title: string;
    youtubeId?: string;
    url?: string;
    description: string;
    duration: number | { hours: number; minutes: number; seconds: number };
    transcript?: string;
    keyMoments?: any[];
  }>;
  prerequisites?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags?: string[];
  learningObjectives?: string[];
  metadata?: {
    generatedAt: Date;
    difficulty: string;
    topic: string;
    componentsIncluded: string[];
    pipelineProcessed?: boolean;
    pipelineResources?: number;
    qualityEnhanced?: boolean;
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