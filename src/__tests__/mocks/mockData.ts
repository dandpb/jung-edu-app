// Mock data for testing
import { Module, Quiz, Video, MindMapData, BibliographyItem } from '../../types';

export const mockModule: Module = {
  id: 'test-module-1',
  title: 'Introduction to Jungian Psychology',
  description: 'An introductory module exploring the fundamentals of Carl Jung\'s analytical psychology',
  difficulty: 'intermediate',
  concepts: ['collective unconscious', 'archetypes', 'individuation', 'shadow', 'anima/animus'],
  videos: [],
  quiz: {
    id: 'test-quiz-1',
    questions: []
  },
  bibliography: [],
  mindMap: {
    nodes: [],
    edges: []
  },
  objectives: [
    'Understand the basic concepts of Jungian psychology',
    'Identify key archetypes',
    'Apply concepts to personal development'
  ],
  prerequisites: ['Basic psychology knowledge'],
  estimatedTime: 60,
  tags: ['psychology', 'jung', 'archetypes', 'analytical psychology']
};

export const mockVideo: Video = {
  id: 'video-1',
  title: 'Understanding the Collective Unconscious',
  url: 'https://www.youtube.com/watch?v=test123',
  duration: 720,
  description: 'An exploration of Jung\'s concept of the collective unconscious',
  transcript: 'This is a mock transcript for testing purposes...',
  concepts: ['collective unconscious', 'archetypes'],
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  channel: 'Psychology Insights',
  publishedAt: '2024-01-15',
  viewCount: 15000,
  likeCount: 500
};

export const mockQuiz: Quiz = {
  id: 'quiz-1',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is the collective unconscious according to Jung?',
      options: [
        'Personal memories from childhood',
        'Shared ancestral memories and experiences',
        'Conscious thoughts',
        'Individual dreams'
      ],
      correctAnswer: 1,
      explanation: 'The collective unconscious refers to structures of the unconscious mind shared among beings of the same species.',
      difficulty: 'easy',
      concept: 'collective unconscious'
    },
    {
      id: 'q2',
      type: 'true-false',
      question: 'The Shadow represents only negative aspects of the personality.',
      correctAnswer: false,
      explanation: 'The Shadow contains both positive and negative aspects that the conscious ego doesn\'t identify with.',
      difficulty: 'medium',
      concept: 'shadow'
    },
    {
      id: 'q3',
      type: 'short-answer',
      question: 'Name three major archetypes in Jungian psychology.',
      correctAnswer: 'Shadow, Anima/Animus, Self',
      explanation: 'Common archetypes include the Shadow, Anima/Animus, Self, Hero, Mother, Father, Wise Old Man/Woman.',
      difficulty: 'medium',
      concept: 'archetypes'
    }
  ]
};

export const mockMindMapData: MindMapData = {
  nodes: [
    {
      id: '1',
      type: 'concept',
      data: { 
        label: 'Jungian Psychology',
        description: 'The analytical psychology of Carl Jung',
        level: 0,
        category: 'main'
      },
      position: { x: 0, y: 0 }
    },
    {
      id: '2',
      type: 'concept',
      data: { 
        label: 'Collective Unconscious',
        description: 'Shared ancestral memories',
        level: 1,
        category: 'core-concept'
      },
      position: { x: -200, y: 100 }
    },
    {
      id: '3',
      type: 'concept',
      data: { 
        label: 'Archetypes',
        description: 'Universal patterns and images',
        level: 1,
        category: 'core-concept'
      },
      position: { x: 200, y: 100 }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'default',
      animated: true
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      type: 'default',
      animated: true
    }
  ]
};

export const mockBibliographyItem: BibliographyItem = {
  id: 'bib-1',
  type: 'book',
  title: 'Man and His Symbols',
  authors: ['Carl Jung'],
  year: 1964,
  publisher: 'Dell Publishing',
  url: 'https://example.com/book1',
  isbn: '978-0-440-35183-9',
  relevance: 0.95,
  abstract: 'Jung\'s most accessible work, exploring symbols and their significance in human psychology.',
  tags: ['symbols', 'dreams', 'archetypes'],
  citations: 1250
};

export const mockFilmReference = {
  id: 'film-1',
  title: 'Black Swan',
  year: 2010,
  director: 'Darren Aronofsky',
  concepts: ['shadow', 'persona', 'individuation'],
  description: 'A psychological thriller exploring the shadow aspect of personality',
  relevance: 0.85,
  imdbUrl: 'https://www.imdb.com/title/tt0947798/',
  rating: 8.0
};

export const mockLLMResponse = {
  content: 'This is a mock LLM response for testing purposes.',
  usage: {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150
  },
  model: 'gpt-3.5-turbo',
  finishReason: 'stop'
};

export const mockGenerationProgress = {
  stage: 'content',
  progress: 0.5,
  message: 'Generating module content...',
  details: {
    completedSteps: ['initialization', 'content-outline'],
    currentStep: 'content-generation',
    remainingSteps: ['video-search', 'quiz-generation', 'mindmap-creation']
  }
};

export const mockError = {
  message: 'API rate limit exceeded',
  code: 'RATE_LIMIT_ERROR',
  details: {
    retryAfter: 60,
    limit: 100,
    remaining: 0
  }
};

// Mock functions for API calls
export const mockApiResponses = {
  generateContent: jest.fn().mockResolvedValue({
    content: 'Generated content about Jungian psychology...',
    concepts: ['shadow', 'anima', 'self']
  }),
  
  searchVideos: jest.fn().mockResolvedValue([mockVideo]),
  
  generateQuiz: jest.fn().mockResolvedValue(mockQuiz),
  
  generateMindMap: jest.fn().mockResolvedValue(mockMindMapData),
  
  searchBibliography: jest.fn().mockResolvedValue([mockBibliographyItem]),
  
  searchFilms: jest.fn().mockResolvedValue([mockFilmReference])
};

// Mock localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock fetch responses
export const mockFetchResponses = {
  youtube: {
    ok: true,
    json: async () => ({
      items: [{
        id: { videoId: 'test123' },
        snippet: {
          title: 'Understanding the Collective Unconscious',
          description: 'An exploration of Jung\'s concept',
          thumbnails: { default: { url: 'https://example.com/thumb.jpg' } },
          channelTitle: 'Psychology Insights',
          publishedAt: '2024-01-15T00:00:00Z'
        },
        statistics: {
          viewCount: '15000',
          likeCount: '500'
        }
      }]
    })
  },
  
  openai: {
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            content: 'Generated content',
            concepts: ['shadow', 'self']
          })
        }
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    })
  },
  
  error: {
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    json: async () => ({
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error'
      }
    })
  }
};