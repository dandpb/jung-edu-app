export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: ModuleContent;
  prerequisites?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ModuleContent {
  introduction: string;
  sections: Section[];
  videos?: Video[];
  quiz?: Quiz;
  bibliography?: Bibliography[];
  films?: Film[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  keyTerms?: KeyTerm[];
  images?: Image[];
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Image {
  url: string;
  caption: string;
  alt: string;
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Bibliography {
  id: string;
  title: string;
  author: string;
  year: number;
  type: 'book' | 'article' | 'journal';
  url?: string;
}

export interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  relevance: string;
  trailer?: string;
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