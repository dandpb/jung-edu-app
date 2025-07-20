export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: ModuleContent;
  prerequisites?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

export interface ModuleContent {
  introduction: string;
  sections: Section[];
  videos?: Video[];
  quiz?: Quiz;
  bibliography?: Bibliography[];
  films?: Film[];
  summary?: string;
  keyTakeaways?: string[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  keyTerms?: KeyTerm[];
  images?: Image[];
  concepts?: string[];
  interactiveElements?: any[];
  estimatedTime?: number;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Image {
  id: string;
  url: string;
  caption: string;
  alt: string;
}

export interface Video {
  id: string;
  title: string;
  youtubeId?: string;
  url?: string;
  description: string;
  duration: number | { hours: number; minutes: number; seconds: number };
  transcript?: string;
  keyMoments?: any[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  description?: string;
  moduleId?: string;
  passingScore?: number;
  timeLimit?: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: any;
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  question: string;
  type: string;
  options: Option[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cognitiveLevel?: string;
  tags?: string[];
  points?: number;
  order?: number;
  metadata?: any;
  expectedKeywords?: any;
  rubric?: any;
}

export type PublicationType = 'book' | 'article' | 'journal' | 'online' | 'thesis';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Bibliography {
  id: string;
  title: string;
  authors: string[];
  year: number;
  publisher?: string;
  type: PublicationType;
  url?: string;
  summary?: string;
}

export interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  relevance: string;
  trailer?: string;
  streamingUrl?: string;
  type?: 'documentary' | 'fiction' | 'educational' | 'biographical';
}

export interface Note {
  id: string;
  moduleId: string;
  content: string;
  timestamp: number;
  tags?: string[];
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  quizScores: Record<string, number>;
  totalTime: number;
  lastAccessed: number;
  notes: Note[];
}

export interface MindMapNode {
  id: string;
  data: {
    label: string;
    description?: string;
    moduleId?: string;
    level?: number;
    category?: string;
    expandable?: boolean;
    onClick?: () => void;
    onHover?: () => void;
    interactive?: boolean;
    moduleCategory?: string;
    categoryColor?: string;
    difficulty?: string;
    moduleInfo?: string;
    examples?: string[];
  };
  position: { x: number; y: number };
  type?: string;
  style?: React.CSSProperties;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  role: 'admin';
  lastLogin?: number;
}

export interface AppSettings {
  modules: Module[];
  mindMapNodes: MindMapNode[];
  mindMapEdges: MindMapEdge[];
  adminUsers: AdminUser[];
}