/**
 * Mock factory functions for common test entities
 * Provides consistent test data across the application
 */

import { 
  Module, 
  Quiz, 
  Question, 
  Section, 
  Video, 
  UserProgress,
  MindMapNode,
  MindMapEdge,
  Bibliography,
  Film
} from '../types';
import { User, UserRole, ResourceType, Action } from '../types/auth';

// Module factory
export const createMockModule = (overrides?: Partial<Module>): Module => ({
  id: 'test-module-1',
  title: 'Introduction to Jung',
  description: 'Learn the basics of Jungian psychology',
  icon: '🧠',
  estimatedTime: 60,
  difficulty: 'beginner',
  category: 'foundations',
  prerequisites: [],
  learningObjectives: [
    'Understand basic Jungian concepts',
    'Learn about the collective unconscious'
  ],
  content: {
    introduction: 'Welcome to Jungian psychology',
    sections: [createMockSection()],
    videos: [createMockVideo()],
    quiz: createMockQuiz(),
    bibliography: [createMockBibliography()],
    films: [createMockFilm()],
    summary: 'This module introduces core Jungian concepts',
    keyTakeaways: ['The unconscious is important', 'Archetypes shape behavior']
  },
  sections: [createMockSection()],
  quiz: createMockQuiz(),
  practicalExercises: [
    {
      id: 'exercise-1',
      title: 'Dream Analysis',
      description: 'Practice analyzing dreams',
      instructions: ['Read the dream', 'Identify symbols', 'Analyze meaning'],
      estimatedTime: 30,
      difficulty: 'intermediate' as const,
      type: 'analysis' as const
    }
  ],
  ...overrides
});

// Section factory
export const createMockSection = (overrides?: Partial<Section>): Section => ({
  id: 'section-1',
  title: 'The Collective Unconscious',
  content: 'The collective unconscious contains archetypes...',
  order: 1,
  keyTerms: [
    { term: 'Archetype', definition: 'Universal pattern or image' },
    { term: 'Shadow', definition: 'Repressed aspects of personality' }
  ],
  concepts: ['archetype', 'shadow', 'anima'],
  estimatedTime: 15,
  ...overrides
});

// Quiz factory
export const createMockQuiz = (overrides?: Partial<Quiz>): Quiz => ({
  id: 'quiz-1',
  title: 'Jung Basics Quiz',
  description: 'Test your knowledge of basic Jungian concepts',
  questions: [createMockQuestion()],
  moduleId: 'test-module-1',
  passingScore: 70,
  timeLimit: 30,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

// Question factory
export const createMockQuestion = (overrides?: Partial<Question>): Question => ({
  id: 'question-1',
  question: 'What is the collective unconscious?',
  type: 'multiple-choice',
  options: [
    { id: 'opt-1', text: 'Personal memories', isCorrect: false },
    { id: 'opt-2', text: 'Shared human experiences', isCorrect: true },
    { id: 'opt-3', text: 'Conscious thoughts', isCorrect: false },
    { id: 'opt-4', text: 'Individual dreams', isCorrect: false }
  ],
  correctAnswer: 1,
  explanation: 'The collective unconscious contains shared human experiences and archetypes',
  difficulty: 'beginner',
  cognitiveLevel: 'understanding',
  tags: ['collective-unconscious', 'basics'],
  points: 10,
  order: 1,
  ...overrides
});

// Video factory
export const createMockVideo = (overrides?: Partial<Video>): Video => ({
  id: 'video-1',
  title: 'Introduction to Carl Jung',
  youtubeId: 'abc123',
  description: 'An overview of Jung\'s life and work',
  duration: { hours: 0, minutes: 45, seconds: 30 },
  transcript: 'This is the video transcript...',
  keyMoments: [
    { timestamp: 120, title: 'Early Life', description: 'Jung\'s early life', type: 'concept' as const },
    { timestamp: 600, title: 'Collective Unconscious', description: 'The collective unconscious', type: 'concept' as const }
  ],
  ...overrides
});

// Bibliography factory
export const createMockBibliography = (overrides?: Partial<Bibliography>): Bibliography => ({
  id: 'bib-1',
  title: 'Man and His Symbols',
  authors: ['Carl G. Jung'],
  year: 1964,
  type: 'book',
  summary: 'Jung\'s most accessible work',
  url: 'https://example.com/book',
  ...overrides
});

// Film factory
export const createMockFilm = (overrides?: Partial<Film>): Film => ({
  id: 'film-1',
  title: 'A Dangerous Method',
  director: 'David Cronenberg',
  year: 2011,
  relevance: 'A film about Jung and Freud exploring psychoanalysis and relationships',
  ...overrides
});

// User Progress factory
export const createMockUserProgress = (overrides?: Partial<UserProgress>): UserProgress => ({
  userId: 'test-user-1',
  completedModules: ['intro-jung'],
  quizScores: { 'intro-jung': 85 },
  totalTime: 3600,
  lastAccessed: Date.now(),
  notes: [
    {
      id: 'note-1',
      moduleId: 'intro-jung',
      content: 'Important insight about archetypes',
      timestamp: Date.now() - 86400000,
      tags: ['archetype', 'insight']
    }
  ],
  ...overrides
});

// Mind Map Node factory
export const createMockMindMapNode = (overrides?: Partial<MindMapNode>): MindMapNode => ({
  id: 'node-1',
  type: 'concept',
  data: {
    label: 'Collective Unconscious',
    description: 'The deepest layer of the psyche',
    category: 'core-concepts',
  },
  position: { x: 100, y: 100 },
  ...overrides
});

// Mind Map Edge factory
export const createMockMindMapEdge = (overrides?: Partial<MindMapEdge>): MindMapEdge => ({
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  type: 'smoothstep',
  label: 'contains',
  ...overrides
});

// Auth User factory
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'mock-hash',
  salt: 'mock-salt',
  role: UserRole.STUDENT,
  isActive: true,
  isVerified: true,
  permissions: [
    {
      id: 'perm-1',
      resource: ResourceType.MODULE,
      actions: [Action.READ]
    }
  ],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  profile: {
    firstName: 'Test',
    lastName: 'User',
    avatar: undefined,
    bio: undefined,
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      emailNotifications: true,
      pushNotifications: false
    }
  },
  security: {
    twoFactorEnabled: false,
    passwordHistory: [],
    lastPasswordChange: new Date('2023-01-01'),
    loginNotifications: false,
    trustedDevices: [],
    sessions: []
  },
  ...overrides
});

// Admin User factory
export const createMockAdminUser = (overrides?: Partial<User>): User => createMockUser({
  id: 'admin-1',
  username: 'admin',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  permissions: [
    {
      id: 'perm-admin-1',
      resource: ResourceType.MODULE,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE]
    },
    {
      id: 'perm-admin-2',
      resource: ResourceType.USER,
      actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE]
    }
  ],
  ...overrides
});

// Create multiple modules
export const createMockModules = (count: number = 3): Module[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockModule({
      id: `module-${index + 1}`,
      title: `Module ${index + 1}`,
      description: `Description for module ${index + 1}`
    })
  );
};

// Create complete mind map data
export const createMockMindMapData = () => {
  const nodes: MindMapNode[] = [
    createMockMindMapNode({
      id: 'psyche',
      data: { label: 'Psyche', category: 'core-concepts' },
      position: { x: 400, y: 300 }
    }),
    createMockMindMapNode({
      id: 'conscious',
      data: { label: 'Conscious', category: 'consciousness' },
      position: { x: 200, y: 200 }
    }),
    createMockMindMapNode({
      id: 'unconscious',
      data: { label: 'Unconscious', category: 'consciousness' },
      position: { x: 600, y: 200 }
    }),
    createMockMindMapNode({
      id: 'personal-unconscious',
      data: { label: 'Personal Unconscious', category: 'consciousness' },
      position: { x: 500, y: 100 }
    }),
    createMockMindMapNode({
      id: 'collective-unconscious',
      data: { label: 'Collective Unconscious', category: 'consciousness' },
      position: { x: 700, y: 100 }
    })
  ];

  const edges: MindMapEdge[] = [
    createMockMindMapEdge({
      id: 'e1',
      source: 'psyche',
      target: 'conscious',
      label: 'contains'
    }),
    createMockMindMapEdge({
      id: 'e2',
      source: 'psyche',
      target: 'unconscious',
      label: 'contains'
    }),
    createMockMindMapEdge({
      id: 'e3',
      source: 'unconscious',
      target: 'personal-unconscious',
      label: 'divided into'
    }),
    createMockMindMapEdge({
      id: 'e4',
      source: 'unconscious',
      target: 'collective-unconscious',
      label: 'divided into'
    })
  ];

  return { nodes, edges };
};

// Mock localStorage data
export const createMockLocalStorageData = () => ({
  jungAppProgress: JSON.stringify(createMockUserProgress()),
  jungAppEducationalModules: JSON.stringify(createMockModules()),
  jungAppMindMapNodes: JSON.stringify(createMockMindMapData().nodes),
  jungAppMindMapEdges: JSON.stringify(createMockMindMapData().edges),
  jungAdminSession: JSON.stringify({
    token: 'mock-admin-token',
    admin: createMockAdminUser(),
    expiresAt: Date.now() + 86400000 // 24 hours
  })
});

// Test data presets
export const testDataPresets = {
  emptyState: {
    modules: [],
    progress: createMockUserProgress({
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      notes: []
    }),
    mindMapNodes: [],
    mindMapEdges: []
  },
  
  partialProgress: {
    modules: createMockModules(5),
    progress: createMockUserProgress({
      completedModules: ['module-1', 'module-2'],
      quizScores: { 'module-1': 90, 'module-2': 85 },
      totalTime: 7200
    }),
    mindMapData: createMockMindMapData()
  },
  
  fullProgress: {
    modules: createMockModules(5),
    progress: createMockUserProgress({
      completedModules: ['module-1', 'module-2', 'module-3', 'module-4', 'module-5'],
      quizScores: {
        'module-1': 95,
        'module-2': 88,
        'module-3': 92,
        'module-4': 87,
        'module-5': 90
      },
      totalTime: 18000
    }),
    mindMapData: createMockMindMapData()
  }
};