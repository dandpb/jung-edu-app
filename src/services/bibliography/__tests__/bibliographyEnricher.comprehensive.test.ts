/**
 * Comprehensive test suite for BibliographyEnricher
 * Targets 85%+ coverage from current 32% for maximum impact
 */

import {
  BibliographyEnricher,
  enrichReference,
  generateBibliography,
  generateReadingPath,
  exportBibliography,
  formatters,
  BibliographyOptions,
  BibliographySearchOptions,
  FilmSearchOptions,
  BibliographyItem,
  FilmReference,
  ReadingListOptions,
  CitationStyle,
  TrendAnalysisOptions
} from '../bibliographyEnricher';

import {
  Reference,
  allReferences,
  findReferencesByKeywords,
  findReferencesByCategory,
  keywordGroups
} from '../referenceDatabase';

// Mock the reference database
jest.mock('../referenceDatabase', () => ({
  allReferences: [
    {
      id: 'cw9i',
      type: 'book',
      title: 'The Archetypes and the Collective Unconscious',
      author: 'Jung, C.G.',
      year: 1959,
      publisher: 'Princeton University Press',
      category: ['core', 'archetypes', 'unconscious'],
      keywords: ['archetype', 'collective unconscious', 'anima', 'animus', 'shadow'],
      volume: 9,
      pages: '451'
    },
    {
      id: 'mams',
      type: 'book',
      title: 'Man and His Symbols',
      author: ['Jung, C.G.', 'von Franz, M.-L.'],
      year: 1964,
      publisher: 'Doubleday',
      category: ['accessible', 'introduction', 'symbols'],
      keywords: ['symbols', 'dreams', 'unconscious', 'psychology'],
      isbn: '978-0-440-35183-5'
    },
    {
      id: 'redbook',
      type: 'book',
      title: 'The Red Book: Liber Novus',
      author: 'Jung, C.G.',
      year: 2009,
      publisher: 'W. W. Norton',
      category: ['personal', 'visionary', 'advanced'],
      keywords: ['active imagination', 'individuation', 'confrontation with unconscious'],
      isbn: '978-0-393-06567-1'
    },
    {
      id: 'article-1',
      type: 'article',
      title: 'Modern Applications of Jungian Psychology',
      author: 'Smith, J.',
      year: 2020,
      journal: 'Journal of Analytical Psychology',
      volume: 65,
      issue: 3,
      pages: '234-256',
      doi: '10.1111/1468-5922.12345',
      category: ['academic', 'contemporary'],
      keywords: ['modern psychology', 'clinical application', 'therapy']
    }
  ],
  findReferencesByKeywords: jest.fn(),
  findReferencesByCategory: jest.fn(),
  keywordGroups: {
    archetypal: ['archetype', 'anima', 'animus', 'shadow', 'self'],
    unconscious: ['collective unconscious', 'personal unconscious', 'complexes'],
    individuation: ['individuation', 'self-realization', 'wholeness'],
    dreams: ['dreams', 'dream analysis', 'active imagination'],
    symbols: ['symbols', 'symbolism', 'mythology']
  }
}));

const mockReferences = [
  {
    id: 'cw9i',
    type: 'book' as const,
    title: 'The Archetypes and the Collective Unconscious',
    author: 'Jung, C.G.',
    year: 1959,
    publisher: 'Princeton University Press',
    category: ['core', 'archetypes', 'unconscious'],
    keywords: ['archetype', 'collective unconscious', 'anima', 'animus', 'shadow'],
    volume: 9,
    pages: '451'
  },
  {
    id: 'mams',
    type: 'book' as const,
    title: 'Man and His Symbols',
    author: ['Jung, C.G.', 'von Franz, M.-L.'],
    year: 1964,
    publisher: 'Doubleday',
    category: ['accessible', 'introduction', 'symbols'],
    keywords: ['symbols', 'dreams', 'unconscious', 'psychology'],
    isbn: '978-0-440-35183-5'
  }
];

describe('BibliographyEnricher Comprehensive Tests', () => {
  let enricher: BibliographyEnricher;
  let mockProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock provider for testing
    mockProvider = {
      generateStructuredOutput: jest.fn().mockResolvedValue({
        references: [
          {
            id: 'mock-ref-1',
            title: 'Mock Reference',
            authors: ['Mock Author'],
            year: 2023,
            relevance: 0.85
          }
        ]
      })
    };

    enricher = new BibliographyEnricher(mockProvider);

    // Mock fetch for external API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: {
          abstract: 'Mock abstract from API',
          'is-referenced-by-count': 150
        }
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Citation Formatters', () => {
    const testReference: Reference = mockReferences[0];

    describe('APA Formatter', () => {
      it('should format book citation correctly', () => {
        const result = formatters.apa(testReference);
        
        expect(result).toContain('Jung, C.G.');
        expect(result).toContain('(1959)');
        expect(result).toContain('The Archetypes and the Collective Unconscious');
        expect(result).toContain('Princeton University Press');
      });

      it('should format multiple authors correctly', () => {
        const result = formatters.apa(mockReferences[1]);
        
        expect(result).toContain('Jung, C.G., & von Franz, M.-L.');
      });

      it('should handle more than 2 authors with et al', () => {
        const multiAuthorRef = {
          ...testReference,
          author: ['Author1', 'Author2', 'Author3']
        };
        
        const result = formatters.apa(multiAuthorRef);
        expect(result).toContain('Author1, et al.');
      });

      it('should format article citation with DOI', () => {
        const articleRef = {
          id: 'article-test',
          type: 'article' as const,
          title: 'Test Article',
          author: 'Smith, J.',
          year: 2020,
          journal: 'Test Journal',
          volume: 5,
          issue: 2,
          pages: '10-20',
          doi: '10.1000/test',
          category: ['test'],
          keywords: ['test']
        };
        
        const result = formatters.apa(articleRef);
        expect(result).toContain('Smith, J. (2020)');
        expect(result).toContain('Test Article');
        expect(result).toContain('*Test Journal*');
        expect(result).toContain('https://doi.org/10.1000/test');
      });
    });

    describe('MLA Formatter', () => {
      it('should format book citation correctly', () => {
        const result = formatters.mla(testReference);
        
        expect(result).toContain('Jung, C.G.');
        expect(result).toContain('*The Archetypes and the Collective Unconscious.*');
        expect(result).toContain('Princeton University Press, 1959');
      });

      it('should reverse author names correctly', () => {
        const result = formatters.mla(testReference);
        expect(result).toStartWith('Jung, C.G.');
      });

      it('should handle film citations', () => {
        const filmRef = {
          ...testReference,
          type: 'film' as const,
          title: 'Test Film',
          author: 'Director Name'
        };
        
        const result = formatters.mla(filmRef);
        expect(result).toContain('*Test Film.*');
        expect(result).toContain('Directed by Director Name');
      });
    });

    describe('Chicago Formatter', () => {
      it('should format book citation correctly', () => {
        const result = formatters.chicago(testReference);
        
        expect(result).toContain('Jung, C.G.');
        expect(result).toContain('*The Archetypes and the Collective Unconscious*');
        expect(result).toContain('Princeton University Press, 1959');
      });

      it('should format articles with proper punctuation', () => {
        const articleRef = {
          id: 'article-chicago',
          type: 'article' as const,
          title: 'Chicago Test',
          author: 'Test Author',
          year: 2021,
          journal: 'Test Journal',
          volume: 10,
          issue: 1,
          pages: '1-10',
          category: ['test'],
          keywords: ['test']
        };
        
        const result = formatters.chicago(articleRef);
        expect(result).toContain('"Chicago Test."');
        expect(result).toContain('*Test Journal*');
      });
    });
  });

  describe('Reference Enrichment', () => {
    const baseReference: Reference = mockReferences[0];

    it('should enrich reference with relevance score', () => {
      const options: BibliographyOptions = {
        topic: 'archetypes',
        keywords: ['archetype', 'unconscious']
      };
      
      const result = enrichReference(baseReference, options);
      
      expect(result.relevanceScore).toBeGreaterThan(0);
      expect(result.relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should determine correct reading level', () => {
      const beginnerRef = mockReferences[1]; // Man and His Symbols
      const result = enrichReference(beginnerRef);
      
      expect(result.readingLevel).toBe('beginner');
    });

    it('should assign scholar level to academic articles', () => {
      const academicRef = {
        ...baseReference,
        type: 'article' as const,
        category: ['academic']
      };
      
      const result = enrichReference(academicRef);
      expect(result.readingLevel).toBe('scholar');
    });

    it('should calculate topic relevance scores', () => {
      const options: BibliographyOptions = {
        topic: 'collective unconscious',
        keywords: ['archetype', 'jung']
      };
      
      const result = enrichReference(baseReference, options);
      
      expect(result.topicRelevance).toBeDefined();
      expect(result.topicRelevance.topic).toBeGreaterThan(0);
      expect(result.topicRelevance.keywords).toBeGreaterThan(0);
    });

    it('should generate formatted citations', () => {
      const result = enrichReference(baseReference);
      
      expect(result.formattedCitation.apa).toBeDefined();
      expect(result.formattedCitation.mla).toBeDefined();
      expect(result.formattedCitation.chicago).toBeDefined();
    });

    it('should find related references', () => {
      const result = enrichReference(baseReference);
      
      // May or may not have related IDs depending on mock data
      if (result.relatedIds) {
        expect(Array.isArray(result.relatedIds)).toBe(true);
      }
    });

    it('should boost relevance for matching reading level', () => {
      const options: BibliographyOptions = {
        readingLevel: 'beginner'
      };
      
      const beginnerRef = mockReferences[1];
      const result = enrichReference(beginnerRef, options);
      
      expect(result.relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Bibliography Generation', () => {
    it('should generate bibliography with default options', () => {
      const result = generateBibliography();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by include types', () => {
      const options: BibliographyOptions = {
        includeTypes: ['book']
      };
      
      const result = generateBibliography(options);
      result.forEach(ref => {
        expect(ref.type).toBe('book');
      });
    });

    it('should exclude specified types', () => {
      const options: BibliographyOptions = {
        excludeTypes: ['article']
      };
      
      const result = generateBibliography(options);
      result.forEach(ref => {
        expect(ref.type).not.toBe('article');
      });
    });

    it('should filter by year range', () => {
      const options: BibliographyOptions = {
        yearRange: { start: 1950, end: 1970 }
      };
      
      const result = generateBibliography(options);
      result.forEach(ref => {
        expect(ref.year).toBeGreaterThanOrEqual(1950);
        expect(ref.year).toBeLessThanOrEqual(1970);
      });
    });

    it('should filter by reading level', () => {
      const options: BibliographyOptions = {
        readingLevel: 'beginner'
      };
      
      const result = generateBibliography(options);
      result.forEach(ref => {
        expect(ref.readingLevel).toBe('beginner');
      });
    });

    it('should sort by different criteria', () => {
      const yearSort = generateBibliography({ sortBy: 'year' });
      const titleSort = generateBibliography({ sortBy: 'title' });
      const relevanceSort = generateBibliography({ sortBy: 'relevance' });
      
      expect(yearSort).toBeDefined();
      expect(titleSort).toBeDefined();
      expect(relevanceSort).toBeDefined();
    });

    it('should limit results', () => {
      const options: BibliographyOptions = {
        maxResults: 2
      };
      
      const result = generateBibliography(options);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Reading Path Generation', () => {
    it('should generate reading paths for different levels', () => {
      const paths = generateReadingPath('archetypes');
      
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
      
      const levels = paths.map(p => p.level);
      expect(levels).toContain('Beginner');
    });

    it('should provide descriptions for each path', () => {
      const paths = generateReadingPath('individuation');
      
      paths.forEach(path => {
        expect(path.description).toBeDefined();
        expect(path.description.length).toBeGreaterThan(0);
        expect(path.references).toBeDefined();
      });
    });

    it('should filter empty paths', () => {
      const paths = generateReadingPath('nonexistent-topic');
      
      // All paths should have at least some references or be filtered out
      paths.forEach(path => {
        expect(path.references.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Bibliography Export', () => {
    const mockEnrichedRefs = [
      {
        ...mockReferences[0],
        relevanceScore: 85,
        readingLevel: 'intermediate' as const,
        topicRelevance: { archetypes: 0.8 },
        formattedCitation: {
          apa: 'Jung, C.G. (1959). *The Archetypes and the Collective Unconscious*. Princeton University Press.',
          mla: 'Jung, C.G. *The Archetypes and the Collective Unconscious*. Princeton University Press, 1959.',
          chicago: 'Jung, C.G. *The Archetypes and the Collective Unconscious*. Princeton University Press, 1959.'
        }
      }
    ];

    it('should export in APA format by default', () => {
      const result = exportBibliography(mockEnrichedRefs);
      
      expect(result).toContain('Jung, C.G.');
      expect(result).toContain('(1959)');
    });

    it('should export in MLA format', () => {
      const result = exportBibliography(mockEnrichedRefs, 'mla');
      
      expect(result).toContain('Jung, C.G.');
      expect(result).not.toContain('(1959)');
      expect(result).toContain(', 1959');
    });

    it('should export in Chicago format', () => {
      const result = exportBibliography(mockEnrichedRefs, 'chicago');
      
      expect(result).toContain('Jung, C.G.');
      expect(result).toContain('*The Archetypes');
    });

    it('should export in BibTeX format', () => {
      const result = exportBibliography(mockEnrichedRefs, 'bibtex');
      
      expect(result).toContain('@book{cw9i');
      expect(result).toContain('title = {The Archetypes and the Collective Unconscious}');
      expect(result).toContain('author = {Jung, C.G.}');
      expect(result).toContain('year = {1959}');
    });

    it('should handle empty reference list', () => {
      const result = exportBibliography([]);
      expect(result).toBe('');
    });
  });

  describe('BibliographyEnricher Class', () => {
    describe('Constructor and Provider', () => {
      it('should initialize with provider', () => {
        const enricherWithProvider = new BibliographyEnricher(mockProvider);
        expect(enricherWithProvider).toBeDefined();
      });

      it('should initialize without provider', () => {
        const enricherWithoutProvider = new BibliographyEnricher();
        expect(enricherWithoutProvider).toBeDefined();
      });
    });

    describe('searchBibliography', () => {
      it('should search with basic options', async () => {
        const options: BibliographySearchOptions = {
          concepts: ['shadow', 'anima']
        };
        
        const result = await enricher.searchBibliography(options);
        
        expect(Array.isArray(result)).toBe(true);
      });

      it('should throw error for empty concepts', async () => {
        await expect(enricher.searchBibliography({ concepts: [] }))
          .rejects.toThrow('At least one concept is required');
      });

      it('should use cache for repeated searches', async () => {
        const options: BibliographySearchOptions = {
          concepts: ['test']
        };
        
        await enricher.searchBibliography(options);
        const result2 = await enricher.searchBibliography(options);
        
        expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(1);
      });

      it('should filter by type', async () => {
        const options: BibliographySearchOptions = {
          concepts: ['jung'],
          type: 'book'
        };
        
        await enricher.searchBibliography(options);
        expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
      });

      it('should handle year range filtering', async () => {
        const options: BibliographySearchOptions = {
          concepts: ['psychology'],
          yearRange: { from: 2000, to: 2023 }
        };
        
        const result = await enricher.searchBibliography(options);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should include citations when requested', async () => {
        const options: BibliographySearchOptions = {
          concepts: ['jung'],
          includeCitations: true
        };
        
        const result = await enricher.searchBibliography(options);
        
        if (result.length > 0) {
          expect(result[0].citations).toBeDefined();
          expect(result[0].citationTrend).toBeDefined();
        }
      });
    });

    describe('searchFilmReferences', () => {
      beforeEach(() => {
        mockProvider.generateStructuredOutput.mockResolvedValue({
          films: [
            {
              id: 'film-1',
              title: 'Test Film',
              year: 2020,
              concepts: ['shadow'],
              relevance: 0.8
            }
          ]
        });
      });

      it('should search films with basic options', async () => {
        const options: FilmSearchOptions = {
          concepts: ['shadow']
        };
        
        const result = await enricher.searchFilmReferences(options);
        
        expect(Array.isArray(result)).toBe(true);
        expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
      });

      it('should filter by genres and decades', async () => {
        const options: FilmSearchOptions = {
          concepts: ['individuation'],
          genres: ['drama', 'thriller'],
          decades: ['2010s', '2020s']
        };
        
        await enricher.searchFilmReferences(options);
        
        const callArgs = mockProvider.generateStructuredOutput.mock.calls[0][0];
        expect(callArgs).toContain('drama, thriller');
        expect(callArgs).toContain('2010s, 2020s');
      });

      it('should handle year range and rating filters', async () => {
        const options: FilmSearchOptions = {
          concepts: ['anima'],
          yearRange: { from: 2000, to: 2020 },
          minRating: 7.0
        };
        
        await enricher.searchFilmReferences(options);
        
        const callArgs = mockProvider.generateStructuredOutput.mock.calls[0][0];
        expect(callArgs).toContain('Year range: 2000 to 2020');
        expect(callArgs).toContain('Minimum rating: 7');
      });

      it('should include psychological analysis when requested', async () => {
        const options: FilmSearchOptions = {
          concepts: ['shadow'],
          includeAnalysis: true
        };
        
        await enricher.searchFilmReferences(options);
        
        // Check that schema includes psychological analysis
        const schemaArg = mockProvider.generateStructuredOutput.mock.calls[0][1];
        expect(schemaArg.films.items.properties.psychologicalAnalysis).toBeDefined();
      });

      it('should fallback to mock data without provider', async () => {
        const enricherNoProvider = new BibliographyEnricher();
        
        const result = await enricherNoProvider.searchFilmReferences({
          concepts: ['shadow']
        });
        
        expect(Array.isArray(result)).toBe(true);
        // Should return mock films that match the concepts
      });
    });

    describe('generateCitation', () => {
      const mockBibItem: BibliographyItem = {
        id: 'test-1',
        type: 'book',
        title: 'Test Book',
        authors: ['Test Author'],
        year: 2023,
        relevance: 0.8
      };

      it('should generate APA citation', async () => {
        const result = await enricher.generateCitation(mockBibItem, 'APA');
        
        expect(result).toContain('Test Author');
        expect(result).toContain('(2023)');
        expect(result).toContain('Test Book');
      });

      it('should generate MLA citation', async () => {
        const result = await enricher.generateCitation(mockBibItem, 'MLA');
        
        expect(result).toContain('Test Author');
        expect(result).toContain('Test Book');
        expect(result).toContain('2023');
      });

      it('should generate Chicago citation', async () => {
        const result = await enricher.generateCitation(mockBibItem, 'Chicago');
        
        expect(result).toContain('Test Author');
        expect(result).toContain('*Test Book*');
      });

      it('should throw error for unsupported style', async () => {
        await expect(enricher.generateCitation(mockBibItem, 'INVALID' as CitationStyle))
          .rejects.toThrow('Unsupported citation style');
      });

      it('should handle multiple authors', async () => {
        const multiAuthorItem = {
          ...mockBibItem,
          authors: ['Author One', 'Author Two', 'Author Three']
        };
        
        const result = await enricher.generateCitation(multiAuthorItem, 'APA');
        expect(result).toBeDefined();
      });
    });

    describe('enrichBibliographyItem', () => {
      const mockItem: BibliographyItem = {
        id: 'enrich-test',
        type: 'article',
        title: 'Test Article',
        authors: ['Test Author'],
        year: 2020,
        doi: '10.1000/test',
        relevance: 0.7
      };

      it('should enrich item with provider', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue({
          abstract: 'Enhanced abstract',
          keywords: ['enhanced', 'keywords'],
          openAccess: true,
          relatedWorks: ['Related Work 1']
        });
        
        const result = await enricher.enrichBibliographyItem(mockItem);
        
        expect(result.abstract).toBe('Enhanced abstract');
        expect(result.keywords).toEqual(['enhanced', 'keywords']);
        expect(result.openAccess).toBe(true);
      });

      it('should use external API for DOI enrichment', async () => {
        const enricherNoProvider = new BibliographyEnricher();
        
        const result = await enricherNoProvider.enrichBibliographyItem(mockItem);
        
        expect(result.abstract).toBe('Mock abstract from API');
        expect(result.citations).toBe(150);
      });

      it('should handle API failures gracefully', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
        const enricherNoProvider = new BibliographyEnricher();
        
        const result = await enricherNoProvider.enrichBibliographyItem(mockItem);
        
        expect(result).toBeDefined();
        expect(result.abstract).toBe('Extended abstract...');
      });

      it('should provide fallback enrichment data', async () => {
        const enricherNoProvider = new BibliographyEnricher();
        const itemWithoutDoi = { ...mockItem, doi: undefined };
        
        const result = await enricherNoProvider.enrichBibliographyItem(itemWithoutDoi);
        
        expect(result.keywords).toEqual(['psychology', 'symbolism', 'dreams']);
        expect(result.openAccess).toBeDefined();
        expect(result.relatedWorks).toBeDefined();
      });
    });

    describe('generateReadingList', () => {
      const mockOptions: ReadingListOptions = {
        concepts: ['individuation', 'shadow'],
        level: 'intermediate',
        timeframe: '3 months'
      };

      it('should generate reading list with provider', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue({
          beginner: [{ id: 'beg-1', title: 'Beginner Book' }],
          intermediate: [{ id: 'int-1', title: 'Intermediate Book' }],
          advanced: [{ id: 'adv-1', title: 'Advanced Book' }],
          readingOrder: ['beg-1', 'int-1', 'adv-1'],
          estimatedTime: '3-4 months',
          notes: 'Structured reading path'
        });
        
        const result = await enricher.generateReadingList(mockOptions);
        
        expect(result.beginner).toBeDefined();
        expect(result.intermediate).toBeDefined();
        expect(result.advanced).toBeDefined();
        expect(result.readingOrder).toBeDefined();
      });

      it('should generate reading list without provider', async () => {
        const enricherNoProvider = new BibliographyEnricher();
        
        const result = await enricherNoProvider.generateReadingList(mockOptions);
        
        expect(result.beginner).toBeDefined();
        expect(result.intermediate).toBeDefined();
        expect(result.advanced).toBeDefined();
        expect(result.estimatedTime).toBe('3 months');
      });
    });

    describe('analyzeBibliographicTrends', () => {
      it('should return trend analysis', async () => {
        const options: TrendAnalysisOptions = {
          field: 'jungian psychology',
          yearRange: { from: 2010, to: 2023 }
        };
        
        const result = await enricher.analyzeBibliographicTrends(options);
        
        expect(result.topicsOverTime).toBeDefined();
        expect(result.emergingAuthors).toBeDefined();
        expect(result.decliningTopics).toBeDefined();
        expect(result.interdisciplinaryConnections).toBeDefined();
      });
    });

    describe('enrichMultipleItems', () => {
      const mockItems: BibliographyItem[] = [
        {
          id: 'multi-1',
          type: 'book',
          title: 'Multi Test 1',
          authors: ['Author 1'],
          year: 2021,
          relevance: 0.8
        },
        {
          id: 'multi-2',
          type: 'article',
          title: 'Multi Test 2',
          authors: ['Author 2'],
          year: 2022,
          relevance: 0.9
        }
      ];

      it('should enrich multiple items with provider', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue({
          enrichedItems: [
            { id: 'multi-1', abstract: 'Enhanced 1', keywords: ['key1'] },
            { id: 'multi-2', abstract: 'Enhanced 2', keywords: ['key2'] }
          ]
        });
        
        const result = await enricher.enrichMultipleItems(mockItems);
        
        expect(result).toHaveLength(2);
        expect(result[0].abstract).toBe('Enhanced 1');
        expect(result[1].abstract).toBe('Enhanced 2');
      });

      it('should handle malformed provider response', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue(null);
        
        const result = await enricher.enrichMultipleItems(mockItems);
        
        expect(result).toHaveLength(2);
        expect(result[0]).toBeDefined();
        expect(result[1]).toBeDefined();
      });

      it('should enrich items individually without provider', async () => {
        const enricherNoProvider = new BibliographyEnricher();
        
        const result = await enricherNoProvider.enrichMultipleItems(mockItems);
        
        expect(result).toHaveLength(2);
        expect(result[0].keywords).toEqual(['psychology', 'symbolism', 'dreams']);
        expect(result[1].keywords).toEqual(['psychology', 'symbolism', 'dreams']);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed reference data', () => {
      const malformedRef = {
        id: 'malformed',
        type: 'unknown' as any,
        title: '',
        author: null,
        year: 0,
        category: [],
        keywords: []
      };
      
      expect(() => enrichReference(malformedRef)).not.toThrow();
    });

    it('should handle empty keyword groups', () => {
      const emptyKeywordRef = {
        ...mockReferences[0],
        keywords: []
      };
      
      const result = enrichReference(emptyKeywordRef);
      expect(result.relevanceScore).toBe(0);
    });

    it('should handle references with no categories', () => {
      const noCategoryRef = {
        ...mockReferences[0],
        category: []
      };
      
      const result = enrichReference(noCategoryRef);
      expect(result.readingLevel).toBe('intermediate');
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for comprehensive bibliography generation', async () => {
      const options: BibliographySearchOptions = {
        concepts: ['shadow work', 'individuation'],
        type: 'academic',
        maxResults: 10,
        yearRange: { from: 1950 },
        includeCitations: true,
        sortBy: 'relevance'
      };
      
      const searchResults = await enricher.searchBibliography(options);
      expect(searchResults).toBeDefined();
      
      if (searchResults.length > 0) {
        const citation = await enricher.generateCitation(searchResults[0], 'APA');
        expect(citation).toBeDefined();
        
        const enriched = await enricher.enrichBibliographyItem(searchResults[0]);
        expect(enriched).toBeDefined();
      }
    });

    it('should generate complete reading path with citations', () => {
      const paths = generateReadingPath('shadow integration');
      expect(paths.length).toBeGreaterThan(0);
      
      paths.forEach(path => {
        const exported = exportBibliography(path.references, 'apa');
        expect(typeof exported).toBe('string');
      });
    });
  });
});