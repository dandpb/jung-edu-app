import { ContentGenerator } from '../../../../services/llm/generators/content-generator';
import { LLMProvider } from '../../../../services/llm/provider';
import { mockModule } from '../../../mocks/mockData';

jest.mock('../../../../services/llm/provider');

describe('ContentGenerator', () => {
  let generator: ContentGenerator;
  let mockProvider: jest.Mocked<LLMProvider>;
  
  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredResponse: jest.fn(),
      generateStructuredOutput: jest.fn(),
      streamCompletion: jest.fn(),
      updateConfig: jest.fn(),
      getTokenCount: jest.fn(),
      isAvailable: jest.fn()
    } as any;
    
    generator = new ContentGenerator(mockProvider);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateModuleContent', () => {
    const mockContentResponse = {
      introduction: 'Mock content',
      sections: [
        {
          id: 'section-1',
          title: 'The Collective Unconscious',
          content: 'Mock content',
          subsections: [],
          media: []
        },
        {
          id: 'section-2',
          title: 'Major Archetypes',
          content: 'Mock content',
          subsections: [],
          media: []
        }
      ],
      summary: 'Mock content',
      keyTakeaways: [
        'Understand the collective unconscious',
        'Identify major archetypes'
      ]
    };
    
    beforeEach(() => {
      // Mock for generateSections structure call
      mockProvider.generateStructuredResponse
        .mockResolvedValueOnce([
          { title: 'The Collective Unconscious', concepts: ['collective unconscious', 'archetypes'], duration: 15 },
          { title: 'Major Archetypes', concepts: ['shadow', 'anima', 'animus'], duration: 15 }
        ])
        // Mock for generateKeyTakeaways call
        .mockResolvedValueOnce([
          'Understand the collective unconscious',
          'Identify major archetypes'
        ]);
      mockProvider.generateCompletion.mockResolvedValue('Mock content');
    });
    
    it('should generate module content successfully', async () => {
      const result = await generator.generateModuleContent({
        title: mockModule.title,
        concepts: mockModule.concepts,
        difficulty: mockModule.difficulty
      });
      
      expect(result).toEqual(mockContentResponse);
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledTimes(2);
      expect(mockProvider.generateCompletion).toHaveBeenCalled();
    });
    
    it('should adapt content based on difficulty level', async () => {
      await generator.generateModuleContent({
        title: mockModule.title,
        concepts: mockModule.concepts,
        difficulty: 'beginner'
      });
      
      const prompt = mockProvider.generateCompletion.mock.calls[0][0];
      expect(prompt).toContain('beginner');
      expect(prompt).toContain('simple language');
    });
    
    it('should handle custom learning objectives', async () => {
      const customObjectives = ['Analyze dreams', 'Apply to therapy'];
      
      await generator.generateModuleContent({
        title: mockModule.title,
        concepts: mockModule.concepts,
        difficulty: mockModule.difficulty,
        learningObjectives: customObjectives
      });
      
      const prompt = mockProvider.generateCompletion.mock.calls[0][0];
      expect(prompt).toContain('Analyze dreams');
      expect(prompt).toContain('Apply to therapy');
    });
    
    it('should include prerequisites in generation', async () => {
      await generator.generateModuleContent({
        title: mockModule.title,
        concepts: mockModule.concepts,
        difficulty: mockModule.difficulty,
        prerequisites: ['Basic psychology', 'Dream analysis']
      });
      
      const prompt = mockProvider.generateCompletion.mock.calls[0][0];
      expect(prompt).toContain('prerequisites');
      expect(prompt).toContain('Basic psychology');
    });
  });
  
  describe('generateConceptExplanation', () => {
    const mockExplanation = {
      concept: 'Shadow',
      definition: 'The shadow is the unconscious part...',
      keyPoints: [
        'Contains repressed aspects',
        'Both positive and negative',
        'Essential for individuation'
      ],
      examples: [
        'Projection in relationships',
        'Shadow in dreams'
      ],
      relatedConcepts: ['Persona', 'Self', 'Individuation']
    };
    
    beforeEach(() => {
      mockProvider.generateStructuredResponse.mockResolvedValue(mockExplanation);
    });
    
    it('should generate concept explanation', async () => {
      const result = await generator.generateConceptExplanation('Shadow', {
        context: 'Jungian psychology',
        depth: 'intermediate'
      });
      
      expect(result).toEqual(mockExplanation);
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Shadow'),
        expect.objectContaining({
          concept: 'string',
          definition: 'string',
          keyPoints: 'string[]',
          examples: 'string[]',
          relatedConcepts: 'string[]'
        })
      );
    });
    
    it('should adjust explanation depth', async () => {
      await generator.generateConceptExplanation('Shadow', {
        context: 'Jungian psychology',
        depth: 'beginner'
      });
      
      const prompt = mockProvider.generateCompletion.mock.calls[0][0];
      expect(prompt).toContain('beginner');
      expect(prompt).toContain('simple terms');
    });
  });
  
  describe('enrichContent', () => {
    it('should enrich existing content with examples', async () => {
      const enrichedContent = {
        originalContent: 'The shadow contains...',
        enrichments: {
          examples: ['Personal shadow in daily life', 'Cultural shadow'],
          metaphors: ['The shadow as a dark mirror'],
          practicalApplications: ['Shadow work exercises'],
          culturalReferences: ['Jung\'s Red Book']
        }
      };
      
      mockProvider.generateStructuredResponse.mockResolvedValue(enrichedContent);
      
      const result = await generator.enrichContent(
        'The shadow contains...',
        {
          addExamples: true,
          addMetaphors: true,
          culturalContext: 'Western psychology'
        }
      );
      
      expect(result).toEqual(enrichedContent);
    });
  });
  
  describe('summarizeContent', () => {
    it('should generate content summary', async () => {
      const mockSummary = {
        mainPoints: [
          'The collective unconscious is shared',
          'Archetypes are universal patterns',
          'Individuation is the goal'
        ],
        keyTakeaways: [
          'Understanding the shadow is essential',
          'Dreams reveal unconscious content'
        ],
        briefSummary: 'This module explored Jung\'s core concepts...'
      };
      
      mockProvider.generateStructuredResponse.mockResolvedValue(mockSummary);
      
      const result = await generator.summarizeContent(
        'Long content about Jungian psychology...',
        {
          maxLength: 200,
          style: 'bullet-points'
        }
      );
      
      expect(result).toEqual(mockSummary);
    });
  });
  
  describe('error handling', () => {
    it('should handle generation failures', async () => {
      mockProvider.generateStructuredResponse.mockRejectedValue(
        new Error('API error')
      );
      
      await expect(generator.generateModuleContent({
        title: 'Test',
        concepts: ['test'],
        difficulty: 'intermediate'
      })).rejects.toThrow('API error');
    });
    
    it('should validate input parameters', async () => {
      await expect(generator.generateModuleContent({
        title: '',
        concepts: [],
        difficulty: 'intermediate'
      })).rejects.toThrow('Title and concepts are required');
    });
  });
  
  describe('streaming content generation', () => {
    it('should support streaming for long content', async () => {
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);
      
      mockProvider.streamCompletion.mockImplementation(async (prompt, callback) => {
        callback('Introduction to ');
        callback('Jungian Psychology');
      });
      
      await generator.generateModuleContentStream(
        {
          title: mockModule.title,
          concepts: mockModule.concepts,
          difficulty: mockModule.difficulty
        },
        onChunk
      );
      
      expect(chunks).toEqual(['Introduction to ', 'Jungian Psychology']);
      expect(mockProvider.streamCompletion).toHaveBeenCalled();
    });
  });
});