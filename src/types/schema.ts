/**
 * Type definitions for Jung Educational App
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz types
export interface Quiz extends BaseEntity {
  moduleId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number; // in minutes
  metadata?: {
    enhanced?: boolean;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    concepts?: string[];
    difficultyDistribution?: Record<string, number>;
    [key: string]: any;
  };
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'matching' | 'short-answer' | 'essay';
  question: string;
  points: number;
  order: number;
  
  // Multiple choice specific
  options?: string[];
  correctAnswer?: number;
  
  // Short answer / Essay specific
  expectedKeywords?: string[];
  rubric?: {
    required: string[];
    optional: string[];
    depth: number; // minimum word count for essays
  };
  
  // Common fields
  explanation?: string;
  hints?: string[];
  references?: string[];
  
  // Metadata for enhanced features
  metadata?: {
    difficulty?: string;
    cognitiveLevel?: string;
    concepts?: string[];
    hasContext?: boolean;
    contextType?: string;
    templated?: boolean;
    educationalValue?: number;
    references?: string[];
    [key: string]: any;
  };
}

// Module types
export interface Module extends BaseEntity {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  objectives: string[];
  prerequisites?: string[];
  content: ModuleContent;
  quiz?: Quiz;
  resources?: Resource[];
  metadata?: Record<string, any>;
}

export interface ModuleContent {
  introduction: string;
  sections: Section[];
  summary: string;
  keyTakeaways: string[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  subsections?: Subsection[];
  media?: Media[];
}

export interface Subsection {
  id: string;
  title: string;
  content: string;
}

export interface Media {
  id: string;
  type: 'image' | 'video' | 'audio' | 'diagram';
  url: string;
  caption?: string;
  transcript?: string;
}

export interface Resource {
  id: string;
  type: 'book' | 'article' | 'video' | 'website' | 'paper';
  title: string;
  author?: string;
  url?: string;
  citation?: string;
  description?: string;
}

// User progress types
export interface UserProgress extends BaseEntity {
  userId: string;
  moduleId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedSections: string[];
  quizAttempts: QuizAttempt[];
  lastAccessedAt: Date;
  completionPercentage: number;
}

export interface QuizAttempt extends BaseEntity {
  quizId: string;
  userId: string;
  responses: QuizResponse[];
  score: number;
  passed: boolean;
  timeSpent: number; // in seconds
  completedAt?: Date;
}

export interface QuizResponse {
  questionId: string;
  answer: any; // Could be number, string, boolean, or array depending on question type
  correct: boolean;
  pointsEarned: number;
  timeSpent?: number; // in seconds
}

// Mind map types
export interface MindMap {
  id: string;
  moduleId: string;
  title: string;
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  layout?: 'radial' | 'tree' | 'force-directed';
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'central' | 'primary' | 'secondary' | 'detail';
  x?: number;
  y?: number;
  data?: Record<string, any>;
}

export interface MindMapConnection {
  source: string;
  target: string;
  label?: string;
  type?: 'hierarchical' | 'associative' | 'causal';
}

// Bibliography types
export interface Bibliography {
  id: string;
  moduleId: string;
  sources: BibliographySource[];
}

export interface BibliographySource {
  id: string;
  type: 'book' | 'journal' | 'website' | 'video' | 'other';
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  url?: string;
  doi?: string;
  pages?: string;
  annotation?: string;
  relevance: 'primary' | 'secondary' | 'supplementary';
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  preferences?: UserPreferences;
  progress?: UserProgress[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  emailNotifications: boolean;
  reminderFrequency?: 'daily' | 'weekly' | 'never';
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  userId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface LearningAnalytics {
  userId: string;
  totalModulesCompleted: number;
  averageQuizScore: number;
  totalTimeSpent: number; // in minutes
  strongConcepts: string[];
  weakConcepts: string[];
  learningVelocity: number; // modules per week
  engagementScore: number; // 0-100
}