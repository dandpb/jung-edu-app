import { BibliographyGenerator, BibliographyEntry } from '../bibliography-generator';
import { ILLMProvider } from '../../types';

// Mock the provider
jest.mock('../../provider');

describe('BibliographyGenerator', () => {
  let generator: BibliographyGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      generateStructuredResponse: jest.fn(),
      generateCompletion: jest.fn(),
      generateText: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      validateApiKey: jest.fn().mockReturnValue(true),
    } as any;

    generator = new BibliographyGenerator(mockProvider);
  });

  describe('generateBibliography', () => {
    const mockBibliographyData = [
      {
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'O Homem e Seus Símbolos',
        year: 2016,
        publisher: 'Nova Fronteira',
        url: 'https://books.google.com.br/books?id=exemplo',
        abstract: 'Introdução acessível aos conceitos fundamentais da psicologia junguiana',
        relevance: 'Obra fundamental recomendada para iniciantes',
        jungianConcepts: ['arquétipos', 'inconsciente coletivo', 'símbolos'],
        readingLevel: 'beginner'
      },
      {
        type: 'article',
        authors: ['Silva, Maria'],
        title: 'A Sombra na Psicologia Junguiana',
        year: 2022,
        journal: 'Revista Brasileira de Psicologia',
        volume: '15',
        issue: '3',
        pages: '45-62',
        doi: '10.1234/rbp.2022.15.3.45',
        url: 'https://scielo.br/article/exemplo',
        abstract: 'Análise contemporânea do conceito de sombra',
        relevance: 'Aplicação prática do conceito de sombra na terapia',
        jungianConcepts: ['sombra', 'projeção', 'integração'],
        readingLevel: 'intermediate'
      }
    ];

    it('should generate bibliography with proper formatting', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue(mockBibliographyData);

      const bibliography = await generator.generateBibliography(
        'Sombra Junguiana',
        ['sombra', 'projeção', 'integração'],
        'intermediate',
        10,
        'pt-BR'
      );

      expect(bibliography).toHaveLength(2);
      expect(bibliography[0]).toMatchObject({
        id: expect.stringMatching(/^bib-\d+-0$/),
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'O Homem e Seus Símbolos',
        year: 2016,
        readingLevel: 'beginner'
      });

      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Gere 10 recursos educacionais'),
        expect.objectContaining({
          type: 'array',
          items: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              type: expect.any(Object),
              authors: expect.any(Object),
              title: expect.any(Object)
            })
          })
        }),
        { temperature: 0.7 }
      );
    });

    it('should handle English language requests', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue([
        {
          type: 'book',
          authors: ['Jung, Carl Gustav'],
          title: 'Man and His Symbols',
          year: 1964,
          publisher: 'Dell Publishing',
          url: 'https://archive.org/details/example',
          abstract: 'Accessible introduction to Jungian concepts',
          relevance: 'Essential introductory work',
          jungianConcepts: ['archetypes', 'collective unconscious'],
          readingLevel: 'beginner'
        }
      ]);

      const bibliography = await generator.generateBibliography(
        'Archetypes',
        ['shadow', 'anima', 'animus'],
        'introductory',
        5,
        'en'
      );

      expect(bibliography).toHaveLength(1);
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Generate 5 educational resources'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.generateStructuredResponse.mockRejectedValue(new Error('Provider error'));

      const bibliography = await generator.generateBibliography(
        'Test Topic',
        ['concept1'],
        'advanced',
        5
      );

      expect(bibliography).toEqual([]);
    });

    it('should handle non-array responses', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue({ items: 'not an array' });

      const bibliography = await generator.generateBibliography(
        'Test Topic',
        ['concept1'],
        'intermediate',
        5
      );

      expect(bibliography).toEqual([]);
    });

    it('should handle string entries in response', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue([
        'Invalid string entry',
        mockBibliographyData[0]
      ]);

      const bibliography = await generator.generateBibliography(
        'Test Topic',
        ['concept1'],
        'beginner',
        2
      );

      expect(bibliography).toHaveLength(2);
      // First entry should be fallback
      expect(bibliography[0]).toMatchObject({
        type: 'book',
        authors: ['Unknown'],
        title: 'Invalid string entry',
        year: new Date().getFullYear(),
        url: 'https://example.com',
        relevance: 'Fallback entry'
      });
      // Second entry should be normal
      expect(bibliography[1].title).toBe('O Homem e Seus Símbolos');
    });

    it('should set reading level based on provided level', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue([
        { ...mockBibliographyData[0], readingLevel: undefined }
      ]);

      const bibliography = await generator.generateBibliography(
        'Test',
        ['concept'],
        'advanced',
        1
      );

      expect(bibliography[0].readingLevel).toBe('advanced');
    });
  });

  describe('generateFilmSuggestions', () => {
    const mockFilmData = [
      {
        title: 'A Sabedoria dos Sonhos',
        director: 'Stephen Segaller',
        year: 1989,
        type: 'documentary',
        relevance: 'Documentário essencial sobre a vida de Jung',
        streamingUrl: 'https://www.youtube.com/watch?v=exemplo',
        trailerUrl: 'https://www.youtube.com/watch?v=trailer'
      },
      {
        title: 'A Dangerous Method',
        director: 'David Cronenberg',
        year: 2011,
        type: 'biographical',
        relevance: 'Retrata a relação entre Jung e Freud',
        streamingUrl: 'https://www.netflix.com/watch/exemplo'
      }
    ];

    it('should generate film suggestions with streaming links', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue(mockFilmData);

      const films = await generator.generateFilmSuggestions(
        'Psicologia Analítica',
        ['inconsciente', 'arquétipos'],
        5,
        'pt-BR'
      );

      expect(films).toHaveLength(2);
      expect(films[0]).toMatchObject({
        id: expect.stringMatching(/^film-\d+-0$/),
        title: 'A Sabedoria dos Sonhos',
        director: 'Stephen Segaller',
        year: 1989,
        type: 'documentary',
        streamingUrl: 'https://www.youtube.com/watch?v=exemplo'
      });

      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Gere 5 sugestões de filmes'),
        expect.objectContaining({
          type: 'array',
          items: expect.objectContaining({
            properties: expect.objectContaining({
              title: { type: 'string' },
              director: { type: 'string' },
              type: expect.objectContaining({
                enum: ['documentary', 'fiction', 'educational', 'biographical']
              })
            })
          })
        }),
        { temperature: 0.7 }
      );
    });

    it('should filter out films without any URL', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue([
        mockFilmData[0],
        {
          title: 'Film Without URL',
          director: 'Director',
          year: 2020,
          type: 'fiction',
          relevance: 'No streaming available'
          // No streamingUrl or trailerUrl
        }
      ]);

      const films = await generator.generateFilmSuggestions(
        'Dreams',
        ['dream analysis'],
        3
      );

      expect(films).toHaveLength(1); // Only film with URL
      expect(films[0].title).toBe('A Sabedoria dos Sonhos');
    });

    it('should handle provider errors for films', async () => {
      mockProvider.generateStructuredResponse.mockRejectedValue(new Error('Provider error'));

      const films = await generator.generateFilmSuggestions(
        'Test',
        ['concept'],
        5
      );

      expect(films).toEqual([]);
    });

    it('should handle non-array film responses', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue({ films: 'not an array' });

      const films = await generator.generateFilmSuggestions(
        'Test',
        ['concept'],
        5
      );

      expect(films).toEqual([]);
    });
  });

  describe('formatCitation', () => {
    const testEntry: BibliographyEntry = {
      id: 'bib-1',
      type: 'book',
      authors: ['Jung, Carl Gustav'],
      title: 'The Red Book',
      year: 2009,
      publisher: 'W. W. Norton & Company',
      url: 'https://example.com',
      abstract: 'Jung\'s personal journal',
      relevance: 'Primary source material',
      jungianConcepts: ['individuation', 'active imagination'],
      readingLevel: 'advanced'
    };

    it('should format APA citation in Portuguese', async () => {
      mockProvider.generateCompletion.mockResolvedValue(
        'Jung, C. G. (2009). O livro vermelho. W. W. Norton & Company.'
      );

      const citation = await generator.formatCitation(testEntry, 'APA', 'pt-BR');

      expect(citation).toBe('Jung, C. G. (2009). O livro vermelho. W. W. Norton & Company.');
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Formate esta entrada bibliográfica no estilo APA'),
        {
          temperature: 0.1,
          maxTokens: 200
        }
      );
    });

    it('should format MLA citation in English', async () => {
      mockProvider.generateCompletion.mockResolvedValue(
        'Jung, Carl Gustav. The Red Book. W. W. Norton & Company, 2009.'
      );

      const citation = await generator.formatCitation(testEntry, 'MLA', 'en');

      expect(citation).toBe('Jung, Carl Gustav. The Red Book. W. W. Norton & Company, 2009.');
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Format this bibliographic entry in MLA style'),
        expect.any(Object)
      );
    });

    it('should include all available fields in prompt', async () => {
      const articleEntry: BibliographyEntry = {
        ...testEntry,
        type: 'article',
        journal: 'Journal of Analytical Psychology',
        volume: '54',
        issue: '3',
        pages: '345-367',
        doi: '10.1111/j.1468-5922.2009.01793.x'
      };

      await generator.formatCitation(articleEntry, 'Chicago');

      // The generator uses Portuguese by default, so check for "Periódico:" instead of "Journal:"
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Periódico: Journal of Analytical Psychology'),
        expect.any(Object)
      );
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('DOI: 10.1111/j.1468-5922.2009.01793.x'),
        expect.any(Object)
      );
    });
  });

  describe('generateAnnotatedBibliography', () => {
    const testEntries: BibliographyEntry[] = [
      {
        id: 'bib-1',
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'Psychology and Alchemy',
        year: 1968,
        publisher: 'Princeton University Press',
        url: 'https://example.com/book1',
        abstract: 'Exploration of alchemical symbolism in psychology',
        relevance: 'Foundational work on symbolic transformation',
        jungianConcepts: ['alchemy', 'transformation', 'symbols'],
        readingLevel: 'advanced'
      },
      {
        id: 'bib-2',
        type: 'article',
        authors: ['Von Franz, Marie-Louise'],
        title: 'The Process of Individuation',
        year: 1964,
        journal: 'Man and His Symbols',
        url: 'https://example.com/article1',
        abstract: 'Overview of the individuation process',
        relevance: 'Clear explanation of core Jungian concept',
        jungianConcepts: ['individuation', 'self', 'wholeness'],
        readingLevel: 'intermediate'
      }
    ];

    it('should generate annotations for bibliography entries', async () => {
      mockProvider.generateCompletion
        .mockResolvedValueOnce('This seminal work explores the rich symbolism of alchemy...')
        .mockResolvedValueOnce('Von Franz provides an accessible introduction to individuation...');

      const annotated = await generator.generateAnnotatedBibliography(
        testEntries,
        ['symbolic transformation', 'individuation process'],
        'en'
      );

      expect(annotated).toHaveLength(2);
      expect(annotated[0]).toEqual({
        entry: testEntries[0],
        annotation: 'This seminal work explores the rich symbolism of alchemy...'
      });
      expect(annotated[1]).toEqual({
        entry: testEntries[1],
        annotation: 'Von Franz provides an accessible introduction to individuation...'
      });

      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(2);
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Write a 150-200 word annotation'),
        {
          temperature: 0.6,
          maxTokens: 300
        }
      );
    });

    it('should include focus areas and access information in prompt', async () => {
      await generator.generateAnnotatedBibliography(
        [testEntries[0]],
        ['dream analysis', 'active imagination'],
        'pt-BR'
      );

      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Áreas de foco para anotação: dream analysis, active imagination'),
        expect.any(Object)
      );
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Mencionar como acessar o recurso'),
        expect.any(Object)
      );
    });
  });

  describe('suggestReadingOrder', () => {
    const testEntries: BibliographyEntry[] = [
      {
        id: 'bib-1',
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'Man and His Symbols',
        year: 1964,
        readingLevel: 'beginner',
        url: 'https://example.com',
        relevance: 'Introductory text',
        jungianConcepts: ['symbols']
      },
      {
        id: 'bib-2',
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'The Red Book',
        year: 2009,
        readingLevel: 'advanced',
        url: 'https://example.com',
        relevance: 'Advanced personal material',
        jungianConcepts: ['individuation']
      },
      {
        id: 'bib-3',
        type: 'video',
        authors: ['BBC'],
        title: 'Jung Documentary',
        year: 1990,
        readingLevel: 'beginner',
        url: 'https://example.com',
        relevance: 'Visual introduction',
        jungianConcepts: ['life story']
      },
      {
        id: 'bib-4',
        type: 'article',
        authors: ['Smith, John'],
        title: 'Jung in Modern Times',
        year: 2020,
        readingLevel: 'intermediate',
        url: 'https://example.com',
        relevance: 'Contemporary application',
        jungianConcepts: ['modern psychology']
      }
    ];

    it('should automatically order by reading level when available', async () => {
      const ordered = await generator.suggestReadingOrder(
        testEntries,
        ['Understand basic concepts', 'Apply to practice']
      );

      expect(ordered).toHaveLength(4);
      // Should be ordered: beginner (older first), intermediate, advanced
      expect(ordered[0].title).toBe('Man and His Symbols'); // beginner, 1964
      expect(ordered[1].title).toBe('Jung Documentary'); // beginner, 1990
      expect(ordered[2].title).toBe('Jung in Modern Times'); // intermediate
      expect(ordered[3].title).toBe('The Red Book'); // advanced
    });

    it('should use LLM ordering when reading levels are missing', async () => {
      const entriesWithoutLevels = testEntries.map(e => ({
        ...e,
        readingLevel: undefined
      }));

      mockProvider.generateStructuredResponse.mockResolvedValue([3, 1, 4, 2]);

      const ordered = await generator.suggestReadingOrder(
        entriesWithoutLevels,
        ['Start with basics', 'Build to advanced']
      );

      expect(ordered).toHaveLength(4);
      expect(ordered[0]).toBe(entriesWithoutLevels[2]); // Index 3 -> position 0
      expect(ordered[1]).toBe(entriesWithoutLevels[0]); // Index 1 -> position 1
      expect(ordered[2]).toBe(entriesWithoutLevels[3]); // Index 4 -> position 2
      expect(ordered[3]).toBe(entriesWithoutLevels[1]); // Index 2 -> position 3
    });

    it('should handle invalid indices in LLM response', async () => {
      const entries = testEntries.slice(0, 2);
      mockProvider.generateStructuredResponse.mockResolvedValue([1, 5, 2]); // 5 is out of bounds

      const ordered = await generator.suggestReadingOrder(
        entries.map(e => ({ ...e, readingLevel: undefined })),
        ['Test objective']
      );

      expect(ordered).toHaveLength(2); // Only valid indices used
    });

    it('should return original order on LLM error', async () => {
      const entries = testEntries.slice(0, 2).map(e => ({ ...e, readingLevel: undefined }));
      mockProvider.generateStructuredResponse.mockRejectedValue(new Error('LLM error'));

      const ordered = await generator.suggestReadingOrder(
        entries,
        ['Test objective']
      );

      expect(ordered).toEqual(entries);
    });

    it('should handle non-array order response', async () => {
      const entries = testEntries.slice(0, 2).map(e => ({ ...e, readingLevel: undefined }));
      mockProvider.generateStructuredResponse.mockResolvedValue({ order: [1, 2] });

      const ordered = await generator.suggestReadingOrder(
        entries,
        ['Test objective']
      );

      expect(ordered).toEqual(entries); // Returns original order
    });
  });
});