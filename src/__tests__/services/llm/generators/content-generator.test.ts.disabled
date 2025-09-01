import { ContentGenerator } from '../../../../services/llm/generators/content-generator';
import { LLMProvider } from '../../../../services/llm/provider';
import { mockModule } from '../../../../testUtils/mockData';

jest.mock('../../../../services/llm/provider');

describe('ContentGenerator', () => {
  let generator: ContentGenerator;
  let mockProvider: jest.Mocked<LLMProvider>;
  
  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn(),
      isAvailable: jest.fn(),
      streamCompletion: jest.fn()
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
          order: 0,
          subsections: [],
          media: []
        },
        {
          id: 'section-2',
          title: 'Major Archetypes',
          content: 'Mock content',
          order: 1,
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
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([
          { title: 'The Collective Unconscious', concepts: ['collective unconscious', 'archetypes'], duration: 15 },
          { title: 'Major Archetypes', concepts: ['shadow', 'anima', 'animus'], duration: 15 }
        ])
        // Mock for generateKeyTakeaways call
        .mockResolvedValueOnce([
          'Understand the collective unconscious',
          'Identify major archetypes'
        ]);
      mockProvider.generateCompletion.mockResolvedValue({ content: 'Mock content' });
    });
    
    it('should generate module content successfully', async () => {
      const result = await generator.generateModuleContent({
        title: mockModule.title,
        concepts: mockModule.concepts,
        difficulty: mockModule.difficulty
      });
      
      expect(result).toEqual(mockContentResponse);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(2);
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
      expect(prompt).toContain('linguagem simples');
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
      
      // Find the section content generation calls (not introduction)
      const sectionCalls = mockProvider.generateCompletion.mock.calls.filter(call => 
        call[0].includes('Escreva conteúdo detalhado para a seção')
      );
      
      expect(sectionCalls.length).toBeGreaterThan(0);
      const sectionPrompt = sectionCalls[0][0];
      expect(sectionPrompt).toContain('Pré-requisitos');
      expect(sectionPrompt).toContain('Basic psychology');
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
      mockProvider.generateStructuredOutput.mockResolvedValue(mockExplanation);
    });
    
    it('should generate concept explanation', async () => {
      const result = await generator.generateConceptExplanation('Shadow', {
        context: 'Jungian psychology',
        depth: 'intermediate'
      });
      
      expect(result).toEqual(mockExplanation);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Shadow'),
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            concept: { type: 'string' },
            definition: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } }
          })
        })
      );
    });
    
    it('should adjust explanation depth', async () => {
      await generator.generateConceptExplanation('Shadow', {
        context: 'Jungian psychology',
        depth: 'beginner'
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('iniciante');
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
      
      mockProvider.generateStructuredOutput.mockResolvedValue(enrichedContent);
      
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
      
      mockProvider.generateStructuredOutput.mockResolvedValue(mockSummary);
      
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
      mockProvider.generateStructuredOutput.mockRejectedValue(
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
      
      // Mock for generateSections structure call
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce([
          { title: 'The Collective Unconscious', concepts: ['collective unconscious', 'archetypes'], duration: 15 },
          { title: 'Major Archetypes', concepts: ['shadow', 'anima', 'animus'], duration: 15 }
        ])
        // Mock for generateKeyTakeaways call
        .mockResolvedValueOnce([
          'Understand the collective unconscious',
          'Identify major archetypes'
        ]);

      // Mock generateCompletion for generateSummary
      mockProvider.generateCompletion.mockResolvedValue({ content: 'This module explored the collective unconscious and archetypes' });
      
      // Mock streamCompletion for introduction and section content
      mockProvider.streamCompletion.mockImplementation(async (prompt, callback, options) => {
        if (prompt.includes('introdução') || prompt.includes('Introdução')) {
          // Stream introduction
          callback('Introduction to ');
          callback('Jungian Psychology');
        } else if (prompt.includes('The Collective Unconscious')) {
          // Stream first section
          callback('The collective unconscious is ');
          callback('a shared psychological foundation.');
        } else if (prompt.includes('Major Archetypes')) {
          // Stream second section  
          callback('Jung identified several ');
          callback('universal archetypes.');
        }
        return Promise.resolve();
      });
      
      const result = await generator.generateModuleContentStream(
        {
          title: mockModule.title,
          concepts: mockModule.concepts,
          difficulty: mockModule.difficulty
        },
        onChunk
      );
      
      // Check that streaming happened
      expect(chunks).toContain('Introduction to ');
      expect(chunks).toContain('Jungian Psychology');
      expect(chunks).toContain('\n\n## The Collective Unconscious\n\n');
      expect(chunks).toContain('The collective unconscious is ');
      expect(chunks).toContain('\n\n## Major Archetypes\n\n');
      expect(chunks).toContain('Jung identified several ');
      
      // Check the result structure
      expect(result).toHaveProperty('introduction');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyTakeaways');
      expect(result.introduction).toBe('Introduction to Jungian Psychology');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].content).toBe('The collective unconscious is a shared psychological foundation.');
      expect(result.sections[1].content).toBe('Jung identified several universal archetypes.');
      
      expect(mockProvider.streamCompletion).toHaveBeenCalledTimes(3); // intro + 2 sections
    });
  });
});