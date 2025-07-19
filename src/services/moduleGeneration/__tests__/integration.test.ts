/**
 * Integration Tests for Unified Module Generation System
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig } from '../index';
import { LLMOrchestrator } from '../../llm/orchestrator';

// Mock the LLM provider to avoid API calls in tests
jest.mock('../../llm/provider', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    generateCompletion: jest.fn().mockResolvedValue('Mock content'),
  })),
  MockLLMProvider: jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    generateCompletion: jest.fn().mockResolvedValue('Mock content'),
  })),
}));

// Mock external services
jest.mock('../../video/youtubeService', () => ({
  YouTubeService: jest.fn().mockImplementation(() => ({
    searchVideos: jest.fn().mockResolvedValue([
      {
        videoId: 'test-video-1',
        title: 'Introduction to Jung Psychology',
        description: 'Learn the basics of Jungian psychology',
        channelTitle: 'Psychology Channel',
        duration: 'PT10M30S',
        viewCount: 10000,
        likeCount: 500,
        publishedAt: new Date('2023-01-01'),
        relevanceScore: 0.95,
      },
    ]),
    getVideoDetails: jest.fn().mockResolvedValue({
      videoId: 'test-video-1',
      duration: 630,
      viewCount: 10000,
      likeCount: 500,
      tags: ['psychology', 'jung', 'education'],
    }),
    getTranscript: jest.fn().mockResolvedValue([
      { text: 'Welcome to our introduction to Jungian psychology.', start: 0, duration: 5 },
    ]),
  })),
}));

describe('UnifiedModuleGenerator Integration Tests', () => {
  let generator: UnifiedModuleGenerator;

  beforeEach(() => {
    generator = new UnifiedModuleGenerator();
  });

  describe('Complete Module Generation', () => {
    it('should generate a complete module with all components', async () => {
      const config: ModuleGenerationConfig = {
        topic: 'Shadow Work in Jungian Psychology',
        difficulty: 'intermediate',
        targetAudience: 'psychology students',
        includeVideos: true,
        includeQuiz: true,
        includeMindMap: true,
        includeBibliography: true,
        quizQuestions: 5,
        maxVideos: 3,
      };

      const result = await generator.generateCompleteModule(config);

      // Verify basic module structure
      expect(result.module).toBeDefined();
      expect(result.module.title).toBe('Shadow Work in Jungian Psychology');
      expect(result.module.metadata.difficulty).toBe('intermediate');

      // Verify metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.topic).toBe('Shadow Work in Jungian Psychology');
      expect(result.metadata.difficulty).toBe('intermediate');
      expect(result.metadata.componentsIncluded).toContain('module');

      // Verify optional components based on config
      if (config.includeMindMap) {
        expect(result.mindMap).toBeDefined();
        expect(result.mindMap.nodes).toBeInstanceOf(Array);
        expect(result.mindMap.edges).toBeInstanceOf(Array);
        expect(result.metadata.componentsIncluded).toContain('mindMap');
      }

      if (config.includeQuiz) {
        expect(result.quiz).toBeDefined();
        expect(result.quiz.questions).toBeInstanceOf(Array);
        expect(result.quiz.questions.length).toBeGreaterThan(0);
        expect(result.metadata.componentsIncluded).toContain('quiz');
      }

      if (config.includeVideos) {
        expect(result.videos).toBeDefined();
        expect(result.videos).toBeInstanceOf(Array);
        expect(result.metadata.componentsIncluded).toContain('videos');
      }

      if (config.includeBibliography) {
        expect(result.bibliography).toBeDefined();
        expect(result.bibliography).toBeInstanceOf(Array);
        expect(result.metadata.componentsIncluded).toContain('bibliography');
      }
    });

    it('should handle partial component generation', async () => {
      const config: ModuleGenerationConfig = {
        topic: 'Archetypes and Symbols',
        includeVideos: false,
        includeQuiz: true,
        includeMindMap: false,
        includeBibliography: false,
        quizQuestions: 10,
      };

      const result = await generator.generateCompleteModule(config);

      expect(result.module).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.videos).toBeUndefined();
      expect(result.mindMap).toBeUndefined();
      expect(result.bibliography).toBeUndefined();

      expect(result.metadata.componentsIncluded).toContain('module');
      expect(result.metadata.componentsIncluded).toContain('quiz');
      expect(result.metadata.componentsIncluded).not.toContain('videos');
      expect(result.metadata.componentsIncluded).not.toContain('mindMap');
      expect(result.metadata.componentsIncluded).not.toContain('bibliography');
    });

    it('should auto-detect difficulty when not provided', async () => {
      const config: ModuleGenerationConfig = {
        topic: 'Basic Introduction to Jung',
        // difficulty not provided
      };

      const result = await generator.generateCompleteModule(config);

      expect(result.metadata.difficulty).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced']).toContain(result.metadata.difficulty);
    });
  });

  describe('Preset Module Generation', () => {
    it('should generate a quick module with minimal components', async () => {
      const result = await generator.generateQuickModule('Persona and Identity');

      expect(result.module).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions.length).toBe(5); // Quick module has 5 questions
      expect(result.videos).toBeDefined();
      expect(result.videos.length).toBeLessThanOrEqual(3); // Quick module has max 3 videos
      expect(result.mindMap).toBeDefined();
      expect(result.bibliography).toBeUndefined(); // Quick module skips bibliography
    });

    it('should generate a study module with comprehensive components', async () => {
      const result = await generator.generateStudyModule('Individuation Process');

      expect(result.module).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions.length).toBe(15); // Study module has 15 questions
      expect(result.videos).toBeDefined();
      expect(result.videos.length).toBeLessThanOrEqual(10); // Study module has max 10 videos
      expect(result.mindMap).toBeDefined();
      expect(result.bibliography).toBeDefined();
    });

    it('should generate a research module focused on academic content', async () => {
      const result = await generator.generateResearchModule('Collective Unconscious Theory');

      expect(result.module).toBeDefined();
      expect(result.module.metadata.difficulty).toBe('advanced');
      expect(result.quiz).toBeUndefined(); // Research module skips quiz
      expect(result.videos).toBeUndefined(); // Research module skips videos
      expect(result.mindMap).toBeDefined();
      expect(result.bibliography).toBeDefined();
    });
  });

  describe('Custom Module Generation', () => {
    it('should generate custom module with specific components', async () => {
      const result = await generator.generateCustomModule(
        'Dream Analysis Techniques',
        {
          module: true,
          mindMap: true,
          quiz: false,
          videos: true,
          bibliography: false,
        }
      );

      expect(result.module).toBeDefined();
      expect(result.mindMap).toBeDefined();
      expect(result.quiz).toBeUndefined();
      expect(result.videos).toBeDefined();
      expect(result.bibliography).toBeUndefined();
    });
  });

  describe('Service Integration', () => {
    it('should integrate with LLM orchestrator', async () => {
      const orchestrator = new LLMOrchestrator();
      
      const module = await orchestrator.generateModule({
        topic: 'Anima and Animus',
        difficulty: 'intermediate',
      });

      expect(module).toBeDefined();
      expect(module.title).toBe('Anima and Animus');
      expect(module.metadata.difficulty).toBe('intermediate');
    });

    it('should handle errors gracefully', async () => {
      const config: ModuleGenerationConfig = {
        topic: '', // Empty topic should cause an error
      };

      await expect(generator.generateCompleteModule(config)).rejects.toThrow();
    });
  });

  describe('Difficulty Analysis', () => {
    it('should analyze beginner level content', async () => {
      const orchestrator = new LLMOrchestrator();
      const difficulty = await orchestrator['orchestrator'].analyzeDifficulty(
        'Basic Jung',
        'This is a simple introduction to basic Jungian concepts for beginners.'
      );

      expect(difficulty).toBe('beginner');
    });

    it('should analyze intermediate level content', async () => {
      const orchestrator = new LLMOrchestrator();
      const difficulty = await orchestrator['orchestrator'].analyzeDifficulty(
        'Jung Application',
        'Detailed practice and application of Jungian methods in therapy.'
      );

      expect(difficulty).toBe('intermediate');
    });

    it('should analyze advanced level content', async () => {
      const orchestrator = new LLMOrchestrator();
      const difficulty = await orchestrator['orchestrator'].analyzeDifficulty(
        'Jung Research',
        'Complex theoretical analysis of archetype, individuation, collective unconscious, and transcendent function in specialized research.'
      );

      expect(difficulty).toBe('advanced');
    });
  });
});

describe('Integration with Individual Services', () => {
  it('should properly integrate mind map generation', async () => {
    const generator = new UnifiedModuleGenerator();
    const result = await generator.generateCustomModule(
      'Psychological Types',
      { mindMap: true }
    );

    expect(result.mindMap).toBeDefined();
    expect(result.mindMap.nodes).toBeInstanceOf(Array);
    expect(result.mindMap.edges).toBeInstanceOf(Array);
    
    // Verify mind map has proper structure
    const rootNode = result.mindMap.nodes.find((n: any) => n.data.isRoot);
    expect(rootNode).toBeDefined();
    expect(rootNode.data.label).toContain('Psychological Types');
  });

  it('should properly integrate quiz generation with enhancements', async () => {
    const generator = new UnifiedModuleGenerator();
    const result = await generator.generateCustomModule(
      'Shadow Work',
      { quiz: true }
    );

    expect(result.quiz).toBeDefined();
    expect(result.quiz.questions).toBeInstanceOf(Array);
    
    // Verify quiz questions have explanations (from enhancer)
    const questionsWithExplanations = result.quiz.questions.filter((q: any) => q.explanation);
    expect(questionsWithExplanations.length).toBeGreaterThan(0);
  });

  it('should properly integrate video enrichment', async () => {
    const generator = new UnifiedModuleGenerator();
    const result = await generator.generateCustomModule(
      'Active Imagination',
      { videos: true }
    );

    expect(result.videos).toBeDefined();
    expect(result.videos).toBeInstanceOf(Array);
    
    if (result.videos.length > 0) {
      const video = result.videos[0];
      expect(video).toHaveProperty('title');
      expect(video).toHaveProperty('url');
      expect(video).toHaveProperty('relevanceScore');
    }
  });

  it('should properly integrate bibliography generation', async () => {
    const generator = new UnifiedModuleGenerator();
    const result = await generator.generateCustomModule(
      'Synchronicity',
      { bibliography: true }
    );

    expect(result.bibliography).toBeDefined();
    expect(result.bibliography).toBeInstanceOf(Array);
    
    if (result.bibliography.length > 0) {
      const reference = result.bibliography[0];
      expect(reference).toHaveProperty('title');
      expect(reference).toHaveProperty('authors');
      expect(reference).toHaveProperty('year');
    }
  });
});