import { ModuleService } from '../../../services/modules/moduleService';
import { ContentGenerator } from '../../../services/llm/generators/content-generator';
import { VideoGenerator } from '../../../services/llm/generators/video-generator';
import { QuizGenerator } from '../../../services/llm/generators/quiz-generator';
import { MindMapGenerator } from '../../../services/llm/generators/mindmap-generator';
import { BibliographyGenerator } from '../../../services/llm/generators/bibliography-generator';
import { mockModule, mockVideo, mockQuiz, mockMindMapData, mockBibliographyItem } from '../../mocks/mockData';

// Mock all generators
jest.mock('../../../services/llm/generators/content-generator');
jest.mock('../../../services/llm/generators/video-generator');
jest.mock('../../../services/llm/generators/quiz-generator');
jest.mock('../../../services/llm/generators/mindmap-generator');
jest.mock('../../../services/llm/generators/bibliography-generator');

describe('ModuleService', () => {
  let moduleService: ModuleService;
  let mockContentGenerator: jest.Mocked<ContentGenerator>;
  let mockVideoGenerator: jest.Mocked<VideoGenerator>;
  let mockQuizGenerator: jest.Mocked<QuizGenerator>;
  let mockMindMapGenerator: jest.Mocked<MindMapGenerator>;
  let mockBibliographyGenerator: jest.Mocked<BibliographyGenerator>;
  
  beforeEach(() => {
    // Create mock instances
    mockContentGenerator = {
      generateModuleContent: jest.fn(),
      generateConceptExplanation: jest.fn(),
      enrichContent: jest.fn(),
      summarizeContent: jest.fn()
    } as any;
    
    mockVideoGenerator = {
      searchVideos: jest.fn(),
      generateVideoRecommendations: jest.fn()
    } as any;
    
    mockQuizGenerator = {
      generateQuiz: jest.fn(),
      generateAdaptiveQuiz: jest.fn()
    } as any;
    
    mockMindMapGenerator = {
      generateMindMap: jest.fn(),
      generateConceptMap: jest.fn()
    } as any;
    
    mockBibliographyGenerator = {
      generateBibliography: jest.fn(),
      searchReferences: jest.fn()
    } as any;
    
    // Mock constructors
    (ContentGenerator as jest.Mock).mockImplementation(() => mockContentGenerator);
    (VideoGenerator as jest.Mock).mockImplementation(() => mockVideoGenerator);
    (QuizGenerator as jest.Mock).mockImplementation(() => mockQuizGenerator);
    (MindMapGenerator as jest.Mock).mockImplementation(() => mockMindMapGenerator);
    (BibliographyGenerator as jest.Mock).mockImplementation(() => mockBibliographyGenerator);
    
    moduleService = new ModuleService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo'
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateModule', () => {
    beforeEach(() => {
      // Setup default mock responses
      mockContentGenerator.generateModuleContent.mockResolvedValue({
        introduction: 'Introduction to Jungian Psychology',
        sections: [
          {
            title: 'The Collective Unconscious',
            content: 'Content about collective unconscious...',
            concepts: ['collective unconscious'],
            examples: ['Dreams', 'Myths']
          }
        ],
        summary: 'Summary of the module',
        learningOutcomes: ['Understand Jung\'s concepts']
      });
      
      mockVideoGenerator.searchVideos.mockResolvedValue([mockVideo]);
      mockQuizGenerator.generateQuiz.mockResolvedValue(mockQuiz);
      mockMindMapGenerator.generateMindMap.mockResolvedValue(mockMindMapData);
      mockBibliographyGenerator.generateBibliography.mockResolvedValue([mockBibliographyItem]);
    });
    
    it('should generate a complete module', async () => {
      const result = await moduleService.generateModule({
        title: 'Introduction to Jungian Psychology',
        concepts: ['collective unconscious', 'archetypes', 'shadow'],
        difficulty: 'intermediate'
      });
      
      expect(result).toMatchObject({
        title: 'Introduction to Jungian Psychology',
        difficulty: 'intermediate',
        concepts: expect.arrayContaining(['collective unconscious', 'archetypes', 'shadow']),
        content: expect.objectContaining({
          introduction: expect.any(String),
          sections: expect.any(Array)
        }),
        videos: expect.arrayContaining([expect.objectContaining({ id: 'video-1' })]),
        quiz: expect.objectContaining({ questions: expect.any(Array) }),
        mindMap: expect.objectContaining({ nodes: expect.any(Array) }),
        bibliography: expect.arrayContaining([expect.objectContaining({ id: 'bib-1' })])
      });
    });
    
    it('should handle progress callbacks', async () => {
      const progressCallback = jest.fn();
      
      await moduleService.generateModule(
        {
          title: 'Test Module',
          concepts: ['test'],
          difficulty: 'easy'
        },
        progressCallback
      );
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'content',
        progress: 0.2,
        message: 'Generating module content...'
      });
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'videos',
        progress: 0.4,
        message: 'Searching for educational videos...'
      });
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'quiz',
        progress: 0.6,
        message: 'Creating quiz questions...'
      });
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'mindmap',
        progress: 0.8,
        message: 'Generating mind map...'
      });
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'bibliography',
        progress: 0.9,
        message: 'Compiling bibliography...'
      });
      
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'complete',
        progress: 1,
        message: 'Module generation complete!'
      });
    });
    
    it('should handle partial generation options', async () => {
      const result = await moduleService.generateModule({
        title: 'Partial Module',
        concepts: ['shadow'],
        difficulty: 'beginner',
        options: {
          includeVideos: false,
          includeQuiz: true,
          includeMindMap: false,
          includeBibliography: true
        }
      });
      
      expect(mockVideoGenerator.searchVideos).not.toHaveBeenCalled();
      expect(mockMindMapGenerator.generateMindMap).not.toHaveBeenCalled();
      expect(mockQuizGenerator.generateQuiz).toHaveBeenCalled();
      expect(mockBibliographyGenerator.generateBibliography).toHaveBeenCalled();
      
      expect(result.videos).toEqual([]);
      expect(result.mindMap).toBeUndefined();
    });
    
    it('should handle custom parameters', async () => {
      await moduleService.generateModule({
        title: 'Custom Module',
        concepts: ['individuation'],
        difficulty: 'advanced',
        options: {
          videoCount: 5,
          questionCount: 15,
          bibliographyCount: 20,
          language: 'es'
        }
      });
      
      expect(mockVideoGenerator.searchVideos).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ maxResults: 5 })
      );
      
      expect(mockQuizGenerator.generateQuiz).toHaveBeenCalledWith(
        expect.objectContaining({ questionCount: 15 })
      );
      
      expect(mockBibliographyGenerator.generateBibliography).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ maxResults: 20 })
      );
    });
  });
  
  describe('updateModule', () => {
    it('should update specific module components', async () => {
      const existingModule = { ...mockModule };
      
      mockQuizGenerator.generateQuiz.mockResolvedValue({
        ...mockQuiz,
        questions: [...mockQuiz.questions, {
          id: 'q4',
          type: 'multiple-choice',
          question: 'New question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 2,
          explanation: 'Explanation',
          difficulty: 'medium',
          concept: 'shadow'
        }]
      });
      
      const updated = await moduleService.updateModule(existingModule, {
        regenerateQuiz: true,
        addVideos: false,
        updateContent: false
      });
      
      expect(mockQuizGenerator.generateQuiz).toHaveBeenCalled();
      expect(mockContentGenerator.generateModuleContent).not.toHaveBeenCalled();
      expect(updated.quiz.questions).toHaveLength(4);
    });
    
    it('should add new videos to existing module', async () => {
      const newVideo = {
        ...mockVideo,
        id: 'video-2',
        title: 'Advanced Shadow Work'
      };
      
      mockVideoGenerator.searchVideos.mockResolvedValue([newVideo]);
      
      const updated = await moduleService.updateModule(mockModule, {
        addVideos: true,
        videoSearchQuery: 'advanced shadow work'
      });
      
      expect(updated.videos).toHaveLength(mockModule.videos.length + 1);
      expect(updated.videos).toContainEqual(expect.objectContaining({ id: 'video-2' }));
    });
  });
  
  describe('validateModule', () => {
    it('should validate complete modules', () => {
      const validation = moduleService.validateModule(mockModule);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
    
    it('should detect missing required fields', () => {
      const incompleteModule = {
        ...mockModule,
        title: '',
        concepts: []
      };
      
      const validation = moduleService.validateModule(incompleteModule);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title is required');
      expect(validation.errors).toContain('At least one concept is required');
    });
    
    it('should validate quiz structure', () => {
      const moduleWithInvalidQuiz = {
        ...mockModule,
        quiz: {
          id: 'quiz-1',
          questions: [] // Empty questions
        }
      };
      
      const validation = moduleService.validateModule(moduleWithInvalidQuiz);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Quiz must have at least one question');
    });
  });
  
  describe('error handling and recovery', () => {
    it('should handle content generation failure', async () => {
      mockContentGenerator.generateModuleContent.mockRejectedValue(
        new Error('Content generation failed')
      );
      
      await expect(moduleService.generateModule({
        title: 'Test',
        concepts: ['test'],
        difficulty: 'easy'
      })).rejects.toThrow('Content generation failed');
    });
    
    it('should continue generation if optional components fail', async () => {
      mockVideoGenerator.searchVideos.mockRejectedValue(
        new Error('Video search failed')
      );
      
      const result = await moduleService.generateModule({
        title: 'Test Module',
        concepts: ['test'],
        difficulty: 'easy',
        options: {
          continueOnError: true
        }
      });
      
      expect(result.videos).toEqual([]);
      expect(result.errors).toContain('Video generation failed: Video search failed');
      expect(result.quiz).toBeDefined(); // Other components should still generate
    });
    
    it('should retry failed operations', async () => {
      mockQuizGenerator.generateQuiz
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockQuiz);
      
      const result = await moduleService.generateModule({
        title: 'Test',
        concepts: ['test'],
        difficulty: 'easy',
        options: {
          retryOnFailure: true,
          maxRetries: 2
        }
      });
      
      expect(mockQuizGenerator.generateQuiz).toHaveBeenCalledTimes(2);
      expect(result.quiz).toBeDefined();
    });
  });
  
  describe('caching and performance', () => {
    it('should cache generated modules', async () => {
      const params = {
        title: 'Cached Module',
        concepts: ['shadow'],
        difficulty: 'intermediate' as const
      };
      
      // First generation
      const result1 = await moduleService.generateModule(params);
      
      // Second generation with same params
      const result2 = await moduleService.generateModule(params);
      
      // Should use cache, not regenerate
      expect(mockContentGenerator.generateModuleContent).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
    
    it('should respect cache expiration', async () => {
      const params = {
        title: 'Expiring Module',
        concepts: ['anima'],
        difficulty: 'advanced' as const,
        options: {
          cacheExpiration: 100 // 100ms
        }
      };
      
      await moduleService.generateModule(params);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await moduleService.generateModule(params);
      
      // Should regenerate after expiration
      expect(mockContentGenerator.generateModuleContent).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('batch operations', () => {
    it('should generate multiple modules efficiently', async () => {
      const modules = [
        { title: 'Module 1', concepts: ['shadow'], difficulty: 'easy' as const },
        { title: 'Module 2', concepts: ['anima'], difficulty: 'intermediate' as const },
        { title: 'Module 3', concepts: ['self'], difficulty: 'advanced' as const }
      ];
      
      const results = await moduleService.generateMultipleModules(modules);
      
      expect(results).toHaveLength(3);
      expect(mockContentGenerator.generateModuleContent).toHaveBeenCalledTimes(3);
      
      // Should process in parallel
      const callOrder = mockContentGenerator.generateModuleContent.mock.calls;
      expect(callOrder[0][0].concepts).toContain('shadow');
      expect(callOrder[1][0].concepts).toContain('anima');
      expect(callOrder[2][0].concepts).toContain('self');
    });
  });
});