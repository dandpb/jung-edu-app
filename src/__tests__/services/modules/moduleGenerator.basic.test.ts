import { ModuleGenerator, GenerationOptions, GenerationStage } from '../../../services/modules/moduleGenerator';
import { ILLMProvider } from '../../../services/llm/types';
import { DifficultyLevel, ModuleStatus } from '../../../schemas/module.schema';
import { ModuleService } from '../../../services/modules/moduleService';

// Mock the ModuleService to avoid validation issues
jest.mock('../../../services/modules/moduleService');

describe('ModuleGenerator Basic Tests', () => {
  let generator: ModuleGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  let mockModuleService: jest.Mocked<typeof ModuleService>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock ModuleService
    mockModuleService = ModuleService as jest.Mocked<typeof ModuleService>;
    mockModuleService.createModule = jest.fn().mockImplementation((module) => Promise.resolve(module));
    mockModuleService.saveDraft = jest.fn().mockResolvedValue(undefined);
    mockModuleService.deleteDraft = jest.fn().mockResolvedValue(undefined);
    mockModuleService.getDrafts = jest.fn().mockResolvedValue([]);
    
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      generateStructuredResponse: jest.fn(),
      streamCompletion: jest.fn(),
      updateConfig: jest.fn(),
      validateApiKey: jest.fn().mockReturnValue(true),
      getName: jest.fn().mockReturnValue('mock-provider')
    } as any;
    
    generator = new ModuleGenerator(mockProvider);
    
    // Setup default mock responses
    mockProvider.generateCompletion.mockResolvedValue({ content: 'Generated text' });
    mockProvider.generateStructuredOutput.mockResolvedValue([]);
    mockProvider.generateStructuredResponse.mockResolvedValue({});
  });
  
  describe('generateModule', () => {
    it('should generate a basic module', async () => {
      const options: GenerationOptions = {
        topic: 'Shadow Work',
        difficulty: DifficultyLevel.INTERMEDIATE,
        duration: 60
      };
      
      // Mock specific responses for module generation
      mockProvider.generateCompletion
        .mockResolvedValueOnce({ content: 'Shadow Work in Jungian Psychology' }) // title
        .mockResolvedValueOnce({ content: 'An exploration of the shadow concept' }) // description
        .mockResolvedValueOnce({ content: 'shadow,jung,psychology,unconscious' }) // tags
        .mockResolvedValueOnce({ content: 'Objective 1\nObjective 2\nObjective 3' }) // learning objectives
        .mockResolvedValueOnce({ content: 'Basic psychology\nIntroductory concepts' }); // prerequisites
        
      // Content should be returned by generateStructuredResponse, not generateStructuredOutput
      
      // Mock responses for content, quiz, videos, mindmap, bibliography
      let callCount = 0;
      mockProvider.generateStructuredResponse.mockImplementation(async (prompt) => {
        callCount++;
        
        // Content response
        if (prompt.includes('educational content') || callCount === 1) {
          return {
            introduction: 'Introduction to shadow work - exploring the hidden aspects of the psyche that Jung identified as crucial for psychological development and integration. This comprehensive module delves deep into the concept of the shadow, examining how it forms, why it matters, and how we can work with it constructively.',
            sections: [
              { 
                id: 'section-1', 
                title: 'What is the Shadow?', 
                content: 'This section explores the fundamental concepts in Jungian psychology and their practical applications in understanding human behavior.', 
                order: 0,
                keyTerms: [],
                images: [],
                interactiveElements: [],
                estimatedTime: 10
              }
            ],
            summary: 'Summary of shadow work',
            keyTakeaways: ['Takeaway 1', 'Takeaway 2']
          };
        }
        
        // Quiz response
        if (prompt.includes('quiz') || callCount === 2) {
          return {
            id: 'quiz-1',
            title: 'Shadow Work Quiz',
            description: 'Test your knowledge',
            questions: [
              {
                id: 'q1',
                type: 'multiple-choice',
                question: 'What is the shadow?',
                options: [
                  { id: 0, text: 'The dark side', isCorrect: true },
                  { id: 1, text: 'The light side', isCorrect: false },
                  { id: 2, text: 'The ego', isCorrect: false },
                  { id: 3, text: 'The persona', isCorrect: false }
                ],
                correctAnswers: [0],
                allowMultiple: false,
                explanation: 'The shadow is...',
                points: 10,
                difficulty: DifficultyLevel.INTERMEDIATE
              }
            ],
            passingScore: 70,
            timeLimit: 30
          };
        }
        
        // Videos response
        if (prompt.includes('video') || callCount === 3) {
          return [
            {
              id: 'video-1',
              title: 'Introduction to Shadow Work',
              description: 'Learn about the shadow',
              url: 'https://example.com/video1',
              duration: { hours: 0, minutes: 15, seconds: 0 }
            }
          ];
        }
        
        // Mindmap response (should return object, not array - generateMindMaps wraps it)
        if (prompt.includes('mind map') || callCount === 4) {
          return {
            id: 'mindmap-1',
            title: 'Shadow Work Mind Map',
            description: 'Visual representation of shadow concepts',
            nodes: [
              { id: 'n1', label: 'Shadow', type: 'root', position: { x: 0, y: 0 } },
              { id: 'n2', label: 'Personal Shadow', type: 'concept', position: { x: 100, y: 0 } }
            ],
            edges: [
              { id: 'e1', source: 'n1', target: 'n2', type: 'hierarchical' }
            ],
            layout: { type: 'hierarchical', direction: 'TB' },
            metadata: { 
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              version: '1.0.0',
              isInteractive: true,
              allowEditing: false
            }
          };
        }
        
        // Bibliography response
        if (prompt.includes('bibliography') || callCount === 5) {
          return [
            {
              id: 'bib-1',
              title: 'Man and His Symbols',
              authors: ['Carl Jung'],
              year: 1964,
              type: 'book',
              relevanceNote: 'Essential reading on shadow work'
            }
          ];
        }
        
        // Film references response
        if (prompt.includes('film') || callCount === 6) {
          return [
            {
              id: 'film-1',
              title: 'Black Swan',
              year: 2010,
              director: ['Darren Aronofsky'],
              duration: 108,
              genre: ['Psychological Thriller', 'Drama'],
              relevance: 'Explores shadow integration and the dark aspects of perfectionism'
            }
          ];
        }
        
        // Default response
        return {};
      });
      
      try {
        const result = await generator.generateModule(options);
        
        expect(result).toBeDefined();
        expect(result.title).toBe('Shadow Work in Jungian Psychology');
        expect(result.description).toBe('An exploration of the shadow concept');
        expect(result.tags).toContain('shadow');
        expect(result.content).toBeDefined();
      } catch (error) {
        // Log error details for debugging
        console.error('Test failed with error:', error);
        throw error;
      }
    });
    
    it('should report progress during generation', async () => {
      const progressUpdates: any[] = [];
      
      const options: GenerationOptions = {
        topic: 'Archetypes',
        difficulty: DifficultyLevel.BEGINNER,
        onProgress: (progress) => progressUpdates.push(progress)
      };
      
      // Mock responses for this test
      mockProvider.generateCompletion
        .mockResolvedValueOnce({ content: 'Archetypes in Jungian Psychology' })
        .mockResolvedValueOnce({ content: 'Understanding basic archetypes' })
        .mockResolvedValueOnce({ content: 'archetypes,jung,psychology' })
        .mockResolvedValueOnce({ content: 'Learn archetype basics\nUnderstand Jung theory' }) // learning objectives
        .mockResolvedValueOnce({ content: '' }); // prerequisites (empty for beginner)
        
      // Content will be handled by generateStructuredResponse below
      
      // Same mocking pattern as above
      let callCount = 0;
      mockProvider.generateStructuredResponse.mockImplementation(async (prompt) => {
        callCount++;
        
        // Content response should be first
        if (prompt.includes('educational content') || callCount === 1) {
          return {
            introduction: 'Introduction to archetypes - the universal patterns and images that Jung believed exist in the collective unconscious of all humanity. This foundational module explores how archetypes influence our behavior, thoughts, and emotions throughout life.',
            sections: [
              { 
                id: 'section-1', 
                title: 'Basic Archetypes', 
                content: 'This section explores the fundamental concepts in Jungian psychology and their practical applications in understanding human behavior.', 
                order: 0,
                keyTerms: [],
                images: [],
                interactiveElements: [],
                estimatedTime: 10
              }
            ],
            summary: 'Summary',
            keyTakeaways: ['Key point 1']
          };
        }
        
        if (prompt.includes('quiz') || callCount === 2) {
          return {
            id: 'quiz-1',
            title: 'Quiz',
            description: 'Test',
            questions: [{
              id: 'q1',
              type: 'multiple-choice',
              question: 'What is an archetype?',
              options: [
                { id: 0, text: 'A universal pattern', isCorrect: true },
                { id: 1, text: 'A personal memory', isCorrect: false },
                { id: 2, text: 'A conscious thought', isCorrect: false },
                { id: 3, text: 'A physical object', isCorrect: false }
              ],
              correctAnswers: [0],
              allowMultiple: false,
              explanation: 'Archetypes are universal patterns',
              points: 10,
              difficulty: DifficultyLevel.BEGINNER
            }],
            passingScore: 70,
            timeLimit: 30
          };
        }
        
        if (prompt.includes('video') || callCount === 3) {
          return [];
        }
        
        if (prompt.includes('mind map') || callCount === 4) {
          return {
            id: 'mindmap-1',
            title: 'Mind Map',
            description: 'Test mindmap',
            nodes: [{ id: 'n1', label: 'Root', type: 'root', position: { x: 0, y: 0 } }],
            edges: [],
            layout: { type: 'hierarchical', direction: 'TB' },
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              version: '1.0.0',
              isInteractive: true,
              allowEditing: false
            }
          };
        }
        
        if (prompt.includes('bibliography') || callCount === 5) {
          return [];
        }
        
        if (prompt.includes('film') || callCount === 6) {
          return [];
        }
        
        return {};
      });
      
      await generator.generateModule(options);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe(GenerationStage.INITIALIZING);
      expect(progressUpdates.some(p => p.stage === GenerationStage.COMPLETED)).toBe(true);
    });
    
    it('should handle generation errors gracefully', async () => {
      mockProvider.generateCompletion.mockRejectedValueOnce(new Error('API Error'));
      
      const options: GenerationOptions = {
        topic: 'Test Topic',
        difficulty: DifficultyLevel.INTERMEDIATE
      };
      
      await expect(generator.generateModule(options)).rejects.toThrow('API Error');
    });
  });
  
  describe('resumeFromDraft', () => {
    it('should resume generation from a draft', async () => {
      const draftId = 'draft-123';
      
      // Mock localStorage
      const mockDraft = {
        id: draftId,
        title: 'Draft Module',
        description: 'Draft module description',
        tags: ['draft', 'test'],
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        timeEstimate: { hours: 1, minutes: 0, description: '1 hour' },
        content: { 
          introduction: 'This is a comprehensive introduction to Jung\'s analytical psychology, exploring the core concepts that form the foundation of his therapeutic approach and psychological understanding.',
          sections: [
            {
              id: 'section-1',
              title: 'Draft Section',
              content: 'This draft section provides an overview of fundamental psychological concepts and their practical applications in therapeutic settings.',
              order: 0,
              keyTerms: [],
              images: [],
              interactiveElements: [],
              estimatedTime: 10
            }
          ],
          summary: 'Draft summary',
          keyTakeaways: ['Draft takeaway 1']
        },
        videos: [],
        mindMaps: [],
        quiz: {
          id: 'quiz-draft',
          title: 'Draft Quiz',
          description: 'Test quiz',
          questions: [{
            id: 'q1',
            type: 'multiple-choice',
            question: 'Draft question?',
            options: [
              { id: 0, text: 'Answer A', isCorrect: true },
              { id: 1, text: 'Answer B', isCorrect: false }
            ],
            correctAnswers: [0],
            allowMultiple: false,
            explanation: 'Draft explanation',
            points: 10,
            difficulty: DifficultyLevel.INTERMEDIATE
          }],
          passingScore: 70,
          timeLimit: 30
        },
        bibliography: [],
        filmReferences: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          status: 'draft',
          language: 'en',
          author: {
            id: 'test-author',
            name: 'Test Author'
          }
        }
      };
      
      // Mock getDrafts to return our test draft
      mockModuleService.getDrafts.mockResolvedValue([mockDraft]);
      
      // Mock createModule to return a valid module with all required fields
      mockModuleService.createModule.mockImplementation((module) => 
        Promise.resolve({
          ...module,
          id: module.id || 'generated-id',
          title: module.title || 'Draft Module',
          description: module.description || 'Draft description',
          tags: module.tags || [],
          difficultyLevel: module.difficultyLevel || DifficultyLevel.INTERMEDIATE,
          timeEstimate: module.timeEstimate || { hours: 1, minutes: 0 },
          content: module.content || {},
          videos: module.videos || [],
          mindMaps: module.mindMaps || [],
          quiz: module.quiz || {},
          bibliography: module.bibliography || [],
          filmReferences: module.filmReferences || [],
          metadata: {
            ...module.metadata,
            status: ModuleStatus.DRAFT
          }
        })
      );
      
      // Mock the completion calls for finalization
      mockProvider.generateCompletion
        .mockResolvedValueOnce({ content: 'Draft Learning Objective 1\nDraft Learning Objective 2' })
        .mockResolvedValueOnce({ content: 'Basic understanding\nFoundational concepts' });
      
      const result = await generator.resumeFromDraft(draftId, {
        topic: 'Draft Topic',
        difficulty: DifficultyLevel.INTERMEDIATE
      });
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Draft Module');
    });
  });
});