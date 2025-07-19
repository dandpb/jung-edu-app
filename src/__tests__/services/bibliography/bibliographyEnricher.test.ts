import { BibliographyEnricher } from '../../../services/bibliography/bibliographyEnricher';
import { LLMProvider } from '../../../services/llm/provider';
import { mockBibliographyItem, mockFilmReference } from '../../mocks/mockData';

jest.mock('../../../services/llm/provider');

describe('BibliographyEnricher', () => {
  let enricher: BibliographyEnricher;
  let mockProvider: jest.Mocked<LLMProvider>;
  
  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      streamCompletion: jest.fn(),
      updateConfig: jest.fn()
    } as any;
    
    enricher = new BibliographyEnricher(mockProvider);
    
    // Mock external API calls
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('searchBibliography', () => {
    const mockSearchResults = [
      {
        ...mockBibliographyItem,
        id: 'bib-1',
        title: 'Man and His Symbols',
        relevance: 0.95
      },
      {
        ...mockBibliographyItem,
        id: 'bib-2',
        title: 'The Red Book',
        authors: ['Carl Jung'],
        year: 2009,
        relevance: 0.88
      }
    ];
    
    beforeEach(() => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        references: mockSearchResults
      });
    });
    
    it('should search academic references by concepts', async () => {
      const results = await enricher.searchBibliography({
        concepts: ['collective unconscious', 'archetypes'],
        type: 'academic',
        maxResults: 10
      });
      
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Man and His Symbols');
      expect(results[0].relevance).toBe(0.95);
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('collective unconscious'),
        expect.objectContaining({
          references: expect.any(Object)
        })
      );
    });
    
    it('should filter by publication type', async () => {
      await enricher.searchBibliography({
        concepts: ['shadow'],
        type: 'book',
        yearRange: { from: 2000, to: 2024 }
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('books only');
      expect(prompt).toContain('2000');
      expect(prompt).toContain('2024');
    });
    
    it('should search journal articles', async () => {
      await enricher.searchBibliography({
        concepts: ['individuation'],
        type: 'journal',
        peerReviewed: true,
        impactFactor: 2.0
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('peer-reviewed journals');
      expect(prompt).toContain('impact factor');
    });
    
    it('should include citation counts', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        references: [{
          ...mockBibliographyItem,
          citations: 1250,
          citationTrend: 'increasing'
        }]
      });
      
      const results = await enricher.searchBibliography({
        concepts: ['Jung'],
        includeCitations: true,
        sortBy: 'citations'
      });
      
      expect(results[0].citations).toBe(1250);
    });
  });
  
  describe('searchFilmReferences', () => {
    const mockFilmResults = [
      {
        ...mockFilmReference,
        id: 'film-1',
        title: 'Black Swan',
        relevance: 0.85
      },
      {
        ...mockFilmReference,
        id: 'film-2',
        title: 'Fight Club',
        year: 1999,
        concepts: ['shadow', 'persona'],
        relevance: 0.78
      }
    ];
    
    beforeEach(() => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        films: mockFilmResults
      });
    });
    
    it('should search films by Jungian concepts', async () => {
      const results = await enricher.searchFilmReferences({
        concepts: ['shadow', 'persona'],
        minRating: 7.0,
        yearRange: { from: 1990 }
      });
      
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Black Swan');
      expect(results[0].concepts).toContain('shadow');
    });
    
    it('should analyze psychological themes in films', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        films: [{
          ...mockFilmReference,
          psychologicalAnalysis: {
            themes: ['shadow integration', 'persona dissolution'],
            jungianElements: ['confronting the shadow', 'anima projection'],
            symbolism: ['mirrors', 'doubles', 'darkness']
          }
        }]
      });
      
      const results = await enricher.searchFilmReferences({
        concepts: ['shadow'],
        includeAnalysis: true
      });
      
      expect(results[0].psychologicalAnalysis).toBeDefined();
      expect(results[0].psychologicalAnalysis.themes).toContain('shadow integration');
    });
    
    it('should filter by genre and decade', async () => {
      await enricher.searchFilmReferences({
        concepts: ['individuation'],
        genres: ['drama', 'psychological thriller'],
        decades: ['2000s', '2010s']
      });
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('drama');
      expect(prompt).toContain('psychological thriller');
      expect(prompt).toContain('2000s');
    });
  });
  
  describe('generateCitations', () => {
    it('should generate APA citations', async () => {
      const apaCitation = 'Jung, C. (1964). Man and his symbols. Dell Publishing.';
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        citation: apaCitation
      });
      
      const citation = await enricher.generateCitation(mockBibliographyItem, 'APA');
      
      expect(citation).toBe(apaCitation);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('APA format'),
        expect.objectContaining({ citation: 'string' })
      );
    });
    
    it('should generate MLA citations', async () => {
      const mlaCitation = 'Jung, Carl. Man and His Symbols. Dell Publishing, 1964.';
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        citation: mlaCitation
      });
      
      const citation = await enricher.generateCitation(mockBibliographyItem, 'MLA');
      
      expect(citation).toBe(mlaCitation);
    });
    
    it('should generate Chicago style citations', async () => {
      const chicagoCitation = 'Jung, Carl. Man and His Symbols. New York: Dell Publishing, 1964.';
      
      mockProvider.generateStructuredOutput.mockResolvedValue({
        citation: chicagoCitation
      });
      
      const citation = await enricher.generateCitation(mockBibliographyItem, 'Chicago');
      
      expect(citation).toBe(chicagoCitation);
    });
    
    it('should handle multiple authors', async () => {
      const multiAuthorItem = {
        ...mockBibliographyItem,
        authors: ['Carl Jung', 'Marie-Louise von Franz', 'Joseph Henderson']
      };
      
      await enricher.generateCitation(multiAuthorItem, 'APA');
      
      const prompt = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(prompt).toContain('multiple authors');
    });
  });
  
  describe('enrichBibliographyItem', () => {
    it('should fetch additional metadata', async () => {
      const enrichedData = {
        abstract: 'Extended abstract...',
        keywords: ['psychology', 'symbolism', 'dreams'],
        doi: '10.1234/example',
        openAccess: false,
        relatedWorks: ['Psychology and Alchemy', 'The Archetypes']
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue(enrichedData);
      
      const enriched = await enricher.enrichBibliographyItem(mockBibliographyItem);
      
      expect(enriched).toMatchObject({
        ...mockBibliographyItem,
        ...enrichedData
      });
    });
    
    it('should fetch from external APIs when available', async () => {
      // Mock CrossRef API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            DOI: '10.1234/example',
            'is-referenced-by-count': 1500,
            abstract: 'API abstract...'
          }
        })
      });
      
      const enriched = await enricher.enrichBibliographyItem({
        ...mockBibliographyItem,
        doi: '10.1234/example'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.crossref.org')
      );
    });
  });
  
  describe('generateReadingList', () => {
    it('should create a structured reading list', async () => {
      const readingList = {
        beginner: [
          { ...mockBibliographyItem, difficulty: 'beginner' }
        ],
        intermediate: [
          { ...mockBibliographyItem, id: 'bib-2', difficulty: 'intermediate' }
        ],
        advanced: [
          { ...mockBibliographyItem, id: 'bib-3', difficulty: 'advanced' }
        ],
        readingOrder: ['bib-1', 'bib-2', 'bib-3'],
        estimatedTime: '3-4 months',
        notes: 'Start with Man and His Symbols for accessibility'
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue(readingList);
      
      const result = await enricher.generateReadingList({
        concepts: ['Jungian psychology basics'],
        level: 'beginner to advanced',
        timeframe: '3 months'
      });
      
      expect(result.beginner).toHaveLength(1);
      expect(result.readingOrder).toHaveLength(3);
      expect(result.estimatedTime).toBe('3-4 months');
    });
  });
  
  describe('analyzeBibliographicTrends', () => {
    it('should analyze publication trends', async () => {
      const trends = {
        topicsOverTime: {
          '2010-2015': ['neuroscience integration', 'cultural psychology'],
          '2016-2020': ['digital age psychology', 'collective trauma'],
          '2021-2024': ['AI and consciousness', 'eco-psychology']
        },
        emergingAuthors: ['Dr. Sarah Johnson', 'Prof. Michael Chen'],
        decliningTopics: ['classical dream analysis'],
        interdisciplinaryConnections: ['neuroscience', 'anthropology', 'AI']
      };
      
      mockProvider.generateStructuredOutput.mockResolvedValue(trends);
      
      const analysis = await enricher.analyzeBibliographicTrends({
        field: 'Jungian psychology',
        yearRange: { from: 2010, to: 2024 }
      });
      
      expect(analysis.topicsOverTime['2021-2024']).toContain('AI and consciousness');
      expect(analysis.interdisciplinaryConnections).toContain('neuroscience');
    });
  });
  
  describe('error handling', () => {
    it('should handle API failures gracefully', async () => {
      mockProvider.generateStructuredOutput.mockRejectedValue(
        new Error('API error')
      );
      
      await expect(enricher.searchBibliography({
        concepts: ['test'],
        type: 'academic'
      })).rejects.toThrow('API error');
    });
    
    it('should validate search parameters', async () => {
      await expect(enricher.searchBibliography({
        concepts: [],
        type: 'academic'
      })).rejects.toThrow('At least one concept is required');
      
      await expect(enricher.generateCitation(
        mockBibliographyItem,
        'InvalidStyle' as any
      )).rejects.toThrow('Unsupported citation style');
    });
    
    it('should handle empty search results', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        references: []
      });
      
      const results = await enricher.searchBibliography({
        concepts: ['very specific concept'],
        type: 'academic'
      });
      
      expect(results).toEqual([]);
    });
  });
  
  describe('caching and performance', () => {
    it('should cache search results', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue({
        references: [mockBibliographyItem]
      });
      
      // First search
      const results1 = await enricher.searchBibliography({
        concepts: ['shadow'],
        type: 'academic'
      });
      
      // Second identical search
      const results2 = await enricher.searchBibliography({
        concepts: ['shadow'],
        type: 'academic'
      });
      
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(1);
      expect(results1).toEqual(results2);
    });
    
    it('should batch API requests efficiently', async () => {
      const items = Array(5).fill(mockBibliographyItem).map((item, i) => ({
        ...item,
        id: `bib-${i}`
      }));
      
      await enricher.enrichMultipleItems(items);
      
      // Should batch requests instead of making 5 separate calls
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(1);
    });
  });
});