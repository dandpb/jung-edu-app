import { BibliographyGenerator, BibliographyEntry } from '../bibliography-generator';
import { ILLMProvider, LLMResponse, LLMGenerationOptions } from '../../types';

// Mock provider for testing
class MockBibliographyProvider implements ILLLProvider {
  private shouldFail: boolean = false;
  private delay: number = 0;
  private mockResponse: any = null;

  constructor() {}

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  setMockResponse(response: any): void {
    this.mockResponse = response;
  }

  async generateCompletion(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mock provider error for testing');
    }

    let content = 'Mock citation formatted properly';
    
    if (prompt.includes('APA')) {
      content = 'Jung, C. G. (2016). O Homem e Seus Símbolos. Nova Fronteira.';
    } else if (prompt.includes('MLA')) {
      content = 'Jung, Carl Gustav. O Homem e Seus Símbolos. Nova Fronteira, 2016.';
    } else if (prompt.includes('Chicago')) {
      content = 'Jung, Carl Gustav. O Homem e Seus Símbolos. São Paulo: Nova Fronteira, 2016.';
    } else if (prompt.includes('anotação')) {
      content = 'Esta é uma obra fundamental de Jung que apresenta os conceitos básicos da psicologia analítica de forma acessível ao público geral. O livro explora arquétipos, inconsciente coletivo e símbolos através de uma abordagem didática e ilustrada.';
    }

    return {
      content,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(content.length / 4),
        totalTokens: Math.ceil((prompt.length + content.length) / 4)
      }
    };
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: any,
    options?: LLMGenerationOptions
  ): Promise<T> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mock provider error for testing');
    }

    if (this.mockResponse) {
      return this.mockResponse as T;
    }

    // Generate appropriate mock response based on prompt content
    if (prompt.includes('recursos educacionais') || prompt.includes('educational resources')) {
      return this.generateMockBibliography(prompt) as T;
    } else if (prompt.includes('filmes') || prompt.includes('film')) {
      return this.generateMockFilms(prompt) as T;
    } else if (prompt.includes('ordem') || prompt.includes('order')) {
      return this.generateMockOrder(prompt) as T;
    }

    return [] as T;
  }

  getTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail;
  }

  private generateMockBibliography(prompt: string): any[] {
    const countMatch = prompt.match(/(\d+) recursos|Generate (\d+) educational/);
    const count = countMatch ? parseInt(countMatch[1] || countMatch[2]) : 3;

    const entries = [];
    for (let i = 0; i < count; i++) {
      entries.push({
        type: i % 3 === 0 ? 'book' : i % 3 === 1 ? 'article' : 'video',
        authors: [`Author ${i + 1}`, `Co-Author ${i + 1}`],
        title: `Test Resource ${i + 1}: Jung and Psychology`,
        year: 2020 + i,
        publisher: `Publisher ${i + 1}`,
        url: `https://example.com/resource-${i + 1}`,
        abstract: `This is a comprehensive resource about Jungian psychology focusing on key concepts and practical applications.`,
        relevance: `Highly relevant for understanding foundational concepts in analytical psychology.`,
        jungianConcepts: ['collective unconscious', 'archetypes', 'individuation'],
        readingLevel: i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced'
      });
    }

    return entries;
  }

  private generateMockFilms(prompt: string): any[] {
    const countMatch = prompt.match(/(\d+) sugestões|Generate (\d+) film/);
    const count = countMatch ? parseInt(countMatch[1] || countMatch[2]) : 2;

    const films = [];
    for (let i = 0; i < count; i++) {
      films.push({
        title: `Documentary ${i + 1}: Jung's Life`,
        director: `Director ${i + 1}`,
        year: 1990 + i * 5,
        type: i % 2 === 0 ? 'documentary' : 'educational',
        relevance: `Essential viewing for understanding Jung's biographical context and key concepts.`,
        streamingUrl: `https://youtube.com/watch?v=example${i + 1}`,
        trailerUrl: `https://youtube.com/watch?v=trailer${i + 1}`
      });
    }

    return films;
  }

  private generateMockOrder(prompt: string): number[] {
    // Extract entry count from prompt
    const entries = prompt.match(/\d+\./g);
    const count = entries ? entries.length : 5;
    
    // Generate a shuffled order
    const order = Array.from({length: count}, (_, i) => i + 1);
    return order.sort(() => Math.random() - 0.5);
  }
}

describe('BibliographyGenerator', () => {
  let generator: BibliographyGenerator;
  let mockProvider: MockBibliographyProvider;

  beforeEach(() => {
    mockProvider = new MockBibliographyProvider();
    generator = new BibliographyGenerator(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBibliography', () => {
    it('should generate bibliography with default parameters', async () => {
      const topic = 'Arquétipos Junguianos';
      const concepts = ['anima', 'animus', 'sombra'];

      const result = await generator.generateBibliography(topic, concepts);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3); // Default mock count
      
      result.forEach(entry => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('authors');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('year');
        expect(entry).toHaveProperty('url');
        expect(entry).toHaveProperty('relevance');
        expect(entry).toHaveProperty('jungianConcepts');
        expect(entry.id).toMatch(/^bib-\d+-\d+$/);
      });
    });

    it('should handle custom count parameter', async () => {
      const topic = 'Individuação';
      const concepts = ['processo', 'desenvolvimento'];
      const count = 5;

      mockProvider.setMockResponse([
        {
          type: 'book',
          authors: ['Jung, C.G.'],
          title: 'Test Book',
          year: 2020,
          url: 'https://example.com',
          relevance: 'Test relevance',
          jungianConcepts: ['concept1']
        },
        {
          type: 'article',
          authors: ['Author, A.'],
          title: 'Test Article',
          year: 2021,
          url: 'https://example.com/article',
          relevance: 'Test relevance',
          jungianConcepts: ['concept2']
        }
      ]);

      const result = await generator.generateBibliography(topic, concepts, 'intermediate', count);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2); // Based on mock response
    });

    it('should handle different difficulty levels', async () => {
      const topic = 'Psicologia Analítica';
      const concepts = ['análise', 'terapia'];

      // Test introductory level
      let result = await generator.generateBibliography(topic, concepts, 'introductory');
      expect(result[0].readingLevel).toBe('beginner');

      // Test advanced level  
      result = await generator.generateBibliography(topic, concepts, 'advanced');
      expect(result[0].readingLevel).toBe('advanced');
    });

    it('should handle English language prompts', async () => {
      const topic = 'Jungian Archetypes';
      const concepts = ['shadow', 'anima', 'self'];
      const language = 'en';

      const result = await generator.generateBibliography(topic, concepts, 'intermediate', 2, language);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle provider errors gracefully', async () => {
      const topic = 'Error Test';
      const concepts = ['test'];
      
      mockProvider.setShouldFail(true);

      const result = await generator.generateBibliography(topic, concepts);

      expect(result).toEqual([]);
    });

    it('should handle invalid response format', async () => {
      const topic = 'Invalid Format Test';
      const concepts = ['test'];
      
      mockProvider.setMockResponse('invalid string response');

      const result = await generator.generateBibliography(topic, concepts);

      expect(result).toEqual([]);
    });

    it('should handle string entries in response', async () => {
      const topic = 'String Entry Test';
      const concepts = ['test'];
      
      mockProvider.setMockResponse([
        'Invalid string entry',
        {
          type: 'book',
          authors: ['Valid Author'],
          title: 'Valid Entry',
          year: 2020,
          url: 'https://example.com',
          relevance: 'Valid',
          jungianConcepts: ['concept']
        }
      ]);

      const result = await generator.generateBibliography(topic, concepts);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Invalid string entry');
      expect(result[0].authors).toEqual(['Unknown']);
      expect(result[1].title).toBe('Valid Entry');
    });

    it('should set reading level based on difficulty parameter', async () => {
      const topic = 'Reading Level Test';
      const concepts = ['test'];
      
      mockProvider.setMockResponse([{
        type: 'book',
        authors: ['Author'],
        title: 'Test',
        year: 2020,
        url: 'https://example.com',
        relevance: 'Test',
        jungianConcepts: ['concept']
        // No readingLevel in response
      }]);

      const result = await generator.generateBibliography(topic, concepts, 'advanced');

      expect(result[0].readingLevel).toBe('advanced');
    });

    it('should handle missing optional fields gracefully', async () => {
      const topic = 'Minimal Entry Test';
      const concepts = ['test'];
      
      mockProvider.setMockResponse([{
        type: 'book',
        authors: ['Author'],
        title: 'Minimal Test',
        year: 2020,
        url: 'https://example.com',
        relevance: 'Test',
        jungianConcepts: ['concept']
        // Missing optional fields like publisher, abstract, etc.
      }]);

      const result = await generator.generateBibliography(topic, concepts);

      expect(result[0]).toHaveProperty('title', 'Minimal Test');
      expect(result[0]).toHaveProperty('publisher', undefined);
      expect(result[0]).toHaveProperty('abstract', undefined);
    });

    it('should generate unique IDs for entries', async () => {
      const topic = 'ID Test';
      const concepts = ['test'];
      
      const result = await generator.generateBibliography(topic, concepts);

      const ids = result.map(entry => entry.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('generateFilmSuggestions', () => {
    it('should generate film suggestions with default parameters', async () => {
      const topic = 'Símbolos em Jung';
      const concepts = ['símbolos', 'sonhos'];

      const result = await generator.generateFilmSuggestions(topic, concepts);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(film => {
        expect(film).toHaveProperty('id');
        expect(film).toHaveProperty('title');
        expect(film).toHaveProperty('director');
        expect(film).toHaveProperty('year');
        expect(film).toHaveProperty('type');
        expect(film).toHaveProperty('relevance');
        expect(film.id).toMatch(/^film-\d+-\d+$/);
        expect(['documentary', 'fiction', 'educational', 'biographical']).toContain(film.type);
      });
    });

    it('should handle custom count parameter', async () => {
      const topic = 'Jung Documentaries';
      const concepts = ['biography', 'psychology'];
      const count = 3;

      const result = await generator.generateFilmSuggestions(topic, concepts, count);

      expect(result.length).toBeLessThanOrEqual(count);
    });

    it('should handle English language prompts', async () => {
      const topic = 'Jungian Films';
      const concepts = ['psychology', 'documentaries'];
      const language = 'en';

      const result = await generator.generateFilmSuggestions(topic, concepts, 2, language);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter out films without streaming URLs', async () => {
      const topic = 'Filter Test';
      const concepts = ['test'];
      
      mockProvider.setMockResponse([
        {
          title: 'Film with URL',
          director: 'Director 1',
          year: 2020,
          type: 'documentary',
          relevance: 'Test',
          streamingUrl: 'https://youtube.com/watch1'
        },
        {
          title: 'Film without URL',
          director: 'Director 2', 
          year: 2021,
          type: 'educational',
          relevance: 'Test'
          // No streamingUrl or trailerUrl
        },
        {
          title: 'Film with trailer URL',
          director: 'Director 3',
          year: 2022,
          type: 'biographical',
          relevance: 'Test',
          trailerUrl: 'https://youtube.com/trailer'
        }
      ]);

      const result = await generator.generateFilmSuggestions(topic, concepts);

      expect(result).toHaveLength(2); // Only films with URLs
      expect(result.map(f => f.title)).toEqual(['Film with URL', 'Film with trailer URL']);
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.setShouldFail(true);

      const result = await generator.generateFilmSuggestions('Error Test', ['test']);

      expect(result).toEqual([]);
    });

    it('should handle invalid response format', async () => {
      mockProvider.setMockResponse('invalid response');

      const result = await generator.generateFilmSuggestions('Invalid Test', ['test']);

      expect(result).toEqual([]);
    });
  });

  describe('formatCitation', () => {
    const sampleEntry: BibliographyEntry = {
      id: 'test-1',
      type: 'book',
      authors: ['Jung, Carl Gustav'],
      title: 'O Homem e Seus Símbolos',
      year: 2016,
      publisher: 'Nova Fronteira',
      url: 'https://example.com',
      relevance: 'Fundamental work',
      jungianConcepts: ['archetypes', 'symbols'],
      readingLevel: 'beginner'
    };

    it('should format citation in APA style (default)', async () => {
      const result = await generator.formatCitation(sampleEntry);

      expect(result).toContain('Jung, C. G. (2016)');
      expect(result).toContain('Nova Fronteira');
    });

    it('should format citation in MLA style', async () => {
      const result = await generator.formatCitation(sampleEntry, 'MLA');

      expect(result).toContain('Jung, Carl Gustav');
      expect(result).toContain('Nova Fronteira, 2016');
    });

    it('should format citation in Chicago style', async () => {
      const result = await generator.formatCitation(sampleEntry, 'Chicago');

      expect(result).toContain('Jung, Carl Gustav');
      expect(result).toContain('Nova Fronteira, 2016');
    });

    it('should handle English language formatting', async () => {
      const result = await generator.formatCitation(sampleEntry, 'APA', 'en');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle entries with additional fields', async () => {
      const articleEntry: BibliographyEntry = {
        ...sampleEntry,
        type: 'article',
        journal: 'Journal of Psychology',
        volume: '10',
        issue: '2',
        pages: '45-67',
        doi: '10.1234/example.doi'
      };

      const result = await generator.formatCitation(articleEntry);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.formatCitation(sampleEntry))
        .rejects.toThrow('Mock provider error for testing');
    });
  });

  describe('generateAnnotatedBibliography', () => {
    const sampleEntries: BibliographyEntry[] = [
      {
        id: 'test-1',
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'Memories, Dreams, Reflections',
        year: 1961,
        publisher: 'Vintage Books',
        url: 'https://example.com/memories',
        abstract: 'Jung\'s autobiographical work providing insight into his personal journey and psychological discoveries.',
        relevance: 'Essential autobiographical text revealing Jung\'s personal psychological development.',
        jungianConcepts: ['individuation', 'personal unconscious', 'dreams'],
        readingLevel: 'intermediate'
      },
      {
        id: 'test-2',
        type: 'article',
        authors: ['Stevens, Anthony'],
        title: 'Jung and Freud: A Comparative Analysis',
        year: 1990,
        journal: 'Journal of Analytical Psychology',
        url: 'https://example.com/article',
        abstract: 'Comparative study examining the theoretical differences between Jung and Freud.',
        relevance: 'Important scholarly comparison highlighting key theoretical distinctions.',
        jungianConcepts: ['collective unconscious', 'analytical psychology'],
        readingLevel: 'advanced'
      }
    ];

    it('should generate annotations for bibliography entries', async () => {
      const focusAreas = ['individuation', 'dream analysis', 'therapeutic applications'];

      const result = await generator.generateAnnotatedBibliography(sampleEntries, focusAreas);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('entry');
      expect(result[0]).toHaveProperty('annotation');
      expect(result[0].entry).toEqual(sampleEntries[0]);
      expect(result[0].annotation).toBeTruthy();
      expect(typeof result[0].annotation).toBe('string');
    });

    it('should handle English language annotations', async () => {
      const focusAreas = ['individuation', 'dream analysis'];
      const language = 'en';

      const result = await generator.generateAnnotatedBibliography(sampleEntries, focusAreas, language);

      expect(result).toHaveLength(2);
      result.forEach(item => {
        expect(item).toHaveProperty('entry');
        expect(item).toHaveProperty('annotation');
        expect(typeof item.annotation).toBe('string');
      });
    });

    it('should handle empty entries array', async () => {
      const result = await generator.generateAnnotatedBibliography([], ['test']);

      expect(result).toEqual([]);
    });

    it('should handle provider errors during annotation generation', async () => {
      mockProvider.setShouldFail(true);

      await expect(generator.generateAnnotatedBibliography(sampleEntries, ['test']))
        .rejects.toThrow('Mock provider error for testing');
    });

    it('should include entry information in annotation prompt', async () => {
      const focusAreas = ['psychological theory'];

      // Spy on generateCompletion to verify prompt content
      const spy = jest.spyOn(mockProvider, 'generateCompletion');

      await generator.generateAnnotatedBibliography([sampleEntries[0]], focusAreas);

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Memories, Dreams, Reflections'),
        expect.any(Object)
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Jung, Carl Gustav'),
        expect.any(Object)
      );
    });
  });

  describe('suggestReadingOrder', () => {
    const sampleEntries: BibliographyEntry[] = [
      {
        id: 'entry-1',
        type: 'book',
        authors: ['Jung, C.G.'],
        title: 'Man and His Symbols',
        year: 1964,
        readingLevel: 'beginner',
        url: 'https://example.com',
        relevance: 'Introductory work',
        jungianConcepts: ['symbols']
      },
      {
        id: 'entry-2', 
        type: 'book',
        authors: ['Jung, C.G.'],
        title: 'The Archetypes and the Collective Unconscious',
        year: 1959,
        readingLevel: 'advanced',
        url: 'https://example.com',
        relevance: 'Advanced theoretical work',
        jungianConcepts: ['archetypes']
      },
      {
        id: 'entry-3',
        type: 'article',
        authors: ['Modern Author'],
        title: 'Contemporary Jung',
        year: 2020,
        readingLevel: 'intermediate',
        url: 'https://example.com',
        relevance: 'Modern perspective',
        jungianConcepts: ['modern applications']
      }
    ];

    it('should automatically order entries with reading levels', async () => {
      const learningObjectives = ['Understand basic concepts', 'Apply advanced theory'];

      const result = await generator.suggestReadingOrder(sampleEntries, learningObjectives);

      expect(result).toHaveLength(3);
      expect(result[0].readingLevel).toBe('beginner');
      expect(result[1].readingLevel).toBe('intermediate');
      expect(result[2].readingLevel).toBe('advanced');
    });

    it('should order by year within same reading level', async () => {
      const entriesWithSameLevel: BibliographyEntry[] = [
        {
          id: 'newer',
          type: 'book',
          authors: ['Author'],
          title: 'Newer Book',
          year: 2000,
          readingLevel: 'beginner',
          url: 'https://example.com',
          relevance: 'Test',
          jungianConcepts: ['test']
        },
        {
          id: 'older',
          type: 'book',
          authors: ['Author'],
          title: 'Older Book', 
          year: 1980,
          readingLevel: 'beginner',
          url: 'https://example.com',
          relevance: 'Test',
          jungianConcepts: ['test']
        }
      ];

      const result = await generator.suggestReadingOrder(entriesWithSameLevel, ['test']);

      expect(result[0].year).toBe(1980); // Older foundational text first
      expect(result[1].year).toBe(2000);
    });

    it('should use LLM when entries lack reading levels', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));

      mockProvider.setMockResponse([2, 1, 3]); // Mock ordering

      const result = await generator.suggestReadingOrder(
        entriesWithoutLevels, 
        ['Understand Jung', 'Apply concepts']
      );

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('entry-2');
      expect(result[1].id).toBe('entry-1');
      expect(result[2].id).toBe('entry-3');
    });

    it('should handle Portuguese language prompts', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));
      const learningObjectives = ['Entender conceitos básicos', 'Aplicar teoria avançada'];
      const language = 'pt-BR';

      mockProvider.setMockResponse([1, 2, 3]);

      const result = await generator.suggestReadingOrder(
        entriesWithoutLevels, 
        learningObjectives,
        language
      );

      expect(result).toHaveLength(3);
    });

    it('should handle provider errors gracefully', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));

      mockProvider.setShouldFail(true);

      const result = await generator.suggestReadingOrder(entriesWithoutLevels, ['test']);

      expect(result).toEqual(entriesWithoutLevels); // Returns original order
    });

    it('should handle invalid order response', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));

      mockProvider.setMockResponse('invalid order response');

      const result = await generator.suggestReadingOrder(entriesWithoutLevels, ['test']);

      expect(result).toEqual(entriesWithoutLevels); // Returns original order
    });

    it('should filter out invalid indices from order', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));

      // Mock response with some invalid indices
      mockProvider.setMockResponse([1, 5, 2, -1, 3, 10]);

      const result = await generator.suggestReadingOrder(entriesWithoutLevels, ['test']);

      expect(result).toHaveLength(3); // Only valid indices
    });

    it('should handle empty entries array', async () => {
      const result = await generator.suggestReadingOrder([], ['test']);

      expect(result).toEqual([]);
    });

    it('should include learning objectives in LLM prompt', async () => {
      const entriesWithoutLevels = sampleEntries.map(entry => ({
        ...entry,
        readingLevel: undefined
      }));
      const objectives = ['Master Jungian theory', 'Apply in therapy'];

      const spy = jest.spyOn(mockProvider, 'generateStructuredOutput');
      mockProvider.setMockResponse([1, 2, 3]);

      await generator.suggestReadingOrder(entriesWithoutLevels, objectives);

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Master Jungian theory'),
        expect.any(Object),
        expect.any(Object)
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Apply in therapy'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockProvider.setDelay(1000); // Long delay to simulate timeout
      mockProvider.setShouldFail(false);

      // Set a short timeout for this test
      jest.setTimeout(500);

      const startTime = Date.now();
      const result = await generator.generateBibliography('test', ['concept']);
      const duration = Date.now() - startTime;

      // Should complete eventually, even with delay
      expect(result).toBeInstanceOf(Array);
      expect(duration).toBeGreaterThan(500);
    }, 2000);

    it('should handle malformed JSON in structured responses', async () => {
      // Mock a provider that returns malformed JSON
      const malformedProvider = {
        ...mockProvider,
        generateStructuredOutput: jest.fn().mockImplementation(async () => {
          throw new Error('JSON parse error: Unexpected token');
        })
      };

      const malformedGenerator = new BibliographyGenerator(malformedProvider as any);

      const result = await malformedGenerator.generateBibliography('test', ['concept']);

      expect(result).toEqual([]);
    });

    it('should handle provider unavailability', async () => {
      const unavailableProvider = {
        ...mockProvider,
        isAvailable: jest.fn().mockResolvedValue(false),
        generateStructuredOutput: jest.fn().mockRejectedValue(new Error('Provider unavailable'))
      };

      const unavailableGenerator = new BibliographyGenerator(unavailableProvider as any);

      const result = await unavailableGenerator.generateBibliography('test', ['concept']);

      expect(result).toEqual([]);
    });

    it('should validate input parameters', async () => {
      // Test with empty topic
      let result = await generator.generateBibliography('', ['concept']);
      expect(result).toBeInstanceOf(Array);

      // Test with empty concepts array
      result = await generator.generateBibliography('topic', []);
      expect(result).toBeInstanceOf(Array);

      // Test with very large count
      result = await generator.generateBibliography('topic', ['concept'], 'intermediate', 1000);
      expect(result).toBeInstanceOf(Array);
    });

    it('should handle special characters in inputs', async () => {
      const topic = 'Jung & Freud: A "Complex" Relationship (1900-1913)';
      const concepts = ['öûa', 'ção', 'François', 'naïve'];

      const result = await generator.generateBibliography(topic, concepts);

      expect(result).toBeInstanceOf(Array);
    });

    it('should handle rate limiting scenarios', async () => {
      // Simulate rate limiting by having multiple rapid calls
      const promises = Array.from({length: 5}, (_, i) => 
        generator.generateBibliography(`topic-${i}`, [`concept-${i}`])
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Array);
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large bibliography requests efficiently', async () => {
      const startTime = Date.now();
      const largeCount = 50;

      const result = await generator.generateBibliography(
        'Large Bibliography Test',
        ['concept1', 'concept2', 'concept3'],
        'intermediate',
        largeCount
      );

      const duration = Date.now() - startTime;

      expect(result).toBeInstanceOf(Array);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should not leak memory with repeated calls', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make multiple calls
      for (let i = 0; i < 10; i++) {
        await generator.generateBibliography(`test-${i}`, [`concept-${i}`]);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle concurrent bibliography generations', async () => {
      const concurrentCount = 3;
      const promises = Array.from({length: concurrentCount}, (_, i) =>
        generator.generateBibliography(
          `Concurrent Topic ${i}`,
          [`concept-${i}`],
          'intermediate',
          3
        )
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentCount);
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        // Each result should have unique IDs
        const ids = result.map(entry => entry.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a complete bibliography workflow', async () => {
      const topic = 'Jungian Dream Analysis';
      const concepts = ['dreams', 'symbols', 'unconscious', 'interpretation'];
      const focusAreas = ['therapeutic application', 'symbol interpretation'];
      const learningObjectives = ['Understand dream theory', 'Apply interpretation techniques'];

      // Step 1: Generate bibliography
      const bibliography = await generator.generateBibliography(topic, concepts, 'intermediate', 5);
      expect(bibliography.length).toBeGreaterThan(0);

      // Step 2: Format citations
      const firstEntry = bibliography[0];
      const citation = await generator.formatCitation(firstEntry, 'APA');
      expect(citation).toBeTruthy();

      // Step 3: Generate annotated bibliography
      const annotated = await generator.generateAnnotatedBibliography(
        bibliography.slice(0, 2), 
        focusAreas
      );
      expect(annotated.length).toBe(2);

      // Step 4: Suggest reading order
      const orderedEntries = await generator.suggestReadingOrder(bibliography, learningObjectives);
      expect(orderedEntries.length).toBe(bibliography.length);

      // Step 5: Generate film suggestions
      const films = await generator.generateFilmSuggestions(topic, concepts, 3);
      expect(films.length).toBeGreaterThan(0);
    });

    it('should maintain consistency across multiple calls', async () => {
      const topic = 'Consistency Test';
      const concepts = ['test1', 'test2'];

      // Make multiple calls with same parameters
      const result1 = await generator.generateBibliography(topic, concepts, 'intermediate', 3);
      const result2 = await generator.generateBibliography(topic, concepts, 'intermediate', 3);

      // Results should have same structure even if content differs
      expect(result1.length).toBe(result2.length);
      
      result1.forEach((entry, index) => {
        expect(typeof entry.id).toBe('string');
        expect(typeof entry.title).toBe('string');
        expect(Array.isArray(entry.authors)).toBe(true);
        expect(typeof entry.year).toBe('number');
        expect(typeof entry.url).toBe('string');
        
        expect(typeof result2[index].id).toBe('string');
        expect(typeof result2[index].title).toBe('string');
        expect(Array.isArray(result2[index].authors)).toBe(true);
        expect(typeof result2[index].year).toBe('number');
        expect(typeof result2[index].url).toBe('string');
      });
    });
  });
});